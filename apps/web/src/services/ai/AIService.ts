import { generateFromEngine } from '../learning/ai-exercise-session'

export async function generateReadingPassage(opts: { topic: string; difficulty: string }): Promise<{ content: string | null; error: string | null }> {
  return generateFromEngine('reading', `Reading: ${opts.topic}`, opts.difficulty, 20,
    opts.topic ? { id: crypto.randomUUID?.() ?? 't', type: 'selected-text' as const, text: opts.topic } : undefined)
}

export async function generateQuestionsForPassage(opts: { title: string; text: string; difficulty: string }): Promise<{ content: string | null; error: string | null }> {
  return generateFromEngine('reading', `Questions: ${opts.title}`, opts.difficulty, 15,
    opts.text ? { id: crypto.randomUUID?.() ?? 'p', type: 'selected-text' as const, text: opts.text } : undefined)
}

export async function checkWriting(text: string, taskType: string, examType: string, targetBand: number): Promise<any> {
  const r = await generateFromEngine('writing', `Writing ${taskType}`, 'medium', 20)
  if (r.content) try { return JSON.parse(r.content) } catch {}
  return { taskResponse: '', coherence: '', vocabulary: '', grammar: '', bandScore: 0, overallFeedback: '', improvedVersion: '', mistakes: [] }
}

export async function getSpeakingFeedback(response: string, part: number, topic: string): Promise<any> {
  const r = await generateFromEngine('speaking', `Speaking Part ${part}: ${topic}`, 'medium', 15)
  if (r.content) try { return JSON.parse(r.content) } catch {}
  return { fluencyNotes: '', vocabularyNotes: '', grammarNotes: '', pronunciationNotes: '', betterExpressions: '', improvedAnswer: '' }
}

export async function generateGrammarExercises(topic: string, count: number): Promise<any> {
  const r = await generateFromEngine('grammar', `Grammar: ${topic}`, 'medium', 15)
  if (r.content) try { return JSON.parse(r.content) } catch {}
  return { exercises: [] }
}

export async function generateListeningExercise(topic: string, difficulty: string): Promise<any> {
  const r = await generateFromEngine('listening', `Listening: ${topic}`, difficulty, 20)
  if (r.content) try { return JSON.parse(r.content) } catch {}
  return { transcript: '', questions: [] }
}
