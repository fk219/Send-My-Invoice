/**
 * Clarity Invoice — SaaS API and static host.
 *
 * One Node process serves the Vite build and the JSON API. Postgres is the
 * source of truth; every business query is scoped to the session user.
 */
import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import { Pool } from "pg";
import { z } from "zod";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PORT = Number(process.env.PORT || 8787);
const APP_URL = (process.env.APP_URL || `http://localhost:${PORT}`).replace(/\/+$/, "");
const COOKIE = "clarity_session";
const SESSION_DAYS = 30;
const IS_PROD = process.env.NODE_ENV === "production";
const SECURE_COOKIE = APP_URL.startsWith("https://");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: /sslmode=require|neon\.tech|render\.com|supabase\.co/.test(connectionString)
    ? { rejectUnauthorized: false }
    : undefined,
  max: 10,
});

const app = express();
app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);
app.use(express.json({ limit: "6mb" }));
app.use(cookieParser());

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

const asyncRoute = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

function hashToken(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function randomToken() {
  return crypto.randomBytes(32).toString("base64url");
}

function isoDate(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

/** Server-side invoice totals. Mirrors services/invoiceMath.ts. */
function summarizeInvoice(invoice) {
  const items = Array.isArray(invoice.items) ? invoice.items : [];
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0),
    0,
  );
  const taxableSubtotal = items.reduce((sum, item) => {
    const taxable = item.taxable !== false;
    return sum + (taxable ? Number(item.quantity || 0) * Number(item.unitPrice || 0) : 0);
  }, 0);
  const discountAmount =
    invoice.discountType === "percent"
      ? subtotal * (Number(invoice.discountValue || 0) / 100)
      : Number(invoice.discountValue || 0);
  const discountRatio = subtotal > 0 ? discountAmount / subtotal : 0;
  const taxableAfterDiscount = taxableSubtotal * (1 - discountRatio);
  const taxAmount =
    invoice.taxType === "percent"
      ? taxableAfterDiscount * (Number(invoice.taxValue || 0) / 100)
      : Number(invoice.taxValue || 0);
  const shipping = Number(invoice.shipping || 0);
  const total = roundMoney(subtotal - discountAmount + taxAmount + shipping);
  const amountPaid = Number(invoice.amountPaid || 0);
  return { total, balance: roundMoney(total - amountPaid) };
}

function error(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function uniqueViolation(e) {
  return e?.code === "23505" || /duplicate key|unique constraint/i.test(String(e?.message || ""));
}

function invoiceConflict(e) {
  const text = `${e?.constraint || ""} ${e?.message || ""}`;
  if (/pkey/i.test(text)) return error(409, "An invoice with that id already exists.");
  return error(409, "That invoice number is already used.");
}

function assertSameOrigin(req) {
  const origin = req.get("origin");
  if (!origin) return;
  const allowed = new Set([APP_URL, `${req.protocol}://${req.get("host")}`]);
  if (!allowed.has(origin)) throw error(403, "Invalid request origin");
}

async function createSession(req, res, userId) {
  const raw = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await pool.query(
    `insert into sessions (id, user_id, token_hash, user_agent, ip, expires_at)
     values ($1,$2,$3,$4,$5,$6)`,
    [
      crypto.randomUUID(),
      userId,
      hashToken(raw),
      String(req.get("user-agent") || "").slice(0, 300),
      String(req.ip || "").slice(0, 80),
      expiresAt,
    ],
  );
  res.cookie(COOKIE, raw, {
    httpOnly: true,
    sameSite: "lax",
    secure: SECURE_COOKIE,
    maxAge: SESSION_DAYS * 86_400_000,
    path: "/",
  });
}

async function currentUser(req) {
  const raw = req.cookies?.[COOKIE];
  if (!raw || typeof raw !== "string") return null;
  const { rows } = await pool.query(
    `select u.id, u.email, u.name, s.id as session_id
     from sessions s
     join users u on u.id = s.user_id
     where s.token_hash = $1 and s.expires_at > now()
     limit 1`,
    [hashToken(raw)],
  );
  return rows[0] ?? null;
}

const requireAuth = asyncRoute(async (req, res, next) => {
  const user = await currentUser(req);
  if (!user) return res.status(401).json({ error: "Sign in first." });
  req.user = user;
  next();
});

/* ------------------------------------------------------------------ */
/* Validation                                                         */
/* ------------------------------------------------------------------ */

const Signup = z.object({
  name: z.string().trim().min(2, "Tell us your name.").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email.").max(200),
  password: z.string().min(10, "Use at least 10 characters.").max(200),
});

const Login = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  password: z.string().min(1).max(200),
});

const ClientInput = z.object({
  name: z.string().trim().min(1, "Client name is required.").max(160),
  email: z.string().trim().toLowerCase().email("Enter a valid email.").max(200),
  address: z.string().trim().max(500).default(""),
});

const LineItem = z
  .object({
    id: z.string().min(1).max(100),
    description: z.string().max(300).default(""),
    details: z.string().max(1000).optional(),
    quantity: z.number().finite().min(0).max(1_000_000),
    unitPrice: z.number().finite().min(-1_000_000_000).max(1_000_000_000),
    taxable: z.boolean().optional(),
  })
  .passthrough();

const InvoiceInput = z
  .object({
    id: z.string().min(1).max(100),
    number: z.string().min(1).max(80),
    clientId: z.string().max(100).optional().default(""),
    issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    status: z.enum(["draft", "sent", "paid", "overdue", "partial"]).default("draft"),
    currency: z.string().min(1).max(8).default("USD"),
    items: z.array(LineItem).min(1).max(200),
    taxType: z.enum(["percent", "amount"]).optional().default("percent"),
    taxValue: z.number().finite().optional().default(0),
    discountType: z.enum(["percent", "amount"]).optional().default("percent"),
    discountValue: z.number().finite().optional().default(0),
    shipping: z.number().finite().optional().default(0),
    amountPaid: z.number().finite().optional().default(0),
    template: z.string().max(40).optional(),
    layout: z.enum(["portrait", "landscape"]).optional(),
    paymentLink: z.string().max(2000).optional(),
    notes: z.string().max(2000).optional(),
    terms: z.string().max(2000).optional(),
    poNumber: z.string().max(120).optional(),
    labels: z.record(z.string(), z.string()).optional(),
  })
  .passthrough();

const ProfileInput = z.record(z.string(), z.unknown());

function parse(schema, value) {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw error(400, result.error.issues[0]?.message || "Invalid request.");
  }
  return result.data;
}

function defaultProfile(user) {
  return {
    id: user.id,
    name: user.name || "",
    email: user.email,
    address: "",
    logoUrl: "",
    brandColor: "#4f46e5",
    currency: "USD",
    defaultPaymentLink: "",
    invoiceFormat: "INV-{YYYY}-{NNNN}",
    fontFamily: "sans",
    website: "",
  };
}

/* ------------------------------------------------------------------ */
/* Auth                                                               */
/* ------------------------------------------------------------------ */

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 40,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

app.get(
  "/api/auth/me",
  asyncRoute(async (req, res) => {
    const user = await currentUser(req);
    if (!user) return res.status(401).json({ error: "Not signed in." });
    res.json({ user: { id: user.id, email: user.email, name: user.name } });
  }),
);

app.post(
  "/api/auth/signup",
  authLimiter,
  asyncRoute(async (req, res) => {
    assertSameOrigin(req);
    const input = parse(Signup, req.body);
    const existing = await pool.query("select 1 from users where email = $1", [input.email]);
    if (existing.rowCount) throw error(409, "An account with that email already exists.");

    const user = { id: crypto.randomUUID(), email: input.email, name: input.name };
    const passwordHash = await bcrypt.hash(input.password, 12);

    const client = await pool.connect();
    try {
      await client.query("begin");
      await client.query(
        "insert into users (id, email, password_hash, name) values ($1,$2,$3,$4)",
        [user.id, user.email, passwordHash, user.name],
      );
      const profile = defaultProfile(user);
      await client.query("insert into profiles (user_id, data) values ($1,$2)", [
        user.id,
        JSON.stringify(profile),
      ]);
      await client.query("commit");
    } catch (e) {
      await client.query("rollback").catch(() => {});
      if (uniqueViolation(e)) throw error(409, "An account with that email already exists.");
      throw e;
    } finally {
      client.release();
    }

    await createSession(req, res, user.id);
    res.status(201).json({ user });
  }),
);

app.post(
  "/api/auth/login",
  authLimiter,
  asyncRoute(async (req, res) => {
    assertSameOrigin(req);
    const input = parse(Login, req.body);
    const { rows } = await pool.query(
      "select id, email, name, password_hash from users where email = $1 limit 1",
      [input.email],
    );
    const user = rows[0];
    if (!user || !(await bcrypt.compare(input.password, user.password_hash))) {
      throw error(401, "Email or password is incorrect.");
    }
    await pool.query("delete from sessions where expires_at < now()");
    await createSession(req, res, user.id);
    res.json({ user: { id: user.id, email: user.email, name: user.name } });
  }),
);

app.post(
  "/api/auth/logout",
  asyncRoute(async (req, res) => {
    assertSameOrigin(req);
    const raw = req.cookies?.[COOKIE];
    if (raw) await pool.query("delete from sessions where token_hash = $1", [hashToken(raw)]);
    res.clearCookie(COOKIE, { path: "/" });
    res.json({ ok: true });
  }),
);

/* ------------------------------------------------------------------ */
/* Workspace                                                          */
/* ------------------------------------------------------------------ */

app.get(
  "/api/bootstrap",
  requireAuth,
  asyncRoute(async (req, res) => {
    const [profile, clients, invoices] = await Promise.all([
      pool.query("select data from profiles where user_id = $1", [req.user.id]),
      pool.query(
        "select id, name, email, address from clients where user_id = $1 order by created_at asc",
        [req.user.id],
      ),
      pool.query(
        "select data from invoices where user_id = $1 order by created_at desc",
        [req.user.id],
      ),
    ]);
    res.json({
      user: { id: req.user.id, email: req.user.email, name: req.user.name },
      profile: profile.rows[0]?.data ?? defaultProfile(req.user),
      clients: clients.rows,
      invoices: invoices.rows.map((row) => row.data),
    });
  }),
);

app.put(
  "/api/profile",
  requireAuth,
  asyncRoute(async (req, res) => {
    assertSameOrigin(req);
    const data = parse(ProfileInput, req.body);
    const next = { ...data, id: req.user.id };
    await pool.query(
      `insert into profiles (user_id, data, updated_at) values ($1,$2,now())
       on conflict (user_id) do update set data = excluded.data, updated_at = now()`,
      [req.user.id, JSON.stringify(next)],
    );
    res.json({ profile: next });
  }),
);

/* ------------------------------------------------------------------ */
/* Clients                                                            */
/* ------------------------------------------------------------------ */

app.get(
  "/api/clients",
  requireAuth,
  asyncRoute(async (req, res) => {
    const { rows } = await pool.query(
      "select id, name, email, address from clients where user_id = $1 order by created_at asc",
      [req.user.id],
    );
    res.json({ clients: rows });
  }),
);

app.post(
  "/api/clients",
  requireAuth,
  asyncRoute(async (req, res) => {
    assertSameOrigin(req);
    const input = parse(ClientInput, req.body);
    const id = crypto.randomUUID();
    const { rows } = await pool.query(
      `insert into clients (id, user_id, name, email, address)
       values ($1,$2,$3,$4,$5)
       returning id, name, email, address`,
      [id, req.user.id, input.name, input.email, input.address],
    );
    res.status(201).json({ client: rows[0] });
  }),
);

app.put(
  "/api/clients/:id",
  requireAuth,
  asyncRoute(async (req, res) => {
    assertSameOrigin(req);
    const input = parse(ClientInput, req.body);
    const { rows } = await pool.query(
      `update clients set name=$3, email=$4, address=$5, updated_at=now()
       where id=$1 and user_id=$2
       returning id, name, email, address`,
      [req.params.id, req.user.id, input.name, input.email, input.address],
    );
    if (!rows[0]) throw error(404, "Client not found.");
    res.json({ client: rows[0] });
  }),
);

app.delete(
  "/api/clients/:id",
  requireAuth,
  asyncRoute(async (req, res) => {
    assertSameOrigin(req);
    const client = await pool.connect();
    try {
      await client.query("begin");
      const { rowCount } = await client.query("delete from clients where id=$1 and user_id=$2", [
        req.params.id,
        req.user.id,
      ]);
      if (!rowCount) {
        await client.query("rollback");
        throw error(404, "Client not found.");
      }
      await client.query(
        "update invoices set client_id=null, updated_at=now() where user_id=$1 and client_id=$2",
        [req.user.id, req.params.id],
      );
      await client.query("commit");
    } catch (err) {
      await client.query("rollback").catch(() => {});
      throw err;
    } finally {
      client.release();
    }
    res.json({ ok: true });
  }),
);

/* ------------------------------------------------------------------ */
/* Invoices                                                           */
/* ------------------------------------------------------------------ */

async function invoiceRow(userId, input) {
  if (input.clientId) {
    const { rowCount } = await pool.query("select 1 from clients where id=$1 and user_id=$2", [
      input.clientId,
      userId,
    ]);
    if (!rowCount) throw error(400, "Select a client from your client list.");
  }
  const totals = summarizeInvoice(input);
  return {
    client_id: input.clientId || null,
    number: input.number,
    status: input.status,
    issue_date: input.issueDate,
    due_date: input.dueDate,
    currency: input.currency,
    total_cents: Math.round(totals.total * 100),
    balance_cents: Math.round(totals.balance * 100),
    data: input,
  };
}

app.get(
  "/api/invoices",
  requireAuth,
  asyncRoute(async (req, res) => {
    const { rows } = await pool.query(
      "select data from invoices where user_id = $1 order by created_at desc",
      [req.user.id],
    );
    res.json({ invoices: rows.map((row) => row.data) });
  }),
);

app.post(
  "/api/invoices",
  requireAuth,
  asyncRoute(async (req, res) => {
    assertSameOrigin(req);
    const input = parse(InvoiceInput, req.body);
    const row = await invoiceRow(req.user.id, input);
    try {
      await pool.query(
        `insert into invoices
          (id, user_id, client_id, number, status, issue_date, due_date, currency,
           total_cents, balance_cents, data)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          input.id,
          req.user.id,
          row.client_id,
          row.number,
          row.status,
          row.issue_date,
          row.due_date,
          row.currency,
          row.total_cents,
          row.balance_cents,
          JSON.stringify(row.data),
        ],
      );
    } catch (e) {
      if (uniqueViolation(e)) throw invoiceConflict(e);
      throw e;
    }
    res.status(201).json({ invoice: row.data });
  }),
);

app.put(
  "/api/invoices/:id",
  requireAuth,
  asyncRoute(async (req, res) => {
    assertSameOrigin(req);
    const input = parse(InvoiceInput, req.body);
    if (input.id !== req.params.id) throw error(400, "Invoice id mismatch.");
    const row = await invoiceRow(req.user.id, input);
    let result;
    try {
      result = await pool.query(
        `update invoices set
           client_id=$3, number=$4, status=$5, issue_date=$6, due_date=$7,
           currency=$8, total_cents=$9, balance_cents=$10, data=$11, updated_at=now()
         where id=$1 and user_id=$2`,
        [
          req.params.id,
          req.user.id,
          row.client_id,
          row.number,
          row.status,
          row.issue_date,
          row.due_date,
          row.currency,
          row.total_cents,
          row.balance_cents,
          JSON.stringify(row.data),
        ],
      );
    } catch (e) {
      if (uniqueViolation(e)) throw invoiceConflict(e);
      throw e;
    }
    if (!result.rowCount) throw error(404, "Invoice not found.");
    res.json({ invoice: row.data });
  }),
);

app.delete(
  "/api/invoices/:id",
  requireAuth,
  asyncRoute(async (req, res) => {
    assertSameOrigin(req);
    const { rowCount } = await pool.query("delete from invoices where id=$1 and user_id=$2", [
      req.params.id,
      req.user.id,
    ]);
    if (!rowCount) throw error(404, "Invoice not found.");
    res.json({ ok: true });
  }),
);

/* ------------------------------------------------------------------ */
/* Health, static host, errors                                        */
/* ------------------------------------------------------------------ */

app.get(
  "/api/health",
  asyncRoute(async (_req, res) => {
    await pool.query("select 1");
    res.json({ ok: true, database: "up" });
  }),
);

app.use("/api", (_req, res) => res.status(404).json({ error: "Not found." }));

const dist = path.join(ROOT, "dist");
if (fs.existsSync(dist)) {
  app.use(express.static(dist, { index: false, maxAge: IS_PROD ? "1h" : 0 }));
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(dist, "index.html"));
  });
}

app.use((err, _req, res, _next) => {
  if (err instanceof z.ZodError) {
    return res.status(400).json({ error: err.issues[0]?.message || "Invalid request." });
  }
  const status = Number(err.status) || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status >= 500 ? "Something went wrong." : err.message });
});

/* ------------------------------------------------------------------ */
/* Start                                                              */
/* ------------------------------------------------------------------ */

const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
await pool.query(schema);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Clarity listening on ${APP_URL} (port ${PORT})`);
});
