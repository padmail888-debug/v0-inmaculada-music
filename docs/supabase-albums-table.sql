-- Albums table: many albums per artist (1 artist → many albums)
-- Run this in Supabase Dashboard → SQL Editor (after artists table exists)

create table if not exists public.albums (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.artists(id) on delete cascade,
  title text not null,
  description text,
  cover_image text,
  release_date date,
  created_at timestamptz not null default now()
);

create index if not exists albums_artist_id_idx on public.albums(artist_id);

alter table public.albums enable row level security;

-- Anyone can view albums
create policy "Albums are viewable by everyone"
  on public.albums for select
  using (true);

-- Only the artist (via artists.user_id) can insert their albums
create policy "Artists can create their own albums"
  on public.albums for insert
  with check (
    exists (
      select 1 from public.artists
      where artists.id = artist_id and artists.user_id = auth.uid()
    )
  );

-- Only the artist can update their albums
create policy "Artists can update their own albums"
  on public.albums for update
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

-- Only the artist can delete their albums
create policy "Artists can delete their own albums"
  on public.albums for delete
  using (
    exists (
      select 1 from public.artists
      where artists.id = artist_id and artists.user_id = auth.uid()
    )
  );
