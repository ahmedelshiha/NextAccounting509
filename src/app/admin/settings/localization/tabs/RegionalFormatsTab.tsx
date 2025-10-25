'use client'

import React, { useEffect, useState } from 'react'
import { useLocalizationContext } from '../LocalizationProvider'
import PermissionGate from '@/components/PermissionGate'
import { PERMISSIONS } from '@/lib/permissions'
import { toast } from 'sonner'
import { REGIONAL_FORMAT_PRESETS } from '../constants'

interface FormatState {
  [languageCode: string]: {
    dateFormat: string
    timeFormat: string
    currencyCode: string
    currencySymbol: string
    numberFormat: string
    decimalSeparator: string
    thousandsSeparator: string
  }
}

export const RegionalFormatsTab: React.FC = () => {
  const { languages, saving, setSaving } = useLocalizationContext()
  const [loading, setLoading] = useState(true)
  const [formats, setFormats] = useState<FormatState>({})
  const [previewDate] = useState(new Date(2025, 9, 21))
  const [previewNumber] = useState(1234.56)

  useEffect(() => {
    loadFormats()
  }, [])

  async function loadFormats() {
    try {
      setLoading(true)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

      const r = await fetch('/api/admin/regional-formats', { signal: controller.signal })
      clearTimeout(timeoutId)

      const d = await r.json()
      if (r.ok && d.data) {
        const formatMap: FormatState = {}
        d.data.forEach((format: any) => {
          formatMap[format.language] = {
            dateFormat: format.dateFormat,
            timeFormat: format.timeFormat,
            currencyCode: format.currencyCode,
            currencySymbol: format.currencySymbol,
            numberFormat: format.numberFormat,
            decimalSeparator: format.decimalSeparator,
            thousandsSeparator: format.thousandsSeparator,
          }
        })
        setFormats(formatMap)
      }
    } catch (e: any) {
      console.error('Failed to load regional formats:', e)
      if (e.name === 'AbortError') {
        console.error('Request timed out')
      }
    } finally {
      setLoading(false)
    }
  }

  async function saveFormat(languageCode: string) {
    setSaving(true)
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

      const r = await fetch('/api/admin/regional-formats', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: languageCode,
          ...formats[languageCode],
        }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (r.ok) {
        toast.success(`Regional format saved for ${languageCode}`)
        await loadFormats()
      } else {
        toast.error('Failed to save regional format')
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        toast.error('Request timed out')
      } else {
        toast.error(e.message || 'Failed to save regional format')
      }
    } finally {
      setSaving(false)
    }
  }

  function applyTemplate(languageCode: string, templateKey: string) {
    const template = REGIONAL_FORMAT_PRESETS[templateKey]
    if (template) {
      setFormats(prev => ({
        ...prev,
        [languageCode]: {
          dateFormat: template.dateFormat,
          timeFormat: template.timeFormat,
          currencyCode: template.currencyCode,
          currencySymbol: template.currencySymbol,
          numberFormat: template.numberFormat,
          decimalSeparator: template.decimalSeparator,
          thousandsSeparator: template.thousandsSeparator,
        },
      }))
      toast.success(`Applied ${templateKey} template`)
    }
  }

  function getPreviewText(languageCode: string): string {
    const format = formats[languageCode]
    if (!format) return 'Loading...'

    const dateParts = format.dateFormat
      .replace('YYYY', previewDate.getFullYear().toString())
      .replace('MM', String(previewDate.getMonth() + 1).padStart(2, '0'))
      .replace('DD', String(previewDate.getDate()).padStart(2, '0'))

    const currencySymbol = format.currencySymbol
    const separator = format.thousandsSeparator
    const decimal = format.decimalSeparator
    const formattedNumber = `${currencySymbol}1${separator}234${decimal}56`

    return `${dateParts} | ${formattedNumber}`
  }

  if (loading) {
    return <div className="text-gray-600 py-8 text-center">Loading formats...</div>
  }

  return (
    <div className="space-y-6">
      <PermissionGate permission={PERMISSIONS.LANGUAGES_MANAGE}>
        <div className="rounded-lg border bg-blue-50 p-4">
          <p className="text-sm text-blue-900">
            💡 Select a template below to quickly apply standard format configurations for common locales.
          </p>
        </div>

        <div className="space-y-6">
          {languages.filter(l => l.enabled).map(lang => {
            const format = formats[lang.code] || REGIONAL_FORMAT_PRESETS[`${lang.code}-${lang.code.toUpperCase()}`] || {
              dateFormat: 'MM/DD/YYYY',
              timeFormat: 'HH:MM',
              currencyCode: 'USD',
              currencySymbol: '$',
              numberFormat: '#,##0.00',
              decimalSeparator: '.',
              thousandsSeparator: ',',
            }

            return (
              <div key={lang.code} className="rounded-lg border bg-white p-6">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-2xl">{lang.flag || '🌐'}</span>
                  {lang.name} ({lang.nativeName})
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Format</label>
                    <input
                      type="text"
                      value={format.dateFormat}
                      onChange={e =>
                        setFormats(prev => ({
                          ...prev,
                          [lang.code]: { ...format, dateFormat: e.target.value },
                        }))
                      }
                      placeholder="MM/DD/YYYY"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <p className="text-xs text-gray-600 mt-1">e.g., MM/DD/YYYY, DD/MM/YYYY</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time Format</label>
                    <input
                      type="text"
                      value={format.timeFormat}
                      onChange={e =>
                        setFormats(prev => ({
                          ...prev,
                          [lang.code]: { ...format, timeFormat: e.target.value },
                        }))
                      }
                      placeholder="HH:MM"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <p className="text-xs text-gray-600 mt-1">e.g., HH:MM, HH:MM AM</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Currency Code</label>
                    <input
                      type="text"
                      value={format.currencyCode}
                      onChange={e =>
                        setFormats(prev => ({
                          ...prev,
                          [lang.code]: { ...format, currencyCode: e.target.value },
                        }))
                      }
                      placeholder="USD"
                      maxLength={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm uppercase"
                    />
                    <p className="text-xs text-gray-600 mt-1">ISO 4217 code</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Currency Symbol</label>
                    <input
                      type="text"
                      value={format.currencySymbol}
                      onChange={e =>
                        setFormats(prev => ({
                          ...prev,
                          [lang.code]: { ...format, currencySymbol: e.target.value },
                        }))
                      }
                      placeholder="$"
                      maxLength={5}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <p className="text-xs text-gray-600 mt-1">e.g., $, €, ₹, د.إ</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Decimal Separator</label>
                    <input
                      type="text"
                      value={format.decimalSeparator}
                      onChange={e =>
                        setFormats(prev => ({
                          ...prev,
                          [lang.code]: { ...format, decimalSeparator: e.target.value },
                        }))
                      }
                      placeholder="."
                      maxLength={1}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <p className="text-xs text-gray-600 mt-1">Usually . or ,</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Thousands Separator</label>
                    <input
                      type="text"
                      value={format.thousandsSeparator}
                      onChange={e =>
                        setFormats(prev => ({
                          ...prev,
                          [lang.code]: { ...format, thousandsSeparator: e.target.value },
                        }))
                      }
                      placeholder=","
                      maxLength={1}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <p className="text-xs text-gray-600 mt-1">Usually , or .</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Number Format</label>
                    <input
                      type="text"
                      value={format.numberFormat}
                      onChange={e =>
                        setFormats(prev => ({
                          ...prev,
                          [lang.code]: { ...format, numberFormat: e.target.value },
                        }))
                      }
                      placeholder="#,##0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <p className="text-xs text-gray-600 mt-1">Symbolic format</p>
                  </div>
                </div>

                {/* Preview */}
                <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
                  <p className="text-xs text-gray-600 mb-1">Preview:</p>
                  <code className="text-sm text-gray-900">{getPreviewText(lang.code)}</code>
                </div>

                {/* Templates */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-600 mb-2">Quick Templates</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(REGIONAL_FORMAT_PRESETS)
                      .filter(key => key.startsWith(lang.code))
                      .slice(0, 3)
                      .map(key => (
                        <button
                          key={key}
                          onClick={() => applyTemplate(lang.code, key)}
                          className="px-3 py-1 text-xs rounded border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                        >
                          {key}
                        </button>
                      ))}
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                  <button
                    onClick={() => saveFormat(lang.code)}
                    disabled={saving}
                    className="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {saving ? 'Saving...' : 'Save Format'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </PermissionGate>
    </div>
  )
}
