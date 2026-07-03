// ============================================================
// Public API Integration — TypeScript Interfaces
// ============================================================

import type { VocabDifficulty, PublicApiImportedContent } from '../../models'

// ── Source & Content Type Enums ─────────────────────────────

export type PublicApiSourceName =
  | 'wiktionary'
  | 'datamuse'
  | 'tatoeba'
  | 'oer-commons'
  | 'wikipedia'
  | 'gutendex'
  | 'youtube'

export type PublicApiContentType =
  | 'dictionary'
  | 'vocabulary-list'
  | 'reading'
  | 'listening'
  | 'article'
  | 'video'
  | 'exercise'
  | 'writing-prompt'
  | 'speaking-topic'
  | 'reference'

export type PublicApiCategory =
  | 'Dictionary & Vocabulary'
  | 'Open Educational Resource'
  | 'Article & Knowledge'
  | 'Video & Listening'

export type SourceType = 'public-api'

export type CorsCapability =
  | 'direct'        // Works from browser with no proxy
  | 'cors-bypass'   // Needs CORS proxy
  | 'no-cors'       // Cannot be used from browser (server-side only)

// Re-export for convenience
export type { PublicApiImportedContent }

// ── API Search & Preview ───────────────────────────────────

export interface PublicApiSearchParams {
  source: PublicApiSourceName
  query: string
  contentType?: PublicApiContentType
  limit?: number
  language?: string
}

export interface PublicApiSearchResult {
  id: string
  title: string
  snippet: string
  sourceName: PublicApiSourceName
  sourceUrl: string
  contentType: PublicApiContentType
  licenseName: string
}

export interface PublicApiPreview {
  id: string
  title: string
  content: string
  contentType: PublicApiContentType
  sourceName: PublicApiSourceName
  sourceUrl: string
  licenseName: string
  attribution: string
  metadata?: Record<string, unknown>
}

// ── API Source Configuration ───────────────────────────────

export interface PublicApiSourceConfig {
  name: PublicApiSourceName
  label: string
  category: PublicApiCategory
  description: string
  supportedContentTypes: PublicApiContentType[]
  corsStatus: CorsCapability
  requiresApiKey: boolean
  apiKeyLabel?: string
  apiKeyPlaceholder?: string
  baseUrl: string
  docsUrl: string
  defaultLicense: string
  rateLimit?: string
}

export const PUBLIC_API_SOURCES: PublicApiSourceConfig[] = [
  {
    name: 'wiktionary',
    label: 'Wiktionary',
    category: 'Dictionary & Vocabulary',
    description: 'Free dictionary with word meanings, etymology, pronunciation, and translations.',
    supportedContentTypes: ['dictionary', 'vocabulary-list'],
    corsStatus: 'direct',
    requiresApiKey: false,
    baseUrl: 'https://en.wiktionary.org/w/api.php',
    docsUrl: 'https://en.wiktionary.org/w/api.php',
    defaultLicense: 'CC BY-SA 3.0',
    rateLimit: 'No strict limit, but be respectful',
  },
  {
    name: 'datamuse',
    label: 'Datamuse',
    category: 'Dictionary & Vocabulary',
    description: 'Word-finding query engine for synonyms, antonyms, related words, and rhymes.',
    supportedContentTypes: ['dictionary', 'vocabulary-list'],
    corsStatus: 'direct',
    requiresApiKey: false,
    baseUrl: 'https://api.datamuse.com',
    docsUrl: 'https://www.datamuse.com/api/',
    defaultLicense: 'CC BY 4.0',
    rateLimit: '100,000 requests/day',
  },
  {
    name: 'tatoeba',
    label: 'Tatoeba',
    category: 'Dictionary & Vocabulary',
    description: 'Collection of example sentences and translations in multiple languages.',
    supportedContentTypes: ['dictionary', 'vocabulary-list'],
    corsStatus: 'cors-bypass',
    requiresApiKey: false,
    baseUrl: 'https://tatoeba.org/en/api/v0',
    docsUrl: 'https://tatoeba.org/en/api',
    defaultLicense: 'CC BY 2.0 FR',
    rateLimit: 'No strict limit',
  },
  {
    name: 'oer-commons',
    label: 'OER Commons',
    category: 'Open Educational Resource',
    description: 'Open educational resources including course materials, textbooks, and exercises.',
    supportedContentTypes: ['reading', 'exercise', 'reference'],
    corsStatus: 'cors-bypass',
    requiresApiKey: false,
    baseUrl: 'https://api.oercommons.org/v3',
    docsUrl: 'https://api.oercommons.org/docs/',
    defaultLicense: 'Various open licenses',
    rateLimit: 'Unknown',
  },
  {
    name: 'wikipedia',
    label: 'Wikipedia',
    category: 'Article & Knowledge',
    description: 'Free encyclopedia articles for IELTS topic background and reading material.',
    supportedContentTypes: ['article', 'reading', 'reference'],
    corsStatus: 'direct',
    requiresApiKey: false,
    baseUrl: 'https://en.wikipedia.org/w/api.php',
    docsUrl: 'https://www.mediawiki.org/wiki/API:Main_page',
    defaultLicense: 'CC BY-SA 3.0',
    rateLimit: 'No strict limit, but be respectful',
  },
  {
    name: 'gutendex',
    label: 'Project Gutenberg (Gutendex)',
    category: 'Article & Knowledge',
    description: 'Free eBooks and public domain literature for IELTS reading practice.',
    supportedContentTypes: ['reading', 'reference'],
    corsStatus: 'direct',
    requiresApiKey: false,
    baseUrl: 'https://gutendex.com',
    docsUrl: 'https://gutendex.com/',
    defaultLicense: 'Public Domain',
    rateLimit: 'No strict limit',
  },
  {
    name: 'youtube',
    label: 'YouTube',
    category: 'Video & Listening',
    description: 'Video metadata search for IELTS listening and speaking practice.',
    supportedContentTypes: ['video', 'listening'],
    corsStatus: 'no-cors',
    requiresApiKey: true,
    apiKeyLabel: 'YouTube Data API Key',
    apiKeyPlaceholder: 'AIza...',
    baseUrl: 'https://www.googleapis.com/youtube/v3',
    docsUrl: 'https://developers.google.com/youtube/v3',
    defaultLicense: 'YouTube Terms of Service',
    rateLimit: '10,000 units/day (free tier)',
  },
]

// ── API Key Management ─────────────────────────────────────

export interface PublicApiKeyEntry {
  sourceName: PublicApiSourceName
  apiKey: string
  label: string
}

// ── CORS Proxy Configuration ───────────────────────────────

export interface CorsProxyConfig {
  enabled: boolean
  proxyUrl: string
}

export const DEFAULT_CORS_PROXY = 'https://corsproxy.io/?'
export const CORS_PROXY_STORAGE_KEY = 'ielts-cors-proxy'

// ── Import Result ──────────────────────────────────────────

export interface PublicApiImportResult {
  success: boolean
  contentId: string
  error?: string
}

// ── AI Classification Request / Response ───────────────────

export interface PublicApiAiClassifyRequest {
  contentId: string
  title: string
  content: string
  contentType: PublicApiContentType
}

export interface PublicApiAiClassifyResponse {
  topic: string
  skill: string
  difficulty: VocabDifficulty
  tags: string[]
  vocabulary: string[]
  summary: string
  keyPhrases: string[]
  questions: string[]
}

// ── IndexedDB Schema (for Dexie version migration) ─────────

export const PUBLIC_API_CONTENT_DB_SCHEMA = {
  publicApiContent: 'id, sourceName, contentType, topic, skill, difficulty, *tags, importedAt',
}
