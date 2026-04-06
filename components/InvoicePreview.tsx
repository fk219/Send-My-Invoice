
import React, { useMemo } from 'react';
import { Invoice, Client, Profile } from '../types';
import { ModernTemplate, ClassicTemplate, MinimalTemplate, BoldTemplate, AgencyTemplate, BoutiqueTemplate, TechTemplate, FinanceTemplate, CreativeTemplate, SimpleTemplate } from './InvoiceTemplates';

interface InvoicePreviewProps {
  invoice: Invoice;
  client: Client;
  profile: Profile;
}

export default function InvoicePreview({ invoice, client, profile }: InvoicePreviewProps) {
  const totals = useMemo(() => {
    const subtotal = invoice.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    const taxableSubtotal = invoice.items.reduce((acc, item) => {
      // If taxable is undefined, assume it's taxable for backward compatibility
      const isTaxable = item.taxable !== false;
      return acc + (isTaxable ? (item.quantity * item.unitPrice) : 0);
    }, 0);

    const discountAmount = invoice.discountType === 'percent' ? subtotal * (invoice.discountValue / 100) : invoice.discountValue;
    
    // Pro-rate discount against taxable subtotal if we want exact math, or just apply discount then tax
    // Standard approach: discount is applied proportionally, so taxable amount after discount is:
    const discountRatio = subtotal > 0 ? (discountAmount / subtotal) : 0;
    const taxableAfterDiscount = taxableSubtotal * (1 - discountRatio);

    const taxAmount = invoice.taxType === 'percent' ? taxableAfterDiscount * (invoice.taxValue / 100) : invoice.taxValue;
    const shipping = invoice.shipping || 0;
    const total = (subtotal - discountAmount) + taxAmount + shipping;
    const amountPaid = invoice.amountPaid || 0;
    const balanceDue = total - amountPaid;

    return { subtotal, discountAmount, taxAmount, shipping, total, amountPaid, balanceDue };
  }, [invoice]);

  const renderTemplate = () => {
    switch (invoice.template) {
      case 'classic':
        return <ClassicTemplate invoice={invoice} client={client} profile={profile} totals={totals} />;
      case 'minimal':
        return <MinimalTemplate invoice={invoice} client={client} profile={profile} totals={totals} />;
      case 'bold':
        return <BoldTemplate invoice={invoice} client={client} profile={profile} totals={totals} />;
      case 'agency':
        return <AgencyTemplate invoice={invoice} client={client} profile={profile} totals={totals} />;
      case 'boutique':
        return <BoutiqueTemplate invoice={invoice} client={client} profile={profile} totals={totals} />;
      case 'tech':
        return <TechTemplate invoice={invoice} client={client} profile={profile} totals={totals} />;
      case 'finance':
        return <FinanceTemplate invoice={invoice} client={client} profile={profile} totals={totals} />;
      case 'creative':
        return <CreativeTemplate invoice={invoice} client={client} profile={profile} totals={totals} />;
      case 'simple':
        return <SimpleTemplate invoice={invoice} client={client} profile={profile} totals={totals} />;
      case 'modern':
      default:
        return <ModernTemplate invoice={invoice} client={client} profile={profile} totals={totals} />;
    }
  };

  return (
    <div className="w-[794px] min-h-[1123px] flex flex-col bg-white">
      {renderTemplate()}
    </div>
  );
}
