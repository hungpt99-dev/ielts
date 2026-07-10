import { useState, useEffect, useMemo, useCallback } from 'react'
import type { SavedItemDisplay, SavedItemsStats } from '../../services/savedItemsService'
import { getAllSavedItems, getSavedItemsStats } from '../../services/savedItemsService'
import type { SaveCategory } from '../../types'
import { CATEGORY_LABELS, CATEGORY_ICONS, CATEGORY_COLORS } from '../../types'
import { IconBack, IconSearch, IconWarning } from '@ielts/ui'

interface SavedItemsViewProps {
  onBack: () => void
}

const ALL_CATEGORIES: SaveCategory[] = [
  'vocabulary',
  'phrase',
  'sentence',
  'grammar',
  'reading',
  'writing',
  'speaking',
  'mistake',
]

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}

function CategoryBadge({ category }: { category: SaveCategory }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        padding: '2px 6px',
        borderRadius: '10px',
        fontSize: '10px',
        fontWeight: 500,
        background: `${CATEGORY_COLORS[category]}18`,
        color: CATEGORY_COLORS[category],
        whiteSpace: 'nowrap',
      }}
    >
      {CATEGORY_ICONS[category]} {CATEGORY_LABELS[category]}
    </span>
  )
}

function StatBadge({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div
      style={{
        flex: 1,
        textAlign: 'center',
        padding: '4px 2px',
        background: 'var(--color-surface-alt)',
        borderRadius: '8px',
      }}
    >
      <div style={{ fontWeight: 700, fontSize: '13px', color }}>{count}</div>
      <div style={{ color: 'var(--color-muted)', fontSize: '10px' }}>{label}</div>
    </div>
  )
}

export default function SavedItemsView({ onBack }: SavedItemsViewProps) {
  const [items, setItems] = useState<SavedItemDisplay[]>([])
  const [stats, setStats] = useState<SavedItemsStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<SaveCategory | 'all'>('all')

  useEffect(() => {
    Promise.all([getAllSavedItems(), getSavedItemsStats()])
      .then(([all, s]) => {
        setItems(all)
        setStats(s)
        setLoading(false)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load saved items')
        setLoading(false)
      })
  }, [])

  const filtered = useMemo(() => {
    let result = items
    if (categoryFilter !== 'all') {
      result = result.filter((item) => item.category === categoryFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (item) =>
          item.text.toLowerCase().includes(q) ||
          item.topic.toLowerCase().includes(q) ||
          item.pageTitle.toLowerCase().includes(q) ||
          item.personalNote.toLowerCase().includes(q) ||
          item.tags.some((t) => t.toLowerCase().includes(q)),
      )
    }
    return result
  }, [items, categoryFilter, search])

  const handleItemClick = useCallback((item: SavedItemDisplay) => {
    if (item.pageUrl) {
      chrome.tabs.create({ url: item.pageUrl })
    }
  }, [])

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 16px',
          gap: '8px',
          minHeight: '400px',
        }}
      >
        <div
          style={{
            width: '24px',
            height: '24px',
            border: '3px solid var(--color-border)',
            borderTopColor: 'var(--color-primary)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <span style={{ fontSize: '13px', color: 'var(--color-muted)' }}>Loading saved items...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <Header onBack={onBack} title="Saved Items" />
        <div
          role="alert"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px 16px',
            gap: '8px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'var(--color-danger-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconWarning size={24} style={{ color: 'var(--color-danger)' }} />
          </div>
          <span style={{ fontSize: '13px', color: 'var(--color-danger)' }}>{error}</span>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Header onBack={onBack} title="Saved Items" count={items.length} />

      {stats && (
        <div
          style={{
            display: 'flex',
            gap: '6px',
            padding: '8px 12px',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <StatBadge label="Total" count={stats.total} color="var(--color-text)" />
          {ALL_CATEGORIES.filter((c) => (stats.byCategory[c] || 0) > 0).map((c) => (
            <StatBadge
              key={c}
              label={CATEGORY_LABELS[c]}
              count={stats.byCategory[c] || 0}
              color={CATEGORY_COLORS[c]}
            />
          ))}
        </div>
      )}

      <div
        style={{
          padding: '6px 12px',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div style={{ position: 'relative' }}>
          <IconSearch
            size={14}
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-muted)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search all saved items..."
            style={{
              width: '100%',
              padding: '6px 10px 6px 28px',
              borderRadius: '10px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              fontSize: '13px',
              boxSizing: 'border-box',
              fontFamily: 'var(--font-sans)',
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            gap: '4px',
            marginTop: '6px',
            overflowX: 'auto',
            paddingBottom: '2px',
          }}
        >
          {(['all', ...ALL_CATEGORIES] as const).map((c) => {
            const isActive = categoryFilter === c
            const label = c === 'all' ? 'All' : CATEGORY_LABELS[c]
            const color = c === 'all' ? 'var(--color-primary)' : CATEGORY_COLORS[c]
            return (
              <button
                key={c}
                onClick={() => setCategoryFilter(c)}
                style={{
                  flexShrink: 0,
                  padding: '4px 8px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: isActive ? 600 : 400,
                  cursor: 'pointer',
                  background: isActive ? color : 'var(--color-surface-alt)',
                  color: isActive ? 'white' : 'var(--color-text-secondary)',
                  fontFamily: 'var(--font-sans)',
                  transition: 'all 0.15s',
                }}
              >
                {c !== 'all' && <span style={{ marginRight: '3px' }}>{CATEGORY_ICONS[c]}</span>}
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '32px 16px',
              gap: '8px',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: '32px', opacity: 0.3 }}>
              {categoryFilter !== 'all' ? CATEGORY_ICONS[categoryFilter] : ''}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--color-muted)' }}>
              {search || categoryFilter !== 'all'
                ? 'No items match your search.'
                : 'No saved items yet. Use Quick Actions to save!'}
            </span>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => handleItemClick(item)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleItemClick(item)
                }
              }}
              role="button"
              tabIndex={0}
              style={{
                padding: '10px 12px',
                borderBottom: '1px solid var(--color-border-light)',
                cursor: item.pageUrl ? 'pointer' : 'default',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--color-surface-alt)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '6px',
                  marginBottom: '4px',
                }}
              >
                <CategoryBadge category={item.category} />
                <span style={{ fontSize: '10px', color: 'var(--color-muted)', whiteSpace: 'nowrap' }}>
                  {formatDate(item.createdAt)}
                </span>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: '12px',
                  color: 'var(--color-text)',
                  lineHeight: 1.4,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {item.text}
              </p>
              {(item.topic || item.pageTitle) && (
                <div
                  style={{
                    display: 'flex',
                    gap: '6px',
                    marginTop: '4px',
                    fontSize: '10px',
                    color: 'var(--color-muted)',
                  }}
                >
                  {item.topic && <span>#{item.topic}</span>}
                  {item.pageTitle && (
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.pageTitle}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div
        style={{
          padding: '6px 12px',
          borderTop: '1px solid var(--color-border)',
          fontSize: '11px',
          color: 'var(--color-muted)',
          textAlign: 'center',
        }}
      >
        {filtered.length} of {items.length} items shown
      </div>
    </div>
  )
}

function Header({
  onBack,
  title,
  count,
}: {
  onBack: () => void
  title: string
  count?: number
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 12px',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <button
        onClick={onBack}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px',
          color: 'var(--color-text-secondary)',
          borderRadius: '8px',
        }}
        aria-label="Back"
      >
        <IconBack size={16} />
      </button>
      <span
        style={{
          fontWeight: 600,
          fontSize: '13px',
          color: 'var(--color-text)',
        }}
      >
        {title}
      </span>
      {count !== undefined && (
        <span
          style={{
            marginLeft: 'auto',
            fontSize: '11px',
            color: 'var(--color-muted)',
            background: 'var(--color-surface-alt)',
            padding: '2px 8px',
            borderRadius: '10px',
          }}
        >
          {count} items
        </span>
      )}
    </div>
  )
}
