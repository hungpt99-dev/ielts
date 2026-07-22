import { z } from 'zod'
import { FULL_PASSAGE_SIMULATION } from './ielts-types'

export const PASSAGE_WORD_LIMITS = {
  minWords: FULL_PASSAGE_SIMULATION.passageWords.min,
  maxWords: FULL_PASSAGE_SIMULATION.passageWords.max,
} as const

export const COMPLETION_WORD_LIMIT_SCHEMA = z.object({
  maxWords: z.number().min(1).max(3),
  maxNumbers: z.number().min(0).max(3),
  instruction: z.string(),
})

export const ABSOLUTE_WORDS = ['only', 'all', 'always', 'never', 'none', 'every', 'must', 'solely', 'entirely', 'completely', 'invariably', 'without exception'] as const

const READING_QUESTION_BASE = {
  id: z.string(),
  number: z.number().positive(),
  instruction: z.string().optional(),
  points: z.number().default(1),
  skill: z.enum([
    'main-idea',
    'specific-detail',
    'paraphrase',
    'inference',
    'reference',
    'writer-purpose',
    'comparison',
    'cause-effect',
    'vocabulary-in-context',
    'cross-paragraph-synthesis',
  ]).optional(),
}

const READING_EVIDENCE = z.object({
  paragraphId: z.string(),
  supportingText: z.string().nullable(),
}).optional()

export const MULTIPLE_CHOICE_SINGLE_SCHEMA = z.object({
  type: z.literal('multiple-choice-single'),
  ...READING_QUESTION_BASE,
  question: z.string().min(10),
  options: z.array(z.string()).length(4),
  correctIndex: z.number().min(0).max(3),
  explanation: z.string().min(20, 'Explanation must be at least 20 characters and explain the reasoning'),
  evidence: READING_EVIDENCE,
})

export const TRUE_FALSE_NOT_GIVEN_SCHEMA = z.object({
  type: z.literal('true-false-not-given'),
  ...READING_QUESTION_BASE,
  statement: z.string().min(10),
  correctAnswer: z.enum(['true', 'false', 'not-given']),
  explanation: z.string().min(30, 'Explanation must explain why the answer is correct and reference the passage'),
  evidence: READING_EVIDENCE,
})

export const YES_NO_NOT_GIVEN_SCHEMA = z.object({
  type: z.literal('yes-no-not-given'),
  ...READING_QUESTION_BASE,
  statement: z.string().min(10).describe('Must be about writer views or claims, not factual info'),
  correctAnswer: z.enum(['yes', 'no', 'not-given']),
  explanation: z.string().min(30),
  evidence: READING_EVIDENCE,
})

export const MATCHING_HEADINGS_SCHEMA = z.object({
  type: z.literal('matching-headings'),
  ...READING_QUESTION_BASE,
  paragraphs: z.array(z.object({ id: z.string(), content: z.string() })),
  headings: z.array(z.string()).min(3).describe('Must have more headings than paragraphs'),
  correctMatches: z.record(z.string(), z.string()),
  explanation: z.string(),
}).refine(
  d => d.headings.length > d.paragraphs.length,
  { message: 'Must have more headings than paragraphs (unused headings required)' },
)

export const SENTENCE_COMPLETION_SCHEMA = z.object({
  type: z.literal('sentence-completion'),
  ...READING_QUESTION_BASE,
  sentence: z.string().min(10).max(1000),
  wordLimit: COMPLETION_WORD_LIMIT_SCHEMA,
  gaps: z.array(z.object({
    id: z.string(),
    correctAnswer: z.string(),
    acceptableAlternatives: z.array(z.string()).default([]),
    positionInSentence: z.number(),
  })).min(1),
  explanation: z.string(),
})

export const SHORT_ANSWER_SCHEMA = z.object({
  type: z.literal('short-answer'),
  ...READING_QUESTION_BASE,
  question: z.string().min(10).describe('A question ending with a question mark, NOT a fill-in-the-blank sentence'),
  wordLimit: COMPLETION_WORD_LIMIT_SCHEMA,
  correctAnswer: z.string(),
  acceptableAlternatives: z.array(z.string()).default([]),
  explanation: z.string().min(20),
  evidence: READING_EVIDENCE,
})

export const MULTIPLE_CHOICE_MULTIPLE_SCHEMA = z.object({
  type: z.literal('multiple-choice-multiple'),
  ...READING_QUESTION_BASE,
  question: z.string().min(10),
  options: z.array(z.string()).length(5),
  correctIndices: z.array(z.number().min(0).max(4)).min(2),
  explanation: z.string().min(20),
  evidence: READING_EVIDENCE,
})

export const MATCHING_FEATURES_SCHEMA = z.object({
  type: z.literal('matching-features'),
  ...READING_QUESTION_BASE,
  statements: z.array(z.object({
    id: z.string(),
    text: z.string().min(5),
  })).min(2),
  features: z.array(z.string()).min(2).describe('Names, categories, or items to match against'),
  correctMatches: z.record(z.string(), z.string()),
  explanation: z.string().min(20),
  evidence: READING_EVIDENCE,
})

export const MATCHING_SENTENCE_ENDINGS_SCHEMA = z.object({
  type: z.literal('matching-sentence-endings'),
  ...READING_QUESTION_BASE,
  sentenceBeginnings: z.array(z.object({
    id: z.string(),
    text: z.string().min(5),
  })).min(2),
  sentenceEndings: z.array(z.string()).min(3).describe('Must have more endings than beginnings'),
  correctMatches: z.record(z.string(), z.string()),
  explanation: z.string().min(20),
  evidence: READING_EVIDENCE,
}).refine(
  d => d.sentenceEndings.length > d.sentenceBeginnings.length,
  { message: 'Must have more sentence endings than beginnings (unused endings required)' },
)

export const MATCHING_INFORMATION_SCHEMA = z.object({
  type: z.literal('matching-information'),
  ...READING_QUESTION_BASE,
  statements: z.array(z.object({
    id: z.string(),
    text: z.string().min(5),
  })).min(2),
  correctMatches: z.record(z.string(), z.string()).describe('Maps statement id to paragraph id'),
  explanation: z.string(),
})

export const TABLE_COMPLETION_SCHEMA = z.object({
  type: z.literal('table-completion'),
  ...READING_QUESTION_BASE,
  table: z.object({
    headers: z.array(z.string()).min(1),
    rows: z.array(z.array(z.string())).min(1),
  }),
  wordLimit: COMPLETION_WORD_LIMIT_SCHEMA,
  gaps: z.array(z.object({
    id: z.string(),
    row: z.number(),
    column: z.number(),
    correctAnswer: z.string(),
    acceptableAlternatives: z.array(z.string()).default([]),
  })).min(1),
  explanation: z.string().min(20),
  evidence: READING_EVIDENCE,
})

export const FLOW_CHART_COMPLETION_SCHEMA = z.object({
  type: z.literal('flow-chart-completion'),
  ...READING_QUESTION_BASE,
  steps: z.array(z.object({
    id: z.string(),
    order: z.number().positive(),
    label: z.string().optional(),
    description: z.string().optional(),
  })).min(2),
  wordLimit: COMPLETION_WORD_LIMIT_SCHEMA,
  gaps: z.array(z.object({
    id: z.string(),
    stepId: z.string(),
    correctAnswer: z.string(),
    acceptableAlternatives: z.array(z.string()).default([]),
  })).min(1),
  explanation: z.string().min(20),
  evidence: READING_EVIDENCE,
})

export const SUMMARY_COMPLETION_SCHEMA = z.object({
  type: z.literal('summary-completion'),
  ...READING_QUESTION_BASE,
  summaryText: z.string().min(20),
  wordLimit: COMPLETION_WORD_LIMIT_SCHEMA,
  gaps: z.array(z.object({
    id: z.string(),
    correctAnswer: z.string(),
    acceptableAlternatives: z.array(z.string()).default([]),
  })).min(1),
  explanation: z.string().min(20),
  evidence: READING_EVIDENCE,
})

export const NOTE_COMPLETION_SCHEMA = z.object({
  type: z.literal('note-completion'),
  ...READING_QUESTION_BASE,
  notes: z.array(z.object({
    id: z.string(),
    text: z.string(),
    gapPosition: z.number(),
  })).min(1),
  wordLimit: COMPLETION_WORD_LIMIT_SCHEMA,
  gaps: z.array(z.object({
    id: z.string(),
    noteId: z.string(),
    correctAnswer: z.string(),
    acceptableAlternatives: z.array(z.string()).default([]),
  })).min(1),
  explanation: z.string().min(20),
  evidence: READING_EVIDENCE,
})

export const DIAGRAM_LABEL_COMPLETION_SCHEMA = z.object({
  type: z.literal('diagram-label-completion'),
  ...READING_QUESTION_BASE,
  diagramDescription: z.string().min(10),
  wordLimit: COMPLETION_WORD_LIMIT_SCHEMA,
  labels: z.array(z.object({
    id: z.string(),
    correctAnswer: z.string(),
    acceptableAlternatives: z.array(z.string()).default([]),
  })).min(1),
  explanation: z.string().min(20),
  evidence: READING_EVIDENCE,
})

export const READING_PASSAGE_SCHEMA = z.object({
  title: z.string().min(3).max(200),
  passage: z.string().min(200).max(2000),
  paragraphs: z.array(z.object({
    id: z.string(),
    content: z.string(),
    index: z.number(),
  })).min(2).describe('Must have at least 2 paragraphs with distinct functions'),
  taskGroups: z.array(z.object({
    id: z.string(),
    type: z.string(),
    startNumber: z.number().positive(),
    endNumber: z.number().positive(),
    instructions: z.array(z.string()).min(1),
    questions: z.array(z.any()).min(1),
  })),
})

export const READING_QUALITY_REPORT_SCHEMA = z.object({
  passageCoherence: z.number().min(0).max(1),
  languageNaturalness: z.number().min(0).max(1),
  informationDensity: z.number().min(0).max(1),
  difficultyAlignment: z.number().min(0).max(1),
  paraphraseQuality: z.number().min(0).max(1),
  distractorQuality: z.number().min(0).max(1),
  questionVariety: z.number().min(0).max(1),
  answerability: z.number().min(0).max(1),
  ambiguityRisk: z.number().min(0).max(1),
  ieltsAuthenticity: z.number().min(0).max(1),
  status: z.enum(['pass', 'repair', 'reject']),
  issues: z.array(z.object({
    field: z.string(),
    severity: z.enum(['critical', 'major', 'minor']),
    description: z.string(),
    suggestion: z.string().optional(),
  })),
})

export const READING_QUESTIONS_SCHEMA = z.discriminatedUnion('type', [
  MULTIPLE_CHOICE_SINGLE_SCHEMA,
  MULTIPLE_CHOICE_MULTIPLE_SCHEMA,
  TRUE_FALSE_NOT_GIVEN_SCHEMA,
  YES_NO_NOT_GIVEN_SCHEMA,
  MATCHING_HEADINGS_SCHEMA,
  MATCHING_INFORMATION_SCHEMA,
  MATCHING_FEATURES_SCHEMA,
  MATCHING_SENTENCE_ENDINGS_SCHEMA,
  SENTENCE_COMPLETION_SCHEMA,
  SUMMARY_COMPLETION_SCHEMA,
  NOTE_COMPLETION_SCHEMA,
  SHORT_ANSWER_SCHEMA,
  TABLE_COMPLETION_SCHEMA,
  FLOW_CHART_COMPLETION_SCHEMA,
  DIAGRAM_LABEL_COMPLETION_SCHEMA,
])

export const READING_EXERCISE_QUALITY_REPORT_SCHEMA = z.object({
  passageEstimatedBand: z.number().min(3).max(9),
  averageQuestionEstimatedBand: z.number().min(3).max(9),
  passageQuestionDifficultyAlignment: z.number().min(0).max(1),
  paraphraseQuality: z.number().min(0).max(1),
  directRetrievalRatio: z.number().min(0).max(1),
  skillVariety: z.number().min(0).max(1),
  distractorQuality: z.number().min(0).max(1),
  tfngQuality: z.number().min(0).max(1),
  completionQuality: z.number().min(0).max(1),
  inferenceQuality: z.number().min(0).max(1),
  passageCoverage: z.number().min(0).max(1),
  duplicationRisk: z.number().min(0).max(1),
  ambiguityRisk: z.number().min(0).max(1),
  ieltsAuthenticity: z.number().min(0).max(1),
  status: z.enum(['pass', 'repair', 'reject']),
  issues: z.array(z.object({
    field: z.string(),
    severity: z.enum(['critical', 'major', 'minor']),
    description: z.string(),
    suggestion: z.string().optional(),
  })),
})

export const PASSAGE_PROFILE_SCHEMA = z.object({
  wordCount: z.number().positive(),
  paragraphCount: z.number().positive(),
  estimatedBandRange: z.object({
    minimum: z.number().min(3).max(9),
    maximum: z.number().min(3).max(9),
  }),
  lexicalComplexity: z.number().min(0).max(1),
  syntacticComplexity: z.number().min(0).max(1),
  informationDensity: z.number().min(0).max(1),
  conceptualDensity: z.number().min(0).max(1),
  discourseComplexity: z.number().min(0).max(1),
  referenceTrackingDemand: z.number().min(0).max(1),
  crossParagraphConnections: z.number().min(0).max(1),
  paragraphFunctions: z.array(z.object({
    paragraphId: z.string(),
    functions: z.array(z.string()),
  })),
})
