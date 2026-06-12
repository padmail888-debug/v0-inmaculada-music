"use client"

import { Capacitor } from "@capacitor/core"
import { getFirebaseWebApp } from "@/lib/firebase-client"

/**
 * @capacitor-firebase/messaging web implementation calls getMessaging() without
 * initializeApp(). Ensure the default Firebase app exists before any web push code runs.
 */
export function ensureFirebaseWebApp() {
  if (typeof window === "undefined" || Capacitor.isNativePlatform()) return null
  return getFirebaseWebApp()
}

if (typeof window !== "undefined" && !Capacitor.isNativePlatform()) {
  ensureFirebaseWebApp()
}
