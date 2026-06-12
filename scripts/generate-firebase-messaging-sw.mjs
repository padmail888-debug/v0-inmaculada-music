/**
 * Generates public/firebase-messaging-sw.js from .env.local for web background push.
 * Run before `next build` (see package.json).
 */
import fs from "fs"
import path from "path"

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local")
  if (!fs.existsSync(envPath)) return {}
  const env = {}
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    env[key] = value
  }
  return env
}

const env = { ...loadEnvLocal(), ...process.env }
const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
}

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.warn(
    "[generate-firebase-messaging-sw] Missing Firebase env vars; writing minimal service worker.",
  )
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
