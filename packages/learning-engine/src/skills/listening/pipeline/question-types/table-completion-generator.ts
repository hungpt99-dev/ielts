// ═══════════════════════════════════════════════════════════════════════
// TableCompletionGenerator — Parts 2, 3
// ═══════════════════════════════════════════════════════════════════════

import type { QuestionLayout, TableLayout, ValidationError } from '../types'
import type { QuestionTypeStrategy, QuestionTypeBuildInput, QuestionTypeBuildOutput } from './question-type'
import { entityLabel } from '../strategies/shared'

export const tableCompletionGenerator: QuestionTypeStrategy = {
  layout: 'table-completion' as QuestionLayout,
  label: 'Table Completion',

  supportsPart(part: string): boolean {
    return part === 'part2' || part === 'part3'
  },

  build(input: QuestionTypeBuildInput): QuestionTypeBuildOutput {
    const { entities, scenarioTitle } = input
    const table: TableLayout = {
      layoutType: 'table-completion',
      tableTitle: scenarioTitle,
      columnHeaders: ['Detail', 'Information'],
      rows: entities.map(e => ({
        label: entityLabel(e.category),
        cells: [{ entityId: e.id, answerValue: e.value, blank: true }],
      })),
    }

    const maxWord = Math.max(1, ...entities.map(e => e.wordLimit))
    const wordStr = maxWord === 1 ? 'ONE WORD' : maxWord === 2 ? 'TWO WORDS' : 'THREE WORDS'

    return {
      layout: 'table-completion',
      presentation: table,
      instructions: `Write NO MORE THAN ${wordStr} AND/OR A NUMBER for each answer.\n\nComplete the table below.`,
      totalQuestions: entities.length,
    }
  },

  validate(presentation, _entities): ValidationError[] {
    const errors: ValidationError[] = []
    const table = presentation as TableLayout
    if (table.rows.length === 0) errors.push({ code: 'MISSING_ANSWER', message: 'Table has no rows', severity: 'error' })
    return errors
  },
}
