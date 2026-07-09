import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../components/ui/Toast'
import Card, { CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton'
import { ErrorState, EmptyStateIllustrated } from '../../components/ui/EmptyState'
import { DatabaseService } from '../../services/storage/Database'
import type { VocabularyEntry } from '../../models'
import { EXTENSION_URL } from '../landing/config'
import PageHeader from '../../components/layout/PageHeader'
import PageContent from '../../components/layout/PageContent'
import { IconExtension } from '@ielts/ui'
import { syncAll, SyncOrchestrator } from '../../services/sync/SyncOrchestrator'
import type { SyncProgress } from '../../services/sync/SyncOrchestrator'

const EDGE_EXTENSION_URL = 'https://microsoftedge.microsoft.com/addons/detail/ielts-journey'

type ConnectionStatus = 'checking' | 'connected' | 'disconnected' | 'error'
type SyncStatus = 'idle' | 'syncing' | 'error'

interface ExtensionInfo {
  browser: string
  version: string
  lastSyncTime: string | null
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return 'Never synced'
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

function getBrowserName(): string {
  const ua = navigator.userAgent
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome'
  if (ua.includes('Edg')) return 'Edge'
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari'
  return 'Browser'
}

const FEATURES = [
  {
    id: 'save-vocab',
    title: 'Save Vocabulary While You Read',
    description: 'Select any word or phrase on a webpage and save it directly to your IELTS Journey vocabulary notebook. The word, its context, and the page URL are saved automatically.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        <path d="M19 3l-2 2m0 0l-2-2m2 2v8" />
      </svg>
    ),
    gradient: '',
  },
  {
    id: 'save-articles',
    title: 'Collect Articles for IELTS Practice',
    description: 'Save full articles from news sites, blogs, and online content. Articles are stored in the extension and can be imported to the web app for reading practice.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
        <path d="M12 7v6m-3-3h6" />
      </svg>
    ),
    gradient: '',
  },
  {
    id: 'explain-text',
    title: 'AI Explanations for Any Text',
    description: 'Select any sentence or passage on a webpage and ask AI Tutor to explain it in the context of IELTS. Get vocabulary breakdowns, grammar analysis, and IELTS topic connections.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
      </svg>
    ),
    gradient: '',
  },
  {
    id: 'auto-highlight',
    title: 'Auto-Highlight Words You\'re Learning',
    description: 'When you visit a webpage, the extension automatically highlights words from your vocabulary notebook. Words you\'re currently studying appear in yellow, mastered words in green, new words in blue.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    ),
    gradient: '',
  },
  {
    id: 'mini-tutor',
    title: 'Quick AI Tutor in Your Browser',
    description: 'Open the extension popup to access a mini version of AI Tutor. Ask quick questions, get word explanations, or check your grammar without leaving your current page.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    gradient: '',
  },
  {
    id: 'video-helper',
    title: 'Learn from Videos',
    description: 'Save subtitles and transcripts from YouTube videos and online courses. Extract vocabulary, sentences, and IELTS-relevant content from video-based learning.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    gradient: '',
  },
]

const TROUBLESHOOTING_ITEMS = [
  {
    id: 'not-showing',
    question: 'Extension icon not showing in browser toolbar',
    answer: 'Open your browser\'s extensions page (chrome://extensions), find IELTS Journey, and click the "pin" icon so it appears in your toolbar. If it\'s not listed, try reinstalling the extension.',
  },
  {
    id: 'not-syncing',
    question: 'Vocabulary not syncing between extension and website',
    answer: 'Make sure you\'re logged into the same IELTS Journey account on both the extension and website. Try clicking "Sync Now" above to manually sync your vocabulary.',
  },
  {
    id: 'articles-not-appearing',
    question: 'Saved articles not appearing on the website',
    answer: 'Articles saved in the extension do not sync automatically. Use the "Import Articles from Extension" button above to manually import them. This is by design — we give you control over what gets imported.',
  },
  {
    id: 'highlight-not-working',
    question: 'Auto-highlight not working',
    answer: 'Check that your vocabulary notebook has at least one saved word. If it does, try refreshing the webpage. The extension highlights words from your vocabulary list while browsing.',
  },
  {
    id: 'needs-update',
    question: 'Extension needs update',
    answer: 'Chrome and Edge update extensions automatically. To check manually, go to chrome://extensions, enable "Developer mode", and click "Update". The extension should update to the latest version.',
  },
  {
    id: 'disconnected',
    question: 'Connection says disconnected but extension is installed',
    answer: 'Try refreshing this page first. If that doesn\'t work, log out and log back into both the extension and website. As a last resort, reinstall the extension from the Chrome Web Store.',
  },
  {
    id: 'ai-not-working',
    question: 'AI explanations not working in extension',
    answer: 'Ensure you have an AI provider configured in Settings > AI Provider. The extension uses the same AI configuration as the website. Go to Settings to set up your provider, API key, and model.',
  },
]

function PuzzlePieceIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
    </svg>
  )
}

function ExtensionConnectionSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }} role="status" aria-label="Loading extension connection page">
      <LoadingSkeleton variant="text" width="200px" height="24px" />
      <LoadingSkeleton variant="card" height="120px" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--spacing-sm)' }}>
        <LoadingSkeleton variant="card" count={3} gap="var(--spacing-sm)" />
      </div>
      <LoadingSkeleton variant="card" height="100px" />
    </div>
  )
}

export default function ExtensionConnectionPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('checking')
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [extensionInfo, setExtensionInfo] = useState<ExtensionInfo>({ browser: getBrowserName(), version: '', lastSyncTime: null })
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError] = useState<string | null>(null)
  const [importingVocab, setImportingVocab] = useState(false)
  const [importingArticles, setImportingArticles] = useState(false)
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null)
  const [expandedTroubleshooting, setExpandedTroubleshooting] = useState<string | null>(null)
  const [vocabCount, setVocabCount] = useState(0)
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(localStorage.getItem('extension-last-sync'))

  const checkConnection = useCallback(() => {
    setConnectionStatus('checking')
    setPageError(null)

    const timeout = setTimeout(() => {
      const stored = localStorage.getItem('extension-connected')
      if (stored === 'true') {
        setConnectionStatus('disconnected')
      } else {
        setConnectionStatus('disconnected')
      }
      setPageLoading(false)
    }, 3000)

    function handleHeartbeat(e: MessageEvent) {
      if (e.data?.source === 'ielts-extension' && e.data?.action === 'HEARTBEAT') {
        clearTimeout(timeout)
        window.removeEventListener('message', handleHeartbeat)

        setConnectionStatus('connected')
        setExtensionInfo(prev => ({
          ...prev,
          version: e.data?.version || '',
          browser: e.data?.browser || getBrowserName(),
        }))
        setLastSyncTime(new Date().toISOString())
        localStorage.setItem('extension-connected', 'true')
        localStorage.setItem('extension-last-sync', new Date().toISOString())
        setPageLoading(false)
      }
    }

    window.addEventListener('message', handleHeartbeat)

    try {
      window.postMessage({ source: 'ielts-page', action: 'EXTENSION_PING' }, window.location.origin)
    } catch {}

    setTimeout(() => {
      window.removeEventListener('message', handleHeartbeat)
    }, 3500)

    return () => {
      clearTimeout(timeout)
      window.removeEventListener('message', handleHeartbeat)
    }
  }, [])

  useEffect(() => {
    const cleanup = checkConnection()
    DatabaseService.getAll<VocabularyEntry>('vocabulary').then(all => {
      setVocabCount(all.length)
    }).catch(() => {})
    return cleanup
  }, [checkConnection])

  function handleSyncNow() {
    setSyncStatus('syncing')
    SyncOrchestrator.init()

    syncAll().then((progress: SyncProgress) => {
      setSyncStatus('idle')
      if (progress.result === 'success' || progress.result === 'partial') {
        const now = new Date().toISOString()
        setLastSyncTime(now)
        localStorage.setItem('extension-last-sync', now)
      }
      DatabaseService.getAll<VocabularyEntry>('vocabulary').then(all => {
        setVocabCount(all.length)
      }).catch(() => {})

      if (progress.result === 'success') {
        const details = [
          progress.syncedVocabCount > 0 ? `${progress.syncedVocabCount} vocab` : '',
          progress.syncedMistakeCount > 0 ? `${progress.syncedMistakeCount} mistakes` : '',
        ].filter(Boolean).join(', ')
        showToast('success', `Sync complete${details ? ` (${details})` : ''}`)
      } else if (progress.result === 'partial') {
        showToast('success', 'Web data synced to extension. Extension data was not available.')
      } else {
        showToast('error', progress.error || 'Sync failed')
      }
    })
  }

  async function handleImportVocab() {
    setImportingVocab(true)
    try {
      SyncOrchestrator.init()
      const { requestExtensionData } = await import('../../services/sync/SyncProtocol')
      const extensionData = await requestExtensionData()
      const existing = await DatabaseService.getAll<VocabularyEntry>('vocabulary')
      const existingIds = new Set(existing.map(v => v.id))
      const { mapExtensionVocabToWeb } = await import('../../services/sync/SyncMapper')
      const newEntries = extensionData.vocabulary
        .map(mapExtensionVocabToWeb)
        .filter(v => !existingIds.has(v.id))
      if (newEntries.length > 0) {
        await DatabaseService.bulkAdd('vocabulary', newEntries as never[])
      }
      setVocabCount(existing.length + newEntries.length)
      showToast('success', `${newEntries.length} words imported from extension.`)
    } catch {
      showToast('error', 'Failed to import vocabulary from extension.')
    } finally {
      setImportingVocab(false)
    }
  }

  async function handleImportArticles() {
    setImportingArticles(true)
    try {
      window.postMessage({ source: 'ielts-page', action: 'REQUEST_EXTENSION_ARTICLES' }, window.location.origin)
      await new Promise(resolve => setTimeout(resolve, 2000))

      showToast('success', 'Articles imported from extension. Check your Saved Content page.')
    } catch {
      showToast('error', 'Failed to import articles from extension.')
    } finally {
      setImportingArticles(false)
    }
  }

  function handleExportForExtension() {
    try {
      window.postMessage({ source: 'ielts-page', action: 'EXPORT_VOCAB_FOR_EXTENSION' }, window.location.origin)
      showToast('success', 'Vocabulary exported. Open the extension and use Backup & Restore to import.')
    } catch {
      showToast('error', 'Failed to export vocabulary.')
    }
  }

  function handleRetry() {
    setPageError(null)
    setPageLoading(true)
    const cleanup = checkConnection()
    return cleanup
  }

  if (pageError) {
    return (
      <div>
        <ExtensionBackButton />
        <div style={{ marginTop: 'var(--spacing-lg)' }}>
          <ErrorState
            title="Unable to check extension status"
            message={pageError}
            onRetry={handleRetry}
            retryLabel="Try Again"
          />
        </div>
      </div>
    )
  }

  if (pageLoading) {
    return (
      <div>
        <ExtensionBackButton />
        <div style={{ marginTop: 'var(--spacing-lg)' }}>
          <ExtensionConnectionSkeleton />
        </div>
      </div>
    )
  }

  const isConnected = connectionStatus === 'connected'
  const isChecking = connectionStatus === 'checking'
  const isError = connectionStatus === 'error'

  return (
    <PageContent className="flex flex-col" style={{ gap: 'var(--spacing-lg)' }}>
      <ExtensionBackButton />

      {isError && (
        <div
          style={{
            padding: 'var(--spacing-sm) var(--spacing-md)',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--color-danger-light)',
            border: '1px solid var(--color-danger)',
            color: 'var(--color-danger)',
            fontSize: 'var(--text-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)',
          }}
          role="alert"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span style={{ flex: 1 }}>
            The communication channel to the extension encountered an error. This is usually temporary.
          </span>
          <Button variant="ghost" size="sm" onClick={handleRetry}>Refresh Connection</Button>
        </div>
      )}

      {isConnected ? <ConnectedStateContent /> : <NotConnectedStateContent />}

      {isConnected && (
        <>
          <SyncFlowSection />
          <DataImportSection />
        </>
      )}

      <FeatureCardsSection />
      <TroubleshootingSection />
    </PageContent>
  )

  function ExtensionBackButton() {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
        <button
          onClick={() => navigate('/settings')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
            flexShrink: 0,
          }}
          aria-label="Back to Settings"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <PageHeader
          icon={<IconExtension size={22} />}
          title="Extension Connection"
          description="Settings > Extension Connection"
        />
      </div>
    )
  }

  function ConnectedStateContent() {
    return (
      <>
        <Card>
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-xl)',
                    background: 'linear-gradient(135deg, var(--color-primary-light), var(--color-primary))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    flexShrink: 0,
                  }}
                  aria-hidden="true"
                >
                  <PuzzlePieceIcon />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-2xs)',
                        padding: '2px var(--spacing-xs)',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--color-success-light)',
                        color: 'var(--color-success-dark)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 'var(--weight-medium)',
                        fontFamily: 'var(--font-sans)',
                      }}
                      role="status"
                      aria-label="Connection status: connected"
                    >
                      <span style={{ width: '6px', height: '6px', borderRadius: 'var(--radius-full)', background: 'var(--color-success-dark)', flexShrink: 0 }} />
                      Connected
                    </span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)' }}>
                      {extensionInfo.browser} {extensionInfo.version ? `v${extensionInfo.version}` : ''}
                    </span>
                  </div>
                  <p style={{ margin: 'var(--spacing-2xs) 0 0', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)' }}>
                    Last synced: {formatRelativeTime(lastSyncTime)}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
                <Button
                  size="sm"
                  onClick={handleSyncNow}
                  loading={syncStatus === 'syncing'}
                  disabled={syncStatus === 'syncing'}
                  aria-label="Sync extension data now"
                >
                  {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}
                </Button>
                <Button variant="outline" size="sm" onClick={handleRetry} aria-label="Refresh connection status">
                  Refresh
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    localStorage.removeItem('extension-connected')
                    setConnectionStatus('disconnected')
                    showToast('info', 'Extension disconnected')
                  }}
                  aria-label="Disconnect extension"
                >
                  Disconnect
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {!isConnected && !isChecking && !isError && (
          <InstallSection />
        )}
      </>
    )
  }

  function NotConnectedStateContent() {
    return (
      <>
        <EmptyStateIllustrated
          variant="extension"
          title="Browser extension not detected"
          description="Install the IELTS Journey browser extension to save vocabulary, collect articles, and highlight words while you browse the web. The extension works with Chrome and Edge browsers."
          action={{ label: 'Install for Chrome', onClick: () => window.open(EXTENSION_URL, '_blank') }}
          secondaryAction={{ label: 'Install for Edge', onClick: () => window.open(EDGE_EXTENSION_URL, '_blank') }}
        />

        <div
          style={{
            textAlign: 'center',
            padding: 'var(--spacing-md)',
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-secondary)',
            fontFamily: 'var(--font-sans)',
          }}
        >
          Already installed?{' '}
          <button
            onClick={handleRetry}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-primary)',
              cursor: 'pointer',
              fontWeight: 'var(--weight-semibold)',
              fontSize: 'var(--text-sm)',
              fontFamily: 'var(--font-sans)',
              padding: 0,
              textDecoration: 'underline',
            }}
            aria-label="Refresh this page to detect extension"
          >
            Refresh this page
          </button>
        </div>

        <InstallSection />
      </>
    )
  }

  function InstallSection() {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Install the Extension</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 'var(--spacing-md)',
              marginBottom: 'var(--spacing-lg)',
            }}
          >
            <div
              style={{
                padding: 'var(--spacing-md)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-sm)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth={1.5}>
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v4m0 12v4" />
                </svg>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)', fontFamily: 'var(--font-sans)' }}>
                  Google Chrome
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)' }}>
                Available on Chrome Web Store
              </p>
              <Button size="sm" onClick={() => window.open(EXTENSION_URL, '_blank')} aria-label="Install IELTS Journey extension for Chrome browser">
                Install from Chrome Web Store
              </Button>
            </div>

            <div
              style={{
                padding: 'var(--spacing-md)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-sm)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth={1.5}>
                  <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10" />
                  <path d="M12 2c3.314 0 6 4.477 6 10s-2.686 10-6 10" />
                  <path d="M2 12h20" />
                  <path d="M12 2c-1.657 0-3 4.477-3 10s1.343 10 3 10" />
                </svg>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)', fontFamily: 'var(--font-sans)' }}>
                  Microsoft Edge
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)' }}>
                Available on Edge Add-ons
              </p>
              <Button size="sm" onClick={() => window.open(EDGE_EXTENSION_URL, '_blank')} aria-label="Install IELTS Journey extension for Edge browser">
                Install from Edge Add-ons
              </Button>
            </div>
          </div>

          <div
            style={{
              borderRadius: 'var(--radius-lg)',
              background: 'var(--color-surface-alt)',
              padding: 'var(--spacing-md)',
            }}
          >
            <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)', fontFamily: 'var(--font-sans)', margin: '0 0 var(--spacing-sm)' }}>
              Step-by-step guide
            </p>
            <ol style={{ margin: 0, paddingLeft: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
              {[
                'Click the "Install" button above for your browser',
                'Click "Add to Chrome" / "Add to Edge" in the store popup',
                'The extension icon (puzzle piece) appears in your browser toolbar',
                'Click the extension icon to open IELTS Journey popup',
                'Log in with your IELTS Journey account (same as website)',
              ].map((step, i) => (
                <li key={i} style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)', lineHeight: '1.6' }}>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </CardContent>
      </Card>
    )
  }

  function FeatureCardsSection() {
    return (
      <Card>
        <CardHeader>
          <CardTitle>How the Extension Helps</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 'var(--spacing-md)',
            }}
          >
            {FEATURES.map((feature) => {
              const isExpanded = expandedFeature === feature.id
              return (
                <div
                  key={feature.id}
                  role="region"
                  aria-labelledby={`feature-title-${feature.id}`}
                  style={{
                    borderRadius: 'var(--radius-xl)',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-surface)',
                    overflow: 'hidden',
                    transition: 'box-shadow var(--transition-fast)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none' }}
                  onClick={() => setExpandedFeature(isExpanded ? null : feature.id)}
                >
                  <div
                    style={{
                      padding: 'var(--spacing-md)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 'var(--spacing-sm)',
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border-light)',
                      borderRadius: 'var(--radius-xl)',
                    }}
                  >
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: 'var(--radius-lg)',
                        background: 'var(--color-surface)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--color-primary)',
                        flexShrink: 0,
                      }}
                      aria-hidden="true"
                    >
                      {feature.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        id={`feature-title-${feature.id}`}
                        style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)', fontFamily: 'var(--font-sans)' }}
                      >
                        {feature.title}
                      </p>
                      {isExpanded && (
                        <p style={{ margin: 'var(--spacing-xs) 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)', lineHeight: '1.6' }}>
                          {feature.description}
                        </p>
                      )}
                      {!isExpanded && (
                        <p style={{ margin: 'var(--spacing-2xs) 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-primary)', fontFamily: 'var(--font-sans)', fontWeight: 'var(--weight-medium)' }}>
                          Learn more &rarr;
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    )
  }

  function SyncFlowSection() {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sync & Data Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-md)',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--spacing-sm)',
                padding: 'var(--spacing-md)',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--color-surface-alt)',
              }}
              aria-label="Data flow diagram: Browser connects to extension which syncs with website"
            >
              <SyncFlowStep icon="globe" label="Web Browser" />
              <SyncFlowArrow />
              <SyncFlowStep icon="puzzle" label="Extension" />
              <SyncFlowArrow />
              <SyncFlowStep icon="database" label="Extension Storage" />
              <div style={{ width: '100%', height: '1px', background: 'var(--color-border)', flexBasis: '100%' }} aria-hidden="true" />
              <div style={{ paddingLeft: 'var(--spacing-lg)', fontSize: 'var(--text-xs)', color: 'var(--color-muted)', fontFamily: 'var(--font-sans)', width: '100%' }}>
                postMessage bridge
              </div>
              <div style={{ flexBasis: '100%' }} />
              <SyncFlowStep icon="device" label="Website App" />
              <SyncFlowArrow />
              <SyncFlowStep icon="database" label="Website Storage" />
              <SyncFlowArrow />
              <SyncFlowStep icon="book" label="Vocabulary Notebook & Saved Articles" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-sm)' }}>
              <div
                style={{
                  padding: 'var(--spacing-sm)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--color-success-light)',
                }}
              >
                <p style={{ margin: 0, fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-primary-dark)', fontFamily: 'var(--font-sans)' }}>
                  Bidirectional sync (click "Sync Now")
                </p>
                <ul style={{ margin: 'var(--spacing-2xs) 0 0', paddingLeft: 'var(--spacing-md)', fontSize: 'var(--text-xs)', color: 'var(--color-primary-dark)', fontFamily: 'var(--font-sans)' }}>
                  <li>Vocabulary (bi-directional, deduplicated)</li>
                  <li>Mistakes (from extension)</li>
                  <li>Saved articles (from extension)</li>
                  <li>AI settings (web → extension)</li>
                </ul>
              </div>
              <div
                style={{
                  padding: 'var(--spacing-sm)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--color-warning-light)',
                }}
              >
                <p style={{ margin: 0, fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-warning-dark)', fontFamily: 'var(--font-sans)' }}>
                  Manual import required
                </p>
                <ul style={{ margin: 'var(--spacing-2xs) 0 0', paddingLeft: 'var(--spacing-md)', fontSize: 'var(--text-xs)', color: 'var(--color-warning-dark)', fontFamily: 'var(--font-sans)' }}>
                  <li>Saved articles</li>
                  <li>Saved text passages</li>
                </ul>
              </div>
            </div>

            <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)', lineHeight: '1.6' }}>
              The extension and website store data in separate databases. Use the "Sync Now" button to sync your vocabulary from the website to the extension. Other content (articles, text) can be imported manually using the buttons below. All your data stays on your device — it is never sent to external servers except when using AI features.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  function DataImportSection() {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Data Import from Extension</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-md)',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 'var(--spacing-sm)',
              }}
            >
              <Button
                size="sm"
                onClick={handleImportVocab}
                loading={importingVocab}
                disabled={importingVocab}
                aria-label="Import vocabulary from browser extension"
              >
                {importingVocab ? 'Importing...' : 'Import Vocabulary from Extension'}
              </Button>
              <Button
                size="sm"
                onClick={handleImportArticles}
                loading={importingArticles}
                disabled={importingArticles}
                variant="secondary"
                aria-label="Import articles from browser extension"
              >
                {importingArticles ? 'Importing...' : 'Import Articles from Extension'}
              </Button>
              <Button
                size="sm"
                onClick={handleExportForExtension}
                variant="outline"
                aria-label="Export vocabulary for extension"
              >
                Export for Extension
              </Button>
            </div>

            {vocabCount > 0 && (
              <div
                style={{
                  display: 'flex',
                  gap: 'var(--spacing-md)',
                  flexWrap: 'wrap',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-text-secondary)',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                <span>{vocabCount} words in your notebook</span>
                {lastSyncTime && (
                  <span>Last synced: {formatRelativeTime(lastSyncTime)}</span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  function TroubleshootingSection() {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Troubleshooting</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
            {TROUBLESHOOTING_ITEMS.map((item) => {
              const isExpanded = expandedTroubleshooting === item.id
              return (
                <div
                  key={item.id}
                  style={{
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)',
                    overflow: 'hidden',
                    transition: 'background var(--transition-fast)',
                    background: isExpanded ? 'var(--color-surface-alt)' : 'var(--color-surface)',
                  }}
                >
                  <button
                    onClick={() => setExpandedTroubleshooting(isExpanded ? null : item.id)}
                    aria-expanded={isExpanded}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-sm)',
                      width: '100%',
                      padding: 'var(--spacing-sm) var(--spacing-md)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--color-text)',
                      fontSize: 'var(--text-sm)',
                      fontWeight: 'var(--weight-medium)',
                      fontFamily: 'var(--font-sans)',
                      textAlign: 'left',
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      style={{
                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform var(--transition-fast)',
                        flexShrink: 0,
                        color: 'var(--color-muted)',
                      }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    {item.question}
                  </button>
                  {isExpanded && (
                    <div
                      role="region"
                      aria-labelledby={`troubleshooting-title-${item.id}`}
                      style={{
                        padding: '0 var(--spacing-md) var(--spacing-sm) calc(var(--spacing-md) + 20px)',
                        fontSize: 'var(--text-xs)',
                        color: 'var(--color-text-secondary)',
                        fontFamily: 'var(--font-sans)',
                        lineHeight: '1.6',
                      }}
                    >
                      {item.answer}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div style={{ marginTop: 'var(--spacing-md)', textAlign: 'center' }}>
            <Button variant="ghost" size="sm" onClick={() => navigate('/feedback')} aria-label="Contact support">
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  function SyncFlowStep({ icon, label }: { icon: string; label: string }) {
    const iconMap: Record<string, React.ReactNode> = {
      globe: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
        </svg>
      ),
      puzzle: <PuzzlePieceIcon />,
      database: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
      ),
      device: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <path d="M8 21h8" />
          <path d="M12 17v4" />
        </svg>
      ),
      book: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    }

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--spacing-2xs)',
          padding: 'var(--spacing-sm)',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          minWidth: '80px',
        }}
      >
        <div style={{ color: 'var(--color-primary)' }}>
          {iconMap[icon] || iconMap.globe}
        </div>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)', textAlign: 'center' }}>
          {label}
        </span>
      </div>
    )
  }

  function SyncFlowArrow() {
    return (
      <div style={{ color: 'var(--color-muted)', display: 'flex', alignItems: 'center' }} aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </div>
    )
  }
}
