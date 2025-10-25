"use client"

import { useCallback, useState } from 'react'
import { useLocalizationContext } from '../LocalizationProvider'
import type { CrowdinIntegration } from '../types'
import { toast } from 'sonner'

export function useCrowdinIntegration() {
  const { setSaving, setError, setCrowdinIntegration } = useLocalizationContext()
  const [testLoading, setTestLoading] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const loadCrowdin = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/crowdin-integration')
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
    }
  }, [setCrowdinIntegration])

  const testConnection = useCallback(async (payload: Pick<CrowdinIntegration, 'projectId' | 'apiToken'>) => {
    setTestLoading(true)
    setTestResult(null)
    try {
      const r = await fetch('/api/admin/crowdin-integration', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d?.error || 'Connection test failed')
      setTestResult({ success: true, message: 'Connection successful!' })
      toast.success('Crowdin connection test passed')
    } catch (e: any) {
      const message = e?.message || 'Connection test failed'
      setTestResult({ success: false, message })
      toast.error(message)
    } finally {
      setTestLoading(false)
    }
  }, [])

  const save = useCallback(async (integration: CrowdinIntegration) => {
    setSaving(true)
    setError(null)
    try {
      const r = await fetch('/api/admin/crowdin-integration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(integration),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d?.error || 'Failed to save Crowdin integration')
      toast.success('Crowdin integration saved')
      await loadCrowdin()
    } catch (e: any) {
      setError(e?.message || 'Failed to save Crowdin integration')
      toast.error(e?.message || 'Failed to save integration')
      throw e
    } finally {
      setSaving(false)
    }
  }, [setSaving, setError, loadCrowdin])

  return {
    loadCrowdin,
    testConnection,
    save,
    testLoading,
    testResult,
  }
}
