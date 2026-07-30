// ═══════════════════════════════════════════════════════════════════════
// MultipleChoiceGenerator — Parts 2, 3
// ═══════════════════════════════════════════════════════════════════════

import type { InformationEntity, QuestionLayout, ValidationError } from '../types'
import type { QuestionTypeStrategy, QuestionTypeBuildInput, QuestionTypeBuildOutput } from './question-type'
import { entityLabel } from '../strategies/shared'

const WRONG_OPTIONS: Record<string, string[][]> = {
  'date': [['the 5th of June', 'Monday the 12th', 'the 28th of May']],
  'time': [['9:30 am', '11:00 am', '2:45 pm']],
  'price': [['£25', '£45', '£55']],
  'place-name': [['Main Hall', 'Room 204', 'The Library']],
  'duration': [['2 weeks', '5 weeks', '8 weeks']],
  'quantity': [['2', '6', '8']],
  'transport-method': [['train', 'taxi', 'walking']],
  'reason': [['cost reasons', 'time constraints', 'staff shortage']],
  'opinion': [['it needs improvement', 'it is outdated', 'it is too complex']],
}

export const multipleChoiceGenerator: QuestionTypeStrategy = {
  layout: 'multiple-choice' as QuestionLayout,
  label: 'Multiple Choice',

  supportsPart(part: string): boolean {
    return part === 'part2' || part === 'part3'
  },

  build(input: QuestionTypeBuildInput): QuestionTypeBuildOutput {
    const { entities, scenarioTitle } = input
    const mcQuestions: Array<{ entity: InformationEntity; question: string; options: string[]; correctValue: string }> = []

    for (const entity of entities) {
      const wrongOpts = WRONG_OPTIONS[entity.category]?.[0] || ['Option B', 'Option C', 'Option D']
      const options = [entity.value, ...wrongOpts.slice(0, 3)]
      // Shuffle
      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]]
      }
      mcQuestions.push({
        entity,
        question: entity.category === 'opinion' || entity.category === 'reason'
          ? `What is the stated ${entity.category} regarding ${scenarioTitle.toLowerCase()}?`
          : `What is the ${entityLabel(entity.category).toLowerCase()}?`,
        options,
        correctValue: entity.value,
      })
    }

    return {
      layout: 'multiple-choice',
      presentation: {
        layoutType: 'note-completion',
        title: `${scenarioTitle} — Multiple Choice`,
        instruction: 'Choose the correct letter, A, B, C or D.',
        items: mcQuestions.map((mc, i) => {
          const labels = ['A', 'B', 'C', 'D']
          return {
            label: `${i + 1}. ${mc.question}\n${mc.options.map((o, oi) => `    ${labels[oi]}. ${o}`).join('\n')}`,
            entityId: mc.entity.id,
            answerValue: mc.correctValue,
            acceptableAlternatives: mc.options.map((o, oi) => o === mc.correctValue ? labels[oi] : '').filter(Boolean),
            wordLimit: 1,
            order: i + 1,
            bullet: false,
          }
        }),
      },
      instructions: 'Choose the correct letter, A, B, C or D. Write your answers in the spaces provided.',
      totalQuestions: entities.length,
    }
  },

  validate(_p, _e): ValidationError[] { return [] },
}
