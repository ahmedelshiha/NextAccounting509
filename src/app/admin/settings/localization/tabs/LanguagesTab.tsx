'use client'

import React, { useEffect, useState } from 'react'
import { useLocalizationContext } from '../LocalizationProvider'
import PermissionGate from '@/components/PermissionGate'
import { PERMISSIONS } from '@/lib/permissions'
import { TextField, SelectField, Toggle } from '@/components/admin/settings/FormField'
import { toast } from 'sonner'
import { Plus, Trash2, Download, Upload, Star } from 'lucide-react'
import type { LanguageRow } from '../types'

export const LanguagesTab: React.FC = () => {
  const {
    languages,
    setLanguages,
    saving,
    setSaving,
    error,
    setError,
  } = useLocalizationContext()

  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editing, setEditing] = useState<Record<string, Partial<LanguageRow>>>({})
  const [newLang, setNewLang] = useState<LanguageRow>({
    code: '',
    name: '',
    nativeName: '',
    direction: 'ltr',
    flag: '🌐',
    bcp47Locale: '',
    enabled: true,
    featured: false,
  })

  useEffect(() => {
    loadLanguages()
  }, [])

  async function loadLanguages() {
    try {
      setLoading(true)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

      const r = await fetch('/api/admin/languages', { signal: controller.signal })
      clearTimeout(timeoutId)

      const d = await r.json()
      if (!r.ok) throw new Error(d?.error || 'Failed to load languages')
      setLanguages(d.data || [])
    } catch (e: any) {
      console.error('Failed to load languages:', e)
      if (e.name === 'AbortError') {
        setError('Request timed out. Please try again.')
      } else {
        setError(e?.message || 'Failed to load languages')
      }
    } finally {
      setLoading(false)
    }
  }

  async function createLanguage() {
    setSaving(true)
    setError(null)
    try {
      const body = { ...newLang, code: newLang.code.toLowerCase() }
      const r = await fetch('/api/admin/languages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d?.error || 'Failed to create language')
      
      setNewLang({
        code: '',
        name: '',
        nativeName: '',
        direction: 'ltr',
        flag: '🌐',
        bcp47Locale: '',
        enabled: true,
        featured: false,
      })
      setShowAddForm(false)
      await loadLanguages()
      toast.success('Language added successfully')
    } catch (e: any) {
      setError(e?.message || 'Failed to create language')
      toast.error(e?.message || 'Failed to create language')
    } finally {
      setSaving(false)
    }
  }

  async function saveEdit(code: string) {
    const changes = editing[code]
    if (!changes) return
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
      setEditing(prev => {
        const next = { ...prev }
        delete next[code]
        return next
      })
      await loadLanguages()
      toast.success('Language updated')
    } catch (e: any) {
      setError(e?.message || 'Failed to update language')
      toast.error(e?.message || 'Failed to update language')
    } finally {
      setSaving(false)
    }
  }

  async function toggleLanguage(code: string) {
    setSaving(true)
    setError(null)
    try {
      const r = await fetch(`/api/admin/languages/${encodeURIComponent(code)}/toggle`, {
        method: 'PATCH',
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d?.error || 'Failed to toggle language')
      await loadLanguages()
      toast.success('Language status updated')
    } catch (e: any) {
      setError(e?.message)
      toast.error(e?.message)
    } finally {
      setSaving(false)
    }
  }

  async function deleteLanguage(code: string) {
    if (!confirm(`Delete language ${code}? This cannot be undone.`)) return
    setSaving(true)
    setError(null)
    try {
      const r = await fetch(`/api/admin/languages/${encodeURIComponent(code)}`, {
        method: 'DELETE',
      })
      if (!r.ok) {
        const d = await r.json().catch(() => ({}))
        throw new Error((d as any)?.error || 'Failed to delete language')
      }
      await loadLanguages()
      toast.success('Language deleted')
    } catch (e: any) {
      setError(e?.message)
      toast.error(e?.message)
    } finally {
      setSaving(false)
    }
  }

  async function exportLanguages() {
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
    }
  }

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text) as LanguageRow[]
      
      setSaving(true)
      const r = await fetch('/api/admin/languages/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ languages: data }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d?.error || 'Failed to import languages')
      
      await loadLanguages()
      toast.success(`Imported ${data.length} languages`)
    } catch (e: any) {
      toast.error(e?.message || 'Failed to import languages')
    } finally {
      setSaving(false)
      if (e.target) e.target.value = ''
    }
  }

  if (loading) {
    return <div className="text-gray-600 py-8 text-center">Loading languages...</div>
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <PermissionGate permission={PERMISSIONS.LANGUAGES_MANAGE}>
        <div className="flex gap-3 justify-end">
          <button
            onClick={exportLanguages}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
            <Upload className="h-4 w-4" />
            Import
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
              disabled={saving}
            />
          </label>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Language
            </button>
          )}
        </div>
      </PermissionGate>

      {showAddForm && (
        <div className="rounded-lg border bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Language</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <TextField
                label="Language Code"
                value={newLang.code}
                onChange={v => setNewLang(s => ({ ...s, code: v }))}
                placeholder="e.g. fr"
              />
              <p className="text-xs text-gray-600 mt-1">2-3 letter language code (lowercase)</p>
            </div>
            <div>
              <TextField
                label="English Name"
                value={newLang.name}
                onChange={v => setNewLang(s => ({ ...s, name: v }))}
                placeholder="e.g. French"
              />
            </div>
            <div>
              <TextField
                label="Native Name"
                value={newLang.nativeName}
                onChange={v => setNewLang(s => ({ ...s, nativeName: v }))}
                placeholder="e.g. Français"
              />
            </div>
            <div>
              <TextField
                label="BCP47 Locale"
                value={newLang.bcp47Locale}
                onChange={v => setNewLang(s => ({ ...s, bcp47Locale: v }))}
                placeholder="e.g. fr-FR"
              />
            </div>
            <div>
              <SelectField
                label="Text Direction"
                value={newLang.direction}
                onChange={v => setNewLang(s => ({ ...s, direction: v as 'ltr' | 'rtl' }))}
                options={[
                  { value: 'ltr', label: 'Left-to-Right' },
                  { value: 'rtl', label: 'Right-to-Left' },
                ]}
              />
            </div>
            <div>
              <TextField
                label="Flag Emoji"
                value={newLang.flag || ''}
                onChange={v => setNewLang(s => ({ ...s, flag: v }))}
                placeholder="e.g. 🇫🇷"
              />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => {
                setShowAddForm(false)
                setNewLang({
                  code: '',
                  name: '',
                  nativeName: '',
                  direction: 'ltr',
                  flag: '🌐',
                  bcp47Locale: '',
                  enabled: true,
                  featured: false,
                })
              }}
              className="px-4 py-2 rounded-md text-sm border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={createLanguage}
              disabled={saving || !newLang.code || !newLang.name || !newLang.nativeName || !newLang.bcp47Locale}
              className="px-4 py-2 rounded-md text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
            >
              {saving ? 'Adding...' : 'Add Language'}
            </button>
          </div>
        </div>
      )}

      <div className="rounded-lg border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Language</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Code</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Direction</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Enabled</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Featured</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {languages.map(lang => (
                <tr key={lang.code} className="border-b last:border-b-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{lang.flag || '🌐'}</span>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{lang.name}</div>
                        <div className="text-xs text-gray-600">{lang.nativeName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-sm font-mono text-gray-600">{lang.code}</code>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                      {lang.direction.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <PermissionGate permission={PERMISSIONS.LANGUAGES_MANAGE}>
                      <Toggle
                        label=""
                        value={lang.enabled}
                        onChange={() => toggleLanguage(lang.code)}
                      />
                    </PermissionGate>
                    <PermissionGate
                      permission={PERMISSIONS.LANGUAGES_MANAGE}
                      fallback={
                        <span className={`text-xs ${lang.enabled ? 'text-green-600' : 'text-gray-500'}`}>
                          {lang.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      }
                    >
                      <span />
                    </PermissionGate>
                  </td>
                  <td className="px-4 py-3">
                    {lang.featured ? (
                      <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    ) : (
                      <Star className="h-4 w-4 text-gray-300" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <PermissionGate permission={PERMISSIONS.LANGUAGES_MANAGE}>
                      <button
                        onClick={() => deleteLanguage(lang.code)}
                        disabled={saving || lang.code === 'en'}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs rounded border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </PermissionGate>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
