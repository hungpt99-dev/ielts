// ═══════════════════════════════════════════════════════════════════════
// FormCompletionGenerator — Part 1 booking forms, registration forms
// ═══════════════════════════════════════════════════════════════════════

import type { FormLayout, QuestionLayout, ValidationError } from '../types'
import type { QuestionTypeStrategy, QuestionTypeBuildInput, QuestionTypeBuildOutput } from './question-type'
import { entityLabel } from '../strategies/shared'

export const formCompletionGenerator: QuestionTypeStrategy = {
  layout: 'form-completion' as QuestionLayout,
  label: 'Form Completion',

  supportsPart(part: string): boolean {
    return part === 'part1'
  },

  build(input: QuestionTypeBuildInput): QuestionTypeBuildOutput {
    const { entities, scenarioTitle } = input

    const personalCats = new Set(['personal-name', 'phone-number', 'address', 'document-type', 'occupation'])
    const sections: FormLayout['sections'] = []
    const fields: FormLayout['fields'] = []

    const personalSection = { id: 's-personal', title: 'Personal Details', fields: [] as typeof fields }
    const detailSection = { id: 's-details', title: 'Booking Information', fields: [] as typeof fields }

    for (let i = 0; i < entities.length; i++) {
      const e = entities[i]
      const field = { id: `f-${e.id}`, label: entityLabel(e.category), entityId: e.id, answerValue: e.value, acceptableAlternatives: e.acceptableAlternatives, wordLimit: e.wordLimit, order: i + 1, section: personalCats.has(e.category) ? 's-personal' : 's-details' }
      fields.push(field)
      if (personalCats.has(e.category)) personalSection.fields.push(field)
      else detailSection.fields.push(field)
    }

    if (personalSection.fields.length > 0) sections.push(personalSection)
    if (detailSection.fields.length > 0) sections.push(detailSection)

    const maxWord = Math.max(1, ...entities.map(e => e.wordLimit))
    const wordStr = maxWord === 1 ? 'ONE WORD' : maxWord === 2 ? 'TWO WORDS' : 'THREE WORDS'

    return {
      layout: 'form-completion',
      presentation: { layoutType: 'form-completion', formTitle: scenarioTitle, sections: sections.filter(s => s.fields.length > 0), fields },
      instructions: `Write NO MORE THAN ${wordStr} AND/OR A NUMBER for each answer.\n\nComplete the form below.`,
      totalQuestions: entities.length,
    }
  },

  validate(presentation, _entities): ValidationError[] {
    const errors: ValidationError[] = []
    const form = presentation as FormLayout
    if (!form.formTitle) errors.push({ code: 'MISSING_ANSWER', message: 'Form has no title', severity: 'error' })
    if (form.fields.length === 0) errors.push({ code: 'MISSING_ANSWER', message: 'Form has no fields', severity: 'error' })
    for (const f of form.fields) {
      if (!f.answerValue) errors.push({ code: 'MISSING_ANSWER', message: `Field "${f.label}" has no answer`, entityId: f.entityId, severity: 'error' })
    }
    return errors
  },
}
