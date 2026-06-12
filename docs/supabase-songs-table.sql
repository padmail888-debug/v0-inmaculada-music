-- Songs table: many songs per artist, optionally per album (1 artist → many songs, 1 album → many songs)
-- Run this in Supabase Dashboard → SQL Editor (after artists and albums tables exist)

create table if not exists public.songs (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.artists(id) on delete cascade,
  album_id uuid references public.albums(id) on delete set null,
  title text not null,
  duration int not null default 0,
  audio_file_url text,
  cover_image text,
  release_date date,
  created_at timestamptz not null default now()
);

create index if not exists songs_artist_id_idx on public.songs(artist_id);
create index if not exists songs_album_id_idx on public.songs(album_id);

alter table public.songs enable row level security;

-- Anyone can view songs
create policy "Songs are viewable by everyone"
  on public.songs for select
  using (true);

-- Only the artist can insert their songs (optionally link to their album)
create policy "Artists can create their own songs"
  on public.songs for insert
  with check (
    exists (
      select 1 from public.artists
      where artists.id = artist_id and artists.user_id = auth.uid()
    )
  );

-- Only the artist can update their songs
create policy "Artists can update their own songs"
  on public.songs for update
  using (
    exists (
      select 1 from public.artists
      where artists.id = artist_id and artists.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.artists
      where artists.id = artist_id and artists.user_id = auth.uid()
    )
  );

-- Only the artist can delete their songs
create policy "Artists can delete their own songs"
  on public.songs for delete
  using (
    exists (
      select 1 from public.artists
      where artists.id = artist_id and artists.user_id = auth.uid()
    )
  );
