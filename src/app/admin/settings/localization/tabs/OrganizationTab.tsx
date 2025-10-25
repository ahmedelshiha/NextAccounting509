'use client'

import React, { useEffect, useState } from 'react'
import { useLocalizationContext } from '../LocalizationProvider'
import PermissionGate from '@/components/PermissionGate'
import { PERMISSIONS } from '@/lib/permissions'
import { SelectField, Toggle } from '@/components/admin/settings/FormField'
import { toast } from 'sonner'
import { AlertCircle } from 'lucide-react'

export const OrganizationTab: React.FC = () => {
  const {
    orgSettings,
    setOrgSettings,
    languages,
    saving,
    setSaving,
    error,
    setError,
  } = useLocalizationContext()

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOrgSettings()
  }, [])

  async function loadOrgSettings() {
    try {
      setLoading(true)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

      const r = await fetch('/api/admin/org-settings/localization', { signal: controller.signal })
      clearTimeout(timeoutId)

      if (r.ok) {
        const d = await r.json()
        setOrgSettings(prev => ({ ...prev, ...d.data }))
      }
    } catch (e) {
      console.error('Failed to load org settings:', e)
      if ((e as any).name === 'AbortError') {
        setError('Request timed out. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  async function saveOrgSettings() {
    setSaving(true)
    setError(null)
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

      const r = await fetch('/api/admin/org-settings/localization', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orgSettings),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      const d = await r.json()
      if (!r.ok) throw new Error(d?.error || 'Failed to save organization settings')
      toast.success('Organization settings saved')
    } catch (e: any) {
      if (e.name === 'AbortError') {
        setError('Request timed out. Please try again.')
        toast.error('Request timed out')
      } else {
        setError(e?.message || 'Failed to save organization settings')
        toast.error(e?.message || 'Failed to save settings')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-gray-600 py-8 text-center">Loading settings...</div>
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <PermissionGate permission={PERMISSIONS.LANGUAGES_MANAGE}>
        <div className="space-y-6">
          {/* Default Languages Section */}
          <div className="rounded-lg border bg-white p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Default Language Settings</h3>
            <p className="text-sm text-gray-600 mb-4">Configure organization-wide language defaults</p>
            <div className="space-y-4">
              <div>
                <SelectField
                  label="Default Language"
                  value={orgSettings.defaultLanguage}
                  onChange={v => setOrgSettings(s => ({ ...s, defaultLanguage: v }))}
                  options={languages.filter(l => l.enabled).map(l => ({
                    value: l.code,
                    label: `${l.name} (${l.nativeName})`,
                  }))}
                />
                <p className="text-xs text-gray-600 mt-1">Language shown to new users and guests</p>
              </div>
              <div>
                <SelectField
                  label="Fallback Language"
                  value={orgSettings.fallbackLanguage}
                  onChange={v => setOrgSettings(s => ({ ...s, fallbackLanguage: v }))}
                  options={languages.filter(l => l.enabled).map(l => ({
                    value: l.code,
                    label: `${l.name} (${l.nativeName})`,
                  }))}
                />
                <p className="text-xs text-gray-600 mt-1">Language used when translation is missing</p>
              </div>
            </div>
          </div>

          {/* User Control Section */}
          <div className="rounded-lg border bg-white p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">User Language Control</h3>
            <p className="text-sm text-gray-600 mb-4">Control how users interact with language settings</p>
            <div className="space-y-4">
              <label className="flex items-start justify-between gap-4 p-4 border rounded-lg hover:bg-gray-50">
                <div>
                  <p className="font-medium text-gray-900">Show Language Switcher</p>
                  <p className="text-sm text-gray-600">Display language selector in UI</p>
                </div>
                <Toggle
                  label=""
                  value={orgSettings.showLanguageSwitcher}
                  onChange={v => setOrgSettings(s => ({ ...s, showLanguageSwitcher: v }))}
                />
              </label>

              <label className="flex items-start justify-between gap-4 p-4 border rounded-lg hover:bg-gray-50">
                <div>
                  <p className="font-medium text-gray-900">Persist Language Preference</p>
                  <p className="text-sm text-gray-600">Save user&apos;s language choice to database</p>
                </div>
                <Toggle
                  label=""
                  value={orgSettings.persistLanguagePreference}
                  onChange={v => setOrgSettings(s => ({ ...s, persistLanguagePreference: v }))}
                />
              </label>

              <label className="flex items-start justify-between gap-4 p-4 border rounded-lg hover:bg-gray-50">
                <div>
                  <p className="font-medium text-gray-900">Auto-Detect Browser Language</p>
                  <p className="text-sm text-gray-600">Use browser language on first visit</p>
                </div>
                <Toggle
                  label=""
                  value={orgSettings.autoDetectBrowserLanguage}
                  onChange={v => setOrgSettings(s => ({ ...s, autoDetectBrowserLanguage: v }))}
                />
              </label>

              <label className="flex items-start justify-between gap-4 p-4 border rounded-lg hover:bg-gray-50">
                <div>
                  <p className="font-medium text-gray-900">Allow Users to Override</p>
                  <p className="text-sm text-gray-600">Let users change their language preference</p>
                </div>
                <Toggle
                  label=""
                  value={orgSettings.allowUserLanguageOverride}
                  onChange={v => setOrgSettings(s => ({ ...s, allowUserLanguageOverride: v }))}
                />
              </label>
            </div>
          </div>

          {/* Internationalization Section */}
          <div className="rounded-lg border bg-white p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Internationalization</h3>
            <p className="text-sm text-gray-600 mb-4">Advanced i18n settings</p>
            <div className="space-y-4">
              <label className="flex items-start justify-between gap-4 p-4 border rounded-lg hover:bg-gray-50">
                <div>
                  <p className="font-medium text-gray-900">Enable RTL Support</p>
                  <p className="text-sm text-gray-600">Automatically apply RTL styles for Arabic and Hebrew</p>
                </div>
                <Toggle
                  label=""
                  value={orgSettings.enableRtlSupport}
                  onChange={v => setOrgSettings(s => ({ ...s, enableRtlSupport: v }))}
                />
              </label>

              <div className="p-4 border rounded-lg">
                <label className="block mb-2">
                  <p className="font-medium text-gray-900 mb-1">Missing Translation Behavior</p>
                  <p className="text-sm text-gray-600 mb-3">What to display when a translation is missing</p>
                  <select
                    value={orgSettings.missingTranslationBehavior}
                    onChange={e => setOrgSettings(s => ({ ...s, missingTranslationBehavior: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="show-key">Show translation key (e.g., hero.headline)</option>
                    <option value="show-fallback">Show fallback language translation</option>
                    <option value="show-empty">Show empty string</option>
                  </select>
                </label>
              </div>
            </div>
          </div>

          {/* Real-Time Preview Section */}
          <div className="rounded-lg border bg-white p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Preview</h3>
            <p className="text-sm text-gray-600 mb-4">See how your settings affect the user experience</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Language Switcher Preview */}
              <div className="rounded-lg border bg-gray-50 p-4">
                <p className="text-xs font-semibold text-gray-600 uppercase mb-3">Language Switcher</p>
                {orgSettings.showLanguageSwitcher ? (
                  <div className="flex gap-2 flex-wrap">
                    {languages.filter(l => l.enabled).slice(0, 3).map(lang => (
                      <button
                        key={lang.code}
                        className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                          lang.code === orgSettings.defaultLanguage
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {lang.flag} {lang.code.toUpperCase()}
                      </button>
                    ))}
                    {languages.filter(l => l.enabled).length > 3 && (
                      <button className="px-3 py-2 rounded text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-100">
                        +{languages.filter(l => l.enabled).length - 3}
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">Language switcher hidden</p>
                )}
              </div>

              {/* Default Language Preview */}
              <div className="rounded-lg border bg-gray-50 p-4">
                <p className="text-xs font-semibold text-gray-600 uppercase mb-3">New User Default</p>
                <div className="bg-white rounded border border-gray-300 px-3 py-2">
                  <p className="text-sm text-gray-600">
                    {languages.find(l => l.code === orgSettings.defaultLanguage)?.flag}{' '}
                    {languages.find(l => l.code === orgSettings.defaultLanguage)?.name}
                  </p>
                </div>
              </div>

              {/* Missing Translation Behavior Preview */}
              <div className="rounded-lg border bg-gray-50 p-4">
                <p className="text-xs font-semibold text-gray-600 uppercase mb-3">Missing Translation</p>
                <div className="bg-white rounded border border-gray-300 px-3 py-2">
                  <code className="text-xs text-gray-600">
                    {orgSettings.missingTranslationBehavior === 'show-key' && 'hero.headline'}
                    {orgSettings.missingTranslationBehavior === 'show-fallback' && '[English translation here]'}
                    {orgSettings.missingTranslationBehavior === 'show-empty' && '[empty]'}
                  </code>
                </div>
              </div>

              {/* RTL Mode Preview */}
              <div className="rounded-lg border bg-gray-50 p-4">
                <p className="text-xs font-semibold text-gray-600 uppercase mb-3">RTL Languages</p>
                {orgSettings.enableRtlSupport ? (
                  <div
                    className="bg-white rounded border border-gray-300 px-3 py-3 text-right"
                    dir="rtl"
                  >
                    <p className="text-sm text-gray-700">مرحبا بالعالم</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">RTL support disabled</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={saveOrgSettings}
              disabled={saving}
              className="px-6 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </PermissionGate>
    </div>
  )
}
