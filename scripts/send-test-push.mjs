#!/usr/bin/env node
/** Send a test push to all active device tokens (dry-run friendly). */
import path from "path"
import { fileURLToPath } from "url"
import { getApps, initializeApp, cert } from "firebase-admin/app"
import { getMessaging } from "firebase-admin/messaging"
import { createClient } from "@supabase/supabase-js"
import { loadDotenv } from "./load-dotenv.mjs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, "..")

const env = { ...loadDotenv(root), ...process.env }

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
