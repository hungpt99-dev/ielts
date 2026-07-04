import { useState, useEffect, useCallback } from 'react'
import { extensionVocabSchema } from '../../storage/vocabularyStore'
import type { ExtensionVocabEntry } from '../../storage/vocabularyStore'
import { saveVocabularyEntry } from '../../storage/vocabularyStore'

interface QuickAddVocabProps {
  onSaved: () => void
  onCancel: () => void
}

interface QuickVocabForm {
  word: string
  sourceSentence: string
  topic: string
  tags: string
}

interface FormErrors {
  word?: string
  submit?: string
}

function validateForm(form: QuickVocabForm): FormErrors {
  const errors: FormErrors = {}
  if (!form.word.trim()) {
    errors.word = 'Word is required'
  }
  return errors
}

export default function QuickAddVocab({ onSaved, onCancel }: QuickAddVocabProps) {
  const [form, setForm] = useState<QuickVocabForm>({
    word: '',
    sourceSentence: '',
    topic: '',
    tags: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0]
      if (!tab.id) return
      chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_INFO' }, (response) => {
        const selectedText = response?.selectedText || ''
        if (selectedText) {
          const firstLine = selectedText.split('\n')[0].trim()
          const words = firstLine.split(/\s+/)
          setForm((prev) => ({
            ...prev,
            word: words.length <= 5 ? firstLine : '',
            sourceSentence: selectedText,
          }))
        }
      })
    })
  }, [])

  const handleChange = useCallback(
    <K extends keyof QuickVocabForm>(field: K, value: QuickVocabForm[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }))
      if (field === 'word' && value) {
        setErrors((prev) => {
          const { word: _, ...rest } = prev
          return rest
        })
      }
    },
    [],
  )

  const handleSave = useCallback(async () => {
    const validation = validateForm(form)
    if (validation.word) {
      setErrors(validation)
      return
    }

    setSaving(true)
    setErrors({})

    try {
      const tags = form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)

      const now = new Date().toISOString()
      const entry: ExtensionVocabEntry = extensionVocabSchema.parse({
        id: crypto.randomUUID(),
        word: form.word.trim(),
        sourceSentence: form.sourceSentence.trim(),
        topic: form.topic.trim(),
        tags,
        difficulty: '',
        status: 'new',
        addedToReview: true,
        reviewId: '',
        createdAt: now,
        updatedAt: now,
      })

      await saveVocabularyEntry(entry)

      chrome.storage.local.get(['dailyProgress'], (result) => {
        const current = result.dailyProgress || {
          wordsAdded: 0,
          notesAdded: 0,
          articlesSaved: 0,
          reviewDue: 0,
          streak: 0,
        }
        chrome.storage.local.set({
          dailyProgress: { ...current, wordsAdded: current.wordsAdded + 1 },
        })
      })

      setSaved(true)
      setTimeout(() => onSaved(), 1200)
    } catch {
      setErrors({ submit: 'Failed to save. Please try again.' })
    } finally {
      setSaving(false)
    }
  }, [form, onSaved])

  if (saved) {
    return (
      <div
        role="status"
        aria-label="Vocabulary saved"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 24px',
          gap: '12px',
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
            color: '#fff',
          }}
        >
          ✓
        </div>
        <div
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--color-text)',
          }}
        >
          Vocabulary saved!
        </div>
        <div style={{ fontSize: '13px', color: 'var(--color-muted)' }}>
          Added to spaced repetition review
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 0 8px',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <h2
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--color-text)',
            margin: 0,
          }}
        >
          Quick Add Vocabulary
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
        <div
          role="alert"
          style={{
            padding: '8px 12px',
            background: 'var(--color-danger)',
            color: '#fff',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
          }}
        >
          {errors.submit}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label
          style={{
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--color-text-secondary)',
          }}
        >
          Word *
        </label>
        <input
          type="text"
          value={form.word}
          onChange={(e) => handleChange('word', e.target.value)}
          placeholder="e.g. ubiquitous"
          aria-invalid={!!errors.word}
          aria-describedby={errors.word ? 'quick-word-error' : undefined}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: 'var(--radius-md)',
            border: errors.word
              ? '1px solid var(--color-danger)'
              : '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            fontSize: '14px',
            fontWeight: 600,
          }}
        />
        {errors.word && (
          <span
            id="quick-word-error"
            role="alert"
            style={{ fontSize: '12px', color: 'var(--color-danger)' }}
          >
            {errors.word}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label
          style={{
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--color-text-secondary)',
          }}
        >
          Source Sentence
        </label>
        <textarea
          value={form.sourceSentence}
          onChange={(e) => handleChange('sourceSentence', e.target.value)}
          rows={2}
          placeholder="Sentence where you found this word..."
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

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
            }}
          >
            Topic
          </label>
          <input
            type="text"
            value={form.topic}
            onChange={(e) => handleChange('topic', e.target.value)}
            placeholder="e.g. education"
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
          <label
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
            }}
          >
            Tags
          </label>
          <input
            type="text"
            value={form.tags}
            onChange={(e) => handleChange('tags', e.target.value)}
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

      <div
        style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'flex-end',
          paddingTop: '8px',
          borderTop: '1px solid var(--color-border)',
        }}
      >
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
          type="button"
          onClick={handleSave}
          disabled={saving || !form.word.trim()}
          style={{
            padding: '8px 20px',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background:
              saving || !form.word.trim()
                ? 'var(--color-primary-hover)'
                : 'var(--color-primary)',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: 600,
            cursor: saving || !form.word.trim() ? 'not-allowed' : 'pointer',
            opacity: saving || !form.word.trim() ? 0.7 : 1,
          }}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  )
}
