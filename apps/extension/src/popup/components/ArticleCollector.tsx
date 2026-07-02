import { useState, useEffect, useCallback } from 'react'
import { extensionArticleSchema, saveArticleEntry, IELTS_TOPICS } from '../../storage/articleStore'
import type { ExtensionArticleEntry, ArticleQuestion } from '../../storage/articleStore'

interface ArticleCollectorProps {
  onSaved: () => void
  onCancel: () => void
  viewArticleId?: string
}

interface PageInfo {
  title: string
  url: string
  selectedText: string
}

async function getAIProviderConfig(): Promise<{
  apiKey: string
  baseUrl: string
  model: string
}> {
  const [syncResult, localResult] = await Promise.all([
    new Promise<any>(r => chrome.storage.sync.get(['extensionSettings'], r)),
    new Promise<any>(r => chrome.storage.local.get(['aiApiKey'], r)),
  ])
  const settings = syncResult.extensionSettings || {}
  return {
    apiKey: localResult.aiApiKey || '',
    baseUrl: settings.aiBaseUrl || 'https://api.openai.com/v1',
    model: settings.aiModel || 'gpt-4o-mini',
  }
}

async function generateQuestions(
  content: string,
  title: string,
  topic: string,
): Promise<{ data: ArticleQuestion[] | null; error: string | null }> {
  const config = await getAIProviderConfig()

  if (!config.apiKey) {
    return { data: null, error: 'API key not configured. Go to Settings to add your AI API key.' }
  }

  const systemPrompt = 'You are an IELTS exam question writer. Always respond with valid JSON only, no other text.'

  const userPrompt = `Generate 3-5 IELTS-style questions based on the following article.

Article Title: "${title}"
${topic ? `Topic: ${topic}\n` : ''}
Article Content:
${content}

Respond with valid JSON in this exact format:
{
  "questions": [
    {
      "type": "multiple-choice" | "true-false" | "short-answer" | "gap-fill" | "matching",
      "question": "The question text",
      "passage": "Relevant passage from the article if needed",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "The correct answer",
      "explanation": "Explanation of why this is correct with reference to the article",
      "skill": "reading",
      "difficulty": "easy" | "medium" | "hard",
      "bandScore": "Estimated IELTS band score range, e.g. 5.0-6.0"
    }
  ]
}

Requirements:
- Questions must be based on actual article content
- Mix of question types
- Realistic IELTS difficulty
- Clear explanations referencing the text`

  const url = `${config.baseUrl.replace(/\/+$/, '')}/chat/completions`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.5,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      if (response.status === 401) return { data: null, error: 'Invalid API key. Check your key in Settings.' }
      if (response.status === 429) return { data: null, error: 'Rate limit exceeded. Wait a moment and try again.' }
      return { data: null, error: `AI API error (${response.status})` }
    }

    const json = await response.json()
    const content: string = json.choices?.[0]?.message?.content || ''
    if (!content) return { data: null, error: 'AI returned an empty response.' }

    const jsonStart = content.indexOf('{')
    const jsonEnd = content.lastIndexOf('}')
    if (jsonStart === -1 || jsonEnd === -1) {
      return { data: null, error: 'AI response was not valid JSON.' }
    }

    const parsed = JSON.parse(content.slice(jsonStart, jsonEnd + 1))
    const questions = parsed.questions
    if (!Array.isArray(questions) || questions.length === 0) {
      return { data: null, error: 'AI response had unexpected format. Try again.' }
    }

    return { data: questions as ArticleQuestion[], error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
      return { data: null, error: 'Network error. Check your internet connection and API endpoint.' }
    }
    return { data: null, error: `AI request failed: ${message}` }
  }
}

export default function ArticleCollector({ onSaved, onCancel }: ArticleCollectorProps) {
  const [pageInfo, setPageInfo] = useState<PageInfo>({ title: '', url: '', selectedText: '' })
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [selectedParagraph, setSelectedParagraph] = useState('')
  const [topic, setTopic] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [personalNote, setPersonalNote] = useState('')
  const [isReadingPractice, setIsReadingPractice] = useState(true)
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | ''>('')

  const [aiQuestions, setAiQuestions] = useState<ArticleQuestion[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [showQuestions, setShowQuestions] = useState(false)

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0]
      if (!tab.id) return
      chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_INFO' }, (response) => {
        const pageTitle = response?.title || tab.title || ''
        const pageUrl = response?.url || tab.url || ''
        const selectedText = response?.selectedText || ''
        setPageInfo({ title: pageTitle, url: pageUrl, selectedText })
        setTitle(pageTitle)
        if (selectedText) {
          setSelectedParagraph(selectedText)
        }
      })
    })
  }, [])

  const handleGenerateQuestions = useCallback(async () => {
    const textToUse = selectedParagraph || content || pageInfo.title
    if (!textToUse.trim()) {
      setAiError('Add article content first before generating questions.')
      return
    }

    setAiLoading(true)
    setAiError(null)

    const result = await generateQuestions(
      selectedParagraph || content,
      title || pageInfo.title,
      topic,
    )
    if (result.error) {
      setAiError(result.error)
    } else if (result.data) {
      setAiQuestions(result.data)
    }
    setAiLoading(false)
  }, [selectedParagraph, content, title, pageInfo.title, pageInfo.url, topic])

  const handleSave = async () => {
    const titleTrimmed = title.trim()
    if (!titleTrimmed) {
      setErrors({ title: 'Title is required' })
      return
    }

    setSaving(true)
    setErrors({})

    try {
      const tags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean)

      const now = new Date().toISOString()
      const entry: ExtensionArticleEntry = extensionArticleSchema.parse({
        id: crypto.randomUUID(),
        title: titleTrimmed,
        url: pageInfo.url,
        content: content.trim(),
        selectedParagraph: selectedParagraph.trim(),
        topic: topic.trim(),
        tags,
        personalNote: personalNote.trim(),
        isReadingPractice,
        difficulty,

        aiQuestions,
        aiQuestionsGeneratedAt: aiQuestions.length > 0 ? now : undefined,

        status: 'new',
        createdAt: now,
        updatedAt: now,
      })

      await saveArticleEntry(entry)

      chrome.storage.local.get(['dailyProgress'], (result) => {
        const current = result.dailyProgress || { wordsAdded: 0, notesAdded: 0, articlesSaved: 0, reviewDue: 0, streak: 0 }
        chrome.storage.local.set({
          dailyProgress: {
            ...current,
            articlesSaved: current.articlesSaved + 1,
          },
        })
      })

      setSaved(true)
      setTimeout(() => onSaved(), 1200)
    } catch {
      setErrors({ submit: 'Failed to save. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  if (saved) {
    return (
      <div role="status" aria-label="Article saved" style={{
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
          Article saved!
        </div>
        {aiQuestions.length > 0 && (
          <div style={{ fontSize: '13px', color: 'var(--color-muted)' }}>
            {aiQuestions.length} IELTS questions generated
          </div>
        )}
        {isReadingPractice && (
          <div style={{ fontSize: '13px', color: 'var(--color-muted)' }}>
            Marked as Reading practice
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{
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
          📰 Article Collector
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
        <div style={{
          padding: '8px 12px',
          background: 'var(--color-danger)',
          color: '#fff',
          borderRadius: 'var(--radius-md)',
          fontSize: '13px',
        }}>
          {errors.submit}
        </div>
      )}

      <Field label="Title *">
        <input
          type="text"
          value={title}
          onChange={e => {
            setTitle(e.target.value)
            if (errors.title) setErrors(prev => { const n = { ...prev }; delete n.title; return n })
          }}
          placeholder="Article title"
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: 'var(--radius-md)',
            border: errors.title ? '1px solid var(--color-danger)' : '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            fontSize: '14px',
            fontWeight: 600,
          }}
        />
        {errors.title && (
          <span style={{ fontSize: '12px', color: 'var(--color-danger)' }}>{errors.title}</span>
        )}
      </Field>

      <Field label="Full Article Content">
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={4}
          placeholder="Paste or type the full article content here..."
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
      </Field>

      <Field label="Selected Paragraph">
        <textarea
          value={selectedParagraph}
          onChange={e => setSelectedParagraph(e.target.value)}
          rows={2}
          placeholder="Selected text from the page (auto-populated)"
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
        {pageInfo.title && !content.trim() && (
          <span style={{ fontSize: '11px', color: 'var(--color-muted)', marginTop: '2px' }}>
            From: {pageInfo.title}
          </span>
        )}
      </Field>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
      }}>
        <Field label="IELTS Topic">
          <select
            value={topic}
            onChange={e => setTopic(e.target.value)}
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
            <option value="">Select topic</option>
            {IELTS_TOPICS.map(t => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Difficulty">
          <select
            value={difficulty}
            onChange={e => setDifficulty(e.target.value as typeof difficulty)}
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
        </Field>
      </div>

      <Field label="Tags">
        <input
          type="text"
          value={tagsInput}
          onChange={e => setTagsInput(e.target.value)}
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
      </Field>

      <Field label="Personal Note">
        <textarea
          value={personalNote}
          onChange={e => setPersonalNote(e.target.value)}
          rows={2}
          placeholder="Why you want to save this article..."
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
      </Field>

      <label style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        cursor: 'pointer',
        padding: '8px 12px',
        borderRadius: 'var(--radius-md)',
        border: isReadingPractice ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
        background: isReadingPractice ? 'var(--color-surface-alt)' : 'var(--color-surface)',
      }}>
        <input
          type="checkbox"
          checked={isReadingPractice}
          onChange={e => setIsReadingPractice(e.target.checked)}
          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
        />
        <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          📖 Mark as Reading practice material
        </span>
      </label>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '12px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              🧠 AI Question Generation
            </span>
            {aiQuestions.length > 0 && (
              <span style={{ fontSize: '11px', color: 'var(--color-success)' }}>
                {aiQuestions.length} questions ready
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleGenerateQuestions}
            disabled={aiLoading}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: aiLoading ? 'var(--color-primary-hover)' : 'var(--color-primary)',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 600,
              cursor: aiLoading ? 'not-allowed' : 'pointer',
              opacity: aiLoading ? 0.7 : 1,
            }}
          >
            {aiLoading ? 'Generating...' : 'Generate Questions'}
          </button>
        </div>

        {aiError && (
          <div style={{
            padding: '8px 12px',
            background: '#fef2f2',
            borderRadius: 'var(--radius-md)',
            fontSize: '12px',
            color: '#dc2626',
            border: '1px solid #fecaca',
          }}>
            {aiError}
            {aiError.includes('API key') && (
              <button
                type="button"
                onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('options.html') })}
                style={{
                  marginLeft: '8px',
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  cursor: 'pointer',
                  fontSize: '12px',
                  textDecoration: 'underline',
                }}
              >
                Open Settings
              </button>
            )}
          </div>
        )}

        {aiQuestions.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setShowQuestions(!showQuestions)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-primary)',
                cursor: 'pointer',
                fontSize: '12px',
                padding: '4px 0',
                textDecoration: 'underline',
              }}
            >
              {showQuestions ? 'Hide questions' : `View ${aiQuestions.length} generated questions`}
            </button>

            {showQuestions && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginTop: '8px',
              }}>
                {aiQuestions.map((q, i) => (
                  <div key={i} style={{
                    padding: '10px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-surface-alt)',
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginBottom: '6px',
                    }}>
                      <span style={{
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: '#dbeafe',
                        color: '#1d4ed8',
                        fontSize: '10px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                      }}>
                        {q.type}
                      </span>
                      <span style={{
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: q.difficulty === 'hard' ? '#fef2f2' : q.difficulty === 'medium' ? '#fffbeb' : '#f0fdf4',
                        color: q.difficulty === 'hard' ? '#dc2626' : q.difficulty === 'medium' ? '#d97706' : '#15803d',
                        fontSize: '10px',
                        fontWeight: 600,
                      }}>
                        {q.difficulty}
                      </span>
                      {q.bandScore && (
                        <span style={{
                          fontSize: '10px',
                          color: 'var(--color-muted)',
                        }}>
                          Band {q.bandScore}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--color-text)', fontWeight: 500, marginBottom: '4px' }}>
                      {i + 1}. {q.question}
                    </div>
                    {q.passage && (
                      <div style={{
                        fontSize: '11px',
                        color: 'var(--color-muted)',
                        fontStyle: 'italic',
                        padding: '4px 8px',
                        borderLeft: '2px solid var(--color-border)',
                        marginBottom: '4px',
                      }}>
                        {q.passage}
                      </div>
                    )}
                    {q.options && q.options.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '4px' }}>
                        {q.options.map((opt, oi) => (
                          <div key={oi} style={{
                            fontSize: '12px',
                            color: 'var(--color-text-secondary)',
                            padding: '2px 4px',
                          }}>
                            {String.fromCharCode(65 + oi)}. {opt}
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ fontSize: '12px', color: 'var(--color-success)', marginTop: '4px' }}>
                      ✓ {q.correctAnswer}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-muted)', marginTop: '2px' }}>
                      {q.explanation}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
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
          type="button"
          onClick={handleSave}
          disabled={saving || !title.trim()}
          style={{
            padding: '8px 20px',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: saving || !title.trim() ? 'var(--color-primary-hover)' : 'var(--color-primary)',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: 600,
            cursor: saving || !title.trim() ? 'not-allowed' : 'pointer',
            opacity: saving || !title.trim() ? 0.7 : 1,
          }}
        >
          {saving ? 'Saving...' : 'Save Article'}
        </button>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
        {label}
      </label>
      {children}
    </div>
  )
}
