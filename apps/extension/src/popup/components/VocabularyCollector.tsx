import { useState, useEffect, useCallback } from 'react'
import { extensionVocabSchema } from '../../storage/vocabularyStore'
import type { ExtensionVocabEntry } from '../../storage/vocabularyStore'
import { saveVocabularyEntry } from '../../storage/vocabularyStore'
import { findWord } from '../services/popupDataService'

interface VocabularyCollectorProps {
  onSaved: () => void
  onCancel: () => void
}

interface PageInfo {
  title: string
  url: string
  selectedText: string
}

interface AIDetails {
  meaning: string
  meaningVi: string
  partOfSpeech: string
  pronunciation: string
  exampleSentence: string
  synonyms: string[]
  antonyms: string[]
  collocations: string[]
  wordFamily: string[]
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

async function generateVocabularyDetails(
  word: string,
  sourceSentence: string,
  topic: string,
): Promise<{ data: AIDetails | null; error: string | null }> {
  const config = await getAIProviderConfig()

  if (!config.apiKey) {
    return { data: null, error: 'API key not configured. Go to Settings to add your AI API key.' }
  }

  const systemPrompt = 'You are an IELTS vocabulary expert assistant. Always respond with valid JSON only, no other text.'

  const userPrompt = `Generate detailed IELTS vocabulary information for the word "${word}".

${sourceSentence ? `The word was found in this sentence: "${sourceSentence}"\n` : ''}
${topic ? `Topic: ${topic}\n` : ''}

Respond with valid JSON in this exact format:
{
  "meaning": "Clear English definition suitable for IELTS",
  "meaningVi": "Vietnamese translation of the meaning",
  "partOfSpeech": "e.g. noun, verb, adjective, adverb",
  "pronunciation": "IPA pronunciation like /ˈeksəmpl/",
  "exampleSentence": "An IELTS-style example sentence using the word",
  "synonyms": ["synonym1", "synonym2", "synonym3"],
  "antonyms": ["antonym1", "antonym2"],
  "collocations": ["collocation1 — example", "collocation2 — example"],
  "wordFamily": ["noun form", "verb form", "adjective form"]
}`

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
        max_tokens: 1000,
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

    const details: AIDetails = {
      meaning: parsed.meaning || '',
      meaningVi: parsed.meaningVi || '',
      partOfSpeech: parsed.partOfSpeech || '',
      pronunciation: parsed.pronunciation || '',
      exampleSentence: parsed.exampleSentence || '',
      synonyms: Array.isArray(parsed.synonyms) ? parsed.synonyms : [],
      antonyms: Array.isArray(parsed.antonyms) ? parsed.antonyms : [],
      collocations: Array.isArray(parsed.collocations) ? parsed.collocations : [],
      wordFamily: Array.isArray(parsed.wordFamily) ? parsed.wordFamily : [],
    }

    return { data: details, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
      return { data: null, error: 'Network error. Check your internet connection and API endpoint.' }
    }
    return { data: null, error: `AI request failed: ${message}` }
  }
}

export default function VocabularyCollector({ onSaved, onCancel }: VocabularyCollectorProps) {
  const [pageInfo, setPageInfo] = useState<PageInfo>({ title: '', url: '', selectedText: '' })
  const [word, setWord] = useState('')
  const [sourceSentence, setSourceSentence] = useState('')
  const [topic, setTopic] = useState('')
  const [personalNote, setPersonalNote] = useState('')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | ''>('')
  const [tagsInput, setTagsInput] = useState('')

  const [aiDetails, setAiDetails] = useState<AIDetails | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [existingWord, setExistingWord] = useState<{ word: string; meaning: string } | null>(null)

  const [addToReview, setAddToReview] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0]
      if (!tab.id) return
      chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_INFO' }, (response) => {
        const title = response?.title || tab.title || ''
        const url = response?.url || tab.url || ''
        const selectedText = response?.selectedText || ''
        setPageInfo({ title, url, selectedText })

        if (selectedText) {
          const firstLine = selectedText.split('\n')[0].trim()
          const words = firstLine.split(/\s+/)
          if (words.length <= 5) {
            setWord(firstLine)
            setSourceSentence(selectedText)
          } else {
            setSourceSentence(selectedText)
          }
        }
      })
    })
  }, [])

  useEffect(() => {
    const w = word.trim().toLowerCase()
    if (!w || w.length < 2) {
      setExistingWord(null)
      return
    }
    let cancelled = false
    const timer = setTimeout(async () => {
      const found = await findWord(word.trim())
      if (!cancelled) {
        setExistingWord(found ? { word: found.word, meaning: found.meaning } : null)
      }
    }, 400)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [word])

  const handleEnrich = useCallback(async () => {
    const wordToEnrich = word.trim()
    if (!wordToEnrich) {
      setErrors(prev => ({ ...prev, word: 'Enter a word to enrich' }))
      return
    }

    setAiLoading(true)
    setAiError(null)
    setAiDetails(null)

    const result = await generateVocabularyDetails(wordToEnrich, sourceSentence.trim(), topic.trim())
    if (result.error) {
      setAiError(result.error)
    } else if (result.data) {
      setAiDetails(result.data)
    }
    setAiLoading(false)
  }, [word, sourceSentence, topic])

  const handleSave = async () => {
    const wordTrimmed = word.trim()
    if (!wordTrimmed) {
      setErrors({ word: 'Word is required' })
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
      const entry: ExtensionVocabEntry = extensionVocabSchema.parse({
        id: crypto.randomUUID(),
        word: wordTrimmed,
        sourceSentence: sourceSentence.trim(),
        pageTitle: pageInfo.title,
        pageUrl: pageInfo.url,
        topic: topic.trim(),
        personalNote: personalNote.trim(),
        tags,

        meaning: aiDetails?.meaning || '',
        meaningVi: aiDetails?.meaningVi || '',
        partOfSpeech: aiDetails?.partOfSpeech || '',
        pronunciation: aiDetails?.pronunciation || '',
        exampleSentence: aiDetails?.exampleSentence || '',
        synonyms: aiDetails?.synonyms || [],
        antonyms: aiDetails?.antonyms || [],
        collocations: aiDetails?.collocations || [],
        wordFamily: aiDetails?.wordFamily || [],

        difficulty,
        status: 'new',
        addedToReview: addToReview,
        reviewId: '',

        createdAt: now,
        updatedAt: now,
      })

      await saveVocabularyEntry(entry)

      chrome.storage.local.get(['dailyProgress'], (result) => {
        const current = result.dailyProgress || { wordsAdded: 0, notesAdded: 0, articlesSaved: 0, reviewDue: 0, streak: 0 }
        chrome.storage.local.set({
          dailyProgress: {
            ...current,
            wordsAdded: current.wordsAdded + 1,
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
      <div role="status" aria-label="Vocabulary saved" style={{
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
          Vocabulary saved!
        </div>
        {addToReview && (
          <div style={{ fontSize: '13px', color: 'var(--color-muted)' }}>
            Added to spaced repetition review
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
          📖 Vocabulary Collector
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

      <Field label="Word *">
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={word}
            onChange={e => {
              setWord(e.target.value)
              if (errors.word) setErrors(prev => { const n = { ...prev }; delete n.word; return n })
            }}
            placeholder="e.g. ubiquitous"
            aria-invalid={!!errors.word}
            aria-describedby={errors.word ? 'vocab-word-error' : undefined}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              border: errors.word ? '1px solid var(--color-danger)' : '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              fontSize: '14px',
              fontWeight: 600,
            }}
          />
        </div>
        {errors.word && (
          <span id="vocab-word-error" role="alert" style={{ fontSize: '12px', color: 'var(--color-danger)' }}>{errors.word}</span>
        )}
        {existingWord && (
          <div style={{
            marginTop: '6px',
            padding: '8px 10px',
            background: 'var(--color-surface-alt)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            fontSize: '12px',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.4,
          }}>
            <span style={{ fontWeight: 600 }}>Already saved:</span>{' '}
            {existingWord.word} — {existingWord.meaning}
          </div>
        )}
      </Field>

      <Field label="Source Sentence">
        <textarea
          value={sourceSentence}
          onChange={e => setSourceSentence(e.target.value)}
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
        {pageInfo.title && (
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
        <Field label="Topic">
          <input
            type="text"
            value={topic}
            onChange={e => setTopic(e.target.value)}
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
          placeholder="Why you want to remember this word..."
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

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            🧠 AI Enrichment
          </span>
          {aiDetails && (
            <span style={{ fontSize: '11px', color: 'var(--color-success)' }}>✓ Enriched</span>
          )}
        </div>
        <button
          type="button"
          onClick={handleEnrich}
          disabled={aiLoading || !word.trim()}
          aria-busy={aiLoading}
          style={{
            padding: '6px 14px',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: aiLoading ? 'var(--color-primary-hover)' : 'var(--color-primary)',
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: 600,
            cursor: aiLoading || !word.trim() ? 'not-allowed' : 'pointer',
            opacity: aiLoading || !word.trim() ? 0.7 : 1,
          }}
        >
          {aiLoading ? 'Generating...' : 'Enrich'}
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

      {aiDetails && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          padding: '12px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          background: 'var(--color-surface-alt)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {aiDetails.partOfSpeech && (
              <span style={{
                padding: '1px 6px',
                borderRadius: '4px',
                background: '#dbeafe',
                color: '#1d4ed8',
                fontSize: '11px',
                fontWeight: 600,
              }}>
                {aiDetails.partOfSpeech}
              </span>
            )}
            {aiDetails.pronunciation && (
              <span style={{ fontSize: '12px', color: 'var(--color-muted)', fontFamily: 'monospace' }}>
                {aiDetails.pronunciation}
              </span>
            )}
          </div>

          <div style={{ fontSize: '13px', color: 'var(--color-text)', lineHeight: 1.5 }}>
            <strong>Meaning:</strong> {aiDetails.meaning}
          </div>

          {aiDetails.meaningVi && (
            <div style={{ fontSize: '13px', color: 'var(--color-muted)' }}>
              <strong>Nghĩa:</strong> {aiDetails.meaningVi}
            </div>
          )}

          <div style={{
            padding: '8px 10px',
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '3px solid var(--color-primary)',
            fontSize: '13px',
            color: 'var(--color-text)',
            lineHeight: 1.5,
            fontStyle: 'italic',
          }}>
            “{aiDetails.exampleSentence}”
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {aiDetails.synonyms.length > 0 && (
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-muted)', marginBottom: '4px' }}>
                  Synonyms
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {aiDetails.synonyms.map((s, i) => (
                    <span key={i} style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: '#f0fdf4',
                      color: '#15803d',
                      fontSize: '12px',
                    }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {aiDetails.antonyms.length > 0 && (
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-muted)', marginBottom: '4px' }}>
                  Antonyms
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {aiDetails.antonyms.map((a, i) => (
                    <span key={i} style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: '#fef2f2',
                      color: '#dc2626',
                      fontSize: '12px',
                    }}>
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {aiDetails.collocations.length > 0 && (
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-muted)', marginBottom: '4px' }}>
                Collocations
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {aiDetails.collocations.map((c, i) => (
                  <div key={i} style={{
                    padding: '4px 8px',
                    background: 'var(--color-surface)',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: 'var(--color-text)',
                  }}>
                    {c}
                  </div>
                ))}
              </div>
            </div>
          )}

          {aiDetails.wordFamily.length > 0 && (
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-muted)', marginBottom: '4px' }}>
                Word Family
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {aiDetails.wordFamily.map((wf, i) => (
                  <span key={i} style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: '#f3e8ff',
                    color: '#7c3aed',
                    fontSize: '12px',
                  }}>
                    {wf}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <label style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        cursor: 'pointer',
        padding: '6px 0',
      }}>
        <input
          type="checkbox"
          checked={addToReview}
          onChange={e => setAddToReview(e.target.checked)}
          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
        />
        <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          Add to spaced repetition review
        </span>
      </label>

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
          disabled={saving || !word.trim()}
          style={{
            padding: '8px 20px',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: saving || !word.trim() ? 'var(--color-primary-hover)' : 'var(--color-primary)',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: 600,
            cursor: saving || !word.trim() ? 'not-allowed' : 'pointer',
            opacity: saving || !word.trim() ? 0.7 : 1,
          }}
        >
          {saving ? 'Saving...' : 'Save Vocabulary'}
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
