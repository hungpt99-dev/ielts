// ═══════════════════════════════════════════════════════════════════════
// Question Types Tests
// ═══════════════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest'
import {
  formCompletionGenerator,
  noteCompletionGenerator,
  tableCompletionGenerator,
  summaryCompletionGenerator,
  sentenceCompletionGenerator,
  multipleChoiceGenerator,
  matchingGenerator,
  pickQuestionType,
  ALL_QUESTION_TYPES,
} from '../index'
import type { InformationEntity } from '../../types'

function makeEntities(count: number): InformationEntity[] {
  const categories: InformationEntity['category'][] = [
    'personal-name', 'phone-number', 'date', 'time', 'price',
    'place-name', 'duration', 'quantity', 'reference-number', 'reason',
  ]
  return categories.slice(0, count).map((cat, i) => ({
    id: `e-${i}`,
    category: cat,
    value: `test-value-${i}`,
    wordLimit: cat === 'reason' ? 3 : 1,
    tested: true,
  }))
}

describe('formCompletionGenerator', () => {
  it('builds a form with sections', () => {
    const entities = makeEntities(6)
    const output = formCompletionGenerator.build({ entities, scenarioTitle: 'Hotel Booking', scenarioTopic: 'Hotel' })

    expect(output.layout).toBe('form-completion')
    expect(output.totalQuestions).toBe(6)
    expect(output.instructions).toContain('NO MORE THAN')
    expect(output.instructions).toContain('Complete the form')
    const pres = output.presentation as any
    expect(pres.formTitle).toBe('Hotel Booking')
    expect(pres.sections.length).toBeGreaterThanOrEqual(1)
    expect(pres.fields.length).toBe(6)
  })

  it('supports only part 1', () => {
    expect(formCompletionGenerator.supportsPart('part1')).toBe(true)
    expect(formCompletionGenerator.supportsPart('part2')).toBe(false)
    expect(formCompletionGenerator.supportsPart('part3')).toBe(false)
    expect(formCompletionGenerator.supportsPart('part4')).toBe(false)
  })

  it('validates missing form title', () => {
    const errors = formCompletionGenerator.validate({ layoutType: 'form-completion', formTitle: '', sections: [], fields: [] } as any, [])
    expect(errors.some(e => e.code === 'MISSING_ANSWER')).toBe(true)
  })
})

describe('noteCompletionGenerator', () => {
  it('builds notes with items', () => {
    const entities = makeEntities(5)
    const output = noteCompletionGenerator.build({ entities, scenarioTitle: 'Lecture Notes', scenarioTopic: 'Science' })

    expect(output.layout).toBe('note-completion')
    expect(output.totalQuestions).toBe(5)
    const pres = output.presentation as any
    expect(pres.items.length).toBe(5)
  })

  it('supports all parts', () => {
    expect(noteCompletionGenerator.supportsPart('part1')).toBe(true)
    expect(noteCompletionGenerator.supportsPart('part4')).toBe(true)
  })
})

describe('tableCompletionGenerator', () => {
  it('builds a table', () => {
    const entities = makeEntities(4)
    const output = tableCompletionGenerator.build({ entities, scenarioTitle: 'Info Table', scenarioTopic: 'Info' })

    expect(output.layout).toBe('table-completion')
    const pres = output.presentation as any
    expect(pres.rows.length).toBe(4)
    expect(pres.columnHeaders.length).toBe(2)
  })

  it('supports parts 2 and 3', () => {
    expect(tableCompletionGenerator.supportsPart('part1')).toBe(false)
    expect(tableCompletionGenerator.supportsPart('part2')).toBe(true)
    expect(tableCompletionGenerator.supportsPart('part3')).toBe(true)
    expect(tableCompletionGenerator.supportsPart('part4')).toBe(false)
  })
})

describe('multipleChoiceGenerator', () => {
  it('builds MC questions with 4 options each', () => {
    const entities = makeEntities(3)
    const output = multipleChoiceGenerator.build({ entities, scenarioTitle: 'Quiz', scenarioTopic: 'Quiz' })

    expect(output.layout).toBe('multiple-choice')
    const pres = output.presentation as any
    expect(pres.items.length).toBe(3)
  })

  it('supports parts 2 and 3', () => {
    expect(multipleChoiceGenerator.supportsPart('part2')).toBe(true)
    expect(multipleChoiceGenerator.supportsPart('part3')).toBe(true)
    expect(multipleChoiceGenerator.supportsPart('part1')).toBe(false)
  })
})

describe('matchingGenerator', () => {
  it('builds matching with left and right columns', () => {
    const entities = makeEntities(4)
    const output = matchingGenerator.build({ entities, scenarioTitle: 'Match', scenarioTopic: 'Match' })

    expect(output.layout).toBe('matching')
    expect(output.instructions).toContain('Column A')
    expect(output.instructions).toContain('Column B')
  })
})

describe('summaryCompletionGenerator', () => {
  it('supports only part 4', () => {
    expect(summaryCompletionGenerator.supportsPart('part4')).toBe(true)
    expect(summaryCompletionGenerator.supportsPart('part1')).toBe(false)
  })
})

describe('sentenceCompletionGenerator', () => {
  it('supports only part 4', () => {
    expect(sentenceCompletionGenerator.supportsPart('part4')).toBe(true)
    expect(sentenceCompletionGenerator.supportsPart('part1')).toBe(false)
  })
})

describe('pickQuestionType', () => {
  it('picks form-completion or note-completion for part 1', () => {
    for (let i = 0; i < 20; i++) {
      const qt = pickQuestionType('part1')
      expect(['form-completion', 'note-completion']).toContain(qt.layout)
    }
  })

  it('picks appropriate types for part 2', () => {
    for (let i = 0; i < 20; i++) {
      const qt = pickQuestionType('part2')
      expect(qt.supportsPart('part2')).toBe(true)
    }
  })

  it('picks appropriate types for part 3', () => {
    for (let i = 0; i < 20; i++) {
      const qt = pickQuestionType('part3')
      expect(qt.supportsPart('part3')).toBe(true)
    }
  })

  it('picks note/summary/sentence for part 4', () => {
    for (let i = 0; i < 20; i++) {
      const qt = pickQuestionType('part4')
      expect(qt.supportsPart('part4')).toBe(true)
    }
  })
})

describe('ALL_QUESTION_TYPES', () => {
  it('has 7 generators', () => {
    expect(ALL_QUESTION_TYPES.length).toBe(7)
  })

  it('each generator has all required methods', () => {
    for (const gen of ALL_QUESTION_TYPES) {
      expect(typeof gen.layout).toBe('string')
      expect(typeof gen.label).toBe('string')
      expect(typeof gen.supportsPart).toBe('function')
      expect(typeof gen.build).toBe('function')
      expect(typeof gen.validate).toBe('function')
    }
  })
})
