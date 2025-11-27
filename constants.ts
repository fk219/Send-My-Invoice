import { Client, Invoice, Profile } from './types';

export const DEFAULT_LABELS = {
  title: 'INVOICE',
  subtitle: 'Thank you for your business',
  billTo: 'Bill To',
  shipTo: 'Ship To',
  date: 'Date',
  dueDate: 'Due Date',
  poNumber: 'PO Number',
  paymentTerms: 'Payment Terms',
  item: 'Item',
  quantity: 'Quantity',
  rate: 'Rate',
  amount: 'Amount',
  subtotal: 'Subtotal',
  discount: 'Discount',
  tax: 'Tax',
  shipping: 'Shipping',
  total: 'Total',
  amountPaid: 'Amount Paid',
  balanceDue: 'Balance Due',
  notes: 'Notes',
  terms: 'Terms',
};

export const GOOGLE_FONTS = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Oswald',
  'Raleway',
  'PT Sans',
  'Merriweather',
  'Nunito',
  'Playfair Display',
  'Rubik',
  'Poppins',
  'Work Sans',
  'Barlow',
  'Quicksand',
  'Inconsolata',
  'Dosis',
  'Josefin Sans',
  'Anton',
  'Outfit',
  'Barlow Condensed'
];

export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'CNY', symbol: 'CN¥', name: 'Chinese Yuan' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham' },
];

export const defaultProfile: Profile = {
  id: 'user-1',
  name: 'Acme Creative Studio',
  email: 'hello@acme.studio',
  address: '123 Design Blvd, Creative City, CA 90210',
  logoUrl: 'https://picsum.photos/id/64/200/200',
  brandColor: '#4f46e5', // Indigo 600
  currency: 'USD',
  defaultPaymentLink: 'https://paypal.me/acmestudio',
  invoiceFormat: 'INV-{YYYY}-{NNNN}',
  fontFamily: 'sans',
  website: 'https://acme.studio'
};

export const mockClients: Client[] = [
  {
    id: 'client-1',
    name: 'TechFlow Systems',
    email: 'billing@techflow.com',
    address: '442 Server Ln, Silicon Valley, CA'
  },
  {
    id: 'client-2',
    name: 'GreenLeaf Organics',
    email: 'finance@greenleaf.co',
    address: '88 Market St, Portland, OR'
  }
];

export const mockInvoices: Invoice[] = [
  {
    id: 'inv-001',
    number: 'INV-2023-0001',
    clientId: 'client-1',
    issueDate: '2023-10-01',
    dueDate: '2023-10-15',
    status: 'paid',
    taxRate: 10,
    taxType: 'percent',
    taxValue: 10,
    discountType: 'percent',
    discountValue: 0,
    shipping: 0,
    amountPaid: 0,
    currency: 'USD',
    template: 'modern',
    layout: 'portrait',
    labels: DEFAULT_LABELS,
    items: [
      { id: 'item-1', description: 'UI/UX Design Phase 1', quantity: 40, unitPrice: 100 },
      { id: 'item-2', description: 'Frontend Implementation', quantity: 20, unitPrice: 120 }
    ]
  },
  {
    id: 'inv-002',
    number: 'INV-2023-0002',
    clientId: 'client-2',
    issueDate: '2023-11-01',
    dueDate: '2023-11-15',
    status: 'sent',
    taxRate: 5,
    taxType: 'percent',
    taxValue: 5,
    discountType: 'percent',
    discountValue: 0,
    shipping: 0,
    amountPaid: 0,
    currency: 'USD',
    template: 'classic',
    layout: 'portrait',
    labels: DEFAULT_LABELS,
    paymentLink: 'https://stripe.com/pay/demo',
    items: [
      { id: 'item-3', description: 'Logo Redesign', quantity: 1, unitPrice: 1500 }
    ]
  }
];

export const statusColors: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600',
  sent: 'bg-blue-100 text-blue-600',
  paid: 'bg-green-100 text-green-600',
  overdue: 'bg-red-100 text-red-600'
};