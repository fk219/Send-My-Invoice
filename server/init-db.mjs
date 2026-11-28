/** Apply the Clarity schema. Safe to run repeatedly. */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
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
});
await pool.query(fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8"));
console.log("Clarity schema applied.");
await pool.end();
