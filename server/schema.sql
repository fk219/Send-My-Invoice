-- Clarity SaaS schema (PostgreSQL).
-- Every business row is scoped by user_id; the API always filters by the
-- authenticated session's user. There is no cross-tenant read path.

create table if not exists users (
  id uuid primary key,
  email text not null unique,
  password_hash text not null,
  name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sessions (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  user_agent text,
  ip text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists sessions_user_idx on sessions(user_id);
create index if not exists sessions_expiry_idx on sessions(expires_at);

create table if not exists profiles (
  user_id uuid primary key references users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists clients (
  id text not null,
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  email text not null default '',
  address text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists clients_user_idx on clients(user_id, created_at desc);

create table if not exists invoices (
  id text not null,
  user_id uuid not null references users(id) on delete cascade,
  client_id text,
  number text not null,
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'paid', 'overdue', 'partial')),
  issue_date date not null,
  due_date date not null,
  currency text not null default 'USD',
  total_cents integer not null default 0,
  balance_cents integer not null default 0,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  unique (user_id, number)
);

create index if not exists invoices_user_idx on invoices(user_id, created_at desc);
create index if not exists invoices_status_idx on invoices(user_id, status);
create index if not exists invoices_client_idx on invoices(client_id);
