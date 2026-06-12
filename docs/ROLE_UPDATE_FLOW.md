# How user role is updated (and why it might stay "free")

## 1. Where the role comes from

The **sidebar** and the rest of the app read:

```ts
const { user } = useAuth()   // → user.role is "free" | "premium" | "artist" | ...
```

So **`user.role`** is whatever is in the **Auth context** (and in `localStorage` under the key `"user"`). It is updated in only these places:

---

## 2. How the role gets set (all code paths)

### A. Login (`hooks/use-auth.tsx` – `login()`)

When the user signs in, `login(userData)` is called with a `User` that has a `role` (from Supabase auth at that moment). That role is stored in state and localStorage.

- **File:** `hooks/use-auth.tsx` (lines 161–164)
- So after login, role is whatever Supabase had at sign-in (often `"free"`).

---

### B. Initial load from localStorage (`hooks/use-auth.tsx` – first `useEffect`)

On app load, we read `localStorage.getItem("user")` and call `setUser(parsed)`.

- **File:** `hooks/use-auth.tsx` (lines 116–151)
- If the **URL** has `?success=true`, we set `parsed.role = "premium"` before `setUser(parsed)` and update localStorage.
- So the role only becomes `"premium"` on first load if you landed on a page with `?success=true` (e.g. right after Stripe redirect). If you open the app without that query, we use whatever role was last in localStorage (often `"free"`).

---

### C. Optimistic update when `?success=true` (dashboard)

When the dashboard mounts and the URL has `success=true`, we call `setUserRole("premium")`.

- **File:** `app/dashboard/page.tsx` (useLayoutEffect, lines 29–34)
- **File:** `hooks/use-auth.tsx` – `setUserRole()` (lines 166–175): updates `user.role` and localStorage.
- So if you land on `/dashboard?success=true`, the UI can show premium immediately even before the server sync.

---

### D. Sync from server – the one that should set premium after subscription

This is the path that should turn a subscribed user from `"free"` to `"premium"` even when there is no `?success=true`.

**Step 1 – Dashboard triggers refresh**

- **File:** `app/dashboard/page.tsx` (useEffect with `refreshUserFromSupabase`, ~lines 42–47)
- After a short delay we call `refreshUserFromSupabase()`.

**Step 2 – `refreshUserFromSupabase()` in auth**

- **File:** `hooks/use-auth.tsx` (lines 49–114)
  1. Gets current session: `supabase.auth.getSession()` → `accessToken`.
  2. Calls **`/api/auth/sync-role`** with `{ accessToken }`.
  3. If response is OK and has `role`, stores it in `serverRole`.
  4. Gets Supabase user (via `refreshSession()` or `getUser()`).
  5. Final role is: `serverRole ?? app_metadata.role ?? …` (line 88–92).
  6. Maps that to `UserRole` with `mapSupabaseRoleToUserRole(rawRole)` (line 93).
  7. Calls `setUser(updated)` and updates localStorage (lines 98–110).

So the **only way** the app gets `"premium"` from the server is:

- `/api/auth/sync-role` is called with a valid `accessToken`, and  
- That API returns a role string that maps to `"premium"` (e.g. `"Paid User"`).

**Step 3 – `/api/auth/sync-role` (server)**

- **File:** `app/api/auth/sync-role/route.ts`
  1. Reads `accessToken` from the body.
  2. Decodes JWT to get `userId` (payload `sub`).
  3. Calls **`getSupabaseServer().auth.admin.getUserById(userId)`**.
  4. Returns `{ role: app_metadata.role ?? "free" }`.

So the API returns **whatever is in Supabase Auth** for that user’s `app_metadata.role`. If the webhook never ran or failed, that is still `"free"` (or missing).

**Step 4 – Who writes `app_metadata.role` in Supabase? (Stripe webhook)**

- **File:** `app/api/webhooks/stripe/route.ts`
  - On `checkout.session.completed` it reads `userId` from `session.metadata.userId` or `session.client_reference_id`.
  - If `userId` is present, it calls:
    - `getSupabaseServer().auth.admin.updateUserById(userId, { app_metadata: { role: "Paid User" } })`.

So the **only** place that writes the premium role into Supabase is this webhook. If the webhook never runs, or fails, or `userId` is missing, Supabase never gets `"Paid User"`, and sync-role will keep returning `"free"`.

**Step 5 – `getSupabaseServer()`**

- **File:** `lib/supabase/server.ts`
  - Uses `process.env.NEXT_PUBLIC_SUPABASE_URL` and **`process.env.SUPABASE_SERVICE_ROLE_KEY`**.
  - If either is missing, it **throws**:
    - `"NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set"`.

So both the **webhook** and **sync-role** depend on `.env` (or `.env.local`) having:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

If `SUPABASE_SERVICE_ROLE_KEY` is missing, the webhook cannot update the user, and the sync-role API will throw and return 500, so the client never gets a role update.

---

## 3. Why the role might stay "free"

| # | Cause | What to check |
|---|--------|----------------|
| 1 | **`SUPABASE_SERVICE_ROLE_KEY` not set** | `.env.local` has this (from Supabase → Project Settings → API → service_role). Restart dev server after adding it. |
| 2 | **Webhook never ran or failed** | Stripe Dashboard → Webhooks → your endpoint → see if `checkout.session.completed` was sent and returned 2xx. If it failed, Supabase never gets `app_metadata.role = "Paid User"`. |
| 3 | **No `userId` in checkout** | User must be **logged in** when clicking “Suscribirse” so the subscription page sends `userId={user?.id}` to create-checkout-session. Check that create-checkout-session receives `userId` and puts it in `metadata` and `client_reference_id`. |
| 4 | **sync-role not called or failing** | In browser DevTools → Network, filter for `sync-role`. Confirm the request is sent and returns 200 with `{ role: "Paid User" }` or similar. If 400/401/404/500, see server logs and the checks above. |
| 5 | **Wrong Supabase project** | Webhook and app must use the same Supabase project (same URL and same users). |

---

## 4. Quick checks

1. **Server env**  
   In the terminal where `npm run dev` runs, you should **not** see:
   - `NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set`  
   If you do, add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` and restart.

2. **Sync-role response**  
   Open dashboard, open DevTools → Network, find the request to **`/api/auth/sync-role`**.  
   - If it returns **200** with `{ "role": "Paid User" }` but the UI still shows “free”, the bug is in the client (e.g. not using `serverRole`).  
   - If it returns **404/500** or the role is `"free"`, then Supabase doesn’t have the role yet (webhook or env issue).

3. **Stripe webhook**  
   In Stripe Dashboard, open your webhook endpoint and check the last `checkout.session.completed` event: response code and body. If it’s 4xx/5xx, fix the webhook (env, URL, or code).

---

## 5. Summary

- **Role is updated** only via: login, initial load (with `?success=true`), `setUserRole("premium")` on dashboard when `?success=true`, and **`refreshUserFromSupabase()`** which uses **`/api/auth/sync-role`**.
- **Sync-role** returns whatever is in **Supabase Auth** `app_metadata.role` for the current user.
- **Supabase** gets that value only from the **Stripe webhook** (`updateUserById` with `app_metadata: { role: "Paid User" }`).
- So if the role stays **"free"**, either:
  - The **webhook** never updated Supabase (check env, Stripe webhook logs, `userId` in session), or  
  - **sync-role** is failing or not called (check Network tab and server logs), or  
  - **SUPABASE_SERVICE_ROLE_KEY** is missing so both webhook and sync-role fail.
