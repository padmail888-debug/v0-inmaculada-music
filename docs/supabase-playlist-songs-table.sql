-- Playlist_songs table: songs in a playlist (many-to-many: playlists ↔ songs)
-- Run in Supabase SQL Editor (after playlists and songs tables exist)

create table if not exists public.playlist_songs (
  id uuid primary key default gen_random_uuid(),
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  song_id uuid not null references public.songs(id) on delete cascade,
  position int not null default 0,
  added_at timestamptz not null default now(),
  constraint playlist_songs_playlist_song_key unique (playlist_id, song_id)
);

create index if not exists playlist_songs_playlist_id_idx on public.playlist_songs(playlist_id);
create index if not exists playlist_songs_song_id_idx on public.playlist_songs(song_id);

alter table public.playlist_songs enable row level security;

-- Users can see songs in playlists they can see (public or own)
create policy "Playlist songs viewable with playlist"
  on public.playlist_songs for select
  using (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_id and (p.is_public = true or p.user_id = auth.uid())
    )
  );

-- Only playlist owner can add/remove songs
create policy "Playlist owner can add songs"
  on public.playlist_songs for insert
  with check (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_id and p.user_id = auth.uid()
    )
  );

create policy "Playlist owner can update order"
  on public.playlist_songs for update
  using (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_id and p.user_id = auth.uid()
    )
  );

create policy "Playlist owner can remove songs"
  on public.playlist_songs for delete
  using (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_id and p.user_id = auth.uid()
    )
  );
