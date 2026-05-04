# Clarity Invoice — Current Functionality (As Implemented)

This document describes what the application can do today, based on the current codebase behavior (UI + logic), screen by screen, including how each major action works.

## Quick Summary

- Single-page React app with four primary screens: Dashboard, New Invoice, Clients, Settings.
- Data is stored client-side and persisted via `localStorage` (profile, clients, invoices) and a dedicated draft key for unsaved invoices.
- Invoices support line items, discounts, taxes (including item-level taxable flags), shipping, amount paid, balance due, notes/terms, custom labels, multiple templates, and PDF export.
- AI features (optional) can enhance line-item text and analyze branding from a website URL (requires an API key).

## Navigation & App Shell

**Location:** [App.tsx](file:///workspace/App.tsx)

### Sidebar Tabs

- **Dashboard**
  - Switches view to `dashboard`.
- **New Invoice**
  - Opens the invoice editor in “new invoice” mode (clears `editingInvoice` and switches to `invoices` view).
- **Clients**
  - Opens client management.
- **Settings**
  - Opens business/branding/preferences configuration.

### Persistence Model

- On first load, the app hydrates from:
  - `localStorage["clarity_profile"]`
  - `localStorage["clarity_clients"]`
  - `localStorage["clarity_invoices"]`
- After any change to profile/clients/invoices, the app overwrites those keys with the updated state.

## Dashboard

**Location:** [Dashboard.tsx](file:///workspace/components/Dashboard.tsx)

### Buttons & Actions

- **Create Invoice**
  - Calls `onNewInvoice()` which opens the Invoice Editor in “new invoice” mode.
- **Edit (per invoice row)**
  - Calls `onEditInvoice(invoice)` which loads that invoice into the editor for editing.
- **View All**
  - Currently renders as a button but has no click handler wired (no navigation/action yet).

### What the Dashboard Shows

- **Stats cards**
  - Total Revenue: sums totals of invoices marked `paid`
  - Outstanding: sums totals of invoices marked `sent` plus `overdue`
  - Overdue: sums totals of invoices marked `overdue`
  - Note: totals here use `taxRate` (legacy field) and do not include newer `taxValue/taxType` logic yet.
- **Revenue chart**
  - Currently uses mocked monthly data (hardcoded array), not real invoice aggregation yet.
- **Recent invoices**
  - Table listing invoices in memory (no pagination).
  - Client name resolution is done using `mockClients` (not the real `clients` state), so the displayed name can diverge from what you added/edited in the Clients screen.

## Clients

**Location:** [ClientList.tsx](file:///workspace/components/ClientList.tsx)

### Buttons & Actions

- **Add Client**
  - Opens a modal with empty fields.
  - On save: creates a client with `id = "cli-" + Date.now()` and appends it to the list.
- **Edit (per client card)**
  - Opens the modal pre-filled with the client’s info.
  - On save: updates that client in-place.
- **Delete (trash icon)**
  - Uses a `window.confirm('Are you sure?')` prompt.
  - If confirmed: deletes the client from the list.

### Client Fields (Current Schema)

**Location:** [types.ts](file:///workspace/types.ts)

- `name` (required in UI)
- `email` (required in UI)
- `address` (required in UI)

## Settings

**Location:** [Settings.tsx](file:///workspace/components/Settings.tsx)

Settings are divided into three main sections: Brand & Appearance, Business Details, and Numbering & Payment.

### Brand & Appearance

- **Company Logo**
  - Upload Image: reads file locally via `FileReader` and stores as `profile.logoUrl` (data URL/base64).
  - Remove: clears `profile.logoUrl`.
  - Alternative: you can also paste a “Logo URL” directly into the Logo URL field.
- **Brand Color**
  - Supports typing values (the UI mentions HEX/RGB/HSL).
  - Color picker updates `brandColor`.
  - Preset swatches apply a predefined color.
- **Typography**
  - Chooses a font family from a list (system fonts + a Google Fonts list).

### Business Details

- Company Name
- Email Address
- Tax ID / VAT
- Phone Number
- Business Address

### Numbering & Payment

- **Invoice Number Format**
  - Several preset formats exist (e.g., `INV-{YYYY}-{NNNN}`, `#{NNNN}`, `{YYYY}-{NNNN}`).
  - Used by the invoice editor to generate the next invoice number.
- **Default Payment Link**
  - Stored into `profile.defaultPaymentLink`.
  - Pre-fills new invoices with this link.

### Save Settings Button

- The Save button is present but the app also auto-persists changes via `App.tsx` when profile state changes (so the button is currently cosmetic).

## New Invoice / Invoice Editor (Core)

**Location:** [InvoiceEditor.tsx](file:///workspace/components/InvoiceEditor.tsx)

This is the main “SaaS-like” workflow: build an invoice, preview it live, export it, and save it.

### A. Invoice Creation & Numbering

- New invoices are initialized with:
  - `id = "inv-" + Date.now()`
  - `number = generateNextInvoiceNumber(profile.invoiceFormat, existingInvoices)`
  - default client (first client id if available)
  - issue date = today
  - due date = today + 14 days
  - default values for discount/tax/shipping/amountPaid
  - default labels (`DEFAULT_LABELS`)
- Invoice number generation:
  - Replaces `{YYYY}` with the current year
  - Finds existing invoices matching the resulting prefix and increments the numeric suffix

### B. Draft Autosave + Recovery

- While creating a new invoice (not editing an existing one), the editor auto-saves every ~1.5s after changes to:
  - `localStorage["clarity_invoice_draft"]`
- When opening the editor, if a draft exists it prompts:
  - “You have an unsaved invoice draft. Would you like to restore it?”
- When the invoice is successfully saved, the draft key is removed.

### C. Keyboard Shortcuts

- **Cmd/Ctrl + S**: saves the invoice (calls `onSave(invoiceData)`).
- **Cmd/Ctrl + Enter**: adds a new line item.

### D. Client Selection + Inline Client Creation

- Client dropdown selects the invoice `clientId`.
- Inline “Add Client” (UserPlus icon):
  - Opens a popover with `name`, `email`, `address`.
  - On save:
    - creates `id = "client-" + Date.now()`
    - adds it to global clients via `onAddClient`
    - automatically selects it for the invoice.

### E. Payment Terms (Due Date Automation)

- Payment terms selector supports:
  - Custom Date
  - Due on Receipt
  - Net 15 / Net 30 / Net 60
- Changing terms adjusts `dueDate` relative to `issueDate`.
- Changing issue date recalculates due date if the terms are not custom.

### F. Line Items (Items Table)

Each line item supports:

- `description` (required for meaningful invoice)
- `details` (optional multiline additional text)
- `quantity`
- `unitPrice`
- `taxable` (checkbox; if not set it is treated as taxable by default for compatibility)

Line item actions:

- **Add Item**: appends a new line item.
- **Remove Item**: deletes a line item.
- **Reorder Items**: move up/down controls to adjust item ordering.
- **AI Enhance** (Sparkles icon):
  - Calls `enhanceDescription()` to rewrite the description more professionally (requires API key, otherwise it returns the original input).

### G. Totals & Financial Logic

**Location:** [InvoicePreview.tsx](file:///workspace/components/InvoicePreview.tsx)

Live totals are computed as:

- Subtotal: sum(quantity * unitPrice) across all items.
- Discount:
  - percent of subtotal OR fixed amount.
- Tax:
  - computed only against the “taxable subtotal”
  - discount is pro-rated against taxable subtotal before tax is applied
  - percent OR fixed amount
- Shipping: added to total if enabled.
- Total: `(subtotal - discount) + tax + shipping`
- Balance due: `total - amountPaid`

### H. Optional Fields Toggle System

The editor has toggles for optional fields (e.g., show/hide Discount, Tax, Shipping, Amount Paid). If values are already non-zero when editing an invoice, the toggles are enabled automatically on mount.

### I. Template System + Live Preview

**Preview & templates:** [InvoicePreview.tsx](file:///workspace/components/InvoicePreview.tsx), [InvoiceTemplates.tsx](file:///workspace/components/InvoiceTemplates.tsx)

- Live preview is rendered side-by-side with the editor.
- Current templates:
  - `modern`
  - `classic`
  - `minimal`
  - `corporate`
  - `studio`
- Templates are designed to render at a fixed A4-ish pixel width for consistent PDF export.

### J. PDF Export (A4)

- Uses `html2pdf.js` to export the hidden `#pdf-render-container` into an A4 PDF.
- Export captures the same React invoice preview used for live rendering.
- Configuration aims for high-resolution output (`html2canvas.scale = 3`) and A4 sizing (`jsPDF.format = a4`).

## AI / Gemini Integration

**Location:** [geminiService.ts](file:///workspace/services/geminiService.ts)

Current AI-powered actions:

- **Enhance line item description**
  - Improves tone/clarity of the line item description.
- **Suggest invoice number**
  - Generates a “next” invoice number suggestion.
- **Analyze brand from URL**
  - Uses Google Search tool to infer:
    - a logo URL
    - a brand color
    - sans/serif preference

Important notes:

- The service currently reads the API key from `process.env.API_KEY`.
- The repository README mentions `GEMINI_API_KEY`, so environment setup may need aligning.

## Current Constraints / Known Gaps (Still Missing)

This list is about what is not implemented yet (but commonly expected in a SaaS invoicing product).

- **No backend / database** (everything is local to the browser).
- **No authentication / multi-user support.**
- **No invoice list page** (beyond the “Recent Invoices” table on the Dashboard; “View All” is not wired).
- **Dashboard chart is mock data** (not based on invoices).
- **Dashboard client names use mockClients**, not the real client list state.
- **No email sending workflow** (download-only for PDFs).
- **No recurring invoices**, quote/estimate flow, or “convert estimate to invoice”.
- **No product/service catalog** (saved items).
- **No robust currency conversion** for multi-currency reporting.
- **Financial math uses standard JS numbers** (can cause floating point rounding edge cases in rare scenarios).

