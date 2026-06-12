# How to create a release build

This project uses **Next.js** with **Capacitor** for Android and iOS. Below are the steps for web and mobile release builds.

---

## 1. Web (production)

For deploying to a server (e.g. Vercel, static hosting):

```bash
npm run build
```

- Next.js is configured with `output: 'export'`, so the build outputs static files to the **`out`** folder.
- Deploy the contents of **`out`** to your host (or use your host’s Next.js build if you change config).

---

## 2. Android release build (Capacitor)

### Prerequisites

- Node.js and npm installed
- **Android Studio** installed (for signing and building)
- **JDK 17** (Android Studio usually bundles it)

### Important: Deploy the Next.js app first (no separate API)

We use **Supabase** for auth and database. The “API” is just the **Next.js API routes** in this same repo (`/api/auth/sync-role`, `/api/create-checkout-session`, `/api/webhooks/stripe`). There is no separate API server to deploy.

The Android app runs **static files only** (no server inside the app). So from the app, those API routes must be called on a **deployed** instance of this Next.js app.

- **Deploy this Next.js app** somewhere (e.g. [Vercel](https://vercel.com) — connect the repo and deploy; no extra config).
- Set **`NEXT_PUBLIC_APP_URL`** in `.env.local` to that deployment URL (no trailing slash), e.g.  
  `NEXT_PUBLIC_APP_URL=https://your-app.vercel.app`
- When building the Android app, the Capacitor build uses this URL so that login → role sync and Stripe checkout hit your **deployed Next.js app**. If you don’t deploy or don’t set this, Premium users may still see “Suscripción” in the app because the role never syncs.

### Steps

**Step 1 – Build the web app and sync to Android**

You must run both commands every time you change the web app; otherwise the Android app will show an old version.

```bash
# From project root (run both)
npm run build
npx cap sync android
```

Or use the one-liner:

```bash
npm run cap:build:android
```

This generates the latest static site in `out/` and copies it into the Android project.

**Step 2 – Open the Android project**

```bash
npx cap open android
```

Android Studio will open the `android` project.

**Step 3 – Create a release build in Android Studio**

1. **Build → Generate Signed Bundle / APK**
2. Choose **APK** (or **Android App Bundle** for Play Store).
3. Create or select a **keystore** (first time: create new; keep the keystore and passwords safe).
4. Choose **release** build variant.
5. Click **Finish**. The signed APK will be in `android/app/release/` (e.g. `app-release.apk`).

**Step 4 – Install on your phone**

- Copy `app-release.apk` to your Android device and open it to install, or
- Use **Run → Run 'app'** and pick your connected device (debug/release depending on selected variant).

### Optional: release build from command line

After you have configured signing in Android Studio (or in `android/app/build.gradle`), you can run:

```bash
cd android
./gradlew assembleRelease
```

The APK will be at: `android/app/build/outputs/apk/release/app-release.apk`.

---

## 3. iOS release build (Capacitor)

### Prerequisites

- macOS with **Xcode** installed
- Apple Developer account (for device testing and App Store)

### Steps

```bash
npm run build
npx cap sync ios
npx cap open ios
```

In Xcode:

1. Select your **development team** and set **Bundle Identifier**.
2. Choose a **physical device** or “Any iOS Device” for archive.
3. **Product → Archive**, then **Distribute App** (e.g. Ad Hoc for your phone, or App Store).

---

## 4. Quick reference

| Target   | Commands                                      | Output / action                    |
|----------|------------------------------------------------|------------------------------------|
| Web      | `npm run build`                                | Static site in `out/`              |
| Android  | `npm run build` → `npx cap sync android` → open in Android Studio → **Generate Signed Bundle/APK** | Signed APK/Bundle |
| iOS      | `npm run build` → `npx cap sync ios` → open in Xcode → **Product → Archive** | Archive for distribution |

---

## 5. Android showing old view / version

Capacitor bundles a **copy** of your web app inside the Android project. If you see an old UI after code changes:

1. **Rebuild and sync** (from project root):
   ```bash
   npm run build
   npx cap sync android
   ```
   Or: `npm run cap:build:android`

2. **Rebuild the app** in Android Studio (**Build → Rebuild Project** or run on device again). Do not skip this after syncing.

3. **On the device:** Uninstall the old app and install the new APK, or clear the app’s cache/data. The WebView can sometimes keep an old copy in cache.

### Premium user still sees “Suscripción” on Android

If a user is Premium on the web but the Android app shows the Subscription option, the app is not reaching your deployed Next.js app for role sync:

- **Deploy this Next.js app** (e.g. Vercel) if you haven’t already — the same app that uses Supabase; no separate API to deploy.
- Set **`NEXT_PUBLIC_APP_URL`** in `.env.local` to that deployment URL (e.g. `https://your-app.vercel.app`) **before** running `npm run build` and `npx cap sync android`, then build the APK again. The app uses this URL to call your Next.js API routes when running in Capacitor.

---

## 6. Testing the release build on your Android phone

1. Build the signed APK as above (or use **Build → Build Bundle(s) / APK(s) → Build APK(s)** for a debug APK to test quickly).
2. Transfer the APK to your phone (USB, cloud, or internal testing track).
3. On the phone, open the APK and install (enable “Install unknown apps” for the source if prompted).
4. Use **Stripe test keys** and test cards to verify payments in the release build.
