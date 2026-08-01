import type { VocabularyEntry } from '@ielts/storage'

export interface VocabExercisePrompt {
  skill: 'Vocabulary'
  topic: string
  prompt: string
  instructions: string
  wordsToUse: string[]
  estimatedMinutes: number
}

export class PracticeEngine {
  generateExercisesFromVocabulary(
    entries: VocabularyEntry[],
    count: number = 3,
  ): VocabExercisePrompt[] {
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

    const prompts: VocabExercisePrompt[] = []
    const chunkSize = Math.ceil(entries.length / count)
    for (let i = 0; i < count; i++) {
      const chunk = entries.slice(i * chunkSize, (i + 1) * chunkSize)
      if (chunk.length === 0) break

      const words = chunk.map(v => v.word)
      const meanings = chunk.map(v => v.meaning).filter(Boolean)
      const topics = [...new Set(chunk.map(v => v.topic))].filter(Boolean)

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
}
