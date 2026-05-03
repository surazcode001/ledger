-- Run this in your Supabase SQL editor

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  type text check (type in ('checking','savings','credit','cash','investment')) not null,
  balance numeric(15,2) default 0 not null,
  currency text default 'USD' not null,
  created_at timestamptz default now() not null
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  color text default '#6366f1' not null,
  icon text default '📦' not null,
  type text check (type in ('income','expense')) not null
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  account_id uuid references public.accounts(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete set null,
  type text check (type in ('income','expense','transfer')) not null,
  amount numeric(15,2) not null,
  description text not null,
  notes text,
  receipt_url text,
  date date not null,
  created_at timestamptz default now() not null
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  invoice_number text not null,
  client_name text not null,
  client_email text,
  client_address text,
  date date not null,
  due_date date not null,
  status text check (status in ('draft','sent','paid')) default 'draft' not null,
  notes text,
  subtotal numeric(15,2) default 0 not null,
  tax_rate numeric(5,2) default 0 not null,
  tax_amount numeric(15,2) default 0 not null,
  total numeric(15,2) default 0 not null,
  created_at timestamptz default now() not null
);

create table public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references public.invoices(id) on delete cascade not null,
  description text not null,
  quantity numeric(10,2) default 1 not null,
  unit_price numeric(15,2) default 0 not null,
  amount numeric(15,2) default 0 not null
);

-- Row Level Security
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;

create policy "Users manage own accounts" on public.accounts for all using (auth.uid() = user_id);
create policy "Users manage own categories" on public.categories for all using (auth.uid() = user_id);
create policy "Users manage own transactions" on public.transactions for all using (auth.uid() = user_id);
create policy "Users manage own invoices" on public.invoices for all using (auth.uid() = user_id);
create policy "Users manage own invoice_items" on public.invoice_items for all using (
  exists (select 1 from public.invoices i where i.id = invoice_id and i.user_id = auth.uid())
);

-- Storage bucket for receipts (run separately or via Supabase dashboard)
-- insert into storage.buckets (id, name, public) values ('receipts', 'receipts', false);
-- create policy "Users manage own receipts" on storage.objects for all using (
--   bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]
-- );
