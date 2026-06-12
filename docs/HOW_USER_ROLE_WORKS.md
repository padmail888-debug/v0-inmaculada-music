# How we get the user role (simple explanation)

## Where the role is stored

The **real** role (free vs premium) is stored in **Supabase Auth**, on each user, in a field called **`app_metadata.role`**:

- In Supabase Dashboard: **Authentication → Users → [your user] → User Metadata** (or look for `app_metadata`).
- Values we use: `"free"`, `"Paid User"` (premium), `"Artist Pro"`, etc.

The **sidebar** and the rest of the app do **not** read from Supabase directly. They read from **React state** and **localStorage**, which we keep in sync with Supabase.

---

## How we GET the role (read from Supabase)

We read the role in two places.

### 1. Server: `/api/auth/sync-role` (source of truth)

When the app needs the latest role, it calls this API:

```
Browser                          Your Next.js server                    Supabase
   |                                      |                                  |
   |  POST /api/auth/sync-role            |                                  |
   |  body: { accessToken: "eyJ..." }      |                                  |
   |  ----------------------------------> |                                  |
   |                                      |  1. Decode JWT → get userId      |
   |                                      |  2. supabase.auth.admin          |
   |                                      |     .getUserById(userId)          |
   |                                      |  ------------------------------->|
   |                                      |                                  |
   |                                      |  <-- user with app_metadata.role  |
   |                                      |  return { role: "Paid User" }      |
   |  <---------------------------------- |                                  |
   |  { role: "Paid User" }                |                                  |
```

- **File:** `app/api/auth/sync-role/route.ts`
- **What it does:**
  1. Receives the user’s **access token** (JWT) from the request body.
  2. Decodes the JWT to get **`userId`** (the `sub` claim).
  3. Uses **`getSupabaseServer()`** (which uses **`SUPABASE_SERVICE_ROLE_KEY`**) to call **`supabase.auth.admin.getUserById(userId)`**.
  4. Reads **`user.app_metadata.role`** from that user (e.g. `"Paid User"` or `undefined`).
  5. Returns **`{ role: "Paid User" }`** or **`{ role: "free" }`** (if missing).

So: **we get the user role by reading Supabase Auth’s `app_metadata.role` via the sync-role API, which uses the service role key.**

### 2. Client: `refreshUserFromSupabase()` (updates the app)

- **File:** `hooks/use-auth.tsx`
- **What it does:**
  1. Gets the current session: **`supabase.auth.getSession()`** → **`accessToken`**.
  2. Calls **`POST /api/auth/sync-role`** with **`{ accessToken }`**.
  3. Reads the response **`{ role: "Paid User" }`** (or `"free"`).
  4. Maps that string to our app role: **`"Paid User"` → `"premium"`**, **`"free"` → `"free"`** (see `mapSupabaseRoleToUserRole`).
  5. Updates React state and **localStorage** with **`setUser({ ...user, role: "premium" })`**.

So: **we get the role by calling the sync-role API with the user’s token; the API reads from Supabase and returns the role; we then map it and save it in the app (state + localStorage).**

---

## How the role gets INTO Supabase (who sets premium?)

The app **never** sets `app_metadata.role` from the browser. Only the **Stripe webhook** on your server does:

1. User pays on Stripe Checkout.
2. Stripe sends a request to **`/api/webhooks/stripe`** with event **`checkout.session.completed`**.
3. The webhook reads **`userId`** from the session metadata (we put it there when creating the checkout).
4. The webhook calls **`supabase.auth.admin.updateUserById(userId, { app_metadata: { role: "Paid User" } })`** (using **`SUPABASE_SERVICE_ROLE_KEY`**).
5. Supabase saves that on the user. From then on, **sync-role** will return **`"Paid User"`** and the app will show **premium**.

So: **we get the user role from Supabase; Supabase gets the “premium” role from the Stripe webhook. If the webhook never runs or fails, `app_metadata.role` stays empty/free and we keep showing “free”.**

---

## Short summary

| Question | Answer |
|----------|--------|
| **Where is the role stored?** | Supabase Auth → each user → **`app_metadata.role`** (e.g. `"Paid User"`, `"free"`). |
| **How do we GET it?** | 1) App calls **`/api/auth/sync-role`** with the user’s **access token**. 2) API uses **service role** to run **`getUserById(userId)`** and returns **`app_metadata.role`**. 3) App maps that to `"premium"` / `"free"` and updates state and localStorage. |
| **Why do we need SUPABASE_SERVICE_ROLE_KEY?** | So the **sync-role** API and the **Stripe webhook** can call **`auth.admin.getUserById`** / **`auth.admin.updateUserById`**. Without it, we can’t read or write `app_metadata.role`. |
| **Why might it still show “free”?** | 1) **Webhook didn’t run or failed** → Supabase never got `app_metadata.role = "Paid User"`. 2) **Checkout had no `userId`** → webhook can’t update the right user. 3) **sync-role fails** (e.g. wrong env) → app never gets the updated role. |

So: **we get the user role by reading Supabase’s `app_metadata.role` via the sync-role API (which uses the service role key). The value that ends up there for premium is set only by the Stripe webhook.**
