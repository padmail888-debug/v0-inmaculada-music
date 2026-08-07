-- Platform settings (singleton row managed by Super Admin)
-- Run in Supabase → SQL Editor

create table if not exists public.platform_settings (
  id int primary key default 1 check (id = 1),
  user_registration boolean not null default true,
  maintenance_mode boolean not null default false,
  content_upload boolean not null default true,
  premium_price numeric(10, 2) not null default 9.99,
  artist_commission numeric(5, 2) not null default 70,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

insert into public.platform_settings (id)
values (1)
on conflict (id) do nothing;

alter table public.platform_settings enable row level security;

-- Anyone can read (needed for registration / upload / maintenance checks)
drop policy if exists "Anyone can read platform settings" on public.platform_settings;
create policy "Anyone can read platform settings"
  on public.platform_settings for select
  using (true);

-- Only Super Admins can update
drop policy if exists "Super admins can update platform settings" on public.platform_settings;
create policy "Super admins can update platform settings"
  on public.platform_settings for update
  using (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') ilike '%super%'
    or coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') ilike '%super%'
  )
  with check (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') ilike '%super%'
    or coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') ilike '%super%'
  );

comment on table public.platform_settings is
  'Singleton platform config. Readable by all; writable by Super Admin.';
