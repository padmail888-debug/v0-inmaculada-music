"use client"

import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import { getMessaging, isSupported } from "firebase/messaging"

let app: FirebaseApp | null = null

export function getFirebaseWebApp(): FirebaseApp | null {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID

  if (!apiKey || !authDomain || !projectId || !messagingSenderId || !appId) return null
  if (app) return app
  app =
    getApps()[0] ??
    initializeApp({
      apiKey,
      authDomain,
      projectId,
      messagingSenderId,
      appId,
    })
  return app
}

export async function getFirebaseMessagingIfSupported() {
  const supported = await isSupported().catch(() => false)
  if (!supported) return null
  const firebaseApp = getFirebaseWebApp()
  if (!firebaseApp) return null
  return getMessaging(firebaseApp)
}
