import { DatabaseService } from '../../services/storage/Database'
import type { ListeningExercise, ListeningQuestion } from '../../models'

function getTranscriptText(e: Record<string, unknown>): string {
  const raw = e.content
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return (typeof parsed.transcript === 'string' ? parsed.transcript : '') ||
             (typeof parsed.passage === 'string' ? parsed.passage : '')
    } catch (error) {
 console.error('apps/web/src/features/listening/listeningExerciseService.ts error:', error);
 return raw }
  }
  if (typeof raw === 'object' && raw !== null) {
    return (typeof (raw as any).transcript === 'string' ? (raw as any).transcript : '') ||
           (typeof (raw as any).passage === 'string' ? (raw as any).passage : '')
  }
  return ''
}

function getListeningQuestions(e: Record<string, unknown>): ListeningQuestion[] {
  const raw = e.questions
  if (Array.isArray(raw)) return raw as ListeningQuestion[]
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) as ListeningQuestion[] } catch (error) {
  console.error('apps/web/src/features/listening/listeningExerciseService.ts error:', error);
    }
  }
  return []
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
  const exercises = await DatabaseService.getAll<Record<string, unknown>>('readingExercises').catch(() => [])
  const result: ListeningExercise[] = []

  for (const e of exercises) {
    const skill = e.skill as string | undefined
    if (skill && skill !== 'listening') continue

    const transcript = getTranscriptText(e)
    if (transcript.length < 50) continue

    const questions = getListeningQuestions(e)

    result.push({
      id: e.id as string,
      title: (e.title as string) || 'Untitled',
      topic: (e.topic as string) || (e.skill as string) || 'General',
      transcript,
      audioUrl: '',
      audioType: 'audio',
      questions,
      difficulty: getListeningDifficulty(e),
      wordCount: transcript.split(/\s+/).filter(Boolean).length,
      estimatedMinutes: (e.estimatedMinutes as number) || 12,
    })
  }

  return result
}