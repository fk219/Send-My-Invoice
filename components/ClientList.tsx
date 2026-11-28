import React, { useState } from 'react';
import { Client } from '../types';
import { Plus, Trash, Edit, User } from 'lucide-react';

type ClientInput = Pick<Client, 'name' | 'email' | 'address'>;

interface ClientListProps {
  clients: Client[];
  onCreate: (input: ClientInput) => Promise<Client>;
  onUpdate: (id: string, input: ClientInput) => Promise<Client>;
  onDelete: (id: string) => Promise<void>;
}

export default function ClientList({ clients, onCreate, onUpdate, onDelete }: ClientListProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentClient, setCurrentClient] = useState<Client>({ id: '', name: '', email: '', address: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (currentClient.id) {
        await onUpdate(currentClient.id, currentClient);
      } else {
        await onCreate(currentClient);
      }
      setIsEditing(false);
      setCurrentClient({ id: '', name: '', email: '', address: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the client.');
    } finally {
      setBusy(false);
    }
  };

  const handleEdit = (client: Client) => {
    setCurrentClient(client);
    setError(null);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this client? Existing invoices keep their saved details.')) return;
    setError(null);
    try {
      await onDelete(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete the client.');
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto pb-24">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-wide">Clients</h1>
          <p className="text-slate-400 font-light">Manage your client database.</p>
        </div>
        <button
          onClick={() => { setCurrentClient({ id: '', name: '', email: '', address: '' }); setError(null); setIsEditing(true); }}
          className="flex items-center gap-2 bg-lime-400 hover:bg-lime-300 text-slate-950 px-6 py-3 rounded-xl font-medium transition-all shadow-[0_0_20px_rgba(132,204,22,0.3)] hover:shadow-[0_0_30px_rgba(132,204,22,0.5)] hover:scale-105 active:scale-95"
        >
          <Plus size={18} />
          Add Client
        </button>
      </div>

      {error && !isEditing && (
        <div role="alert" className="mb-6 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {isEditing && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 shadow-2xl max-w-md w-full p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-lime-400 to-transparent"></div>
            <h2 className="text-2xl font-display font-bold text-white mb-6 tracking-wide">{currentClient.id ? 'Edit Client' : 'New Client'}</h2>
            {error && (
              <div role="alert" className="mb-5 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}
            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Name</label>
                <input required type="text" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-lime-500 outline-none transition-colors" value={currentClient.name} onChange={e => setCurrentClient({ ...currentClient, name: e.target.value })} placeholder="Client Name" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Email</label>
                <input required type="email" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-lime-500 outline-none transition-colors" value={currentClient.email} onChange={e => setCurrentClient({ ...currentClient, email: e.target.value })} placeholder="client@example.com" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Address</label>
                <textarea required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-lime-500 outline-none transition-colors" rows={3} value={currentClient.address} onChange={e => setCurrentClient({ ...currentClient, address: e.target.value })} placeholder="Billing Address" />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 px-4 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors font-medium">Cancel</button>
                <button type="submit" disabled={busy} className="flex-1 px-4 py-3 bg-lime-400 text-slate-950 rounded-xl hover:bg-lime-300 font-bold tracking-wide transition-all shadow-lg shadow-lime-400/20 disabled:opacity-50">
                  {busy ? 'Saving…' : 'Save Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {clients.map(client => (
          <div key={client.id} className="bg-white/5 p-6 rounded-2xl border border-white/10 hover:border-lime-500/30 transition-all hover:-translate-y-1 group flex items-start gap-5 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-lime-400/20 to-transparent flex items-center justify-center text-lime-400 flex-shrink-0 border border-lime-400/10 group-hover:border-lime-400/30 transition-colors">
              <User size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-bold text-white text-lg truncate tracking-wide">{client.name}</h3>
              <p className="text-sm text-slate-400 truncate mb-1">{client.email}</p>
              <p className="text-xs text-slate-600 truncate font-mono">{client.address}</p>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => handleEdit(client)} className="p-2 text-slate-500 hover:text-lime-400 hover:bg-lime-400/10 rounded-lg transition-colors">
                <Edit size={16} />
              </button>
              <button onClick={() => void handleDelete(client.id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                <Trash size={16} />
              </button>
            </div>
          </div>
        ))}

        {clients.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-white/10 rounded-3xl">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600">
              <User size={32} />
            </div>
            <h3 className="text-white font-display font-bold text-xl mb-2">No Clients Yet</h3>
            <p className="text-slate-500 max-w-xs mx-auto">Add your first client to start creating invoices.</p>
          </div>
        )}
      </div>
    </div>
  );
}
