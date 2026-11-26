import { AlertTriangle, ArrowRight, FileText, Send, Users } from "lucide-react";

export default function Guide() {
  return (
    <div className="p-8 max-w-4xl mx-auto pb-24">
      <div className="mb-10">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-lime-400">Docs / quickstart</p>
        <h1 className="mt-3 text-3xl font-display font-bold text-white tracking-wide">
          From blank page to a sent invoice.
        </h1>
        <p className="mt-3 max-w-2xl text-slate-400 font-light leading-relaxed">
          Clarity is a local-first invoice builder. The workflow below keeps your data in this browser
          until a backend with accounts and storage is enabled.
        </p>
      </div>

      <div className="mb-8 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-5 text-sm text-amber-100">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-300" />
          <p>
            <strong>Local-only build.</strong> Invoices, clients and settings live in{" "}
            <code className="rounded bg-black/20 px-1">localStorage</code>. Export a backup from the
            sidebar before clearing browser data. There is no login, multi-device sync or server
            backup yet.
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        <Step
          icon={<Users size={18} />}
          title="1. Add your business profile"
          body="Open Settings and fill in the company name, address, tax ID, logo, brand colour and invoice number format. These details are applied to every new invoice."
        />
        <Step
          icon={<Users size={18} />}
          title="2. Add a client"
          body="Create a client with a billing name, email and address. The invoice editor can also create a client inline, so you can start from the invoice if you prefer."
        />
        <Step
          icon={<FileText size={18} />}
          title="3. Build the invoice"
          body="Add line items, quantities, rates, tax, discount and shipping. Choose a template, set the issue and due dates, and add a payment link if you use one. The preview updates live."
        />
        <Step
          icon={<Send size={18} />}
          title="4. Export or send"
          body="Download a PDF for email or your records. PDF export runs in the browser. There is no built-in email delivery yet; attach the PDF to your own email."
        />
        <Step
          icon={<AlertTriangle size={18} />}
          title="5. Back up"
          body="Use Backup in the sidebar to download a JSON snapshot. Restore imports that snapshot into this browser. Treat the file as sensitive; it contains client and invoice data."
        />
      </div>

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold text-white">What is not here yet</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-400">
          <li>Accounts, teams and tenant isolation.</li>
          <li>Server-side invoice numbering and an audit trail.</li>
          <li>Tax/GST rules and multi-currency ledgers.</li>
          <li>Email delivery, reminders and a client portal.</li>
          <li>Recurring invoices and payment reconciliation.</li>
        </ul>
        <p className="mt-4 text-xs text-slate-500">
          The UI and templates are production-quality; the persistence and accounts layer is the next
          build.
        </p>
      </div>

      <a
        href="/"
        className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-lime-400 hover:text-lime-300"
      >
        Back to the dashboard <ArrowRight size={15} />
      </a>
    </div>
  );
}

function Step({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-lime-400/10 text-lime-400">
        {icon}
      </span>
      <div>
        <h2 className="font-semibold text-white">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-400">{body}</p>
      </div>
    </div>
  );
}
