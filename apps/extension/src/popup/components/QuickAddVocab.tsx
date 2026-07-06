import { useState, useEffect, useCallback } from 'react'
import { extensionVocabSchema } from '../../storage/vocabularyStore'
import type { ExtensionVocabEntry } from '../../storage/vocabularyStore'
import { saveVocabularyEntry } from '../../storage/vocabularyStore'
import { incrementDailyProgress } from '../../services/storage'
import { IconCheck, IconClose } from '@ielts/ui'

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
        if (chrome.runtime.lastError) return
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
      await incrementDailyProgress('wordsAdded', 1)

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
          padding: 'var(--spacing-2xl) var(--spacing-lg)',
          gap: 'var(--spacing-sm)',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: 'var(--radius-full)',
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
          Vocabulary saved!
        </div>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)' }}>
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
        gap: 'var(--spacing-md)',
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
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--weight-semibold)',
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

      {errors.submit && (
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
          {errors.submit}
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
            padding: 'var(--spacing-xs) var(--spacing-sm)',
            borderRadius: 'var(--radius-md)',
            border: errors.word
              ? '1px solid var(--color-danger)'
              : '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--weight-semibold)',
          }}
        />
        {errors.word && (
          <span
            id="quick-word-error"
            role="alert"
            style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)' }}
          >
            {errors.word}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label
          style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--weight-medium)',
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
            padding: 'var(--spacing-xs) var(--spacing-sm)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            fontSize: 'var(--text-sm)',
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
          gap: 'var(--spacing-sm)',
        }}
      >
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
            value={form.topic}
            onChange={(e) => handleChange('topic', e.target.value)}
            placeholder="e.g. education"
            style={{
              width: '100%',
              padding: 'var(--spacing-xs) var(--spacing-sm)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              fontSize: 'var(--text-sm)',
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
            Tags
          </label>
          <input
            type="text"
            value={form.tags}
            onChange={(e) => handleChange('tags', e.target.value)}
            placeholder="comma, separated"
            style={{
              width: '100%',
              padding: 'var(--spacing-xs) var(--spacing-sm)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              fontSize: 'var(--text-sm)',
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
            padding: 'var(--spacing-xs) var(--spacing-md)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            fontSize: 'var(--text-sm)',
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
            padding: 'var(--spacing-xs) var(--spacing-lg)',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background:
              saving || !form.word.trim()
                ? 'var(--color-primary-hover)'
                : 'var(--color-primary)',
            color: 'var(--color-text-inverse)',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--weight-semibold)',
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
