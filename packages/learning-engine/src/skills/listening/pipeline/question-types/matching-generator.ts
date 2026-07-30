// ═══════════════════════════════════════════════════════════════════════
// MatchingGenerator — Parts 2, 3
// ═══════════════════════════════════════════════════════════════════════

import type { QuestionLayout, ValidationError } from '../types'
import type { QuestionTypeStrategy, QuestionTypeBuildInput, QuestionTypeBuildOutput } from './question-type'
import { entityLabel } from '../strategies/shared'

export const matchingGenerator: QuestionTypeStrategy = {
  layout: 'matching' as QuestionLayout,
  label: 'Matching',

  supportsPart(part: string): boolean {
    return part === 'part2' || part === 'part3'
  },

  build(input: QuestionTypeBuildInput): QuestionTypeBuildOutput {
    const { entities, scenarioTitle } = input
    const rightItems = entities.map(e => e.value)
    const shuffledRight = [...rightItems].sort(() => Math.random() - 0.5)
    const label = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']

    return {
      layout: 'matching',
      presentation: {
        layoutType: 'note-completion',
        title: `${scenarioTitle} — Matching`,
        instruction: 'Match each item in Column A with the correct information in Column B. Write the correct letter A–F next to each question.',
        items: entities.map((e, i) => ({
          label: `${i + 1}. ${entityLabel(e.category)}`,
          entityId: e.id,
          answerValue: label[shuffledRight.indexOf(e.value)],
          acceptableAlternatives: [e.value],
          wordLimit: 1,
          order: i + 1,
          bullet: false,
        })),
      },
      instructions: `Match each item with the correct information. Write the correct letter.\n\nColumn A:\n${entities.map((e, i) => `${i + 1}. ${entityLabel(e.category)}`).join('\n')}\n\nColumn B:\n${shuffledRight.map((v, i) => `${label[i]}. ${v}`).join('\n')}`,
      totalQuestions: entities.length,
    }
  },

  validate(_p, _e): ValidationError[] { return [] },
}
