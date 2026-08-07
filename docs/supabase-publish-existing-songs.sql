-- Backfill: publish songs/albums that were uploaded but stayed hidden (is_published = false).
-- Run once in Supabase SQL Editor if paid users cannot find already-uploaded tracks.
--
-- Root cause: songs default to is_published=false and artists cannot publish.
-- Only Super Admin can publish via the admin moderation tools.

update public.songs
set is_published = true
where deleted_at is null
  and is_published = false
  and audio_file_url is not null
  and trim(audio_file_url) <> '';

update public.albums
set is_published = true
where deleted_at is null
  and is_published = false
  and id in (
    select distinct album_id
    from public.songs
    where album_id is not null
      and is_published = true
      and deleted_at is null
  );
