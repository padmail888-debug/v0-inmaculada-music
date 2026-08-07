-- Allow any signed-in user to upload/replace their own playlist covers.
-- Path convention: covers/playlists/{user_id}/{playlistId}-{timestamp}.jpg
-- Run in Supabase → SQL Editor (needed so Android can upload without relying on /api/playlists/cover).

-- Public read already exists for `covers` in many setups; this adds owner writes under playlists/.

drop policy if exists "Users upload own playlist covers" on storage.objects;
create policy "Users upload own playlist covers"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'covers'
  and (storage.foldername(name))[1] = 'playlists'
  and (storage.foldername(name))[2] = auth.uid()::text
);

drop policy if exists "Users update own playlist covers" on storage.objects;
create policy "Users update own playlist covers"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'covers'
  and (storage.foldername(name))[1] = 'playlists'
  and (storage.foldername(name))[2] = auth.uid()::text
)
with check (
  bucket_id = 'covers'
  and (storage.foldername(name))[1] = 'playlists'
  and (storage.foldername(name))[2] = auth.uid()::text
);

drop policy if exists "Users delete own playlist covers" on storage.objects;
create policy "Users delete own playlist covers"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'covers'
  and (storage.foldername(name))[1] = 'playlists'
  and (storage.foldername(name))[2] = auth.uid()::text
);
