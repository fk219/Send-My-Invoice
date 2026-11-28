import React, { useEffect, useRef, useState } from 'react';
import {
  BarChart3,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  LogOut,
  Settings as SettingsIcon,
  Users,
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import InvoiceEditor from './components/InvoiceEditor';
import ClientList from './components/ClientList';
import Settings from './components/Settings';
import Guide from './components/Guide';
import ThemeToggle from './components/ThemeToggle';
import AuthScreen from './components/AuthScreen';
import { Invoice, Client, Profile } from './types';
import { defaultProfile } from './constants';
import { api, type AuthUser } from './services/api';

type View = 'dashboard' | 'invoices' | 'clients' | 'settings' | 'guide';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [booting, setBooting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const skipProfileSave = useRef(true);
  const savingInvoice = useRef(false);

  const loadWorkspace = async (nextUser: AuthUser) => {
    const data = await api.bootstrap();
    skipProfileSave.current = true;
    setUser(nextUser);
    setProfile(data.profile);
    setClients(data.clients);
    setInvoices(data.invoices);
    setCurrentView('dashboard');
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { user: current } = await api.me();
        const data = await api.bootstrap();
        if (!alive) return;
        skipProfileSave.current = true;
        setUser(current);
        setProfile(data.profile);
        setClients(data.clients);
        setInvoices(data.invoices);
      } catch {
        if (alive) setUser(null);
      } finally {
        if (alive) setBooting(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Settings are auto-saved, but the first profile load must not write the
  // server's own data back.
  useEffect(() => {
    if (!user) return;
    if (skipProfileSave.current) {
      skipProfileSave.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      void api.saveProfile(profile).catch((err) => {
        setError(err instanceof Error ? err.message : 'Could not save settings.');
      });
    }, 700);
    return () => window.clearTimeout(timer);
  }, [profile, user]);

  const handleAuthenticated = async (nextUser: AuthUser) => {
    try {
      setError(null);
      await loadWorkspace(nextUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your workspace.');
    }
  };

  const resetWorkspace = () => {
    skipProfileSave.current = true;
    setUser(null);
    setProfile(defaultProfile);
    setClients([]);
    setInvoices([]);
    setCurrentView('dashboard');
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      resetWorkspace();
    }
  };

  useEffect(() => {
    const handleUnauthorized = () => resetWorkspace();
    window.addEventListener('clarity:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('clarity:unauthorized', handleUnauthorized);
  }, []);

  const exportData = () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      profile,
      clients,
      invoices,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `clarity-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateInvoice = () => {
    setEditingInvoice(null);
    setCurrentView('invoices');
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setCurrentView('invoices');
  };

  const handleSaveInvoice = async (invoice: Invoice) => {
    if (savingInvoice.current) return;
    savingInvoice.current = true;
    try {
      setError(null);
      const exists = invoices.some((item) => item.id === invoice.id);
      const result = exists ? await api.updateInvoice(invoice) : await api.createInvoice(invoice);
      setInvoices((prev) =>
        exists
          ? prev.map((item) => (item.id === result.invoice.id ? result.invoice : item))
          : [result.invoice, ...prev],
      );
      localStorage.removeItem('clarity_invoice_draft');
      setCurrentView('dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the invoice.');
    } finally {
      savingInvoice.current = false;
    }
  };

  const handleAddClient = async (input: Pick<Client, 'name' | 'email' | 'address'>) => {
    const result = await api.createClient(input);
    setClients((prev) => [...prev, result.client]);
    return result.client;
  };

  const handleUpdateClient = async (
    id: string,
    input: Pick<Client, 'name' | 'email' | 'address'>,
  ) => {
    const result = await api.updateClient(id, input);
    setClients((prev) => prev.map((client) => (client.id === id ? result.client : client)));
    return result.client;
  };

  const handleDeleteClient = async (id: string) => {
    await api.deleteClient(id);
    setClients((prev) => prev.filter((client) => client.id !== id));
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            invoices={invoices}
            clients={clients}
            profile={profile}
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
            onAddClient={handleAddClient}
          />
        );
      case 'clients':
        return (
          <ClientList
            clients={clients}
            onCreate={handleAddClient}
            onUpdate={handleUpdateClient}
            onDelete={handleDeleteClient}
          />
        );
      case 'settings':
        return <Settings profile={profile} setProfile={setProfile} />;
      case 'guide':
        return <Guide />;
      default:
        return <div>Not Found</div>;
    }
  };

  if (booting) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-300 flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm">
          <div className="w-4 h-4 border-2 border-lime-400 border-t-transparent rounded-full animate-spin" />
          Loading your workspace…
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-200 font-sans selection:bg-lime-500/30">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-lime-900/10 via-slate-950/0 to-slate-950/0 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-blue-900/5 via-slate-950/0 to-slate-950/0 pointer-events-none" />

      {error && (
        <div className="fixed right-4 top-4 z-50 flex max-w-md items-start gap-3 rounded-xl border border-red-400/20 bg-red-950/90 px-4 py-3 text-sm text-red-200 shadow-xl">
          <span className="flex-1">{error}</span>
          <button type="button" onClick={() => setError(null)} className="text-red-300 hover:text-white">
            ×
          </button>
        </div>
      )}

      <aside
        className={`${isSidebarCollapsed ? 'w-20' : 'w-20 lg:w-64'} flex-shrink-0 flex flex-col justify-between sticky top-0 h-screen border-r border-white/5 bg-slate-900/50 backdrop-blur-xl z-20 transition-all duration-300 ease-in-out`}
      >
        <div>
          <div className={`h-20 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-center lg:justify-between lg:px-6'} border-b border-white/5 transition-all`}>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-lime-400 to-lime-600 flex items-center justify-center text-slate-950 font-bold shadow-[0_0_15px_rgba(132,204,22,0.5)] flex-shrink-0">
                C
              </div>
              {!isSidebarCollapsed && (
                <span className="hidden lg:block font-display font-semibold text-2xl tracking-wide text-white animate-in fade-in duration-300">Clarity</span>
              )}
            </div>

            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className={`hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors ${isSidebarCollapsed ? 'absolute -right-3 top-8 bg-slate-800 border border-white/10 shadow-lg' : ''}`}
            >
              {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          </div>

          <nav className="p-4 space-y-2 mt-4">
            <NavItem active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} icon={<BarChart3 size={20} />} label="Dashboard" collapsed={isSidebarCollapsed} />
            <NavItem active={currentView === 'invoices'} onClick={handleCreateInvoice} icon={<FileText size={20} />} label="New Invoice" collapsed={isSidebarCollapsed} />
            <NavItem active={currentView === 'clients'} onClick={() => setCurrentView('clients')} icon={<Users size={20} />} label="Clients" collapsed={isSidebarCollapsed} />
            <NavItem active={currentView === 'settings'} onClick={() => setCurrentView('settings')} icon={<SettingsIcon size={20} />} label="Settings" collapsed={isSidebarCollapsed} />
            <NavItem active={currentView === 'guide'} onClick={() => setCurrentView('guide')} icon={<BookOpen size={20} />} label="How it works" collapsed={isSidebarCollapsed} />
          </nav>
        </div>

        <div className="p-4 border-t border-white/5 bg-white/[0.02] space-y-3">
          <ThemeToggle compact={isSidebarCollapsed} />
          <div className={`flex ${isSidebarCollapsed ? 'justify-center' : 'gap-2'} transition-all`}>
            <button
              onClick={exportData}
              title="Export a JSON snapshot"
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-[11px] font-medium text-slate-300 bg-white/5 hover:bg-white/10 transition-colors"
            >
              <Download size={13} /> {!isSidebarCollapsed && <span className="hidden lg:inline">Export</span>}
            </button>
            <button
              onClick={() => void logout()}
              title="Sign out"
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-[11px] font-medium text-slate-300 bg-white/5 hover:bg-white/10 transition-colors"
            >
              <LogOut size={13} /> {!isSidebarCollapsed && <span className="hidden lg:inline">Sign out</span>}
            </button>
          </div>
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} transition-all`}>
            <div className="w-9 h-9 rounded-full bg-slate-800 border border-white/10 overflow-hidden ring-2 ring-transparent group-hover:ring-lime-500/50 transition-all flex-shrink-0">
              {profile.logoUrl ? (
                <img src={profile.logoUrl} alt="Profile" className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-slate-300">
                  {(profile.name?.trim().charAt(0) || user.email.charAt(0) || 'C').toUpperCase()}
                </div>
              )}
            </div>
            {!isSidebarCollapsed && (
              <div className="hidden lg:block text-sm overflow-hidden animate-in fade-in duration-300">
                <p className="font-medium text-slate-200 truncate max-w-[120px] font-display tracking-wide">{profile.name || 'Your business'}</p>
                <p className="text-slate-500 text-[10px] font-light tracking-wider truncate max-w-[120px]">{user.email}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto relative z-10 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {renderContent()}
      </main>
    </div>
  );
}

const NavItem = ({ active, onClick, icon, label, collapsed }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; collapsed: boolean }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-center lg:justify-start'} gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${active
      ? 'text-lime-400 bg-lime-400/10 shadow-[0_0_20px_rgba(132,204,22,0.1)] border border-lime-400/20'
      : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'
      }`}
    title={collapsed ? label : undefined}
  >
    {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-lime-400 rounded-r-full shadow-[0_0_10px_#84cc16]" />}
    <span className="relative z-10 transition-transform duration-300 group-hover:scale-110">{icon}</span>
    {!collapsed && (
      <span className={`hidden lg:block relative z-10 font-light tracking-wide animate-in fade-in slide-in-from-left-2 duration-300 ${active ? 'font-medium' : ''}`}>{label}</span>
    )}
  </button>
);
