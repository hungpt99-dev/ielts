import { useState } from 'react'
import { ToastProvider } from '../../../../packages/ui/src/components/Toast'
import PopupDashboard from './components/PopupDashboard'
import SaveTextForm from './components/SaveTextForm'
import VocabularyCollector from './components/VocabularyCollector'
import ArticleCollector from './components/ArticleCollector'
import VideoHelper from './components/VideoHelper'
import BackupRestore from './components/BackupRestore'
import MiniTutor from './components/MiniTutor'

type ViewState = 'dashboard' | 'saveForm' | 'vocabularyCollector' | 'articleCollector' | 'videoHelper' | 'backupRestore' | 'miniTutor'

function App() {
  const [view, setView] = useState<ViewState>('dashboard')
  const [key, setKey] = useState(0)

  const handleSaved = () => {
    setView('dashboard')
    setKey((k) => k + 1)
  }

  if (view === 'saveForm') {
    return (
      <ToastProvider>
        <div style={{ padding: '16px', minHeight: '500px' }}>
          <SaveTextForm onSaved={handleSaved} onCancel={() => setView('dashboard')} />
        </div>
      </ToastProvider>
    )
  }

  if (view === 'vocabularyCollector') {
    return (
      <ToastProvider>
        <div style={{ padding: '16px', minHeight: '500px' }}>
          <VocabularyCollector onSaved={handleSaved} onCancel={() => setView('dashboard')} />
        </div>
      </ToastProvider>
    )
  }

  if (view === 'articleCollector') {
    return (
      <ToastProvider>
        <div style={{ padding: '16px', minHeight: '500px' }}>
          <ArticleCollector onSaved={handleSaved} onCancel={() => setView('dashboard')} />
        </div>
      </ToastProvider>
    )
  }

  if (view === 'videoHelper') {
    return (
      <ToastProvider>
        <div style={{ padding: '16px', minHeight: '500px' }}>
          <VideoHelper onSaved={handleSaved} onCancel={() => setView('dashboard')} />
        </div>
      </ToastProvider>
    )
  }

  if (view === 'backupRestore') {
    return (
      <ToastProvider>
        <div style={{ padding: '16px', minHeight: '500px' }}>
          <BackupRestore onBack={() => setView('dashboard')} />
        </div>
      </ToastProvider>
    )
  }

  if (view === 'miniTutor') {
    return (
      <ToastProvider>
        <MiniTutor onBack={() => setView('dashboard')} />
      </ToastProvider>
    )
  }

  return (
    <ToastProvider>
      <PopupDashboard key={key} onNavigate={setView} />
    </ToastProvider>
  )
}

export default App
