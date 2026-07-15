import { getLearningEngine } from '../../services/engineBootstrap'
import type { ReadingPassageWithQuestions, ReadingQuestion } from '../../models'

export async function loadAllPassages(): Promise<ReadingPassageWithQuestions[]> {
  const engine = getLearningEngine()
  if (!engine) return []

  const result = await engine.getExercises('reading')
  if (result.status === 'failure' || !result.data) return []

  const passages: ReadingPassageWithQuestions[] = []
  const seen = new Set<string>()

  for (const e of result.data.exercises as unknown as Record<string, unknown>[]) {
    const id = e.id as string
    if (seen.has(id)) continue
    seen.add(id)

    const content = (e.content as string) || ''
    if (content.length < 50) continue

    let questions: ReadingQuestion[] = []
    const rawQ = e.questions
    if (typeof rawQ === 'string') {
      try { questions = JSON.parse(rawQ) as ReadingQuestion[] } catch {}
    } else if (Array.isArray(rawQ)) {
      questions = rawQ as ReadingQuestion[]
    }

    const rawDiff = String(e.difficulty || 'medium').toLowerCase()
    const difficulty: 'easy' | 'medium' | 'hard' =
      rawDiff === 'beginner' || rawDiff === 'easy' ? 'easy' :
      rawDiff === 'advanced' || rawDiff === 'hard' ? 'hard' : 'medium'

    passages.push({
      id,
      title: (e.title as string) || 'Untitled',
      topic: (e.topic as string) || 'General',
      text: content,
      questions,
      difficulty,
      wordCount: content.split(/\s+/).filter(Boolean).length,
      estimatedMinutes: (e.estimatedMinutes as number) || Math.max(1, Math.ceil(content.split(/\s+/).filter(Boolean).length / 80)),
    })
  }

  return passages
}