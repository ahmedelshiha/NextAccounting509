'use client'

import React, { useEffect, useState } from 'react'
import { useLocalizationContext } from '../LocalizationProvider'
import { BarChart3 } from 'lucide-react'

interface AnalyticsDistribution {
  language: string
  count: number
  percentage: string
}

export const UserPreferencesTab: React.FC = () => {
  const { languages, analyticsData, setAnalyticsData } = useLocalizationContext()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  async function loadAnalytics() {
    try {
      setLoading(true)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

      const r = await fetch('/api/admin/user-language-analytics', { signal: controller.signal })
      clearTimeout(timeoutId)

      const d = await r.json()
      if (r.ok && d.data) {
        setAnalyticsData(d.data)
      }
    } catch (e) {
      console.error('Failed to load analytics:', e)
      if ((e as any).name === 'AbortError') {
        console.error('Request timed out')
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-gray-600 py-8 text-center">Loading analytics...</div>
  }

  const data = analyticsData || { totalUsers: 0, languagesInUse: [], distribution: [] }
  const distribution = (data.distribution || []) as AnalyticsDistribution[]
  const maxCount = Math.max(...distribution.map(d => d.count), 1)

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{data.totalUsers || 0}</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center">
              <span className="text-xl">👥</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Languages in Use</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{data.languagesInUse?.length || 0}</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-green-50 flex items-center justify-center">
              <span className="text-xl">🌍</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Most Used</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {languages.find(l => l.code === data.mostUsedLanguage)?.flag || '🌐'}{' '}
                {languages.find(l => l.code === data.mostUsedLanguage)?.code?.toUpperCase() || 'N/A'}
              </p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-purple-50 flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Distribution Chart */}
      <div className="rounded-lg border bg-white p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Language Distribution</h3>
        {distribution.length > 0 ? (
          <div className="space-y-3">
            {distribution.map(dist => {
              const percentage = parseFloat(dist.percentage)
              const barWidth = (dist.count / maxCount) * 100
              return (
                <div key={dist.language} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{languages.find(l => l.code === dist.language)?.flag || '🌐'}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {languages.find(l => l.code === dist.language)?.name || dist.language}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{dist.count} users</p>
                      <p className="text-xs text-gray-600">{percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-600">
            <p>No user language data available yet</p>
          </div>
        )}
      </div>

      {/* Language Breakdown Table */}
      {distribution.length > 0 && (
        <div className="rounded-lg border bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Language</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Users</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Percentage</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {distribution.map(dist => {
                  const lang = languages.find(l => l.code === dist.language)
                  const percentage = parseFloat(dist.percentage)
                  return (
                    <tr key={dist.language} className="border-b last:border-b-0 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{lang?.flag || '🌐'}</span>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{lang?.name || 'Unknown'}</div>
                            <div className="text-xs text-gray-600">{lang?.nativeName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-gray-900">{dist.count}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">{percentage.toFixed(1)}%</span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            lang?.enabled ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'
                          }`}
                        >
                          {lang?.enabled ? '✓ Active' : '○ Inactive'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="rounded-lg border bg-blue-50 p-4">
        <p className="text-sm text-blue-900">
          💡 <strong>Tip:</strong> User language preferences are automatically tracked from the UserProfile.preferredLanguage field. Data updates in real-time as users change their language settings.
        </p>
      </div>
    </div>
  )
}
