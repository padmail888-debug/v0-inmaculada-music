# Notifications: Missing Items Checklist

This document lists what is still missing to make notifications fully functional in production for **web + Android + iOS**.

---

## Current status (already implemented)

- Notifications page exists: `app/notifications/page.tsx`
- Bell badge reads real unread count from API
- API routes implemented:
  - `GET /api/notifications`
  - `POST /api/notifications/mark-read`
  - `POST /api/notifications/mark-all-read`
  - `POST /api/notifications/register-device`
- Firebase push registration hook added in app layout:
  - `components/notifications/push-notification-registrar.tsx`
- Server-side notification creation + push dispatch utility:
  - `lib/notification-service.ts`
  - `lib/firebase-admin.ts`
- Stripe webhook sends payment success notifications.

---

## 1) Supabase setup still required (mandatory)

You must run:

- `docs/supabase-notifications-tables.sql`

in Supabase SQL editor.

This creates:
- `notifications`
- `user_notifications`
- `device_tokens`
- required indexes + RLS policies

Without this, notifications cannot be persisted correctly.

---

## 2) Firebase configuration still required (mandatory)

Set these env vars in `.env.local` (and deployment env):

### Web SDK vars
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_VAPID_KEY`

### Admin SDK vars (server push sender)
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

Also ensure:
- Firebase Cloud Messaging is enabled in Firebase project.

---

## 3) Native mobile setup still required (mandatory for Android/iOS push)

This app uses **`@capacitor-firebase/messaging`** (FCM tokens on Android, iOS, and web).

### Android
- Add `google-services.json` to `android/app/google-services.json`.
- Package name must be `com.inmaculada.music`.
- Add SHA-1 fingerprints in Firebase Console (debug + release).
- Run `npm run build && npx cap sync android` and reinstall the APK.

### iOS
- Download `GoogleService-Info.plist` from Firebase (iOS app, bundle `com.inmaculada.music`).
- Save as `ios/App/App/GoogleService-Info.plist` (see `GoogleService-Info.plist.example`).
- Xcode: enable **Push Notifications** + **Background Modes → Remote notifications**.
- Upload **APNs Auth Key** (or certificate) in Firebase → Cloud Messaging.
- `AppDelegate.swift` must include Capacitor push hooks (already in repo).
- Run `npm run build && npx cap sync ios`, then build in Xcode.

### Web
- Set `NEXT_PUBLIC_FIREBASE_VAPID_KEY` in `.env.local`.
- Run `npm run generate:firebase-sw` (runs automatically on `npm run dev` / `npm run build`).
- Ensures `public/firebase-messaging-sw.js` contains your Firebase web config.

Without these steps, push will not work on that platform.

---

## 4) Deployment requirement (mandatory)

Mobile builds cannot call local `/api/*`.

You must:
- deploy this Next.js app (same repo) to a public URL
- set `NEXT_PUBLIC_APP_URL` to that deployment URL

Otherwise:
- role sync and notification APIs fail in Capacitor builds.

---

## 5) Event coverage missing vs client requirements

Currently implemented event:
- Payment success (Stripe webhook)

Still missing event emitters:
- New follower -> notify artist / artist-pro
- Song liked -> notify artist / artist-pro
- New song release -> notify followers (free/premium)
- New album release -> notify followers (free/premium)
- Payment failed -> notify affected user/admin (based on policy)
- Security alerts -> notify target user/admin
- Account events -> notify target user
- Artist-pro feature usage -> notify artist-pro
- Admin failures/alerts -> notify admins
- Admin alert for new pro payments (partially covered for artist-pro checkout path only)

---

## 6) Deep-link routing still to validate

Client asked:
- album release -> album page
- new song -> song page
- account -> account page
- error alerts -> no destination
- artist payment success -> artist summary/profile panel

Need to ensure each event writes proper `deep_link` in notification payload.

---

## 7) Realtime live updates still missing

Current UI polls APIs.

To make truly realtime:
- subscribe to Supabase Realtime on `user_notifications`
- update bell count + list immediately on insert/update

Polling works, but realtime subscription is still pending.

---

## 8) Reliability/ops items still missing

- Retry queue / outbox for push send failures
- Token invalidation cleanup for expired FCM/APNs tokens
- Deduplication/idempotency keys for repeated events
- Rate limiting / anti-spam rules per user/category
- Notification analytics (sent/read/open/click)

---

## 9) User preferences still missing

No UI/settings yet for:
- enable/disable categories
- quiet hours
- channel preferences (push vs in-app)

If required by client, add `notification_preferences` table + settings UI.

---

## 10) QA checklist still pending before release

- Verify free user with no notifications shows empty state
- Verify premium user receives followed-artist release alerts
- Verify artist gets follower + like notifications
- Verify artist-pro gets payment/pro-feature notifications
- Verify admin gets system + pro payment alerts
- Verify unread badge + mark-read + mark-all-read
- Verify deep links for all notification types
- Verify push on:
  - Web (foreground + background)
  - Android (foreground/background/killed)
  - iOS (foreground/background/killed)

---

## Suggested next implementation order

1. Run SQL + Firebase env setup + native config
2. Implement missing event emitters (follower, like, releases)
3. Implement security/account/admin events
4. Add realtime subscription
5. Add retry/outbox + analytics
6. Add notification preferences

