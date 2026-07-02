import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import type { VocabularyEntry, VocabDifficulty, VocabStatus } from '../../../models'
import Button from '../../../components/ui/Button'
import { useSettings } from '../../../context/SettingsContext'

const IELTS_TOPICS = [
  'Education', 'Technology', 'Environment', 'Health', 'Work',
  'Business', 'Travel', 'Culture', 'Society', 'Crime',
  'Government', 'Media', 'Globalization', 'Family', 'Housing',
  'Transport', 'Art', 'Sports', 'Science',
]

const PARTS_OF_SPEECH = [
  'noun', 'verb', 'adjective', 'adverb', 'preposition',
  'conjunction', 'pronoun', 'determiner', 'phrasal verb', 'idiom',
]

const DIFFICULTIES: VocabDifficulty[] = ['easy', 'medium', 'hard']
const STATUSES: VocabStatus[] = ['new', 'learning', 'reviewing', 'mastered']

const vocabSchema = z.object({
  word: z.string().min(1, 'Word is required').max(100),
  meaning: z.string().min(1, 'Meaning is required').max(500),
  meaningVi: z.string().max(500),
  pronunciation: z.string().max(100),
  partOfSpeech: z.string(),
  topic: z.string(),
  exampleSentence: z.string().max(1000),
  collocations: z.string(),
  synonyms: z.string(),
  antonyms: z.string(),
  wordFamily: z.string(),
  personalNote: z.string().max(1000),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  status: z.enum(['new', 'learning', 'reviewing', 'mastered']),
  tags: z.string(),
})

export type VocabFormValues = z.input<typeof vocabSchema>

function parseList(value: string): string[] {
  return value
    .split(/[,;]/)
    .map(s => s.trim())
    .filter(Boolean)
}

interface WordFormProps {
  initialValues?: VocabularyEntry | null
  onSave: (entry: VocabularyEntry) => Promise<void>
  onCancel: () => void
  saving?: boolean
}

export default function WordForm({ initialValues, onSave, onCancel, saving }: WordFormProps) {
  const { settings } = useSettings()
  const [generating, setGenerating] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<VocabFormValues>({
    resolver: zodResolver(vocabSchema),
    defaultValues: initialValues ? {
      word: initialValues.word,
      meaning: initialValues.meaning,
      meaningVi: initialValues.meaningVi,
      pronunciation: initialValues.pronunciation,
      partOfSpeech: initialValues.partOfSpeech,
      topic: initialValues.topic,
      exampleSentence: initialValues.exampleSentence,
      collocations: initialValues.collocations.join(', '),
      synonyms: initialValues.synonyms.join(', '),
      antonyms: initialValues.antonyms.join(', '),
      wordFamily: initialValues.wordFamily.join(', '),
      personalNote: initialValues.personalNote,
      difficulty: initialValues.difficulty,
      status: initialValues.status,
      tags: initialValues.tags.join(', '),
    } : {
      word: '',
      meaning: '',
      meaningVi: '',
      pronunciation: '',
      partOfSpeech: 'noun',
      topic: 'Education',
      exampleSentence: '',
      collocations: '',
      synonyms: '',
      antonyms: '',
      wordFamily: '',
      personalNote: '',
      difficulty: 'medium',
      status: 'new',
      tags: '',
    },
  })

  const word = watch('word')
  const topic = watch('topic')

  function buildEntry(values: VocabFormValues): VocabularyEntry {
    const now = new Date().toISOString()
    return {
      id: initialValues?.id ?? crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2, 9),
      word: values.word.trim(),
      meaning: values.meaning.trim(),
      meaningVi: values.meaningVi.trim(),
      pronunciation: values.pronunciation.trim(),
      partOfSpeech: values.partOfSpeech,
      topic: values.topic,
      exampleSentence: values.exampleSentence.trim(),
      collocations: parseList(values.collocations),
      synonyms: parseList(values.synonyms),
      antonyms: parseList(values.antonyms),
      wordFamily: parseList(values.wordFamily),
      personalNote: values.personalNote.trim(),
      difficulty: values.difficulty,
      status: values.status,
      tags: parseList(values.tags),
      createdAt: initialValues?.createdAt ?? now,
      updatedAt: now,
    }
  }

  function onSubmit(values: VocabFormValues) {
    const entry = buildEntry(values)
    onSave(entry)
  }

  async function generateExample() {
    if (!word.trim()) {
      setAiError('Enter a word first')
      return
    }
    if (!settings.aiApiKey) {
      setAiError('Set your AI API key in Settings first')
      return
    }

    setGenerating(true)
    setAiError(null)

    try {
      const prompt = `You are an IELTS vocabulary assistant. Generate a natural example sentence for the word "${word}"${topic ? ` on the topic of "${topic}"` : ''}. Also provide 2-3 common collocations and 2-3 synonyms. Format the response as JSON with keys: "sentence", "collocations" (array), "synonyms" (array).`

      const response = await fetch(settings.aiEndpoint || 'https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.aiApiKey}`,
        },
        body: JSON.stringify({
          model: settings.aiModel || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are an IELTS vocabulary assistant. Always respond with valid JSON.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 300,
        }),
      })

      if (!response.ok) {
        const errBody = await response.text().catch(() => '')
        throw new Error(`AI API error (${response.status}): ${errBody || response.statusText}`)
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content || ''

      let parsed
      try {
        const jsonStart = content.indexOf('{')
        const jsonEnd = content.lastIndexOf('}')
        if (jsonStart === -1 || jsonEnd === -1) throw new Error('No JSON found')
        parsed = JSON.parse(content.slice(jsonStart, jsonEnd + 1))
      } catch {
        setValue('exampleSentence', content.trim())
        return
      }

      if (parsed.sentence) setValue('exampleSentence', parsed.sentence)
      if (parsed.collocations && Array.isArray(parsed.collocations)) {
        const existing = watch('collocations')
        const newColl = parsed.collocations.join(', ')
        setValue('collocations', existing ? `${existing}, ${newColl}` : newColl)
      }
      if (parsed.synonyms && Array.isArray(parsed.synonyms)) {
        const existing = watch('synonyms')
        const newSyn = parsed.synonyms.join(', ')
        setValue('synonyms', existing ? `${existing}, ${newSyn}` : newSyn)
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Failed to generate example')
    } finally {
      setGenerating(false)
    }
  }

  const inputClass = (fieldName: keyof VocabFormValues) =>
    `mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
      errors[fieldName]
        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
        : 'border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]'
    }`
    .replace(/border-\[var\(--color-border\)\]/g, '')
    .trim() + ' border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500'

  const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-300'
  const errorClass = 'mt-1 text-xs text-red-500'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="word" className={labelClass}>
            Word <span className="text-red-500">*</span>
          </label>
          <input
            id="word"
            type="text"
            {...register('word')}
            className={inputClass('word')}
            placeholder="e.g., ubiquitous"
          />
          {errors.word && <p className={errorClass}>{errors.word.message}</p>}
        </div>
        <div>
          <label htmlFor="pronunciation" className={labelClass}>
            Pronunciation
          </label>
          <input
            id="pronunciation"
            type="text"
            {...register('pronunciation')}
            className={inputClass('pronunciation')}
            placeholder="/juːˈbɪk.wɪ.təs/"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="meaning" className={labelClass}>
            Meaning <span className="text-red-500">*</span>
          </label>
          <textarea
            id="meaning"
            rows={2}
            {...register('meaning')}
            className={inputClass('meaning')}
            placeholder="Existing everywhere, widespread"
          />
          {errors.meaning && <p className={errorClass}>{errors.meaning.message}</p>}
        </div>
        <div>
          <label htmlFor="meaningVi" className={labelClass}>
            Vietnamese Meaning
          </label>
          <textarea
            id="meaningVi"
            rows={2}
            {...register('meaningVi')}
            className={inputClass('meaningVi')}
            placeholder="Phổ biến khắp nơi"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="partOfSpeech" className={labelClass}>
            Part of Speech
          </label>
          <select
            id="partOfSpeech"
            {...register('partOfSpeech')}
            className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {PARTS_OF_SPEECH.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="topic" className={labelClass}>
            IELTS Topic
          </label>
          <select
            id="topic"
            {...register('topic')}
            className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {IELTS_TOPICS.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="difficulty" className={labelClass}>
              Difficulty
            </label>
            <select
              id="difficulty"
              {...register('difficulty')}
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {DIFFICULTIES.map(d => (
                <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="status" className={labelClass}>
              Status
            </label>
            <select
              id="status"
              {...register('status')}
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {STATUSES.map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <label htmlFor="exampleSentence" className={labelClass}>
              Example Sentence
            </label>
            <textarea
              id="exampleSentence"
              rows={2}
              {...register('exampleSentence')}
              className={inputClass('exampleSentence')}
              placeholder="Smartphones have become ubiquitous in modern society."
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={generateExample}
            disabled={generating || !word.trim()}
            loading={generating}
            className="mt-6 shrink-0"
            title="Generate example with AI"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            AI Example
          </Button>
        </div>
        {aiError && <p className="mt-1 text-xs text-red-500">{aiError}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="collocations" className={labelClass}>
            Collocations (comma-separated)
          </label>
          <textarea
            id="collocations"
            rows={2}
            {...register('collocations')}
            className={inputClass('collocations')}
            placeholder="ubiquitous computing, ubiquitous presence"
          />
        </div>
        <div>
          <label htmlFor="synonyms" className={labelClass}>
            Synonyms (comma-separated)
          </label>
          <textarea
            id="synonyms"
            rows={2}
            {...register('synonyms')}
            className={inputClass('synonyms')}
            placeholder="widespread, pervasive, omnipresent"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="antonyms" className={labelClass}>
            Antonyms (comma-separated)
          </label>
          <textarea
            id="antonyms"
            rows={2}
            {...register('antonyms')}
            className={inputClass('antonyms')}
            placeholder="rare, scarce, uncommon"
          />
        </div>
        <div>
          <label htmlFor="wordFamily" className={labelClass}>
            Word Family (comma-separated)
          </label>
          <textarea
            id="wordFamily"
            rows={2}
            {...register('wordFamily')}
            className={inputClass('wordFamily')}
            placeholder="ubiquity, ubiquitously"
          />
        </div>
      </div>

      <div>
        <label htmlFor="personalNote" className={labelClass}>
          Personal Note
        </label>
        <textarea
          id="personalNote"
          rows={2}
          {...register('personalNote')}
          className={inputClass('personalNote')}
          placeholder="Your personal learning note about this word"
        />
      </div>

      <div>
        <label htmlFor="tags" className={labelClass}>
          Tags (comma-separated)
        </label>
        <input
          id="tags"
          type="text"
          {...register('tags')}
          className={inputClass('tags')}
          placeholder="technology, writing, formal"
        />
      </div>

      <div className="flex justify-end gap-3 border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving} loading={saving}>
          {initialValues ? 'Update Word' : 'Add Word'}
        </Button>
      </div>
    </form>
  )
}
