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
import { IconBack, IconSearch, IconInfo, IconClose } from '@ielts/ui'

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
      console.error('apps/extension/src/popup/components/ImportExportSection.tsx error:', err);
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
    } catch (error) {
      console.error('apps/extension/src/popup/components/ImportExportSection.tsx error:', error);
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
          translation: '',
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
      console.error('apps/extension/src/popup/components/ImportExportSection.tsx error:', err);
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
        gap: 'var(--spacing-sm)',
        padding: 'var(--spacing-md)',
        minHeight: '500px',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-sm)',
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--color-text)',
            flexShrink: 0,
          }}
          aria-label="Back"
        >
          <IconBack size={16} />
        </button>
        <h1
          style={{
            fontSize: 'var(--text-base)',
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
            padding: 'var(--spacing-xs) var(--spacing-sm)',
            border: 'none',
            background: activeTab === 'search' ? 'var(--color-primary)' : 'var(--color-surface)',
            color: activeTab === 'search' ? 'var(--color-text-inverse)' : 'var(--color-text)',
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--weight-semibold)',
            cursor: 'pointer',
          }}
        >
          Search Content
        </button>
        <button
          onClick={() => { setActiveTab('imported'); setPreview(null) }}
          style={{
            flex: 1,
            padding: 'var(--spacing-xs) var(--spacing-sm)',
            border: 'none',
            background: activeTab === 'imported' ? 'var(--color-primary)' : 'var(--color-surface)',
            color: activeTab === 'imported' ? 'var(--color-text-inverse)' : 'var(--color-text)',
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--weight-semibold)',
            cursor: 'pointer',
          }}
        >
          Import/Export
        </button>
      </div>

      {activeTab === 'search' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
          <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
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
                padding: 'var(--spacing-xs) var(--spacing-sm)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text)',
                fontSize: 'var(--text-xs)',
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
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', margin: 0, lineHeight: '1.4' }}>
              {sourceInfo.description}
            </p>
          )}

          <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Search ${sourceInfo?.label ?? source}...`}
              aria-label="Search query"
              style={{
                flex: 1,
                padding: 'var(--spacing-xs) var(--spacing-sm)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text)',
                fontSize: 'var(--text-sm)',
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
                color: 'var(--color-text-inverse)',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--weight-semibold)',
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
background: 'var(--color-danger-light)',
                 color: 'var(--color-danger)',
                fontSize: 'var(--text-xs)',
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
                gap: 'var(--spacing-xs)',
                color: 'var(--color-muted)',
                fontSize: 'var(--text-sm)',
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
                gap: 'var(--spacing-xs)',
                color: 'var(--color-muted)',
                fontSize: 'var(--text-sm)',
                textAlign: 'center',
              }}
            >
              <IconSearch size={24} style={{ opacity: 0.3 }} />
              No results found for "{query}". Try a different search term or source.
            </div>
          )}

          {results.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2xs)' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', fontWeight: 'var(--weight-semibold)' }}>
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
                      ? 'var(--color-primary-light)'
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
                    <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>
                      {result.title}
                    </span>
                    <span style={{
                      fontSize: 'var(--text-xs)',
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--color-surface-alt)',
                      color: 'var(--color-muted)',
                    }}>
                      {result.contentType}
                    </span>
                  </div>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {result.snippet || 'No preview available.'}
                  </span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>
                    {result.sourceName} &middot; {result.licenseName}
                  </span>
                </button>
              ))}
            </div>
          )}

          {previewLoading && (
            <div
              style={{
                padding: 'var(--spacing-sm)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                fontSize: 'var(--text-xs)',
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
                padding: 'var(--spacing-sm)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-primary)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-xs)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{preview.title}</span>
                <button
                  onClick={() => setPreview(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-muted)',
                    cursor: 'pointer',
                    fontSize: 'var(--text-xs)',
                    padding: '2px var(--spacing-2xs)',
                  }}
                  aria-label="Close preview"
                >
                  <IconClose size={16} />
                </button>
              </div>
              <div
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-muted)',
                  maxHeight: '100px',
                  overflow: 'auto',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {preview.content}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>
                {preview.attribution}
              </div>
              <button
                onClick={() => handleImport(preview)}
                disabled={importing}
                style={{
                  width: '100%',
                  padding: 'var(--spacing-xs) var(--spacing-sm)',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: 'var(--color-primary)',
                  color: 'var(--color-text-inverse)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--weight-semibold)',
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
          <section
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--spacing-sm)',
            }}
          >
            <h2
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--weight-semibold)',
                color: 'var(--color-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                margin: '0 0 var(--spacing-xs)',
              }}
            >
              Open in Web App
            </h2>
            <p
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text-secondary)',
                margin: '0 0 12px',
                lineHeight: '1.4',
              }}
            >
              Use the full Public API search and imported content manager on the IELTS Journey
              website. All data syncs between the extension and website when you're logged in.
            </p>
            <button
              onClick={() => chrome.tabs.create({ url: 'https://ieltsjourney.dev/public-api' })}
              style={{
                width: '100%',
                padding: 'var(--spacing-sm) var(--spacing-md)',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: 'var(--color-primary)',
                color: 'var(--color-text-inverse)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--weight-semibold)',
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
              padding: 'var(--spacing-sm)',
            }}
          >
            <h2
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--weight-semibold)',
                color: 'var(--color-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                margin: '0 0 var(--spacing-xs)',
              }}
            >
              Backup & Restore
            </h2>
            <p
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text-secondary)',
                margin: '0 0 12px',
                lineHeight: '1.4',
              }}
            >
              Export all your extension data as a JSON backup file, or restore from a previous
              backup. Use this to transfer data between devices or to the website.
            </p>
            <button
              onClick={() => chrome.tabs.create({ url: 'https://ieltsjourney.dev/import-export' })}
              style={{
                width: '100%',
                padding: 'var(--spacing-sm) var(--spacing-md)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--weight-semibold)',
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
              padding: 'var(--spacing-sm)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-secondary)',
              lineHeight: '1.5',
            }}
          >
            <strong style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-2xs)', color: 'var(--color-text)' }}><IconInfo size={14} /> About Data Sync</strong>
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
