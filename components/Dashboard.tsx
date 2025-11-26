import React, { useMemo } from 'react';
import { Invoice } from '../types';
import { statusColors, mockClients } from '../constants'; // Accessing mockClients for name resolution
import { Plus, ArrowUpRight, DollarSign, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  invoices: Invoice[];
  onNewInvoice: () => void;
  onEditInvoice: (inv: Invoice) => void;
}

export default function Dashboard({ invoices, onNewInvoice, onEditInvoice }: DashboardProps) {

  const stats = useMemo(() => {
    let totalRevenue = 0;
    let outstanding = 0;
    let overdue = 0;

    invoices.forEach(inv => {
      const subtotal = inv.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
      const total = subtotal * (1 + inv.taxRate / 100);

      if (inv.status === 'paid') totalRevenue += total;
      if (inv.status === 'sent') outstanding += total;
      if (inv.status === 'overdue') {
        outstanding += total;
        overdue += total;
      }
    });

    return { totalRevenue, outstanding, overdue };
  }, [invoices]);

  const chartData = useMemo(() => {
    // Simple mock aggregation for the chart
    return [
      { name: 'Jan', amount: 4000 },
      { name: 'Feb', amount: 3000 },
      { name: 'Mar', amount: 2000 },
      { name: 'Apr', amount: 2780 },
      { name: 'May', amount: 1890 },
      { name: 'Jun', amount: 2390 },
      { name: 'Jul', amount: 3490 },
    ];
  }, []);

  const getClientName = (id: string) => {
    const client = mockClients.find(c => c.id === id);
    return client ? client.name : 'Unknown Client';
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-wide">Dashboard</h1>
          <p className="text-slate-400 font-light">Overview of your financial activity.</p>
        </div>
        <button
          onClick={onNewInvoice}
          className="flex items-center gap-2 bg-lime-400 hover:bg-lime-300 text-slate-950 px-6 py-3 rounded-xl font-medium transition-all shadow-[0_0_20px_rgba(132,204,22,0.3)] hover:shadow-[0_0_30px_rgba(132,204,22,0.5)] hover:scale-105 active:scale-95"
        >
          <Plus size={18} />
          Create Invoice
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Revenue"
          amount={stats.totalRevenue}
          icon={<DollarSign className="text-lime-400" />}
          trend="+12% from last month"
          color="lime"
        />
        <StatCard
          title="Outstanding"
          amount={stats.outstanding}
          icon={<Clock className="text-amber-400" />}
          trend="4 invoices pending"
          color="amber"
        />
        <StatCard
          title="Overdue"
          amount={stats.overdue}
          icon={<ArrowUpRight className="text-red-400" />}
          isAlert
          color="red"
        />
      </div>

      {/* Chart Section */}
      <div className="bg-white/5 p-8 rounded-2xl border border-white/10 backdrop-blur-sm">
        <h3 className="text-lg font-medium text-white mb-6 font-display tracking-wide">Revenue History</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
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
      <div className="bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm overflow-hidden">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h3 className="text-lg font-medium text-white font-display tracking-wide">Recent Invoices</h3>
          <button className="text-xs text-lime-400 hover:text-lime-300 font-medium uppercase tracking-wider">View All</button>
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
                const subtotal = inv.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
                const total = subtotal * (1 + inv.taxRate / 100);

                return (
                  <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4 font-mono text-lime-400">{inv.number}</td>
                    <td className="px-6 py-4 text-slate-300 font-medium">{getClientName(inv.clientId)}</td>
                    <td className="px-6 py-4 text-slate-500">{inv.issueDate}</td>
                    <td className="px-6 py-4 font-medium text-white">${total.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${inv.status === 'paid' ? 'bg-lime-400/10 text-lime-400 border-lime-400/20' :
                          inv.status === 'sent' ? 'bg-blue-400/10 text-blue-400 border-blue-400/20' :
                            inv.status === 'overdue' ? 'bg-red-400/10 text-red-400 border-red-400/20' :
                              'bg-slate-400/10 text-slate-400 border-slate-400/20'
                        }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => onEditInvoice(inv)}
                        className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg opacity-0 group-hover:opacity-100"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const StatCard = ({ title, amount, icon, trend, isAlert, color = 'lime' }: any) => (
  <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm flex flex-col justify-between h-36 group hover:border-white/20 transition-all hover:-translate-y-1">
    <div className="flex justify-between items-start">
      <span className="text-slate-400 font-medium text-xs uppercase tracking-wider">{title}</span>
      <div className={`p-2.5 rounded-xl bg-white/5 text-${color}-400 group-hover:bg-${color}-400/20 transition-colors`}>
        {icon}
      </div>
    </div>
    <div>
      <h4 className="text-3xl font-display font-medium text-white tracking-tight">${amount.toLocaleString()}</h4>
      {trend && <p className="text-xs text-slate-500 mt-2 font-light">{trend}</p>}
    </div>
  </div>
);