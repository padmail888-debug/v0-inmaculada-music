/**
 * Generates public/firebase-messaging-sw.js from .env / .env.local for web background push.
 * Run before `next build` (see package.json).
 */
import fs from "fs"
import path from "path"
import { loadDotenv } from "./load-dotenv.mjs"

const env = { ...loadDotenv(process.cwd()), ...process.env }
const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
}

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  const onVercel = process.env.VERCEL === "1" || process.env.VERCEL === "true"
  const message =
    "[generate-firebase-messaging-sw] Missing NEXT_PUBLIC_FIREBASE_* env vars — web push will not work."
  if (onVercel) {
    console.error(`${message} Set them in Vercel → Project → Environment Variables, then redeploy.`)
    process.exit(1)
  }
  console.warn(`${message} Writing minimal service worker.`)
}

const sw = `/* Auto-generated — do not edit. Run: npm run generate:firebase-sw */
importScripts("https://www.gstatic.com/firebasejs/11.8.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.8.1/firebase-messaging-compat.js");

firebase.initializeApp(${JSON.stringify(firebaseConfig)});
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "Nueva notificación";
  const body = payload.notification?.body || "Tienes una notificación nueva.";
  const data = payload.data || {};
  self.registration.showNotification(title, { body, data });
});
`

const outPath = path.join(process.cwd(), "public", "firebase-messaging-sw.js")
fs.writeFileSync(outPath, sw)
console.log("[generate-firebase-messaging-sw] Wrote", outPath)
