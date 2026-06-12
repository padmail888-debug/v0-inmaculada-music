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
  generatedAt: new Date().toISOString(),
}

fs.mkdirSync(path.dirname(outPath), { recursive: true })
fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8")

console.log(
  `[write-native-api-config] lanApiBase=${lanApiBase ?? "(none — use emulator 10.0.2.2 or adb reverse)"}`,
)
