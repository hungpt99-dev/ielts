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
import PendingReviews from './components/PendingReviews'
import ReviewSession from './components/ReviewSession'
import { emitExtensionPopupOpened } from '../background/eventEmitters'

type ViewState = 'dashboard' | 'saveForm' | 'vocabularyCollector' | 'articleCollector' | 'videoHelper' | 'backupRestore' | 'importExport' | 'miniTutor' | 'savedWords' | 'pendingReviews' | 'reviewSession'

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
