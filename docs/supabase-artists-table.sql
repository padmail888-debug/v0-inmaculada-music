-- Artists table: one row per user who is an artist (1 user → 1 artist)
-- Run this in Supabase Dashboard → SQL Editor

-- Create the table
create table if not exists public.artists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  artist_name text not null,
  bio text,
  profile_image text,
  created_at timestamptz not null default now(),
  constraint artists_user_id_key unique (user_id)
);

-- Optional: index for lookups by user_id
create index if not exists artists_user_id_idx on public.artists(user_id);

-- Enable Row Level Security (RLS)
alter table public.artists enable row level security;

-- Policy: anyone can read artist profiles (for public artist pages)
create policy "Artists are viewable by everyone"
  on public.artists for select
  using (true);

-- Policy: authenticated users can insert their own artist row (user_id = auth.uid())
create policy "Users can create their own artist profile"
  on public.artists for insert
  with check (auth.uid() = user_id);

-- Policy: users can update only their own artist row
create policy "Users can update their own artist profile"
  on public.artists for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policy: users can delete only their own artist row
create policy "Users can delete their own artist profile"
  on public.artists for delete
  using (auth.uid() = user_id);

-- Optional: allow service role / admin to manage any row (e.g. from Dashboard)
-- Uncomment if you need backend or admin to insert/update/delete any artist:
-- create policy "Service role can manage all artists"
--   on public.artists for all
--   using (auth.jwt() ->> 'role' = 'service_role');
