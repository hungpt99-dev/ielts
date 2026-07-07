import { memo, useCallback, useMemo, useState, useEffect, type ReactNode } from 'react'
import { useToast } from '../../../../../packages/ui/src/components/Toast'
import { Card } from '../../../../../packages/ui/src/components/Card'
import { Button } from '../../../../../packages/ui/src/components/Button'
import { Badge } from '../../../../../packages/ui/src/components/Badge'
import { EmptyState } from '../../../../../packages/ui/src/components/EmptyState'
import { LoadingSkeleton } from '../../../../../packages/ui/src/components/LoadingSkeleton'
import { ExtensionSyncStatusBadge } from '../../../../../packages/ui/src/components/ExtensionSyncStatusBadge'
import type { SyncStatus } from '../../../../../packages/ui/src/components/ExtensionSyncStatusBadge'
import {
  IconVocabulary, IconBookText, IconArticle, IconRefresh, IconAITutor,
  IconSave, IconEdit, IconStreak, IconSun, IconMoon, IconWarning,
  IconExternalLink, IconMessageSquare, IconSpeaking,
  IconSettings, IconDatabase
} from '@ielts/ui'
import { usePopupData } from '../hooks/usePopupData'
import type { DailyProgress } from '../hooks/usePopupData'
import type { LearningEntry } from '../../types'
import { loadVocabulary } from '../services/popupDataService'
import { getDueCount } from '../services/reviewService'
import { safeStorageGet, safeStorageSet } from '../../utils/safe-chrome'

interface PopupDashboardProps {
  onNavigate: (view: 'saveForm' | 'vocabularyCollector' | 'articleCollector' | 'videoHelper' | 'backupRestore' | 'importExport' | 'miniTutor' | 'savedWords' | 'pendingReviews') => void
}

const StatCard = memo(function StatCard({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--spacing-2xs)',
        padding: 'var(--spacing-sm) var(--spacing-xs)',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border-light)',
        borderRadius: 'var(--radius-xl)',
        minWidth: 0,
        boxShadow: 'var(--shadow-sm)',
        transition: 'box-shadow var(--transition-fast), transform var(--transition-fast)',
      }}
    >
      <span style={{ fontSize: 'var(--text-lg)', lineHeight: 1, display: 'inline-flex', alignItems: 'center', color: 'var(--color-primary)' }}>{icon}</span>
      <span
        style={{
          fontSize: 'var(--text-base)',
          fontWeight: 'var(--weight-bold)',
          color: 'var(--color-text)',
          fontFamily: 'var(--font-sans)',
          lineHeight: 1,
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-secondary)',
          fontFamily: 'var(--font-sans)',
          fontWeight: 'var(--weight-medium)',
          textAlign: 'center',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
    </div>
  )
})

const QuickActionBtn = memo(function QuickActionBtn({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--spacing-2xs)',
        padding: 'var(--spacing-sm) var(--spacing-xs)',
        minHeight: 'var(--spacing-2xl)',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border-light)',
        borderRadius: 'var(--radius-xl)',
        cursor: 'pointer',
        transition: 'all var(--transition-fast)',
        color: 'var(--color-text)',
        fontFamily: 'var(--font-sans)',
        minWidth: 0,
        outline: 'none',
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <span
        style={{
          fontSize: 'var(--text-xl)',
          lineHeight: 1,
          width: 'var(--spacing-xl)',
          height: 'var(--spacing-xl)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-primary)',
        }}
      >
        {icon}
      </span>
      <span
        style={{
          fontSize: 'var(--text-xs)',
          fontWeight: 'var(--weight-medium)',
          color: 'var(--color-text-secondary)',
          fontFamily: 'var(--font-sans)',
          textAlign: 'center',
          lineHeight: 1.2,
        }}
      >
        {label}
      </span>
    </button>
  )
})

const ActivityItem = memo(function ActivityItem({ entry }: { entry: LearningEntry }) {
  const MAX_TEXT_LENGTH = 55
  const text = entry?.text || ''
  const truncated = text.length > MAX_TEXT_LENGTH
    ? text.slice(0, MAX_TEXT_LENGTH) + '…'
    : text

  const iconMap: Record<string, ReactNode> = {
    vocabulary: <IconVocabulary />,
    phrase: <IconMessageSquare />,
    sentence: <IconEdit />,
    grammar: <IconBookText />,
    reading: <IconArticle />,
    writing: <IconEdit />,
    speaking: <IconSpeaking />,
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-xs)',
        padding: 'var(--spacing-xs) 0',
      }}
    >
      <span style={{ fontSize: 'var(--text-sm)', flexShrink: 0, display: 'inline-flex' }}>
        {iconMap[entry.category] || <IconWarning />}
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <span
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text)',
            fontFamily: 'var(--font-sans)',
            lineHeight: 1.3,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'block',
          }}
        >
          {truncated}
        </span>
      </div>
      {entry.topic && (
        <Badge variant="primary" size="xs">
          {entry.topic}
        </Badge>
      )}
    </div>
  )
})

function SyncBadge() {
  const [status, setStatus] = useState<SyncStatus>('synced')

  useEffect(() => {
    const check = async () => {
      try {
        const result = await new Promise<any>(r => chrome.storage.local.get(['lastSyncTime'], r))
        if (result.lastSyncTime) {
          setStatus('synced')
        }
      } catch {
        setStatus('disconnected')
      }
    }
    check()
    const interval = setInterval(check, 30000)
    return () => clearInterval(interval)
  }, [])

  return <ExtensionSyncStatusBadge status={status} size="sm" />
}

export default function PopupDashboard({ onNavigate }: PopupDashboardProps) {
  const { showToast } = useToast()
  const {
    progress,
    recentEntries,
    user,
    darkMode,
    loading,
    error,
    toggleDarkMode,
    refreshProgress,
    refreshRecent,
  } = usePopupData()
  const [vocabCount, setVocabCount] = useState(0)
  const [vocabCountLoading, setVocabCountLoading] = useState(true)
  const [dueCount, setDueCount] = useState(0)

  useEffect(() => {
    setVocabCountLoading(true)
    Promise.all([loadVocabulary(), getDueCount().catch(() => 0)])
      .then(([vocabResult, dueResult]) => {
        setVocabCount(vocabResult.stats.total)
        setDueCount(dueResult)
        if (dueResult !== progress.reviewDue) {
          safeStorageGet<any>('dailyProgress').then((result) => {
            const current = result.dailyProgress || { wordsAdded: 0, notesAdded: 0, articlesSaved: 0, reviewDue: 0, streak: 0 }
            safeStorageSet({ dailyProgress: { ...current, reviewDue: dueResult } })
          }).catch(() => {})
        }
      })
      .catch(() => {
        setVocabCount(0)
        setDueCount(0)
      })
      .finally(() => {
        setVocabCountLoading(false)
      })
  }, [progress.reviewDue])

  const handleQuickSavePage = useCallback(async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
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

      const [progressResult, savedItemsResult] = await Promise.all([
        chrome.storage.local.get(['dailyProgress']),
        chrome.storage.local.get(['savedItems']),
      ])

      const current = (progressResult.dailyProgress as DailyProgress) || {
        wordsAdded: 0, notesAdded: 0, articlesSaved: 0, reviewDue: 0, streak: 0,
      }
      const items = (savedItemsResult.savedItems as unknown[]) || []
      items.unshift(entry)

      await Promise.all([
        chrome.storage.local.set({
          dailyProgress: { ...current, articlesSaved: current.articlesSaved + 1 },
        }),
        chrome.storage.local.set({ savedItems: items }),
      ])

      showToast('success', 'Page saved to reading list')
      refreshProgress()
      refreshRecent()
    } catch {
      showToast('error', 'Failed to save page')
    }
  }, [showToast, refreshProgress, refreshRecent])

  const handleStartReview = useCallback(() => {
    onNavigate('pendingReviews')
  }, [onNavigate])

  const handleOpenDashboard = useCallback(() => {
    chrome.tabs.create({ url: 'https://ieltsjourney.dev/dashboard' })
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

  const handleOpenInfo = useCallback(() => {
    chrome.tabs.create({ url: 'https://ieltsjourney.dev/info' })
  }, [])

  const actions = useMemo(
    () => [
      { icon: <IconVocabulary />, label: 'Vocab', onClick: () => onNavigate('vocabularyCollector') },
      { icon: <IconArticle />, label: 'Article', onClick: () => onNavigate('articleCollector') },
      { icon: <IconRefresh />, label: 'Review', onClick: handleStartReview },
      { icon: <IconAITutor />, label: 'AI Tutor', onClick: () => onNavigate('miniTutor') },
      { icon: <IconSave />, label: 'Save Page', onClick: handleQuickSavePage },
      { icon: <IconEdit />, label: 'Quick Note', onClick: handleQuickAddNote },
    ],
    [onNavigate, handleStartReview, handleQuickSavePage, handleQuickAddNote],
  )

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-md)',
          padding: 'var(--spacing-md)',
          minHeight: 'var(--ext-min-height)',
          width: 'var(--ext-width)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <LoadingSkeleton variant="text" width="140px" />
          <LoadingSkeleton variant="text" width="60px" />
        </div>
        <LoadingSkeleton variant="card" count={2} gap="var(--spacing-sm)" />
        <LoadingSkeleton variant="rect" count={3} gap="var(--spacing-xs)" />
      </div>
    )
  }

  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'var(--ext-min-height)',
          padding: 'var(--spacing-md)',
          width: 'var(--ext-width)',
        }}
      >
        <EmptyState
          icon={<IconWarning />}
          title="Something went wrong"
          description={error}
          action={
            <Button variant="secondary" size="sm" onClick={() => { refreshProgress(); refreshRecent() }}>
              Retry
            </Button>
          }
        />
      </div>
    )
  }

  const greeting = user?.isLoggedIn && user.name
    ? `Hi, ${user.name.split(' ')[0]}!`
    : 'Welcome!'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-sm)',
        padding: 'var(--spacing-md)',
        minHeight: 'var(--ext-min-height)',
        width: 'var(--ext-width)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: 'var(--spacing-2xs)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          <img
            src="icons/icon-48.png"
            alt=""
            style={{
              width: 'var(--spacing-2xl)',
              height: 'var(--spacing-2xl)',
              borderRadius: 'var(--radius-xl)',
              flexShrink: 0,
              boxShadow: '0 2px 8px color-mix(in srgb, var(--color-primary) 30%, transparent)',
            }}
          />
          <div>
            <h1
              style={{
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--weight-bold)',
                color: 'var(--color-text)',
                margin: 0,
                fontFamily: 'var(--font-sans)',
                lineHeight: 1.2,
                letterSpacing: '-0.01em',
              }}
            >
              IELTS Journey
            </h1>
            <span
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text-secondary)',
                fontFamily: 'var(--font-sans)',
                fontWeight: 'var(--weight-normal)',
              }}
            >
              {greeting}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-3xs)',
              padding: 'var(--spacing-3xs) var(--spacing-xs)',
              borderRadius: 'var(--radius-full)',
              background: progress.streak > 0 ? 'var(--color-warning-light)' : 'var(--color-surface-alt)',
              color: progress.streak > 0 ? 'var(--color-warning-dark)' : 'var(--color-muted)',
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--weight-semibold)',
              fontFamily: 'var(--font-sans)',
              lineHeight: 1.2,
            }}
          >
            <IconStreak size={12} style={{ flexShrink: 0 }} />
            <span>{progress.streak}d</span>
          </div>
          <SyncBadge />
          <button
            onClick={toggleDarkMode}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              width: 'var(--spacing-xl)',
              height: 'var(--spacing-xl)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'var(--text-base)',
              padding: 0,
              lineHeight: 1,
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
            }}
          >
            {darkMode ? <IconSun size={16} /> : <IconMoon size={16} />}
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 'var(--spacing-xs)',
        }}
      >
        <StatCard label="Words" value={vocabCountLoading ? 0 : vocabCount} icon={<IconVocabulary />} />
        <StatCard label="Due" value={dueCount} icon={<IconRefresh />} />
        <StatCard label="Articles" value={progress.articlesSaved} icon={<IconArticle />} />
        <StatCard label="Streak" value={progress.streak} icon={<IconStreak />} />
      </div>

      {/* AI Tutor Card */}
      <div
        style={{
          background: 'var(--color-tutor-background)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--spacing-sm) var(--spacing-md)',
          border: '1px solid var(--color-tutor-border)',
          boxShadow: 'var(--shadow-tutor)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          <div
            style={{
              width: 'var(--spacing-xl)',
              height: 'var(--spacing-xl)',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--color-tutor-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-on-primary)',
              flexShrink: 0,
            }}
          >
            <IconAITutor size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-tutor-text)', fontFamily: 'var(--font-sans)', lineHeight: 'var(--leading-tight)' }}>
              AI Tutor
            </span>
            <p style={{ margin: 'var(--spacing-3xs) 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-tutor-text)', fontFamily: 'var(--font-sans)', lineHeight: 'var(--leading-normal)', opacity: 0.8 }}>
              Ask me about any text, get explanations, or practice exercises.
            </p>
          </div>
          <button
            onClick={() => onNavigate('miniTutor')}
            style={{
              padding: 'var(--spacing-xs) var(--spacing-md)',
              borderRadius: 'var(--radius-lg)',
              border: 'none',
              background: 'var(--color-tutor-accent)',
              color: 'var(--color-on-primary)',
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--weight-semibold)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'opacity var(--transition-fast)',
              fontFamily: 'var(--font-sans)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
          >
            Ask AI
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2
          style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--weight-semibold)',
            color: 'var(--color-muted)',
            fontFamily: 'var(--font-sans)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            margin: '0 0 var(--spacing-xs)',
          }}
        >
          Quick Actions
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'var(--spacing-xs)',
          }}
        >
          {actions.map((action) => (
            <QuickActionBtn key={action.label} {...action} />
          ))}
        </div>
      </div>

      {/* Saved Words & Review Links */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 'var(--spacing-xs)',
        }}
      >
        <button
          onClick={() => onNavigate('savedWords')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--spacing-2xs)',
            padding: 'var(--spacing-xs) var(--spacing-sm)',
            minHeight: 'var(--spacing-2xl)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--color-border-light)',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            cursor: 'pointer',
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--weight-medium)',
            fontFamily: 'var(--font-sans)',
            transition: 'all var(--transition-fast)',
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'manipulation',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <IconBookText size={14} style={{ color: 'var(--color-primary)' }} />
          <span>{vocabCountLoading ? 'Words...' : `${vocabCount} Saved Words`}</span>
        </button>
        <button
          onClick={handleStartReview}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--spacing-2xs)',
            padding: 'var(--spacing-xs) var(--spacing-sm)',
            minHeight: 'var(--spacing-2xl)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--color-warning)',
            background: dueCount > 0 ? 'var(--color-warning-light)' : 'var(--color-surface)',
            color: dueCount > 0 ? 'var(--color-warning-dark)' : 'var(--color-text)',
            cursor: 'pointer',
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--weight-medium)',
            fontFamily: 'var(--font-sans)',
            transition: 'all var(--transition-fast)',
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'manipulation',
            boxShadow: dueCount > 0 ? '0 2px 8px color-mix(in srgb, var(--color-warning) 25%, transparent)' : 'var(--shadow-sm)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-warning-light)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = dueCount > 0 ? 'var(--color-warning-light)' : 'var(--color-surface)' }}
        >
          <IconRefresh size={14} />
          <span>{dueCount > 0 ? `${dueCount} Pending Review` : 'Start Review'}</span>
        </button>
      </div>

      {/* Recent Activity */}
      <Card variant="default" padding="sm" style={{ borderRadius: 'var(--radius-xl)' }}>
        <h2
          style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--weight-semibold)',
            color: 'var(--color-muted)',
            fontFamily: 'var(--font-sans)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            margin: '0 0 var(--spacing-xs)',
          }}
        >
          Today's Activity
        </h2>
        {recentEntries.length === 0 ? (
          <EmptyState
            icon={<IconBookText size={20} />}
            title="No activity yet"
            description="Start learning by saving text from any webpage!"
            compact
          />
        ) : (
          <div>
            {recentEntries.map((entry) => (
              <ActivityItem key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </Card>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: 'var(--spacing-sm)',
          borderTop: '1px solid var(--color-border-light)',
          marginTop: 'auto',
        }}
      >
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <button
            onClick={handleOpenSettings}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--spacing-2xs)',
              background: 'none',
              border: 'none',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--weight-medium)',
              fontFamily: 'var(--font-sans)',
              padding: 'var(--spacing-xs) var(--spacing-2xs)',
              minHeight: 'var(--spacing-xl)',
              borderRadius: 'var(--radius-lg)',
              transition: 'all var(--transition-fast)',
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-alt)'; e.currentTarget.style.color = 'var(--color-text)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--color-text-secondary)' }}
          >
            <IconSettings size={12} />
            Settings
          </button>
          <button
            onClick={handleBackup}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--spacing-2xs)',
              background: 'none',
              border: 'none',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--weight-medium)',
              fontFamily: 'var(--font-sans)',
              padding: 'var(--spacing-xs) var(--spacing-2xs)',
              minHeight: 'var(--spacing-xl)',
              borderRadius: 'var(--radius-lg)',
              transition: 'all var(--transition-fast)',
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-alt)'; e.currentTarget.style.color = 'var(--color-text)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--color-text-secondary)' }}
          >
            <IconDatabase size={12} />
            Backup
          </button>
          <button
            onClick={handleOpenInfo}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--spacing-2xs)',
              background: 'none',
              border: 'none',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--weight-medium)',
              fontFamily: 'var(--font-sans)',
              padding: 'var(--spacing-xs) var(--spacing-2xs)',
              minHeight: 'var(--spacing-xl)',
              borderRadius: 'var(--radius-lg)',
              transition: 'all var(--transition-fast)',
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-alt)'; e.currentTarget.style.color = 'var(--color-text)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--color-text-secondary)' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
            Info
          </button>
        </div>
        <Button
          variant="ghost"
          size="xs"
          onClick={handleOpenDashboard}
          icon={<IconExternalLink size={10} />}
          iconPosition="right"
        >
          Open Dashboard
        </Button>
      </div>
    </div>
  )
}
