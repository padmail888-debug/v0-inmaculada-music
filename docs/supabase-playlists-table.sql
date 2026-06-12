-- Playlists table: user-created playlists
-- Run in Supabase SQL Editor

create table if not exists public.playlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  cover_image text,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists playlists_user_id_idx on public.playlists(user_id);

alter table public.playlists enable row level security;

create policy "Public playlists are viewable by everyone"
  on public.playlists for select
  using (is_public = true or user_id = auth.uid());

create policy "Users can create their own playlists"
  on public.playlists for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own playlists"
  on public.playlists for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own playlists"
  on public.playlists for delete
  using (auth.uid() = user_id);
