import { safeStorageGet, safeStorageSet } from '../utils/safe-chrome'
import { STORAGE_KEYS } from '@ielts/config'

export type ApiSourceName = 'wiktionary' | 'datamuse' | 'tatoeba' | 'wikipedia' | 'gutendex'

export interface ApiSearchResult {
  id: string
  title: string
  snippet: string
  sourceName: ApiSourceName
  sourceUrl: string
  contentType: 'dictionary' | 'vocabulary-list' | 'reading' | 'article' | 'reference'
  licenseName: string
}

export interface ApiPreview {
  id: string
  title: string
  content: string
  contentType: ApiSearchResult['contentType']
  sourceName: ApiSourceName
  sourceUrl: string
  licenseName: string
  attribution: string
}

const CORS_PROXY_KEY = STORAGE_KEYS.localStorage.corsProxy
const DEFAULT_CORS_PROXY = 'https://corsproxy.io/?'

interface CorsProxyConfig {
  enabled: boolean
  proxyUrl: string
}

async function getCorsProxyConfig(): Promise<CorsProxyConfig> {
  try {
    const result = await safeStorageGet<any>(CORS_PROXY_KEY)
    const raw = result[CORS_PROXY_KEY]
    if (raw) {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
      if (parsed && typeof parsed.enabled === 'boolean' && typeof parsed.proxyUrl === 'string') {
        return parsed
      }
    }
  } catch (error) {
  console.error('apps/extension/src/services/api-client.ts error:', error);
  
  }
  return { enabled: false, proxyUrl: DEFAULT_CORS_PROXY }
}

async function fetchWithCorsProxy(url: string): Promise<Response> {
  const config = await getCorsProxyConfig()
  if (!config.enabled) return fetch(url)
  const proxyBase = config.proxyUrl.replace(/\/+$/, '')
  const separator = proxyBase.includes('?') ? '' : '?'
  return fetch(`${proxyBase}${separator}${encodeURIComponent(url)}`)
}

async function searchWikipedia(query: string): Promise<ApiSearchResult[]> {
  const url = new URL('https://en.wikipedia.org/w/api.php')
  url.searchParams.set('action', 'query')
  url.searchParams.set('list', 'search')
  url.searchParams.set('srsearch', query)
  url.searchParams.set('srlimit', '10')
  url.searchParams.set('format', 'json')
  url.searchParams.set('origin', '*')

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Wikipedia API error: ${res.status}`)
  const data = await res.json()

  const pages = data?.query?.search ?? []
  return pages.map((p: Record<string, unknown>) => ({
    id: 'wiki-' + p.pageid,
    title: String(p.title ?? ''),
    snippet: String(p.snippet ?? '').replace(/<[^>]+>/g, ''),
    sourceName: 'wikipedia' as ApiSourceName,
    sourceUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(String(p.title ?? ''))}`,
    contentType: 'article' as ApiSearchResult['contentType'],
    licenseName: 'CC BY-SA 3.0',
  }))
}

async function searchWiktionary(query: string): Promise<ApiSearchResult[]> {
  const url = new URL('https://en.wiktionary.org/w/api.php')
  url.searchParams.set('action', 'query')
  url.searchParams.set('list', 'search')
  url.searchParams.set('srsearch', query)
  url.searchParams.set('srlimit', '10')
  url.searchParams.set('format', 'json')
  url.searchParams.set('origin', '*')

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Wiktionary API error: ${res.status}`)
  const data = await res.json()

  const pages = data?.query?.search ?? []
  return pages.map((p: Record<string, unknown>) => ({
    id: 'wikt-' + p.pageid,
    title: String(p.title ?? ''),
    snippet: String(p.snippet ?? '').replace(/<[^>]+>/g, ''),
    sourceName: 'wiktionary' as ApiSourceName,
    sourceUrl: `https://en.wiktionary.org/wiki/${encodeURIComponent(String(p.title ?? ''))}`,
    contentType: 'dictionary' as ApiSearchResult['contentType'],
    licenseName: 'CC BY-SA 3.0',
  }))
}

async function searchDatamuse(query: string): Promise<ApiSearchResult[]> {
  const url = new URL('https://api.datamuse.com/words')
  url.searchParams.set('ml', query)
  url.searchParams.set('max', '10')

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Datamuse API error: ${res.status}`)
  const data = await res.json()

  return data.map((w: Record<string, unknown>, i: number) => {
    const defs = w.defs as string[] | undefined
    const tags = w.tags as string[] | undefined
    return {
      id: 'dm-' + i + '-' + crypto.randomUUID().slice(0, 6),
      title: String(w.word ?? ''),
      snippet: [
        defs ? defs.slice(0, 2).join('; ') : '',
        tags ? `Tags: ${tags.slice(0, 4).join(', ')}` : '',
      ]
        .filter(Boolean)
        .join(' — '),
      sourceName: 'datamuse' as ApiSourceName,
      sourceUrl: `https://www.datamuse.com/api/?ml=${encodeURIComponent(query)}`,
      contentType: 'vocabulary-list' as ApiSearchResult['contentType'],
      licenseName: 'CC BY 4.0',
    }
  })
}

async function searchGutendex(query: string): Promise<ApiSearchResult[]> {
  const url = new URL('https://gutendex.com/books')
  url.searchParams.set('search', query)

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Gutendex API error: ${res.status}`)
  const data = await res.json()

  const books = data?.results ?? []
  return books.map((b: Record<string, unknown>) => ({
    id: 'gute-' + b.id,
    title: String(b.title ?? ''),
    snippet: [
      b.authors
        ? (b.authors as Array<{ name: string }>)
            .map((a: { name: string }) => a.name)
            .join(', ')
        : '',
      b.subjects ? (b.subjects as string[]).slice(0, 3).join(', ') : '',
    ]
      .filter(Boolean)
      .join(' — '),
    sourceName: 'gutendex' as ApiSourceName,
    sourceUrl: `https://www.gutenberg.org/ebooks/${b.id}`,
    contentType: 'reading' as ApiSearchResult['contentType'],
    licenseName: 'Public Domain',
  }))
}

async function searchTatoeba(query: string): Promise<ApiSearchResult[]> {
  const url = new URL('https://tatoeba.org/en/api/v0/search')
  url.searchParams.set('query', query)
  url.searchParams.set('from', 'eng')
  url.searchParams.set('to', 'eng')
  url.searchParams.set('limit', '10')

  const res = await fetchWithCorsProxy(url.toString())
  if (!res.ok) throw new Error(`Tatoeba API error: ${res.status}`)
  const data = await res.json()

  const results = data?.results ?? []
  return results.map((r: Record<string, unknown>, i: number) => ({
    id: 'tat-' + i + '-' + crypto.randomUUID().slice(0, 6),
    title: ((r as { text?: string }).text ?? 'Tatoeba sentence').slice(0, 80),
    snippet: (r as { text?: string }).text ?? '',
    sourceName: 'tatoeba' as ApiSourceName,
    sourceUrl: `https://tatoeba.org/en/sentences/show/${r.id}`,
    contentType: 'dictionary' as ApiSearchResult['contentType'],
    licenseName: 'CC BY 2.0 FR',
  }))
}

interface SearchFn {
  (query: string): Promise<ApiSearchResult[]>
}

const SEARCH_HANDLERS: Record<ApiSourceName, SearchFn> = {
  wiktionary: searchWiktionary,
  datamuse: searchDatamuse,
  tatoeba: searchTatoeba,
  wikipedia: searchWikipedia,
  gutendex: searchGutendex,
}

export const API_SOURCE_INFO: Record<ApiSourceName, { label: string; category: string; description: string }> = {
  wiktionary: {
    label: 'Wiktionary',
    category: 'Dictionary & Vocabulary',
    description: 'Free dictionary with word meanings, etymology, pronunciation, and translations.',
  },
  datamuse: {
    label: 'Datamuse',
    category: 'Dictionary & Vocabulary',
    description: 'Word-finding query engine for synonyms, antonyms, related words, and rhymes.',
  },
  tatoeba: {
    label: 'Tatoeba',
    category: 'Dictionary & Vocabulary',
    description: 'Collection of example sentences and translations in multiple languages.',
  },
  wikipedia: {
    label: 'Wikipedia',
    category: 'Article & Knowledge',
    description: 'Free encyclopedia articles for IELTS topic background and reading material.',
  },
  gutendex: {
    label: 'Project Gutenberg',
    category: 'Article & Knowledge',
    description: 'Free eBooks and public domain literature for IELTS reading practice.',
  },
}

export async function searchApi(source: ApiSourceName, query: string): Promise<ApiSearchResult[]> {
  const handler = SEARCH_HANDLERS[source]
  if (!handler) throw new Error(`No search implementation for "${source}"`)
  return handler(query)
}

export async function fetchPreview(result: ApiSearchResult): Promise<ApiPreview> {
  let content = result.snippet

  if (result.sourceName === 'wikipedia' || result.sourceName === 'wiktionary') {
    const apiUrl = result.sourceName === 'wikipedia'
      ? 'https://en.wikipedia.org/w/api.php'
      : 'https://en.wiktionary.org/w/api.php'
    const title = result.title

    const url = new URL(apiUrl)
    url.searchParams.set('action', 'query')
    url.searchParams.set('titles', title)
    url.searchParams.set('prop', 'extracts')
    url.searchParams.set('exintro', '1')
    url.searchParams.set('explaintext', '1')
    url.searchParams.set('format', 'json')
    url.searchParams.set('origin', '*')

    try {
      const res = await fetch(url.toString())
      if (res.ok) {
        const data = await res.json()
        const pages = data?.query?.pages ?? {}
        const pageKey = Object.keys(pages)[0]
        if (pageKey && pageKey !== '-1') {
          content = pages[pageKey]?.extract ?? content
        }
      }
    } catch (error) {
  console.error('apps/extension/src/services/api-client.ts error:', error);
    
    }
  }

  return {
    id: result.id,
    title: result.title,
    content,
    contentType: result.contentType,
    sourceName: result.sourceName,
    sourceUrl: result.sourceUrl,
    licenseName: result.licenseName,
    attribution: `Source: ${result.sourceName} (${result.licenseName})`,
  }
}

export async function saveCorsProxyConfig(config: CorsProxyConfig): Promise<void> {
  await safeStorageSet({ [CORS_PROXY_KEY]: JSON.stringify(config) })
}

export { getCorsProxyConfig, CORS_PROXY_KEY }
