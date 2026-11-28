import React, { useState } from 'react';
import { ArrowRight, Lock, Mail, User } from 'lucide-react';
import { api, type AuthUser } from '../services/api';

type Mode = 'login' | 'signup';

export default function AuthScreen({ onAuthenticated }: { onAuthenticated: (user: AuthUser) => void }) {
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result =
        mode === 'signup'
          ? await api.signup({ name, email, password })
          : await api.login({ email, password });
      onAuthenticated(result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 relative overflow-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-lime-900/20 via-slate-950/0 to-slate-950/0 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-blue-900/10 via-slate-950/0 to-slate-950/0 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lime-400 to-lime-600 flex items-center justify-center text-slate-950 font-bold shadow-[0_0_20px_rgba(132,204,22,0.4)]">
            C
          </div>
          <div>
            <p className="font-display text-2xl font-semibold tracking-wide">Clarity</p>
            <p className="text-xs text-slate-500">Invoices that get paid.</p>
          </div>
        </div>

        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
          <h1 className="text-2xl font-display font-semibold tracking-wide">
            {mode === 'login' ? 'Welcome back.' : 'Create your workspace.'}
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            {mode === 'login'
              ? 'Sign in to your invoices, clients and settings.'
              : 'Your clients and invoices stay private to your account.'}
          </p>

          {error && (
            <div role="alert" className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === 'signup' && (
              <label className="block">
                <span className="text-[11px] uppercase tracking-wider text-slate-500">Your name</span>
                <div className="mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3">
                  <User size={16} className="text-slate-500" />
                  <input
                    required
                    minLength={2}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-slate-600"
                    placeholder="Alex Founder"
                  />
                </div>
              </label>
            )}

            <label className="block">
              <span className="text-[11px] uppercase tracking-wider text-slate-500">Email</span>
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3">
                <Mail size={16} className="text-slate-500" />
                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-slate-600"
                  placeholder="you@company.com"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-[11px] uppercase tracking-wider text-slate-500">Password</span>
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3">
                <Lock size={16} className="text-slate-500" />
                <input
                  required
                  minLength={10}
                  type="password"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-slate-600"
                  placeholder={mode === 'login' ? 'Your password' : 'At least 10 characters'}
                />
              </div>
            </label>

            <button
              type="submit"
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-lime-400 px-5 py-3.5 text-sm font-semibold text-slate-950 transition-all hover:bg-lime-300 disabled:opacity-50"
            >
              {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create workspace'}
              {!busy && <ArrowRight size={16} />}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            {mode === 'login' ? (
              <>
                New to Clarity?{' '}
                <button type="button" onClick={() => { setMode('signup'); setError(null); }} className="font-medium text-lime-400 hover:text-lime-300">
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button type="button" onClick={() => { setMode('login'); setError(null); }} className="font-medium text-lime-400 hover:text-lime-300">
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-slate-600">
          Secure cloud workspace · invoices remain private to your account
        </p>
      </div>
    </div>
  );
}
