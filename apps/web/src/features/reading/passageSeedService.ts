import { DatabaseService } from '../../services/storage/Database'
import type { ReadingPassageWithQuestions, ReadingQuestion } from '../../models'

export async function loadAllPassages(): Promise<ReadingPassageWithQuestions[]> {
  const [seedPassages, userEntries] = await Promise.all([
    DatabaseService.getAll<Record<string, unknown>>('readingPassages').catch(() => []),
    DatabaseService.getAll<Record<string, unknown>>('passages').catch(() => []),
  ])

  const result: ReadingPassageWithQuestions[] = []

  for (const p of seedPassages) {
    const notes = typeof p.notes === 'string' ? p.notes : '{}'
    let extra: { questions?: ReadingQuestion[]; estimatedMinutes?: number } = {}
    try { extra = JSON.parse(notes) } catch {}

    result.push({
      id: p.id as string,
      title: p.title as string,
      topic: p.topic as string || 'General',
      text: p.content as string,
      questions: extra.questions || [],
      difficulty: (p.difficulty as 'easy' | 'medium' | 'hard') || 'medium',
      wordCount: (p.wordCount as number) || 0,
      estimatedMinutes: extra.estimatedMinutes || Math.max(1, Math.ceil(((p.wordCount as number) || 0) / 80)),
    })
  }

  for (const p of userEntries) {
    const content = (p.content as string) || ''
    if (content.length < 50) continue
    result.push({
      id: p.id as string,
      title: (p.title as string) || 'Untitled',
      topic: (p.topic as string) || 'General',
      text: content,
      questions: [],
      difficulty: (p.difficulty as 'easy' | 'medium' | 'hard') || 'medium',
      wordCount: content.split(/\s+/).filter(Boolean).length,
      estimatedMinutes: Math.max(1, Math.ceil(content.split(/\s+/).filter(Boolean).length / 80)),
    })
  }

  return result
}
