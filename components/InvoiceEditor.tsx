import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Invoice, Client, Profile, LineItem, InvoiceStatus, TemplateType } from '../types';
import { Plus, Trash2, Download, Save, ArrowLeft, Sparkles, LayoutTemplate, CreditCard, ExternalLink, Link as LinkIcon, Copy, Check, Upload, Image as ImageIcon, Settings as SettingsIcon, ChevronDown, ChevronUp, RotateCcw, Eye, EyeOff, Palette, FileText, DollarSign, Calendar } from 'lucide-react';
import { CURRENCIES, DEFAULT_LABELS } from '../constants';
import InvoicePreview from './InvoicePreview';
import { enhanceDescription, analyzeBrandColors } from '../services/geminiService';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface InvoiceEditorProps {
  profile: Profile;
  setProfile: (p: Profile) => void;
  clients: Client[];
  existingInvoices?: Invoice[];
  initialData: Invoice | null;
  onSave: (invoice: Invoice) => void;
  onCancel: () => void;
}

export default function InvoiceEditor({ profile, setProfile, clients, existingInvoices = [], initialData, onSave, onCancel }: InvoiceEditorProps) {
  // --- Numbering Logic ---
  const generateNextInvoiceNumber = (format: string, invoices: Invoice[]) => {
    const currentYear = new Date().getFullYear().toString();
    const prefix = format.split('{NNNN}')[0].replace('{YYYY}', currentYear);

    // Find all invoices matching this pattern
    const matchingInvoices = invoices.filter(inv => inv.number.startsWith(prefix));

    let maxNum = 0;
    matchingInvoices.forEach(inv => {
      const numPart = inv.number.replace(prefix, '');
      const num = parseInt(numPart, 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    });

    const nextNum = maxNum + 1;
    const padding = format.includes('{NNNN}') ? 4 : 2; // naive padding check
    return prefix + nextNum.toString().padStart(padding, '0');
  };

  const [invoiceData, setInvoiceData] = useState<Invoice>(() => {
    if (initialData) return initialData;

    // Generate new data
    return {
      id: `inv-${Date.now()}`,
      number: generateNextInvoiceNumber(profile.invoiceFormat || 'INV-{YYYY}-{NNNN}', existingInvoices),
      clientId: clients[0]?.id || '',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      status: 'draft' as InvoiceStatus,
      items: [{ id: '1', description: 'Consultation', quantity: 1, unitPrice: 0 }],

      taxRate: 0,
      taxType: 'percent',
      taxValue: 0,
      discountType: 'percent',
      discountValue: 0,
      shipping: 0,
      amountPaid: 0,
      currency: profile.currency || 'USD',
      notes: 'Thank you for your business!',
      terms: 'Payment is due within 14 days.',
      template: 'modern',
      layout: 'portrait',
      paymentLink: profile.defaultPaymentLink || '',
      labels: DEFAULT_LABELS
    };
  });

  const [hoveredTemplate, setHoveredTemplate] = useState<TemplateType | null>(null);
  const [loadingAI, setLoadingAI] = useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Toggles for optional fields
  const [showDiscount, setShowDiscount] = useState(false);
  const [showTax, setShowTax] = useState(false);
  const [showShipping, setShowShipping] = useState(false);
  const [showAmountPaid, setShowAmountPaid] = useState(false);
  const [showLabels, setShowLabels] = useState(false);

  // Initialize toggles based on data
  useEffect(() => {
    if (invoiceData.discountValue > 0) setShowDiscount(true);
    if (invoiceData.taxValue > 0) setShowTax(true);
    if (invoiceData.shipping > 0) setShowShipping(true);
    if (invoiceData.amountPaid > 0) setShowAmountPaid(true);
  }, []);

  // Derived invoice state for previewing templates on hover
  const previewInvoice = useMemo(() => ({
    ...invoiceData,
    template: hoveredTemplate || invoiceData.template
  }), [invoiceData, hoveredTemplate]);

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setInvoiceData({ ...invoiceData, clientId: e.target.value });
  };

  const handleItemChange = (id: string, field: keyof LineItem, value: string | number) => {
    setInvoiceData(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const addItem = () => {
    setInvoiceData(prev => ({
      ...prev,
      items: [...prev.items, { id: `item-${Date.now()}`, description: '', quantity: 1, unitPrice: 0 }]
    }));
  };

  const removeItem = (id: string) => {
    setInvoiceData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  const handleAIEnhance = async (itemId: string, currentText: string) => {
    if (!currentText) return;
    setLoadingAI(itemId);
    const improvedText = await enhanceDescription(currentText);
    handleItemChange(itemId, 'description', improvedText);
    setLoadingAI(null);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateStripeLink = () => {
    setIsGeneratingLink(true);
    setTimeout(() => {
      const fakeLink = `https://checkout.stripe.com/pay/inv_${Math.random().toString(36).substr(2, 10)}`;
      setInvoiceData({ ...invoiceData, paymentLink: fakeLink });
      setIsGeneratingLink(false);
    }, 1500);
  };

  const copyToClipboard = () => {
    if (invoiceData.paymentLink) {
      navigator.clipboard.writeText(invoiceData.paymentLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  }

  const resetLabels = () => {
    setInvoiceData({ ...invoiceData, labels: DEFAULT_LABELS });
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('pdf-render-container');
    if (!element) {
      console.error("PDF container not found");
      return;
    }

    setGeneratingPdf(true);

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: invoiceData.layout === 'landscape' ? 1123 : 794,
        height: invoiceData.layout === 'landscape' ? 794 : 1123,
        windowWidth: 1600,
      });

      const imgData = canvas.toDataURL('image/png');
      const isLandscape = invoiceData.layout === 'landscape';
      const pdf = new jsPDF({
        orientation: isLandscape ? 'l' : 'p',
        unit: 'mm',
        format: 'a4'
      });

      pdf.addImage(imgData, 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight(), undefined, 'FAST');
      pdf.save(`${invoiceData.number}.pdf`);
    } catch (err) {
      console.error("PDF Generation failed:", err);
      alert(`PDF Generation failed: ${err instanceof Error ? err.message : 'Unknown error'}.`);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const client = clients.find(c => c.id === invoiceData.clientId) || { name: '', email: '', address: '', id: '' };

  // Calculations
  const subtotal = invoiceData.items.reduce((a, i) => a + (i.quantity * i.unitPrice), 0);
  const discount = showDiscount ? (invoiceData.discountType === 'percent' ? subtotal * (invoiceData.discountValue / 100) : invoiceData.discountValue) : 0;
  const taxable = subtotal - discount;
  const tax = showTax ? (invoiceData.taxType === 'percent' ? taxable * (invoiceData.taxValue / 100) : invoiceData.taxValue) : 0;
  const shipping = showShipping ? (invoiceData.shipping || 0) : 0;
  const total = taxable + tax + shipping;
  const balanceDue = total - (showAmountPaid ? (invoiceData.amountPaid || 0) : 0);

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white selection:bg-lime-500/30">
      {/* Toolbar */}
      <div className="h-20 border-b border-white/5 bg-slate-900/50 backdrop-blur-xl px-8 flex items-center justify-between flex-shrink-0 z-20 relative">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-display font-semibold text-white tracking-wide">
            {initialData ? 'Edit Invoice' : 'New Invoice'}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadPDF}
            disabled={generatingPdf}
            className="flex items-center gap-2 px-5 py-2.5 text-slate-300 hover:text-white hover:bg-white/5 rounded-xl font-medium transition-all disabled:opacity-50 border border-transparent hover:border-white/10"
          >
            {generatingPdf ? (
              <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download size={18} />
            )}
            <span className="hidden sm:inline font-light tracking-wide">Download PDF</span>
          </button>
          <button
            onClick={() => onSave(invoiceData)}
            className="flex items-center gap-2 px-6 py-2.5 bg-lime-400 hover:bg-lime-300 text-slate-950 rounded-xl font-medium transition-all shadow-[0_0_20px_rgba(132,204,22,0.3)] hover:shadow-[0_0_30px_rgba(132,204,22,0.5)] hover:scale-105 active:scale-95"
          >
            <Save size={18} />
            <span className="font-medium tracking-wide">Save Invoice</span>
          </button>
        </div>
      </div>

      {/* Split View Content */}
      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row relative">

        {/* Editor Form (Left) */}
        <div className="w-full lg:w-1/2 overflow-y-auto p-6 lg:p-10 bg-slate-900/50 backdrop-blur-xl border-r border-white/5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          <div className="space-y-8 max-w-2xl mx-auto">

            {/* Template & Brand Card */}
            <div className="bg-white/[0.03] p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-medium text-lime-400 uppercase tracking-widest flex items-center gap-2">
                  <LayoutTemplate size={16} />
                  Template & Design
                </h3>
                <label className="cursor-pointer text-xs text-slate-400 hover:text-lime-400 font-medium flex items-center gap-2 transition-colors bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 hover:border-lime-500/30">
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  <Upload size={14} />
                  Upload Logo
                </label>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Select Template</label>
                  <div className="relative group">
                    <select
                      value={invoiceData.template}
                      onChange={(e) => setInvoiceData({ ...invoiceData, template: e.target.value as TemplateType })}
                      className="w-full appearance-none bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-lime-500 outline-none capitalize transition-all group-hover:border-white/20"
                    >
                      {(['modern', 'classic', 'minimal', 'bold', 'agency', 'boutique', 'tech', 'finance', 'creative', 'simple'] as TemplateType[]).map(t => (
                        <option key={t} value={t} className="bg-slate-900 capitalize">{t} Template</option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ChevronDown size={14} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-4">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <div className="w-3 h-3 rounded-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: profile.brandColor, color: profile.brandColor }}></div>
                    <span className="font-light tracking-wide">Brand Color Active</span>
                  </div>

                  <div className="flex bg-black/20 p-1 rounded-lg border border-white/5">
                    <button
                      onClick={() => setInvoiceData({ ...invoiceData, layout: 'portrait' })}
                      className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${invoiceData.layout === 'portrait' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      Portrait
                    </button>
                    <button
                      onClick={() => setInvoiceData({ ...invoiceData, layout: 'landscape' })}
                      className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${invoiceData.layout === 'landscape' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      Landscape
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice Details Card */}
            <div className="bg-white/[0.03] p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
              <h3 className="text-sm font-medium text-lime-400 uppercase tracking-widest flex items-center gap-2 mb-6">
                <FileText size={16} />
                Invoice Details
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="group">
                  <label className="block text-[10px] font-medium text-slate-500 mb-1.5 uppercase tracking-wider group-focus-within:text-lime-400 transition-colors">Invoice Number</label>
                  <input
                    type="text"
                    value={invoiceData.number}
                    onChange={(e) => setInvoiceData({ ...invoiceData, number: e.target.value })}
                    className="w-full rounded-xl bg-black/20 border border-white/10 p-3 text-sm text-white focus:ring-1 focus:ring-lime-500 focus:border-lime-500 transition-all outline-none font-mono"
                  />
                </div>
                <div className="group">
                  <label className="block text-[10px] font-medium text-slate-500 mb-1.5 uppercase tracking-wider group-focus-within:text-lime-400 transition-colors">Client</label>
                  <div className="relative">
                    <select
                      value={invoiceData.clientId}
                      onChange={handleClientChange}
                      className="w-full rounded-xl bg-black/20 border border-white/10 p-3 text-sm text-white focus:ring-1 focus:ring-lime-500 focus:border-lime-500 transition-all outline-none appearance-none"
                    >
                      {clients.map(c => <option key={c.id} value={c.id} className="bg-slate-900 text-white">{c.name}</option>)}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ChevronDown size={14} />
                    </div>
                  </div>
                </div>
                <div className="group">
                  <label className="block text-[10px] font-medium text-slate-500 mb-1.5 uppercase tracking-wider group-focus-within:text-lime-400 transition-colors">Issue Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={invoiceData.issueDate}
                      onChange={(e) => setInvoiceData({ ...invoiceData, issueDate: e.target.value })}
                      className="w-full rounded-xl bg-black/20 border border-white/10 p-3 text-sm text-white focus:ring-1 focus:ring-lime-500 focus:border-lime-500 transition-all outline-none [color-scheme:dark]"
                    />
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
                  </div>
                </div>
                <div className="group">
                  <label className="block text-[10px] font-medium text-slate-500 mb-1.5 uppercase tracking-wider group-focus-within:text-lime-400 transition-colors">Due Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={invoiceData.dueDate}
                      onChange={(e) => setInvoiceData({ ...invoiceData, dueDate: e.target.value })}
                      className="w-full rounded-xl bg-black/20 border border-white/10 p-3 text-sm text-white focus:ring-1 focus:ring-lime-500 focus:border-lime-500 transition-all outline-none [color-scheme:dark]"
                    />
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
                  </div>
                </div>
                <div className="group">
                  <label className="block text-[10px] font-medium text-slate-500 mb-1.5 uppercase tracking-wider group-focus-within:text-lime-400 transition-colors">PO Number</label>
                  <input
                    type="text"
                    value={invoiceData.poNumber || ''}
                    onChange={(e) => setInvoiceData({ ...invoiceData, poNumber: e.target.value })}
                    className="w-full rounded-xl bg-black/20 border border-white/10 p-3 text-sm text-white focus:ring-1 focus:ring-lime-500 focus:border-lime-500 transition-all outline-none"
                    placeholder="Optional"
                  />
                </div>
                <div className="group">
                  <label className="block text-[10px] font-medium text-slate-500 mb-1.5 uppercase tracking-wider group-focus-within:text-lime-400 transition-colors">Currency</label>
                  <div className="relative">
                    <select
                      value={invoiceData.currency}
                      onChange={(e) => setInvoiceData({ ...invoiceData, currency: e.target.value })}
                      className="w-full rounded-xl bg-black/20 border border-white/10 p-3 text-sm text-white focus:ring-1 focus:ring-lime-500 focus:border-lime-500 transition-all outline-none appearance-none"
                    >
                      {CURRENCIES.map(c => <option key={c.code} value={c.code} className="bg-slate-900">{c.code} - {c.name}</option>)}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ChevronDown size={14} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items Card */}
            <div className="bg-white/[0.03] p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
              <h3 className="text-sm font-medium text-lime-400 uppercase tracking-widest flex items-center gap-2 mb-6">
                <span className="w-1 h-4 bg-lime-500 rounded-full"></span>
                Line Items
              </h3>
              <div className="space-y-3">
                {invoiceData.items.map((item, index) => (
                  <div key={item.id} className="flex gap-3 items-start bg-black/20 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors group">
                    <div className="flex-1 space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Description"
                          value={item.description}
                          onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                          className="flex-1 rounded-lg bg-transparent border-b border-white/10 p-2 text-sm text-white focus:border-lime-500 outline-none transition-colors placeholder:text-slate-600"
                        />
                        <button
                          onClick={() => handleAIEnhance(item.id, item.description)}
                          disabled={loadingAI === item.id || !item.description}
                          className={`p-2 rounded-lg text-lime-400 hover:bg-lime-400/10 transition-colors ${loadingAI === item.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title="Enhance with AI"
                        >
                          {loadingAI === item.id ? (
                            <div className="w-4 h-4 border-2 border-lime-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Sparkles size={16} />
                          )}
                        </button>
                      </div>
                      <div className="flex gap-4">
                        <div className="w-24">
                          <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 block">Qty</label>
                          <input
                            type="number"
                            min="0"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value))}
                            className="w-full rounded-lg bg-white/5 border border-white/10 p-2 text-sm text-white focus:border-lime-500 outline-none"
                          />
                        </div>
                        <div className="w-32 relative">
                          <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 block">Price</label>
                          <span className="absolute left-3 top-[29px] text-slate-500 text-xs">{CURRENCIES.find(c => c.code === invoiceData.currency)?.symbol || '$'}</span>
                          <input
                            type="number"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value))}
                            className="w-full rounded-lg bg-white/5 border border-white/10 p-2 text-sm text-white pl-6 focus:border-lime-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="text-right pt-8 w-24">
                      <div className="font-mono font-medium text-lime-400 text-lg">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: invoiceData.currency }).format(item.quantity * item.unitPrice)}
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-slate-600 hover:text-red-400 p-2 mt-7 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={addItem}
                className="mt-4 flex items-center gap-2 text-sm font-medium text-lime-400 hover:text-lime-300 transition-colors px-3 py-2 rounded-lg hover:bg-lime-400/10 border border-transparent hover:border-lime-400/20"
              >
                <Plus size={16} />
                Add Line Item
              </button>
            </div>

            {/* Totals & Configuration Card */}
            <div className="bg-white/[0.03] p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
              <h3 className="text-sm font-medium text-lime-400 uppercase tracking-widest flex items-center gap-2 mb-6">
                <DollarSign size={16} />
                Totals & Adjustments
              </h3>

              <div className="space-y-6">
                {/* Subtotal */}
                <div className="flex justify-between text-sm text-slate-400">
                  <span>Subtotal</span>
                  <span className="font-mono text-white">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: invoiceData.currency }).format(subtotal)}
                  </span>
                </div>

                {/* Discount Toggle & Input */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setShowDiscount(!showDiscount)}
                        className={`w-10 h-5 rounded-full transition-colors relative ${showDiscount ? 'bg-lime-500' : 'bg-white/10'}`}
                      >
                        <div className={`w-3 h-3 rounded-full bg-white absolute top-1 transition-all ${showDiscount ? 'left-6' : 'left-1'}`} />
                      </button>
                      <span className="text-sm text-slate-300">Add Discount</span>
                    </div>
                  </div>
                  {showDiscount && (
                    <div className="flex gap-4 items-center bg-black/20 p-3 rounded-xl border border-white/5 animate-in slide-in-from-top-2 fade-in duration-200">
                      <div className="flex bg-black/40 rounded-lg p-1 border border-white/10">
                        <button
                          onClick={() => setInvoiceData({ ...invoiceData, discountType: 'percent' })}
                          className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${invoiceData.discountType === 'percent' ? 'bg-lime-400 text-slate-950' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                          %
                        </button>
                        <button
                          onClick={() => setInvoiceData({ ...invoiceData, discountType: 'amount' })}
                          className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${invoiceData.discountType === 'amount' ? 'bg-lime-400 text-slate-950' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                          $
                        </button>
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={invoiceData.discountValue}
                        onChange={(e) => setInvoiceData({ ...invoiceData, discountValue: parseFloat(e.target.value) })}
                        className="flex-1 rounded-lg bg-transparent border-none p-2 text-sm text-white focus:ring-0 outline-none text-right font-mono"
                        placeholder="0"
                      />
                    </div>
                  )}
                </div>

                {/* Tax Toggle & Input */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setShowTax(!showTax)}
                        className={`w-10 h-5 rounded-full transition-colors relative ${showTax ? 'bg-lime-500' : 'bg-white/10'}`}
                      >
                        <div className={`w-3 h-3 rounded-full bg-white absolute top-1 transition-all ${showTax ? 'left-6' : 'left-1'}`} />
                      </button>
                      <span className="text-sm text-slate-300">Add Tax</span>
                    </div>
                  </div>
                  {showTax && (
                    <div className="flex gap-4 items-center bg-black/20 p-3 rounded-xl border border-white/5 animate-in slide-in-from-top-2 fade-in duration-200">
                      <div className="flex bg-black/40 rounded-lg p-1 border border-white/10">
                        <button
                          onClick={() => setInvoiceData({ ...invoiceData, taxType: 'percent' })}
                          className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${invoiceData.taxType === 'percent' ? 'bg-lime-400 text-slate-950' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                          %
                        </button>
                        <button
                          onClick={() => setInvoiceData({ ...invoiceData, taxType: 'amount' })}
                          className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${invoiceData.taxType === 'amount' ? 'bg-lime-400 text-slate-950' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                          $
                        </button>
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={invoiceData.taxValue}
                        onChange={(e) => setInvoiceData({ ...invoiceData, taxValue: parseFloat(e.target.value) })}
                        className="flex-1 rounded-lg bg-transparent border-none p-2 text-sm text-white focus:ring-0 outline-none text-right font-mono"
                        placeholder="0"
                      />
                    </div>
                  )}
                </div>

                {/* Shipping Toggle & Input */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setShowShipping(!showShipping)}
                        className={`w-10 h-5 rounded-full transition-colors relative ${showShipping ? 'bg-lime-500' : 'bg-white/10'}`}
                      >
                        <div className={`w-3 h-3 rounded-full bg-white absolute top-1 transition-all ${showShipping ? 'left-6' : 'left-1'}`} />
                      </button>
                      <span className="text-sm text-slate-300">Add Shipping</span>
                    </div>
                  </div>
                  {showShipping && (
                    <div className="flex gap-4 items-center bg-black/20 p-3 rounded-xl border border-white/5 animate-in slide-in-from-top-2 fade-in duration-200">
                      <span className="text-xs font-bold text-slate-500 px-2">$</span>
                      <input
                        type="number"
                        min="0"
                        value={invoiceData.shipping}
                        onChange={(e) => setInvoiceData({ ...invoiceData, shipping: parseFloat(e.target.value) })}
                        className="flex-1 rounded-lg bg-transparent border-none p-2 text-sm text-white focus:ring-0 outline-none text-right font-mono"
                        placeholder="0.00"
                      />
                    </div>
                  )}
                </div>

                {/* Amount Paid Toggle & Input */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setShowAmountPaid(!showAmountPaid)}
                        className={`w-10 h-5 rounded-full transition-colors relative ${showAmountPaid ? 'bg-lime-500' : 'bg-white/10'}`}
                      >
                        <div className={`w-3 h-3 rounded-full bg-white absolute top-1 transition-all ${showAmountPaid ? 'left-6' : 'left-1'}`} />
                      </button>
                      <span className="text-sm text-slate-300">Amount Paid</span>
                    </div>
                  </div>
                  {showAmountPaid && (
                    <div className="flex gap-4 items-center bg-black/20 p-3 rounded-xl border border-white/5 animate-in slide-in-from-top-2 fade-in duration-200">
                      <span className="text-xs font-bold text-slate-500 px-2">$</span>
                      <input
                        type="number"
                        min="0"
                        value={invoiceData.amountPaid}
                        onChange={(e) => setInvoiceData({ ...invoiceData, amountPaid: parseFloat(e.target.value) })}
                        className="flex-1 rounded-lg bg-transparent border-none p-2 text-sm text-white focus:ring-0 outline-none text-right font-mono"
                        placeholder="0.00"
                      />
                    </div>
                  )}
                </div>

                {/* Final Totals */}
                <div className="pt-6 border-t border-white/10 space-y-3">
                  <div className="flex justify-between font-bold text-2xl text-white">
                    <span className="font-display tracking-wide">Total</span>
                    <span className="text-lime-400 font-mono">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: invoiceData.currency }).format(total)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-red-400 font-medium pt-2 border-t border-white/5">
                    <span>Balance Due</span>
                    <span className="font-mono">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: invoiceData.currency }).format(balanceDue)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Collapsible Labels Section */}
            <div className="bg-white/[0.03] rounded-2xl border border-white/5 overflow-hidden">
              <button
                onClick={() => setShowLabels(!showLabels)}
                className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors"
              >
                <h3 className="text-sm font-medium text-lime-400 uppercase tracking-widest flex items-center gap-2">
                  <Palette size={16} />
                  Customize Labels
                </h3>
                <div className="text-slate-400">
                  {showLabels ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </button>

              {showLabels && (
                <div className="p-6 pt-0 border-t border-white/5 animate-in slide-in-from-top-2">
                  <div className="flex justify-end mb-4">
                    <button
                      onClick={resetLabels}
                      className="text-[10px] uppercase font-bold text-slate-500 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      <RotateCcw size={12} />
                      Reset to Defaults
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(invoiceData.labels || DEFAULT_LABELS).map(([key, value]) => (
                      <div key={key} className="group">
                        <label className="block text-[10px] font-medium text-slate-500 mb-1 uppercase tracking-wider group-focus-within:text-lime-400 transition-colors">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </label>
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => setInvoiceData({
                            ...invoiceData,
                            labels: { ...invoiceData.labels, [key]: e.target.value }
                          })}
                          className="w-full rounded-lg bg-black/20 border border-white/10 p-2 text-xs text-white focus:ring-1 focus:ring-lime-500 focus:border-lime-500 transition-all outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Payment & Notes Card */}
            <div className="bg-white/[0.03] p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-medium text-lime-400 uppercase tracking-widest flex items-center gap-2">
                  <CreditCard size={16} />
                  Payment & Notes
                </h3>
                {profile.defaultPaymentLink && !invoiceData.paymentLink && (
                  <button
                    onClick={() => setInvoiceData({ ...invoiceData, paymentLink: profile.defaultPaymentLink })}
                    className="text-xs text-slate-400 hover:text-white font-medium transition-colors"
                  >
                    Use Default Link
                  </button>
                )}
              </div>

              <div className="space-y-6">
                {!invoiceData.paymentLink ? (
                  <div className="text-center p-6 bg-black/20 rounded-xl border border-white/5 border-dashed group hover:border-white/10 transition-colors">
                    <p className="text-xs text-slate-400 mb-4 font-light">Accept payments online securely via Stripe.</p>
                    <button
                      onClick={handleGenerateStripeLink}
                      disabled={isGeneratingLink}
                      className="bg-white text-slate-950 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-slate-200 flex items-center gap-2 mx-auto disabled:opacity-70 shadow-lg transition-all"
                    >
                      {isGeneratingLink ? (
                        <>
                          <div className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <CreditCard size={14} />
                          Create Payment Link
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="bg-lime-500/10 border border-lime-500/20 p-4 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-lime-400 uppercase tracking-widest">Active Payment Link</span>
                      <button onClick={() => setInvoiceData({ ...invoiceData, paymentLink: '' })} className="text-red-400 hover:text-red-300 p-1" title="Remove Link">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-300 truncate font-mono flex items-center gap-2">
                        <LinkIcon size={12} className="text-slate-500" />
                        {invoiceData.paymentLink}
                      </div>
                      <button
                        onClick={copyToClipboard}
                        className="bg-black/40 border border-white/10 text-lime-400 px-3 rounded-lg hover:bg-lime-400/10 transition-colors"
                        title="Copy Link"
                      >
                        {copiedLink ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Notes / Terms</label>
                  <textarea
                    value={invoiceData.notes}
                    onChange={(e) => setInvoiceData({ ...invoiceData, notes: e.target.value })}
                    rows={4}
                    placeholder="e.g. Payment due within 14 days. Thank you!"
                    className="w-full rounded-xl bg-black/20 border border-white/10 p-3 text-sm text-white focus:ring-1 focus:ring-lime-500 focus:border-lime-500 transition-all outline-none placeholder:text-slate-600"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Live Preview (Right) */}
        <div className="hidden lg:flex w-1/2 bg-black/20 overflow-y-auto flex-col items-center relative py-12 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          <div className="sticky top-0 z-10 bg-black/50 backdrop-blur-md px-4 py-1.5 rounded-full text-slate-300 text-[10px] font-bold shadow-lg uppercase tracking-widest border border-white/10 mb-8 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${generatingPdf ? 'bg-yellow-500 animate-pulse' : 'bg-lime-500'}`}></div>
            {hoveredTemplate ? `Previewing: ${hoveredTemplate}` : 'Live Preview'}
          </div>

          <div className="origin-top transform scale-[0.65] xl:scale-[0.75] 2xl:scale-[0.85] transition-transform duration-300 shadow-[0_0_50px_rgba(0,0,0,0.5)] mb-24">
            {/* ID used for HTML2Canvas */}
            <div
              id="invoice-preview-container"
              className={`bg-white flex flex-col shadow-2xl transition-all duration-300 ${invoiceData.layout === 'landscape' ? 'w-[297mm] min-h-[210mm]' : 'w-[210mm] min-h-[297mm]'}`}
            >
              <InvoicePreview invoice={previewInvoice} client={client} profile={profile} />
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Container for Pixel-Perfect PDF Generation */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0, overflow: 'hidden' }}>
        <div
          id="pdf-render-container"
          style={{
            width: invoiceData.layout === 'landscape' ? '1123px' : '794px', // A4 width at 96 DPI
            minHeight: invoiceData.layout === 'landscape' ? '794px' : '1123px', // A4 height at 96 DPI
            backgroundColor: 'white',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <InvoicePreview invoice={invoiceData} client={client} profile={profile} />
        </div>
      </div>

    </div>
  );
}
