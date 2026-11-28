import type { Client, Invoice, Profile } from '../types';

export type AuthUser = { id: string; email: string; name: string };

export type Bootstrap = {
  user: AuthUser;
  profile: Profile;
  clients: Client[];
  invoices: Invoice[];
};

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    credentials: 'same-origin',
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers ?? {}),
    },
  });
  const data = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('clarity:unauthorized'));
    }
    throw new ApiError(response.status, data.error || 'The request failed.');
  }
  return data as T;
}

export const api = {
  me: () => request<{ user: AuthUser }>('/api/auth/me'),
  signup: (input: { name: string; email: string; password: string }) =>
    request<{ user: AuthUser }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  login: (input: { email: string; password: string }) =>
    request<{ user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  logout: () => request<{ ok: true }>('/api/auth/logout', { method: 'POST' }),
  bootstrap: () => request<Bootstrap>('/api/bootstrap'),
  saveProfile: (profile: Profile) =>
    request<{ profile: Profile }>('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    }),
  createClient: (input: Pick<Client, 'name' | 'email' | 'address'>) =>
    request<{ client: Client }>('/api/clients', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  updateClient: (id: string, input: Pick<Client, 'name' | 'email' | 'address'>) =>
    request<{ client: Client }>(`/api/clients/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    }),
  deleteClient: (id: string) =>
    request<{ ok: true }>(`/api/clients/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  createInvoice: (invoice: Invoice) =>
    request<{ invoice: Invoice }>('/api/invoices', {
      method: 'POST',
      body: JSON.stringify(invoice),
    }),
  updateInvoice: (invoice: Invoice) =>
    request<{ invoice: Invoice }>(`/api/invoices/${encodeURIComponent(invoice.id)}`, {
      method: 'PUT',
      body: JSON.stringify(invoice),
    }),
  deleteInvoice: (id: string) =>
    request<{ ok: true }>(`/api/invoices/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
