import { useState, useEffect, useMemo, useCallback } from 'react'
import type { SavedItemDisplay } from '../../services/savedItemsService'
import { getAllSavedItems } from '../../services/savedItemsService'
import type { SaveCategory } from '../../types'
import { CATEGORY_LABELS, CATEGORY_ICONS, CATEGORY_COLORS } from '../../types'
import { IconBack, IconSearch, IconWarning } from '@ielts/ui'
import SavedItemDetailView from './SavedItemDetailView'

interface SavedItemsViewProps {
  onBack: () => void
}

const ALL_CATEGORIES: SaveCategory[] = [
  'vocabulary', 'phrase', 'sentence', 'grammar',
  'reading', 'writing', 'speaking', 'mistake',
]

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}

export default function SavedItemsView({ onBack }: SavedItemsViewProps) {
  const [items, setItems] = useState<SavedItemDisplay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<SaveCategory | 'all'>('all')
  const [selectedItem, setSelectedItem] = useState<SavedItemDisplay | null>(null)

  useEffect(() => {
    getAllSavedItems()
      .then((all) => { setItems(all); setLoading(false) })
      .catch((err) => { setError(err instanceof Error ? err.message : 'Failed to load saved items'); setLoading(false) })
  }, [])

  const byCategory = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const item of items) counts[item.category] = (counts[item.category] || 0) + 1
    return counts
  }, [items])

  const filtered = useMemo(() => {
    let result = items
    if (categoryFilter !== 'all') result = result.filter((item) => item.category === categoryFilter)
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

  const handleItemClick = useCallback((item: SavedItemDisplay) => setSelectedItem(item), [])
  const handleDeleted = useCallback(() => {
    setItems((prev) => prev.filter((i) => i.id !== selectedItem?.id))
    setSelectedItem(null)
  }, [selectedItem])

  if (selectedItem) {
    return <SavedItemDetailView item={selectedItem} onBack={() => setSelectedItem(null)} onDeleted={handleDeleted} />
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 16px', gap: '12px', minHeight: '400px' }}>
        <div style={{ width: '28px', height: '28px', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ fontSize: '13px', color: 'var(--color-muted)' }}>Loading saved items...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <Header onBack={onBack} title="Saved Items" />
        <div role="alert" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 16px', gap: '12px', textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-danger-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconWarning size={20} style={{ color: 'var(--color-danger)' }} />
          </div>
          <span style={{ fontSize: '13px', color: 'var(--color-danger)' }}>{error}</span>
          <button onClick={() => window.location.reload()} style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font-sans)' }}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '500px' }}>
      <Header onBack={onBack} title="Saved Items" count={items.length} />

      {items.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '48px 24px', gap: '12px', textAlign: 'center' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'var(--color-surface-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>No saved items yet</span>
          <span style={{ fontSize: '12px', color: 'var(--color-muted)', lineHeight: 1.4 }}>
            Use Quick Actions like <strong>Vocab</strong>, <strong>Article</strong>, or <strong>Quick Note</strong> to save content from any webpage.
          </span>
        </div>
      ) : (
        <>
          {items.length > 0 && <StatsBar byCategory={byCategory} total={items.length} />}

          <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-background)' }}>
            <div style={{ position: 'relative' }}>
              <IconSearch size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)', pointerEvents: 'none' }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search saved items..."
                style={{
                  width: '100%',
                  padding: '8px 10px 8px 32px',
                  borderRadius: '12px',
                  border: '1.5px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                  fontFamily: 'var(--font-sans)',
                  outline: 'none',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '4px', marginTop: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
              <FilterTab label="All" active={categoryFilter === 'all'} color="var(--color-primary)" icon="" onClick={() => setCategoryFilter('all')} />
              {ALL_CATEGORIES.filter((c) => (byCategory[c] || 0) > 0).map((c) => (
                <FilterTab
                  key={c}
                  label={CATEGORY_LABELS[c]}
                  active={categoryFilter === c}
                  color={CATEGORY_COLORS[c]}
                  icon={CATEGORY_ICONS[c]}
                  onClick={() => setCategoryFilter(c)}
                />
              ))}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 16px', gap: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '32px', opacity: 0.3 }}>{categoryFilter !== 'all' ? CATEGORY_ICONS[categoryFilter] : '🔍'}</span>
                <span style={{ fontSize: '13px', color: 'var(--color-muted)' }}>
                  {search ? 'No items match your search.' : 'No items in this category.'}
                </span>
              </div>
            ) : (
              <>
                {filtered.map((item) => (
                  <ItemCard key={item.id} item={item} onClick={() => handleItemClick(item)} />
                ))}
                <div style={{ padding: '10px 12px', fontSize: '11px', color: 'var(--color-muted)', textAlign: 'center', borderTop: '1px solid var(--color-border-light)' }}>
                  {filtered.length} of {items.length} items
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

/* ─── Sub-components ─── */

function FilterTab({ label, active, color, icon, onClick }: { label: string; active: boolean; color: string; icon: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '5px 10px',
        borderRadius: '10px',
        border: 'none',
        fontSize: '11px',
        fontWeight: active ? 600 : 450,
        cursor: 'pointer',
        background: active ? color : 'var(--color-surface)',
        color: active ? 'white' : 'var(--color-text-secondary)',
        fontFamily: 'var(--font-sans)',
        boxShadow: active ? `0 1px 3px ${color}40` : '0 1px 2px rgba(0,0,0,0.04)',
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
      }}
    >
      {icon && <span style={{ fontSize: '12px' }}>{icon}</span>}
      {label}
    </button>
  )
}

function ItemCard({ item, onClick }: { item: SavedItemDisplay; onClick: () => void }) {
  const color = CATEGORY_COLORS[item.category as SaveCategory] || 'var(--color-muted)'

  return (
    <div
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }}
      role="button"
      tabIndex={0}
      style={{
        margin: '4px 8px',
        padding: '10px 12px',
        borderRadius: '12px',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border-light)',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = color; e.currentTarget.style.boxShadow = `0 2px 8px ${color}15` }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border-light)'; e.currentTarget.style.boxShadow = 'none' }}
    >
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: color, borderRadius: '0 2px 2px 0' }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 6px', borderRadius: '6px', fontSize: '10px', fontWeight: 500, background: `${color}15`, color }}>
          {CATEGORY_ICONS[item.category as SaveCategory]} {CATEGORY_LABELS[item.category as SaveCategory]}
        </span>
        <span style={{ fontSize: '10px', color: 'var(--color-muted)', whiteSpace: 'nowrap', marginTop: '2px' }}>
          {formatDate(item.createdAt)}
        </span>
      </div>

      <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text)', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', wordBreak: 'break-word' }}>
        {item.text}
      </p>

      {(item.topic || item.pageTitle) && (
        <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          {item.topic && <span style={{ fontSize: '10px', color, fontWeight: 500 }}>#{item.topic}</span>}
          {item.pageTitle && <span style={{ fontSize: '10px', color: 'var(--color-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>{item.pageTitle}</span>}
        </div>
      )}
    </div>
  )
}

function StatsBar({ byCategory, total }: { byCategory: Record<string, number>; total: number }) {
  const categories = ALL_CATEGORIES.filter((c) => (byCategory[c] || 0) > 0)
  return (
    <div style={{ display: 'flex', gap: '6px', padding: '8px 12px', borderBottom: '1px solid var(--color-border)', overflowX: 'auto', background: 'var(--color-surface)' }}>
      <div style={{ flexShrink: 0, textAlign: 'center', padding: '4px 8px', background: 'var(--color-surface-alt)', borderRadius: '10px', minWidth: '48px' }}>
        <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text)' }}>{total}</div>
        <div style={{ color: 'var(--color-muted)', fontSize: '9px', letterSpacing: '0.02em' }}>TOTAL</div>
      </div>
      {categories.map((c) => (
        <div key={c} style={{ flexShrink: 0, textAlign: 'center', padding: '4px 8px', background: `${CATEGORY_COLORS[c]}0D`, borderRadius: '10px', minWidth: '40px' }}>
          <div style={{ fontWeight: 700, fontSize: '14px', color: CATEGORY_COLORS[c] }}>{byCategory[c]}</div>
          <div style={{ color: CATEGORY_COLORS[c], fontSize: '9px', opacity: 0.7 }}>{CATEGORY_LABELS[c]}</div>
        </div>
      ))}
    </div>
  )
}

function Header({ onBack, title, count }: { onBack: () => void; title: string; count?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
      <button
        onClick={onBack}
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-surface-alt)', border: 'none', cursor: 'pointer', padding: '6px', color: 'var(--color-text-secondary)', borderRadius: '10px', width: '32px', height: '32px' }}
        aria-label="Back"
      >
        <IconBack size={16} />
      </button>
      <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text)' }}>{title}</span>
      {count !== undefined && (
        <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--color-muted)', background: 'var(--color-surface-alt)', padding: '3px 10px', borderRadius: '10px', fontWeight: 500 }}>
          {count} item{count !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  )
}
