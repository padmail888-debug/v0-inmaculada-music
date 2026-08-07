"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import {
  nativeCrossOriginFetchInit,
  resolveApiUrl,
  shouldUseRemoteApiBase,
} from "@/lib/api-base"
import { getCachedResolvedApiBase, resolveNativeApiBase } from "@/lib/native-api-resolver"
import {
  DEFAULT_PLATFORM_SETTINGS,
  type PlatformSettings,
} from "@/lib/platform-settings"
import { fetchAdminSettings, saveAdminSettings } from "@/lib/admin-api"

type AdminSettingsContextType = {
  settings: PlatformSettings
  loading: boolean
  saving: boolean
  error: string | null
  /** Public or admin load. Pass `asAdmin: true` from the Configuración tab. */
  loadSettings: (opts?: { asAdmin?: boolean }) => Promise<void>
  saveSettings: (patch: Partial<PlatformSettings>) => Promise<PlatformSettings>
  updateSettings: (patch: Partial<PlatformSettings>) => void
  toggleMaintenance: () => Promise<void>
  isMaintenanceMode: boolean
}

const AdminSettingsContext = createContext<AdminSettingsContextType | undefined>(undefined)

async function fetchPublicSettings(): Promise<PlatformSettings> {
  if (shouldUseRemoteApiBase() && !getCachedResolvedApiBase()) {
    await resolveNativeApiBase()
  }
  const url = resolveApiUrl("/api/platform/settings")
  if (!url) return { ...DEFAULT_PLATFORM_SETTINGS }

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      ...nativeCrossOriginFetchInit,
    })
    const payload = await res.json().catch(() => null)
    if (!res.ok || !payload?.settings) return { ...DEFAULT_PLATFORM_SETTINGS }
    return {
      ...DEFAULT_PLATFORM_SETTINGS,
      ...payload.settings,
    }
  } catch {
    return { ...DEFAULT_PLATFORM_SETTINGS }
  }
}

export function AdminSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PlatformSettings>({ ...DEFAULT_PLATFORM_SETTINGS })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSettings = useCallback(async (opts?: { asAdmin?: boolean }) => {
    setLoading(true)
    setError(null)
    try {
      if (opts?.asAdmin) {
        const adminSettings = await fetchAdminSettings()
        setSettings({ ...DEFAULT_PLATFORM_SETTINGS, ...adminSettings })
      } else {
        const publicSettings = await fetchPublicSettings()
        setSettings(publicSettings)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar configuración")
      if (!opts?.asAdmin) {
        setSettings({ ...DEFAULT_PLATFORM_SETTINGS })
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSettings()
  }, [loadSettings])

  const updateSettings = useCallback((patch: Partial<PlatformSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }))
  }, [])

  const saveSettings = useCallback(async (patch: Partial<PlatformSettings>) => {
    setSaving(true)
    setError(null)
    try {
      const next = await saveAdminSettings(patch)
      const merged = { ...DEFAULT_PLATFORM_SETTINGS, ...next }
      setSettings(merged)
      return merged
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo guardar"
      setError(message)
      throw err
    } finally {
      setSaving(false)
    }
  }, [])

  const toggleMaintenance = useCallback(async () => {
    const next = !settings.maintenanceMode
    setSettings((prev) => ({ ...prev, maintenanceMode: next }))
    try {
      await saveSettings({ maintenanceMode: next })
    } catch {
      setSettings((prev) => ({ ...prev, maintenanceMode: !next }))
    }
  }, [settings.maintenanceMode, saveSettings])

  return (
    <AdminSettingsContext.Provider
      value={{
        settings,
        loading,
        saving,
        error,
        loadSettings,
        saveSettings,
        updateSettings,
        toggleMaintenance,
        isMaintenanceMode: settings.maintenanceMode,
      }}
    >
      {children}
    </AdminSettingsContext.Provider>
  )
}

export function useAdminSettings() {
  const context = useContext(AdminSettingsContext)
  if (context === undefined) {
    throw new Error("useAdminSettings must be used within an AdminSettingsProvider")
  }
  return context
}
