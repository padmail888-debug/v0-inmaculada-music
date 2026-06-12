# Storage buckets and policies for song uploads (audio + cover images)

You cannot create Storage policies by running SQL in the SQL Editor (Supabase owns `storage.objects`). Create buckets and policies in the **Dashboard** instead.

---

## Permissions by system role

Aligned with **Super Admin**, **Artist**, **Paid User**, **Free User** (see `docs/SYSTEM_ROLES_AND_PERMISSIONS.md`).

| Role         | Read / download (SELECT) | Upload (INSERT)     | Update / Delete              |
|-------------|---------------------------|----------------------|------------------------------|
| **Super Admin** | ✅ All                     | ✅ All               | ✅ All (any file)            |
| **Artist**      | ✅ All                     | ✅ Own uploads       | ✅ Only files they uploaded  |
| **Paid User**   | ✅ All (stream + download) | ❌ No                | ❌ No                        |
| **Free User**   | ✅ All (stream)            | ❌ No                | ❌ No                        |

**Owner** = user who uploaded the file (`storage.objects.owner`).  
**Super Admin** is detected via JWT: `(auth.jwt() -> 'user_metadata' ->> 'role')` in `('Super Admin', 'superadmin')`. Ensure this role is set in Supabase Auth (e.g. user metadata or app metadata) for admin users.

---

## Policies (copy-paste for Dashboard)

Create the two buckets first (Storage → New bucket: `songs`, `covers`, both **Public**). Then for each bucket, add these policies in **Storage → [bucket] → Policies → New policy**.

---

### Bucket: `songs`

| # | Policy name                | Operation | Who (by role) | Expression |
|---|----------------------------|-----------|----------------|------------|
| 1 | Public read songs          | **SELECT** | Free, Paid, Artist, Super Admin | `bucket_id = 'songs'` |
| 2 | Artists or Admin upload    | **INSERT** | Artist, Super Admin | See below |
| 3 | Owner or Admin update      | **UPDATE** | Owner (uploader), Super Admin | See below |
| 4 | Owner or Admin delete      | **DELETE** | Owner (uploader), Super Admin | See below |

**Policy 1 – Public read (all roles can stream/download)**
- Name: `Public read songs`
- Operation: **SELECT**
- USING: `bucket_id = 'songs'`

**Policy 2 – Artist or Super Admin can upload**
- Name: `Artists or Admin upload songs`
- Operation: **INSERT**
- WITH CHECK:
```sql
bucket_id = 'songs'
AND (
  EXISTS (SELECT 1 FROM public.artists a WHERE a.user_id = auth.uid())
  OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('Super Admin', 'superadmin')
)
```

**Policy 3 – Owner or Super Admin can update**
- Name: `Owner or Admin update songs`
- Operation: **UPDATE**
- USING: `(bucket_id = 'songs' AND auth.uid() = owner) OR (bucket_id = 'songs' AND (auth.jwt() -> 'user_metadata' ->> 'role') IN ('Super Admin', 'superadmin'))`
- WITH CHECK: same as USING

**Policy 4 – Owner or Super Admin can delete**
- Name: `Owner or Admin delete songs`
- Operation: **DELETE**
- USING: `(bucket_id = 'songs' AND auth.uid() = owner) OR (bucket_id = 'songs' AND (auth.jwt() -> 'user_metadata' ->> 'role') IN ('Super Admin', 'superadmin'))`

---

### Bucket: `covers`

| # | Policy name                 | Operation | Who (by role) | Expression |
|---|-----------------------------|-----------|----------------|------------|
| 1 | Public read covers          | **SELECT** | Free, Paid, Artist, Super Admin | `bucket_id = 'covers'` |
| 2 | Artists or Admin upload     | **INSERT** | Artist, Super Admin | See below |
| 3 | Owner or Admin update       | **UPDATE** | Owner, Super Admin | See below |
| 4 | Owner or Admin delete       | **DELETE** | Owner, Super Admin | See below |

**Policy 1 – Public read**
- Name: `Public read covers`
- Operation: **SELECT**
- USING: `bucket_id = 'covers'`

**Policy 2 – Artist or Super Admin can upload**
- Name: `Artists or Admin upload covers`
- Operation: **INSERT**
- WITH CHECK:
```sql
bucket_id = 'covers'
AND (
  EXISTS (SELECT 1 FROM public.artists a WHERE a.user_id = auth.uid())
  OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('Super Admin', 'superadmin')
)
```

**Policy 3 – Owner or Super Admin can update**
- Name: `Owner or Admin update covers`
- Operation: **UPDATE**
- USING: `(bucket_id = 'covers' AND auth.uid() = owner) OR (bucket_id = 'covers' AND (auth.jwt() -> 'user_metadata' ->> 'role') IN ('Super Admin', 'superadmin'))`
- WITH CHECK: same as USING

**Policy 4 – Owner or Super Admin can delete**
- Name: `Owner or Admin delete covers`
- Operation: **DELETE**
- USING: `(bucket_id = 'covers' AND auth.uid() = owner) OR (bucket_id = 'covers' AND (auth.jwt() -> 'user_metadata' ->> 'role') IN ('Super Admin', 'superadmin'))`

---

## Step 1: Create the buckets

1. Open **Supabase Dashboard** → **Storage**.
2. Click **New bucket**:
   - **Name:** `songs`
   - **Public bucket:** ON (so the app can use public URLs for playback).
   - Click **Create bucket**.
3. Click **New bucket** again:
   - **Name:** `covers`
   - **Public bucket:** ON
   - Click **Create bucket**.

---

## Step 2: Add policies for the `songs` bucket

1. Go to **Storage** → click the **songs** bucket.
2. Open the **Policies** tab (or **New policy**).
3. Add **four** policies:

### Policy 1 – Public read (everyone can download)

- **Policy name:** `Public read songs`
- **Allowed operation:** `SELECT` (or "Read")
- **USING expression:** `bucket_id = 'songs'`

### Policy 2 – Artist or Super Admin can upload

- **Policy name:** `Artists or Admin upload songs`
- **Allowed operation:** `INSERT` (or "Create" / "Upload")
- **WITH CHECK expression:**  
  `bucket_id = 'songs' AND (EXISTS (SELECT 1 FROM public.artists a WHERE a.user_id = auth.uid()) OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('Super Admin', 'superadmin'))`

### Policy 3 – Owner or Super Admin can update

- **Policy name:** `Owner or Admin update songs`
- **Allowed operation:** `UPDATE`
- **USING expression:** `(bucket_id = 'songs' AND auth.uid() = owner) OR (bucket_id = 'songs' AND (auth.jwt() -> 'user_metadata' ->> 'role') IN ('Super Admin', 'superadmin'))`
- **WITH CHECK expression:** same as USING

### Policy 4 – Owner or Super Admin can delete

- **Policy name:** `Owner or Admin delete songs`
- **Allowed operation:** `DELETE`
- **USING expression:** `(bucket_id = 'songs' AND auth.uid() = owner) OR (bucket_id = 'songs' AND (auth.jwt() -> 'user_metadata' ->> 'role') IN ('Super Admin', 'superadmin'))`

Save all four policies.

---

## Step 3: Add policies for the `covers` bucket

1. Go to **Storage** → click the **covers** bucket.
2. Add **four** policies (same pattern as songs):

### Policy 1 – Public read

- **Policy name:** `Public read covers`
- **Allowed operation:** `SELECT`
- **USING expression:** `bucket_id = 'covers'`

### Policy 2 – Artist or Super Admin can upload

- **Policy name:** `Artists or Admin upload covers`
- **Allowed operation:** `INSERT`
- **WITH CHECK expression:** `bucket_id = 'covers' AND (EXISTS (SELECT 1 FROM public.artists a WHERE a.user_id = auth.uid()) OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('Super Admin', 'superadmin'))`

### Policy 3 – Owner or Super Admin can update

- **Policy name:** `Owner or Admin update covers`
- **Allowed operation:** `UPDATE`
- **USING:** `(bucket_id = 'covers' AND auth.uid() = owner) OR (bucket_id = 'covers' AND (auth.jwt() -> 'user_metadata' ->> 'role') IN ('Super Admin', 'superadmin'))`
- **WITH CHECK:** same as USING

### Policy 4 – Owner or Super Admin can delete

- **Policy name:** `Owner or Admin delete covers`
- **Allowed operation:** `DELETE`
- **USING expression:** `(bucket_id = 'covers' AND auth.uid() = owner) OR (bucket_id = 'covers' AND (auth.jwt() -> 'user_metadata' ->> 'role') IN ('Super Admin', 'superadmin'))`

---

## Summary (by role)

| Role         | SELECT | INSERT | UPDATE | DELETE |
|-------------|--------|--------|--------|--------|
| Super Admin | ✅     | ✅     | ✅ All | ✅ All |
| Artist      | ✅     | ✅     | ✅ Own | ✅ Own |
| Paid User   | ✅     | ❌     | ❌    | ❌    |
| Free User   | ✅     | ❌     | ❌    | ❌    |

**Owner** = user who uploaded the file. **Super Admin** is identified by `user_metadata.role` in `('Super Admin', 'superadmin')` — set this in Auth user metadata or app metadata for admin users.
