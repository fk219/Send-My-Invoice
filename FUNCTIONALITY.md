# Clarity Invoice — Current Functionality

## What it is now

Clarity is a multi-user SaaS invoice workspace. The React UI talks to an Express
API backed by Postgres. Each account has its own profile, clients and invoices.

## Authentication

- Signup: name, email, password (10+ characters), creates a user, default
  business profile and a secure session.
- Login: email/password, bcrypt verification, new HttpOnly session.
- Session: 30-day cookie, stored server-side as a SHA-256 token hash.
- Sign out: deletes the session and clears the cookie.
- Unauthenticated visitors see the auth screen; authenticated visitors load their
  workspace from `/api/bootstrap`.

## Workspace data

- `profiles`: one JSON business profile per user (brand, currency, invoice
  format, logo, payment link, etc.).
- `clients`: per-user rows (name, email, address).
- `invoices`: per-user rows with full invoice JSON plus searchable number,
  status, dates, total and balance.
- All queries are scoped by the session user; there is no cross-account read.

## Dashboard

- Revenue, outstanding and overdue totals use the shared invoice math and the
  real client list.
- A paid invoice past its due date is displayed as overdue without mutating the
  saved status.
- Real six-month paid-revenue chart.
- Invoice table with Email and Remind mail drafts, Edit and currency formatting.
- JSON snapshot export from the sidebar (server remains the source of truth).

## Clients

- Add, edit and delete clients through the API.
- Deleting a client keeps existing invoice data but clears the database link.
- The client list is shared with the invoice editor.

## Invoices

- Create/edit invoice, client, issue/due dates, payment terms, PO number.
- Line items with quantity, unit price, details and taxable flag.
- Discount, tax, shipping, amount paid and balance due.
- Five templates, live preview and A4 PDF export.
- Draft autosave/recovery remains browser-local for an unsaved draft.
- Status: draft, sent, paid, overdue, partial.
- Marking an invoice paid syncs `amountPaid` to the computed total; saving a paid
  invoice enforces it.
- Invoice numbers are unique per account; duplicate saves return a clear error.
- Email and Remind open pre-filled mail drafts; the PDF is attached manually.

## Settings

- Brand name, logo, brand color, typography.
- Business details, tax ID, phone, address, currency, invoice format and default
  payment link.
- Settings auto-save to the API with a short debounce.

## Not built yet

- Subscription billing/checkout.
- Transactional email delivery and hosted invoice links.
- Password reset and email verification.
- Team workspaces/roles.
- Public invoice portal.
- Automatic payment reconciliation.

## Known technical notes

- The Vite build is served by the Node process in production.
- The browser PDF pipeline (`html2pdf.js`) is unchanged.
- The optional AI key stays in the browser; it is not stored on the server.
