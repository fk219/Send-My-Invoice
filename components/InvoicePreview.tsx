
import React, { useMemo } from 'react';
import { Invoice, Client, Profile } from '../types';
import { summarizeInvoice } from '../services/invoiceMath';
import { ModernTemplate, ClassicTemplate, MinimalTemplate, CorporateTemplate, StudioTemplate } from './InvoiceTemplates';

interface InvoicePreviewProps {
  invoice: Invoice;
  client: Client;
  profile: Profile;
}

export default function InvoicePreview({ invoice, client, profile }: InvoicePreviewProps) {
  const totals = useMemo(() => summarizeInvoice(invoice), [invoice]);

  const renderTemplate = () => {
    switch (invoice.template) {
      case 'classic':
        return <ClassicTemplate invoice={invoice} client={client} profile={profile} totals={totals} />;
      case 'minimal':
        return <MinimalTemplate invoice={invoice} client={client} profile={profile} totals={totals} />;
      case 'corporate':
        return <CorporateTemplate invoice={invoice} client={client} profile={profile} totals={totals} />;
      case 'studio':
        return <StudioTemplate invoice={invoice} client={client} profile={profile} totals={totals} />;
      case 'modern':
      default:
        return <ModernTemplate invoice={invoice} client={client} profile={profile} totals={totals} />;
    }
  };

  return (
    <div className="w-[794px] min-h-[1122px] flex flex-col bg-white">
      {renderTemplate()}
    </div>
  );
}
