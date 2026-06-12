# API Integration Overview

This document describes how APIs are integrated in the Inmaculada Music app.

---

## 1. Next.js API Routes (backend)

All API endpoints live under **`app/api/`**. They run on the server and are called from the frontend via `fetch("/api/...")`.

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/create-checkout-session` | POST | Creates a Stripe Checkout session for subscription (Premium / Artist Pro). |
| `/api/create-customer-portal` | POST | Creates a Stripe Billing Portal session (manage subscription, payment methods). |
| `/api/webhooks/stripe` | POST | Receives Stripe webhooks (subscription created/updated/deleted, payment succeeded/failed). |

---

## 2. Create Checkout Session (subscription payment)

**Backend:** `app/api/create-checkout-session/route.ts`

- Reads `priceId` and `planName` from the request body.
- Uses the **Stripe server SDK** to create a Checkout Session (`stripe.checkout.sessions.create`).
- Returns `{ sessionId }` so the client can redirect to Stripe Checkout.

**Frontend:** `components/payment/stripe-checkout.tsx`

- User submits the checkout form (plan + price).
- Component calls your API with `fetch("/api/create-checkout-session", { method: "POST", body: JSON.stringify({ priceId, planName }) })`.
- Reads `sessionId` from the JSON response.
- Redirects to Stripe Checkout with `stripe.redirectToCheckout({ sessionId })`.

```ts
// Frontend (stripe-checkout.tsx)
const response = await fetch("/api/create-checkout-session", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ priceId, planName }),
})
const { sessionId } = await response.json()
await stripe.redirectToCheckout({ sessionId })
```

```ts
// Backend (app/api/create-checkout-session/route.ts)
const { priceId, planName } = await request.json()
const session = await stripe.checkout.sessions.create({
  mode: "subscription",
  line_items: [{ price: priceId, quantity: 1 }],
  success_url: `${STRIPE_CONFIG.domain}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${STRIPE_CONFIG.domain}/subscription?canceled=true`,
  // ...
})
return NextResponse.json({ sessionId: session.id })
```

---

## 3. Create Customer Portal (manage subscription)

**Backend:** `app/api/create-customer-portal/route.ts`

- Reads `customerId` from the request body.
- Creates a Stripe Billing Portal session (`stripe.billingPortal.sessions.create`).
- Returns `{ url }` so the client can redirect the user to the portal.

**Frontend:** To use this API, some page (e.g. subscription or profile) should call it when the user clicks “Manage subscription” or similar, then redirect: `window.location.href = data.url`. Currently no component in the repo calls this endpoint; you can add a button that does:

```ts
const res = await fetch("/api/create-customer-portal", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ customerId: user.stripeCustomerId }),
})
const { url } = await res.json()
if (url) window.location.href = url
```

---

## 4. Stripe Webhook (subscription and payment events)

**Backend:** `app/api/webhooks/stripe/route.ts`

- Receives **POST** requests from Stripe (configure the webhook URL in Stripe Dashboard to point to `https://your-domain.com/api/webhooks/stripe`).
- Verifies the request using `STRIPE_WEBHOOK_SECRET` and `stripe.webhooks.constructEvent`.
- Handles events:
  - `customer.subscription.created` → e.g. upgrade user to premium/artist-pro (TODO: persist in DB).
  - `customer.subscription.updated` → handle plan changes (TODO).
  - `customer.subscription.deleted` → downgrade to free (TODO).
  - `invoice.payment_succeeded` / `invoice.payment_failed` → logging (and optionally DB updates).

All subscription updates are intended to be persisted in your database in the `handleSubscription*` functions (marked TODO in the code).

---

## 5. Stripe configuration

**File:** `lib/stripe-config.ts`

- **`STRIPE_CONFIG`**: publishable key (frontend), domain (success/cancel URLs), and **price IDs** for Premium and Artist Pro.
- **`stripe`**: Used by API routes. Currently set to a **placeholder string** (`"stripe-placeholder"`). For real payments you must replace this with a real Stripe instance, e.g.:

```ts
import Stripe from "stripe"

export const stripe =
  process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" })
    : (null as unknown as Stripe) // or throw in production
```

Set **`STRIPE_SECRET_KEY`** (and for webhooks **`STRIPE_WEBHOOK_SECRET`**) in `.env` or your deployment environment.

---

## 6. What does *not* use APIs (mock/local)

- **Login / Register:** `components/auth/login-form.tsx` and `register-form.tsx` use **mock logic** (no `fetch` to a backend). User data is kept in React state/context only.
- **Dashboard / Search / Artist profile / Music:** Tracks and artist data are **mock arrays** in component state or `useEffect`; no REST or GraphQL API calls for music catalog yet.
- **Offline storage:** `lib/offline-storage.ts` and `hooks/use-offline.tsx` use the **browser Cache API / IndexedDB** and local state, not your backend.

---

## 7. Summary diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  Frontend (React / Next.js client components)                    │
├─────────────────────────────────────────────────────────────────┤
│  • StripeCheckout  →  fetch("/api/create-checkout-session")       │
│  • (Optional)      →  fetch("/api/create-customer-portal")        │
│  • Auth, tracks    →  mock data (no API)                          │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Next.js API routes (app/api/*)                                  │
├─────────────────────────────────────────────────────────────────┤
│  create-checkout-session  →  Stripe API (create session)         │
│  create-customer-portal   →  Stripe API (portal session)          │
│  webhooks/stripe          ←  Stripe sends events (POST)         │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Stripe (external)                                               │
│  • Checkout, Billing Portal, Webhooks                            │
└─────────────────────────────────────────────────────────────────┘
```

To add a new API: create a file under `app/api/<name>/route.ts` (e.g. `route.ts` with `export async function GET(request)` or `POST(request)`), then call it from the frontend with `fetch("/api/<name>", { method: "POST", body: JSON.stringify(...) })`.
