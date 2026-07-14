import type { Exercise } from '@ielts/learning-engine'

type StorageDifficulty = 'beginner' | 'intermediate' | 'advanced'
type StorageSource = 'built-in' | 'user-created' | 'ai-generated' | 'web-content' | 'mistake-review' | 'vocabulary-practice'
type StorageSkill = 'reading' | 'listening' | 'writing' | 'speaking' | 'vocabulary' | 'grammar'

interface ExerciseEntry {
  id: string; title: string; description: string; skill: StorageSkill
  topic: string; source: StorageSource; difficulty: StorageDifficulty
  content: string; questions: string; totalPoints: number; estimatedMinutes: number
  status: 'draft' | 'published' | 'archived'; tags: string[]
  sourceId?: string; contentVersion?: number; metadata: string
  isFavorite: boolean; createdAt: string; updatedAt: string
}

const VALID_SKILLS: ReadonlySet<string> = new Set<StorageSkill>([
  'reading', 'listening', 'writing', 'speaking', 'vocabulary', 'grammar',
])

const SOURCE_MAP: Readonly<Record<string, StorageSource>> = {
  'built-in': 'built-in',
  'ai-generated': 'ai-generated',
  'saved-content': 'web-content',
  'saved-vocabulary': 'vocabulary-practice',
  'user-mistakes': 'mistake-review',
  'youtube-transcript': 'web-content',
  article: 'web-content',
  manual: 'user-created',
}

function normalizeSkill(raw: unknown): StorageSkill {
  const s = String(raw ?? '').trim().toLowerCase()
  if (VALID_SKILLS.has(s)) return s as StorageSkill
  if (s === 'vocab') return 'vocabulary'
  if (s === 'grammer') return 'grammar'
  return 'reading'
}

function normalizeDifficulty(raw: unknown): StorageDifficulty {
  switch (String(raw ?? '').trim().toLowerCase()) {
    case 'easy':
    case 'beginner':
      return 'beginner'
    case 'hard':
    case 'advanced':
    case 'expert':
      return 'advanced'
    default:
      return 'intermediate'
  }
}

function normalizeSource(raw: unknown): StorageSource {
  const s = String(raw ?? '').trim().toLowerCase()
  return SOURCE_MAP[s] ?? 'ai-generated'
}

function serializeJson(value: unknown, fallback: unknown): string {
  if (value === undefined || value === null) return JSON.stringify(fallback)
  if (typeof value === 'string') return value
  return JSON.stringify(value)
}

export function exerciseToEntry(exercise: Exercise): ExerciseEntry {
  const now = new Date().toISOString()

  const entry = {
    id: exercise.id,
    title: exercise.title ?? 'Exercise',
    description: exercise.instructions ?? '',
    skill: normalizeSkill(exercise.skill),
    topic: 'general',
    source: normalizeSource(exercise.sourceType),
    difficulty: normalizeDifficulty(exercise.difficulty),
    content: serializeJson(exercise.content, ''),
    questions: serializeJson(exercise.questions, []),
    totalPoints: 0,
    estimatedMinutes: exercise.estimatedMinutes ?? 0,
    status: 'published' as const,
    tags: [],
    sourceId: exercise.sourceIds?.[0],
    contentVersion: undefined,
    metadata: serializeJson(exercise.metadata, {}),
    isFavorite: false,
    createdAt: now,
    updatedAt: now,
  }

  return entry
}
