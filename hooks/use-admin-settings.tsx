"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface AdminSettings {
  maintenanceMode: boolean
  userRegistration: boolean
  contentUpload: boolean
  premiumPrice: number
  artistCommission: number
}

interface AdminSettingsContextType {
  settings: AdminSettings
  updateSettings: (newSettings: Partial<AdminSettings>) => void
  toggleMaintenance: () => void
  isMaintenanceMode: boolean
}

const AdminSettingsContext = createContext<AdminSettingsContextType | undefined>(undefined)

export function AdminSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AdminSettings>({
    maintenanceMode: false,
    userRegistration: true,
    contentUpload: true,
    premiumPrice: 9.99,
    artistCommission: 70,
  })

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem("adminSettings")
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }
  }, [])

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("adminSettings", JSON.stringify(settings))
  }, [settings])

  const updateSettings = (newSettings: Partial<AdminSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }))
  }

  const toggleMaintenance = () => {
    setSettings((prev) => ({ ...prev, maintenanceMode: !prev.maintenanceMode }))
  }

  return (
    <AdminSettingsContext.Provider
      value={{
        settings,
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
