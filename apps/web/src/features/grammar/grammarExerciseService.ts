import { DatabaseService } from '../../services/storage/Database'
import type { GrammarExerciseItem } from './components/Exercise'

function getGrammarQuestions(e: Record<string, unknown>): any[] {
  const raw = e.questions
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) } catch (error) {
  console.error('apps/web/src/features/grammar/grammarExerciseService.ts error:', error);
    }
  }
  return []
}

export async function loadSavedGrammarExercises(): Promise<Map<string, GrammarExerciseItem[]>> {
  const all = await DatabaseService.getAll<Record<string, unknown>>('readingExercises').catch(() => [])
  const byTopic = new Map<string, GrammarExerciseItem[]>()
  for (const e of all) {
    const skill = e.skill as string | undefined
    if (skill && skill !== 'grammar') continue
    const topic = (e.topic as string) || 'General'
    const questions = getGrammarQuestions(e)
    const items: GrammarExerciseItem[] = questions.map((q: any, i: number) => ({
      id: `saved-${(e.id as string) || ''}-${i}`,
      topic,
      type: (q.type === 'true-false-not-given' ? 'true-false' : q.type === 'error-correction' ? 'error-correction' : 'multiple-choice') as GrammarExerciseItem['type'],
      question: q.question || '',
      options: Array.isArray(q.options) ? q.options as string[] : undefined,
      correctAnswer: String(q.correctIndex ?? q.answer ?? ''),
      explanation: q.explanation || '',
    }))
    if (items.length > 0) byTopic.set(topic, items)
  }
  return byTopic
}