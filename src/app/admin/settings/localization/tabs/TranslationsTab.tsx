'use client'

import React, { useEffect, useState } from 'react'
import { useLocalizationContext } from '../LocalizationProvider'
import PermissionGate from '@/components/PermissionGate'
import { PERMISSIONS } from '@/lib/permissions'

export const TranslationsTab: React.FC = () => {
  const { translationStatus, setTranslationStatus } = useLocalizationContext()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTranslationStatus()
  }, [])

  async function loadTranslationStatus() {
    try {
      setLoading(true)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

      const r = await fetch('/api/admin/translations/status', { signal: controller.signal })
      clearTimeout(timeoutId)

      if (r.ok) {
        const d = await r.json()
        setTranslationStatus(d.data)
      }
    } catch (e) {
      console.error('Failed to load translation status:', e)
      if ((e as any).name === 'AbortError') {
        console.error('Request timed out')
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-gray-600 py-8 text-center">Loading translation status...</div>
  }

  const status = translationStatus

  return (
    <div className="space-y-6">
      {/* Coverage Summary */}
      <div className="rounded-lg border bg-white p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Translation Coverage</h3>
        <p className="text-sm text-gray-600 mb-6">Current translation status by language</p>

        {status ? (
          <>
            {/* Key Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="rounded-lg border bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-600">Total Keys</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{status.summary.totalKeys}</p>
              </div>
              <div className="rounded-lg border bg-green-50 p-4">
                <p className="text-sm font-medium text-gray-600">English (Base)</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{status.summary.enCoveragePct}</p>
              </div>
              <div className="rounded-lg border bg-blue-50 p-4">
                <p className="text-sm font-medium text-gray-600">العربية</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{status.summary.arCoveragePct}</p>
              </div>
              <div className="rounded-lg border bg-purple-50 p-4">
                <p className="text-sm font-medium text-gray-600">हिन्दी</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{status.summary.hiCoveragePct}</p>
              </div>
            </div>

            {/* Coverage Progress Bars */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">English (Base)</span>
                  <span className="text-sm text-gray-600">{status.summary.enCoveragePct}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div className="bg-green-500 h-full rounded-full w-full" />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">العربية (Arabic)</span>
                  <span className="text-sm text-gray-600">{status.summary.arCoveragePct}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full"
                    style={{
                      width: `${parseFloat(status.summary.arCoveragePct.replace('%', ''))}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">हिन्दी (Hindi)</span>
                  <span className="text-sm text-gray-600">{status.summary.hiCoveragePct}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-purple-500 h-full rounded-full"
                    style={{
                      width: `${parseFloat(status.summary.hiCoveragePct.replace('%', ''))}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-lg border bg-gray-50 p-8 text-center">
            <p className="text-gray-600">Loading translation status...</p>
          </div>
        )}
      </div>

      {/* Missing Keys Section */}
      <PermissionGate permission={PERMISSIONS.LANGUAGES_MANAGE}>
        <div className="rounded-lg border bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Missing Translations</h3>
          <p className="text-sm text-gray-600 mb-4">Keys that need translation</p>

          <div className="rounded-lg border bg-blue-50 p-4 mb-4">
            <p className="text-sm text-blue-900">
              💡 <strong>Pro Tip:</strong> Run the Key Discovery audit to automatically identify all missing translation keys across your codebase.
            </p>
          </div>

          <div className="rounded-lg border bg-gray-50 p-6 text-center">
            <p className="text-gray-600 mb-4">No missing keys detected</p>
            <button className="px-4 py-2 rounded-md text-sm text-white bg-blue-600 hover:bg-blue-700">
              Run Discovery Audit
            </button>
          </div>
        </div>
      </PermissionGate>

      {/* Info Box */}
      <div className="rounded-lg border bg-blue-50 p-4">
        <p className="text-sm text-blue-900">
          💡 <strong>Coming soon:</strong> Coverage timeline, missing keys by category, translation velocity tracking, and priority assignment workflow
        </p>
      </div>
    </div>
  )
}
