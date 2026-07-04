import { memo, useCallback, useMemo } from 'react'
import { useToast } from '../../../../../packages/ui/src/components/Toast'
import { usePopupData } from '../hooks/usePopupData'
import DashboardCard from './DashboardCard'
import type { LearningEntry } from '../../types'

interface PopupDashboardProps {
  onNavigate: (view: 'saveForm' | 'vocabularyCollector' | 'articleCollector' | 'videoHelper' | 'backupRestore' | 'miniTutor') => void
}

interface ActionItem {
  icon: string
  label: string
  description: string
  onClick: () => void
  color: string
}

const STREET_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
)

const StreakBadge = memo(function StreakBadge({ streak }: { streak: number }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: '999px',
        background: streak > 0 ? 'var(--color-warning-light, #fef3c7)' : 'var(--color-surface-alt)',
        color: streak > 0 ? 'var(--color-warning, #d97706)' : 'var(--color-muted)',
        fontSize: '12px',
        fontWeight: 600,
      }}
    >
      {STREET_ICON}
      <span>{streak} day{streak !== 1 ? 's' : ''}</span>
    </div>
  )
})

const ActionButton = memo(function ActionButton({
  icon,
  label,
  description,
  onClick,
  color,
}: ActionItem) {
  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.style.background = 'var(--color-surface-alt)'
      e.currentTarget.style.borderColor = color
    },
    [color],
  )

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.style.background = 'var(--color-surface)'
      e.currentTarget.style.borderColor = 'var(--color-border)'
    },
    [],
  )

  const handleFocus = useCallback(
    (e: React.FocusEvent<HTMLButtonElement>) => {
      e.currentTarget.style.borderColor = color
    },
    [color],
  )

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLButtonElement>) => {
      e.currentTarget.style.borderColor = 'var(--color-border)'
    },
    [],
  )

  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-describedby={description ? `${label}-desc` : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        width: '100%',
        padding: '10px 14px',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.15s ease',
        color: 'var(--color-text)',
        fontSize: '13px',
        lineHeight: '1.3',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      <span
        style={{
          width: '34px',
          height: '34px',
          borderRadius: 'var(--radius-md)',
          background: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          flexShrink: 0,
          color,
        }}
      >
        {icon}
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', minWidth: 0 }}>
        <span style={{ fontWeight: 600, fontSize: '13px' }}>{label}</span>
        {description && (
          <span
            id={`${label}-desc`}
            style={{
              fontSize: '11px',
              color: 'var(--color-muted)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {description}
          </span>
        )}
      </div>
    </button>
  )
})

const ActivityItem = memo(function ActivityItem({ entry }: { entry: LearningEntry }) {
  const MAX_TEXT_LENGTH = 60
  const truncated = entry.text.length > MAX_TEXT_LENGTH
    ? entry.text.slice(0, MAX_TEXT_LENGTH) + '…'
    : entry.text

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '8px',
        padding: '8px 0',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <span style={{ fontSize: '14px', flexShrink: 0, marginTop: '1px' }}>
        {entry.category === 'vocabulary' ? '📖' :
         entry.category === 'phrase' ? '💬' :
         entry.category === 'sentence' ? '📝' :
         entry.category === 'grammar' ? '📚' :
         entry.category === 'reading' ? '📰' :
         entry.category === 'writing' ? '✍️' :
         entry.category === 'speaking' ? '🎤' : '⚠️'}
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: '12px',
            color: 'var(--color-text)',
            lineHeight: '1.4',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {truncated}
        </div>
        {entry.topic && (
          <span
            style={{
              fontSize: '10px',
              color: 'var(--color-primary)',
              fontWeight: 500,
              marginTop: '2px',
              display: 'inline-block',
            }}
          >
            #{entry.topic}
          </span>
        )}
      </div>
    </div>
  )
})

export default function PopupDashboard({ onNavigate }: PopupDashboardProps) {
  const { showToast } = useToast()
  const {
    progress,
    recentEntries,
    darkMode,
    loading,
    toggleDarkMode,
    refreshProgress,
    refreshRecent,
  } = usePopupData()

  const handleQuickSavePage = useCallback(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0]
      if (!tab?.url || !tab?.title) {
        showToast('warning', 'No active page to save')
        return
      }
      const entry = {
        id: crypto.randomUUID(),
        text: `[Page] ${tab.title}`,
        category: 'reading' as const,
        topic: '',
        skill: 'reading' as const,
        difficulty: '' as const,
        tags: [],
        personalNote: '',
        pageTitle: tab.title,
        pageUrl: tab.url,
        status: 'new' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      chrome.storage.local.get(['dailyProgress'], (result) => {
        const current = result.dailyProgress || {
          wordsAdded: 0, notesAdded: 0, articlesSaved: 0, reviewDue: 0, streak: 0,
        }
        chrome.storage.local.set({
          dailyProgress: { ...current, articlesSaved: current.articlesSaved + 1 },
        })
      })
      chrome.storage.local.get(['savedItems'], (result) => {
        const items = result.savedItems || []
        items.unshift(entry)
        chrome.storage.local.set({ savedItems: items })
      })
      showToast('success', 'Page saved to reading list')
      refreshProgress()
      refreshRecent()
    })
  }, [showToast, refreshProgress, refreshRecent])

  const handleStartReview = useCallback(() => {
    showToast('info', 'Opening vocabulary review…')
  }, [showToast])

  const handleOpenDashboard = useCallback(() => {
    chrome.tabs.create({ url: 'http://localhost:5173' })
  }, [])

  const handleQuickAddNote = useCallback(() => {
    onNavigate('saveForm')
  }, [onNavigate])

  const handleOpenSettings = useCallback(() => {
    chrome.tabs.create({ url: chrome.runtime.getURL('options.html') })
  }, [])

  const handleBackup = useCallback(() => {
    onNavigate('backupRestore')
  }, [onNavigate])

  const actions = useMemo<ActionItem[]>(
    () => [
      {
        icon: '🤖',
        label: 'AI Tutor',
        description: 'Explain, simplify, and learn from any text',
        onClick: () => onNavigate('miniTutor'),
        color: '#6366f1',
      },
      {
        icon: '📖',
        label: 'Collect Vocabulary',
        description: 'Save new words with AI enrichment',
        onClick: () => onNavigate('vocabularyCollector'),
        color: '#3b82f6',
      },
      {
        icon: '✏️',
        label: 'Save Selected Text',
        description: 'Categorize and save text from web',
        onClick: () => onNavigate('saveForm'),
        color: '#8b5cf6',
      },
      {
        icon: '📰',
        label: 'Save Article',
        description: 'Save page as reading material',
        onClick: () => onNavigate('articleCollector'),
        color: '#10b981',
      },
      {
        icon: '🎬',
        label: 'Video Helper',
        description: 'Save YouTube & video content',
        onClick: () => onNavigate('videoHelper'),
        color: '#ec4899',
      },
      {
        icon: '🔄',
        label: 'Start Review',
        description: `${progress.reviewDue} pending review${progress.reviewDue !== 1 ? 's' : ''}`,
        onClick: handleStartReview,
        color: '#f59e0b',
      },
      {
        icon: '🌐',
        label: 'Public API',
        description: 'Search and import open content',
        onClick: () => chrome.tabs.create({ url: 'http://localhost:5173/public-api' }),
        color: '#06b6d4',
      },
    ],
    [onNavigate, progress.reviewDue, handleStartReview],
  )

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '500px',
        fontSize: '14px',
        color: 'var(--color-muted)',
      }}>
        Loading...
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '16px',
        minHeight: '500px',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--color-primary), #7c3aed)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            I
          </div>
          <h1
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: 'var(--color-text)',
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            IELTS Journey
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <StreakBadge streak={progress.streak} />
          <button
            onClick={toggleDarkMode}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              width: '30px',
              height: '30px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              transition: 'background 0.15s',
              padding: 0,
            }}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
        }}
      >
        <DashboardCard label="Words Today" value={progress.wordsAdded} icon="📖" />
        <DashboardCard label="Notes Today" value={progress.notesAdded} icon="✏️" />
        <DashboardCard label="Articles" value={progress.articlesSaved} icon="📰" />
        <DashboardCard
          label="Review Due"
          value={progress.reviewDue}
          icon="🔄"
          accent={progress.reviewDue > 0}
        />
      </section>

      <section>
        <h2
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--color-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            margin: '0 0 8px',
          }}
        >
          Quick Actions
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {actions.map((action) => (
            <ActionButton key={action.label} {...action} />
          ))}
        </div>
      </section>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '6px',
        }}
      >
        <button
          onClick={handleQuickSavePage}
          style={quickBtnStyle}
          aria-label="Save current page as reading material"
        >
          <span style={{ fontSize: '14px' }} aria-hidden="true">💾</span>
          <span>Save Page</span>
        </button>
        <button
          onClick={handleQuickAddNote}
          style={quickBtnStyle}
          aria-label="Quick add a note"
        >
          <span style={{ fontSize: '14px' }} aria-hidden="true">📝</span>
          <span>Quick Note</span>
        </button>
      </div>

      <section style={{ flex: 1 }}>
        <h2
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--color-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            margin: '0 0 4px',
          }}
        >
          Today's Activity
        </h2>
        {recentEntries.length === 0 ? (
          <div
            role="status"
            aria-label="No activity yet"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px 16px',
              gap: '8px',
            }}
          >
            <span aria-hidden="true" style={{ fontSize: '28px', opacity: 0.3 }}>📚</span>
            <span style={{ fontSize: '13px', color: 'var(--color-muted)', textAlign: 'center' }}>
              No activity yet today. Start learning by saving text from any webpage!
            </span>
          </div>
        ) : (
          <div>
            {recentEntries.map((entry) => (
              <ActivityItem key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </section>

      <footer
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '12px',
          borderTop: '1px solid var(--color-border)',
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleOpenSettings}
            style={footerLinkStyle}
            aria-label="Open extension settings"
          >
            Settings
          </button>
          <button
            onClick={handleBackup}
            style={footerLinkStyle}
            aria-label="Backup and restore data"
          >
            Backup
          </button>
        </div>
        <button
          onClick={handleOpenDashboard}
          style={{
            ...footerLinkStyle,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          Open Dashboard
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </button>
      </footer>
    </div>
  )
}

const quickBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  padding: '8px 12px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  background: 'var(--color-surface)',
  color: 'var(--color-text)',
  fontSize: '12px',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'background 0.15s',
}

const footerLinkStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--color-primary)',
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: 500,
  padding: '4px 0',
}
