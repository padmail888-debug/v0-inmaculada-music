-- Favorite songs: many-to-many between users and songs (users ↔ songs)
-- Run this in Supabase Dashboard → SQL Editor (after songs table exists)

create table if not exists public.favorite_songs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  song_id uuid not null references public.songs(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint favorite_songs_user_song_key unique (user_id, song_id)
);

create index if not exists favorite_songs_user_id_idx on public.favorite_songs(user_id);
create index if not exists favorite_songs_song_id_idx on public.favorite_songs(song_id);

alter table public.favorite_songs enable row level security;

-- Users can only read their own favorites
create policy "Users can view their own favorites"
  on public.favorite_songs for select
  using (auth.uid() = user_id);

-- Users can add a favorite (only for themselves)
create policy "Users can add their own favorite"
  on public.favorite_songs for insert
  with check (auth.uid() = user_id);

-- Users can remove their own favorite
create policy "Users can remove their own favorite"
  on public.favorite_songs for delete
  using (auth.uid() = user_id);

-- No update policy needed (no editable columns; add/remove only)
