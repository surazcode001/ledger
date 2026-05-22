-- Run this in your Supabase SQL editor (Dashboard → SQL Editor → New query)

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  status text check (status in ('planning', 'active', 'completed', 'on-hold')) default 'planning' not null,
  color text default '#6366f1' not null,
  due_date date,
  created_at timestamptz default now() not null
);

alter table public.projects enable row level security;

create policy "Users manage own projects"
  on public.projects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  status text check (status in ('todo', 'in-progress', 'review', 'done')) default 'todo' not null,
  priority text check (priority in ('low', 'medium', 'high')) default 'medium' not null,
  due_date date,
  created_at timestamptz default now() not null
);

alter table public.tasks enable row level security;

create policy "Users manage own tasks"
  on public.tasks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
