import { getLearningEngine } from '../../services/engineBootstrap'
import type { GrammarExerciseItem } from './components/Exercise'

export async function loadSavedGrammarExercises(): Promise<Map<string, GrammarExerciseItem[]>> {
  const engine = getLearningEngine()
  if (!engine) return new Map()

  const result = await engine.getExercises('grammar')
  const byTopic = new Map<string, GrammarExerciseItem[]>()

  if (result.status === 'failure' || !result.data) return byTopic

  for (const e of result.data.exercises as unknown as Record<string, unknown>[]) {
    const topic = (e.topic as string) || 'General'

    let rawQuestions: any[] = []
    const q = e.questions
    if (typeof q === 'string') {
      try { rawQuestions = JSON.parse(q) } catch {}
    } else if (Array.isArray(q)) {
      rawQuestions = q
    }

    const items: GrammarExerciseItem[] = rawQuestions.map((q: any, i: number) => ({
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