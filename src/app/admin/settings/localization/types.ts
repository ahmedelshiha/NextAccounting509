export interface LanguageRow {
  code: string
  name: string
  nativeName: string
  direction: 'ltr' | 'rtl'
  flag?: string
  bcp47Locale: string
  enabled: boolean
  featured?: boolean
  autoDetect?: boolean
}

export interface OrganizationLocalizationSettings {
  defaultLanguage: string
  fallbackLanguage: string
  showLanguageSwitcher: boolean
  persistLanguagePreference: boolean
  autoDetectBrowserLanguage: boolean
  allowUserLanguageOverride: boolean
  enableRtlSupport: boolean
  missingTranslationBehavior: 'show-key' | 'show-fallback' | 'show-empty'
}

export interface RegionalFormat {
  language: string
  dateFormat: string
  timeFormat: string
  currencyCode: string
  currencySymbol: string
  numberFormat: string
  decimalSeparator: string
  thousandsSeparator: string
}

export interface CrowdinIntegration {
  projectId: string
  apiToken: string
  autoSyncDaily: boolean
  syncOnDeploy: boolean
  createPrs: boolean
  lastSyncAt?: string | null
  lastSyncStatus?: 'success' | 'failed' | 'pending' | null
  testConnectionOk?: boolean
}

export interface TranslationStatus {
  summary: {
    totalKeys: number
    enCoveragePct: string
    arCoveragePct: string
    hiCoveragePct: string
  }
}

export interface MissingKey {
  key: string
  arTranslated?: boolean
  hiTranslated?: boolean
}

export interface AnalyticsData {
  totalUsers: number
  languagesInUse: string[]
  mostUsedLanguage?: string
  distribution: Array<{
    language: string
    count: number
    percentage: string
  }>
}

export type TabKey = 'languages' | 'organization' | 'user-preferences' | 'regional' | 'integration' | 'translations' | 'analytics' | 'discovery'

export interface TabDefinition {
  key: TabKey
  label: string
}

import React from 'react'

export interface LocalizationContextType {
  activeTab: TabKey
  setActiveTab: (tab: TabKey) => void
  languages: LanguageRow[]
  setLanguages: React.Dispatch<React.SetStateAction<LanguageRow[]>>
  orgSettings: OrganizationLocalizationSettings
  setOrgSettings: React.Dispatch<React.SetStateAction<OrganizationLocalizationSettings>>
  regionalFormats: Record<string, RegionalFormat>
  setRegionalFormats: React.Dispatch<React.SetStateAction<Record<string, RegionalFormat>>>
  crowdinIntegration: CrowdinIntegration
  setCrowdinIntegration: React.Dispatch<React.SetStateAction<CrowdinIntegration>>
  translationStatus: TranslationStatus | null
  setTranslationStatus: React.Dispatch<React.SetStateAction<TranslationStatus | null>>
  missingKeys: MissingKey[]
  setMissingKeys: React.Dispatch<React.SetStateAction<MissingKey[]>>
  analyticsData: AnalyticsData | null
  setAnalyticsData: React.Dispatch<React.SetStateAction<AnalyticsData | null>>
  saving: boolean
  setSaving: React.Dispatch<React.SetStateAction<boolean>>
  saved: boolean
  setSaved: React.Dispatch<React.SetStateAction<boolean>>
  error: string | null
  setError: React.Dispatch<React.SetStateAction<string | null>>
}
