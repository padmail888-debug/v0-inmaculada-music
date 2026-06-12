-- Downloaded songs: tracks a user has downloaded (only allowed for paid subscribers)
-- Run this in Supabase Dashboard → SQL Editor (after songs table exists).
-- Requires public.profiles to have subscription_type column (run supabase-profiles-add-subscription-type.sql first).

create table if not exists public.downloaded_songs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  song_id uuid not null references public.songs(id) on delete cascade,
  downloaded_at timestamptz not null default now(),
  constraint downloaded_songs_user_song_key unique (user_id, song_id)
);

create index if not exists downloaded_songs_user_id_idx on public.downloaded_songs(user_id);
create index if not exists downloaded_songs_song_id_idx on public.downloaded_songs(song_id);

alter table public.downloaded_songs enable row level security;

-- Users can only read their own downloads
create policy "Users can view their own downloads"
  on public.downloaded_songs for select
  using (auth.uid() = user_id);

-- Only paid users can add a download (checks public.profiles.subscription_type; profiles.id = auth.users.id)
create policy "Only paid users can add downloads"
  on public.downloaded_songs for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.subscription_type = 'paid'
    )
  );

-- Users can remove their own download
create policy "Users can remove their own download"
  on public.downloaded_songs for delete
  using (auth.uid() = user_id);
