'use client'

import React, { useEffect, Suspense, lazy, useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import SettingsShell from '@/components/admin/settings/SettingsShell'
import FavoriteToggle from '@/components/admin/settings/FavoriteToggle'
import Tabs from '@/components/admin/settings/Tabs'
import { Globe } from 'lucide-react'
import { useLocalizationContext } from './LocalizationProvider'
import { TABS } from './constants'
import type { TabKey } from './types'

// Lazy load tab components from the memoized index for better performance
const LanguagesTab = lazy(() => import('./tabs').then(m => ({ default: m.LanguagesTab })))
const OrganizationTab = lazy(() => import('./tabs').then(m => ({ default: m.OrganizationTab })))
const UserPreferencesTab = lazy(() => import('./tabs').then(m => ({ default: m.UserPreferencesTab })))
const RegionalFormatsTab = lazy(() => import('./tabs').then(m => ({ default: m.RegionalFormatsTab })))
const IntegrationTab = lazy(() => import('./tabs').then(m => ({ default: m.IntegrationTab })))
const TranslationsTab = lazy(() => import('./tabs').then(m => ({ default: m.TranslationsTab })))
const AnalyticsTab = lazy(() => import('./tabs').then(m => ({ default: m.AnalyticsTab })))
const DiscoveryTab = lazy(() => import('./tabs').then(m => ({ default: m.DiscoveryTab })))

const TAB_COMPONENTS: Record<TabKey, React.ComponentType> = {
  languages: LanguagesTab,
  organization: OrganizationTab,
  'user-preferences': UserPreferencesTab,
  regional: RegionalFormatsTab,
  integration: IntegrationTab,
  translations: TranslationsTab,
  analytics: AnalyticsTab,
  discovery: DiscoveryTab,
}

// Tab fallback component for better UX during lazy loading
const TabFallback = () => (
  <div className="flex items-center justify-center py-8">
    <div className="text-center">
      <div className="inline-flex h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
      <p className="mt-3 text-sm text-gray-600">Loading tab content...</p>
    </div>
  </div>
)

// Error fallback for failed tab loads
const TabErrorFallback = ({ error }: { error: string }) => (
  <div className="flex items-center justify-center py-8">
    <div className="text-center max-w-md">
      <div className="inline-flex h-8 w-8 rounded-full border-4 border-red-200 border-t-red-600 mb-3" />
      <p className="text-sm text-red-600">Failed to load tab content</p>
      <p className="text-xs text-gray-500 mt-2">{error}</p>
    </div>
  </div>
)

// Error boundary for tab content
class TabErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: string }> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }

  componentDidCatch(error: Error) {
    console.error('Tab error:', error)
  }

  render() {
    if (this.state.hasError) {
      return <TabErrorFallback error={this.state.error} />
    }
    return this.props.children
  }
}

// Memoized tab renderer to prevent unnecessary re-renders
const TabRenderer = React.memo(function TabRenderer({ TabComponent, loading }: { TabComponent: React.ComponentType | null; loading: boolean }) {
  if (loading) {
    return <TabFallback />
  }

  if (!TabComponent) {
    return <TabErrorFallback error="Tab component not found" />
  }

  return (
    <TabErrorBoundary>
      <Suspense fallback={<TabFallback />}>
        <TabComponent />
      </Suspense>
    </TabErrorBoundary>
  )
})

export default function LocalizationContent() {
  const searchParams = useSearchParams()
  const { activeTab, setActiveTab, saving } = useLocalizationContext()
  const [initialLoading, setInitialLoading] = useState(true)

  // Memoize tab change handler
  const handleTabChange = useCallback((k: string) => {
    setActiveTab(k as TabKey)
  }, [setActiveTab])

  // Memoize tab change effect
  useEffect(() => {
    const t = searchParams.get('tab') as TabKey | null
    if (t && TABS.some(tab => tab.key === t)) {
      setActiveTab(t)
    }
  }, [searchParams, setActiveTab])

  // Mark initial loading complete after first render to allow tabs to load their own data
  useEffect(() => {
    const timer = setTimeout(() => setInitialLoading(false), 100)
    return () => clearTimeout(timer)
  }, [])

  // Memoize tab component selection
  const TabComponent = useMemo(() => TAB_COMPONENTS[activeTab], [activeTab])

  return (
    <SettingsShell
      title="Localization & Language Control"
      description="Manage languages, translations, regional settings, and user language preferences"
      icon={Globe}
      showBackButton={true}
      saving={saving}
      actions={
        <FavoriteToggle
          settingKey="localization"
          route="/admin/settings/localization"
          label="Localization Settings"
        />
      }
      tabs={TABS}
      activeTab={activeTab}
      onChangeTab={handleTabChange}
      loading={initialLoading}
    >
      <TabRenderer TabComponent={TabComponent} loading={initialLoading} />
    </SettingsShell>
  )
}
