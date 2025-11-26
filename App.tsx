import React, { useState, useEffect } from 'react';
import { Layout, FileText, Users, BarChart3, Settings as SettingsIcon } from 'lucide-react';
import Dashboard from './components/Dashboard';
import InvoiceEditor from './components/InvoiceEditor';
import ClientList from './components/ClientList';
import Settings from './components/Settings';
import { Invoice, Client, Profile } from './types';
import { defaultProfile, mockClients, mockInvoices } from './constants';

// Simple view router since we avoid full React Router for this constrained environment
type View = 'dashboard' | 'invoices' | 'clients' | 'settings';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');

  // Global State (In a real app, use Context or Redux/Zustand)
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  // Hydrate from local storage (mock database)
  useEffect(() => {
    const savedProfile = localStorage.getItem('clarity_profile');
    if (savedProfile) setProfile(JSON.parse(savedProfile));

    const savedClients = localStorage.getItem('clarity_clients');
    if (savedClients) setClients(JSON.parse(savedClients));

    const savedInvoices = localStorage.getItem('clarity_invoices');
    if (savedInvoices) setInvoices(JSON.parse(savedInvoices));
  }, []);

  // Persistence
  useEffect(() => {
    localStorage.setItem('clarity_profile', JSON.stringify(profile));
    localStorage.setItem('clarity_clients', JSON.stringify(clients));
    localStorage.setItem('clarity_invoices', JSON.stringify(invoices));
  }, [profile, clients, invoices]);

  const handleCreateInvoice = () => {
    setEditingInvoice(null); // Null means new invoice
    setCurrentView('invoices');
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setCurrentView('invoices');
  };

  const handleSaveInvoice = (invoice: Invoice) => {
    setInvoices(prev => {
      const exists = prev.find(i => i.id === invoice.id);
      if (exists) {
        return prev.map(i => i.id === invoice.id ? invoice : i);
      }
      return [invoice, ...prev];
    });
    setCurrentView('dashboard');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            invoices={invoices}
            onNewInvoice={handleCreateInvoice}
            onEditInvoice={handleEditInvoice}
          />
        );
      case 'invoices':
        return (
          <InvoiceEditor
            profile={profile}
            setProfile={setProfile}
            clients={clients}
            existingInvoices={invoices}
            initialData={editingInvoice}
            onSave={handleSaveInvoice}
            onCancel={() => setCurrentView('dashboard')}
          />
        );
      case 'clients':
        return (
          <ClientList
            clients={clients}
            setClients={setClients}
          />
        );
      case 'settings':
        return (
          <Settings
            profile={profile}
            setProfile={setProfile}
          />
        );
      default:
        return <div>Not Found</div>;
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#050505] text-slate-300 font-sans selection:bg-lime-500/30">
      {/* Background Gradient */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-lime-900/20 via-slate-950/0 to-slate-950/0 pointer-events-none" />

      {/* Sidebar */}
      <aside className="w-20 lg:w-64 flex-shrink-0 flex flex-col justify-between sticky top-0 h-screen border-r border-white/5 bg-white/[0.02] backdrop-blur-xl z-20">
        <div>
          <div className="h-20 flex items-center justify-center lg:justify-start lg:px-8 border-b border-white/5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-lime-400 to-lime-600 flex items-center justify-center text-slate-950 font-bold shadow-[0_0_15px_rgba(132,204,22,0.5)]">
              C
            </div>
            <span className="hidden lg:block ml-4 font-display font-semibold text-2xl tracking-wide text-white">Clarity</span>
          </div>

          <nav className="p-4 space-y-2 mt-4">
            <NavItem
              active={currentView === 'dashboard'}
              onClick={() => setCurrentView('dashboard')}
              icon={<BarChart3 size={20} />}
              label="Dashboard"
            />
            <NavItem
              active={currentView === 'invoices'}
              onClick={handleCreateInvoice}
              icon={<FileText size={20} />}
              label="New Invoice"
            />
            <NavItem
              active={currentView === 'clients'}
              onClick={() => setCurrentView('clients')}
              icon={<Users size={20} />}
              label="Clients"
            />
            <NavItem
              active={currentView === 'settings'}
              onClick={() => setCurrentView('settings')}
              icon={<SettingsIcon size={20} />}
              label="Settings"
            />
          </nav>
        </div>

        <div className="p-4 border-t border-white/5 bg-white/[0.02]">
          <div className="hidden lg:flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-800 border border-white/10 overflow-hidden ring-2 ring-transparent group-hover:ring-lime-500/50 transition-all">
              <img src={profile.logoUrl || "https://picsum.photos/100/100"} alt="Profile" className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-sm">
              <p className="font-medium text-slate-200 truncate max-w-[120px] font-display tracking-wide">{profile.name}</p>
              <p className="text-lime-500/70 text-xs font-light tracking-wider uppercase">Pro Plan</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {renderContent()}
      </main>
    </div>
  );
}

const NavItem = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-center lg:justify-start gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${active
        ? 'text-lime-400 bg-lime-400/10 shadow-[0_0_20px_rgba(132,204,22,0.1)] border border-lime-400/20'
        : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'
      }`}
  >
    {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-lime-400 rounded-r-full shadow-[0_0_10px_#84cc16]" />}
    <span className="relative z-10 transition-transform duration-300 group-hover:scale-110">{icon}</span>
    <span className={`hidden lg:block relative z-10 font-light tracking-wide ${active ? 'font-medium' : ''}`}>{label}</span>
  </button>
);
