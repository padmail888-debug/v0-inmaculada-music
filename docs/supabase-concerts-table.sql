-- Concerts table: artist events (run after artists table exists)
-- Run in Supabase Dashboard → SQL Editor

create table if not exists public.concerts (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.artists(id) on delete cascade,
  title text not null,
  venue text not null,
  city text,
  date date not null,
  time time,
  ticket_url text,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists concerts_artist_id_idx on public.concerts(artist_id);
create index if not exists concerts_date_idx on public.concerts(date);

alter table public.concerts enable row level security;

create policy "Concerts are viewable by everyone"
  on public.concerts for select using (true);

create policy "Artists can manage their own concerts"
  on public.concerts for all
  using (
    exists (select 1 from public.artists a where a.id = artist_id and a.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.artists a where a.id = artist_id and a.user_id = auth.uid())
  );
