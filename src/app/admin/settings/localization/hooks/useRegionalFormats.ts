"use client"

import { useCallback, useMemo } from 'react'
import { useLocalizationContext } from '../LocalizationProvider'
import { REGIONAL_FORMAT_PRESETS } from '../constants'
import type { RegionalFormat } from '../types'
import { toast } from 'sonner'

export function useRegionalFormats() {
  const { setSaving } = useLocalizationContext()

  const loadFormats = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/regional-formats')
      const d = await r.json()
      if (!r.ok) throw new Error(d?.error || 'Failed to load regional formats')
      return (d.data || []) as RegionalFormat[]
    } catch (e) {
      console.error('Failed to load regional formats:', e)
      throw e
    }
  }, [])

  const saveFormat = useCallback(async (format: RegionalFormat) => {
    setSaving(true)
    try {
      const r = await fetch('/api/admin/regional-formats', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(format),
      })
      const ok = r.ok
      if (!ok) {
        const d = await r.json().catch(() => ({}))
        throw new Error((d as any)?.error || 'Failed to save regional format')
      }
      toast.success(`Regional format saved for ${format.language}`)
    } finally {
      setSaving(false)
    }
  }, [setSaving])

  const applyTemplate = useCallback((templateKey: string) => {
    return REGIONAL_FORMAT_PRESETS[templateKey]
  }, [])

  const getPreview = useCallback((format: RegionalFormat) => {
    const previewDate = new Date(2025, 9, 21)
    const dateStr = format.dateFormat
      .replace('YYYY', previewDate.getFullYear().toString())
      .replace('MM', String(previewDate.getMonth() + 1).padStart(2, '0'))
      .replace('DD', String(previewDate.getDate()).padStart(2, '0'))
    const num = `${format.currencySymbol}1${format.thousandsSeparator}234${format.decimalSeparator}56`
    return `${dateStr} | ${num}`
  }, [])

  return {
    loadFormats,
    saveFormat,
    applyTemplate,
    getPreview,
  }
}
