// ═══════════════════════════════════════════════════════════════════════
// SentenceCompletionGenerator — Part 4, fills-in-sentence-blank style
// ═══════════════════════════════════════════════════════════════════════

import type { QuestionLayout, ValidationError } from '../types'
import type { QuestionTypeStrategy, QuestionTypeBuildInput, QuestionTypeBuildOutput } from './question-type'
import { entityLabel } from '../strategies/shared'

export const sentenceCompletionGenerator: QuestionTypeStrategy = {
  layout: 'sentence-completion' as QuestionLayout,
  label: 'Sentence Completion',

  supportsPart(part: string): boolean {
    return part === 'part4'
  },

  build(input: QuestionTypeBuildInput): QuestionTypeBuildOutput {
    const { entities, scenarioTitle } = input
    const maxWord = Math.max(1, ...entities.map(e => e.wordLimit))
    const wordStr = maxWord === 1 ? 'ONE WORD' : maxWord === 2 ? 'TWO WORDS' : 'THREE WORDS'

    return {
      layout: 'sentence-completion',
      presentation: {
        layoutType: 'note-completion',
        title: `${scenarioTitle} — Sentence Completion`,
        instruction: `Complete each sentence with NO MORE THAN ${wordStr} AND/OR A NUMBER.`,
        items: entities.map((e, i) => ({
          label: `${i + 1}. The ${entityLabel(e.category).toLowerCase()} is __________`,
          entityId: e.id,
          answerValue: e.value,
          acceptableAlternatives: e.acceptableAlternatives,
          wordLimit: e.wordLimit,
          order: i + 1,
          bullet: false,
        })),
      },
      instructions: `Write NO MORE THAN ${wordStr} AND/OR A NUMBER for each answer.\n\nComplete the sentences below.`,
      totalQuestions: entities.length,
    }
  },

  validate(_p, _e): ValidationError[] { return [] },
}
