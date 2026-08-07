-- Featured content (platform promos managed by Super Admin)
-- Run in Supabase → SQL Editor

create table if not exists public.featured_content (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  image_url text not null default '/placeholder.svg',
  link_url text not null default '/',
  type text not null default 'announcement'
    check (type in ('announcement', 'promotion', 'event')),
  is_active boolean not null default true,
  priority integer not null default 1,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists featured_content_active_priority_idx
  on public.featured_content (is_active, priority);

alter table public.featured_content enable row level security;

-- Anyone (anon + authenticated) can read active featured items (artist profile / dashboard)
drop policy if exists "Anyone can read active featured content" on public.featured_content;
create policy "Anyone can read active featured content"
  on public.featured_content for select
  using (is_active = true);

-- Super Admin can read all (including inactive) for the admin CRUD screens
drop policy if exists "Super admins can read all featured content" on public.featured_content;
create policy "Super admins can read all featured content"
  on public.featured_content for select
  using (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') ilike '%super%'
    or coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') ilike '%super%'
  );

drop policy if exists "Super admins can insert featured content" on public.featured_content;
create policy "Super admins can insert featured content"
  on public.featured_content for insert
  with check (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') ilike '%super%'
    or coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') ilike '%super%'
  );

drop policy if exists "Super admins can update featured content" on public.featured_content;
create policy "Super admins can update featured content"
  on public.featured_content for update
  using (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') ilike '%super%'
    or coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') ilike '%super%'
  )
  with check (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') ilike '%super%'
    or coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') ilike '%super%'
  );

drop policy if exists "Super admins can delete featured content" on public.featured_content;
create policy "Super admins can delete featured content"
  on public.featured_content for delete
  using (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') ilike '%super%'
    or coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') ilike '%super%'
  );

comment on table public.featured_content is
  'Platform featured banners. CRUD by Super Admin; active rows shown to artists/users.';
