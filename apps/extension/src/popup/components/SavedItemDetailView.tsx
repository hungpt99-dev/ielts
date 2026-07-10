import { useState, useCallback } from 'react'
import type { SavedItemDisplay } from '../../services/savedItemsService'
import { deleteSavedItem, updateSavedItem } from '../../services/savedItemsService'
import type { SaveCategory } from '../../types'
import { CATEGORY_LABELS, CATEGORY_ICONS, CATEGORY_COLORS } from '../../types'
import { IconBack } from '@ielts/ui'

interface SavedItemDetailViewProps {
  item: SavedItemDisplay
  onBack: () => void
  onDeleted: () => void
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

export default function SavedItemDetailView({
  item: initialItem,
  onBack,
  onDeleted,
}: SavedItemDetailViewProps) {
  const [editing, setEditing] = useState(false)
  const [item, setItem] = useState(initialItem)
  const [form, setForm] = useState({
    text: item.text,
    topic: item.topic,
    tags: item.tags.join(', '),
    personalNote: item.personalNote,
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const tags = form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
      const updated = {
        text: form.text,
        topic: form.topic,
        tags,
        personalNote: form.personalNote,
      }
      await updateSavedItem(item, updated)
      setItem((prev) => ({ ...prev, ...updated }))
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }, [form, item])

  const handleDelete = useCallback(async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    setDeleting(true)
    try {
      await deleteSavedItem(item)
      onDeleted()
    } finally {
      setDeleting(false)
    }
  }, [confirmDelete, item, onDeleted])

  const color = CATEGORY_COLORS[item.category as SaveCategory] || 'var(--color-muted)'

  return (
    <div>
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
          {CATEGORY_ICONS[item.category as SaveCategory]} {CATEGORY_LABELS[item.category as SaveCategory]}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text)',
                cursor: 'pointer',
                fontSize: '11px',
                fontFamily: 'var(--font-sans)',
              }}
            >
              Edit
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              border: '1px solid var(--color-danger)',
              background: confirmDelete ? 'var(--color-danger)' : 'transparent',
              color: confirmDelete ? 'white' : 'var(--color-danger)',
              cursor: 'pointer',
              fontSize: '11px',
              fontFamily: 'var(--font-sans)',
              opacity: deleting ? 0.5 : 1,
            }}
          >
            {deleting ? '...' : confirmDelete ? 'Confirm?' : 'Delete'}
          </button>
        </div>
      </div>

      <div style={{ padding: '12px', maxHeight: '440px', overflowY: 'auto' }}>
        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--color-muted)',
                  marginBottom: '4px',
                }}
              >
                Text
              </label>
              <textarea
                value={form.text}
                onChange={(e) => setForm((p) => ({ ...p, text: e.target.value }))}
                rows={4}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  fontSize: '13px',
                  fontFamily: 'var(--font-sans)',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--color-muted)',
                  marginBottom: '4px',
                }}
              >
                Topic
              </label>
              <input
                value={form.topic}
                onChange={(e) => setForm((p) => ({ ...p, topic: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  fontSize: '13px',
                  fontFamily: 'var(--font-sans)',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--color-muted)',
                  marginBottom: '4px',
                }}
              >
                Tags (comma separated)
              </label>
              <input
                value={form.tags}
                onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
                placeholder="vocabulary, grammar, part1"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  fontSize: '13px',
                  fontFamily: 'var(--font-sans)',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--color-muted)',
                  marginBottom: '4px',
                }}
              >
                Personal Note
              </label>
              <textarea
                value={form.personalNote}
                onChange={(e) => setForm((p) => ({ ...p, personalNote: e.target.value }))}
                rows={2}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  fontSize: '13px',
                  fontFamily: 'var(--font-sans)',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setForm({
                    text: item.text,
                    topic: item.topic,
                    tags: item.tags.join(', '),
                    personalNote: item.personalNote,
                  })
                  setEditing(false)
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'var(--color-primary)',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontFamily: 'var(--font-sans)',
                  opacity: saving ? 0.5 : 1,
                }}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: '14px',
                  color: 'var(--color-text)',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {item.text}
              </p>
            </div>

            {item.pageTitle && (
              <div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--color-muted)',
                    display: 'block',
                    marginBottom: '2px',
                  }}
                >
                  Source
                </span>
                {item.pageUrl ? (
                  <a
                    href={item.pageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: '12px',
                      color: 'var(--color-primary)',
                      textDecoration: 'none',
                      wordBreak: 'break-all',
                    }}
                  >
                    {item.pageTitle}
                  </a>
                ) : (
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                    {item.pageTitle}
                  </span>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: 500,
                  background: `${color}18`,
                  color,
                }}
              >
                {CATEGORY_ICONS[item.category as SaveCategory]} {CATEGORY_LABELS[item.category as SaveCategory]}
              </span>
              {item.topic && (
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    background: 'var(--color-surface-alt)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  #{item.topic}
                </span>
              )}
              {item.difficulty && (
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    background: 'var(--color-surface-alt)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {item.difficulty}
                </span>
              )}
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  background: 'var(--color-surface-alt)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                {item.status}
              </span>
            </div>

            {item.tags.length > 0 && (
              <div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--color-muted)',
                    display: 'block',
                    marginBottom: '4px',
                  }}
                >
                  Tags
                </span>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        padding: '2px 6px',
                        borderRadius: '6px',
                        fontSize: '10px',
                        background: 'var(--color-primary-light)',
                        color: 'var(--color-primary)',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {item.personalNote && (
              <div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--color-muted)',
                    display: 'block',
                    marginBottom: '2px',
                  }}
                >
                  Note
                </span>
                <p
                  style={{
                    margin: 0,
                    fontSize: '12px',
                    color: 'var(--color-text-secondary)',
                    lineHeight: 1.4,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {item.personalNote}
                </p>
              </div>
            )}

            <div
              style={{
                fontSize: '10px',
                color: 'var(--color-muted)',
                borderTop: '1px solid var(--color-border-light)',
                paddingTop: '8px',
              }}
            >
              Created: {formatDate(item.createdAt)}
              {item.updatedAt !== item.createdAt && (
                <> · Updated: {formatDate(item.updatedAt)}</>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
