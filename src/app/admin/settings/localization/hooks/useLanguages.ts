"use client"

import { useCallback } from 'react'
import { useLocalizationContext } from '../LocalizationProvider'
import type { LanguageRow } from '../types'
import { toast } from 'sonner'

export function useLanguages() {
  const { setLanguages, setSaving, setError } = useLocalizationContext()

  const loadLanguages = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/languages')
      const d = await r.json()
      if (!r.ok) throw new Error(d?.error || 'Failed to load languages')
      setLanguages(d.data || [])
    } catch (e: any) {
      setError(e?.message || 'Failed to load languages')
      throw e
    }
  }, [setLanguages, setError])

  const createLanguage = useCallback(async (lang: LanguageRow) => {
    setSaving(true)
    setError(null)
    try {
      const body = { ...lang, code: lang.code.toLowerCase() }
      const r = await fetch('/api/admin/languages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d?.error || 'Failed to create language')
      toast.success('Language added successfully')
      await loadLanguages()
    } catch (e: any) {
      setError(e?.message || 'Failed to create language')
      toast.error(e?.message || 'Failed to create language')
      throw e
    } finally {
      setSaving(false)
    }
  }, [setSaving, setError, loadLanguages])

  const updateLanguage = useCallback(async (code: string, changes: Partial<LanguageRow>) => {
    setSaving(true)
    setError(null)
    try {
      const r = await fetch(`/api/admin/languages/${encodeURIComponent(code)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d?.error || 'Failed to update language')
      toast.success('Language updated')
      await loadLanguages()
    } catch (e: any) {
      setError(e?.message || 'Failed to update language')
      toast.error(e?.message || 'Failed to update language')
      throw e
    } finally {
      setSaving(false)
    }
  }, [setSaving, setError, loadLanguages])

  const toggleLanguage = useCallback(async (code: string) => {
    setSaving(true)
    setError(null)
    try {
      const r = await fetch(`/api/admin/languages/${encodeURIComponent(code)}/toggle`, { method: 'PATCH' })
      const d = await r.json()
      if (!r.ok) throw new Error(d?.error || 'Failed to toggle language')
      toast.success('Language status updated')
      await loadLanguages()
    } catch (e: any) {
      setError(e?.message)
      toast.error(e?.message)
      throw e
    } finally {
      setSaving(false)
    }
  }, [setSaving, setError, loadLanguages])

  const deleteLanguage = useCallback(async (code: string) => {
    setSaving(true)
    setError(null)
    try {
      const r = await fetch(`/api/admin/languages/${encodeURIComponent(code)}`, { method: 'DELETE' })
      if (!r.ok) {
        const d = await r.json().catch(() => ({}))
        throw new Error((d as any)?.error || 'Failed to delete language')
      }
      toast.success('Language deleted')
      await loadLanguages()
    } catch (e: any) {
      setError(e?.message)
      toast.error(e?.message)
      throw e
    } finally {
      setSaving(false)
    }
  }, [setSaving, setError, loadLanguages])

  const exportLanguages = useCallback(async (languages: LanguageRow[]) => {
    try {
      const data = JSON.stringify(languages, null, 2)
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `languages-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Languages exported successfully')
    } catch (e: any) {
      toast.error('Failed to export languages')
      throw e
    }
  }, [])

  const importLanguages = useCallback(async (data: LanguageRow[]) => {
    setSaving(true)
    try {
      const r = await fetch('/api/admin/languages/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ languages: data }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d?.error || 'Failed to import languages')
      toast.success(`Imported ${data.length} languages`)
      await loadLanguages()
    } catch (e: any) {
      toast.error(e?.message || 'Failed to import languages')
      throw e
    } finally {
      setSaving(false)
    }
  }, [setSaving, loadLanguages])

  return {
    loadLanguages,
    createLanguage,
    updateLanguage,
    toggleLanguage,
    deleteLanguage,
    exportLanguages,
    importLanguages,
  }
}
