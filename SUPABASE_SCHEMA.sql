-- Run this once in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.dashboard_rows (
  id uuid primary key default gen_random_uuid(),
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.dashboard_targets (
  key text primary key,
  store_name text not null,
  month text not null,
  targets jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.dashboard_rows enable row level security;
alter table public.dashboard_targets enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'dashboard_rows' and policyname = 'allow read dashboard rows'
  ) then
    create policy "allow read dashboard rows" on public.dashboard_rows for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'dashboard_rows' and policyname = 'allow insert dashboard rows'
  ) then
    create policy "allow insert dashboard rows" on public.dashboard_rows for insert with check (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'dashboard_rows' and policyname = 'allow delete dashboard rows'
  ) then
    create policy "allow delete dashboard rows" on public.dashboard_rows for delete using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'dashboard_targets' and policyname = 'allow read dashboard targets'
  ) then
    create policy "allow read dashboard targets" on public.dashboard_targets for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'dashboard_targets' and policyname = 'allow insert dashboard targets'
  ) then
    create policy "allow insert dashboard targets" on public.dashboard_targets for insert with check (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'dashboard_targets' and policyname = 'allow update dashboard targets'
  ) then
    create policy "allow update dashboard targets" on public.dashboard_targets for update using (true) with check (true);
  end if;
end $$;