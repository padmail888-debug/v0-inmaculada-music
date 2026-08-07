export type PlatformSettings = {
  userRegistration: boolean
  maintenanceMode: boolean
  contentUpload: boolean
  premiumPrice: number
  artistCommission: number
  updatedAt?: string | null
}

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  userRegistration: true,
  maintenanceMode: false,
  contentUpload: true,
  premiumPrice: 9.99,
  artistCommission: 70,
  updatedAt: null,
}

export type PlatformSettingsRow = {
  id: number
  user_registration: boolean
  maintenance_mode: boolean
  content_upload: boolean
  premium_price: number | string
  artist_commission: number | string
  updated_at: string
  updated_by?: string | null
}

export function mapPlatformSettingsRow(row: PlatformSettingsRow): PlatformSettings {
  return {
    userRegistration: !!row.user_registration,
    maintenanceMode: !!row.maintenance_mode,
    contentUpload: !!row.content_upload,
    premiumPrice: Number(row.premium_price) || DEFAULT_PLATFORM_SETTINGS.premiumPrice,
    artistCommission: Number(row.artist_commission) || DEFAULT_PLATFORM_SETTINGS.artistCommission,
    updatedAt: row.updated_at || null,
  }
}

export function clampPlatformSettings(
  input: Partial<PlatformSettings>,
): Partial<PlatformSettings> {
  const out: Partial<PlatformSettings> = {}
  if (typeof input.userRegistration === "boolean") out.userRegistration = input.userRegistration
  if (typeof input.maintenanceMode === "boolean") out.maintenanceMode = input.maintenanceMode
  if (typeof input.contentUpload === "boolean") out.contentUpload = input.contentUpload
  if (typeof input.premiumPrice === "number" && Number.isFinite(input.premiumPrice)) {
    out.premiumPrice = Math.max(0, Math.round(input.premiumPrice * 100) / 100)
  }
  if (typeof input.artistCommission === "number" && Number.isFinite(input.artistCommission)) {
    out.artistCommission = Math.max(0, Math.min(100, Math.round(input.artistCommission * 10) / 10))
  }
  return out
}
