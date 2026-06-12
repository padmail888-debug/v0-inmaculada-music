-- Favorite artists: many-to-many between users and artists (users ↔ artists)
-- Run this in Supabase Dashboard → SQL Editor (after artists table exists)

create table if not exists public.favorite_artists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  artist_id uuid not null references public.artists(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint favorite_artists_user_artist_key unique (user_id, artist_id)
);

create index if not exists favorite_artists_user_id_idx on public.favorite_artists(user_id);
create index if not exists favorite_artists_artist_id_idx on public.favorite_artists(artist_id);

alter table public.favorite_artists enable row level security;

-- Users can only read their own favorite artists
create policy "Users can view their own favorite artists"
  on public.favorite_artists for select
  using (auth.uid() = user_id);

-- Users can add a favorite artist (only for themselves)
create policy "Users can add their own favorite artist"
  on public.favorite_artists for insert
  with check (auth.uid() = user_id);

-- Users can remove their own favorite artist
create policy "Users can remove their own favorite artist"
  on public.favorite_artists for delete
  using (auth.uid() = user_id);
