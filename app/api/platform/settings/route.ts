import { NextResponse } from "next/server"
import { handleApiCorsPreflight, withApiCorsHeaders } from "@/lib/api-cors"
import { getSupabaseServer } from "@/lib/supabase/server"
import {
  DEFAULT_PLATFORM_SETTINGS,
  mapPlatformSettingsRow,
  type PlatformSettingsRow,
} from "@/lib/platform-settings"

export const runtime = "nodejs"

export function OPTIONS() {
  return handleApiCorsPreflight()
}

/** Public flags used by register / upload / maintenance UI. */
export async function GET() {
  try {
    const supabase = getSupabaseServer()
    const { data, error } = await supabase
      .from("platform_settings")
      .select(
        "id, user_registration, maintenance_mode, content_upload, premium_price, artist_commission, updated_at",
      )
      .eq("id", 1)
      .maybeSingle()

    if (error) throw new Error(error.message)

    const settings = data
      ? mapPlatformSettingsRow(data as PlatformSettingsRow)
      : DEFAULT_PLATFORM_SETTINGS

    return withApiCorsHeaders(
      NextResponse.json({
        ok: true,
        settings: {
          userRegistration: settings.userRegistration,
          maintenanceMode: settings.maintenanceMode,
          contentUpload: settings.contentUpload,
          premiumPrice: settings.premiumPrice,
          artistCommission: settings.artistCommission,
        },
      }),
    )
  } catch (error) {
    // Fail open with defaults so the app keeps working before SQL is applied
    console.warn(
      "[platform/settings]",
      error instanceof Error ? error.message : error,
    )
    return withApiCorsHeaders(
      NextResponse.json({
        ok: true,
        settings: {
          userRegistration: DEFAULT_PLATFORM_SETTINGS.userRegistration,
          maintenanceMode: DEFAULT_PLATFORM_SETTINGS.maintenanceMode,
          contentUpload: DEFAULT_PLATFORM_SETTINGS.contentUpload,
          premiumPrice: DEFAULT_PLATFORM_SETTINGS.premiumPrice,
          artistCommission: DEFAULT_PLATFORM_SETTINGS.artistCommission,
        },
        warning: "Usando valores por defecto (tabla platform_settings no disponible)",
      }),
    )
  }
}
