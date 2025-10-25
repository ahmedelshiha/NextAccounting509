'use client'

import React, { createContext, useState, useCallback, ReactNode, useMemo } from 'react'
import type {
  LocalizationContextType,
  LanguageRow,
  OrganizationLocalizationSettings,
  RegionalFormat,
  CrowdinIntegration,
  TranslationStatus,
  MissingKey,
  AnalyticsData,
  TabKey,
} from './types'
import { DEFAULT_ORG_SETTINGS, DEFAULT_CROWDIN_INTEGRATION } from './constants'

export const LocalizationContext = createContext<LocalizationContextType | null>(null)

interface LocalizationProviderProps {
  children: ReactNode
}

export const LocalizationProvider: React.FC<LocalizationProviderProps> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('languages')
  const [languages, setLanguages] = useState<LanguageRow[]>([])
  const [orgSettings, setOrgSettings] = useState<OrganizationLocalizationSettings>(DEFAULT_ORG_SETTINGS)
  const [regionalFormats, setRegionalFormats] = useState<Record<string, RegionalFormat>>({})
  const [crowdinIntegration, setCrowdinIntegration] = useState<CrowdinIntegration>(DEFAULT_CROWDIN_INTEGRATION)
  const [translationStatus, setTranslationStatus] = useState<TranslationStatus | null>(null)
  const [missingKeys, setMissingKeys] = useState<MissingKey[]>([])
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Memoize setter callbacks to prevent unnecessary re-renders in child components
  const memoizedSetActiveTab = useCallback((tab: TabKey | ((prev: TabKey) => TabKey)) => {
    setActiveTab(typeof tab === 'function' ? tab : tab)
  }, [])

  const memoizedSetLanguages = useCallback((langs: LanguageRow[] | ((prev: LanguageRow[]) => LanguageRow[])) => {
    setLanguages(langs)
  }, [])

  const memoizedSetOrgSettings = useCallback((settings: OrganizationLocalizationSettings | ((prev: OrganizationLocalizationSettings) => OrganizationLocalizationSettings)) => {
    setOrgSettings(settings)
  }, [])

  const memoizedSetRegionalFormats = useCallback((formats: Record<string, RegionalFormat> | ((prev: Record<string, RegionalFormat>) => Record<string, RegionalFormat>)) => {
    setRegionalFormats(formats)
  }, [])

  const memoizedSetCrowdinIntegration = useCallback((integration: CrowdinIntegration | ((prev: CrowdinIntegration) => CrowdinIntegration)) => {
    setCrowdinIntegration(integration)
  }, [])

  const memoizedSetTranslationStatus = useCallback((status: TranslationStatus | null | ((prev: TranslationStatus | null) => TranslationStatus | null)) => {
    setTranslationStatus(status)
  }, [])

  const memoizedSetMissingKeys = useCallback((keys: MissingKey[] | ((prev: MissingKey[]) => MissingKey[])) => {
    setMissingKeys(keys)
  }, [])

  const memoizedSetAnalyticsData = useCallback((data: AnalyticsData | null | ((prev: AnalyticsData | null) => AnalyticsData | null)) => {
    setAnalyticsData(data)
  }, [])

  const memoizedSetSaving = useCallback((isSaving: boolean | ((prev: boolean) => boolean)) => {
    setSaving(isSaving)
  }, [])

  const memoizedSetSaved = useCallback((isSaved: boolean | ((prev: boolean) => boolean)) => {
    setSaved(isSaved)
  }, [])

  const memoizedSetError = useCallback((err: string | null | ((prev: string | null) => string | null)) => {
    setError(err)
  }, [])

  // Memoize context value to prevent unnecessary provider updates
  const value: LocalizationContextType = useMemo(() => ({
    activeTab,
    setActiveTab: memoizedSetActiveTab,
    languages,
    setLanguages: memoizedSetLanguages,
    orgSettings,
    setOrgSettings: memoizedSetOrgSettings,
    regionalFormats,
    setRegionalFormats: memoizedSetRegionalFormats,
    crowdinIntegration,
    setCrowdinIntegration: memoizedSetCrowdinIntegration,
    translationStatus,
    setTranslationStatus: memoizedSetTranslationStatus,
    missingKeys,
    setMissingKeys: memoizedSetMissingKeys,
    analyticsData,
    setAnalyticsData: memoizedSetAnalyticsData,
    saving,
    setSaving: memoizedSetSaving,
    saved,
    setSaved: memoizedSetSaved,
    error,
    setError: memoizedSetError,
  }), [
    activeTab, memoizedSetActiveTab,
    languages, memoizedSetLanguages,
    orgSettings, memoizedSetOrgSettings,
    regionalFormats, memoizedSetRegionalFormats,
    crowdinIntegration, memoizedSetCrowdinIntegration,
    translationStatus, memoizedSetTranslationStatus,
    missingKeys, memoizedSetMissingKeys,
    analyticsData, memoizedSetAnalyticsData,
    saving, memoizedSetSaving,
    saved, memoizedSetSaved,
    error, memoizedSetError,
  ])

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  )
}

export const useLocalizationContext = (): LocalizationContextType => {
  const context = React.useContext(LocalizationContext)
  if (!context) {
    throw new Error('useLocalizationContext must be used within LocalizationProvider')
  }
  return context
}
