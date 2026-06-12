# System Roles & Permissions

Reference for access control, RLS policies, and feature visibility. Use when implementing permissions in the app or Supabase.

---

## Role hierarchy

| Role | Scope |
|------|--------|
| **Super Admin** | Full system access |
| **Artist** | Own artist profile, albums, songs, stats |
| **Paid User** | Free user + download & offline |
| **Free User** | Stream, search, favorites, library |

---

## Super Admin

- Full access to the system
- Manage artists
- Manage users
- Manage songs
- Manage albums
- Access metrics and analytics
- Manage reported content
- Delete or suspend accounts
- Manage subscriptions

---

## Artist

- Manage their artist profile
- Create albums
- Edit their own albums
- Delete their own albums
- Upload songs
- Edit their own songs
- Delete their own songs
- View play statistics
- Manage song cover and metadata

---

## Free User

- Stream songs
- Search for songs, artists, and albums
- Save favorite songs
- Save favorite artists
- View albums
- Create a personal library
- View favorite songs
- View favorite artists

---

## Paid User

**All permissions of a Free User, plus:**

- Download songs
- Listen to downloaded songs offline
- Delete downloaded songs

---

## Mapping to app & database

| Role | App / auth | Supabase / DB |
|------|------------|----------------|
| Super Admin | `user.role === 'superadmin'` | `auth.users.role` or `raw_app_meta_data` / `raw_user_meta_data`; RLS bypass via service role or admin check |
| Artist | `user.role === 'artist'` | `public.artists.user_id = auth.uid()` for own rows |
| Paid User | `user.role === 'premium'` | `public.profiles.subscription_type = 'paid'` or `public.subscriptions` |
| Free User | `user.role === 'free'` | Default for authenticated users without artist/paid |

---

## Related docs

- Supabase RLS: `docs/supabase-*.sql`
- Auth & roles in app: `hooks/use-auth.tsx` (`UserRole`), login/register role mapping
