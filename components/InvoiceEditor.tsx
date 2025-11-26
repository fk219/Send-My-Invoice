import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Invoice, Client, Profile, LineItem, InvoiceStatus, TemplateType } from '../types';
import { Plus, Trash2, Download, Save, ArrowLeft, Sparkles, LayoutTemplate, CreditCard, ExternalLink, Link as LinkIcon, Copy, Check, Upload, Image as ImageIcon } from 'lucide-react';
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
      notes: 'Thank you for your business!',
      template: 'modern',
      layout: 'portrait',
      paymentLink: profile.defaultPaymentLink || ''
    };
  });

  const [hoveredTemplate, setHoveredTemplate] = useState<TemplateType | null>(null);
  const [loadingAI, setLoadingAI] = useState<string | null>(null);
  const [analyzingBrand, setAnalyzingBrand] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

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
    // Simulate network request to create a Checkout Session
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

  const handleDownloadPDF = async () => {
    const element = document.getElementById('invoice-preview-container');
    if (!element) return;

    setGeneratingPdf(true);

    try {
      // 1. Clone the node to remove transforms (scaling) which confuses html2canvas
      const clone = element.cloneNode(true) as HTMLElement;

      // 2. Pre-process clone: Ensure all images are fully loaded to avoid blank spots
      const images = clone.getElementsByTagName('img');
      await Promise.all(Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }));

      // 3. Setup container
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.top = '-10000px';
      container.style.left = '0';
      container.style.width = '210mm'; // Standard A4 width
      container.style.height = 'auto'; // Allow height to expand for multi-page content
      container.appendChild(clone);
      document.body.appendChild(container);

      // --- LINK DETECTION ---
      // We need to find where the "Pay Invoice" link is in the DOM so we can overlay a PDF link annotation later.
      const linkElements = clone.querySelectorAll('[data-pdf-link="true"]');
      const linkRects: { x: number, y: number, w: number, h: number, url: string }[] = [];

      const cloneRect = clone.getBoundingClientRect();

      linkElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        // Calculate relative position inside the captured area
        linkRects.push({
          x: rect.left - cloneRect.left,
          y: rect.top - cloneRect.top,
          w: rect.width,
          h: rect.height,
          url: (el as HTMLAnchorElement).href
        });
      });

      // 4. Generate canvas from the clean clone
      const canvas = await html2canvas(clone, {
        scale: 2, // High res
        useCORS: true,
        logging: false,
        allowTaint: true,
        backgroundColor: '#ffffff', // Force white background
        width: 794, // A4 width in px at 96 DPI
        windowWidth: 1200
      });

      // 5. Cleanup DOM
      document.body.removeChild(container);

      const imgData = canvas.toDataURL('image/png');

      // 6. Generate PDF
      const isLandscape = invoiceData.layout === 'landscape';
      const pdf = new jsPDF({
        orientation: isLandscape ? 'l' : 'p',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

      const layoutWidthPx = cloneRect.width;
      const pxToMm = pdfWidth / layoutWidthPx;

      let heightLeft = imgHeight;
      let position = 0;
      let pageNumber = 1;

      // Add First Page
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');

      const addLinksToPage = (pageOffsetMm: number) => {
        linkRects.forEach(link => {
          // Convert DOM Layout Px coordinates to PDF Mm
          const linkYMm = link.y * pxToMm;
          const linkXMm = link.x * pxToMm;
          const linkHMm = link.h * pxToMm;
          const linkWMm = link.w * pxToMm;

          // Check if link falls on this page
          // Current page covers [pageOffsetMm, pageOffsetMm + pdfHeight]
          if (linkYMm >= pageOffsetMm && linkYMm < (pageOffsetMm + pdfHeight)) {
            // Calculate relative Y on this specific page
            const relativeY = linkYMm - pageOffsetMm;
            // Add link annotation
            pdf.link(linkXMm, relativeY, linkWMm, linkHMm, { url: link.url });
          }
        });
      }

      addLinksToPage(0);
      heightLeft -= pdfHeight;

      // Add Subsequent Pages
      // Tolerance of 2mm to avoid blank pages due to rounding errors
      while (heightLeft >= 2) {
        position = position - pdfHeight;
        pdf.addPage();
        pageNumber++;
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');

        // The offset for page N is (N-1) * pdfHeight
        addLinksToPage((pageNumber - 1) * pdfHeight);

        heightLeft -= pdfHeight;
      }

      pdf.save(`${invoiceData.number}.pdf`);
    } catch (err) {
      console.error("PDF Generation failed:", err);
      alert(`PDF Generation failed: ${err instanceof Error ? err.message : 'Unknown error'}. Please ensure images are accessible.`);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const client = clients.find(c => c.id === invoiceData.clientId) || { name: '', email: '', address: '', id: '' };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="h-20 border-b border-white/5 bg-white/[0.02] backdrop-blur-xl px-8 flex items-center justify-between flex-shrink-0 z-20 relative">
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
        <div className="w-full lg:w-1/2 overflow-y-auto p-8 bg-transparent border-r border-white/5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          <div className="space-y-8 max-w-2xl mx-auto">

            {/* Template Selection */}
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-medium text-lime-400 uppercase tracking-widest flex items-center gap-2">
                  <LayoutTemplate size={16} />
                  Template & Brand
                </h3>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer text-xs text-slate-400 hover:text-lime-400 font-medium flex items-center gap-2 transition-colors">
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    <Upload size={14} />
                    Upload Logo
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(['modern', 'classic', 'minimal', 'bold', 'agency', 'boutique', 'tech', 'finance', 'creative', 'simple'] as TemplateType[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setInvoiceData({ ...invoiceData, template: t })}
                    onMouseEnter={() => setHoveredTemplate(t)}
                    onMouseLeave={() => setHoveredTemplate(null)}
                    className={`relative px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left group overflow-hidden ${invoiceData.template === t
                      ? 'border-lime-500/50 bg-lime-500/10 text-lime-400 ring-1 ring-lime-500/20 shadow-[0_0_15px_rgba(132,204,22,0.1)]'
                      : 'border-white/5 bg-white/[0.02] text-slate-400 hover:border-white/20 hover:bg-white/5 hover:text-slate-200'
                      }`}
                  >
                    <div className="flex justify-between items-center mb-2 relative z-10">
                      <span className="capitalize font-display tracking-wide">{t}</span>
                      {invoiceData.template === t && <Check size={14} className="text-lime-400" />}
                    </div>
                    <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden relative z-10">
                      <div
                        className={`h-full transition-all duration-300 ${t === 'modern' ? 'w-2/3 bg-slate-400' :
                          t === 'bold' ? 'w-full bg-indigo-500' :
                            t === 'agency' ? 'w-full bg-zinc-600' :
                              t === 'boutique' ? 'w-full border-b border-white/50' :
                                t === 'minimal' ? 'w-1/3 border border-white/30' :
                                  t === 'tech' ? 'w-full bg-cyan-900 border-b-2 border-cyan-500' :
                                    t === 'finance' ? 'w-full border-t-4 border-blue-900 bg-white/10' :
                                      t === 'creative' ? 'w-1/2 bg-orange-400 rounded-r-lg' :
                                        t === 'simple' ? 'w-full border-t border-slate-500' :
                                          'w-1/2 bg-orange-100'
                          }`}
                        style={t === 'bold' ? { backgroundColor: profile.brandColor } : {}}
                      />
                    </div>
                  </button>
                ))}
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
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

            {/* Meta Data */}
            <div className="grid grid-cols-2 gap-6">
              <div className="group">
                <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider group-focus-within:text-lime-400 transition-colors">Invoice Number</label>
                <input
                  type="text"
                  value={invoiceData.number}
                  onChange={(e) => setInvoiceData({ ...invoiceData, number: e.target.value })}
                  className="w-full rounded-xl bg-white/5 border border-white/10 p-3 text-sm text-white focus:ring-1 focus:ring-lime-500 focus:border-lime-500 transition-all outline-none font-mono"
                />
              </div>
              <div className="group">
                <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider group-focus-within:text-lime-400 transition-colors">Client</label>
                <select
                  value={invoiceData.clientId}
                  onChange={handleClientChange}
                  className="w-full rounded-xl bg-white/5 border border-white/10 p-3 text-sm text-white focus:ring-1 focus:ring-lime-500 focus:border-lime-500 transition-all outline-none appearance-none"
                >
                  {clients.map(c => <option key={c.id} value={c.id} className="bg-slate-900 text-white">{c.name}</option>)}
                </select>
              </div>
              <div className="group">
                <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider group-focus-within:text-lime-400 transition-colors">Issue Date</label>
                <input
                  type="date"
                  value={invoiceData.issueDate}
                  onChange={(e) => setInvoiceData({ ...invoiceData, issueDate: e.target.value })}
                  className="w-full rounded-xl bg-white/5 border border-white/10 p-3 text-sm text-white focus:ring-1 focus:ring-lime-500 focus:border-lime-500 transition-all outline-none [color-scheme:dark]"
                />
              </div>
              <div className="group">
                <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider group-focus-within:text-lime-400 transition-colors">Due Date</label>
                <input
                  type="date"
                  value={invoiceData.dueDate}
                  onChange={(e) => setInvoiceData({ ...invoiceData, dueDate: e.target.value })}
                  className="w-full rounded-xl bg-white/5 border border-white/10 p-3 text-sm text-white focus:ring-1 focus:ring-lime-500 focus:border-lime-500 transition-all outline-none [color-scheme:dark]"
                />
              </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-8" />

            {/* Line Items */}
            <div>
              <h3 className="font-display font-medium text-white text-lg mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-lime-500 rounded-full"></span>
                Line Items
              </h3>
              <div className="space-y-3">
                {invoiceData.items.map((item, index) => (
                  <div key={item.id} className="flex gap-3 items-start bg-white/[0.02] p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors group">
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
                          <span className="absolute left-3 top-[29px] text-slate-500">$</span>
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
                        ${(item.quantity * item.unitPrice).toFixed(2)}
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
                className="mt-4 flex items-center gap-2 text-sm font-medium text-lime-400 hover:text-lime-300 transition-colors px-2 py-1 rounded hover:bg-lime-400/10"
              >
                <Plus size={16} />
                Add Line Item
              </button>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-8" />

            {/* Payment & Notes */}
            <div className="space-y-8">

              {/* Payment Link Section */}
              <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-lime-400 uppercase tracking-widest flex items-center gap-2">
                    <CreditCard size={16} />
                    Payment Integration
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

                {!invoiceData.paymentLink ? (
                  <div className="text-center p-8 bg-black/20 rounded-xl border border-white/5 border-dashed group hover:border-white/10 transition-colors">
                    <p className="text-sm text-slate-400 mb-4 font-light">Accept payments online securely via Stripe.</p>
                    <button
                      onClick={handleGenerateStripeLink}
                      disabled={isGeneratingLink}
                      className="bg-white text-slate-950 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-200 flex items-center gap-2 mx-auto disabled:opacity-70 shadow-lg transition-all"
                    >
                      {isGeneratingLink ? (
                        <>
                          <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                          Creating Session...
                        </>
                      ) : (
                        <>
                          <CreditCard size={16} />
                          Create Stripe Checkout Link
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
                    <p className="text-[10px] text-lime-500/70 uppercase tracking-wider">
                      This link will be embedded in the invoice PDF.
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Notes / Terms</label>
                  <textarea
                    value={invoiceData.notes}
                    onChange={(e) => setInvoiceData({ ...invoiceData, notes: e.target.value })}
                    rows={4}
                    placeholder="e.g. Payment due within 14 days. Thank you!"
                    className="w-full rounded-xl bg-white/5 border border-white/10 p-3 text-sm text-white focus:ring-1 focus:ring-lime-500 focus:border-lime-500 transition-all outline-none placeholder:text-slate-600"
                  />
                </div>
                <div className="space-y-4 bg-white/5 p-6 rounded-2xl border border-white/10 h-fit backdrop-blur-sm">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Tax Rate (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={invoiceData.taxRate}
                      onChange={(e) => setInvoiceData({ ...invoiceData, taxRate: parseFloat(e.target.value) })}
                      className="w-full rounded-xl bg-black/20 border border-white/10 p-3 text-sm text-white focus:ring-1 focus:ring-lime-500 focus:border-lime-500 transition-all outline-none text-right"
                    />
                  </div>
                  <div className="flex justify-between text-sm text-slate-400 pt-2 font-light">
                    <span>Subtotal</span>
                    <span className="font-mono">
                      ${invoiceData.items.reduce((a, i) => a + (i.quantity * i.unitPrice), 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-2xl text-white pt-4 border-t border-white/10">
                    <span className="font-display tracking-wide">Total</span>
                    <span className="text-lime-400 font-mono">
                      ${(invoiceData.items.reduce((a, i) => a + (i.quantity * i.unitPrice), 0) * (1 + invoiceData.taxRate / 100)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Live Preview (Right) */}
        <div className="hidden lg:flex w-1/2 bg-black/20 overflow-y-auto flex-col items-center relative py-12 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          <div className="sticky top-0 z-10 bg-black/50 backdrop-blur-md px-4 py-1.5 rounded-full text-slate-300 text-[10px] font-bold shadow-lg uppercase tracking-widest border border-white/10 mb-8">
            {hoveredTemplate ? `Previewing: ${hoveredTemplate}` : 'Live Preview'}
          </div>

          <div className="origin-top transform scale-[0.65] xl:scale-[0.75] 2xl:scale-[0.85] transition-transform duration-300 shadow-[0_0_50px_rgba(0,0,0,0.5)] mb-24">
            {/* ID used for HTML2Canvas */}
            <div
              id="invoice-preview-container"
              className={`bg-white flex flex-col shadow-sm transition-all duration-300 ${invoiceData.layout === 'landscape' ? 'w-[297mm] min-h-[210mm]' : 'w-[210mm] min-h-[297mm]'}`}
            >
              <InvoicePreview invoice={previewInvoice} client={client} profile={profile} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
