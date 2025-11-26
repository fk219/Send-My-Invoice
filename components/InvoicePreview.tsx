
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
    const taxAmount = subtotal * (invoice.taxRate / 100);
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  }, [invoice.items, invoice.taxRate]);

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
    <div className="w-full h-full min-h-[297mm]">
      {renderTemplate()}
    </div>
  );
}
