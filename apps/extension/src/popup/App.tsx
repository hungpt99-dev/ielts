import { useState } from 'react'
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

type ViewState = 'dashboard' | 'saveForm' | 'vocabularyCollector' | 'articleCollector' | 'videoHelper' | 'backupRestore' | 'importExport' | 'miniTutor' | 'savedWords' | 'pendingReviews' | 'reviewSession'

function App() {
  const [view, setView] = useState<ViewState>('dashboard')
  const [key, setKey] = useState(0)

  const handleSaved = () => {
    setView('dashboard')
    setKey((k) => k + 1)
  }

  const renderView = () => {
    switch (view) {
      case 'saveForm':
        return (
          <div style={{ padding: '16px', minHeight: '500px' }}>
            <SaveTextForm onSaved={handleSaved} onCancel={() => setView('dashboard')} />
          </div>
        )
      case 'vocabularyCollector':
        return (
          <div style={{ padding: '16px', minHeight: '500px' }}>
            <VocabularyCollector onSaved={handleSaved} onCancel={() => setView('dashboard')} />
          </div>
        )
      case 'articleCollector':
        return (
          <div style={{ padding: '16px', minHeight: '500px' }}>
            <ArticleCollector onSaved={handleSaved} onCancel={() => setView('dashboard')} />
          </div>
        )
      case 'videoHelper':
        return (
          <div style={{ padding: '16px', minHeight: '500px' }}>
            <VideoHelper onSaved={handleSaved} onCancel={() => setView('dashboard')} />
          </div>
        )
      case 'backupRestore':
        return (
          <div style={{ padding: '16px', minHeight: '500px' }}>
            <BackupRestore onBack={() => setView('dashboard')} />
          </div>
        )
      case 'importExport':
        return (
          <div style={{ padding: '16px', minHeight: '500px' }}>
            <ImportExportSection onBack={() => setView('dashboard')} />
          </div>
        )
      case 'miniTutor':
        return <AITutorEntry onBack={() => setView('dashboard')} />
      case 'savedWords':
        return <SavedWordsView onBack={() => setView('dashboard')} />
      case 'pendingReviews':
        return (
          <div style={{ padding: '16px', minHeight: '500px' }}>
            <PendingReviews
              onStartReview={() => setView('reviewSession')}
              onBack={() => setView('dashboard')}
            />
          </div>
        )
      case 'reviewSession':
        return (
          <div style={{ padding: '0', minHeight: '500px' }}>
            <ReviewSession
              onComplete={() => setView('dashboard')}
              onBack={() => setView('pendingReviews')}
            />
          </div>
        )
      default:
        return <PopupDashboard key={key} onNavigate={setView} />
    }
  }

  return (
    <ErrorBoundary>
      <ToastProvider>
        {renderView()}
      </ToastProvider>
    </ErrorBoundary>
  )
}

export default App
