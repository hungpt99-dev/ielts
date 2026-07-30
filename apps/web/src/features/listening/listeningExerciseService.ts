import { getLearningEngine } from '../../services/engineBootstrap'
import type { ListeningExercise, ListeningQuestion } from '../../models'

function getTranscriptText(e: Record<string, unknown>): string {
  const raw = e.content
  if (typeof raw === 'string') {
    if (raw.startsWith('{')) {
      try {
        const parsed = JSON.parse(raw)
        return (typeof parsed.transcript === 'string' ? parsed.transcript : '') ||
               (typeof parsed.passage === 'string' ? parsed.passage : '')
      } catch { /* malformed listening cache */ }
    }
    return raw
  }
  if (typeof raw === 'object' && raw !== null) {
    return (typeof (raw as any).transcript === 'string' ? (raw as any).transcript : '') ||
           (typeof (raw as any).passage === 'string' ? (raw as any).passage : '')
  }
  return ''
}

function getListeningQuestions(e: Record<string, unknown>): ListeningQuestion[] {
  const raw = e.questions
  let questions: Record<string, unknown>[]
  if (Array.isArray(raw)) {
    questions = raw as Record<string, unknown>[]
  } else if (typeof raw === 'string') {
    try { questions = JSON.parse(raw) as Record<string, unknown>[] } catch { return [] }
  } else {
    return []
  }
  return questions.map((q, i) => normalizeQuestion(q, i))
}

function normalizeQuestion(q: Record<string, unknown>, index: number): ListeningQuestion {
  const type = q.type as string
  const engineText = (q.text as string) || ''

  return {
    id: (q.id as string) || `q-${index}`,
    type: normalizeType(type),
    question: (q.question as string) || extractQuestionFromText(engineText),
    options: Array.isArray(q.options) ? q.options as string[] : undefined,
    correctAnswer: normalizeCorrectAnswer(q),
    acceptableAnswers: Array.isArray(q.acceptableAlternatives)
      ? q.acceptableAlternatives as string[]
      : Array.isArray(q.answers) ? q.answers as string[] : undefined,
    tableHeaders: Array.isArray(q.tableHeaders) ? q.tableHeaders as string[] : undefined,
    tableRows: Array.isArray(q.tableRows) ? q.tableRows as ListeningQuestion['tableRows'] : undefined,
    explanation: (q.explanation as string) || '',
    blanks: Array.isArray(q.answers)
      ? q.answers as string[]
      : Array.isArray((q as any).blanks)
        ? (q as any).blanks as string[]
        : hasGapFillText(engineText) ? [extractBlankValue(q)] : undefined,
    formFields: Array.isArray((q as any).formFields) ? (q as any).formFields : undefined,
    layoutMetadata: (q as any).layoutMetadata as any,
  }
}

function normalizeType(raw: string): ListeningQuestion['type'] {
  if (raw === 'gap-fill' || raw === 'sentence-completion') return 'gap-fill'
  if (raw === 'multiple-choice' || raw === 'multiple-select') return 'multiple-choice'
  if (raw === 'true-false-not-given' || raw === 'yes-no-not-given') return 'true-false'
  if (raw === 'short-answer') return 'short-answer'
  if (raw === 'matching' || raw === 'matching-headings') return 'multiple-answer'
  if (raw === 'table-completion') return 'table-completion'
  return 'gap-fill'
}

function normalizeCorrectAnswer(q: Record<string, unknown>): string | number | string[] {
  if (q.correctAnswer !== undefined) return q.correctAnswer as string | number | string[]
  if (typeof q.correctIndex === 'number') return q.correctIndex as number
  if (typeof q.answer === 'string') return q.answer as string
  const answers = q.answers
  if (Array.isArray(answers) && answers.length > 0) return String(answers[0])
  return ''
}

function extractQuestionFromText(text: string): string {
  if (!text) return ''
  return text.replace(/\s*_+\s*/g, ' __________ ').trim()
}

function hasGapFillText(text: string): boolean {
  return /_+/.test(text) || /blank/i.test(text)
}

function extractBlankValue(q: Record<string, unknown>): string {
  if (typeof q.answer === 'string') return q.answer
  const answers = q.answers
  if (Array.isArray(answers) && answers.length > 0) return String(answers[0])
  return String(q.correctAnswer ?? '')
}

function getListeningDifficulty(e: Record<string, unknown>): 'easy' | 'medium' | 'hard' {
  const d = e.difficulty as string
  const map: Record<string, 'easy' | 'medium' | 'hard'> = {
    beginner: 'easy', intermediate: 'medium', advanced: 'hard',
    easy: 'easy', medium: 'medium', hard: 'hard',
  }
  return map[d] || 'medium'
}

export async function loadListeningExercises(): Promise<ListeningExercise[]> {
  const engine = getLearningEngine()
  if (!engine) return []

  const result = await engine.getExercises('listening')
  if (result.status === 'failure' || !result.data) return []

  const seen = new Set<string>()
  const exercises: ListeningExercise[] = []

  for (const e of result.data.exercises as unknown as Record<string, unknown>[]) {
    const id = e.id as string
    if (seen.has(id)) continue
    seen.add(id)

    const transcript = getTranscriptText(e)
    if (transcript.length < 50) continue

    const questions = getListeningQuestions(e)
    if (questions.length === 0) continue

    // Extract pipeline layout metadata from the first question
    const layoutMeta = (questions[0] as any).layoutMetadata as import('../../models').ListeningPipelineMetadata | undefined

    exercises.push({
      id,
      title: (e.title as string) || 'Untitled',
      topic: (e.topic as string) || 'General',
      transcript,
      audioUrl: '',
      audioType: 'audio',
      questions,
      difficulty: getListeningDifficulty(e),
      wordCount: transcript.split(/\s+/).filter(Boolean).length,
      estimatedMinutes: (e.estimatedMinutes as number) || 12,
      pipelineMetadata: layoutMeta || undefined,
    })
  }

  return exercises
}
