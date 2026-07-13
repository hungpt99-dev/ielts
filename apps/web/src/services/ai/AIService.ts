import { generateFromEngine } from '../learning/ai-exercise-session'

export async function generateQuestionsForPassage(opts: { title: string; text: string; difficulty: string }): Promise<{ content: string | null; error: string | null }> {
  return generateFromEngine('reading', `Questions: ${opts.title}`, opts.difficulty, 15,
    opts.text ? { id: crypto.randomUUID?.() ?? 'p', type: 'selected-text' as const, text: opts.text } : undefined)
}
