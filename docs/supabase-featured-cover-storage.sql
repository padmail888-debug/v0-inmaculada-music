-- Featured banner images in the existing `covers` bucket.
-- Path: covers/featured/{user_id}/{timestamp}.jpg
-- Run in Supabase → SQL Editor (Super Admin uploads from /admin/featured/new).

-- Ensure public read on covers (safe if already present)
drop policy if exists "Public read covers" on storage.objects;
create policy "Public read covers"
on storage.objects
for select
to public
using (bucket_id = 'covers');

drop policy if exists "Super admins upload featured covers" on storage.objects;
create policy "Super admins upload featured covers"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'covers'
  and (storage.foldername(name))[1] = 'featured'
  and (storage.foldername(name))[2] = auth.uid()::text
  and (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') ilike '%super%'
    or coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') ilike '%super%'
  )
);

drop policy if exists "Super admins update featured covers" on storage.objects;
create policy "Super admins update featured covers"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'covers'
  and (storage.foldername(name))[1] = 'featured'
  and (storage.foldername(name))[2] = auth.uid()::text
  and (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') ilike '%super%'
    or coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') ilike '%super%'
  )
)
with check (
  bucket_id = 'covers'
  and (storage.foldername(name))[1] = 'featured'
  and (storage.foldername(name))[2] = auth.uid()::text
);

drop policy if exists "Super admins delete featured covers" on storage.objects;
create policy "Super admins delete featured covers"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'covers'
  and (storage.foldername(name))[1] = 'featured'
  and (storage.foldername(name))[2] = auth.uid()::text
  and (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') ilike '%super%'
    or coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') ilike '%super%'
  )
);
