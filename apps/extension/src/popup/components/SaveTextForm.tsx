import { useState, useEffect } from 'react'
import { entryFormSchema, entrySchema } from '../../types'
import type { EntryFormData } from '../../types'
import { SAVE_CATEGORIES, CATEGORY_LABELS, CATEGORY_COLORS, SKILL_OPTIONS, SKILL_LABELS } from '../../types'
import { CategoryIcon } from '../../components/CategoryIcon'
import { saveEntry } from '../../storage/indexedDB'
import { incrementDailyProgress } from '../../services/storage'
import { saveVocabularyEntry, type ExtensionVocabEntry } from '../../storage/vocabularyStore'
import { saveArticleEntry, extensionArticleSchema } from '../../storage/articleStore'
import { IconClose, IconCheck } from '@ielts/ui'

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

  useEffect(() => {
    import('../../background/settingsStorage').then(({ loadSettings }) => {
      loadSettings().then((s) => {
        setForm(prev => ({
          ...prev,
          category: s.defaultCategory || 'vocabulary',
          topic: s.defaultTopic || '',
        }))
      }).catch(() => {})
    }).catch(() => {})
  }, [])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0]
      if (!tab.id) return
      chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_INFO' }, (response) => {
        if (chrome.runtime.lastError) {
          setPageInfo({
            title: tab.title || '',
            url: tab.url || '',
            selectedText: '',
          })
          return
        }
        setPageInfo({
          title: response?.title || tab.title || '',
          url: response?.url || tab.url || '',
          selectedText: response?.selectedText || '',
        })
        if (response?.selectedText) {
          setForm(prev => ({ ...prev, text: response.selectedText }))
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
      const sharedId = crypto.randomUUID()
      const entry = entrySchema.parse({
        id: sharedId,
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

      if (form.category === 'vocabulary') {
        const vocabEntry: ExtensionVocabEntry = {
          id: sharedId,
          word: form.text.split(/\s+/)[0].replace(/[.,!?;:'"()\-]/g, ''),
          sourceSentence: form.text,
          pageTitle: pageInfo.title,
          pageUrl: pageInfo.url,
          topic: form.topic,
          personalNote: form.personalNote,
          tags,
          meaning: '',
          translation: '',
          partOfSpeech: '',
          pronunciation: '',
          exampleSentence: '',
          synonyms: [],
          antonyms: [],
          collocations: [],
          wordFamily: [],
          difficulty: form.difficulty as ExtensionVocabEntry['difficulty'],
          status: 'new',
          addedToReview: true,
          reviewId: '',
          createdAt: now,
          updatedAt: now,
        }
        await saveVocabularyEntry(vocabEntry).catch(() => {})
      }

      if (form.category === 'reading' && form.text.trim().length > 50) {
        try {
          const articleEntry = extensionArticleSchema.parse({
            id: crypto.randomUUID(),
            title: pageInfo.title || form.text.slice(0, 80),
            url: pageInfo.url,
            content: form.text,
            selectedParagraph: form.text,
            topic: form.topic,
            tags,
            personalNote: form.personalNote,
            isReadingPractice: true,
            difficulty: form.difficulty,
            status: 'new',
            createdAt: now,
            updatedAt: now,
          })
          await saveArticleEntry(articleEntry)
        } catch (error) {
          console.error('apps/extension/src/popup/components/SaveTextForm.tsx error:', error);
          /* non-critical: article entry saved as learning entry already */
        }
      }

      await incrementDailyProgress(
        form.category === 'vocabulary' ? 'wordsAdded' : 'notesAdded',
        1,
      )

      setSaved(true)
      setTimeout(() => onSaved(), 1200)
    } catch (err) {
      console.error('apps/extension/src/popup/components/SaveTextForm.tsx error:', err);
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
        padding: 'var(--spacing-2xl) var(--spacing-lg)',
        gap: 'var(--spacing-sm)',
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
          color: 'var(--color-text-inverse)',
        }}>
          <IconCheck size={28} />
        </div>
        <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)' }}>
          Saved successfully!
        </div>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)' }}>
          {CATEGORY_LABELS[form.category]}
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Save text form" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--spacing-md)',
      padding: 'var(--spacing-md)',
      width: 'var(--ext-width)',
      boxSizing: 'border-box',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 0 var(--spacing-xs)',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <h2 style={{
          fontSize: 'var(--text-base)',
          fontWeight: 'var(--weight-semibold)',
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
        <div role="alert" style={{
          padding: 'var(--spacing-xs) var(--spacing-sm)',
          background: 'var(--color-danger)',
          color: 'var(--color-text-inverse)',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--text-sm)',
        }}>
          {errors.submit}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)' }}>
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
            padding: 'var(--spacing-xs) var(--spacing-sm)',
            borderRadius: 'var(--radius-md)',
            border: errors.text ? '1px solid var(--color-danger)' : '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            fontSize: 'var(--text-sm)',
            lineHeight: 1.5,
            resize: 'vertical',
            fontFamily: 'var(--font-sans)',
          }}
        />
        {errors.text && (
          <span id="text-error" role="alert" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)' }}>{errors.text}</span>
        )}
        {pageInfo.title && (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>
            From: {pageInfo.title}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)' }}>
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
                padding: 'var(--spacing-xs) var(--spacing-sm)',
                borderRadius: 'var(--radius-md)',
                border: form.category === cat
                  ? `2px solid ${CATEGORY_COLORS[cat]}`
                  : '1px solid var(--color-border)',
                background: form.category === cat ? 'var(--color-primary-light)' : 'var(--color-surface)',
                color: 'var(--color-text)',
                fontSize: 'var(--text-xs)',
                cursor: 'pointer',
                transition: 'var(--transition-fast)',
                textAlign: 'left',
              }}
            >
              <CategoryIcon category={cat} size={16} />
              <span>{CATEGORY_LABELS[cat]}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'var(--spacing-sm)',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)' }}>
            Topic
          </label>
          <input
            type="text"
            value={form.topic}
            onChange={e => handleChange('topic', e.target.value)}
            placeholder="e.g. education, environment"
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
          <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)' }}>
            Skill
          </label>
          <select
            value={form.skill}
            onChange={e => handleChange('skill', e.target.value)}
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
              <option key={s} value={s}>{SKILL_LABELS[s]}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'var(--spacing-sm)',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)' }}>
            Difficulty
          </label>
          <select
            value={form.difficulty}
            onChange={e => handleChange('difficulty', e.target.value)}
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
            <option value="">Not specified</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)' }}>
            Tags
          </label>
          <input
            type="text"
            value={form.tags}
            onChange={e => handleChange('tags', e.target.value)}
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)' }}>
          Personal Note
        </label>
        <textarea
          value={form.personalNote}
          onChange={e => handleChange('personalNote', e.target.value)}
          rows={2}
          placeholder="Add a personal note..."
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

      <div style={{
        display: 'flex',
        gap: 'var(--spacing-xs)',
        justifyContent: 'flex-end',
        paddingTop: 'var(--spacing-xs)',
        borderTop: '1px solid var(--color-border)',
      }}>
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
          type="submit"
          disabled={saving}
          aria-busy={saving}
          style={{
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
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  )
}
