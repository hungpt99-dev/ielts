import type { VocabularyEntry, VocabReviewEntry, ReviewRating, VocabDifficulty, VocabStatus } from '../../models'
import { DatabaseService } from '../../services/storage/Database'
import { generateId } from '../../utils'
import { getInitialReviewEntry, calculateNextReview } from '../../utils/spaced-repetition'
import { loadAppSettings } from '../../services/storage/SettingsStorage'
import { callAI } from '@ielts/ai'
import type { ProviderConfig } from '@ielts/ai'

export interface VocabStats {
  total: number
  newCount: number
  learning: number
  reviewing: number
  mastered: number
  hardCount: number
  dueForReview: number
  masteredCount: number
  learningCount: number
}

export interface VocabFilter {
  search?: string
  topic?: string
  status?: VocabStatus | ''
  difficulty?: VocabDifficulty | ''
  tag?: string
  view?: 'all' | 'favorites' | 'difficult'
}

export interface VocabExercisePrompt {
  skill: 'Vocabulary'
  topic: string
  prompt: string
  instructions: string
  wordsToUse: string[]
  estimatedMinutes: number
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function getAllVocabulary(): Promise<VocabularyEntry[]> {
  return DatabaseService.getAll<VocabularyEntry>('vocabulary')
}

export async function getVocabularyById(id: string): Promise<VocabularyEntry | undefined> {
  return DatabaseService.getById<VocabularyEntry>('vocabulary', id)
}

export async function addVocabulary(
  entry: Omit<VocabularyEntry, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<VocabularyEntry> {
  const now = new Date().toISOString()
  const full: VocabularyEntry = {
    ...entry,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  }
  await DatabaseService.add('vocabulary', full)
  return full
}

export async function updateVocabulary(
  id: string,
  changes: Partial<VocabularyEntry>,
): Promise<void> {
  await DatabaseService.update<VocabularyEntry>('vocabulary', id, {
    ...changes,
    updatedAt: new Date().toISOString(),
  })
}

export async function deleteVocabulary(id: string): Promise<void> {
  await DatabaseService.remove('vocabulary', id)
}

export async function upsertVocabulary(entry: VocabularyEntry): Promise<void> {
  await DatabaseService.put('vocabulary', entry)
}

export function filterVocabulary(
  entries: VocabularyEntry[],
  filter: VocabFilter,
): VocabularyEntry[] {
  let filtered = entries

  if (filter.view === 'favorites') {
    filtered = filtered.filter(e => e.tags.includes('favorite'))
  } else if (filter.view === 'difficult') {
    filtered = filtered.filter(e => e.difficulty === 'hard')
  }

  if (filter.search) {
    const q = filter.search.toLowerCase()
    filtered = filtered.filter(
      e =>
        e.word.toLowerCase().includes(q) ||
        e.meaning.toLowerCase().includes(q) ||
        e.meaningVi.toLowerCase().includes(q) ||
        e.exampleSentence.toLowerCase().includes(q),
    )
  }

  if (filter.topic) {
    filtered = filtered.filter(e => e.topic === filter.topic)
  }

  if (filter.status) {
    filtered = filtered.filter(e => e.status === filter.status)
  }

  if (filter.difficulty) {
    filtered = filtered.filter(e => e.difficulty === filter.difficulty)
  }

  if (filter.tag) {
    filtered = filtered.filter(e => e.tags.includes(filter.tag!))
  }

  return filtered.sort((a, b) => a.word.localeCompare(b.word))
}

export async function computeStats(entries?: VocabularyEntry[]): Promise<VocabStats> {
  const all = entries ?? await getAllVocabulary()
  const reviews = await DatabaseService.getAll<VocabReviewEntry>('vocabularyReviews')

  const dueForReview = reviews.filter(r => {
    if (r.interval >= 21 && r.repetitions >= 5) return false
    const nextDate = new Date(r.nextReviewDate)
    nextDate.setHours(0, 0, 0, 0)
    return nextDate <= new Date()
  }).length

  const newWords = all.filter(v => {
    const review = reviews.find(r => r.vocabularyId === v.id)
    return !review
  }).length

  return {
    total: all.length,
    newCount: all.filter(e => e.status === 'new').length,
    learning: all.filter(e => e.status === 'learning').length,
    reviewing: all.filter(e => e.status === 'reviewing').length,
    mastered: all.filter(e => e.status === 'mastered').length,
    hardCount: all.filter(e => e.difficulty === 'hard').length,
    dueForReview,
    masteredCount: reviews.filter(r => r.interval >= 21 && r.repetitions >= 5).length,
    learningCount: reviews.filter(r => r.interval < 21 || r.repetitions < 5).length,
  }
}

export async function getAllTags(entries?: VocabularyEntry[]): Promise<string[]> {
  const all = entries ?? await getAllVocabulary()
  const tags = new Set<string>()
  for (const e of all) {
    for (const t of e.tags) tags.add(t)
  }
  return Array.from(tags).sort()
}

export async function getWordsByTopic(topic: string): Promise<VocabularyEntry[]> {
  const all = await getAllVocabulary()
  return all.filter(e => e.topic === topic)
}

export async function getWordsByStatus(status: VocabStatus): Promise<VocabularyEntry[]> {
  const all = await getAllVocabulary()
  return all.filter(e => e.status === status)
}

export async function getWordsByTag(tag: string): Promise<VocabularyEntry[]> {
  const all = await getAllVocabulary()
  return all.filter(e => e.tags.includes(tag))
}

export async function toggleFavorite(entry: VocabularyEntry): Promise<VocabularyEntry> {
  const tags = entry.tags.includes('favorite')
    ? entry.tags.filter(t => t !== 'favorite')
    : [...entry.tags, 'favorite']
  const updated: VocabularyEntry = { ...entry, tags, updatedAt: new Date().toISOString() }
  await DatabaseService.put('vocabulary', updated)
  return updated
}

export async function changeStatus(
  entry: VocabularyEntry,
  status: VocabStatus,
): Promise<VocabularyEntry> {
  const updated: VocabularyEntry = { ...entry, status, updatedAt: new Date().toISOString() }
  await DatabaseService.put('vocabulary', updated)
  return updated
}

export async function changeDifficulty(
  entry: VocabularyEntry,
  difficulty: VocabDifficulty,
): Promise<VocabularyEntry> {
  const updated: VocabularyEntry = { ...entry, difficulty, updatedAt: new Date().toISOString() }
  await DatabaseService.put('vocabulary', updated)
  return updated
}

export async function toggleTag(
  entry: VocabularyEntry,
  tag: string,
): Promise<VocabularyEntry> {
  const tags = entry.tags.includes(tag)
    ? entry.tags.filter(t => t !== tag)
    : [...entry.tags, tag]
  const updated: VocabularyEntry = { ...entry, tags, updatedAt: new Date().toISOString() }
  await DatabaseService.put('vocabulary', updated)
  return updated
}

export async function getDueReviewWords(): Promise<VocabularyEntry[]> {
  const [vocabulary, reviews] = await Promise.all([
    getAllVocabulary(),
    DatabaseService.getAll<VocabReviewEntry>('vocabularyReviews'),
  ])

  const todayStr = getToday()
  const reviewMap = new Map(reviews.map(r => [r.vocabularyId, r]))

  const due: VocabularyEntry[] = []
  for (const v of vocabulary) {
    if (v.status === 'mastered') continue
    const review = reviewMap.get(v.id)
    if (review) {
      if (review.nextReviewDate.slice(0, 10) <= todayStr) {
        due.push(v)
      }
    } else if (v.status === 'new' || v.status === 'learning' || v.status === 'reviewing') {
      due.push(v)
    }
  }

  due.sort((a, b) => a.word.localeCompare(b.word))
  return due
}

export async function rateWord(
  entry: VocabularyEntry,
  rating: ReviewRating,
): Promise<VocabReviewEntry> {
  const now = new Date()
  const existing = await DatabaseService.getAll<VocabReviewEntry>('vocabularyReviews')
  let review = existing.find(r => r.vocabularyId === entry.id)

  if (!review) {
    review = getInitialReviewEntry(entry.id, now)
  }

  const updatedReview = calculateNextReview(review, rating, now)
  await DatabaseService.put('vocabularyReviews', updatedReview)

  const vocabStatus: VocabStatus =
    rating === 'again' ? 'learning' :
    (rating === 'good' || rating === 'easy') && entry.status === 'reviewing' ? 'mastered' :
    entry.status === 'new' || entry.status === 'learning' ? 'learning' :
    entry.status

  if (entry.status !== vocabStatus) {
    await changeStatus(entry, vocabStatus)
  }

  return updatedReview
}

export async function generateExercisesFromVocabulary(
  entries: VocabularyEntry[],
  count: number = 3,
): Promise<VocabExercisePrompt[]> {
  const prompts: VocabExercisePrompt[] = []

  if (entries.length === 0) {
    return [{
      skill: 'Vocabulary',
      topic: 'Environment',
      prompt: 'Write a paragraph about environmental protection using topic-specific vocabulary.',
      instructions: 'Write 4-5 sentences describing why protecting the environment is important. Try to use words like: sustainable, pollution, conservation, ecosystem, and biodiversity.',
      wordsToUse: ['sustainable', 'pollution', 'conservation', 'ecosystem', 'biodiversity'],
      estimatedMinutes: 10,
    }]
  }

  const settings = loadAppSettings()
  const config: ProviderConfig | null = settings.aiApiKey
    ? {
        apiKey: settings.aiApiKey,
        baseUrl: settings.aiEndpoint || 'https://api.openai.com/v1',
        model: settings.aiModel || 'gpt-4o-mini',
      }
    : null

  const chunkSize = Math.ceil(entries.length / count)
  for (let i = 0; i < count; i++) {
    const chunk = entries.slice(i * chunkSize, (i + 1) * chunkSize)
    if (chunk.length === 0) break

    const words = chunk.map(v => v.word)
    const meanings = chunk.map(v => v.meaning).filter(Boolean)
    const topics = [...new Set(chunk.map(v => v.topic))].filter(Boolean)

    if (config) {
      const wordDetails = chunk.map(v =>
        `- "${v.word}": ${v.meaning}${v.exampleSentence ? ` (e.g., ${v.exampleSentence})` : ''}`
      ).join('\n')

      const aiPrompt = `You are an IELTS tutor. Create an IELTS-style writing exercise using these vocabulary words.

Words to use:
${wordDetails}

Return a JSON object with these fields:
- "topic": a specific IELTS topic
- "prompt": a writing prompt that incorporates these words naturally
- "instructions": clear step-by-step instructions
- "estimatedMinutes": estimated time in minutes (integer)`

      const { content, error } = await callAI(
        aiPrompt,
        'Generate an IELTS writing exercise using the provided vocabulary words. Return valid JSON only.',
        () => config,
        { temperature: 0.7, maxTokens: 300 },
      )

      if (!error && content) {
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0])
            prompts.push({
              skill: 'Vocabulary',
              topic: parsed.topic || (topics.length > 0 ? topics.join(', ') : `Saved Words ${i + 1}`),
              prompt: parsed.prompt || `Practice using these words in context: ${words.join(', ')}`,
              instructions: parsed.instructions || `Write sentences using: ${words.join(', ')}`,
              wordsToUse: words,
              estimatedMinutes: parsed.estimatedMinutes || Math.max(5, words.length * 2),
            })
            continue
          }
        } catch {
          // fall through to template fallback
        }
      }
    }

    prompts.push({
      skill: 'Vocabulary',
      topic: topics.length > 0 ? topics.join(', ') : `Saved Words ${i + 1}`,
      prompt: `Practice using these ${words.length} saved word${words.length > 1 ? 's' : ''} in context: ${words.join(', ')}`,
      instructions: meanings.length > 0
        ? `Write one sentence for each word below to show you understand its meaning:\n${words.map((w, j) => `- "${w}": ${meanings[j] ?? 'use in context'}`).join('\n')}`
        : `Write one sentence for each word: ${words.join(', ')}`,
      wordsToUse: words,
      estimatedMinutes: Math.max(5, words.length * 2),
    })
  }

  return prompts
}

export async function getRecentlySaved(days: number = 7): Promise<VocabularyEntry[]> {
  const all = await getAllVocabulary()
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  return all.filter(v => new Date(v.createdAt) >= cutoff)
}

export async function searchVocabulary(query: string): Promise<VocabularyEntry[]> {
  const all = await getAllVocabulary()
  const q = query.toLowerCase()
  return all.filter(
    e =>
      e.word.toLowerCase().includes(q) ||
      e.meaning.toLowerCase().includes(q) ||
      e.meaningVi.toLowerCase().includes(q) ||
      e.exampleSentence.toLowerCase().includes(q),
  )
}
