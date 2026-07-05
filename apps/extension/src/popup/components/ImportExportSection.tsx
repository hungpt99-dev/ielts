import { useState, useCallback } from 'react'
import { useToast } from '../../../../../packages/ui/src/components/Toast'
import {
  searchApi,
  fetchPreview,
  type ApiSourceName,
  type ApiSearchResult,
  type ApiPreview,
  API_SOURCE_INFO,
} from '../../services/api-client'
import { saveVocabularyEntry, type ExtensionVocabEntry } from '../../storage/vocabularyStore'
import { saveArticleEntry, type ExtensionArticleEntry } from '../../storage/articleStore'
import { incrementDailyProgress } from '../../services/storage'

interface ImportExportSectionProps {
  onBack: () => void
}

type Tab = 'search' | 'imported'

const API_SOURCES: ApiSourceName[] = ['wiktionary', 'datamuse', 'wikipedia', 'gutendex', 'tatoeba']

export default function ImportExportSection({ onBack }: ImportExportSectionProps) {
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<Tab>('search')

  const [source, setSource] = useState<ApiSourceName>('wiktionary')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ApiSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  const [preview, setPreview] = useState<ApiPreview | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [importing, setImporting] = useState(false)

  const handleSearch = useCallback(async () => {
    const q = query.trim()
    if (!q) return

    setLoading(true)
    setError(null)
    setResults([])
    setSearched(true)

    try {
      const data = await searchApi(source, q)
      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setLoading(false)
    }
  }, [query, source])

  const handlePreview = useCallback(async (result: ApiSearchResult) => {
    setPreviewLoading(true)
    setPreview(null)
    try {
      const p = await fetchPreview(result)
      setPreview(p)
    } catch {
      showToast('error', 'Failed to load preview')
    } finally {
      setPreviewLoading(false)
    }
  }, [showToast])

  const handleImport = useCallback(async (previewItem: ApiPreview) => {
    setImporting(true)
    try {
      if (previewItem.contentType === 'dictionary' || previewItem.contentType === 'vocabulary-list') {
        const word = previewItem.title.split(/[/,;(]/)[0].trim()
        if (!word) {
          showToast('error', 'Cannot import: no valid word found')
          return
        }
        const entry: ExtensionVocabEntry = {
          id: crypto.randomUUID(),
          word,
          sourceSentence: previewItem.content || previewItem.title,
          pageTitle: previewItem.title,
          pageUrl: previewItem.sourceUrl,
          topic: '',
          personalNote: '',
          tags: ['public-api', previewItem.sourceName],
          meaning: previewItem.content || previewItem.title,
          meaningVi: '',
          partOfSpeech: '',
          pronunciation: '',
          exampleSentence: '',
          synonyms: [],
          antonyms: [],
          collocations: [],
          wordFamily: [],
          difficulty: '',
          status: 'new',
          addedToReview: false,
          reviewId: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        await saveVocabularyEntry(entry)
        await incrementDailyProgress('wordsAdded')
        showToast('success', `Imported "${word}" to vocabulary`)
      } else {
        const entry: ExtensionArticleEntry = {
          id: crypto.randomUUID(),
          title: previewItem.title,
          url: previewItem.sourceUrl,
          content: previewItem.content,
          selectedParagraph: '',
          topic: '',
          tags: ['public-api', previewItem.sourceName],
          personalNote: '',
          isReadingPractice: false,
          difficulty: '',
          aiQuestions: [],
          status: 'new',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        await saveArticleEntry(entry)
        await incrementDailyProgress('articlesSaved')
        showToast('success', `Imported "${previewItem.title}" to articles`)
      }
      setPreview(null)
    } catch (err) {
      showToast('error', `Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setImporting(false)
    }
  }, [showToast])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }, [handleSearch])

  const sourceInfo = API_SOURCE_INFO[source]

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '16px',
        minHeight: '500px',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--color-text)',
            fontSize: '16px',
            flexShrink: 0,
          }}
          aria-label="Back"
        >
          ←
        </button>
        <h1
          style={{
            fontSize: '16px',
            fontWeight: 700,
            color: 'var(--color-text)',
            margin: 0,
          }}
        >
          Public Content
        </h1>
      </header>

      <div
        style={{
          display: 'flex',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          overflow: 'hidden',
        }}
      >
        <button
          onClick={() => setActiveTab('search')}
          style={{
            flex: 1,
            padding: '8px 12px',
            border: 'none',
            background: activeTab === 'search' ? 'var(--color-primary)' : 'var(--color-surface)',
            color: activeTab === 'search' ? '#ffffff' : 'var(--color-text)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Search Content
        </button>
        <button
          onClick={() => { setActiveTab('imported'); setPreview(null) }}
          style={{
            flex: 1,
            padding: '8px 12px',
            border: 'none',
            background: activeTab === 'imported' ? 'var(--color-primary)' : 'var(--color-surface)',
            color: activeTab === 'imported' ? '#ffffff' : 'var(--color-text)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Import/Export
        </button>
      </div>

      {activeTab === 'search' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select
              value={source}
              onChange={(e) => {
                setSource(e.target.value as ApiSourceName)
                setResults([])
                setError(null)
                setSearched(false)
                setPreview(null)
              }}
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text)',
                fontSize: '12px',
              }}
              aria-label="Content source"
            >
              {API_SOURCES.map((s) => (
                <option key={s} value={s}>
                  {API_SOURCE_INFO[s].label}
                </option>
              ))}
            </select>
          </div>

          {sourceInfo && (
            <p style={{ fontSize: '11px', color: 'var(--color-muted)', margin: 0, lineHeight: '1.4' }}>
              {sourceInfo.description}
            </p>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Search ${sourceInfo?.label ?? source}...`}
              aria-label="Search query"
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text)',
                fontSize: '13px',
              }}
            />
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: 'var(--color-primary)',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 600,
                cursor: loading || !query.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !query.trim() ? 0.6 : 1,
              }}
            >
              {loading ? '...' : 'Search'}
            </button>
          </div>

          {error && (
            <div
              role="alert"
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-error-light, #fef2f2)',
                color: 'var(--color-error, #ef4444)',
                fontSize: '12px',
                lineHeight: '1.4',
              }}
            >
              {error}
            </div>
          )}

          {loading && (
            <div
              role="status"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                gap: '8px',
                color: 'var(--color-muted)',
                fontSize: '13px',
              }}
            >
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid var(--color-border)',
                  borderTopColor: 'var(--color-primary)',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              Searching...
            </div>
          )}

          {searched && !loading && results.length === 0 && !error && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px 16px',
                gap: '8px',
                color: 'var(--color-muted)',
                fontSize: '13px',
                textAlign: 'center',
              }}
            >
              <span aria-hidden="true" style={{ fontSize: '24px', opacity: 0.3 }}>🔍</span>
              No results found for "{query}". Try a different search term or source.
            </div>
          )}

          {results.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: 600 }}>
                Results ({results.length})
              </span>
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handlePreview(result)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    width: '100%',
                    padding: '10px 12px',
                    background: preview?.id === result.id
                      ? 'var(--color-primary-light, #eef2ff)'
                      : 'var(--color-surface)',
                    border: preview?.id === result.id
                      ? '1px solid var(--color-primary)'
                      : '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: 'var(--color-text)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '13px' }}>
                      {result.title}
                    </span>
                    <span style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--color-surface-alt, #f1f5f9)',
                      color: 'var(--color-muted)',
                    }}>
                      {result.contentType}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--color-muted)', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {result.snippet || 'No preview available.'}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--color-muted)' }}>
                    {result.sourceName} &middot; {result.licenseName}
                  </span>
                </button>
              ))}
            </div>
          )}

          {previewLoading && (
            <div
              style={{
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                fontSize: '12px',
                color: 'var(--color-muted)',
                textAlign: 'center',
              }}
            >
              Loading preview...
            </div>
          )}

          {preview && !previewLoading && (
            <div
              style={{
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-primary)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '13px' }}>{preview.title}</span>
                <button
                  onClick={() => setPreview(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-muted)',
                    cursor: 'pointer',
                    fontSize: '14px',
                    padding: '2px 4px',
                  }}
                  aria-label="Close preview"
                >
                  ✕
                </button>
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--color-muted)',
                  maxHeight: '100px',
                  overflow: 'auto',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {preview.content}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--color-muted)' }}>
                {preview.attribution}
              </div>
              <button
                onClick={() => handleImport(preview)}
                disabled={importing}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: 'var(--color-primary)',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: importing ? 'not-allowed' : 'pointer',
                  opacity: importing ? 0.6 : 1,
                }}
              >
                {importing
                  ? 'Importing...'
                  : `Import as ${preview.contentType === 'dictionary' || preview.contentType === 'vocabulary-list' ? 'Vocabulary' : 'Article'}`
                }
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <section
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '12px',
            }}
          >
            <h2
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--color-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                margin: '0 0 8px',
              }}
            >
              Open in Web App
            </h2>
            <p
              style={{
                fontSize: '12px',
                color: 'var(--color-text-secondary)',
                margin: '0 0 12px',
                lineHeight: '1.4',
              }}
            >
              Use the full Public API search and imported content manager on the IELTS Journey
              website. All data syncs between the extension and website when you're logged in.
            </p>
            <button
              onClick={() => chrome.tabs.create({ url: 'https://ielts-journey.app/public-api' })}
              style={{
                width: '100%',
                padding: '10px 16px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: 'var(--color-primary)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Open Public API Page
            </button>
          </section>

          <section
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '12px',
            }}
          >
            <h2
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--color-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                margin: '0 0 8px',
              }}
            >
              Backup & Restore
            </h2>
            <p
              style={{
                fontSize: '12px',
                color: 'var(--color-text-secondary)',
                margin: '0 0 12px',
                lineHeight: '1.4',
              }}
            >
              Export all your extension data as a JSON backup file, or restore from a previous
              backup. Use this to transfer data between devices or to the website.
            </p>
            <button
              onClick={() => chrome.tabs.create({ url: 'https://ielts-journey.app/import-export' })}
              style={{
                width: '100%',
                padding: '10px 16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Open Import/Export Page
            </button>
          </section>

          <section
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '12px',
              fontSize: '12px',
              color: 'var(--color-text-secondary)',
              lineHeight: '1.5',
            }}
          >
            <strong style={{ color: 'var(--color-text)' }}>💡 About Data Sync</strong>
            <p style={{ margin: '4px 0 0' }}>
              The extension stores data locally using IndexedDB and chrome.storage. The website
              stores data in its own IndexedDB (separate origin). To sync between them:
            </p>
            <ol style={{ margin: '8px 0 0', paddingLeft: '16px' }}>
              <li>Use the extension's Backup & Restore to export your data</li>
              <li>Open the website's Import/Export page and import the backup</li>
              <li>Or export from the website and import in the extension</li>
            </ol>
          </section>
        </div>
      )}
    </div>
  )
}
