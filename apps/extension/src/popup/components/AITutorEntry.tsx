import { useState, useEffect } from 'react'
import MiniTutor from './MiniTutor'

interface AITutorEntryProps {
  onBack: () => void
}

interface PageContext {
  selectedText: string
  title: string
  url: string
}

export default function AITutorEntry({ onBack }: AITutorEntryProps) {
  const [loading, setLoading] = useState(true)
  const [context, setContext] = useState<PageContext | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    let retryTimer: ReturnType<typeof setTimeout> | null = null

    async function fetchContext() {
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
        if (cancelled) return
        const tab = tabs[0]
        if (!tab?.id) {
          setLoading(false)
          return
        }

        try {
          const response = await chrome.tabs.sendMessage(tab.id, { type: 'MINI_TUTOR_GET_SELECTION_FULL' })
          if (cancelled) return
          if (response?.text?.trim()) {
            setContext({
              selectedText: response.text,
              title: response.pageTitle || tab.title || '',
              url: response.pageUrl || tab.url || '',
            })
            setLoading(false)
            return
          }
        } catch {
          // Content script not available — fall through
        }

        try {
          const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_INFO' })
          if (cancelled) return
          setContext({
            selectedText: response?.selectedText || '',
            title: response?.title || tab.title || '',
            url: response?.url || tab.url || '',
          })
        } catch {
          if (!cancelled) {
            setContext({
              selectedText: '',
              title: tab.title || '',
              url: tab.url || '',
            })
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          setFetchError(err.message || 'Could not access page context')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchContext()

    return () => {
      cancelled = true
      if (retryTimer) clearTimeout(retryTimer)
    }
  }, [])

  if (!ready) {
    if (loading) {
      return (
        <div style={containerStyle}>
          <div style={headerStyle}>
            <button onClick={onBack} style={backBtnStyle} aria-label="Go back to dashboard">
              ← Back
            </button>
            <div style={headerTitleStyle}>
              <span style={{ fontSize: '16px' }}>🎓</span>
              <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text)' }}>AI Tutor</span>
            </div>
          </div>
          <div style={centerStyle}>
            <div
              style={{
                width: '24px',
                height: '24px',
                border: '3px solid var(--color-border)',
                borderTopColor: 'var(--color-primary)',
                borderRadius: '50%',
                animation: 'aitutor-spin 0.7s linear infinite',
              }}
            />
            <p style={{ color: 'var(--color-muted)', fontSize: '13px' }}>Getting page context...</p>
          </div>
          <style>{`
            @keyframes aitutor-spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )
    }

    if (fetchError) {
      return (
        <div style={containerStyle}>
          <div style={headerStyle}>
            <button onClick={onBack} style={backBtnStyle} aria-label="Go back to dashboard">
              ← Back
            </button>
            <div style={headerTitleStyle}>
              <span style={{ fontSize: '16px' }}>🎓</span>
              <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text)' }}>AI Tutor</span>
            </div>
          </div>
          <div style={centerStyle}>
            <div style={{ fontSize: '32px', marginBottom: '4px' }}>⚠️</div>
            <p style={{ fontSize: '13px', color: 'var(--color-danger)', textAlign: 'center', lineHeight: '1.5' }}>
              Could not access page context
            </p>
            <p style={{ fontSize: '12px', color: 'var(--color-muted)', textAlign: 'center', maxWidth: '280px' }}>
              {fetchError}
            </p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button onClick={onBack} style={secondaryBtnStyle}>
                Back
              </button>
              <button
                onClick={() => {
                  setLoading(true)
                  setFetchError(null)
                  setLoading(false)
                  setReady(true)
                }}
                style={primaryBtnStyle}
              >
                Continue Anyway
              </button>
            </div>
          </div>
        </div>
      )
    }
  }

  return (
    <MiniTutor
      onBack={onBack}
      initialText={context?.selectedText || undefined}
      initialPageInfo={
        context?.title
          ? { title: context.title, url: context.url }
          : undefined
      }
    />
  )
}

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  padding: '16px',
  minHeight: '500px',
  gap: '12px',
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
}

const backBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--color-primary)',
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: 500,
  padding: '4px 8px',
  borderRadius: '6px',
}

const headerTitleStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
}

const centerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '40px 16px',
  gap: '12px',
  flex: 1,
}

const primaryBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: '8px',
  border: 'none',
  background: 'var(--color-primary)',
  color: '#fff',
  fontSize: '12px',
  fontWeight: 500,
  cursor: 'pointer',
}

const secondaryBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: '8px',
  border: '1px solid var(--color-border)',
  background: 'var(--color-surface)',
  color: 'var(--color-text)',
  fontSize: '12px',
  fontWeight: 500,
  cursor: 'pointer',
}
