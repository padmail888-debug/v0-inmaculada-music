#!/usr/bin/env node
/** Send a test push to all active device tokens (dry-run friendly). */
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { getApps, initializeApp, cert } from "firebase-admin/app"
import { getMessaging } from "firebase-admin/messaging"
import { createClient } from "@supabase/supabase-js"

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

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const { data: rows, error } = await supabase
  .from("device_tokens")
  .select("token, platform, user_id")
  .eq("is_active", true)

if (error) {
  console.error("device_tokens query failed:", error.message)
  process.exit(1)
}

if (!rows?.length) {
  console.log("No active device tokens — log in on web/production and allow notifications first.")
  process.exit(0)
}

console.log(`Found ${rows.length} active token(s):`)
for (const row of rows) {
  console.log(`  - ${row.platform} user=${row.user_id} token=${row.token.slice(0, 16)}…`)
}

const projectId = env.FIREBASE_PROJECT_ID
const clientEmail = env.FIREBASE_CLIENT_EMAIL
const privateKey = env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")

const app =
  getApps()[0] ??
  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  })

const messaging = getMessaging(app)
const tokens = rows.map((r) => r.token)

const res = await messaging.sendEachForMulticast({
  tokens,
  notification: {
    title: "Push test — Inmaculada Music",
    body: "If you see this, push notifications are working.",
  },
  data: {
    type: "account",
    deepLink: "/notifications",
    deep_link: "/notifications",
  },
  webpush: {
    fcmOptions: { link: "/notifications" },
  },
})

console.log("\nFCM result:")
console.log(`  success: ${res.successCount}`)
console.log(`  failure: ${res.failureCount}`)
res.responses.forEach((r, i) => {
  if (!r.success) {
    console.log(`  token[${i}] error:`, r.error?.code, r.error?.message)
  }
})

process.exit(res.successCount > 0 ? 0 : 1)
