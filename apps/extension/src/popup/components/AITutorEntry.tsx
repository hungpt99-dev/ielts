import { useState, useEffect } from 'react'
import { IconAITutor, IconBack, IconAlertCircle, IconLoading } from '@ielts/ui'
import MiniTutor from './MiniTutor'
import { emitExtensionAITutorOpened } from '../../background/eventEmitters'

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
    emitExtensionAITutorOpened()
  }, [])

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
              <IconBack size={14} /> <span>Back</span>
            </button>
            <div style={headerTitleStyle}>
              <IconAITutor size={16} style={{ color: 'var(--color-tutor-accent)' }} />
              <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>AI Tutor</span>
            </div>
          </div>
          <div style={centerStyle}>
            <IconLoading size={24} style={{ animation: 'aitutor-spin 0.7s linear infinite' }} />
            <p style={{ color: 'var(--color-muted)', fontSize: 'var(--text-sm)' }}>Getting page context...</p>
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
              <IconBack size={14} /> <span>Back</span>
            </button>
            <div style={headerTitleStyle}>
              <IconAITutor size={16} style={{ color: 'var(--color-tutor-accent)' }} />
              <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>AI Tutor</span>
            </div>
          </div>
          <div style={centerStyle}>
            <div
              style={{
                width: 'var(--spacing-2xl)',
                height: 'var(--spacing-2xl)',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-danger-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 'var(--spacing-2xs)',
              }}
            >
              <IconAlertCircle size={28} style={{ color: 'var(--color-danger)' }} />
            </div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-danger)', textAlign: 'center', lineHeight: '1.5', fontWeight: 'var(--weight-medium)' }}>
              Could not access page context
            </p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', textAlign: 'center', maxWidth: '400px' }}>
              {fetchError}
            </p>
            <div style={{ display: 'flex', gap: 'var(--spacing-xs)', marginTop: 'var(--spacing-xs)' }}>
              <button onClick={onBack} style={secondaryBtnStyle}>
                Back
              </button>
              <button
                onClick={() => {
                  setFetchError(null)
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
  padding: 'var(--spacing-md)',
  minHeight: '500px',
  gap: 'var(--spacing-sm)',
  width: 'var(--ext-width)',
  boxSizing: 'border-box',
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--spacing-xs)',
}

const backBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 'var(--spacing-2xs)',
  background: 'none',
  border: 'none',
  color: 'var(--color-primary)',
  cursor: 'pointer',
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--weight-medium)',
  padding: 'var(--spacing-2xs) var(--spacing-xs)',
  borderRadius: 'var(--radius-lg)',
  fontFamily: 'var(--font-sans)',
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
  padding: '40px var(--spacing-md)',
  gap: 'var(--spacing-sm)',
  flex: 1,
}

const primaryBtnStyle: React.CSSProperties = {
  padding: 'var(--spacing-xs) var(--spacing-md)',
  borderRadius: 'var(--radius-lg)',
  border: 'none',
  background: 'var(--color-primary)',
  color: 'var(--color-text-inverse)',
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--weight-medium)',
  cursor: 'pointer',
}

const secondaryBtnStyle: React.CSSProperties = {
  padding: 'var(--spacing-xs) var(--spacing-md)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--color-border)',
  background: 'var(--color-surface)',
  color: 'var(--color-text)',
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--weight-medium)',
  cursor: 'pointer',
}
