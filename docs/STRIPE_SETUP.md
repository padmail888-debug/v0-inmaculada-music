# Stripe integration – step-by-step (test mode)

Follow these steps to run Stripe in **test mode** with your Inmaculada Music app.

---

## 1. Stripe Dashboard (test mode)

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) and ensure **Test mode** is ON (toggle top-right).
2. **API keys**  
   Developers → API keys → copy:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)
3. **Products & prices**  
   - Create a product (e.g. “Inmaculada Premium”).  
   - Add a **recurring** price (e.g. 9.99 EUR/month).  
   - Copy the **Price ID** (e.g. `price_xxxxxxxxxxxxx`).  
   - Optional: create a second product/price for “Artist Pro” (e.g. 19.99 EUR/month) and copy its Price ID.

---

## 2. Environment variables

In the project root, create or edit `.env.local` and add:

```env
# Stripe (test keys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx

# Price IDs from Stripe Dashboard → Products
NEXT_PUBLIC_STRIPE_PRICE_PREMIUM=price_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PRICE_ARTIST_PRO=price_xxxxxxxxxxxxx

# Base URL for redirects (no trailing slash)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase (for webhook to upgrade user role)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

- Replace the `pk_test_`, `sk_test_`, and `price_` values with your real test keys and price IDs.  
- `NEXT_PUBLIC_APP_URL`: use `http://localhost:3000` for local dev; use your real domain for production.  
- Get **Supabase** URL and **service role** key from Supabase Dashboard → Project Settings → API.  
  **Important:** The service role key must stay server-only (used in the webhook). Never expose it in the browser.

Restart the dev server after changing env:

```bash
npm run dev
```

---

## 3. Webhook (so Premium is activated after payment)

Stripe will call your app when a payment succeeds. You need a **public URL** for the webhook.

### Option A: Local testing with Stripe CLI

1. Install [Stripe CLI](https://stripe.com/docs/stripe-cli).
2. Log in and forward webhooks to your app:

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

3. The CLI prints a **webhook signing secret** (e.g. `whsec_xxx`). Add it to `.env.local`:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

4. Restart the dev server. Pay with a test card (e.g. `4242 4242 4242 4242`); the webhook should run and the user’s role should be updated to Premium (via Supabase `app_metadata.role`).

### Option B: Deployed app (e.g. Vercel)

1. In Stripe Dashboard → Developers → Webhooks → Add endpoint.  
2. URL: `https://your-domain.com/api/webhooks/stripe`.  
3. Events to send: at least `checkout.session.completed`, and optionally `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`.  
4. Copy the **Signing secret** and set it in your hosting env:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

Redeploy so the new env is used.

---

## 4. Flow summary

1. User is **logged in** (Supabase auth).  
2. User goes to **Subscription** and clicks **Suscribirse** on Premium (or Artist Pro).  
3. App calls `/api/create-checkout-session` with `priceId`, `planName`, `userId`, `customerEmail`.  
4. User is redirected to **Stripe Checkout** (hosted by Stripe).  
5. After payment, Stripe redirects to `NEXT_PUBLIC_APP_URL/dashboard?success=true`.  
6. Stripe sends `checkout.session.completed` to `/api/webhooks/stripe`.  
7. Webhook reads `metadata.userId`, then uses **Supabase service role** to set `app_metadata.role` to `"Paid User"` (Premium) or `"Artist Pro"` (Artist Pro).  
8. The app syncs the role from the server via **`/api/auth/sync-role`** (source of truth), so after returning to the dashboard the UI should show Premium/Artist Pro. A retry runs after a few seconds in case the webhook was delayed.

**If the role still shows "free":**  

1. **Webhook must run**  
   - **Local:** Stripe cannot reach `localhost`. Run Stripe CLI and add `STRIPE_WEBHOOK_SECRET` to `.env.local`:
     ```bash
     stripe listen --forward-to localhost:3000/api/webhooks/stripe
     ```
     Use the `whsec_...` secret the CLI prints.
   - **Deployed:** If your app is built with **`output: 'export'`** (static export), API routes are **not** deployed — there is no `/api/webhooks/stripe`. Stripe will get 404 and the role will never be set. You must either remove `output: 'export'` and run Next.js as a server (e.g. Vercel Node server), or host the webhook as a serverless function at that URL.

2. **Env variables**  
   - **`SUPABASE_SERVICE_ROLE_KEY`** (Supabase → Project Settings → API → service_role) must be set. The webhook and `/api/auth/sync-role` need it to update and read the user role.  
   - **`STRIPE_WEBHOOK_SECRET`** must be set (from Stripe CLI or Stripe Dashboard → Webhooks → endpoint → Signing secret).  
   Restart the dev server after changing `.env.local`.

3. **User must be logged in when subscribing**  
   If the user was not logged in when they clicked Suscribirse, `userId` is not sent to Stripe, so the webhook cannot update anyone. Have them log in, go to Subscription again, and click the plan once more (or fix the role manually once — see below).

4. **Check server logs**  
   When the webhook runs, you should see logs like `[Stripe webhook] checkout.session.completed` and either `Updated user role: <userId> → Paid User` or `No userId in session`. If you see "No userId", the checkout session was created without a logged-in user. If you see "updateUserById error", check `SUPABASE_SERVICE_ROLE_KEY`.

5. **Refresh the app**  
   After the webhook has run, refresh the dashboard or log out and log in again; the app syncs the role from Supabase when loading.

---

### Fix role manually (one-off)

If the webhook never ran (e.g. you use static export so the webhook URL doesn’t exist, or you didn’t have Stripe CLI running, or the event failed), you can set the role once in Supabase:

1. Open **Supabase Dashboard** → **Authentication** → **Users**.  
2. Find the user (e.g. by email or by ID `c518c56a-dca0-49e2-ae03-cd11462c3378`).  
3. Open the user → **User Metadata** (or the section where **App metadata** is shown).  
4. Set **App metadata** to: `{ "role": "Paid User" }` (for Premium) or `{ "role": "Artist Pro" }`.  
   - If the UI only has a JSON editor for "Raw User Meta", add `"role": "Paid User"` inside the existing `app_metadata` object, or create it if missing.  
5. Save.  
6. In the app, refresh the dashboard or log out and log in again; sync-role will then return the new role.

After that, fix the webhook (URL, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`) so future payments update the role automatically.

---

## 5. Test cards (Stripe test mode)

- Success: `4242 4242 4242 4242`  
- Decline: `4000 0000 0000 0002`  
- More: [Stripe test cards](https://stripe.com/docs/testing#cards)

Use any future expiry, any CVC, and any postal code.

---

## 6. Going live

1. In Stripe Dashboard, switch to **Live mode**.  
2. Create live products/prices and get live **Publishable** and **Secret** keys.  
3. Replace the Stripe env vars in production with the **live** keys and **live** price IDs.  
4. Add a **live** webhook endpoint in Stripe pointing to `https://your-domain.com/api/webhooks/stripe` and set the **live** `STRIPE_WEBHOOK_SECRET` in production.  
5. Set `NEXT_PUBLIC_APP_URL` to your production URL.

Do not use live keys in `.env.local` or in the browser; use them only in your production environment.

---

## 7. Mobile app: return to app after Stripe

On Android/iOS, after payment Stripe opens the success URL in the **system browser**. To bring the user back into the native app:

- **Deep link** `inmaculada://dashboard` is configured in:
  - **Android:** `android/app/src/main/AndroidManifest.xml` (intent-filters for scheme `inmaculada`, hosts `dashboard` and `dashboard-success`).
  - **iOS:** `ios/App/App/Info.plist` (`CFBundleURLTypes` with scheme `inmaculada`).

- On the **dashboard success** screen (when opened in the browser) the user sees an **“Abrir en la app”** link that opens `inmaculada://dashboard`. Tapping it launches the app; the app then navigates to `/dashboard?success=true` inside the WebView (via `DeepLinkHandler` and `@capacitor/app`).

- Rebuild the native apps after changing manifest/Info.plist:  
  `npm run build` → `npx cap sync` → open and build in Android Studio / Xcode.
