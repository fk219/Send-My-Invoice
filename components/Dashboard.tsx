import React, { useMemo } from 'react';
import { Client, Invoice, Profile } from '../types';
import { formatMoney, summarizeInvoice } from '../services/invoiceMath';
import { effectiveStatus, invoiceEmailHref, reminderEmailHref } from '../services/invoiceDelivery';
import { Plus, ArrowUpRight, DollarSign, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  invoices: Invoice[];
  clients: Client[];
  profile: Profile;
  onNewInvoice: () => void;
  onEditInvoice: (inv: Invoice) => void;
}

export default function Dashboard({ invoices, clients, profile, onNewInvoice, onEditInvoice }: DashboardProps) {
  const currency = profile.currency || 'USD';

  const stats = useMemo(() => {
    let totalRevenue = 0;
    let outstanding = 0;
    let overdue = 0;
    let pendingCount = 0;
    let overdueCount = 0;

    invoices.forEach(inv => {
      const summary = summarizeInvoice(inv);
      const status = effectiveStatus(inv);

      if (status === 'paid') totalRevenue += summary.total;
      if (status === 'sent' || status === 'partial') {
        outstanding += summary.balanceDue;
        pendingCount += 1;
      }
      if (status === 'overdue') {
        outstanding += summary.balanceDue;
        overdue += summary.balanceDue;
        pendingCount += 1;
        overdueCount += 1;
      }
    });

    return { totalRevenue, outstanding, overdue, pendingCount, overdueCount };
  }, [invoices]);

  const chartData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, index) => {
      const month = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      const key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
      const amount = invoices
        .filter(inv => inv.status === 'paid' && inv.issueDate.startsWith(key))
        .reduce((sum, inv) => sum + summarizeInvoice(inv).total, 0);
      return {
        name: month.toLocaleString('en-US', { month: 'short' }),
        amount,
      };
    });
  }, [invoices]);

  const getClient = (id: string) => clients.find(c => c.id === id);
  const getClientName = (id: string) => getClient(id)?.name ?? 'No client selected';

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-wide">Dashboard</h1>
          <p className="text-slate-400 font-light">Overview of your financial activity.</p>
        </div>
        <button
          onClick={onNewInvoice}
          className="flex items-center gap-2 bg-lime-400 hover:bg-lime-300 text-slate-950 px-6 py-3 rounded-xl font-medium transition-all shadow-[0_4px_20px_rgba(132,204,22,0.3)] hover:shadow-[0_6px_30px_rgba(132,204,22,0.5)] hover:scale-105 active:scale-95"
        >
          <Plus size={18} />
          Create Invoice
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Revenue"
          amount={formatMoney(stats.totalRevenue, currency)}
          icon={<DollarSign className="text-lime-400" />}
          color="lime"
        />
        <StatCard
          title="Outstanding"
          amount={formatMoney(stats.outstanding, currency)}
          icon={<Clock className="text-amber-400" />}
          trend={`${stats.pendingCount} invoice${stats.pendingCount === 1 ? '' : 's'} awaiting payment`}
          color="amber"
        />
        <StatCard
          title="Overdue"
          amount={formatMoney(stats.overdue, currency)}
          icon={<ArrowUpRight className="text-red-400" />}
          trend={`${stats.overdueCount} overdue`}
          isAlert
          color="red"
        />
      </div>

      {/* Chart Section */}
      <div className="bg-slate-900/50 p-8 rounded-2xl border border-white/5 backdrop-blur-xl shadow-sm">
        <h3 className="text-lg font-medium text-white mb-6 font-display tracking-wide">Revenue History</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dx={-10} />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                  color: '#fff'
                }}
                itemStyle={{ color: '#a3e635' }}
              />
              <Bar dataKey="amount" fill="#a3e635" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Invoices List */}
      <div className="bg-slate-900/50 rounded-2xl border border-white/5 backdrop-blur-xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h3 className="text-lg font-medium text-white font-display tracking-wide">Invoices</h3>
          <span className="text-xs text-slate-500 uppercase tracking-wider">
            {invoices.length} total
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-white/[0.02] border-b border-white/5">
              <tr>
                <th className="px-6 py-4 font-medium tracking-wider">Invoice</th>
                <th className="px-6 py-4 font-medium tracking-wider">Client</th>
                <th className="px-6 py-4 font-medium tracking-wider">Date</th>
                <th className="px-6 py-4 font-medium tracking-wider">Amount</th>
                <th className="px-6 py-4 font-medium tracking-wider">Status</th>
                <th className="px-6 py-4 text-right font-medium tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {invoices.map((inv) => {
                const total = summarizeInvoice(inv).total;
                const status = effectiveStatus(inv);
                const client = getClient(inv.clientId);
                const canRemind = status === 'sent' || status === 'partial' || status === 'overdue';

                return (
                  <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4 font-mono text-lime-400">{inv.number}</td>
                    <td className="px-6 py-4 text-slate-300 font-medium">{getClientName(inv.clientId)}</td>
                    <td className="px-6 py-4 text-slate-500">{inv.issueDate}</td>
                    <td className="px-6 py-4 font-medium text-white">{formatMoney(total, inv.currency || currency)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${status === 'paid' ? 'bg-lime-400/10 text-lime-400 border-lime-400/20' :
                        status === 'sent' ? 'bg-blue-400/10 text-blue-400 border-blue-400/20' :
                          status === 'overdue' ? 'bg-red-400/10 text-red-400 border-red-400/20' :
                            'bg-slate-400/10 text-slate-400 border-slate-400/20'
                        }`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 text-xs">
                        <a
                          href={invoiceEmailHref(inv, client, profile)}
                          className="text-slate-500 hover:text-lime-300 transition-colors"
                          title="Open an email draft in your mail app"
                        >
                          Email
                        </a>
                        {canRemind && (
                          <a
                            href={reminderEmailHref(inv, client, profile)}
                            className="text-amber-400/80 hover:text-amber-300 transition-colors"
                            title="Open a reminder draft in your mail app"
                          >
                            Remind
                          </a>
                        )}
                        <button
                          onClick={() => onEditInvoice(inv)}
                          className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg opacity-0 group-hover:opacity-100"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No invoices yet. Create your first invoice to start tracking revenue.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const StatCard = ({ title, amount, icon, trend, isAlert, color = 'lime' }: any) => (
  <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5 backdrop-blur-xl flex flex-col justify-between h-36 group hover:border-white/10 transition-all hover:-translate-y-1 shadow-sm hover:shadow-md">
    <div className="flex justify-between items-start">
      <span className="text-slate-400 font-medium text-xs uppercase tracking-wider">{title}</span>
      <div className={`p-2.5 rounded-xl bg-white/5 text-${color}-400 group-hover:bg-${color}-400/20 transition-colors`}>
        {icon}
      </div>
    </div>
    <div>
      <h4 className="text-3xl font-display font-medium text-white tracking-tight">{amount}</h4>
      {trend && <p className="text-xs text-slate-500 mt-2 font-light">{trend}</p>}
    </div>
  </div>
);