# Clarity Invoice — SaaS

Clarity is a multi-user invoice workspace for freelancers and small businesses.
Every account has its own private clients, invoices and business profile backed
by Postgres.

## Architecture

- **Frontend:** Vite + React 19 (existing Clarity UI), served by the Node app.
- **API:** Express 5, cookie sessions, bcrypt password hashing, same-origin
  mutation checks, rate-limited auth.
- **Database:** PostgreSQL. The schema is in `server/schema.sql`; every business
  query is scoped by the authenticated user.
- **PDF:** generated in the browser from the invoice preview, as before.
- **AI copy/branding:** optional and still uses a key the user enters in
  Settings; it is not sent to the server.

## Local development

Prerequisites: Node.js 22+ and a PostgreSQL database (local, Docker, Neon,
Render, or Supabase).

```bash
npm install
cp .env.example .env
# edit DATABASE_URL
npm run db:init
npm run dev:all
```

- Web UI: `http://localhost:3000`
- API: `http://localhost:8787`
- Vite proxies `/api` to the API server.

If you only want one process at a time:

```bash
npm run dev:server   # API
npm run dev          # Vite UI
```

## Environment

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | Postgres connection string |
| `APP_URL` | yes | Public origin (cookies, same-origin checks) |
| `PORT` | no | API/SSR port, default `8787` |
| `NODE_ENV` | production | `production` sets secure cookies |
| `VITE_API_PROXY` | no | Vite dev proxy target |

## Production

### Docker Compose

```bash
docker compose up --build
```

Open `http://localhost:8787`. Postgres data lives in the `clarity-db` volume.

### Render

`render.yaml` provisions a web service and a managed Postgres database. Set
`APP_URL` to the public Render URL after the first deploy, then redeploy.

### Any Node host

```bash
npm ci
npm run build
npm run db:init
APP_URL=https://invoices.example.com NODE_ENV=production node server/index.mjs
```

The server serves the built SPA and the API from one origin.

## What is included

- Email/password signup and login, secure cookie sessions, sign out.
- Per-user clients and invoices; no cross-account reads.
- Client create/edit/delete.
- Invoice create/edit, status lifecycle, duplicate-number protection.
- Server-side invoice totals for list/reporting.
- Dashboard, templates, live preview, PDF export.
- Email and reminder drafts through the user's mail client.
- JSON snapshot export.

## Deliberate limitations

- **No billing/subscription checkout yet.** Signup is open; pricing/payment can
  be added later without changing the data model.
- **No transactional email provider yet.** “Email” and “Remind” open a
  pre-filled mail draft; the PDF is downloaded and attached manually.
- **No password reset / email verification yet.** Add a transactional email
  provider before opening self-serve signups to unknown users.
- **No public invoice portal.** Invoices are private to the account.
- **No team workspaces yet.** One account owns its data.

## Security notes

- Passwords are bcrypt-hashed with cost 12.
- Session tokens are random, stored only as SHA-256 hashes, HttpOnly,
  SameSite=Lax, Secure when `APP_URL` is HTTPS.
- State-changing API calls check the request origin.
- Auth endpoints are rate-limited.
- Helmet is enabled; CSP is intentionally disabled for the current inline-style
  UI and should be tightened before a public launch.
- Never commit `.env` or real database URLs.
