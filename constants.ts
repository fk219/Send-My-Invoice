import { Profile } from './types';

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
  id: 'local-user',
  name: '',
  email: '',
  address: '',
  logoUrl: '',
  brandColor: '#4f46e5', // Indigo 600
  currency: 'USD',
  defaultPaymentLink: '',
  invoiceFormat: 'INV-{YYYY}-{NNNN}',
  fontFamily: 'sans',
  website: '',
};

export const statusColors: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600',
  sent: 'bg-blue-100 text-blue-600',
  paid: 'bg-green-100 text-green-600',
  overdue: 'bg-red-100 text-red-600'
};