import { useCallback, useMemo, useState, useEffect } from 'react'
import { Card } from '../../../../../packages/ui/src/components/Card'
import { Button } from '../../../../../packages/ui/src/components/Button'
import { LoadingSkeleton } from '../../../../../packages/ui/src/components/LoadingSkeleton'
import { EmptyState } from '../../../../../packages/ui/src/components/EmptyState'
import {
  IconVocabulary, IconArticle, IconRefresh, IconAITutor,
  IconSave, IconEdit, IconStreak, IconSun, IconMoon, IconWarning,
  IconSettings, IconHome, IconGlobe, IconSearch
} from '@ielts/ui'
import { openMainApp } from '../../extension-adapters/tabManager'

interface DashboardData {
  vocabularyCount: number
  dueReviewCount: number
  currentStreak: number
  wordsAdded: number
  articlesSaved: number
  notesSaved: number
}

type DashboardState =
  | { status: 'loading' }
  | { status: 'success'; data: DashboardData }
  | { status: 'empty'; data: DashboardData }
  | { status: 'error'; message: string }

const EMPTY_DATA: DashboardData = {
  vocabularyCount: 0, dueReviewCount: 0, currentStreak: 0,
  wordsAdded: 0, articlesSaved: 0, notesSaved: 0,
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 'var(--spacing-2xs)', padding: 'var(--spacing-sm) var(--spacing-xs)',
      background: 'var(--color-surface)', border: '1px solid var(--color-border-light)',
      borderRadius: 'var(--radius-xl)', minWidth: 0, boxShadow: 'var(--shadow-sm)',
    }}>
      <span style={{ fontSize: 'var(--text-lg)', lineHeight: 1, color: 'var(--color-primary)' }}>{icon}</span>
      <span style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)', lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)', textAlign: 'center', whiteSpace: 'nowrap' }}>{label}</span>
    </div>
  )
}

function QuickAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} aria-label={label} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 'var(--spacing-2xs)', padding: 'var(--spacing-sm) var(--spacing-xs)',
      minHeight: 'var(--spacing-2xl)', background: 'var(--color-surface)',
      border: '1px solid var(--color-border-light)', borderRadius: 'var(--radius-xl)',
      cursor: 'pointer', color: 'var(--color-text)', fontFamily: 'var(--font-sans)',
      minWidth: 0, outline: 'none', WebkitTapHighlightColor: 'transparent',
      touchAction: 'manipulation', boxShadow: 'var(--shadow-sm)',
    }}>
      <span style={{ fontSize: 'var(--text-xl)', lineHeight: 1, width: 'var(--spacing-xl)', height: 'var(--spacing-xl)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>{icon}</span>
      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)', textAlign: 'center', lineHeight: 1.2 }}>{label}</span>
    </button>
  )
}

export default function PopupDashboard() {
  const [state, setState] = useState<DashboardState>({ status: 'loading' })
  const [darkMode, setDarkMode] = useState(false)
  const [isYouTubePage, setIsYouTubePage] = useState(false)
  const [autoOpenEnabled, setAutoOpenEnabled] = useState(false)
  const [selectedText, setSelectedText] = useState('')

  const refreshDashboard = useCallback(async () => {
    setState({ status: 'loading' })
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_POPUP_DASHBOARD' })
      if (response?.success && response?.data) {
        const data = response.data as DashboardData
        const isEmpty = data.vocabularyCount === 0 && data.wordsAdded === 0 && data.articlesSaved === 0 && data.notesSaved === 0
        setState(isEmpty ? { status: 'empty', data } : { status: 'success', data })
      } else {
        setState({ status: 'error', message: 'Failed to load dashboard data' })
      }
    } catch {
      setState({ status: 'error', message: 'Background service unavailable. Try reopening the extension.' })
    }
  }, [])

  useEffect(() => {
    refreshDashboard()
  }, [refreshDashboard])

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      const url = tab?.url || ''
      setIsYouTubePage(url.includes('youtube.com/watch') || url.includes('youtu.be/'))
    }).catch(() => {})
    chrome.storage.local.get('yt-learning-auto-open', (result) => {
      setAutoOpenEnabled(result['yt-learning-auto-open'] === true)
    })
  }, [])

  useEffect(() => {
    let cancelled = false
    chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      if (cancelled || !tab?.id) return
      chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_INFO' }).then((res) => {
        if (cancelled && res?.selectedText?.trim()) setSelectedText(res.selectedText.trim())
      }).catch(() => {})
    })
    return () => { cancelled = true }
  }, [])

  const handleOpenMainApp = useCallback((route?: string) => {
    chrome.runtime.sendMessage({ type: 'OPEN_MAIN_APP', route }).catch(() => {
      openMainApp(route).catch(() => {
        const url = route ? `app/index.html#${route}` : 'app/index.html#/dashboard'
        chrome.tabs.create({ url: chrome.runtime.getURL(url) })
      })
    })
  }, [])

  const handleOpenSettings = useCallback(() => {
    chrome.tabs.create({ url: chrome.runtime.getURL('options.html') })
  }, [])

  const handleBackup = useCallback(() => {
    handleOpenMainApp('/import-export')
  }, [handleOpenMainApp])

  const actions = useMemo(() => [
    { icon: <IconVocabulary />, label: 'Save Word', onClick: () => handleOpenMainApp('/vocabulary') },
    { icon: <IconArticle />, label: 'Articles', onClick: () => handleOpenMainApp('/artifacts') },
    { icon: <IconRefresh />, label: 'Review', onClick: () => handleOpenMainApp('/review') },
    { icon: <IconAITutor />, label: 'AI Tutor', onClick: () => handleOpenMainApp('/ai-tutor') },
    { icon: <IconEdit />, label: 'Notes', onClick: () => handleOpenMainApp('/artifacts') },
    { icon: <IconSettings />, label: 'Settings', onClick: handleOpenSettings },
  ], [handleOpenMainApp, handleOpenSettings])

  const dashboardData = state.status === 'success' || state.status === 'empty' ? state.data : EMPTY_DATA

  const renderContent = () => {
    if (state.status === 'loading') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', padding: 'var(--spacing-md)' }}>
          <LoadingSkeleton variant="text" width="140px" />
          <LoadingSkeleton variant="text" width="60px" />
          <LoadingSkeleton variant="card" count={2} gap="var(--spacing-sm)" />
          <LoadingSkeleton variant="rect" count={3} gap="var(--spacing-xs)" />
        </div>
      )
    }

    if (state.status === 'error') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'var(--ext-min-height)', padding: 'var(--spacing-md)' }}>
          <EmptyState
            icon={<IconWarning />}
            title="Could not load data"
            description={state.message}
            action={<Button variant="secondary" size="sm" onClick={refreshDashboard}>Retry</Button>}
          />
        </div>
      )
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', padding: 'var(--spacing-md)', minHeight: 'var(--ext-min-height)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 'var(--spacing-2xs)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            <img src="icons/icon-48.png" alt="" style={{ width: 'var(--spacing-2xl)', height: 'var(--spacing-2xl)', borderRadius: 'var(--radius-xl)', flexShrink: 0, boxShadow: '0 2px 8px color-mix(in srgb, var(--color-primary) 30%, transparent)' }} />
            <div>
              <h1 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)', margin: 0, lineHeight: 1.2, letterSpacing: '-0.01em' }}>IELTS Journey</h1>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-normal)' }}>Welcome!</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 'var(--spacing-3xs)', padding: 'var(--spacing-3xs) var(--spacing-xs)',
              borderRadius: 'var(--radius-full)', background: dashboardData.currentStreak > 0 ? 'var(--color-warning-light)' : 'var(--color-surface-alt)',
              color: dashboardData.currentStreak > 0 ? 'var(--color-warning-dark)' : 'var(--color-muted)',
              fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', lineHeight: 1.2,
            }}>
              <IconStreak size={12} />
              <span>{dashboardData.currentStreak}d</span>
            </div>
            <button onClick={() => setDarkMode(p => !p)} aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'} style={{
              width: 'var(--spacing-xl)', height: 'var(--spacing-xl)', borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-muted)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 'var(--text-base)', padding: 0, lineHeight: 1,
              WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation',
            }}>
              {darkMode ? <IconSun size={16} /> : <IconMoon size={16} />}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 'var(--spacing-xs)' }}>
          <StatCard label="Words" value={dashboardData.vocabularyCount} icon={<IconVocabulary />} />
          <StatCard label="Due" value={dashboardData.dueReviewCount} icon={<IconRefresh />} />
          <StatCard label="Articles" value={dashboardData.articlesSaved} icon={<IconArticle />} />
          <StatCard label="Notes" value={dashboardData.notesSaved} icon={<IconEdit />} />
          <StatCard label="Streak" value={dashboardData.currentStreak} icon={<IconStreak />} />
        </div>

        {/* Open Main App */}
        <button onClick={() => handleOpenMainApp()} style={{
          width: '100%', padding: 'var(--spacing-sm) var(--spacing-md)', borderRadius: 'var(--radius-xl)',
          border: 'none', background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
          color: 'var(--color-on-primary)', cursor: 'pointer', fontFamily: 'var(--font-sans)',
          fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-sm)',
          boxShadow: '0 4px 12px color-mix(in srgb, var(--color-primary) 40%, transparent)',
          transition: 'opacity var(--transition-fast)', textAlign: 'center',
        }}>
          <IconHome size={18} />
          Open IELTS Journey
        </button>

        {/* Selected Text */}
        {selectedText && (
          <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', padding: 'var(--spacing-sm) var(--spacing-md)', border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-sm)' }}>
              <div style={{ width: 'var(--spacing-xl)', height: 'var(--spacing-xl)', borderRadius: 'var(--radius-lg)', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', flexShrink: 0 }}>
                <IconGlobe size={16} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-3xs)' }}>Selected Text</div>
                <p style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text)', lineHeight: 'var(--leading-normal)', wordBreak: 'break-word' }}>&ldquo;{selectedText}&rdquo;</p>
                <button onClick={() => chrome.runtime.sendMessage({ type: 'AI_EXPLAIN', payload: { text: selectedText, action: 'translate' } }).catch(() => {})} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-2xs)', marginTop: 'var(--spacing-xs)',
                  padding: 'var(--spacing-2xs) var(--spacing-sm)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)', color: 'var(--color-text)', cursor: 'pointer', fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--weight-medium)', fontFamily: 'var(--font-sans)', transition: 'all var(--transition-fast)',
                }}><IconSearch size={12} />Explain</button>
              </div>
            </div>
          </div>
        )}

        {/* YouTube Card */}
        {isYouTubePage && (
          <div style={{ background: 'linear-gradient(135deg, #1e3a5f, #0f172a)', borderRadius: 'var(--radius-xl)', padding: 'var(--spacing-sm) var(--spacing-md)', border: '1px solid rgba(59,130,246,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-xs)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
              <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: '#f1f5f9' }}>YouTube Learning</span>
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: '#94a3b8', lineHeight: 1.4, marginBottom: 'var(--spacing-sm)' }}>Study vocabulary and practice while watching YouTube.</div>
            <div style={{ display: 'flex', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-sm)' }}>
              <Button variant="primary" size="xs" onClick={() => {
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                  if (tabs[0]?.id) chrome.tabs.sendMessage(tabs[0].id, { type: 'TOGGLE_YOUTUBE_LEARNING', payload: true }).catch(() => {})
                })
              }} icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>}>Open Panel</Button>
              <Button variant="secondary" size="xs" onClick={() => {
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                  if (tabs[0]?.id) chrome.tabs.sendMessage(tabs[0].id, { type: 'TOGGLE_FOCUS_MODE', payload: undefined }).catch(() => {})
                })
              }}>Focus Mode</Button>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', cursor: 'pointer', fontSize: 'var(--text-xs)', color: '#94a3b8' }}>
              <input type="checkbox" checked={autoOpenEnabled} onChange={(e) => {
                const enabled = e.target.checked
                setAutoOpenEnabled(enabled)
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                  if (tabs[0]?.id) {
                    chrome.tabs.sendMessage(tabs[0].id, { type: 'SET_AUTO_OPEN', payload: enabled }).catch(() => {})
                    chrome.storage.local.set({ 'yt-learning-auto-open': enabled }).catch(() => {})
                  }
                })
              }} style={{ accentColor: '#3b82f6' }} />
              Auto-open on YouTube videos
            </label>
          </div>
        )}

        {/* AI Tutor Card */}
        <div style={{ background: 'var(--color-tutor-background)', borderRadius: 'var(--radius-xl)', padding: 'var(--spacing-sm) var(--spacing-md)', border: '1px solid var(--color-tutor-border)', boxShadow: 'var(--shadow-tutor)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            <div style={{ width: 'var(--spacing-xl)', height: 'var(--spacing-xl)', borderRadius: 'var(--radius-lg)', background: 'var(--color-tutor-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-on-primary)', flexShrink: 0 }}><IconAITutor size={18} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-tutor-text)', lineHeight: 'var(--leading-tight)' }}>AI Tutor</span>
              <p style={{ margin: 'var(--spacing-3xs) 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-tutor-text)', opacity: 0.8 }}>Get explanations and practice exercises.</p>
            </div>
            <button onClick={() => handleOpenMainApp('/ai-tutor')} style={{ padding: 'var(--spacing-xs) var(--spacing-md)', borderRadius: 'var(--radius-lg)', border: 'none', background: 'var(--color-tutor-accent)', color: 'var(--color-on-primary)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'opacity var(--transition-fast)' }}>Open</button>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 var(--spacing-xs)' }}>Quick Actions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-xs)' }}>
            {actions.map((action) => <QuickAction key={action.label} {...action} />)}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 'var(--spacing-sm)', borderTop: '1px solid var(--color-border-light)', marginTop: 'auto' }}>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <button onClick={handleOpenSettings} style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-2xs)', background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', padding: 'var(--spacing-xs) var(--spacing-2xs)', minHeight: 'var(--spacing-xl)', borderRadius: 'var(--radius-lg)' }}>
              <IconSettings size={12} />Settings
            </button>
            <button onClick={handleBackup} style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-2xs)', background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', padding: 'var(--spacing-xs) var(--spacing-2xs)', minHeight: 'var(--spacing-xl)', borderRadius: 'var(--radius-lg)' }}>
              <IconSave size={12} />Backup
            </button>
          </div>
          <Button variant="primary" size="sm" onClick={() => handleOpenMainApp()} icon={<IconHome size={14} />}>Open IELTS Journey</Button>
        </div>
      </div>
    )
  }

  return renderContent()
}
