import type { Client, Invoice, InvoiceStatus, Profile } from '../types';
import { formatMoney, summarizeInvoice } from './invoiceMath';

/**
 * The stored status is manual, but an invoice past its due date should not
 * keep looking like a freshly sent one. This is a display/derived status; it
 * does not mutate the saved invoice.
 */
export function effectiveStatus(invoice: Invoice, today = new Date()): InvoiceStatus {
  if (
    (invoice.status === 'sent' || invoice.status === 'partial') &&
    invoice.dueDate < today.toISOString().slice(0, 10)
  ) {
    return 'overdue';
  }
  return invoice.status;
}

function invoiceTotal(invoice: Invoice, profile: Profile): string {
  return formatMoney(summarizeInvoice(invoice).total, invoice.currency || profile.currency);
}

/**
 * Opens the user's mail client with a ready-to-send invoice draft. This is a
 * local-first workflow: the user downloads the PDF and attaches it, so no
 * server-side email provider is implied.
 */
export function invoiceEmailHref(invoice: Invoice, client: Client | undefined, profile: Profile): string {
  const subject = `Invoice ${invoice.number} from ${profile.name || 'your business'}`;
  const body = [
    `Hi ${client?.name || 'there'},`,
    '',
    `Please find invoice ${invoice.number} for ${invoiceTotal(invoice, profile)}, due ${invoice.dueDate}.`,
    invoice.paymentLink ? `Payment link: ${invoice.paymentLink}` : '',
    '',
    'The invoice PDF is ready in Clarity — attach it to this email.',
    '',
    profile.name || '',
  ]
    .filter(Boolean)
    .join('\n');

  return `mailto:${encodeURIComponent(client?.email || '')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function reminderEmailHref(
  invoice: Invoice,
  client: Client | undefined,
  profile: Profile,
): string {
  const subject = `Reminder: invoice ${invoice.number} is due`;
  const body = [
    `Hi ${client?.name || 'there'},`,
    '',
    `A friendly reminder that invoice ${invoice.number} for ${invoiceTotal(invoice, profile)} was due on ${invoice.dueDate}.`,
    invoice.paymentLink ? `Payment link: ${invoice.paymentLink}` : '',
    '',
    'If payment is already on its way, thank you — please ignore this note.',
    '',
    profile.name || '',
  ]
    .filter(Boolean)
    .join('\n');

  return `mailto:${encodeURIComponent(client?.email || '')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
