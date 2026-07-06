import { useState, useEffect, useCallback, useMemo } from 'react'
import type { GrammarNote, GrammarStatus, MistakeEntry, MistakeSkill } from '../../models'
import { DatabaseService } from '../../services/storage/Database'
import { useSettings } from '../../context/SettingsContext'
import Card, { CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Exercise, { type GrammarExerciseItem } from './components/Exercise'
import { generateId } from '../../utils'
import { generateGrammarExercises } from '../../services/ai/AIService'
import PageHeader from '../../components/layout/PageHeader'
import { IconGrammar } from '@ielts/ui'

const GRAMMAR_TOPICS = [
  'Tenses', 'Articles', 'Prepositions', 'Conditionals', 'Modal Verbs',
  'Passive Voice', 'Relative Clauses', 'Reported Speech', 'Gerunds & Infinitives',
  'Subject-Verb Agreement', 'Comparatives & Superlatives', 'Quantifiers',
  'Linking Words', 'Punctuation', 'Word Order', 'Phrasal Verbs',
  'Collocations', 'Sentence Structure', 'Pronouns', 'Adjectives & Adverbs',
]

const RELATED_SKILLS = ['reading', 'listening', 'writing', 'speaking'] as const

const STATUS_OPTIONS: { value: GrammarStatus; label: string; color: string }[] = [
  { value: 'weak', label: 'Weak', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
  { value: 'reviewing', label: 'Reviewing', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  { value: 'mastered', label: 'Mastered', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
]

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const SEED_EXERCISES: GrammarExerciseItem[] = [
  {
    id: 'ex-1',
    topic: 'Conditionals',
    type: 'multiple-choice',
    question: 'Which sentence is a correct second conditional?',
    options: [
      'If I will have time, I will go',
      'If I had time, I would go',
      'If I have time, I would go',
      'If I had had time, I would go',
    ],
    correctAnswer: 'B',
    explanation: 'Second conditional uses "if + past simple, would + base verb" for unreal present situations.',
  },
  {
    id: 'ex-2',
    topic: 'Conditionals',
    type: 'gap-fill',
    question: 'Complete: "If I ____ (study) harder, I would pass the exam."',
    correctAnswer: 'studied',
    explanation: 'Second conditional uses past simple in the if-clause.',
  },
  {
    id: 'ex-3',
    topic: 'Articles',
    type: 'multiple-choice',
    question: 'Choose the correct sentence:',
    options: [
      'She is best student in class',
      'She is the best student in the class',
      'She is a best student in a class',
      'She is best student in a class',
    ],
    correctAnswer: 'B',
    explanation: 'Use "the" before superlatives and when referring to a specific noun.',
  },
  {
    id: 'ex-4',
    topic: 'Articles',
    type: 'gap-fill',
    question: 'Fill in the blank: "I saw ____ dog in the park." (first mention)',
    correctAnswer: 'a',
    explanation: 'Use "a/an" for non-specific singular countable nouns when first mentioned.',
  },
  {
    id: 'ex-5',
    topic: 'Passive Voice',
    type: 'true-false',
    question: 'Is this sentence active or passive? "The experiment was conducted by the research team." The sentence is in active voice.',
    correctAnswer: 'F',
    explanation: 'The sentence is in passive voice because the subject receives the action (was conducted).',
  },
  {
    id: 'ex-6',
    topic: 'Passive Voice',
    type: 'gap-fill',
    question: 'Change to passive: "The team conducted the experiment." → "The experiment ____ ____ by the team."',
    correctAnswer: 'was conducted',
    explanation: 'Passive voice: be (past) + past participle.',
  },
  {
    id: 'ex-7',
    topic: 'Relative Clauses',
    type: 'multiple-choice',
    question: 'Which sentence uses a non-defining relative clause correctly?',
    options: [
      'My sister that lives in London is a doctor',
      'My sister, who lives in London, is a doctor',
      'My sister who lives in London is a doctor',
      'My sister, that lives in London, is a doctor',
    ],
    correctAnswer: 'B',
    explanation: 'Non-defining relative clauses use commas and "who" (not "that") for people.',
  },
  {
    id: 'ex-8',
    topic: 'Relative Clauses',
    type: 'error-correction',
    question: 'Correct this sentence: "The car, that is red, belongs to John."',
    correctAnswer: 'The car, which is red, belongs to John.',
    explanation: 'Use "which" (not "that") for non-defining relative clauses referring to things.',
  },
  {
    id: 'ex-9',
    topic: 'Tenses',
    type: 'multiple-choice',
    question: 'Choose the correct tense: "I ____ here for five years."',
    options: [
      'am living',
      'live',
      'have lived',
      'am lived',
    ],
    correctAnswer: 'C',
    explanation: 'Present perfect (have + past participle) is used for actions that started in the past and continue to the present.',
  },
  {
    id: 'ex-10',
    topic: 'Tenses',
    type: 'gap-fill',
    question: 'Complete: "In 2020, the government ____ (introduce) new policies."',
    correctAnswer: 'introduced',
    explanation: 'Use past simple for completed actions at a specific time in the past.',
  },
  {
    id: 'ex-11',
    topic: 'Prepositions',
    type: 'multiple-choice',
    question: 'Choose the correct preposition: "She is interested ____ learning English."',
    options: ['in', 'on', 'at', 'for'],
    correctAnswer: 'A',
    explanation: 'The adjective "interested" is followed by the preposition "in".',
  },
  {
    id: 'ex-12',
    topic: 'Prepositions',
    type: 'gap-fill',
    question: 'Complete: "He apologized ____ being late."',
    correctAnswer: 'for',
    explanation: 'The verb "apologize" is followed by the preposition "for".',
  },
  {
    id: 'ex-13',
    topic: 'Modal Verbs',
    type: 'multiple-choice',
    question: 'Which modal verb expresses obligation?',
    options: ['can', 'must', 'might', 'could'],
    correctAnswer: 'B',
    explanation: '"Must" expresses strong obligation or necessity.',
  },
  {
    id: 'ex-14',
    topic: 'Modal Verbs',
    type: 'true-false',
    question: '"You should see a doctor" is stronger advice than "You must see a doctor."',
    correctAnswer: 'F',
    explanation: '"Must" is stronger than "should". "Must" expresses necessity; "should" is a recommendation.',
  },
  {
    id: 'ex-15',
    topic: 'Subject-Verb Agreement',
    type: 'multiple-choice',
    question: 'Choose the correct verb: "The list of items ____ on the table."',
    options: ['is', 'are', 'were', 'have been'],
    correctAnswer: 'A',
    explanation: 'The subject is "list" (singular), not "items". The verb agrees with the subject, not the prepositional object.',
  },
  {
    id: 'ex-16',
    topic: 'Subject-Verb Agreement',
    type: 'error-correction',
    question: 'Correct: "Everyone have their own opinion."',
    correctAnswer: 'Everyone has their own opinion.',
    explanation: '"Everyone" is grammatically singular and takes a singular verb.',
  },
  {
    id: 'ex-17',
    topic: 'Reported Speech',
    type: 'gap-fill',
    question: 'Direct: "I am tired." → She said that she ____ tired.',
    correctAnswer: 'was',
    explanation: 'In reported speech, present simple usually shifts to past simple.',
  },
  {
    id: 'ex-18',
    topic: 'Reported Speech',
    type: 'multiple-choice',
    question: 'Report this question: "Are you coming?" → She asked ____.',
    options: [
      'if I am coming',
      'if I was coming',
      'if I were coming',
      'if I came',
    ],
    correctAnswer: 'B',
    explanation: 'Yes/no questions in reported speech use "if/whether" and backshift the tense.',
  },
  {
    id: 'ex-19',
    topic: 'Comparatives & Superlatives',
    type: 'multiple-choice',
    question: 'Choose the correct form: "This is ____ movie I have ever seen."',
    options: [
      'the most boring',
      'the boringest',
      'more boring',
      'most boring',
    ],
    correctAnswer: 'A',
    explanation: 'For adjectives with 2+ syllables, use "the most + adjective" for superlative form.',
  },
  {
    id: 'ex-20',
    topic: 'Comparatives & Superlatives',
    type: 'error-correction',
    question: 'Correct: "She is more smarter than him."',
    correctAnswer: 'She is smarter than him.',
    explanation: 'For one-syllable adjectives, add "-er" to form the comparative (not "more").',
  },
  {
    id: 'ex-21',
    topic: 'Gerunds & Infinitives',
    type: 'multiple-choice',
    question: 'Which verb is followed by a gerund?',
    options: ['want', 'decide', 'enjoy', 'promise'],
    correctAnswer: 'C',
    explanation: '"Enjoy" is always followed by a gerund (enjoy + -ing). The others take infinitives.',
  },
  {
    id: 'ex-22',
    topic: 'Gerunds & Infinitives',
    type: 'gap-fill',
    question: 'Complete: "I avoid ____ (eat) too much sugar."',
    correctAnswer: 'eating',
    explanation: '"Avoid" is followed by a gerund (-ing form).',
  },
  {
    id: 'ex-23',
    topic: 'Linking Words',
    type: 'multiple-choice',
    question: 'Which linking word shows contrast?',
    options: ['furthermore', 'however', 'therefore', 'moreover'],
    correctAnswer: 'B',
    explanation: '"However" introduces a contrasting idea. The others add supporting information.',
  },
  {
    id: 'ex-24',
    topic: 'Linking Words',
    type: 'gap-fill',
    question: 'Complete: "He was tired; ____, he continued working." (showing contrast)',
    correctAnswer: 'however',
    explanation: '"However" is used to show contrast between two clauses.',
  },
  {
    id: 'ex-25',
    topic: 'Quantifiers',
    type: 'multiple-choice',
    question: 'Which sentence is correct?',
    options: [
      'I have a few money',
      'I have a little money',
      'I have a few moneys',
      'I have little moneys',
    ],
    correctAnswer: 'B',
    explanation: '"Money" is uncountable, so use "a little" (not "a few").',
  },
  {
    id: 'ex-26',
    topic: 'Quantifiers',
    type: 'true-false',
    question: '"Few" and "a few" have the same meaning.',
    correctAnswer: 'F',
    explanation: '"Few" means "not many" (negative), while "a few" means "some" (positive).',
  },
  {
    id: 'ex-27',
    topic: 'Punctuation',
    type: 'error-correction',
    question: 'Correct: "Its a beautiful day."',
    correctAnswer: "It's a beautiful day.",
    explanation: '"It\'s" is the contraction of "it is". "Its" shows possession.',
  },
  {
    id: 'ex-28',
    topic: 'Punctuation',
    type: 'gap-fill',
    question: 'Add the missing punctuation: "If you study hard you will pass"',
    correctAnswer: 'If you study hard, you will pass',
    explanation: 'Use a comma after the if-clause when it begins a sentence.',
  },
  {
    id: 'ex-29',
    topic: 'Word Order',
    type: 'multiple-choice',
    question: 'Which sentence has correct word order?',
    options: [
      'She speaks very well English',
      'She speaks English very well',
      'She very well speaks English',
      'She speaks English well very',
    ],
    correctAnswer: 'B',
    explanation: 'English word order: subject + verb + object + adverb (manner, place, time).',
  },
  {
    id: 'ex-30',
    topic: 'Word Order',
    type: 'error-correction',
    question: 'Correct: "Always she arrives on time."',
    correctAnswer: 'She always arrives on time.',
    explanation: 'Adverbs of frequency (always, usually, etc.) come before the main verb but after "be".',
  },
]

const EXERCISES_BY_TOPIC = SEED_EXERCISES.reduce<Record<string, GrammarExerciseItem[]>>((acc, ex) => {
  if (!acc[ex.topic]) acc[ex.topic] = []
  acc[ex.topic].push(ex)
  return acc
}, {})

function generateExercisesForTopic(topic: string, count: number): GrammarExerciseItem[] {
  const existing = EXERCISES_BY_TOPIC[topic] || []
  if (existing.length >= count) return existing.slice(0, count)
  return existing
}

export default function GrammarLearning() {
  const { settings } = useSettings()
  const [tab, setTab] = useState<'topics' | 'exercises' | 'weaknesses'>('topics')

  const [notes, setNotes] = useState<GrammarNote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<GrammarStatus | ''>('')
  const [skillFilter, setSkillFilter] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'topic' | 'status'>('date')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<GrammarNote | null>(null)
  const [formTopic, setFormTopic] = useState('')
  const [formExplanation, setFormExplanation] = useState('')
  const [formExamples, setFormExamples] = useState('')
  const [formMistakes, setFormMistakes] = useState('')
  const [formCorrected, setFormCorrected] = useState('')
  const [formNote, setFormNote] = useState('')
  const [formSkill, setFormSkill] = useState('')
  const [formStatus, setFormStatus] = useState<GrammarStatus>('weak')
  const [saving, setSaving] = useState(false)

  const [detailNote, setDetailNote] = useState<GrammarNote | null>(null)

  const [selectedTopic, setSelectedTopic] = useState<string>('')
  const [exercises, setExercises] = useState<GrammarExerciseItem[]>([])
  const [exerciseMode, setExerciseMode] = useState(false)

  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  const [mistakes, setMistakes] = useState<MistakeEntry[]>([])
  const [mistakeFilter, setMistakeFilter] = useState<MistakeSkill | ''>('')

  const loadNotes = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const all = await DatabaseService.getAll<GrammarNote>('grammarNotes')
      setNotes(all)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load grammar notes')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadMistakes = useCallback(async () => {
    try {
      const all = await DatabaseService.getAll<MistakeEntry>('mistakes')
      setMistakes(all.filter(m => m.skill === 'grammar'))
    } catch {}
  }, [])

  useEffect(() => {
    loadNotes()
    loadMistakes()
  }, [loadNotes, loadMistakes])

  const filteredNotes = useMemo(() => {
    let filtered = [...notes]
    if (search.trim()) {
      const query = search.toLowerCase()
      filtered = filtered.filter(n =>
        n.topic.toLowerCase().includes(query) ||
        n.explanation.toLowerCase().includes(query) ||
        n.exampleSentences.some(s => s.toLowerCase().includes(query)) ||
        n.commonMistakes.some(s => s.toLowerCase().includes(query)) ||
        n.personalNote.toLowerCase().includes(query)
      )
    }
    if (statusFilter) filtered = filtered.filter(n => n.status === statusFilter)
    if (skillFilter) filtered = filtered.filter(n => n.relatedSkill === skillFilter)
    filtered.sort((a, b) => {
      if (sortBy === 'topic') return a.topic.localeCompare(b.topic)
      if (sortBy === 'status') {
        const order = ['weak', 'reviewing', 'mastered']
        return order.indexOf(a.status) - order.indexOf(b.status)
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
    return filtered
  }, [notes, search, statusFilter, skillFilter, sortBy])

  const stats = useMemo(() => {
    const total = notes.length
    const mastered = notes.filter(n => n.status === 'mastered').length
    const reviewing = notes.filter(n => n.status === 'reviewing').length
    const weak = notes.filter(n => n.status === 'weak').length
    const topicsLearned = new Set(notes.map(n => n.topic)).size
    return { total, mastered, reviewing, weak, topicsLearned }
  }, [notes])

  const grammarMistakes = useMemo(() => {
    let filtered = [...mistakes]
    if (mistakeFilter) filtered = filtered.filter(m => m.skill === mistakeFilter)
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [mistakes, mistakeFilter])

  const weaknessTopics = useMemo(() => {
    const weakNotes = notes.filter(n => n.status === 'weak').map(n => n.topic)
    const byTopic: Record<string, MistakeEntry[]> = {}
    for (const m of mistakes) {
      const topic = m.source.replace('Grammar - ', '')
      if (!byTopic[topic]) byTopic[topic] = []
      byTopic[topic].push(m)
    }
    const sorted = Object.entries(byTopic)
      .sort((a, b) => b[1].length - a[1].length)
      .map(([topic, topicMistakes]) => ({
        topic,
        mistakes: topicMistakes.length,
        weak: weakNotes.includes(topic),
        recentMistakes: topicMistakes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 2),
        lastDate: topicMistakes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]?.createdAt,
      }))
    return sorted
  }, [notes, mistakes])

  function getStatusStyle(status: GrammarStatus): string {
    return STATUS_OPTIONS.find(s => s.value === status)?.color ?? ''
  }

  function openCreateForm() {
    setEditingNote(null)
    setFormTopic('')
    setFormExplanation('')
    setFormExamples('')
    setFormMistakes('')
    setFormCorrected('')
    setFormNote('')
    setFormSkill('')
    setFormStatus('weak')
    setModalOpen(true)
  }

  function openEditForm(note: GrammarNote) {
    setEditingNote(note)
    setFormTopic(note.topic)
    setFormExplanation(note.explanation)
    setFormExamples(note.exampleSentences.join('\n---\n'))
    setFormMistakes(note.commonMistakes.join('\n---\n'))
    setFormCorrected(note.correctedExamples.join('\n---\n'))
    setFormNote(note.personalNote)
    setFormSkill(note.relatedSkill)
    setFormStatus(note.status)
    setModalOpen(true)
  }

  function handleCloseModal() {
    setModalOpen(false)
    setEditingNote(null)
  }

  function parseLines(value: string): string[] {
    return value.split('\n---\n').map(s => s.trim()).filter(Boolean)
  }

  async function handleSave() {
    if (!formTopic.trim() || !formExplanation.trim()) return
    setSaving(true)
    try {
      const now = new Date().toISOString()
      const exampleSentences = parseLines(formExamples)
      const commonMistakes = parseLines(formMistakes)
      const correctedExamples = parseLines(formCorrected)

      if (editingNote) {
        const updated: GrammarNote = {
          ...editingNote,
          topic: formTopic.trim(),
          explanation: formExplanation.trim(),
          exampleSentences,
          commonMistakes,
          correctedExamples,
          personalNote: formNote,
          relatedSkill: formSkill,
          status: formStatus,
          updatedAt: now,
        }
        await DatabaseService.put('grammarNotes', updated)
        setNotes(prev => prev.map(n => n.id === updated.id ? updated : n))
      } else {
        const note: GrammarNote = {
          id: generateId(),
          topic: formTopic.trim(),
          explanation: formExplanation.trim(),
          exampleSentences,
          commonMistakes,
          correctedExamples,
          personalNote: formNote,
          relatedSkill: formSkill,
          status: formStatus,
          createdAt: now,
          updatedAt: now,
        }
        await DatabaseService.add('grammarNotes', note)
        setNotes(prev => [...prev, note])
      }
      setModalOpen(false)
      setEditingNote(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save grammar note')
    } finally {
      setSaving(false)
    }
  }

  function handleDelete(id: string) {
    DatabaseService.remove('grammarNotes', id)
    setNotes(prev => prev.filter(n => n.id !== id))
  }

  async function handleStatusChange(note: GrammarNote, status: GrammarStatus) {
    const updated: GrammarNote = { ...note, status, updatedAt: new Date().toISOString() }
    await DatabaseService.put('grammarNotes', updated)
    setNotes(prev => prev.map(n => n.id === updated.id ? updated : n))
  }

  function startExercises(topic: string) {
    const exs = generateExercisesForTopic(topic, 10)
    setSelectedTopic(topic)
    setExercises(exs)
    setExerciseMode(true)
  }

  function handleExerciseComplete(_results: { total: number; correct: number }) {
    setExerciseMode(false)
    loadMistakes()
  }

  async function generateAiExercises(topic: string) {
    if (!settings.aiApiKey) {
      setAiError('Set your AI API key in Settings first')
      return
    }
    if (!topic.trim()) {
      setAiError('Select a grammar topic first')
      return
    }

    setAiLoading(true)
    setAiError(null)

    try {
      const { content, error } = await generateGrammarExercises(topic, 5)

      if (error) {
        throw new Error(error)
      }

      if (!content) {
        throw new Error('AI returned an empty response. Try again.')
      }

      let parsed
      try {
        const jsonStart = content.indexOf('{')
        const jsonEnd = content.lastIndexOf('}')
        if (jsonStart === -1 || jsonEnd === -1) throw new Error('No JSON found')
        parsed = JSON.parse(content.slice(jsonStart, jsonEnd + 1))
      } catch {
        throw new Error('Failed to parse AI response as JSON')
      }

      if (!parsed.exercises || !Array.isArray(parsed.exercises) || parsed.exercises.length === 0) {
        throw new Error('No exercises generated')
      }

      const newExercises: GrammarExerciseItem[] = parsed.exercises.map((ex: { type: string; question: string; options?: string[]; correctAnswer: string; explanation: string }, i: number) => ({
        id: `ai-${generateId()}-${i}`,
        topic,
        type: ex.type as GrammarExerciseItem['type'],
        question: ex.question,
        options: ex.options,
        correctAnswer: ex.correctAnswer,
        explanation: ex.explanation,
      }))

      setSelectedTopic(topic)
      setExercises(newExercises)
      setExerciseMode(true)
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Failed to generate exercises')
    } finally {
      setAiLoading(false)
    }
  }

  async function handleMistakeStatus(id: string, status: MistakeEntry['status']) {
    const updated = mistakes.find(m => m.id === id)
    if (!updated) return
    const entry: MistakeEntry = { ...updated, status, updatedAt: new Date().toISOString() }
    await DatabaseService.put('mistakes', entry)
    setMistakes(prev => prev.map(m => m.id === id ? entry : m))
  }

  const inputClass =
    'w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'

  const selectClass =
    'rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-2 text-xs text-slate-700 dark:text-slate-300'

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div
          className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
          style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="max-w-md text-center">
          <CardContent>
            <p style={{ color: 'var(--color-danger)' }}>{error}</p>
            <Button variant="secondary" className="mt-4" onClick={loadNotes}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        icon={<IconGrammar size={22} />}
        title="Grammar Learning"
        description="Learn and practice IELTS grammar topics"
      />

      <div
        className="flex flex-wrap items-center gap-2 rounded-lg border p-1"
        style={{
          backgroundColor: 'var(--color-surface-alt)',
          borderColor: 'var(--color-border)',
        }}
      >
        {[
          { key: 'topics', label: 'Topics' },
          { key: 'exercises', label: 'Exercises' },
          { key: 'weaknesses', label: 'Weaknesses' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key as typeof tab); setExerciseMode(false) }}
            className="rounded-md px-4 py-2 text-sm font-medium transition-colors"
            style={{
              backgroundColor: tab === t.key ? 'var(--color-primary)' : 'transparent',
              color: tab === t.key ? 'white' : 'var(--color-text-secondary)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'topics' && !exerciseMode && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="text-center">
                <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Topics</p>
                <p className="mt-1 text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>{stats.topicsLearned}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center">
                <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Mastered</p>
                <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.mastered}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center">
                <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Reviewing</p>
                <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.reviewing}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center">
                <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Weak Areas</p>
                <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">{stats.weak}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent>
              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={openCreateForm} size="sm">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Topic
                </Button>
                <div className="min-w-[180px] flex-1">
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search grammar topics..."
                    className={inputClass}
                    aria-label="Search grammar topics"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as GrammarStatus | '')}
                  className={selectClass}
                  aria-label="Filter by status"
                >
                  <option value="">All Status</option>
                  {STATUS_OPTIONS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <select
                  value={skillFilter}
                  onChange={e => setSkillFilter(e.target.value)}
                  className={selectClass}
                  aria-label="Filter by skill"
                >
                  <option value="">All Skills</option>
                  {RELATED_SKILLS.map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as 'date' | 'topic' | 'status')}
                  className={selectClass}
                  aria-label="Sort by"
                >
                  <option value="date">Last Updated</option>
                  <option value="topic">Topic A-Z</option>
                  <option value="status">Status</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {filteredNotes.length === 0 ? (
            <Card>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12">
                  <svg className="mb-4 h-12 w-12" style={{ color: 'var(--color-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>
                    {notes.length === 0 ? 'No grammar topics yet.' : 'No topics match your filters.'}
                  </p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>
                    {notes.length === 0 ? 'Add your first grammar topic to start learning.' : 'Try adjusting your search or filters.'}
                  </p>
                  {notes.length === 0 && (
                    <Button className="mt-4" size="sm" onClick={openCreateForm}>
                      Add Your First Topic
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredNotes.map(note => (
                <div
                  key={note.id}
                  className="rounded-lg border p-4 transition-colors"
                  style={{
                    borderColor: 'var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${getStatusStyle(note.status)}`}>
                          {STATUS_OPTIONS.find(s => s.value === note.status)?.label}
                        </span>
                        {note.relatedSkill && (
                          <span
                            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
                            style={{
                              backgroundColor: 'var(--color-surface-alt)',
                              color: 'var(--color-text-secondary)',
                            }}
                          >
                            {note.relatedSkill.charAt(0).toUpperCase() + note.relatedSkill.slice(1)}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => setDetailNote(note)}
                        className="mt-1 text-left"
                      >
                        <h3 className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400"
                          style={{ color: 'var(--color-text)' }}>
                          {note.topic}
                        </h3>
                      </button>
                      <p className="mt-1 text-xs line-clamp-2" style={{ color: 'var(--color-muted)' }}>
                        {note.explanation}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs" style={{ color: 'var(--color-muted)' }}>
                        <span>{formatDate(note.updatedAt)}</span>
                        <span>{note.exampleSentences.length} example{note.exampleSentences.length !== 1 ? 's' : ''}</span>
                        {note.commonMistakes.length > 0 && (
                          <span style={{ color: 'var(--color-danger)' }}>{note.commonMistakes.length} mistake{note.commonMistakes.length !== 1 ? 's' : ''}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startExercises(note.topic)}
                        className="p-1.5"
                        title="Practice exercises"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </Button>
                      <div className="flex flex-col gap-0.5">
                        {STATUS_OPTIONS.map(s => (
                          <button
                            key={s.value}
                            onClick={() => handleStatusChange(note, s.value)}
                            className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                              note.status === s.value
                                ? s.color
                                : 'hover:text-slate-600 dark:hover:text-slate-300'
                            }`}
                            style={{
                              color: note.status === s.value ? undefined : 'var(--color-muted)',
                            }}
                            aria-label={`Mark as ${s.label}`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditForm(note)}
                        aria-label="Edit"
                        className="p-1.5"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(note.id)}
                        aria-label="Delete"
                        className="p-1.5"
                        style={{ color: 'var(--color-danger)' }}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {(tab === 'topics' || tab === 'exercises') && exerciseMode && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                {selectedTopic} Exercises
              </h2>
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                Practice and test your knowledge
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setExerciseMode(false) }}>
              Back to {tab === 'exercises' ? 'Exercises' : 'Topics'}
            </Button>
          </div>
          <Exercise
            exercises={exercises}
            topic={selectedTopic}
            onComplete={handleExerciseComplete}
            onGenerateAi={generateAiExercises}
          />
        </div>
      )}

      {tab === 'exercises' && !exerciseMode && (
        <div className="space-y-4">
          <Card>
            <CardContent>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex-1">
                  <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                    Practice Exercises
                  </h2>
                  <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                    Select a topic or use AI to generate custom exercises
                  </p>
                </div>
                {settings.aiApiKey && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const topics = notes.map(n => n.topic)
                      const randomTopic = topics.length > 0
                        ? topics[Math.floor(Math.random() * topics.length)]
                        : GRAMMAR_TOPICS[Math.floor(Math.random() * GRAMMAR_TOPICS.length)]
                      generateAiExercises(randomTopic)
                    }}
                    loading={aiLoading}
                    disabled={aiLoading}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    AI Generate
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {GRAMMAR_TOPICS.map(topic => {
              const note = notes.find(n => n.topic === topic)
              const exCount = (EXERCISES_BY_TOPIC[topic] || []).length
              return (
                <button
                  key={topic}
                  onClick={() => startExercises(topic)}
                  className="rounded-lg border p-4 text-left transition-colors hover:border-[var(--color-primary)]"
                  style={{
                    borderColor: 'var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                      {topic}
                    </span>
                    <svg className="h-4 w-4" style={{ color: 'var(--color-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs" style={{ color: 'var(--color-muted)' }}>
                    <span>{exCount} exercise{exCount !== 1 ? 's' : ''}</span>
                    {note && (
                      <span
                        className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${getStatusStyle(note.status)}`}
                      >
                        {note.status}
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {aiError && (
            <div
              className="flex items-center gap-2 rounded-lg border px-4 py-3 text-sm"
              style={{
                borderColor: 'var(--color-danger)',
                backgroundColor: 'var(--color-danger-light)',
                color: 'var(--color-danger)',
              }}
            >
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {aiError}
            </div>
          )}
        </div>
      )}

      {tab === 'weaknesses' && (
        <div className="space-y-4">
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                    Grammar Weaknesses
                  </h2>
                  <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                    Topics you need to focus on
                  </p>
                </div>
                <select
                  value={mistakeFilter}
                  onChange={e => setMistakeFilter(e.target.value as MistakeSkill | '')}
                  className={selectClass}
                  aria-label="Filter mistakes"
                >
                  <option value="">All Grammar</option>
                  {RELATED_SKILLS.map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {weaknessTopics.length > 0 && (
            <Card>
              <CardContent>
                <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--color-text)' }}>
                  Most Mistaken Topics
                </h3>
                <div className="space-y-2">
                  {weaknessTopics.map(wt => (
                    <div
                      key={wt.topic}
                      onClick={() => { startExercises(wt.topic); setTab('exercises') }}
                      className="cursor-pointer rounded-lg border p-3 transition-colors hover:border-[var(--color-primary)]"
                      style={{
                        borderColor: 'var(--color-border)',
                        backgroundColor: 'var(--color-surface-alt)',
                      }}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                              {wt.topic}
                            </span>
                            {wt.weak && (
                              <span className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                                style={{
                                  backgroundColor: 'var(--color-danger-light)',
                                  color: 'var(--color-danger)',
                                }}
                              >
                                Weak
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs" style={{ color: 'var(--color-muted)' }}>
                            {wt.mistakes} mistake{wt.mistakes !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <svg className="h-4 w-4 shrink-0" style={{ color: 'var(--color-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      {wt.recentMistakes.length > 0 && (
                        <div className="mt-2 space-y-1.5 border-t pt-2" style={{ borderColor: 'var(--color-border)' }}>
                          {wt.recentMistakes.map(m => (
                            <div key={m.id}>
                              <p className="text-xs" style={{ color: 'var(--color-text)' }}>{m.mistake}</p>
                              <p className="mt-0.5 text-xs" style={{ color: 'var(--color-success)' }}>✓ {m.correction}</p>
                              <p className="text-[10px]" style={{ color: 'var(--color-muted)' }}>{formatDate(m.createdAt)}</p>
                            </div>
                          ))}
                          {wt.mistakes > 2 && (
                            <p className="text-[10px]" style={{ color: 'var(--color-muted)' }}>
                              +{wt.mistakes - 2} more
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent>
              <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--color-text)' }}>
                Saved Grammar Mistakes
              </h3>
              {grammarMistakes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <svg className="mb-4 h-10 w-10" style={{ color: 'var(--color-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>
                    No grammar mistakes recorded yet.
                  </p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>
                    Mistakes are saved automatically when you complete exercises.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {grammarMistakes.map(m => (
                    <div
                      key={m.id}
                      className="rounded-lg border p-3"
                      style={{
                        borderColor: 'var(--color-border)',
                        backgroundColor: 'var(--color-surface-alt)',
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm" style={{ color: 'var(--color-text)' }}>
                            {m.mistake}
                          </p>
                          <p className="mt-0.5 text-xs" style={{ color: 'var(--color-success)' }}>
                            ✓ {m.correction}
                          </p>
                          {m.explanation && (
                            <p className="mt-0.5 text-xs" style={{ color: 'var(--color-muted)' }}>
                              {m.explanation}
                            </p>
                          )}
                          <div className="mt-1 flex items-center gap-2 text-[10px]" style={{ color: 'var(--color-muted)' }}>
                            <span>{m.source}</span>
                            <span>{formatDate(m.createdAt)}</span>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          {m.status === 'new' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMistakeStatus(m.id, 'resolved')}
                              className="p-1.5 text-xs"
                              title="Mark as resolved"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </Button>
                          )}
                          <span
                            className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                            style={{
                              backgroundColor: m.status === 'new'
                                ? 'var(--color-danger-light)'
                                : m.status === 'reviewed'
                                  ? 'var(--color-warning-light)'
                                  : 'var(--color-success-light)',
                              color: m.status === 'new'
                                ? 'var(--color-danger)'
                                : m.status === 'reviewed'
                                  ? 'var(--color-warning)'
                                  : 'var(--color-success)',
                            }}
                          >
                            {m.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Modal open={!!detailNote} onClose={() => setDetailNote(null)} title={detailNote?.topic ?? ''} size="lg">
        {detailNote && (
          <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1 text-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Status</span>
                <p className="mt-0.5">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusStyle(detailNote.status)}`}>
                    {STATUS_OPTIONS.find(s => s.value === detailNote.status)?.label}
                  </span>
                </p>
              </div>
              <div>
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Related Skill</span>
                <p className="mt-0.5" style={{ color: 'var(--color-text)' }}>{detailNote.relatedSkill || '—'}</p>
              </div>
            </div>
            <div>
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Explanation</span>
              <p className="mt-0.5 whitespace-pre-wrap" style={{ color: 'var(--color-text-secondary)' }}>
                {detailNote.explanation}
              </p>
            </div>
            {detailNote.exampleSentences.length > 0 && (
              <div>
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Examples</span>
                <ul className="mt-1 space-y-1.5">
                  {detailNote.exampleSentences.map((s, i) => (
                    <li key={i} className="rounded-lg px-3 py-2" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-text-secondary)' }}>
                      &ldquo;{s}&rdquo;
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {detailNote.commonMistakes.length > 0 && (
              <div>
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Common Mistakes</span>
                <ul className="mt-1 space-y-1.5">
                  {detailNote.commonMistakes.map((m, i) => (
                    <li key={i} className="rounded-lg px-3 py-2" style={{ backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger)' }}>
                      ✗ {m}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {detailNote.correctedExamples.length > 0 && (
              <div>
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Corrections</span>
                <ul className="mt-1 space-y-1.5">
                  {detailNote.correctedExamples.map((c, i) => (
                    <li key={i} className="rounded-lg px-3 py-2" style={{ backgroundColor: 'var(--color-success-light)', color: 'var(--color-success)' }}>
                      ✓ {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {detailNote.personalNote && (
              <div>
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Personal Note</span>
                <p className="mt-0.5 whitespace-pre-wrap italic" style={{ color: 'var(--color-text-secondary)' }}>
                  {detailNote.personalNote}
                </p>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => { const n = detailNote; setDetailNote(null); openEditForm(n) }}>
                Edit
              </Button>
              <Button variant="secondary" onClick={() => setDetailNote(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={modalOpen} onClose={handleCloseModal} title={editingNote ? 'Edit Grammar Topic' : 'New Grammar Topic'} size="lg">
        <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="topic-field" className="block text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                Topic <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <div className="mt-1 flex gap-2">
                <select
                  id="topic-select"
                  value={GRAMMAR_TOPICS.includes(formTopic) ? formTopic : ''}
                  onChange={e => setFormTopic(e.target.value)}
                  className={selectClass + ' flex-1 px-3 py-2'}
                >
                  <option value="">Select a topic...</option>
                  {GRAMMAR_TOPICS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <input
                  id="topic-field"
                  type="text"
                  value={formTopic}
                  onChange={e => setFormTopic(e.target.value)}
                  placeholder="Or type custom..."
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label htmlFor="topic-status" className="block text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Status</label>
              <select
                id="topic-status"
                value={formStatus}
                onChange={e => setFormStatus(e.target.value as GrammarStatus)}
                className={selectClass + ' mt-1 w-full px-3 py-2'}
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="topic-skill" className="block text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Related Skill</label>
              <select
                id="topic-skill"
                value={formSkill}
                onChange={e => setFormSkill(e.target.value)}
                className={selectClass + ' mt-1 w-full px-3 py-2'}
              >
                <option value="">None</option>
                {RELATED_SKILLS.map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="topic-explanation" className="block text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              Explanation <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <textarea
              id="topic-explanation"
              value={formExplanation}
              onChange={e => setFormExplanation(e.target.value)}
              rows={4}
              placeholder="Explain this grammar rule clearly..."
              className={inputClass + ' mt-1'}
            />
          </div>
          <div>
            <label htmlFor="topic-examples" className="block text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Example Sentences</label>
            <textarea
              id="topic-examples"
              value={formExamples}
              onChange={e => setFormExamples(e.target.value)}
              rows={3}
              placeholder="Separate each with --- on its own line"
              className={inputClass + ' mt-1'}
            />
            <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>Use --- on a separate line between examples.</p>
          </div>
          <div>
            <label htmlFor="topic-mistakes" className="block text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Common Mistakes</label>
            <textarea
              id="topic-mistakes"
              value={formMistakes}
              onChange={e => setFormMistakes(e.target.value)}
              rows={2}
              placeholder="Use --- between each mistake"
              className={inputClass + ' mt-1'}
            />
          </div>
          <div>
            <label htmlFor="topic-corrected" className="block text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Corrected Examples</label>
            <textarea
              id="topic-corrected"
              value={formCorrected}
              onChange={e => setFormCorrected(e.target.value)}
              rows={2}
              placeholder="Use --- between each correction"
              className={inputClass + ' mt-1'}
            />
          </div>
          <div>
            <label htmlFor="topic-note" className="block text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Personal Note</label>
            <textarea
              id="topic-note"
              value={formNote}
              onChange={e => setFormNote(e.target.value)}
              rows={2}
              placeholder="Your notes about this grammar topic..."
              className={inputClass + ' mt-1'}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>
              {editingNote ? 'Update' : 'Save'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
