import { useState, useRef, useEffect } from 'react'
import { ToastProvider } from '../../../../packages/ui/src/components/Toast'
import ErrorBoundary from './components/ErrorBoundary'
import PopupDashboard from './components/PopupDashboard'
import SaveTextForm from './components/SaveTextForm'
import VocabularyCollector from './components/VocabularyCollector'
import ArticleCollector from './components/ArticleCollector'
import VideoHelper from './components/VideoHelper'
import BackupRestore from './components/BackupRestore'
import ImportExportSection from './components/ImportExportSection'
import AITutorEntry from './components/AITutorEntry'
import SavedWordsView from './components/SavedWordsView'
import SavedItemsView from './components/SavedItemsView'
import PendingReviews from './components/PendingReviews'
import ReviewSession from './components/ReviewSession'
import { emitExtensionPopupOpened } from '../background/eventEmitters'
import ManualSyncPanel from './components/ManualSyncPanel'
import SyncStatusPanel from './components/SyncStatusPanel'

type ViewState = 'dashboard' | 'saveForm' | 'vocabularyCollector' | 'articleCollector' | 'videoHelper' | 'backupRestore' | 'importExport' | 'miniTutor' | 'savedWords' | 'savedItems' | 'pendingReviews' | 'reviewSession' | 'manualSync' | 'syncStatus'

type NavFn = (view: ViewState) => void

function App() {
  const [view, setView] = useState<ViewState>('dashboard')
  const [key, setKey] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [view])

  useEffect(() => {
    emitExtensionPopupOpened()
    chrome.runtime.sendMessage({ type: 'POPUP_OPENED' }).catch(() => {})
  }, [])

  // Sync theme from settings to DOM
  useEffect(() => {
    new Promise<string>((resolve) => {
      chrome.storage.local.get('extensionSettings', (result) => {
        const raw = (result.extensionSettings as { themeMode?: string } | undefined)
          ?.themeMode
        resolve(raw || 'system')
      })
    }).then((mode) => {
      const isDark =
        mode === 'dark' ||
        (mode === 'system' &&
          window.matchMedia('(prefers-color-scheme: dark)').matches)
      document.documentElement.classList.toggle('dark', isDark)
    })

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onSysChange = () => {
      if (mq.matches) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
    mq.addEventListener('change', onSysChange)

    const onStorageChange = (
      changes: Record<string, chrome.storage.StorageChange>,
    ) => {
      const themeMode = (
        changes.extensionSettings?.newValue as
          | { themeMode?: string }
          | undefined
      )?.themeMode
      if (themeMode) {
        const isDark =
          themeMode === 'dark' ||
          (themeMode === 'system' &&
            window.matchMedia('(prefers-color-scheme: dark)').matches)
        document.documentElement.classList.toggle('dark', isDark)
      }
    }
    chrome.storage.onChanged.addListener(onStorageChange)

    return () => {
      mq.removeEventListener('change', onSysChange)
      chrome.storage.onChanged.removeListener(onStorageChange)
    }
  }, [])

  const handleSaved = () => {
    setView('dashboard')
    setKey((k) => k + 1)
  }

  const renderView = () => {
    const sharedCardStyle = { minHeight: 'var(--ext-min-height)' }

    switch (view) {
      case 'saveForm':
        return (
          <div style={sharedCardStyle}>
            <SaveTextForm onSaved={handleSaved} onCancel={() => setView('dashboard')} />
          </div>
        )
      case 'vocabularyCollector':
        return (
          <div style={sharedCardStyle}>
            <VocabularyCollector onSaved={handleSaved} onCancel={() => setView('dashboard')} />
          </div>
        )
      case 'articleCollector':
        return (
          <div style={sharedCardStyle}>
            <ArticleCollector onSaved={handleSaved} onCancel={() => setView('dashboard')} />
          </div>
        )
      case 'videoHelper':
        return (
          <div style={sharedCardStyle}>
            <VideoHelper onSaved={handleSaved} onCancel={() => setView('dashboard')} />
          </div>
        )
      case 'backupRestore':
        return (
          <div style={sharedCardStyle}>
            <BackupRestore onBack={() => setView('dashboard')} />
          </div>
        )
      case 'importExport':
        return (
          <div style={sharedCardStyle}>
            <ImportExportSection onBack={() => setView('dashboard')} />
          </div>
        )
      case 'miniTutor':
        return <AITutorEntry onBack={() => setView('dashboard')} />
      case 'savedWords':
        return <SavedWordsView onBack={() => setView('dashboard')} />
      case 'savedItems':
        return <SavedItemsView onBack={() => setView('dashboard')} />
      case 'pendingReviews':
        return (
          <div style={sharedCardStyle}>
            <PendingReviews
              onStartReview={() => setView('reviewSession')}
              onBack={() => setView('dashboard')}
            />
          </div>
        )
      case 'reviewSession':
        return (
          <ReviewSession
            onComplete={() => setView('dashboard')}
            onBack={() => setView('pendingReviews')}
          />
        )
      case 'manualSync':
        return <ManualSyncPanel onBack={() => setView('dashboard')} />
      case 'syncStatus':
        return <SyncStatusPanel onBack={() => setView('dashboard')} />
      default:
        return <PopupDashboard key={key} onNavigate={setView as NavFn} />
    }
  }

  return (
    <ErrorBoundary>
      <ToastProvider>
        <div
          ref={scrollRef}
          style={{
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            maxHeight: '100dvh',
            height: '100%',
            width: 'var(--ext-width)',
          }}
        >
          {renderView()}
        </div>
      </ToastProvider>
    </ErrorBoundary>
  )
}

export default App
