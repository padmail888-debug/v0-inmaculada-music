-- STEP 1 (safe, additive only): Soft delete and is_published for songs and albums
-- Run this in Supabase SQL Editor (after songs and albums tables exist).
-- No destructive operations: only adds columns, indexes, policies, functions, and triggers.
--
-- Soft delete: set deleted_at to hide from public; is_published: only true = visible publicly.
-- After running, run step 2 to remove old permissive policies so the new rules take effect.

-- ---------- Songs ----------
alter table public.songs
  add column if not exists deleted_at timestamptz,
  add column if not exists is_published boolean not null default false;

create index if not exists songs_deleted_at_idx on public.songs(deleted_at) where deleted_at is null;
create index if not exists songs_is_published_idx on public.songs(is_published) where is_published = true;

comment on column public.songs.deleted_at is 'Soft delete: when set, row is hidden from public select.';
comment on column public.songs.is_published is 'Only true when approved for publication (e.g. after review). Artists cannot set to true.';

-- New policies (additive). Existing "Songs are viewable by everyone" is left as-is until you run step 2.
create policy "Published songs are viewable by everyone"
  on public.songs for select
  using (deleted_at is null and is_published = true);

create policy "Artists can view their own songs"
  on public.songs for select
  using (
    exists (
      select 1 from public.artists a
      where a.id = artist_id and a.user_id = auth.uid()
    )
  );

create or replace function public.songs_block_artist_publish()
returns trigger as $$
begin
  if new.is_published = true and (old is null or old.is_published = false) then
    if exists (select 1 from public.artists a where a.id = new.artist_id and a.user_id = auth.uid()) then
      raise exception 'Artists cannot publish songs directly; submit for review.';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Skip creating trigger if it already exists (avoids error on re-run)
do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'songs_block_artist_publish_trigger'
  ) then
    create trigger songs_block_artist_publish_trigger
      before insert or update of is_published on public.songs
      for each row execute function public.songs_block_artist_publish();
  end if;
end $$;

-- ---------- Albums ----------
alter table public.albums
  add column if not exists deleted_at timestamptz,
  add column if not exists is_published boolean not null default false;

create index if not exists albums_deleted_at_idx on public.albums(deleted_at) where deleted_at is null;
create index if not exists albums_is_published_idx on public.albums(is_published) where is_published = true;

comment on column public.albums.deleted_at is 'Soft delete: when set, row is hidden from public select.';
comment on column public.albums.is_published is 'Only true when approved for publication. Artists cannot set to true.';

create policy "Published albums are viewable by everyone"
  on public.albums for select
  using (deleted_at is null and is_published = true);

create policy "Artists can view their own albums"
  on public.albums for select
  using (
    exists (
      select 1 from public.artists a
      where a.id = artist_id and a.user_id = auth.uid()
    )
  );

create or replace function public.albums_block_artist_publish()
returns trigger as $$
begin
  if new.is_published = true and (old is null or old.is_published = false) then
    if exists (select 1 from public.artists a where a.id = new.artist_id and a.user_id = auth.uid()) then
      raise exception 'Artists cannot publish albums directly; submit for review.';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'albums_block_artist_publish_trigger'
  ) then
    create trigger albums_block_artist_publish_trigger
      before insert or update of is_published on public.albums
      for each row execute function public.albums_block_artist_publish();
  end if;
end $$; 
