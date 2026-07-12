import { z } from 'zod'

export const transcriptErrorCodeSchema = z.enum([
  'INVALID_VIDEO_ID',
  'VIDEO_UNAVAILABLE',
  'NO_CAPTIONS',
  'UNSUPPORTED_LANGUAGE',
  'PLAYER_RESPONSE_NOT_FOUND',
  'CAPTION_TRACK_NOT_FOUND',
  'CAPTION_FETCH_FAILED',
  'CAPTION_PARSE_FAILED',
  'EXTENSION_COMMUNICATION_FAILED',
  'REQUEST_CANCELLED',
  'UNKNOWN',
])

export const contentScriptMessageSchema = z.object({
  source: z.literal('ielts-content-script'),
  type: z.enum([
    'VIDEO_INFO',
    'TIME_UPDATE',
    'TRANSCRIPT_AVAILABLE',
    'TRANSCRIPT_DATA',
    'TRANSCRIPT_UNAVAILABLE',
    'TRANSCRIPT_ERROR',
    'TRANSCRIPT_LOADING',
    'FOCUS_MODE',
    'LEARNING_EVENT',
    'LEARNING_MODE_STATE',
    'EXERCISE_DATA',
    'DICTATION_RESULT',
    'ANALYSIS_DATA',
    'START_PRACTICE',
    'VOCAB_EXPLANATION',
    'VOCAB_SAVED',
    'SENTENCE_EXPLANATION',
    'QUIZ_DATA',
    'QUIZ_EVALUATION',
    'MISTAKES_SAVED',
    'TRANSLATED_SEGMENTS',
  ]),
  payload: z.unknown().optional(),
})

export const vocabularyExplanationSchema = z.object({
  word: z.string().min(1),
  normalizedWord: z.string().min(1),
  lemma: z.string().min(1),
  pronunciation: z.string().optional(),
  partOfSpeech: z.string().min(1),
  contextualDefinition: z.string().min(1),
  translation: z.string().optional(),
  cefrLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).optional(),
  ieltsRelevance: z.enum(['low', 'medium', 'high']).optional(),
  collocations: z.array(z.object({
    phrase: z.string().min(1),
    example: z.string().optional(),
  })),
  synonyms: z.array(z.string()),
  wordFamily: z.array(z.object({
    word: z.string(),
    partOfSpeech: z.string(),
  })),
  simpleExample: z.string().min(1),
  ieltsExample: z.string().optional(),
  sourceSentence: z.string(),
  startTime: z.number(),
})

export const sentenceExplanationSchema = z.object({
  simpleMeaning: z.string().min(1),
  translation: z.string().optional(),
  sentenceStructure: z.string().min(1),
  grammarPoints: z.array(z.object({
    name: z.string(),
    explanation: z.string(),
    sourceText: z.string().optional(),
  })),
  vocabulary: z.array(z.object({
    word: z.string(),
    meaningInContext: z.string(),
  })),
  listeningNotes: z.array(z.string()),
  simplifiedVersion: z.string().min(1),
  academicAlternative: z.string().optional(),
  practiceQuestion: z.object({
    prompt: z.string(),
    answer: z.string(),
  }).optional(),
})

export const questionSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['multiple-choice', 'sentence-completion', 'short-answer', 'true-false-not-given', 'matching', 'summary-completion', 'fill-blank']),
  prompt: z.string().min(1),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().min(1),
  acceptedAnswers: z.array(z.string()).optional(),
  points: z.number().default(1),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  sourceSegmentIds: z.array(z.string()),
  explanation: z.string().min(1),
  evidenceStartMs: z.number(),
  evidenceEndMs: z.number(),
  maxWords: z.number().optional(),
})

export const quizDataSchema = z.object({
  id: z.string().min(1),
  videoId: z.string().min(1),
  title: z.string().default('Listening Quiz'),
  startMs: z.number(),
  endMs: z.number(),
  questions: z.array(questionSchema).min(1).max(20),
  totalPoints: z.number(),
  onePlay: z.boolean().default(true),
  hideSubtitles: z.boolean().default(true),
  createdAt: z.string(),
})

export type ContentScriptMessage = z.infer<typeof contentScriptMessageSchema>
export type TranscriptErrorCode = z.infer<typeof transcriptErrorCodeSchema>
export type VocabularyExplanation = z.infer<typeof vocabularyExplanationSchema>
export type SentenceExplanation = z.infer<typeof sentenceExplanationSchema>
export type QuizData = z.infer<typeof quizDataSchema>
export type Question = z.infer<typeof questionSchema>
