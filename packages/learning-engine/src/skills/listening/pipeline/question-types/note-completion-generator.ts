// ═══════════════════════════════════════════════════════════════════════
// NoteCompletionGenerator — All parts, bullet-point notes
// ═══════════════════════════════════════════════════════════════════════

import type { NoteLayout, QuestionLayout, ValidationError } from '../types'
import type { QuestionTypeStrategy, QuestionTypeBuildInput, QuestionTypeBuildOutput } from './question-type'
import { entityLabel } from '../strategies/shared'

export const noteCompletionGenerator: QuestionTypeStrategy = {
  layout: 'note-completion' as QuestionLayout,
  label: 'Note Completion',

  supportsPart(): boolean { return true },

  build(input: QuestionTypeBuildInput): QuestionTypeBuildOutput {
    const { entities, scenarioTitle } = input
    const items: NoteLayout['items'] = entities.map((e, i) => ({
      label: entityLabel(e.category),
      entityId: e.id,
      answerValue: e.value,
      acceptableAlternatives: e.acceptableAlternatives,
      wordLimit: e.wordLimit,
      order: i + 1,
      bullet: true,
    }))

    const maxWord = Math.max(1, ...entities.map(e => e.wordLimit))
    const wordStr = maxWord === 1 ? 'ONE WORD' : maxWord === 2 ? 'TWO WORDS' : 'THREE WORDS'

    return {
      layout: 'note-completion',
      presentation: { layoutType: 'note-completion', title: scenarioTitle, instruction: `Complete the notes below.`, items },
      instructions: `Write NO MORE THAN ${wordStr} AND/OR A NUMBER for each answer.\n\nComplete the notes below.`,
      totalQuestions: entities.length,
    }
  },

  validate(presentation, _entities): ValidationError[] {
    const errors: ValidationError[] = []
    const notes = presentation as NoteLayout
    if (notes.items.length === 0) errors.push({ code: 'MISSING_ANSWER', message: 'No note items', severity: 'error' })
    for (const item of notes.items) {
      if (!item.answerValue) errors.push({ code: 'MISSING_ANSWER', message: `Note item "${item.label}" has no answer`, entityId: item.entityId, severity: 'error' })
    }
    return errors
  },
}
