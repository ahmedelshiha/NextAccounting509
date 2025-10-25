'use client'

import React, { useEffect, useState } from 'react'
import { useLocalizationContext } from '../LocalizationProvider'
import PermissionGate from '@/components/PermissionGate'
import { PERMISSIONS } from '@/lib/permissions'
import { toast } from 'sonner'
import { TextField } from '@/components/admin/settings/FormField'
import { ChevronDown } from 'lucide-react'

interface ProjectHealth {
  language: string
  completion: number
}

interface SyncLog {
  id: string
  syncedAt: Date | string
  status: 'success' | 'failed' | 'partial'
  keysAdded?: number
  keysUpdated?: number
  error?: string
}

interface WebhookConfig {
  webhookUrl: string
  isActive: boolean
  events: string[]
  lastDelivery?: string
  deliveriesCount: number
}

export const IntegrationTab: React.FC = () => {
  const { crowdinIntegration, setCrowdinIntegration, saving, setSaving } = useLocalizationContext()
  const [loading, setLoading] = useState(true)
  const [crowdinTestLoading, setCrowdinTestLoading] = useState(false)
  const [crowdinTestResult, setCrowdinTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [projectHealth, setProjectHealth] = useState<ProjectHealth[]>([])
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([])
  const [showSyncLogs, setShowSyncLogs] = useState(false)
  const [logsLoading, setLogsLoading] = useState(false)
  const [webhookConfig, setWebhookConfig] = useState<WebhookConfig | null>(null)
  const [webhookLoading, setWebhookLoading] = useState(false)
  const [webhookEnabled, setWebhookEnabled] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      // Load sequentially to avoid overwhelming database connection pool
      await loadCrowdinIntegration()
      await loadProjectHealth()
      await loadSyncLogs()
      await loadWebhookConfig()
    } catch (e) {
      console.error('Failed to load integration data:', e)
    } finally {
      setLoading(false)
    }
  }

  async function loadCrowdinIntegration() {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

      const r = await fetch('/api/admin/crowdin-integration', { signal: controller.signal })
      clearTimeout(timeoutId)

      if (r.ok) {
        const d = await r.json()
        if (d.data) {
          setCrowdinIntegration({
            projectId: d.data.projectId || '',
            apiToken: d.data.apiTokenMasked || '',
            autoSyncDaily: d.data.autoSyncDaily ?? true,
            syncOnDeploy: d.data.syncOnDeploy ?? false,
            createPrs: d.data.createPrs ?? true,
          })
        }
      }
    } catch (e) {
      console.error('Failed to load Crowdin integration:', e)
      if ((e as any).name === 'AbortError') {
        console.error('Request timed out')
      }
    }
  }

  async function loadProjectHealth() {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

      const r = await fetch('/api/admin/crowdin-integration/project-health', { signal: controller.signal })
      clearTimeout(timeoutId)

      if (r.ok) {
        const d = await r.json()
        setProjectHealth(d.data || [])
      }
    } catch (e) {
      console.error('Failed to load project health:', e)
      if ((e as any).name === 'AbortError') {
        console.error('Request timed out')
      }
    }
  }

  async function loadSyncLogs() {
    try {
      setLogsLoading(true)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

      const r = await fetch('/api/admin/crowdin-integration/logs?limit=10', { signal: controller.signal })
      clearTimeout(timeoutId)

      if (r.ok) {
        const d = await r.json()
        setSyncLogs(d.data?.logs || [])
      }
    } catch (e) {
      console.error('Failed to load sync logs:', e)
      if ((e as any).name === 'AbortError') {
        console.error('Request timed out')
      }
      setSyncLogs([])
    } finally {
      setLogsLoading(false)
    }
  }

  async function testCrowdinConnection() {
    setCrowdinTestLoading(true)
    setCrowdinTestResult(null)
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

      const r = await fetch('/api/admin/crowdin-integration', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: crowdinIntegration.projectId,
          apiToken: crowdinIntegration.apiToken,
        }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      const d = await r.json()
      if (!r.ok) throw new Error(d?.error || 'Connection test failed')
      setCrowdinTestResult({ success: true, message: 'Connection successful!' })
      toast.success('Crowdin connection test passed')
    } catch (e: any) {
      const message = e?.name === 'AbortError' ? 'Request timed out' : e?.message || 'Connection test failed'
      setCrowdinTestResult({ success: false, message })
      toast.error(message)
    } finally {
      setCrowdinTestLoading(false)
    }
  }

  async function saveCrowdinIntegration() {
    setSaving(true)
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

      const r = await fetch('/api/admin/crowdin-integration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(crowdinIntegration),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      const d = await r.json()
      if (!r.ok) throw new Error(d?.error || 'Failed to save Crowdin integration')
      toast.success('Crowdin integration saved')
      await loadCrowdinIntegration()
    } catch (e: any) {
      const message = e?.name === 'AbortError' ? 'Request timed out' : e?.message || 'Failed to save integration'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  async function manualSync() {
    try {
      setCrowdinTestLoading(true)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

      const r = await fetch('/api/admin/crowdin-integration/sync', {
        method: 'POST',
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      const d = await r.json()
      if (!r.ok) throw new Error(d?.error || 'Failed to run sync')
      toast.success('Sync started successfully')
      await Promise.all([loadCrowdinIntegration(), loadProjectHealth(), loadSyncLogs()])
    } catch (e: any) {
      const message = e?.name === 'AbortError' ? 'Request timed out' : e?.message || 'Failed to run sync'
      toast.error(message)
    } finally {
      setCrowdinTestLoading(false)
    }
  }

  async function loadWebhookConfig() {
    try {
      setWebhookLoading(true)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      const r = await fetch('/api/admin/crowdin-integration/webhook', { signal: controller.signal })
      clearTimeout(timeoutId)
      if (r.ok) {
        const d = await r.json()
        setWebhookConfig(d.data)
        setWebhookEnabled(d.data?.isActive || false)
      }
    } catch (e) {
      console.error('Failed to load webhook config:', e)
    } finally {
      setWebhookLoading(false)
    }
  }

  async function setupWebhook() {
    setSaving(true)
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      const r = await fetch('/api/admin/crowdin-integration/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !webhookEnabled }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      const d = await r.json()
      if (r.ok) {
        toast.success('Webhook ' + (webhookEnabled ? 'disabled' : 'enabled') + ' successfully')
        await loadWebhookConfig()
      } else {
        toast.error(d.error || 'Failed to setup webhook')
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to setup webhook')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-gray-600 py-8 text-center">Loading integration settings...</div>
  }

  return (
    <div className="space-y-6">
      <PermissionGate permission={PERMISSIONS.LANGUAGES_MANAGE}>
        <div className="rounded-lg border bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Crowdin Integration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <TextField
                label="Project ID"
                value={crowdinIntegration.projectId}
                onChange={v => setCrowdinIntegration(s => ({ ...s, projectId: v }))}
                placeholder="Your Crowdin project ID"
              />
              <p className="text-xs text-gray-600 mt-1">Found in Crowdin project settings</p>
            </div>
            <div>
              <TextField
                label="API Token"
                value={crowdinIntegration.apiToken}
                onChange={v => setCrowdinIntegration(s => ({ ...s, apiToken: v }))}
                placeholder="Your Crowdin API token"
                type="password"
              />
              <p className="text-xs text-gray-600 mt-1">Generate from Crowdin account settings</p>
            </div>
          </div>
          {crowdinTestResult && (
            <div className={`rounded-lg p-3 mb-4 ${crowdinTestResult.success ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
              <p className="text-sm">{crowdinTestResult.message}</p>
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={testCrowdinConnection}
              disabled={!crowdinIntegration.projectId || !crowdinIntegration.apiToken || crowdinTestLoading || saving}
              className="px-4 py-2 rounded-md text-sm border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              {crowdinTestLoading ? 'Testing...' : 'Test Connection'}
            </button>
            <button
              onClick={saveCrowdinIntegration}
              disabled={!crowdinIntegration.projectId || !crowdinIntegration.apiToken || saving}
              className="px-4 py-2 rounded-md text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
            >
              {saving ? 'Saving...' : 'Save Integration'}
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
          <h4 className="font-semibold text-blue-900 mb-3">Sync Options</h4>
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={crowdinIntegration.autoSyncDaily}
                onChange={e => setCrowdinIntegration(s => ({ ...s, autoSyncDaily: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm text-blue-800">Auto-sync translations daily</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={crowdinIntegration.syncOnDeploy}
                onChange={e => setCrowdinIntegration(s => ({ ...s, syncOnDeploy: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm text-blue-800">Sync on code deployment</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={crowdinIntegration.createPrs}
                onChange={e => setCrowdinIntegration(s => ({ ...s, createPrs: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm text-blue-800">Create PRs for translations</span>
            </label>
          </div>
        </div>

        {/* Sync Status Dashboard */}
        <div className="rounded-lg border bg-white p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Sync Status</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border bg-gray-50 p-4">
              <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Last Sync</p>
              <p className="text-lg font-medium text-gray-900">
                {crowdinIntegration.lastSyncAt ? new Date(crowdinIntegration.lastSyncAt).toLocaleString() : 'Never'}
              </p>
              {crowdinIntegration.lastSyncStatus && (
                <p className={`text-sm mt-1 ${crowdinIntegration.lastSyncStatus === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                  Status: {crowdinIntegration.lastSyncStatus}
                </p>
              )}
            </div>
            <div className="rounded-lg border bg-gray-50 p-4">
              <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Connection</p>
              <p className={`text-lg font-medium ${crowdinIntegration.testConnectionOk ? 'text-green-600' : 'text-gray-500'}`}>
                {crowdinIntegration.testConnectionOk ? '✓ Connected' : '○ Not Connected'}
              </p>
              <button
                onClick={testCrowdinConnection}
                disabled={!crowdinIntegration.projectId || !crowdinIntegration.apiToken || crowdinTestLoading || saving}
                className="text-xs text-blue-600 hover:text-blue-700 mt-2 underline"
              >
                Test now
              </button>
            </div>
          </div>

          {/* Manual Sync Button */}
          <div className="mt-4">
            <button
              onClick={manualSync}
              disabled={!crowdinIntegration.projectId || !crowdinIntegration.apiToken || crowdinTestLoading || saving}
              className="w-full px-4 py-2 rounded-md text-sm text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 font-medium"
            >
              {crowdinTestLoading ? 'Syncing...' : '⚡ Sync Now'}
            </button>
          </div>
        </div>

        {/* Project Health Section */}
        {projectHealth.length > 0 && (
          <div className="rounded-lg border bg-white p-6">
            <h4 className="font-semibold text-gray-900 mb-4">Project Health</h4>
            <div className="space-y-3">
              {projectHealth.map(lang => (
                <div key={lang.language} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{lang.language.toUpperCase()}</span>
                  <div className="flex items-center gap-2 flex-1 ml-4">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-green-500 h-full rounded-full transition-all"
                        style={{ width: `${lang.completion}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">{lang.completion}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sync Logs Section */}
        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => setShowSyncLogs(!showSyncLogs)}>
            <h4 className="font-semibold text-gray-900">Sync Logs</h4>
            <button
              className="text-gray-600 hover:text-gray-900 transition-transform"
              style={{ transform: showSyncLogs ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {showSyncLogs && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {logsLoading ? (
                <p className="text-sm text-gray-600 py-4 text-center">Loading logs...</p>
              ) : syncLogs.length > 0 ? (
                syncLogs.map(log => (
                  <div key={log.id} className="rounded-lg border bg-gray-50 p-3 text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900">
                        {new Date(log.syncedAt).toLocaleString()}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          log.status === 'success'
                            ? 'bg-green-100 text-green-800'
                            : log.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                      </span>
                    </div>
                    {log.keysAdded && <p className="text-gray-600">Keys added: {log.keysAdded}</p>}
                    {log.keysUpdated && <p className="text-gray-600">Keys updated: {log.keysUpdated}</p>}
                    {log.error && <p className="text-red-600 text-xs">{log.error}</p>}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-600 py-4 text-center">No sync logs yet</p>
              )}
            </div>
          )}
        </div>
      </PermissionGate>
    </div>
  )
}
