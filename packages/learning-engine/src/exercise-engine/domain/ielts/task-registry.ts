import type { ExerciseCapability, IeltsTestVariant, CompletionWordLimit } from './ielts-types'

export interface ExerciseTypeDefinition {
  readonly id: string
  readonly skill: 'reading' | 'listening' | 'writing' | 'speaking'
  readonly variants: readonly IeltsTestVariant[]
  readonly category: 'exam-authentic' | 'supporting-practice'
  readonly displayName: string
  readonly instructions: string[]
  readonly capability: ExerciseCapability

  readonly wordLimit?: CompletionWordLimit
  readonly requiresAudio: boolean
  readonly requiresVisual: boolean
  readonly requiresPassage: boolean
  readonly requiresTranscript: boolean
}

export class ExerciseTypeRegistry {
  private readonly types = new Map<string, ExerciseTypeDefinition>()

  register(def: ExerciseTypeDefinition): void {
    if (this.types.has(def.id)) {
      throw new Error(`Duplicate exercise type: ${def.id}`)
    }
    this.types.set(def.id, def)
  }

  get(id: string): ExerciseTypeDefinition | undefined {
    return this.types.get(id)
  }

  getBySkill(skill: string): ExerciseTypeDefinition[] {
    return [...this.types.values()].filter(t => t.skill === skill)
  }

  getByVariant(variant: IeltsTestVariant): ExerciseTypeDefinition[] {
    return [...this.types.values()].filter(t => t.variants.includes(variant))
  }

  getExamAuthentic(): ExerciseTypeDefinition[] {
    return [...this.types.values()].filter(t => t.category === 'exam-authentic')
  }

  getAll(): ExerciseTypeDefinition[] {
    return [...this.types.values()]
  }
}

export function createDefaultExerciseRegistry(): ExerciseTypeRegistry {
  const registry = new ExerciseTypeRegistry()

  const readingTypes: ExerciseTypeDefinition[] = [
    {
      id: 'multiple-choice-single', skill: 'reading', variants: ['academic', 'general-training'],
      category: 'exam-authentic', displayName: 'Multiple Choice (Single Answer)',
      instructions: ['Choose the correct letter, A, B, C or D.'],
      capability: { generation: true, validation: true, rendering: true, answerSubmission: true, scoring: true, review: true, persistence: true },
      requiresAudio: false, requiresVisual: false, requiresPassage: true, requiresTranscript: false,
    },
    {
      id: 'multiple-choice-multiple', skill: 'reading', variants: ['academic', 'general-training'],
      category: 'exam-authentic', displayName: 'Multiple Choice (Multiple Answers)',
      instructions: ['Choose TWO letters, A-E.'],
      capability: { generation: true, validation: true, rendering: false, answerSubmission: false, scoring: false, review: false, persistence: false },
      requiresAudio: false, requiresVisual: false, requiresPassage: false, requiresTranscript: false,
    },
    {
      id: 'true-false-not-given', skill: 'reading', variants: ['academic', 'general-training'],
      category: 'exam-authentic', displayName: 'True / False / Not Given',
      instructions: ['Do the following statements agree with the information given in the reading passage?', 'TRUE if the statement agrees with the information', 'FALSE if the statement contradicts the information', 'NOT GIVEN if there is no information on this'],
      capability: { generation: true, validation: true, rendering: true, answerSubmission: true, scoring: true, review: true, persistence: true },
      requiresAudio: false, requiresVisual: false, requiresPassage: true, requiresTranscript: false,
    },
    {
      id: 'yes-no-not-given', skill: 'reading', variants: ['academic', 'general-training'],
      category: 'exam-authentic', displayName: 'Yes / No / Not Given',
      instructions: ['Do the following statements agree with the views of the writer?', 'YES if the statement agrees with the views of the writer', 'NO if the statement contradicts the views of the writer', 'NOT GIVEN if it is impossible to say what the writer thinks about this'],
      capability: { generation: true, validation: true, rendering: true, answerSubmission: true, scoring: true, review: true, persistence: true },
      requiresAudio: false, requiresVisual: false, requiresPassage: true, requiresTranscript: false,
    },
    {
      id: 'matching-headings', skill: 'reading', variants: ['academic', 'general-training'],
      category: 'exam-authentic', displayName: 'Matching Headings',
      instructions: ['Choose the correct heading for each paragraph from the list of headings below.'],
      capability: { generation: true, validation: true, rendering: true, answerSubmission: true, scoring: true, review: true, persistence: true },
      requiresAudio: false, requiresVisual: false, requiresPassage: true, requiresTranscript: false,
    },
    {
      id: 'matching-information', skill: 'reading', variants: ['academic', 'general-training'],
      category: 'exam-authentic', displayName: 'Matching Information',
      instructions: ['Which paragraph contains the following information?', 'Write the correct letter, A, B, C, etc.'],
      capability: { generation: true, validation: true, rendering: true, answerSubmission: true, scoring: true, review: true, persistence: true },
      requiresAudio: false, requiresVisual: false, requiresPassage: true, requiresTranscript: false,
    },
    {
      id: 'sentence-completion', skill: 'reading', variants: ['academic', 'general-training'],
      category: 'exam-authentic', displayName: 'Sentence Completion',
      instructions: ['Complete the sentences below.', 'Choose NO MORE THAN TWO WORDS AND/OR A NUMBER from the passage for each answer.'],
      capability: { generation: true, validation: true, rendering: true, answerSubmission: true, scoring: true, review: true, persistence: true },
      wordLimit: { maxWords: 2, maxNumbers: 1, instruction: 'NO MORE THAN TWO WORDS AND/OR A NUMBER' },
      requiresAudio: false, requiresVisual: false, requiresPassage: true, requiresTranscript: false,
    },
    {
      id: 'summary-completion', skill: 'reading', variants: ['academic', 'general-training'],
      category: 'exam-authentic', displayName: 'Summary Completion',
      instructions: ['Complete the summary using words from the passage.', 'Choose NO MORE THAN TWO WORDS from the passage for each answer.'],
      capability: { generation: true, validation: true, rendering: true, answerSubmission: true, scoring: true, review: true, persistence: true },
      wordLimit: { maxWords: 2, maxNumbers: 0, instruction: 'NO MORE THAN TWO WORDS' },
      requiresAudio: false, requiresVisual: false, requiresPassage: true, requiresTranscript: false,
    },
    {
      id: 'note-completion', skill: 'reading', variants: ['academic', 'general-training'],
      category: 'exam-authentic', displayName: 'Note Completion',
      instructions: ['Complete the notes below.', 'Choose NO MORE THAN TWO WORDS from the passage for each answer.'],
      capability: { generation: true, validation: true, rendering: true, answerSubmission: true, scoring: true, review: true, persistence: true },
      wordLimit: { maxWords: 2, maxNumbers: 0, instruction: 'NO MORE THAN TWO WORDS' },
      requiresAudio: false, requiresVisual: false, requiresPassage: true, requiresTranscript: false,
    },
    {
      id: 'short-answer', skill: 'reading', variants: ['academic', 'general-training'],
      category: 'exam-authentic', displayName: 'Short Answer Questions',
      instructions: ['Answer the questions below.', 'Choose NO MORE THAN THREE WORDS AND/OR A NUMBER from the passage for each answer.'],
      capability: { generation: true, validation: true, rendering: true, answerSubmission: true, scoring: true, review: true, persistence: true },
      wordLimit: { maxWords: 3, maxNumbers: 1, instruction: 'NO MORE THAN THREE WORDS AND/OR A NUMBER' },
      requiresAudio: false, requiresVisual: false, requiresPassage: true, requiresTranscript: false,
    },
    {
      id: 'matching-features', skill: 'reading', variants: ['academic', 'general-training'],
      category: 'exam-authentic', displayName: 'Matching Features',
      instructions: ['Match each statement with the correct option from the list.'],
      capability: { generation: true, validation: true, rendering: true, answerSubmission: true, scoring: true, review: true, persistence: true },
      requiresAudio: false, requiresVisual: false, requiresPassage: true, requiresTranscript: false,
    },
    {
      id: 'matching-sentence-endings', skill: 'reading', variants: ['academic', 'general-training'],
      category: 'exam-authentic', displayName: 'Matching Sentence Endings',
      instructions: ['Complete each sentence with the correct ending from the list.'],
      capability: { generation: true, validation: true, rendering: true, answerSubmission: true, scoring: true, review: true, persistence: true },
      requiresAudio: false, requiresVisual: false, requiresPassage: true, requiresTranscript: false,
    },
    {
      id: 'table-completion', skill: 'reading', variants: ['academic', 'general-training'],
      category: 'exam-authentic', displayName: 'Table Completion',
      instructions: ['Complete the table below.', 'Choose NO MORE THAN TWO WORDS from the passage for each answer.'],
      capability: { generation: true, validation: true, rendering: true, answerSubmission: true, scoring: true, review: true, persistence: true },
      wordLimit: { maxWords: 2, maxNumbers: 0, instruction: 'NO MORE THAN TWO WORDS' },
      requiresAudio: false, requiresVisual: false, requiresPassage: true, requiresTranscript: false,
    },
    {
      id: 'flow-chart-completion', skill: 'reading', variants: ['academic', 'general-training'],
      category: 'exam-authentic', displayName: 'Flow Chart Completion',
      instructions: ['Complete the flow-chart below.', 'Choose NO MORE THAN TWO WORDS from the passage for each answer.'],
      capability: { generation: true, validation: true, rendering: true, answerSubmission: true, scoring: true, review: true, persistence: true },
      wordLimit: { maxWords: 2, maxNumbers: 0, instruction: 'NO MORE THAN TWO WORDS' },
      requiresAudio: false, requiresVisual: false, requiresPassage: true, requiresTranscript: false,
    },
    {
      id: 'diagram-label-completion', skill: 'reading', variants: ['academic', 'general-training'],
      category: 'exam-authentic', displayName: 'Diagram Label Completion',
      instructions: ['Label the diagram below.', 'Choose NO MORE THAN TWO WORDS from the passage for each answer.'],
      capability: { generation: true, validation: true, rendering: true, answerSubmission: true, scoring: true, review: true, persistence: true },
      wordLimit: { maxWords: 2, maxNumbers: 0, instruction: 'NO MORE THAN TWO WORDS' },
      requiresAudio: false, requiresVisual: true, requiresPassage: true, requiresTranscript: false,
    },
  ]

  for (const def of readingTypes) registry.register(def)
  return registry
}
