import type { ReadingBlueprint, ListeningBlueprint, WritingBlueprint, SpeakingBlueprint, GrammarBlueprint, VocabularyBlueprint, ReviewBlueprint } from './blueprint'
import type { ExerciseBlueprint } from './blueprint'
import { createDefaultDifficultyProfile } from '../types/difficulty'

const LISTENING_QUESTION_TYPES = [
  'multiple_choice',
  'matching',
  'form_completion',
  'note_completion',
  'table_completion',
  'flow_chart_completion',
  'summary_completion',
  'sentence_completion',
  'map_labelling',
  'plan_labelling',
  'diagram_labelling',
  'short_answer',
] as const

const READING_QUESTION_TYPES = [
  'multiple_choice',
  'true_false_not_given',
  'yes_no_not_given',
  'matching_headings',
  'matching_information',
  'matching_features',
  'matching_sentence_endings',
  'sentence_completion',
  'summary_completion',
  'note_completion',
  'table_completion',
  'flow_chart_completion',
  'diagram_labelling',
  'short_answer',
] as const

export function createFullListeningBlueprint(id: string): ListeningBlueprint {
  return {
    id,
    version: '1.0.0',
    module: 'listening',
    mode: 'full_test',
    family: 'interactive_listening',
    structure: {
      requiredParts: 4,
      questionsPerPart: 10,
      totalQuestions: 40,
    },
    timing: {
      officialDurationSeconds: 1800,
      estimatedDurationSeconds: 2400,
      strictMode: true,
    },
    scoring: {
      maxScore: 40,
      scoringMethod: 'deterministic',
      partialCredit: false,
    },
    difficulty: createDefaultDifficultyProfile(),
    allowedQuestionTypes: [...LISTENING_QUESTION_TYPES],
    learningObjectives: [],
    validationRules: [
      { field: 'parts', rule: 'exact_count', message: 'Must have exactly 4 parts', severity: 'error' },
      { field: 'questions_per_part', rule: 'exact_count', message: 'Each part must have exactly 10 questions', severity: 'error' },
      { field: 'total_questions', rule: 'exact_count', message: 'Must have exactly 40 questions', severity: 'error' },
    ],
  }
}

export function createListeningPartBlueprint(id: string, partNumber: number): ListeningBlueprint {
  return {
    id,
    version: '1.0.0',
    module: 'listening',
    mode: 'full_part',
    family: 'interactive_listening',
    structure: {
      requiredParts: 1,
      questionsPerPart: 10,
      totalQuestions: 10,
    },
    timing: {
      officialDurationSeconds: 480,
      estimatedDurationSeconds: 600,
      strictMode: false,
    },
    scoring: {
      maxScore: 10,
      scoringMethod: 'deterministic',
      partialCredit: false,
    },
    difficulty: createDefaultDifficultyProfile(),
    allowedQuestionTypes: [...LISTENING_QUESTION_TYPES],
    learningObjectives: [],
    validationRules: [
      { field: 'questions', rule: 'exact_count', message: `Part ${partNumber} must have exactly 10 questions`, severity: 'error' },
    ],
  }
}

export function createFullReadingBlueprint(id: string, variant: 'academic' | 'general_training' = 'academic'): ReadingBlueprint {
  return {
    id,
    version: '1.0.0',
    module: 'reading',
    mode: 'full_test',
    family: 'objective_questions',
    ieltsVariant: variant,
    structure: {
      passages: 3,
      totalQuestions: 40,
    },
    timing: {
      officialDurationSeconds: 3600,
      estimatedDurationSeconds: 3600,
      strictMode: true,
    },
    scoring: {
      maxScore: 40,
      scoringMethod: 'deterministic',
      partialCredit: false,
    },
    difficulty: createDefaultDifficultyProfile(),
    allowedQuestionTypes: [...READING_QUESTION_TYPES],
    learningObjectives: [],
    validationRules: [
      { field: 'passages', rule: 'exact_count', message: 'Must have exactly 3 passages', severity: 'error' },
      { field: 'total_questions', rule: 'exact_count', message: 'Must have exactly 40 questions', severity: 'error' },
    ],
  }
}

export function createReadingPassageBlueprint(id: string, variant: 'academic' | 'general_training' = 'academic'): ReadingBlueprint {
  return {
    id,
    version: '1.0.0',
    module: 'reading',
    mode: 'full_section',
    family: 'objective_questions',
    ieltsVariant: variant,
    structure: {
      passages: 1,
      totalQuestions: 13,
    },
    timing: {
      estimatedDurationSeconds: 1200,
      strictMode: false,
    },
    scoring: {
      maxScore: 13,
      scoringMethod: 'deterministic',
      partialCredit: false,
    },
    difficulty: createDefaultDifficultyProfile(),
    allowedQuestionTypes: [...READING_QUESTION_TYPES],
    learningObjectives: [],
    validationRules: [],
  }
}

export function createFullWritingBlueprint(id: string, variant: 'academic' | 'general_training' = 'academic'): WritingBlueprint {
  return {
    id,
    version: '1.0.0',
    module: 'writing',
    mode: 'full_test',
    family: 'writing_task',
    ieltsVariant: variant,
    structure: {
      tasks: 2,
      task1Weight: 1,
      task2Weight: 2,
    },
    timing: {
      officialDurationSeconds: 3600,
      estimatedDurationSeconds: 3600,
      strictMode: true,
    },
    scoring: {
      maxScore: 9,
      scoringMethod: 'rubric',
      partialCredit: true,
      weights: { task_1: 1, task_2: 2 },
    },
    difficulty: createDefaultDifficultyProfile(),
    allowedQuestionTypes: ['essay'],
    learningObjectives: [],
    validationRules: [
      { field: 'tasks', rule: 'exact_count', message: 'Must have exactly 2 tasks', severity: 'error' },
      { field: 'task_2_weight', rule: 'double_weight', message: 'Task 2 must be weighted 2x', severity: 'error' },
    ],
  }
}

export function createWritingTaskBlueprint(id: string, taskNumber: 1 | 2, variant: 'academic' | 'general_training' = 'academic'): WritingBlueprint {
  return {
    id,
    version: '1.0.0',
    module: 'writing',
    mode: 'full_part',
    family: 'writing_task',
    ieltsVariant: variant,
    structure: {
      tasks: 1,
      task1Weight: taskNumber === 1 ? 1 : 0,
      task2Weight: taskNumber === 2 ? 2 : 0,
    },
    timing: {
      estimatedDurationSeconds: taskNumber === 1 ? 1200 : 2400,
      strictMode: false,
    },
    scoring: {
      maxScore: 9,
      scoringMethod: 'rubric',
      partialCredit: true,
    },
    difficulty: createDefaultDifficultyProfile(),
    allowedQuestionTypes: ['essay'],
    learningObjectives: [],
    validationRules: [],
  }
}

export function createFullSpeakingBlueprint(id: string): SpeakingBlueprint {
  return {
    id,
    version: '1.0.0',
    module: 'speaking',
    mode: 'full_test',
    family: 'speaking_session',
    structure: {
      requiredParts: 3,
      part1DurationSeconds: 300,
      part2PreparationSeconds: 60,
      part2ResponseSeconds: 120,
      part3DurationSeconds: 300,
    },
    timing: {
      officialDurationSeconds: 780,
      estimatedDurationSeconds: 840,
      strictMode: true,
    },
    scoring: {
      maxScore: 9,
      scoringMethod: 'rubric',
      partialCredit: true,
    },
    difficulty: createDefaultDifficultyProfile(),
    allowedQuestionTypes: ['speaking_response'],
    learningObjectives: [],
    validationRules: [
      { field: 'parts', rule: 'exact_count', message: 'Must have exactly 3 parts', severity: 'error' },
      { field: 'part_order', rule: 'sequential', message: 'Parts must be in order 1, 2, 3', severity: 'error' },
      { field: 'part_2_preparation', rule: 'exact_seconds', message: 'Part 2 must have 60s preparation', severity: 'error' },
    ],
  }
}

export function createFocusedGrammarBlueprint(id: string): GrammarBlueprint {
  return {
    id,
    version: '1.0.0',
    module: 'grammar',
    mode: 'focused_practice',
    family: 'grammar_activity',
    structure: {
      minItems: 3,
      maxItems: 30,
    },
    timing: {
      estimatedDurationSeconds: 600,
      perItemSeconds: 45,
      strictMode: false,
    },
    scoring: {
      maxScore: 30,
      scoringMethod: 'deterministic',
      partialCredit: false,
    },
    difficulty: createDefaultDifficultyProfile(),
    allowedQuestionTypes: ['multiple_choice', 'completion', 'short_answer', 'matching', 'ordering'],
    grammarConcepts: [],
    learningObjectives: [],
    validationRules: [
      { field: 'items', rule: 'min_count', message: 'Must have at least 3 grammar items', severity: 'error' },
    ],
  }
}

export function createFocusedVocabularyBlueprint(id: string): VocabularyBlueprint {
  return {
    id,
    version: '1.0.0',
    module: 'vocabulary',
    mode: 'focused_practice',
    family: 'vocabulary_activity',
    structure: {
      minItems: 3,
      maxItems: 50,
    },
    timing: {
      estimatedDurationSeconds: 450,
      perItemSeconds: 30,
      strictMode: false,
    },
    scoring: {
      maxScore: 50,
      scoringMethod: 'deterministic',
      partialCredit: true,
    },
    difficulty: createDefaultDifficultyProfile(),
    allowedQuestionTypes: ['multiple_choice', 'matching', 'completion', 'short_answer'],
    termCount: 10,
    vocabularyTypes: ['meaning_selection', 'collocation_matching', 'context_completion'],
    learningObjectives: [],
    validationRules: [],
  }
}

export function createSavedContentBlueprint(id: string): ExerciseBlueprint {
  return {
    id,
    version: '1.0.0',
    module: 'saved_content',
    mode: 'focused_practice',
    family: 'content_comprehension',
    structure: {
      minItems: 1,
      maxItems: 20,
    },
    timing: {
      estimatedDurationSeconds: 900,
      strictMode: false,
    },
    scoring: {
      maxScore: 20,
      scoringMethod: 'deterministic',
      partialCredit: true,
    },
    difficulty: createDefaultDifficultyProfile(),
    allowedQuestionTypes: ['multiple_choice', 'completion', 'short_answer', 'matching'],
    learningObjectives: [],
    validationRules: [
      { field: 'contentReference', rule: 'required', message: 'Must reference source content', severity: 'error' },
    ],
  }
}

export function createMistakeReviewBlueprint(id: string): ReviewBlueprint {
  return {
    id,
    version: '1.0.0',
    module: 'mistake_review',
    mode: 'review',
    family: 'review_activity',
    structure: {
      minItems: 1,
      maxItems: 30,
    },
    timing: {
      estimatedDurationSeconds: 600,
      strictMode: false,
    },
    scoring: {
      maxScore: 30,
      scoringMethod: 'deterministic',
      partialCredit: true,
    },
    difficulty: createDefaultDifficultyProfile(),
    allowedQuestionTypes: ['multiple_choice', 'true_false_not_given', 'completion', 'short_answer', 'matching'],
    sourceModules: ['reading', 'listening', 'writing', 'speaking', 'grammar', 'vocabulary'],
    mistakeCount: 10,
    learningObjectives: [],
    validationRules: [
      { field: 'mistakes', rule: 'min_count', message: 'Must have at least 1 mistake', severity: 'error' },
    ],
  }
}
