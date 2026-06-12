-- STEP 2 (destructive): Remove old permissive select policies
-- Run this ONLY after you have run supabase-soft-delete-and-published.sql (step 1) and verified
-- that the new columns and triggers work. This removes the old "viewable by everyone" policies
-- so that only published, non-deleted songs/albums are visible to the public.
--
-- What this does:
-- - Drops "Songs are viewable by everyone" (which allowed all rows). The new policies from
--   step 1 ("Published songs..." and "Artists can view their own songs") then control visibility.
-- - Drops "Albums are viewable by everyone" for the same reason.
--
-- Your data is not deleted. Only the RLS policy definitions are removed and replaced by the
-- behavior already added in step 1.

drop policy if exists "Songs are viewable by everyone" on public.songs;
drop policy if exists "Albums are viewable by everyone" on public.albums;
