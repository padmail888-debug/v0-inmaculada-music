-- Plays table: play statistics (who played which song, when)
-- Run in Supabase SQL Editor (after songs table exists)

create table if not exists public.plays (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  song_id uuid not null references public.songs(id) on delete cascade,
  played_at timestamptz not null default now()
);

create index if not exists plays_song_id_idx on public.plays(song_id);
create index if not exists plays_user_id_idx on public.plays(user_id);
create index if not exists plays_played_at_idx on public.plays(played_at desc);

alter table public.plays enable row level security;

-- Anyone can read play counts (for analytics display); restrict in app if needed
create policy "Plays are viewable by everyone"
  on public.plays for select
  using (true);

-- Authenticated users can insert a play for themselves; anon can insert for "anonymous" (user_id null)
create policy "Anyone can record a play"
  on public.plays for insert
  with check (
    (user_id is null) or (user_id = auth.uid())
  );

-- No update/delete for plays (append-only log)
