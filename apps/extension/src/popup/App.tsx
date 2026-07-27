import { useState, useRef, useEffect } from 'react'
import { ToastProvider } from '../../../../packages/ui/src/components/Toast'
import ErrorBoundary from './components/ErrorBoundary'
import PopupDashboard from './components/PopupDashboard'
import { emitExtensionPopupOpened } from '../background/eventEmitters'
import { openMainApp } from '../extension-adapters/tabManager'

type PopupView = 'dashboard'

function App() {
  const [key, setKey] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    emitExtensionPopupOpened()
    chrome.runtime.sendMessage({ type: 'POPUP_OPENED' }).catch(() => {})
  }, [])

  useEffect(() => {
    new Promise<string>((resolve) => {
      chrome.storage.local.get('extensionSettings', (result) => {
        const raw = (result.extensionSettings as { themeMode?: string } | undefined)?.themeMode
        resolve(raw || 'system')
      })
    }).then((mode) => {
      const isDark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      document.documentElement.classList.toggle('dark', isDark)
    })

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onSysChange = () => {
      if (mq.matches) document.documentElement.classList.add('dark')
      else document.documentElement.classList.remove('dark')
    }
    mq.addEventListener('change', onSysChange)

    const onStorageChange = (changes: Record<string, chrome.storage.StorageChange>) => {
      const themeMode = (changes.extensionSettings?.newValue as { themeMode?: string } | undefined)?.themeMode
      if (themeMode) {
        const isDark = themeMode === 'dark' || (themeMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
        document.documentElement.classList.toggle('dark', isDark)
      }
    }
    chrome.storage.onChanged.addListener(onStorageChange)

    return () => {
      mq.removeEventListener('change', onSysChange)
      chrome.storage.onChanged.removeListener(onStorageChange)
    }
  }, [])

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
          <PopupDashboard key={key} />
        </div>
      </ToastProvider>
    </ErrorBoundary>
  )
}

export default App
