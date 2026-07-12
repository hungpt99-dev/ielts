import { useState, useEffect } from 'react'
import { saveQuickNote } from '../../services/artifactService'
import { SKILL_OPTIONS, SKILL_LABELS } from '../../types'
import { IconClose, IconCheck, IconEdit } from '@ielts/ui'

interface QuickNoteCaptureProps {
  onSaved: () => void
  onCancel: () => void
}

export default function QuickNoteCapture({ onSaved, onCancel }: QuickNoteCaptureProps) {
  const [pageInfo, setPageInfo] = useState<{ title: string; url: string; selectedText: string }>({
    title: '',
    url: '',
    selectedText: '',
  })
  const [content, setContent] = useState('')
  const [topic, setTopic] = useState('')
  const [skill, setSkill] = useState('general')
  const [tags, setTags] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0]
      if (!tab?.id) {
        setPageInfo({ title: tab?.title || '', url: tab?.url || '', selectedText: '' })
        return
      }
      chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_INFO' }, (response) => {
        setPageInfo({
          title: response?.title || tab.title || '',
          url: response?.url || tab.url || '',
          selectedText: response?.selectedText || '',
        })
        if (response?.selectedText) {
          setContent(response.selectedText)
        }
      })
    })
  }, [])

  const handleSave = async () => {
    const trimmed = content.trim()
    if (!trimmed) {
      setError('Note content is required')
      return
    }
    setError('')
    setSaving(true)
    try {
      const tagsArray = tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean)

      await saveQuickNote({
        content: trimmed,
        pageUrl: pageInfo.url || undefined,
        pageTitle: pageInfo.title || undefined,
        topic: topic || undefined,
        skill: skill || undefined,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
      })

      setSaved(true)
      setTimeout(() => onSaved(), 1200)
    } catch {
      setError('Failed to save note. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (saved) {
    return (
      <div
        role="status"
        aria-label="Note saved"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--spacing-2xl) var(--spacing-lg)',
          gap: 'var(--spacing-sm)',
          width: 'var(--ext-width)',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'var(--color-success)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            color: 'var(--color-text-inverse)',
          }}
        >
          <IconCheck size={28} />
        </div>
        <div
          style={{
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--weight-semibold)',
            color: 'var(--color-text)',
          }}
        >
          Note saved!
        </div>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)' }}>
          Saved to your content library
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-md)',
        padding: 'var(--spacing-md)',
        width: 'var(--ext-width)',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: 'var(--spacing-xs)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
          <IconEdit size={18} style={{ color: 'var(--color-primary)' }} />
          <h2
            style={{
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--weight-semibold)',
              color: 'var(--color-text)',
              margin: 0,
            }}
          >
            Quick Note
          </h2>
        </div>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancel"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 'var(--spacing-xl)',
            height: 'var(--spacing-xl)',
            background: 'none',
            border: 'none',
            color: 'var(--color-muted)',
            cursor: 'pointer',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <IconClose size={18} />
        </button>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            padding: 'var(--spacing-xs) var(--spacing-sm)',
            background: 'var(--color-danger)',
            color: 'var(--color-text-inverse)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-sm)',
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label
          style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--weight-medium)',
            color: 'var(--color-text-secondary)',
          }}
        >
          Note
        </label>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={5}
          placeholder="Type your note here... (selected text is auto-filled)"
          autoFocus
          style={{
            width: '100%',
            padding: 'var(--spacing-xs) var(--spacing-sm)',
            borderRadius: 'var(--radius-md)',
            border: error ? '1px solid var(--color-danger)' : '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            fontSize: 'var(--text-sm)',
            lineHeight: 1.5,
            resize: 'vertical',
            fontFamily: 'var(--font-sans)',
            boxSizing: 'border-box',
          }}
        />
        {pageInfo.title && (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>
            From: {pageInfo.title}
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-sm)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-medium)',
              color: 'var(--color-text-secondary)',
            }}
          >
            Topic
          </label>
          <input
            type="text"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="e.g. education, environment"
            style={{
              width: '100%',
              padding: 'var(--spacing-xs) var(--spacing-sm)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              fontSize: 'var(--text-sm)',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-medium)',
              color: 'var(--color-text-secondary)',
            }}
          >
            Skill
          </label>
          <select
            value={skill}
            onChange={e => setSkill(e.target.value)}
            style={{
              width: '100%',
              padding: 'var(--spacing-xs) var(--spacing-sm)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              fontSize: 'var(--text-sm)',
            }}
          >
            {SKILL_OPTIONS.map(s => (
              <option key={s} value={s}>
                {SKILL_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label
          style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--weight-medium)',
            color: 'var(--color-text-secondary)',
          }}
        >
          Tags
        </label>
        <input
          type="text"
          value={tags}
          onChange={e => setTags(e.target.value)}
          placeholder="comma, separated"
          style={{
            width: '100%',
            padding: 'var(--spacing-xs) var(--spacing-sm)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            fontSize: 'var(--text-sm)',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          gap: 'var(--spacing-xs)',
          justifyContent: 'flex-end',
          paddingTop: 'var(--spacing-xs)',
          borderTop: '1px solid var(--color-border)',
        }}
      >
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: 'var(--spacing-sm) var(--spacing-md)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            fontSize: 'var(--text-sm)',
            cursor: 'pointer',
            touchAction: 'manipulation',
            minHeight: '44px',
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          aria-busy={saving}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--spacing-2xs)',
            padding: 'var(--spacing-sm) var(--spacing-lg)',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: saving ? 'var(--color-primary-hover)' : 'var(--color-primary)',
            color: 'var(--color-text-inverse)',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--weight-semibold)',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
            touchAction: 'manipulation',
            minHeight: '44px',
          }}
        >
          <IconCheck size={16} />
          {saving ? 'Saving...' : 'Save Note'}
        </button>
      </div>
    </div>
  )
}
