#!/usr/bin/env node
/**
 * Writes public/native-api-config.json with this machine's LAN IP so the Android/iOS
 * app can reach `next dev` without `adb reverse` (physical device on same Wi‑Fi).
 */
import fs from "fs"
import os from "os"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, "..")
const outPath = path.join(root, "public", "native-api-config.json")

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

function pickLanIpv4() {
  const nets = os.networkInterfaces()
  const candidates = []
  for (const entries of Object.values(nets)) {
    for (const net of entries ?? []) {
      if (net.family !== "IPv4" || net.internal) continue
      candidates.push(net.address)
    }
  }
  // Prefer common Wi‑Fi ranges over link-local / docker
  const preferred = candidates.find((ip) => /^192\.168\./.test(ip) || /^10\./.test(ip))
  return preferred ?? candidates[0] ?? null
}

// Keep in sync with package.json `next dev -p 3000`
const port = process.env.PORT || process.env.NEXT_PUBLIC_DEV_PORT || "3000"
const lanIp = pickLanIpv4()
const lanApiBase = lanIp ? `http://${lanIp}:${port}` : null

const payload = {
  lanApiBase,
  productionAppUrl: (env.NEXT_PUBLIC_APP_URL || "").trim().replace(/\/$/, "") || null,
  generatedAt: new Date().toISOString(),
}

fs.mkdirSync(path.dirname(outPath), { recursive: true })
fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8")

console.log(
  `[write-native-api-config] lanApiBase=${lanApiBase ?? "(none — use emulator 10.0.2.2 or adb reverse)"}`,
)
