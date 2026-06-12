import { Capacitor } from "@capacitor/core"
import { shouldUseCapacitorNativePush } from "@/lib/api-base"

export type PushPlatform = "android" | "ios" | "web"

export function getPushPlatform(): PushPlatform {
  if (!shouldUseCapacitorNativePush()) return "web"
  try {
    if (Capacitor.getPlatform() === "ios") return "ios"
  } catch {
    /* ignore */
  }
  return "android"
}
