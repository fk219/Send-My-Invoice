import type { Invoice, InvoiceSummary } from '../types';

/**
 * Single source of truth for invoice totals. The editor preview and the
 * dashboard must use the same math or the business sees two different numbers
 * for the same invoice.
 */
export function summarizeInvoice(invoice: Invoice): InvoiceSummary {
  const subtotal = invoice.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );
  const taxableSubtotal = invoice.items.reduce((sum, item) => {
    const taxable = item.taxable !== false;
    return sum + (taxable ? item.quantity * item.unitPrice : 0);
  }, 0);

  const discountAmount =
    invoice.discountType === 'percent'
      ? subtotal * (invoice.discountValue / 100)
      : invoice.discountValue;

  const discountRatio = subtotal > 0 ? discountAmount / subtotal : 0;
  const taxableAfterDiscount = taxableSubtotal * (1 - discountRatio);
  const taxAmount =
    invoice.taxType === 'percent'
      ? taxableAfterDiscount * (invoice.taxValue / 100)
      : invoice.taxValue;
  const shipping = invoice.shipping || 0;
  const total = subtotal - discountAmount + taxAmount + shipping;
  const amountPaid = invoice.amountPaid || 0;

  return {
    subtotal,
    discountAmount,
    taxAmount,
    shipping,
    total,
    amountPaid,
    balanceDue: total - amountPaid,
  };
}

/** Formats a total using the invoice/profile currency without a hardcoded $. */
export function formatMoney(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency || 'USD'} ${value.toFixed(2)}`;
  }
}
