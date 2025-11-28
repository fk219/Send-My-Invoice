
export type TemplateType = 'modern' | 'classic' | 'minimal' | 'bold' | 'agency' | 'boutique' | 'tech' | 'finance' | 'creative' | 'simple';

export interface Profile {
  id: string;
  name: string;
  email: string;
  address: string;
  logoUrl: string;
  brandColor: string;
  taxId?: string;
  currency: string;
  defaultPaymentLink?: string;
  invoiceFormat: string; // e.g., 'INV-{YYYY}-{NNNN}'
  fontFamily?: 'sans' | 'serif' | 'mono';
  website?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  address: string;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';

export interface InvoiceLabel {
  title: string;
  subtitle: string;
  billTo: string;
  shipTo: string;
  date: string;
  dueDate: string;
  poNumber: string;
  paymentTerms: string;
  item: string;
  quantity: string;
  rate: string;
  amount: string;
  subtotal: string;
  discount: string;
  tax: string;
  shipping: string;
  total: string;
  amountPaid: string;
  balanceDue: string;
  notes: string;
  terms: string;
}

export interface Invoice {
  id: string;
  number: string;
  clientId: string;
  issueDate: string;
  dueDate: string;
  poNumber?: string;
  status: InvoiceStatus;
  items: LineItem[];
  notes?: string;
  terms?: string;

  // Financials
  currency: string;
  taxRate: number; // Kept for backward compatibility, but we'll use taxValue/taxType primarily
  taxType: 'percent' | 'amount';
  taxValue: number;
  discountType: 'percent' | 'amount';
  discountValue: number;
  shipping: number;
  amountPaid: number;

  // Visuals
  template: TemplateType;
  paymentLink?: string;

  // Custom Labels
  labels: InvoiceLabel;
}

export interface InvoiceSummary {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shipping: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
}
