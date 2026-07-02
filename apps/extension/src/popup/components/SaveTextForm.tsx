import { useState, useEffect } from 'react'
import { entryFormSchema, entrySchema } from '../../types'
import type { EntryFormData } from '../../types'
import { SAVE_CATEGORIES, CATEGORY_LABELS, CATEGORY_COLORS, CATEGORY_ICONS, SKILL_OPTIONS, SKILL_LABELS } from '../../types'
import { saveEntry } from '../../storage/indexedDB'

interface SaveTextFormProps {
  onSaved: () => void
  onCancel: () => void
}

export default function SaveTextForm({ onSaved, onCancel }: SaveTextFormProps) {
  const [pageInfo, setPageInfo] = useState<{ title: string; url: string; selectedText: string }>({
    title: '',
    url: '',
    selectedText: '',
  })
  const [form, setForm] = useState<EntryFormData>({
    text: '',
    category: 'vocabulary',
    topic: '',
    skill: 'general',
    difficulty: '',
    tags: '',
    personalNote: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0]
      if (!tab.id) return
      chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_INFO' }, (response) => {
        if (response) {
          setPageInfo({
            title: response.title || tab.title || '',
            url: response.url || tab.url || '',
            selectedText: response.selectedText || '',
          })
          if (response.selectedText) {
            setForm(prev => ({ ...prev, text: response.selectedText }))
          }
        } else {
          setPageInfo({
            title: tab.title || '',
            url: tab.url || '',
            selectedText: '',
          })
        }
      })
    })
  }, [])

  const validateField = (field: string, value: string) => {
    if (field === 'text' && !value.trim()) {
      return 'Text is required'
    }
    if (field === 'tags' && value.length > 200) {
      return 'Tags too long'
    }
    return ''
  }

  const handleChange = (field: keyof EntryFormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    const err = validateField(field, value)
    setErrors(prev => {
      const next = { ...prev }
      if (err) next[field] = err
      else delete next[field]
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const textErr = validateField('text', form.text)
    if (textErr) {
      setErrors({ text: textErr })
      return
    }

    const result = entryFormSchema.safeParse(form)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        fieldErrors[issue.path[0] as string] = issue.message
      }
      setErrors(fieldErrors)
      return
    }

    setSaving(true)
    try {
      const tags = form.tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean)

      const now = new Date().toISOString()
      const entry = entrySchema.parse({
        id: crypto.randomUUID(),
        text: form.text,
        category: form.category,
        topic: form.topic,
        skill: form.skill,
        difficulty: form.difficulty,
        tags,
        personalNote: form.personalNote,
        pageTitle: pageInfo.title,
        pageUrl: pageInfo.url,
        status: 'new',
        createdAt: now,
        updatedAt: now,
      })

      await saveEntry(entry)

      chrome.storage.local.get(['dailyProgress'], (result) => {
        const current = result.dailyProgress || { wordsAdded: 0, notesAdded: 0, articlesSaved: 0, reviewDue: 0, streak: 0 }
        const updated = {
          ...current,
          wordsAdded: current.wordsAdded + (form.category === 'vocabulary' ? 1 : 0),
        }
        chrome.storage.local.set({ dailyProgress: updated })
      })

      setSaved(true)
      setTimeout(() => onSaved(), 1200)
    } catch (err) {
      setErrors({ submit: 'Failed to save. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  if (saved) {
    return (
      <div role="status" aria-label="Saved successfully" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        gap: '12px',
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'var(--color-success)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
          color: '#fff',
        }}>
          ✓
        </div>
        <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)' }}>
          Saved successfully!
        </div>
        <div style={{ fontSize: '13px', color: 'var(--color-muted)' }}>
          {CATEGORY_LABELS[form.category]}
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Save text form" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 0 8px',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <h2 style={{
          fontSize: '16px',
          fontWeight: 600,
          color: 'var(--color-text)',
          margin: 0,
        }}>
          Save to IELTS Journey
        </h2>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancel"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-muted)',
            cursor: 'pointer',
            fontSize: '18px',
            padding: '4px',
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      </div>

      {errors.submit && (
        <div role="alert" style={{
          padding: '8px 12px',
          background: 'var(--color-danger)',
          color: '#fff',
          borderRadius: 'var(--radius-md)',
          fontSize: '13px',
        }}>
          {errors.submit}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
          Selected Text
        </label>
        <textarea
          value={form.text}
          onChange={e => handleChange('text', e.target.value)}
          rows={3}
          aria-invalid={!!errors.text}
          aria-describedby={errors.text ? 'text-error' : undefined}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: 'var(--radius-md)',
            border: errors.text ? '1px solid var(--color-danger)' : '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            fontSize: '13px',
            lineHeight: 1.5,
            resize: 'vertical',
            fontFamily: 'var(--font-sans)',
          }}
        />
        {errors.text && (
          <span id="text-error" role="alert" style={{ fontSize: '12px', color: 'var(--color-danger)' }}>{errors.text}</span>
        )}
        {pageInfo.title && (
          <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
            From: {pageInfo.title}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
          Category
        </label>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '6px',
        }}>
          {SAVE_CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => handleChange('category', cat)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 10px',
                borderRadius: 'var(--radius-md)',
                border: form.category === cat
                  ? `2px solid ${CATEGORY_COLORS[cat]}`
                  : '1px solid var(--color-border)',
                background: form.category === cat ? 'var(--color-primary-light)' : 'var(--color-surface)',
                color: 'var(--color-text)',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s',
                textAlign: 'left',
              }}
            >
              <span>{CATEGORY_ICONS[cat]}</span>
              <span>{CATEGORY_LABELS[cat]}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
            Topic
          </label>
          <input
            type="text"
            value={form.topic}
            onChange={e => handleChange('topic', e.target.value)}
            placeholder="e.g. education, environment"
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              fontSize: '13px',
            }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
            Skill
          </label>
          <select
            value={form.skill}
            onChange={e => handleChange('skill', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              fontSize: '13px',
            }}
          >
            {SKILL_OPTIONS.map(s => (
              <option key={s} value={s}>{SKILL_LABELS[s]}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
            Difficulty
          </label>
          <select
            value={form.difficulty}
            onChange={e => handleChange('difficulty', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              fontSize: '13px',
            }}
          >
            <option value="">Not specified</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
            Tags
          </label>
          <input
            type="text"
            value={form.tags}
            onChange={e => handleChange('tags', e.target.value)}
            placeholder="comma, separated"
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              fontSize: '13px',
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
          Personal Note
        </label>
        <textarea
          value={form.personalNote}
          onChange={e => handleChange('personalNote', e.target.value)}
          rows={2}
          placeholder="Add a personal note..."
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            fontSize: '13px',
            lineHeight: 1.5,
            resize: 'vertical',
            fontFamily: 'var(--font-sans)',
          }}
        />
      </div>

      <div style={{
        display: 'flex',
        gap: '8px',
        justifyContent: 'flex-end',
        paddingTop: '8px',
        borderTop: '1px solid var(--color-border)',
      }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          aria-busy={saving}
          style={{
            padding: '8px 20px',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: saving ? 'var(--color-primary-hover)' : 'var(--color-primary)',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  )
}
