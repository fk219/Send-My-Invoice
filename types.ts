
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

export interface Invoice {
  id: string;
  number: string;
  clientId: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  items: LineItem[];
  notes?: string;
  taxRate: number; // Percentage, e.g. 10 for 10%
  template: TemplateType;
  layout: 'portrait' | 'landscape';
  paymentLink?: string;
}

export interface InvoiceSummary {
  subtotal: number;
  taxAmount: number;
  total: number;
}
