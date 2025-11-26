
import React from 'react';
import { Invoice, Client, Profile, InvoiceSummary } from '../types';
import { ExternalLink, CreditCard } from 'lucide-react';

interface TemplateProps {
   invoice: Invoice;
   client: Client;
   profile: Profile;
   totals: InvoiceSummary;
}

const getFontClass = (family?: 'sans' | 'serif' | 'mono', defaultFamily: string = 'font-sans') => {
   if (family === 'serif') return 'font-serif';
   if (family === 'mono') return 'font-mono';
   if (family === 'sans') return 'font-sans';
   return defaultFamily;
};

// --- Modern Template ---
export const ModernTemplate = ({ invoice, client, profile, totals }: TemplateProps) => (
   <div className={`w-full min-h-full p-16 flex flex-col justify-between text-slate-900 bg-white ${getFontClass(profile.fontFamily, 'font-sans')}`}>
      <div>
         {/* Header */}
         <div className="flex justify-between items-start mb-12">
            <div className="flex items-center gap-4">
               {profile.logoUrl && (
                  <img src={profile.logoUrl} alt="Logo" className="h-32 w-32 object-contain rounded-md" />
               )}
               <div>
                  <h1 className="text-6xl font-display font-bold tracking-tight" style={{ color: profile.brandColor }}>{profile.name}</h1>
                  <div className="text-sm text-slate-500 mt-1 whitespace-pre-wrap max-w-xs">
                     {profile.address}
                  </div>
               </div>
            </div>
            <div className="text-right">
               <h2 className="text-4xl font-light text-slate-300 mb-2">INVOICE</h2>
               <p className="font-mono font-medium text-lg" style={{ color: profile.brandColor }}>#{invoice.number}</p>
            </div>
         </div>

         {/* Meta Grid */}
         <div className="grid grid-cols-2 gap-12 mb-12">
            <div>
               <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Bill To</h3>
               <div className="text-sm">
                  <p className="font-bold text-slate-900">{client.name}</p>
                  <p className="text-slate-600 mt-1 whitespace-pre-wrap">{client.address}</p>
                  <p className="text-slate-600 mt-1">{client.email}</p>
               </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Issued</h3>
                  <p className="text-sm font-medium">{invoice.issueDate}</p>
               </div>
               <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Due</h3>
                  <p className="text-sm font-medium">{invoice.dueDate}</p>
               </div>
            </div>
         </div>

         {/* Table */}
         <table className="w-full mb-12">
            <thead>
               <tr className="border-b-2 border-slate-100">
                  <th className="text-left py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Description</th>
                  <th className="text-right py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 w-20">Qty</th>
                  <th className="text-right py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 w-32">Price</th>
                  <th className="text-right py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 w-32">Amount</th>
               </tr>
            </thead>
            <tbody>
               {invoice.items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-50">
                     <td className="py-4 text-sm text-slate-800 font-medium">{item.description}</td>
                     <td className="py-4 text-sm text-slate-600 text-right">{item.quantity}</td>
                     <td className="py-4 text-sm text-slate-600 text-right">${item.unitPrice.toFixed(2)}</td>
                     <td className="py-4 text-sm text-slate-900 font-semibold text-right">
                        ${(item.quantity * item.unitPrice).toFixed(2)}
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>

         {/* Summaries */}
         <div className="flex justify-end mb-12">
            <div className="w-64 space-y-3">
               <div className="flex justify-between text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span>${totals.subtotal.toFixed(2)}</span>
               </div>
               <div className="flex justify-between text-sm text-slate-600">
                  <span>Tax ({invoice.taxRate}%)</span>
                  <span>${totals.taxAmount.toFixed(2)}</span>
               </div>
               <div className="flex justify-between text-xl font-bold text-slate-900 pt-4 border-t border-slate-200">
                  <span>Total</span>
                  <span style={{ color: profile.brandColor }}>${totals.total.toFixed(2)}</span>
               </div>
            </div>
         </div>
      </div>

      {/* Footer */}
      <div className="border-t-2 border-slate-100 pt-8 mt-auto">
         <div className="flex justify-between items-end">
            <div>
               {invoice.notes && (
                  <div className="mb-6">
                     <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Notes</h3>
                     <p className="text-sm text-slate-600 whitespace-pre-wrap max-w-lg">{invoice.notes}</p>
                  </div>
               )}
               <div className="text-xs text-slate-400">
                  <p>Thank you for your business.</p>
                  <p>{profile.name}</p>
               </div>
            </div>

            {invoice.paymentLink && (
               <a
                  href={invoice.paymentLink}
                  target="_blank"
                  rel="noreferrer"
                  data-pdf-link="true" // Marker for PDF generation
                  style={{ backgroundColor: profile.brandColor }}
                  className="flex items-center gap-2 text-white px-6 py-3 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity shadow-md"
               >
                  <span>Pay Invoice</span>
                  <ExternalLink size={14} />
               </a>
            )}
         </div>
      </div>
   </div>
);

// --- Classic Template ---
export const ClassicTemplate = ({ invoice, client, profile, totals }: TemplateProps) => (
   <div className={`w-full min-h-full p-16 flex flex-col text-slate-900 bg-orange-50/10 ${getFontClass(profile.fontFamily, 'font-serif')}`}>
      {/* Header */}
      <div
         className="text-center border-b-4 border-double pb-8 mb-8"
         style={{ borderColor: profile.brandColor }}
      >
         {profile.logoUrl && (
            <img src={profile.logoUrl} alt="Logo" className="h-32 w-32 object-contain mx-auto mb-4" />
         )}
         <h1 className="text-5xl font-bold text-slate-900 uppercase tracking-widest mb-2" style={{ color: profile.brandColor }}>{profile.name}</h1>
         <div className="text-sm text-slate-600 whitespace-pre-wrap italic font-medium">
            {profile.address}
         </div>
      </div>

      <div className="flex justify-between items-start mb-8 px-4">
         <div className="w-1/3">
            <h3 className="text-xs font-bold uppercase text-slate-500 border-b border-slate-300 pb-1 mb-2">Bill To:</h3>
            <div className="text-sm leading-relaxed">
               <p className="font-bold">{client.name}</p>
               <p className="whitespace-pre-wrap">{client.address}</p>
            </div>
         </div>
         <div className="text-center w-1/3 pt-4">
            <span
               className="inline-block px-6 py-2 border-2 text-2xl font-bold tracking-widest"
               style={{ borderColor: profile.brandColor, color: profile.brandColor }}
            >
               INVOICE
            </span>
         </div>
         <div className="w-1/3 text-right">
            <div className="inline-block text-left">
               <div className="flex justify-between gap-8 border-b border-slate-200 py-1">
                  <span className="font-bold text-sm text-slate-600">No:</span>
                  <span className="text-sm">{invoice.number}</span>
               </div>
               <div className="flex justify-between gap-8 border-b border-slate-200 py-1">
                  <span className="font-bold text-sm text-slate-600">Date:</span>
                  <span className="text-sm">{invoice.issueDate}</span>
               </div>
               <div className="flex justify-between gap-8 border-b border-slate-200 py-1">
                  <span className="font-bold text-sm text-slate-600">Due:</span>
                  <span className="text-sm">{invoice.dueDate}</span>
               </div>
            </div>
         </div>
      </div>

      {/* Table */}
      <div className="flex-1">
         <table className="w-full border-2 mb-8" style={{ borderColor: profile.brandColor }}>
            <thead className="bg-slate-100">
               <tr>
                  <th className="text-left py-2 px-4 border-r border-slate-300 font-bold text-sm uppercase">Description</th>
                  <th className="text-center py-2 px-4 border-r border-slate-300 font-bold text-sm uppercase w-20">Qty</th>
                  <th className="text-right py-2 px-4 border-r border-slate-300 font-bold text-sm uppercase w-32">Rate</th>
                  <th className="text-right py-2 px-4 font-bold text-sm uppercase w-32">Total</th>
               </tr>
            </thead>
            <tbody>
               {invoice.items.map((item, idx) => (
                  <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                     <td className="py-3 px-4 border-r border-slate-200 text-sm">{item.description}</td>
                     <td className="py-3 px-4 border-r border-slate-200 text-sm text-center">{item.quantity}</td>
                     <td className="py-3 px-4 border-r border-slate-200 text-sm text-right">${item.unitPrice.toFixed(2)}</td>
                     <td className="py-3 px-4 text-sm text-right font-medium">
                        ${(item.quantity * item.unitPrice).toFixed(2)}
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>

      <div className="flex justify-between items-start px-4 mb-8 mt-auto">
         <div className="w-1/2 pr-8">
            {invoice.notes && (
               <div>
                  <h3 className="text-xs font-bold uppercase text-slate-500 mb-1">Notes</h3>
                  <p className="text-sm text-slate-700 italic bg-slate-50 p-3 border border-slate-200">{invoice.notes}</p>
               </div>
            )}
            {invoice.paymentLink && (
               <div className="mt-6 p-4 border border-slate-300 bg-white inline-block">
                  <p className="text-xs font-bold uppercase mb-2 text-slate-500">Payment Options</p>
                  <a
                     href={invoice.paymentLink}
                     target="_blank"
                     rel="noreferrer"
                     data-pdf-link="true"
                     style={{ color: profile.brandColor, borderColor: profile.brandColor }}
                     className="text-sm font-bold underline decoration-2 underline-offset-4 hover:opacity-80"
                  >
                     Click here to pay online &rarr;
                  </a>
               </div>
            )}
         </div>
         <div className="w-1/3">
            <div className="flex justify-between py-2 border-b border-slate-300">
               <span className="font-bold text-sm">Subtotal:</span>
               <span className="text-sm">${totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-300">
               <span className="font-bold text-sm">Tax ({invoice.taxRate}%):</span>
               <span className="text-sm">${totals.taxAmount.toFixed(2)}</span>
            </div>
            <div
               className="flex justify-between py-3 border-b-4 border-double mt-1"
               style={{ borderColor: profile.brandColor }}
            >
               <span className="font-bold text-lg">Total:</span>
               <span className="font-bold text-lg" style={{ color: profile.brandColor }}>${totals.total.toFixed(2)}</span>
            </div>
         </div>
      </div>

      <div className="text-center text-xs text-slate-500 pt-8 border-t border-slate-300">
         <p>{profile.email}</p>
      </div>
   </div>
);


// --- Minimal Template ---
export const MinimalTemplate = ({ invoice, client, profile, totals }: TemplateProps) => (
   <div className={`w-full min-h-full p-16 flex flex-col text-slate-900 bg-white ${getFontClass(profile.fontFamily, 'font-sans')}`}>
      {/* Header Grid */}
      <div className="grid grid-cols-2 gap-8 border-b pb-8 mb-8" style={{ borderColor: profile.brandColor }}>
         <div>
            <h1 className="text-6xl font-display font-bold mb-4 tracking-tight" style={{ color: profile.brandColor }}>{profile.name}</h1>
            <div className="text-xs leading-relaxed text-slate-600">
               <p>{profile.email}</p>
               <p className="whitespace-pre-wrap">{profile.address}</p>
            </div>
         </div>
         <div className="text-right flex flex-col justify-between">
            <h2 className="text-xl font-bold" style={{ color: profile.brandColor }}>INVOICE</h2>
            <div>
               <p className="text-sm"><span className="text-slate-500 mr-2">No.</span> {invoice.number}</p>
               <p className="text-sm"><span className="text-slate-500 mr-2">Date</span> {invoice.issueDate}</p>
            </div>
         </div>
      </div>

      {/* Client & Meta */}
      <div className="grid grid-cols-4 gap-4 mb-16">
         <div className="col-span-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Billed To</h3>
            <p className="text-sm font-medium mb-1">{client.name}</p>
            <p className="text-xs text-slate-600 whitespace-pre-wrap">{client.address}</p>
         </div>
         <div className="col-span-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Due Date</h3>
            <p className="text-sm">{invoice.dueDate}</p>
         </div>
         <div className="col-span-1 text-right">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Total Due</h3>
            <p className="text-lg font-bold">${totals.total.toFixed(2)}</p>
         </div>
      </div>

      {/* Items */}
      <div className="flex-1">
         <div className="flex text-xs font-bold text-slate-400 uppercase border-b border-slate-200 pb-2 mb-4">
            <div className="flex-1">Description</div>
            <div className="w-20 text-right">Qty</div>
            <div className="w-32 text-right">Price</div>
            <div className="w-32 text-right">Amount</div>
         </div>

         <div className="space-y-4">
            {invoice.items.map((item) => (
               <div key={item.id} className="flex text-sm">
                  <div className="flex-1 font-medium">{item.description}</div>
                  <div className="w-20 text-right text-slate-600">{item.quantity}</div>
                  <div className="w-32 text-right text-slate-600">${item.unitPrice.toFixed(2)}</div>
                  <div className="w-32 text-right font-semibold">${(item.quantity * item.unitPrice).toFixed(2)}</div>
               </div>
            ))}
         </div>
      </div>

      {/* Footer Summary */}
      <div className="border-t pt-8 mt-8 mt-auto" style={{ borderColor: profile.brandColor }}>
         <div className="flex justify-between items-start">
            <div className="w-1/2 pr-8">
               {invoice.paymentLink && (
                  <div className="text-white p-4 inline-block min-w-[200px] text-center" style={{ backgroundColor: profile.brandColor || '#000' }}>
                     <p className="text-xs uppercase tracking-wider mb-1 opacity-70">Pay Online</p>
                     <a
                        href={invoice.paymentLink}
                        target="_blank"
                        rel="noreferrer"
                        data-pdf-link="true"
                        className="font-bold underline decoration-1 underline-offset-4 hover:opacity-80"
                     >
                        Link to Payment
                     </a>
                  </div>
               )}
               {invoice.notes && (
                  <p className="text-xs text-slate-500 mt-4 max-w-xs">{invoice.notes}</p>
               )}
            </div>
            <div className="w-1/2 max-w-xs ml-auto">
               <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-500">Subtotal</span>
                  <span>${totals.subtotal.toFixed(2)}</span>
               </div>
               <div className="flex justify-between text-sm mb-4">
                  <span className="text-slate-500">Tax {invoice.taxRate}%</span>
                  <span>${totals.taxAmount.toFixed(2)}</span>
               </div>
               <div className="flex justify-between text-xl font-bold border-t border-slate-200 pt-4">
                  <span>Total</span>
                  <span style={{ color: profile.brandColor }}>${totals.total.toFixed(2)}</span>
               </div>
            </div>
         </div>
      </div>
   </div>
);

// --- Bold Template (High Contrast) ---
export const BoldTemplate = ({ invoice, client, profile, totals }: TemplateProps) => (
   <div className={`w-full min-h-full flex flex-col text-slate-900 bg-white ${getFontClass(profile.fontFamily, 'font-sans')}`}>
      {/* Bold Header */}
      <div className="p-16 text-white" style={{ backgroundColor: profile.brandColor }}>
         <div className="flex justify-between items-start">
            <div className="flex items-center gap-6">
               {profile.logoUrl && (
                  <div className="bg-white p-2 rounded">
                     <img src={profile.logoUrl} alt="Logo" className="h-24 w-24 object-contain" />
                  </div>
               )}
               <div>
                  <h1 className="text-5xl font-bold tracking-tight">{profile.name}</h1>
                  <div className="text-white/80 text-sm mt-2 whitespace-pre-wrap max-w-xs">
                     {profile.address}
                  </div>
               </div>
            </div>
            <div className="text-right">
               <h2 className="text-5xl font-black opacity-30">INVOICE</h2>
               <p className="text-2xl font-bold mt-2">#{invoice.number}</p>
            </div>
         </div>
      </div>

      <div className="p-16 flex-1 flex flex-col">
         {/* Info Strip */}
         <div className="flex justify-between border-b-4 border-slate-100 pb-12 mb-12">
            <div>
               <h3 className="text-xs font-bold uppercase text-slate-400 mb-3">Billed To</h3>
               <p className="text-lg font-bold text-slate-900">{client.name}</p>
               <p className="text-slate-500 whitespace-pre-wrap">{client.address}</p>
               <p className="text-slate-500">{client.email}</p>
            </div>
            <div className="flex gap-12">
               <div>
                  <h3 className="text-xs font-bold uppercase text-slate-400 mb-3">Issue Date</h3>
                  <p className="text-lg font-medium">{invoice.issueDate}</p>
               </div>
               <div>
                  <h3 className="text-xs font-bold uppercase text-slate-400 mb-3">Due Date</h3>
                  <p className="text-lg font-medium">{invoice.dueDate}</p>
               </div>
            </div>
         </div>

         {/* Table */}
         <div className="mb-12">
            <div className="flex text-xs font-bold uppercase text-slate-400 pb-4 border-b border-slate-100">
               <div className="flex-1">Item Description</div>
               <div className="w-24 text-right">Qty</div>
               <div className="w-32 text-right">Price</div>
               <div className="w-32 text-right">Total</div>
            </div>
            <div className="divide-y divide-slate-50">
               {invoice.items.map((item) => (
                  <div key={item.id} className="flex py-4 items-center">
                     <div className="flex-1 font-medium text-slate-800">{item.description}</div>
                     <div className="w-24 text-right text-slate-500">{item.quantity}</div>
                     <div className="w-32 text-right text-slate-500">${item.unitPrice.toFixed(2)}</div>
                     <div className="w-32 text-right font-bold text-slate-900">${(item.quantity * item.unitPrice).toFixed(2)}</div>
                  </div>
               ))}
            </div>
         </div>

         {/* Totals */}
         <div className="flex justify-end mt-auto">
            <div className="w-1/3 bg-slate-50 p-8 rounded-xl">
               <div className="flex justify-between mb-3 text-slate-600">
                  <span>Subtotal</span>
                  <span>${totals.subtotal.toFixed(2)}</span>
               </div>
               <div className="flex justify-between mb-6 text-slate-600">
                  <span>Tax ({invoice.taxRate}%)</span>
                  <span>${totals.taxAmount.toFixed(2)}</span>
               </div>
               <div className="flex justify-between pt-6 border-t border-slate-200">
                  <span className="text-xl font-bold text-slate-900">Total</span>
                  <span className="text-xl font-bold" style={{ color: profile.brandColor }}>${totals.total.toFixed(2)}</span>
               </div>
            </div>
         </div>

         {/* Footer / Payment */}
         {(invoice.paymentLink || invoice.notes) && (
            <div className="mt-12 pt-8 border-t border-slate-100 flex justify-between items-center">
               <div className="text-sm text-slate-500 max-w-md">
                  {invoice.notes}
               </div>
               {invoice.paymentLink && (
                  <a
                     href={invoice.paymentLink}
                     target="_blank"
                     rel="noreferrer"
                     data-pdf-link="true"
                     style={{ backgroundColor: profile.brandColor }}
                     className="px-6 py-3 rounded-full text-white font-bold text-sm hover:opacity-90 transition-opacity shadow-lg"
                  >
                     Pay Invoice Now &rarr;
                  </a>
               )}
            </div>
         )}
      </div>
   </div>
);

// --- Agency Template (Dark Mode / Bold Grid) ---
export const AgencyTemplate = ({ invoice, client, profile, totals }: TemplateProps) => (
   <div className={`w-full min-h-full flex flex-col bg-zinc-900 text-white ${getFontClass(profile.fontFamily, 'font-sans')}`}>
      {/* Header */}
      <div className="p-16 border-b border-zinc-800">
         <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
               {profile.logoUrl && (
                  <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center p-2">
                     <img src={profile.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                  </div>
               )}
               <div>
                  <h1 className="text-7xl font-display font-bold tracking-tighter uppercase">{profile.name}</h1>
                  <p className="text-zinc-500 text-sm mt-1">{profile.address}</p>
               </div>
            </div>
            <div className="text-right">
               <div className="inline-block bg-white text-zinc-900 px-3 py-1 text-xs font-bold uppercase tracking-wider mb-2">Invoice</div>
               <p className="text-3xl font-mono text-zinc-500">#{invoice.number}</p>
            </div>
         </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-12 flex-1">
         {/* Left Col (Client) */}
         <div className="col-span-4 border-r border-zinc-800 p-16 flex flex-col">
            <div className="mb-12">
               <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Client</h3>
               <p className="text-xl font-bold mb-2">{client.name}</p>
               <p className="text-zinc-400 whitespace-pre-wrap leading-relaxed">{client.address}</p>
               <p className="text-zinc-500 mt-2">{client.email}</p>
            </div>

            <div className="mb-12">
               <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Dates</h3>
               <div className="flex justify-between mb-2">
                  <span className="text-zinc-400">Issued</span>
                  <span>{invoice.issueDate}</span>
               </div>
               <div className="flex justify-between">
                  <span className="text-zinc-400">Due</span>
                  <span className="text-white font-medium">{invoice.dueDate}</span>
               </div>
            </div>

            <div className="mt-auto">
               <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Total Amount</h3>
               <p className="text-5xl font-light tracking-tight" style={{ color: profile.brandColor }}>
                  ${totals.total.toFixed(2)}
               </p>
            </div>
         </div>

         {/* Right Col (Items) */}
         <div className="col-span-8 p-16 bg-zinc-900/50">
            <table className="w-full">
               <thead>
                  <tr className="border-b border-zinc-800">
                     <th className="text-left text-xs font-bold text-zinc-500 uppercase tracking-wider py-4">Work Description</th>
                     <th className="text-right text-xs font-bold text-zinc-500 uppercase tracking-wider py-4 w-24">Qty</th>
                     <th className="text-right text-xs font-bold text-zinc-500 uppercase tracking-wider py-4 w-32">Rate</th>
                     <th className="text-right text-xs font-bold text-zinc-500 uppercase tracking-wider py-4 w-32">Total</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-zinc-800">
                  {invoice.items.map(item => (
                     <tr key={item.id}>
                        <td className="py-6 pr-4 font-medium text-zinc-300">{item.description}</td>
                        <td className="py-6 text-right text-zinc-500">{item.quantity}</td>
                        <td className="py-6 text-right text-zinc-500">${item.unitPrice.toFixed(2)}</td>
                        <td className="py-6 text-right font-bold text-white">${(item.quantity * item.unitPrice).toFixed(2)}</td>
                     </tr>
                  ))}
               </tbody>
            </table>

            <div className="mt-12 flex justify-end">
               <div className="w-64">
                  <div className="flex justify-between py-2 border-b border-zinc-800 text-zinc-400 text-sm">
                     <span>Subtotal</span>
                     <span>${totals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-zinc-800 text-zinc-400 text-sm">
                     <span>Tax ({invoice.taxRate}%)</span>
                     <span>${totals.taxAmount.toFixed(2)}</span>
                  </div>
               </div>
            </div>

            {(invoice.paymentLink || invoice.notes) && (
               <div className="mt-16 pt-8 border-t border-zinc-800 flex items-center justify-between">
                  <p className="text-zinc-500 text-sm max-w-sm">{invoice.notes}</p>
                  {invoice.paymentLink && (
                     <a
                        href={invoice.paymentLink}
                        target="_blank"
                        rel="noreferrer"
                        data-pdf-link="true"
                        style={{ backgroundColor: profile.brandColor }}
                        className="px-8 py-4 text-white font-bold text-sm tracking-widest uppercase hover:opacity-80 transition-opacity"
                     >
                        Pay Invoice
                     </a>
                  )}
               </div>
            )}
         </div>
      </div>
   </div>
);

// --- Boutique Template (Elegant, Bordered) ---
export const BoutiqueTemplate = ({ invoice, client, profile, totals }: TemplateProps) => (
   <div className={`w-full min-h-full p-12 bg-[#FDFCF8] text-slate-800 ${getFontClass(profile.fontFamily, 'font-serif')}`}>
      <div className="h-full border border-slate-800 p-12 flex flex-col relative">
         {/* Corner Accents */}
         <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-slate-800" />
         <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-slate-800" />
         <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-slate-800" />
         <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-slate-800" />

         {/* Header */}
         <div className="text-center mb-16">
            {profile.logoUrl && (
               <img src={profile.logoUrl} alt="Logo" className="h-32 w-32 object-contain mx-auto mb-6 opacity-90 grayscale hover:grayscale-0 transition-all" />
            )}
            <h1 className="text-6xl font-medium tracking-wide mb-2" style={{ color: profile.brandColor }}>{profile.name}</h1>
            <p className="text-sm text-slate-500 uppercase tracking-widest">{profile.address}</p>
         </div>

         {/* Info */}
         <div className="flex justify-between text-sm mb-16 px-4">
            <div className="space-y-1">
               <p className="uppercase tracking-widest text-slate-400 text-xs mb-2">Billed To</p>
               <p className="font-bold text-lg">{client.name}</p>
               <p className="text-slate-600 italic">{client.address}</p>
            </div>
            <div className="text-right space-y-1">
               <p className="uppercase tracking-widest text-slate-400 text-xs mb-2">Details</p>
               <p><span className="text-slate-500 mr-4">Invoice</span> #{invoice.number}</p>
               <p><span className="text-slate-500 mr-4">Issued</span> {invoice.issueDate}</p>
               <p><span className="text-slate-500 mr-4">Due</span> {invoice.dueDate}</p>
            </div>
         </div>

         {/* Table */}
         <div className="flex-1 px-4">
            <table className="w-full">
               <thead>
                  <tr className="border-b border-slate-200">
                     <th className="text-left font-normal text-slate-500 text-xs uppercase tracking-widest py-3">Item</th>
                     <th className="text-right font-normal text-slate-500 text-xs uppercase tracking-widest py-3">Qty</th>
                     <th className="text-right font-normal text-slate-500 text-xs uppercase tracking-widest py-3">Price</th>
                     <th className="text-right font-normal text-slate-500 text-xs uppercase tracking-widest py-3">Total</th>
                  </tr>
               </thead>
               <tbody>
                  {invoice.items.map(item => (
                     <tr key={item.id} className="border-b border-slate-100/50">
                        <td className="py-4 pr-4">{item.description}</td>
                        <td className="py-4 text-right text-slate-500 font-sans">{item.quantity}</td>
                        <td className="py-4 text-right text-slate-500 font-sans">${item.unitPrice.toFixed(2)}</td>
                        <td className="py-4 text-right font-medium font-sans">${(item.quantity * item.unitPrice).toFixed(2)}</td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>

         {/* Total */}
         <div className="mt-12 px-4 flex flex-col items-end">
            <div className="w-1/3 border-t border-slate-800 pt-4">
               <div className="flex justify-between mb-2 text-sm">
                  <span className="italic text-slate-500">Subtotal</span>
                  <span className="font-sans">${totals.subtotal.toFixed(2)}</span>
               </div>
               <div className="flex justify-between mb-6 text-sm">
                  <span className="italic text-slate-500">Tax</span>
                  <span className="font-sans">${totals.taxAmount.toFixed(2)}</span>
               </div>
               <div className="flex justify-between text-xl">
                  <span className="font-medium">Total</span>
                  <span className="font-medium font-sans" style={{ color: profile.brandColor }}>${totals.total.toFixed(2)}</span>
               </div>
            </div>
         </div>

         {/* Footer */}
         <div className="mt-16 text-center">
            {invoice.paymentLink && (
               <a
                  href={invoice.paymentLink}
                  target="_blank"
                  rel="noreferrer"
                  data-pdf-link="true"
                  className="inline-block px-8 py-3 border border-slate-300 hover:border-slate-800 text-xs uppercase tracking-widest font-bold transition-colors"
                  style={{ color: profile.brandColor }}
               >
                  Pay Invoice Online
               </a>
            )}
            <p className="mt-8 text-xs text-slate-400 italic font-serif">Thank you for your trust and business.</p>
         </div>
      </div>
   </div>
);

// --- Tech Template ---
export const TechTemplate = ({ invoice, client, profile, totals }: TemplateProps) => (
   <div className={`w-full min-h-full p-12 bg-slate-900 text-cyan-400 font-mono ${getFontClass(profile.fontFamily, 'font-mono')}`}>
      <div className="border border-cyan-500/30 p-8 h-full relative overflow-hidden">
         <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none">
            <div className="text-[10rem] font-black leading-none text-cyan-500">INV</div>
         </div>

         <div className="relative z-10">
            <div className="flex justify-between items-start mb-16">
               <div className="flex items-center gap-6">
                  {profile.logoUrl && (
                     <div className="bg-cyan-950/50 p-4 border border-cyan-500/50 rounded">
                        <img src={profile.logoUrl} alt="Logo" className="h-24 w-24 object-contain" />
                     </div>
                  )}
                  <div>
                     <h1 className="text-5xl font-bold tracking-tighter text-white mb-2">{profile.name}</h1>
                     <p className="text-cyan-400/70">{profile.email}</p>
                  </div>
               </div>
               <div className="text-right">
                  <div className="inline-block border border-cyan-500 px-4 py-1 rounded-full text-sm mb-2 bg-cyan-950/30">
                     STATUS: {invoice.status.toUpperCase()}
                  </div>
                  <p className="text-3xl font-bold text-white">#{invoice.number}</p>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-12 mb-16">
               <div className="bg-slate-800/50 p-6 rounded border border-slate-700">
                  <h3 className="text-xs font-bold text-cyan-600 mb-4 uppercase">Billed To</h3>
                  <p className="text-xl text-white font-bold mb-2">{client.name}</p>
                  <p className="text-slate-400">{client.address}</p>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800/50 p-6 rounded border border-slate-700">
                     <h3 className="text-xs font-bold text-cyan-600 mb-2 uppercase">Issued</h3>
                     <p className="text-lg text-white">{invoice.issueDate}</p>
                  </div>
                  <div className="bg-slate-800/50 p-6 rounded border border-slate-700">
                     <h3 className="text-xs font-bold text-cyan-600 mb-2 uppercase">Due</h3>
                     <p className="text-lg text-white">{invoice.dueDate}</p>
                  </div>
               </div>
            </div>

            <table className="w-full mb-12">
               <thead>
                  <tr className="border-b border-cyan-500/30">
                     <th className="text-left py-4 text-cyan-600">DESCRIPTION</th>
                     <th className="text-right py-4 text-cyan-600">QTY</th>
                     <th className="text-right py-4 text-cyan-600">UNIT PRICE</th>
                     <th className="text-right py-4 text-cyan-600">AMOUNT</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-cyan-500/10">
                  {invoice.items.map(item => (
                     <tr key={item.id}>
                        <td className="py-4 text-white font-bold">{item.description}</td>
                        <td className="py-4 text-right text-slate-400">{item.quantity}</td>
                        <td className="py-4 text-right text-slate-400">${item.unitPrice.toFixed(2)}</td>
                        <td className="py-4 text-right text-cyan-400">${(item.quantity * item.unitPrice).toFixed(2)}</td>
                     </tr>
                  ))}
               </tbody>
            </table>

            <div className="flex justify-end">
               <div className="w-1/3 bg-cyan-950/20 p-6 border border-cyan-500/20 rounded-lg">
                  <div className="flex justify-between mb-2 text-slate-400">
                     <span>Subtotal</span>
                     <span>${totals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mb-4 text-slate-400">
                     <span>Tax ({invoice.taxRate}%)</span>
                     <span>${totals.taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-2xl font-bold text-white border-t border-cyan-500/30 pt-4">
                     <span>Total</span>
                     <span className="text-cyan-400">${totals.total.toFixed(2)}</span>
                  </div>
               </div>
            </div>
         </div>
      </div>
   </div>
);

// --- Finance Template ---
export const FinanceTemplate = ({ invoice, client, profile, totals }: TemplateProps) => (
   <div className={`w-full min-h-full p-16 bg-white text-slate-800 ${getFontClass(profile.fontFamily, 'font-sans')}`}>
      <div className="flex justify-between items-center border-b-2 border-blue-900 pb-8 mb-8">
         <div className="flex items-center gap-6">
            {profile.logoUrl && (
               <img src={profile.logoUrl} alt="Logo" className="h-24 w-24 object-contain" />
            )}
            <h1 className="text-5xl font-serif font-bold text-blue-900">{profile.name}</h1>
         </div>
         <div className="text-right">
            <h2 className="text-xl font-bold text-slate-400 uppercase tracking-widest">Invoice Statement</h2>
            <p className="text-blue-900 font-bold text-lg">#{invoice.number}</p>
         </div>
      </div>

      <div className="grid grid-cols-2 gap-12 mb-12">
         <div>
            <h3 className="text-sm font-bold text-blue-900 uppercase mb-2">From</h3>
            <p className="font-bold">{profile.name}</p>
            <p className="text-slate-600 whitespace-pre-wrap">{profile.address}</p>
         </div>
         <div>
            <h3 className="text-sm font-bold text-blue-900 uppercase mb-2">Bill To</h3>
            <p className="font-bold">{client.name}</p>
            <p className="text-slate-600 whitespace-pre-wrap">{client.address}</p>
         </div>
      </div>

      <div className="bg-blue-50 p-6 rounded-lg mb-12 flex justify-between items-center border border-blue-100">
         <div>
            <span className="block text-xs uppercase text-blue-800 font-bold">Issue Date</span>
            <span className="text-lg font-bold text-blue-900">{invoice.issueDate}</span>
         </div>
         <div>
            <span className="block text-xs uppercase text-blue-800 font-bold">Due Date</span>
            <span className="text-lg font-bold text-blue-900">{invoice.dueDate}</span>
         </div>
         <div>
            <span className="block text-xs uppercase text-blue-800 font-bold">Amount Due</span>
            <span className="text-2xl font-bold text-blue-900">${totals.total.toFixed(2)}</span>
         </div>
      </div>

      <table className="w-full mb-12">
         <thead className="bg-slate-100">
            <tr>
               <th className="text-left py-3 px-4 font-bold text-slate-700 uppercase text-xs">Description</th>
               <th className="text-center py-3 px-4 font-bold text-slate-700 uppercase text-xs">Quantity</th>
               <th className="text-right py-3 px-4 font-bold text-slate-700 uppercase text-xs">Rate</th>
               <th className="text-right py-3 px-4 font-bold text-slate-700 uppercase text-xs">Amount</th>
            </tr>
         </thead>
         <tbody className="divide-y divide-slate-200">
            {invoice.items.map((item, idx) => (
               <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                  <td className="py-4 px-4 font-medium">{item.description}</td>
                  <td className="py-4 px-4 text-center text-slate-600">{item.quantity}</td>
                  <td className="py-4 px-4 text-right text-slate-600">${item.unitPrice.toFixed(2)}</td>
                  <td className="py-4 px-4 text-right font-bold text-slate-900">${(item.quantity * item.unitPrice).toFixed(2)}</td>
               </tr>
            ))}
         </tbody>
      </table>

      <div className="flex justify-end">
         <div className="w-1/2 border-t-2 border-blue-900 pt-4">
            <div className="flex justify-between mb-2">
               <span className="font-bold text-slate-600">Subtotal</span>
               <span>${totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-4">
               <span className="font-bold text-slate-600">Tax</span>
               <span>${totals.taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-2xl font-bold text-blue-900 bg-blue-50 p-4 rounded">
               <span>Total</span>
               <span>${totals.total.toFixed(2)}</span>
            </div>
         </div>
      </div>
   </div>
);

// --- Creative Template ---
export const CreativeTemplate = ({ invoice, client, profile, totals }: TemplateProps) => (
   <div className={`w-full min-h-full p-12 bg-[#fffbf0] text-slate-800 ${getFontClass(profile.fontFamily, 'font-sans')}`}>
      <div className="flex gap-8 h-full">
         {/* Sidebar */}
         <div className="w-1/3 bg-[#ff9f1c] p-8 rounded-3xl text-white flex flex-col justify-between" style={{ backgroundColor: profile.brandColor }}>
            <div>
               {profile.logoUrl && (
                  <div className="bg-white/20 p-4 rounded-2xl mb-8 backdrop-blur-sm">
                     <img src={profile.logoUrl} alt="Logo" className="h-24 w-24 object-contain" />
                  </div>
               )}
               <h1 className="text-5xl font-display font-bold leading-tight mb-8">{profile.name}</h1>
               <div className="space-y-4 opacity-90">
                  <div>
                     <p className="text-xs uppercase font-bold opacity-70">Address</p>
                     <p className="whitespace-pre-wrap">{profile.address}</p>
                  </div>
                  <div>
                     <p className="text-xs uppercase font-bold opacity-70">Contact</p>
                     <p>{profile.email}</p>
                  </div>
               </div>
            </div>

            <div className="mt-12">
               <div className="text-6xl font-black opacity-20 rotate-90 origin-bottom-left absolute bottom-12 left-12">INVOICE</div>
            </div>
         </div>

         {/* Main Content */}
         <div className="flex-1 py-4">
            <div className="flex justify-between items-end mb-12 border-b-2 border-slate-200 pb-4">
               <div>
                  <p className="text-sm font-bold text-slate-400 uppercase">Invoice No.</p>
                  <p className="text-4xl font-black text-slate-900">#{invoice.number}</p>
               </div>
               <div className="text-right">
                  <p className="text-sm font-bold text-slate-400 uppercase">Date</p>
                  <p className="text-xl font-bold">{invoice.issueDate}</p>
               </div>
            </div>

            <div className="mb-12">
               <p className="text-sm font-bold text-slate-400 uppercase mb-2">Billed To</p>
               <h2 className="text-3xl font-bold text-slate-900 mb-2">{client.name}</h2>
               <p className="text-slate-600">{client.address}</p>
            </div>

            <div className="space-y-4 mb-12">
               {invoice.items.map((item, idx) => (
                  <div key={item.id} className="flex items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                     <div className="flex-1">
                        <p className="font-bold text-lg text-slate-800">{item.description}</p>
                        <p className="text-sm text-slate-500">{item.quantity} x ${item.unitPrice.toFixed(2)}</p>
                     </div>
                     <div className="font-bold text-xl text-slate-900">
                        ${(item.quantity * item.unitPrice).toFixed(2)}
                     </div>
                  </div>
               ))}
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100">
               <div className="flex justify-between mb-2">
                  <span className="font-bold text-slate-500">Subtotal</span>
                  <span className="font-bold">${totals.subtotal.toFixed(2)}</span>
               </div>
               <div className="flex justify-between mb-6">
                  <span className="font-bold text-slate-500">Tax</span>
                  <span className="font-bold">${totals.taxAmount.toFixed(2)}</span>
               </div>
               <div className="flex justify-between text-3xl font-black text-slate-900 pt-6 border-t border-slate-100">
                  <span>Total</span>
                  <span style={{ color: profile.brandColor }}>${totals.total.toFixed(2)}</span>
               </div>
            </div>
         </div>
      </div>
   </div>
);

// --- Simple Template ---
export const SimpleTemplate = ({ invoice, client, profile, totals }: TemplateProps) => (
   <div className={`w-full min-h-full p-16 bg-white text-slate-900 ${getFontClass(profile.fontFamily, 'font-sans')}`}>
      <div className="text-center mb-12">
         {profile.logoUrl && (
            <img src={profile.logoUrl} alt="Logo" className="h-24 w-24 object-contain mx-auto mb-4" />
         )}
         <h1 className="text-5xl font-display font-bold mb-2">{profile.name}</h1>
         <p className="text-slate-500">{profile.address} • {profile.email}</p>
      </div>

      <div className="border-t border-b border-slate-200 py-8 mb-8 flex justify-between">
         <div>
            <p className="text-sm text-slate-500 uppercase">Billed To</p>
            <p className="font-bold text-lg">{client.name}</p>
            <p className="text-slate-600">{client.address}</p>
         </div>
         <div className="text-right">
            <p className="text-sm text-slate-500 uppercase">Invoice Details</p>
            <p className="font-bold">#{invoice.number}</p>
            <p className="text-slate-600">{invoice.issueDate}</p>
         </div>
      </div>

      <table className="w-full mb-12">
         <thead>
            <tr className="border-b-2 border-slate-900">
               <th className="text-left py-2 font-bold uppercase text-sm">Item</th>
               <th className="text-right py-2 font-bold uppercase text-sm">Qty</th>
               <th className="text-right py-2 font-bold uppercase text-sm">Price</th>
               <th className="text-right py-2 font-bold uppercase text-sm">Total</th>
            </tr>
         </thead>
         <tbody>
            {invoice.items.map(item => (
               <tr key={item.id} className="border-b border-slate-100">
                  <td className="py-4 font-medium">{item.description}</td>
                  <td className="py-4 text-right">{item.quantity}</td>
                  <td className="py-4 text-right">${item.unitPrice.toFixed(2)}</td>
                  <td className="py-4 text-right font-bold">${(item.quantity * item.unitPrice).toFixed(2)}</td>
               </tr>
            ))}
         </tbody>
      </table>

      <div className="flex justify-end">
         <div className="w-64">
            <div className="flex justify-between py-2">
               <span>Subtotal</span>
               <span>${totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2">
               <span>Tax</span>
               <span>${totals.taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 border-t-2 border-slate-900 font-bold text-xl">
               <span>Total</span>
               <span>${totals.total.toFixed(2)}</span>
            </div>
         </div>
      </div>
   </div>
);
