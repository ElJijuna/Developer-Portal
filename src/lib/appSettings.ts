import { createContext, useContext, useState, useCallback } from 'react'
import { getItem, setItem } from '@/lib/localStorage'

export interface AppSettings {
  theme: 'system' | 'light' | 'dark'
  accentColor: string
  glass: boolean
}

const STORAGE_KEY = 'dp:app:settings'

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  accentColor: '#3584e4',
  glass: false,
}

export function loadSettings(): AppSettings {
  const stored = getItem<AppSettings>(STORAGE_KEY)
  return stored ? { ...DEFAULT_SETTINGS, ...stored } : DEFAULT_SETTINGS
}

interface AppSettingsContextValue {
  settings: AppSettings
  updateSettings: (patch: Partial<AppSettings>) => void
}

export const AppSettingsContext = createContext<AppSettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  updateSettings: () => {},
})

export function useAppSettings() {
  return useContext(AppSettingsContext)
}

export function useAppSettingsState(): AppSettingsContextValue {
  const [settings, setSettings] = useState<AppSettings>(loadSettings)

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      setItem(STORAGE_KEY, next)
      return next
    })
  }, [])

  return { settings, updateSettings }
}
