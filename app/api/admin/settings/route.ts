import { NextResponse } from "next/server"
import { handleApiCorsPreflight, withApiCorsHeaders } from "@/lib/api-cors"
import { requireSuperAdminFromRequest } from "@/lib/server-auth"
import { getSupabaseServer } from "@/lib/supabase/server"
import {
  clampPlatformSettings,
  DEFAULT_PLATFORM_SETTINGS,
  mapPlatformSettingsRow,
  type PlatformSettings,
  type PlatformSettingsRow,
} from "@/lib/platform-settings"

export const runtime = "nodejs"

export function OPTIONS() {
  return handleApiCorsPreflight()
}

async function ensureSettingsRow() {
  const supabase = getSupabaseServer()
  const { data, error } = await supabase
    .from("platform_settings")
    .select(
      "id, user_registration, maintenance_mode, content_upload, premium_price, artist_commission, updated_at, updated_by",
    )
    .eq("id", 1)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (data) return data as PlatformSettingsRow

  const { data: created, error: insertErr } = await supabase
    .from("platform_settings")
    .insert({ id: 1 })
    .select(
      "id, user_registration, maintenance_mode, content_upload, premium_price, artist_commission, updated_at, updated_by",
    )
    .single()

  if (insertErr || !created) {
    throw new Error(insertErr?.message || "No se pudo inicializar platform_settings")
  }
  return created as PlatformSettingsRow
}

export async function GET(request: Request) {
  try {
    const adminId = await requireSuperAdminFromRequest(request)
    if (!adminId) {
      return withApiCorsHeaders(NextResponse.json({ error: "Forbidden" }, { status: 403 }))
    }

    const row = await ensureSettingsRow()
    return withApiCorsHeaders(
      NextResponse.json({
        ok: true,
        settings: mapPlatformSettingsRow(row),
      }),
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error"
    const missingTable =
      /platform_settings|schema cache|does not exist|relation/i.test(message)
    return withApiCorsHeaders(
      NextResponse.json(
        {
          error: missingTable
            ? "Falta la tabla platform_settings. Ejecuta docs/supabase-platform-settings.sql en Supabase."
            : message,
          settings: DEFAULT_PLATFORM_SETTINGS,
        },
        { status: missingTable ? 503 : 500 },
      ),
    )
  }
}

export async function PUT(request: Request) {
  try {
    const adminId = await requireSuperAdminFromRequest(request)
    if (!adminId) {
      return withApiCorsHeaders(NextResponse.json({ error: "Forbidden" }, { status: 403 }))
    }

    const body = (await request.json().catch(() => null)) as Partial<PlatformSettings> | null
    if (!body || typeof body !== "object") {
      return withApiCorsHeaders(NextResponse.json({ error: "Body inválido" }, { status: 400 }))
    }

    const patch = clampPlatformSettings(body)
    if (Object.keys(patch).length === 0) {
      return withApiCorsHeaders(
        NextResponse.json({ error: "No hay cambios válidos" }, { status: 400 }),
      )
    }

    await ensureSettingsRow()

    const dbPatch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      updated_by: adminId,
    }
    if (patch.userRegistration != null) dbPatch.user_registration = patch.userRegistration
    if (patch.maintenanceMode != null) dbPatch.maintenance_mode = patch.maintenanceMode
    if (patch.contentUpload != null) dbPatch.content_upload = patch.contentUpload
    if (patch.premiumPrice != null) dbPatch.premium_price = patch.premiumPrice
    if (patch.artistCommission != null) dbPatch.artist_commission = patch.artistCommission

    const supabase = getSupabaseServer()
    const { data, error } = await supabase
      .from("platform_settings")
      .update(dbPatch)
      .eq("id", 1)
      .select(
        "id, user_registration, maintenance_mode, content_upload, premium_price, artist_commission, updated_at, updated_by",
      )
      .single()

    if (error || !data) {
      throw new Error(error?.message || "No se pudo guardar")
    }

    return withApiCorsHeaders(
      NextResponse.json({
        ok: true,
        settings: mapPlatformSettingsRow(data as PlatformSettingsRow),
      }),
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error"
    const missingTable =
      /platform_settings|schema cache|does not exist|relation/i.test(message)
    return withApiCorsHeaders(
      NextResponse.json(
        {
          error: missingTable
            ? "Falta la tabla platform_settings. Ejecuta docs/supabase-platform-settings.sql en Supabase."
            : message,
        },
        { status: missingTable ? 503 : 500 },
      ),
    )
  }
}
