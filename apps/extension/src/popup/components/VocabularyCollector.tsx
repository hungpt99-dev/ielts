import { useState, useEffect, useCallback } from 'react'
import { extensionVocabSchema } from '../../storage/vocabularyStore'
import type { ExtensionVocabEntry } from '../../storage/vocabularyStore'
import { saveVocabularyEntry } from '../../storage/vocabularyStore'
import { findWord } from '../services/popupDataService'
import { saveEntry } from '../../storage/indexedDB'
import { incrementDailyProgress } from '../../services/storage'
import { MESSAGE_TYPES, STORAGE_KEYS, PROGRESS_KEYS } from '../../storage/db'
import { IconVocabulary, IconClose, IconCheck, IconVolume } from '@ielts/ui'
import type { LearningEntry } from '../../types'
import { pushSync } from '../../services/syncManager'

function speakWord(word: string) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(word)
    utterance.lang = 'en-US'
    utterance.rate = 0.85
    window.speechSynthesis.speak(utterance)
  }
}

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

function generateId(): string {
  try {
    return crypto.randomUUID()
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}-${Math.random().toString(36).slice(2, 11)}`
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
        if (chrome.runtime.lastError) return
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
      const id = generateId()
      const entry: ExtensionVocabEntry = extensionVocabSchema.parse({
        id,
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

      try {
        await saveVocabularyEntry(entry)
      } catch (err) {
        console.warn('[VocabularyCollector] IndexedDB save failed, falling back to chrome.storage:', err)
      }
      try { pushSync('vocabulary', 'created', entry.id, entry as unknown as Record<string, unknown>) } catch {}

      const learningEntryData = {
        id: generateId(),
        text: wordTrimmed,
        category: 'vocabulary',
        topic: topic.trim() || 'general',
        skill: 'vocabulary',
        difficulty,
        tags,
        personalNote: personalNote.trim(),
        pageTitle: pageInfo.title,
        pageUrl: pageInfo.url,
        status: 'new',
        createdAt: now,
        updatedAt: now,
      } as LearningEntry
      try {
        await saveEntry(learningEntryData)
      } catch (err) {
        console.warn('[VocabularyCollector] learningEntries save failed (non-critical):', err)
      }
      try { pushSync('learningEntry', 'created', learningEntryData.id, learningEntryData as unknown as Record<string, unknown>) } catch {}

      try {
        await incrementDailyProgress(PROGRESS_KEYS.WORDS_ADDED, 1)
      } catch (err) {
        console.warn('[VocabularyCollector] progress increment failed (non-critical):', err)
      }

      try {
        const raw = await new Promise<any[]>((resolve) => {
          chrome.storage.local.get([STORAGE_KEYS.VOCABULARY], (r) => resolve(r.vocabulary || []))
        })
        raw.push(entry)
        await new Promise<void>((resolve) => {
          chrome.storage.local.set({ [STORAGE_KEYS.VOCABULARY]: raw, [STORAGE_KEYS.LAST_SYNC_TIME]: now }, resolve)
        })
      } catch (err) {
        console.warn('[VocabularyCollector] chrome.storage sync failed (non-critical):', err)
      }

      try {
        await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.VOCAB_SAVED, payload: entry })
      } catch {
        // Background may not be available (popup closed, etc.)
      }

      setSaved(true)
      setTimeout(() => onSaved(), 1200)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setErrors({ submit: `Failed to save: ${message}` })
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
        padding: 'var(--spacing-2xl) var(--spacing-lg)',
        gap: 'var(--spacing-sm)',
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: 'var(--radius-full)',
          background: 'var(--color-success)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-text-inverse)',
        }}>
          <IconCheck size={28} />
        </div>
        <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)' }}>
          Vocabulary saved!
        </div>
        {addToReview && (
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)' }}>
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
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-xs)',
        }}>
          <IconVocabulary size={16} />
          Vocabulary Collector
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
            display: 'inline-flex',
            alignItems: 'center',
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

      <Field label="Word *">
        <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
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
              padding: 'var(--spacing-xs) var(--spacing-sm)',
              borderRadius: 'var(--radius-md)',
              border: errors.word ? '1px solid var(--color-danger)' : '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--weight-semibold)',
            }}
          />
        </div>
        {errors.word && (
          <span id="vocab-word-error" role="alert" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)' }}>{errors.word}</span>
        )}
        {existingWord && (
          <div style={{
            marginTop: 'var(--spacing-2xs)',
            padding: 'var(--spacing-xs) var(--spacing-sm)',
            background: 'var(--color-surface-alt)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.4,
          }}>
            <span style={{ fontWeight: 'var(--weight-semibold)' }}>Already saved:</span>{' '}
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
        {pageInfo.title && (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', marginTop: '2px' }}>
            From: {pageInfo.title}
          </span>
        )}
      </Field>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'var(--spacing-sm)',
      }}>
        <Field label="Topic">
          <input
            type="text"
            value={topic}
            onChange={e => setTopic(e.target.value)}
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
        </Field>
        <Field label="Difficulty">
          <select
            value={difficulty}
            onChange={e => setDifficulty(e.target.value as typeof difficulty)}
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
            padding: 'var(--spacing-xs) var(--spacing-sm)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            fontSize: 'var(--text-sm)',
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
      </Field>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--spacing-xs) var(--spacing-sm)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-2xs)' }}>
              <IconVocabulary size={14} /> AI Enrichment
            </span>
          {aiDetails && (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)', display: 'inline-flex', alignItems: 'center', gap: '2px' }}><IconCheck size={11} /> Enriched</span>
          )}
        </div>
        <button
          type="button"
          onClick={handleEnrich}
          disabled={aiLoading || !word.trim()}
          aria-busy={aiLoading}
          style={{
            padding: 'var(--spacing-xs) var(--spacing-md)',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: aiLoading ? 'var(--color-primary-hover)' : 'var(--color-primary)',
            color: 'var(--color-text-inverse)',
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--weight-semibold)',
            cursor: aiLoading || !word.trim() ? 'not-allowed' : 'pointer',
            opacity: aiLoading || !word.trim() ? 0.7 : 1,
          }}
        >
          {aiLoading ? 'Generating...' : 'Enrich'}
        </button>
      </div>

      {aiError && (
        <div style={{
          padding: 'var(--spacing-xs) var(--spacing-sm)',
          background: 'var(--color-danger-light)',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-danger)',
          border: '1px solid var(--color-danger-light)',
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
                color: 'var(--color-primary)',
                cursor: 'pointer',
                fontSize: 'var(--text-xs)',
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
          padding: 'var(--spacing-sm)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          background: 'var(--color-surface-alt)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
            {aiDetails.partOfSpeech && (
              <span style={{
                padding: '1px 6px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-primary-light)',
                color: 'var(--color-primary-hover)',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--weight-semibold)',
              }}>
                {aiDetails.partOfSpeech}
              </span>
            )}
            {aiDetails.pronunciation && (
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', fontFamily: 'monospace' }}>
                {aiDetails.pronunciation}
              </span>
            )}
            {word.trim() && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); speakWord(word.trim()) }}
                title={`Pronounce "${word.trim()}"`}
                aria-label="Listen to pronunciation"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '24px',
                  height: '24px',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  background: 'transparent',
                  color: 'var(--color-muted)',
                  cursor: 'pointer',
                  padding: 0,
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-secondary)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-muted)' }}
              >
                <IconVolume size={14} />
              </button>
            )}
          </div>

          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)', lineHeight: 1.5 }}>
            <strong>Meaning:</strong> {aiDetails.meaning}
          </div>

          {aiDetails.meaningVi && (
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)' }}>
              <strong>Vietnamese:</strong> {aiDetails.meaningVi}
            </div>
          )}

          <div style={{
            padding: 'var(--spacing-xs) var(--spacing-sm)',
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '3px solid var(--color-primary)',
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text)',
            lineHeight: 1.5,
            fontStyle: 'italic',
          }}>
            “{aiDetails.exampleSentence}”
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-sm)' }}>
            {aiDetails.synonyms.length > 0 && (
              <div>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-muted)', marginBottom: 'var(--spacing-2xs)' }}>
                  Synonyms
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-2xs)' }}>
                  {aiDetails.synonyms.map((s, i) => (
                    <span key={i} style={{
                      padding: '2px var(--spacing-xs)',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--color-success-light)',
                      color: 'var(--color-success-dark)',
                      fontSize: 'var(--text-xs)',
                    }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {aiDetails.antonyms.length > 0 && (
              <div>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-muted)', marginBottom: 'var(--spacing-2xs)' }}>
                  Antonyms
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-2xs)' }}>
                  {aiDetails.antonyms.map((a, i) => (
                    <span key={i} style={{
                      padding: '2px var(--spacing-xs)',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--color-danger-light)',
                      color: 'var(--color-danger)',
                      fontSize: 'var(--text-xs)',
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
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-muted)', marginBottom: 'var(--spacing-2xs)' }}>
                Collocations
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3xs)' }}>
                {aiDetails.collocations.map((c, i) => (
                  <div key={i} style={{
                    padding: 'var(--spacing-2xs) var(--spacing-xs)',
                    background: 'var(--color-surface)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--text-xs)',
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
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-muted)', marginBottom: 'var(--spacing-2xs)' }}>
                Word Family
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-2xs)' }}>
                {aiDetails.wordFamily.map((wf, i) => (
                  <span key={i} style={{
                    padding: '2px var(--spacing-xs)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-skill-reading-light)',
                    color: 'var(--color-skill-reading)',
                    fontSize: 'var(--text-xs)',
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
        gap: 'var(--spacing-xs)',
        cursor: 'pointer',
        padding: 'var(--spacing-xs) var(--spacing-sm)',
      }}>
        <input
          type="checkbox"
          checked={addToReview}
          onChange={e => setAddToReview(e.target.checked)}
          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
        />
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
          Add to spaced repetition review
        </span>
      </label>

      <div style={{
        display: 'flex',
        gap: 'var(--spacing-xs)',
        justifyContent: 'flex-end',
        paddingTop: '8px',
        borderTop: '1px solid var(--color-border)',
      }}>
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
          disabled={saving || !word.trim()}
          style={{
            padding: 'var(--spacing-xs) var(--spacing-lg)',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: saving || !word.trim() ? 'var(--color-primary-hover)' : 'var(--color-primary)',
            color: 'var(--color-text-inverse)',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--weight-semibold)',
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2xs)' }}>
      <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)' }}>
        {label}
      </label>
      {children}
    </div>
  )
}
