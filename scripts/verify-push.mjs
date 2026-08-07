#!/usr/bin/env node
/**
 * Verifies push notification infrastructure (local + production).
 * Does not require a browser FCM token — checks config, endpoints, Firebase Admin, Supabase.
 */
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, "..")

function loadEnvLocal() {
  const envPath = path.join(root, ".env.local")
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
for (const [k, v] of Object.entries(env)) {
  if (v != null) process.env[k] = v
}

const PRODUCTION_URL =
  env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://v0-inmaculada-music-ochre.vercel.app"
const LOCAL_URL = "http://localhost:3000"

const REQUIRED_CLIENT = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
  "NEXT_PUBLIC_FIREBASE_VAPID_KEY",
]
const REQUIRED_SERVER = ["FIREBASE_PROJECT_ID", "FIREBASE_CLIENT_EMAIL", "FIREBASE_PRIVATE_KEY"]
const REQUIRED_SUPABASE = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
]

const results = []

function pass(label, detail = "") {
  results.push({ ok: true, label, detail })
  console.log(`✓ ${label}${detail ? ` — ${detail}` : ""}`)
}

function fail(label, detail = "") {
  results.push({ ok: false, label, detail })
  console.log(`✗ ${label}${detail ? ` — ${detail}` : ""}`)
}

function warn(label, detail = "") {
  results.push({ ok: null, label, detail })
  console.log(`⚠ ${label}${detail ? ` — ${detail}` : ""}`)
}

async function probeUrl(base, path, options = {}) {
  const url = `${base}${path}`
  try {
    const res = await fetch(url, { method: options.method || "GET", ...options.fetch })
    const text = await res.text().catch(() => "")
    return { url, status: res.status, text, ok: res.ok }
  } catch (e) {
    return { url, status: 0, text: "", ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

console.log("\n=== Push notification verification ===\n")

console.log("-- Environment --")
for (const key of REQUIRED_CLIENT) {
  if (env[key]) pass(`Client env: ${key}`)
  else fail(`Client env: ${key}`, "missing")
}
for (const key of REQUIRED_SERVER) {
  if (env[key]) pass(`Server env: ${key}`)
  else fail(`Server env: ${key}`, "missing")
}
for (const key of REQUIRED_SUPABASE) {
  if (env[key]) pass(`Supabase env: ${key}`)
  else fail(`Supabase env: ${key}`, "missing")
}

if (env.NEXT_PUBLIC_APP_URL?.includes("localhost")) {
  warn("NEXT_PUBLIC_APP_URL", "points to localhost — native APK will not reach production API")
} else if (env.NEXT_PUBLIC_APP_URL) {
  pass("NEXT_PUBLIC_APP_URL", env.NEXT_PUBLIC_APP_URL)
}

if (
  env.FIREBASE_PROJECT_ID &&
  env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
  env.FIREBASE_PROJECT_ID !== env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
) {
  fail("Firebase project IDs match", `admin=${env.FIREBASE_PROJECT_ID} client=${env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`)
} else if (env.FIREBASE_PROJECT_ID) {
  pass("Firebase project IDs match", env.FIREBASE_PROJECT_ID)
}

console.log("\n-- Firebase Admin SDK --")
try {
  const { getApps, initializeApp, cert } = await import("firebase-admin/app")
  const projectId = env.FIREBASE_PROJECT_ID
  const clientEmail = env.FIREBASE_CLIENT_EMAIL
  const privateKey = env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")
  if (!projectId || !clientEmail || !privateKey) {
    fail("Firebase Admin initializes", "missing credentials")
  } else {
    const app =
      getApps()[0] ??
      initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
      })
    if (app) pass("Firebase Admin initializes", projectId)
    else fail("Firebase Admin initializes", "initializeApp returned null")
  }
} catch (e) {
  fail("Firebase Admin initializes", e instanceof Error ? e.message : String(e))
}

console.log("\n-- Supabase device_tokens table --")
try {
  const { createClient } = await import("@supabase/supabase-js")
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { count, error } = await supabase
    .from("device_tokens")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true)
  if (error) fail("device_tokens table readable", error.message)
  else pass("device_tokens table readable", `${count ?? 0} active token(s)`)
} catch (e) {
  fail("device_tokens table readable", e instanceof Error ? e.message : String(e))
}

console.log("\n-- Service worker file (local) --")
const swPath = path.join(root, "public", "firebase-messaging-sw.js")
if (!fs.existsSync(swPath)) {
  fail("public/firebase-messaging-sw.js exists")
} else {
  const sw = fs.readFileSync(swPath, "utf8")
  if (sw.includes(env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "___")) pass("Local SW contains project ID")
  else fail("Local SW contains project ID", "regenerate with npm run generate:firebase-sw")
  if (sw.includes("onBackgroundMessage")) pass("Local SW has background handler")
  else fail("Local SW has background handler")
}

console.log("\n-- Mobile app (Capacitor / Android) --")
const googleServicesPath = path.join(root, "android", "app", "google-services.json")
if (fs.existsSync(googleServicesPath)) {
  pass("android/app/google-services.json exists")
  try {
    const gs = JSON.parse(fs.readFileSync(googleServicesPath, "utf8"))
    const pkg = gs?.client?.[0]?.client_info?.android_client_info?.package_name
    const projectId = gs?.project_info?.project_id
    if (pkg === "com.inmaculada.music") pass("google-services package_name", pkg)
    else fail("google-services package_name", pkg || "missing")
    if (projectId && projectId === env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      pass("google-services project matches client Firebase", projectId)
    } else {
      fail(
        "google-services project matches client Firebase",
        `${projectId} vs ${env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`,
      )
    }
  } catch (e) {
    fail("google-services.json parse", e instanceof Error ? e.message : String(e))
  }
} else {
  fail("android/app/google-services.json exists", "required for Android FCM tokens")
}

const nativeConfigPath = path.join(root, "public", "native-api-config.json")
if (fs.existsSync(nativeConfigPath)) {
  const nativeCfg = JSON.parse(fs.readFileSync(nativeConfigPath, "utf8"))
  if (nativeCfg.productionAppUrl) pass("native-api-config productionAppUrl", nativeCfg.productionAppUrl)
  else warn("native-api-config productionAppUrl", "missing — run npm run native-api-config")
  if (nativeCfg.lanApiBase) pass("native-api-config lanApiBase", nativeCfg.lanApiBase)
  else warn("native-api-config lanApiBase", "missing — run npm run dev:lan before cap:build:android:dev")
} else {
  warn("public/native-api-config.json", "missing — run npm run native-api-config")
}

const manifestPath = path.join(root, "android", "app", "src", "main", "AndroidManifest.xml")
if (fs.existsSync(manifestPath)) {
  const manifest = fs.readFileSync(manifestPath, "utf8")
  if (manifest.includes("POST_NOTIFICATIONS")) pass("Android POST_NOTIFICATIONS permission declared")
  else fail("Android POST_NOTIFICATIONS permission declared")
} else {
  warn("AndroidManifest.xml", "not found")
}

async function checkEndpoints(label, base) {
  console.log(`\n-- HTTP endpoints (${label}: ${base}) --`)
  const health = await probeUrl(base, "/api/health")
  if (health.ok && health.text.includes('"ok"')) pass(`${label} /api/health`, health.status)
  else if (health.error) fail(`${label} /api/health`, health.error)
  else fail(`${label} /api/health`, `${health.status} ${health.text.slice(0, 80)}`)

  const sw = await probeUrl(base, "/firebase-messaging-sw.js")
  if (sw.ok && sw.text.includes("firebase.messaging")) pass(`${label} /firebase-messaging-sw.js`, sw.status)
  else if (sw.error) fail(`${label} /firebase-messaging-sw.js`, sw.error)
  else fail(`${label} /firebase-messaging-sw.js`, `${sw.status}`)

  const register = await probeUrl(base, "/api/notifications/register-device", {
    method: "POST",
    fetch: {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "probe", platform: "web" }),
    },
  })
  if (register.status === 401) pass(`${label} register-device route`, "401 Unauthorized (route exists, auth required)")
  else if (register.status === 400) pass(`${label} register-device route`, "400 (route exists)")
  else if (register.error) fail(`${label} register-device route`, register.error)
  else fail(`${label} register-device route`, `${register.status} — expected 401`)
}

await checkEndpoints("production", PRODUCTION_URL)

const localHealth = await probeUrl(LOCAL_URL, "/api/health")
if (localHealth.ok) {
  await checkEndpoints("local", LOCAL_URL)
} else {
  warn("local dev server", "not running on :3000 — start with npm run dev to verify locally")
}

console.log("\n-- Summary --")
const failed = results.filter((r) => r.ok === false)
const warnings = results.filter((r) => r.ok === null)
const passed = results.filter((r) => r.ok === true)

console.log(`Passed: ${passed.length}  Failed: ${failed.length}  Warnings: ${warnings.length}`)

if (failed.length === 0) {
  console.log("\nInfrastructure looks ready.")
  console.log("\nMobile app checklist:")
  console.log("  LOCAL:  npm run dev:lan  →  npm run cap:build:android:dev  →  install APK  →  login + allow notifications")
  console.log("  PROD:   npm run cap:build:android:prod  →  install APK  →  login + allow notifications")
  console.log("  USB:    npm run adb:reverse && npm run dev:lan (optional, avoids Wi‑Fi)")
  console.log(
    "\nBrowser push: log in → allow notifications → DevTools: [notifications] FCM token registered",
  )
} else {
  console.log("\nFix failed checks above before push can work end-to-end.")
  process.exit(1)
}
