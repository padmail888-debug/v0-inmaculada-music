# Step-by-step: Upload songs (artist flow)

This guide walks you through enabling song uploads: Supabase Storage, then the app flow that saves to the `songs` table.

---

## Prerequisites

- **Supabase project** with `artists` and `songs` tables created (see `docs/supabase-artists-table.sql`, `docs/supabase-songs-table.sql`).
- **Logged-in user** with an **Artist** account and a row in `public.artists` (so `artists.user_id = auth.uid()`).
- **App** uses `getSupabase()` from `@/lib/supabase/client` for browser calls.

---

## Step 1: Create Storage buckets in Supabase

Songs and cover images are stored in Supabase Storage; the app will upload files there and save the returned URLs in `songs.audio_file_url` and `songs.cover_image`.

### 1.1 Create the buckets (Dashboard)

1. Open **Supabase Dashboard** → **Storage**.
2. **New bucket**:
   - Name: `songs` (or `audio` if you prefer).
   - **Public bucket**: ON (so the app can play audio via the public URL).
   - Create.
3. **New bucket** again:
   - Name: `covers` (for cover images).
   - **Public bucket**: ON.
   - Create.

### 1.2 Storage policies (RLS)

So only artists can upload and everyone can read:

- In **Storage** → **Policies** for bucket **songs**:
  - **Allow public read**: `true` (or a policy that allows SELECT for everyone).
  - **Allow upload for authenticated users who are artists**:  
    Define a policy that allows INSERT only if the current user has a row in `public.artists` (e.g. `exists (select 1 from public.artists where user_id = auth.uid())`).  
    You can do this via Dashboard policy UI or the SQL in `docs/supabase-storage-songs-bucket.sql`.
- Same idea for **covers**: public read; upload only for users who are artists.

Alternatively, run the SQL in **`docs/supabase-storage-songs-bucket.sql`** to create the buckets and policies in one go (if your project doesn’t have them yet).

---

## Step 2: Get the artist ID for the current user

The `songs` table has `artist_id` (FK to `artists.id`). The upload flow must use the row in `public.artists` for the logged-in user.

**In the app (e.g. upload page or a hook):**

1. Call `getSupabase().auth.getUser()` to get `user.id` (same as `auth.uid()`).
2. Query:  
   `getSupabase().from('artists').select('id').eq('user_id', user.id).single()`
3. If no row: the user is not an artist → show “Create artist profile first” or redirect to artist onboarding.
4. If there is a row: use `data.id` as `artist_id` when inserting into `songs`.

---

## Step 3: Upload the audio file to Storage

**In the app:**

1. User selects an audio file (e.g. MP3).
2. Build a storage path, e.g. `{user_id}/{song_id_or_timestamp}_{sanitized_filename}.mp3` to avoid collisions.
3. Call Supabase Storage:
   - `getSupabase().storage.from('songs').upload(path, file, { contentType: 'audio/mpeg', upsert: false })`
4. Get the public URL:
   - `getSupabase().storage.from('songs').getPublicUrl(path).data.publicUrl`
5. Save this URL; you’ll use it for `songs.audio_file_url`.

---

## Step 4: Upload the cover image (optional)

Same pattern as audio:

1. User selects an image file.
2. Path e.g. `{user_id}/{timestamp}_{filename}` in bucket `covers`.
3. `getSupabase().storage.from('covers').upload(path, file, { contentType: file.type })`
4. Get public URL with `getPublicUrl(path)`.
5. Use this for `songs.cover_image`. If no cover, you can leave `cover_image` null.

---

## Step 5: Insert a row into `public.songs`

After both uploads (or only audio), insert one row per song:

- **artist_id**: from Step 2.
- **album_id**: optional; omit or set to an existing album UUID if the song belongs to an album.
- **title**: from the form.
- **duration**: from form (seconds) or `0` if not provided.
- **audio_file_url**: from Step 3.
- **cover_image**: from Step 4 or null.
- **release_date**: optional (date).
- **is_published**: if the column exists (after soft-delete script), set to `false` so the song stays in review until an admin publishes it.

Example (pseudo):

```ts
await getSupabase().from('songs').insert({
  artist_id: artistId,
  title: form.title,
  duration: form.duration ?? 0,
  audio_file_url: audioPublicUrl,
  cover_image: coverPublicUrl || null,
  release_date: form.releaseDate || null,
  // is_published: false  // if column exists
})
```

---

## Step 6: (Optional) Link to an album

- If the user chose an existing album, set `songs.album_id` to that album’s `id`.
- If you support “create new album and add this song”, first insert into `albums`, then use the new `albums.id` as `songs.album_id` in the same insert (or in a second step).

---

## Summary checklist

| Step | What to do |
|------|------------|
| 1 | Create Storage buckets `songs` and `covers`, make them public read, allow upload only for artists (RLS/SQL). |
| 2 | In app: get current user → fetch `artists.id` for `user_id = auth.uid()` → use as `artist_id`. |
| 3 | Upload audio file to `songs` bucket → get public URL → use for `audio_file_url`. |
| 4 | Upload cover image to `covers` bucket → get public URL → use for `cover_image` (optional). |
| 5 | Insert into `songs` with `artist_id`, `title`, `duration`, `audio_file_url`, `cover_image`, and optional `album_id`, `release_date`, `is_published`. |
| 6 | Optional: create or select album and set `songs.album_id`. |

---

## Files in this project

- **Upload UI:** `app/artist/upload/page.tsx` — form and submit handler; can be wired to Steps 2–5.
- **Supabase client:** `lib/supabase/client.ts` — `getSupabase()` for Storage and DB.
- **Storage bucket SQL (optional):** `docs/supabase-storage-songs-bucket.sql` — creates buckets and policies.

After Step 1, the upload page can be implemented to run Steps 2–5 (and optionally 6) on submit.
