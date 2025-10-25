"use client"

import { useCallback } from 'react'
import { useLocalizationContext } from '../LocalizationProvider'

export function useTranslationStatus() {
  const { setTranslationStatus, setError } = useLocalizationContext()

  const loadStatus = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/translations/status')
      const d = await r.json()
      if (!r.ok) throw new Error(d?.error || 'Failed to load translation status')
      setTranslationStatus(d.data)
    } catch (e: any) {
      setError(e?.message || 'Failed to load translation status')
      throw e
    }
  }, [setTranslationStatus, setError])

  return { loadStatus }
}
