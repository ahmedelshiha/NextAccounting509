'use client'

import React, { useEffect, useState } from 'react'
import { useLocalizationContext } from '../LocalizationProvider'
import { BarChart3, TrendingUp } from 'lucide-react'

interface TrendsResponse {
  labels: string[]
  series: {
    en: number[]
    ar: number[]
    hi: number[]
    total: number[]
  }
  summary: {
    current: { date: string; en: number; ar: number; hi: number; total: number }
    previous: { date: string; en: number; ar: number; hi: number; total: number }
    delta: { en: number; ar: number; hi: number; total: number }
  } | null
}

export const AnalyticsTab: React.FC = () => {
  const { analyticsData, setAnalyticsData } = useLocalizationContext()
  const [loading, setLoading] = useState(true)
  const [trends, setTrends] = useState<TrendsResponse | null>(null)
  const [trendsLoading, setTrendsLoading] = useState(false)

  useEffect(() => {
    loadAllData()
  }, [])

  async function loadAllData() {
    try {
      setLoading(true)
      await loadAnalytics()
      await loadTrends()
    } finally {
      setLoading(false)
    }
  }

  async function loadAnalytics() {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

      const r = await fetch('/api/admin/user-language-analytics', { signal: controller.signal })
      clearTimeout(timeoutId)

      if (r.ok) {
        const d = await r.json()
        setAnalyticsData(d.data)
      }
    } catch (e) {
      console.error('Failed to load analytics:', e)
      if ((e as any).name === 'AbortError') {
        console.error('Request timed out')
      }
    }
  }

  async function loadTrends() {
    try {
      setTrendsLoading(true)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

      const r = await fetch('/api/admin/user-language-analytics/trends?days=90', { signal: controller.signal })
      clearTimeout(timeoutId)

      if (r.ok) {
        const d = await r.json()
        setTrends(d.data)
      }
    } catch (e) {
      console.error('Failed to load trends:', e)
      if ((e as any).name === 'AbortError') {
        console.error('Request timed out')
      }
    } finally {
      setTrendsLoading(false)
    }
  }

  if (loading) {
    return <div className="text-gray-600 py-8 text-center">Loading analytics...</div>
  }

  const data = analyticsData
  const distribution = data?.distribution || []

  return (
    <div className="space-y-6">
      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{data?.totalUsers || 0}</p>
              <p className="text-xs text-gray-600 mt-2">Active users</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Languages Tracked</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{data?.languagesInUse?.length || 0}</p>
              <p className="text-xs text-gray-600 mt-2">Active languages</p>
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
                {distribution[0]?.language?.toUpperCase() || 'N/A'}
              </p>
              <p className="text-xs text-gray-600 mt-2">{distribution[0]?.count} users</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-purple-50 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Language Distribution */}
      <div className="rounded-lg border bg-white p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Language Distribution</h3>

        {distribution.length > 0 ? (
          <div className="space-y-4">
            {distribution.map((item, idx) => {
              const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-red-500', 'bg-pink-500']
              const colorClass = colors[idx % colors.length]

              return (
                <div key={item.language} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${colorClass}`} />
                      <span className="text-sm font-medium text-gray-900">{item.language.toUpperCase()}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{item.count}</p>
                      <p className="text-xs text-gray-600">{parseFloat(item.percentage).toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div className={`${colorClass} h-full rounded-full transition-all duration-300`} style={{ width: `${parseFloat(item.percentage)}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-600">
            <p>No language distribution data available</p>
          </div>
        )}
      </div>

      {/* Adoption Trends */}
      <div className="rounded-lg border bg-white p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Adoption Trend (90 days)</h3>
        {trendsLoading ? (
          <div className="text-gray-600 py-4">Loading trends...</div>
        ) : trends && trends.labels.length > 1 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(['en', 'ar', 'hi'] as const).map((lang) => {
                const color = lang === 'en' ? 'bg-blue-500' : lang === 'ar' ? 'bg-green-500' : 'bg-purple-500'
                const latest = trends.summary?.current?.[lang] || 0
                const prev = trends.summary?.previous?.[lang] || 0
                const delta = latest - prev
                const sign = delta > 0 ? '+' : ''
                return (
                  <div key={lang} className="rounded-lg border bg-gray-50 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-700 uppercase">{lang}</p>
                      <p className={`text-xs ${delta >= 0 ? 'text-green-600' : 'text-red-600'}`}>{sign}{delta}</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{latest}</p>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      {/* Simple sparkline-style bar showing last value as proportion of total */}
                      <div className={`${color} h-full rounded-full`} style={{ width: `${trends.summary?.current?.total ? Math.min(100, Math.round((latest / trends.summary.current.total) * 100)) : 0}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Timeline (labels condensed) */}
            <div className="rounded-lg border bg-gray-50 p-4">
              <p className="text-xs text-gray-600">{trends.labels[0]} → {trends.labels[trends.labels.length - 1]}</p>
              <div className="mt-3 grid grid-cols-12 gap-2">
                {trends.series.total.slice(-12).map((val, idx) => {
                  const max = Math.max(...trends.series.total.slice(-12)) || 1
                  const height = Math.max(6, Math.round((val / max) * 36))
                  return <div key={idx} className="bg-blue-400 rounded" style={{ height: `${height}px` }} />
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border bg-gray-50 p-6 text-center">
            <p className="text-gray-600">Insufficient data for trends</p>
          </div>
        )}
      </div>

      {/* Key Insights */}
      <div className="rounded-lg border bg-white p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
        <div className="space-y-4">
          {distribution.length > 0 && (
            <>
              <div className="flex items-start gap-4 p-4 rounded-lg bg-blue-50 border border-blue-200">
                <div className="text-2xl">📈</div>
                <div>
                  <p className="font-medium text-gray-900">Primary Language</p>
                  <p className="text-sm text-gray-700">{distribution[0]?.language?.toUpperCase()} is used by {distribution[0]?.count} users ({parseFloat(distribution[0]?.percentage).toFixed(1)}% of total)</p>
                </div>
              </div>

              {distribution.length > 1 && (
                <div className="flex items-start gap-4 p-4 rounded-lg bg-green-50 border border-green-200">
                  <div className="text-2xl">🌐</div>
                  <div>
                    <p className="font-medium text-gray-900">Multi-Language Adoption</p>
                    <p className="text-sm text-gray-700">Your platform is actively used in {distribution.length} languages</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-4 p-4 rounded-lg bg-purple-50 border border-purple-200">
                <div className="text-2xl">👥</div>
                <div>
                  <p className="font-medium text-gray-900">User Base</p>
                  <p className="text-sm text-gray-700">{data?.totalUsers || 0} users have set their language preference</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
