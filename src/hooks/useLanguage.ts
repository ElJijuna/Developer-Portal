import { useState, useEffect } from 'react'
import { api } from 'code-languages'
import type { LocalizedLanguage } from 'code-languages'

export function useLanguage(language: string | null | undefined): LocalizedLanguage | null {
  const [langInfo, setLangInfo] = useState<LocalizedLanguage | null>(null)

  useEffect(() => {
    if (!language) {
      setLangInfo(null)
      return
    }

    let cancelled = false

    api.language(language).locale('en-US').load()
      .then((lang) => {
        if (!cancelled) setLangInfo(lang ?? null)
      })
      .catch(() => {
        if (!cancelled) setLangInfo(null)
      })

    return () => {
      cancelled = true
    }
  }, [language])

  return langInfo
}
