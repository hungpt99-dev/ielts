// ═══════════════════════════════════════════════════════════════════════
// SummaryCompletionGenerator — Part 4 lectures
// ═══════════════════════════════════════════════════════════════════════

import type { QuestionLayout, ValidationError } from '../types'
import type { QuestionTypeStrategy, QuestionTypeBuildInput, QuestionTypeBuildOutput } from './question-type'
import { entityLabel } from '../strategies/shared'

export const summaryCompletionGenerator: QuestionTypeStrategy = {
  layout: 'summary-completion' as QuestionLayout,
  label: 'Summary Completion',

  supportsPart(part: string): boolean {
    return part === 'part4'
  },

  build(input: QuestionTypeBuildInput): QuestionTypeBuildOutput {
    const { entities, scenarioTitle } = input
    const maxWord = Math.max(1, ...entities.map(e => e.wordLimit))
    const wordStr = maxWord === 1 ? 'ONE WORD' : maxWord === 2 ? 'TWO WORDS' : 'THREE WORDS'

    return {
      layout: 'summary-completion',
      presentation: {
        layoutType: 'note-completion',
        title: `${scenarioTitle} — Summary`,
        instruction: `Complete the summary below. Write NO MORE THAN ${wordStr} AND/OR A NUMBER for each answer.`,
        items: entities.map((e, i) => ({
          label: `${entityLabel(e.category)}`,
          entityId: e.id,
          answerValue: e.value,
          acceptableAlternatives: e.acceptableAlternatives,
          wordLimit: e.wordLimit,
          order: i + 1,
          bullet: false,
        })),
      },
      instructions: `Write NO MORE THAN ${wordStr} AND/OR A NUMBER for each answer.\n\nComplete the summary below.`,
      totalQuestions: entities.length,
    }
  },

  validate(_p, _e): ValidationError[] { return [] },
}
