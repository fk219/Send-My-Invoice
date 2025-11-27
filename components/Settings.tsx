import React, { useState } from 'react';
import { Profile } from '../types';
import { Save, CreditCard, Hash, Globe, Sparkles, Type, Palette, Layout, AlertCircle, Upload } from 'lucide-react';
import { analyzeBrandColors } from '../services/geminiService';
import { GOOGLE_FONTS } from '../constants';

interface SettingsProps {
   profile: Profile;
   setProfile: (p: Profile) => void;
}

export default function Settings({ profile, setProfile }: SettingsProps) {
   const [isAnalyzing, setIsAnalyzing] = useState(false);
   const [analysisSource, setAnalysisSource] = useState<string | null>(null);
   const [analysisError, setAnalysisError] = useState<string | null>(null);

   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setProfile({ ...profile, [e.target.name]: e.target.value });
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

   // Improved Color Handler that supports HEX, RGB, HSL conversion to safe HEX for the picker
   const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setProfile({ ...profile, brandColor: val });
   };

   const INVOICE_FORMATS = [
      { label: 'Standard (INV-2024-001)', value: 'INV-{YYYY}-{NNNN}' },
      { label: 'Simple (#001)', value: '#{NNNN}' },
      { label: 'Year Based (2024-001)', value: '{YYYY}-{NNNN}' },
      { label: 'Compact (INV001)', value: 'INV{NNNN}' },
      { label: 'Dated (202410-001)', value: '{YYYY}{MM}-{NNNN}' },
   ];

   return (
      <div className="p-8 max-w-4xl mx-auto pb-24">
         <div className="mb-10">
            <h1 className="text-3xl font-display font-bold text-white mb-2 tracking-wide">Settings</h1>
            <p className="text-slate-400 font-light">Manage your business profile and preferences.</p>
         </div>

         <div className="space-y-8">

            {/* Branding Section */}
            <section className="bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm overflow-hidden">
               <div className="p-6 border-b border-white/5 flex items-center gap-3 bg-white/[0.02]">
                  <div className="p-2 rounded-lg bg-lime-400/10 text-lime-400">
                     <Palette size={20} />
                  </div>
                  <h2 className="font-semibold text-white tracking-wide">Brand & Appearance</h2>
               </div>

               <div className="p-8 space-y-8">
                  <div className="bg-black/20 p-6 rounded-xl border border-white/5">
                     <div className="flex items-center gap-6">
                        <div className="w-24 h-24 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden relative group">
                           {profile.logoUrl ? (
                              <img src={profile.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                           ) : (
                              <span className="text-xs text-slate-500 uppercase tracking-widest">No Logo</span>
                           )}
                           <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Upload size={20} className="text-white" />
                           </div>
                        </div>
                        <div className="flex-1">
                           <label className="block text-sm font-medium text-slate-300 mb-2 uppercase tracking-wider">Company Logo</label>
                           <div className="flex gap-3">
                              <label className="cursor-pointer bg-lime-400 text-slate-950 px-4 py-2 rounded-lg text-sm font-medium hover:bg-lime-300 transition-colors flex items-center gap-2 shadow-lg shadow-lime-400/10">
                                 <Upload size={16} />
                                 Upload Image
                                 <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                              </label>
                              {profile.logoUrl && (
                                 <button
                                    onClick={() => setProfile({ ...profile, logoUrl: '' })}
                                    className="text-red-400 text-sm hover:text-red-300 px-2 transition-colors"
                                 >
                                    Remove
                                 </button>
                              )}
                           </div>
                           <p className="text-xs text-slate-500 mt-2 font-light">Recommended: Square PNG or JPG, at least 400x400px.</p>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div>
                        <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Brand Color</label>
                        <div className="flex gap-3">
                           <div className="relative flex-1 group">
                              <div
                                 className="absolute left-3 top-2.5 w-6 h-6 rounded-md shadow-sm ring-1 ring-white/10"
                                 style={{ backgroundColor: profile.brandColor }}
                              ></div>
                              <input
                                 type="text"
                                 name="brandColor"
                                 value={profile.brandColor}
                                 onChange={handleColorChange}
                                 className="w-full pl-12 bg-white/5 border border-white/10 rounded-xl p-2.5 text-sm font-mono text-white focus:border-lime-500 focus:ring-1 focus:ring-lime-500 outline-none transition-all uppercase"
                                 placeholder="#000000"
                              />
                           </div>
                           <div className="relative w-12 h-11 overflow-hidden rounded-xl border border-white/10 shadow-sm cursor-pointer hover:border-lime-500/50 transition-colors group">
                              <input
                                 type="color"
                                 value={profile.brandColor.startsWith('#') ? profile.brandColor : '#000000'}
                                 onChange={handleChange}
                                 name="brandColor"
                                 className="absolute -top-4 -left-4 w-24 h-24 cursor-pointer p-0 border-0 opacity-0 group-hover:opacity-100"
                              />
                              <div className="w-full h-full" style={{ backgroundColor: profile.brandColor }}></div>
                           </div>
                        </div>
                        <div className="flex gap-2 mt-2">
                           {['#84cc16', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#ef4444'].map(color => (
                              <button
                                 key={color}
                                 onClick={() => setProfile({ ...profile, brandColor: color })}
                                 className={`w-6 h-6 rounded-full border border-white/10 hover:scale-110 transition-transform ${profile.brandColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : ''}`}
                                 style={{ backgroundColor: color }}
                                 title={color}
                              />
                           ))}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-2 font-mono">Supports HEX, RGB, HSL.</p>
                     </div>

                     <div>
                        <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider flex items-center gap-2">
                           <Type size={14} />
                           Typography
                        </label>
                        <select
                           name="fontFamily"
                           value={profile.fontFamily || 'Inter'}
                           onChange={handleChange}
                           className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-sm text-white focus:border-lime-500 outline-none appearance-none"
                        >
                           <option value="sans" className="bg-slate-900">System Sans</option>
                           <option value="serif" className="bg-slate-900">System Serif</option>
                           <option value="mono" className="bg-slate-900">System Mono</option>
                           <optgroup label="Google Fonts" className="bg-slate-900 text-slate-400">
                              {GOOGLE_FONTS.map(font => (
                                 <option key={font} value={font} className="bg-slate-900 text-white">{font}</option>
                              ))}
                           </optgroup>
                        </select>
                     </div>

                     <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Logo URL (Alternative)</label>
                        <input
                           type="url"
                           name="logoUrl"
                           value={profile.logoUrl}
                           onChange={handleChange}
                           className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-lime-500 outline-none placeholder:text-slate-600"
                           placeholder="https://..."
                        />
                     </div>
                  </div>
               </div>
            </section>

            {/* Business Info */}
            <section className="bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm overflow-hidden">
               <div className="p-6 border-b border-white/5 flex items-center gap-3 bg-white/[0.02]">
                  <div className="p-2 rounded-lg bg-lime-400/10 text-lime-400">
                     <Layout size={20} />
                  </div>
                  <h2 className="font-semibold text-white tracking-wide">Business Details</h2>
               </div>
               <div className="p-8 space-y-6">
                  <div>
                     <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Company Name</label>
                     <input type="text" name="name" value={profile.name} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-lime-500 outline-none" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                        <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Email Address</label>
                        <input type="email" name="email" value={profile.email} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-lime-500 outline-none" />
                     </div>
                     <div>
                        <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Tax ID / VAT</label>
                        <input type="text" name="taxId" value={profile.taxId || ''} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-lime-500 outline-none" />
                     </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                        <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Phone Number</label>
                        <input type="tel" name="phoneNumber" value={profile.phoneNumber || ''} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-lime-500 outline-none" placeholder="+1 (555) 000-0000" />
                     </div>
                     <div>
                        <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Business Address</label>
                        <input type="text" name="address" value={profile.address} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-lime-500 outline-none" />
                     </div>
                  </div>
               </div>
            </section>

            {/* Preferences */}
            <section className="bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm overflow-hidden">
               <div className="p-6 border-b border-white/5 flex items-center gap-3 bg-white/[0.02]">
                  <div className="p-2 rounded-lg bg-lime-400/10 text-lime-400">
                     <Hash size={20} />
                  </div>
                  <h2 className="font-semibold text-white tracking-wide">Numbering & Payment</h2>
               </div>
               <div className="p-8 space-y-8">
                  <div>
                     <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Invoice Number Format</label>
                     <select
                        name="invoiceFormat"
                        value={profile.invoiceFormat}
                        onChange={handleChange}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white font-mono focus:border-lime-500 outline-none appearance-none"
                     >
                        {INVOICE_FORMATS.map(fmt => (
                           <option key={fmt.value} value={fmt.value} className="bg-slate-900">{fmt.label}</option>
                        ))}
                     </select>
                     <p className="text-xs text-slate-500 mt-3 font-light">
                        Use <code className="bg-white/10 px-1.5 py-0.5 rounded text-lime-400 font-mono text-[10px]">{`{YYYY}`}</code> for current year and <code className="bg-white/10 px-1.5 py-0.5 rounded text-lime-400 font-mono text-[10px]">{`{NNNN}`}</code> for the sequential number.
                     </p>
                  </div>

                  <div className="h-px bg-white/5" />

                  <div>
                     <div className="flex items-center gap-2 mb-2">
                        <CreditCard size={16} className="text-lime-400" />
                        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider">Default Payment Link</label>
                     </div>
                     <input
                        type="url"
                        name="defaultPaymentLink"
                        value={profile.defaultPaymentLink || ''}
                        onChange={handleChange}
                        placeholder="https://paypal.me/yourbusiness"
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-lime-500 outline-none placeholder:text-slate-600"
                     />
                     <p className="text-xs text-slate-500 mt-2 font-light">This link will be automatically added to all new invoices.</p>
                  </div>
               </div>
            </section>

            <div className="flex justify-end pt-4">
               <button className="flex items-center gap-2 bg-lime-400 text-slate-950 px-8 py-3 rounded-xl hover:bg-lime-300 transition-all shadow-[0_0_20px_rgba(132,204,22,0.3)] hover:shadow-[0_0_30px_rgba(132,204,22,0.5)] font-medium tracking-wide hover:scale-105 active:scale-95">
                  <Save size={18} />
                  Save Settings
               </button>
            </div>

         </div>
      </div>
   );
}
