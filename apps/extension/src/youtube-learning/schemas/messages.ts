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

const playSegmentPayloadSchema = z.object({
  segmentIndex: z.number().int().min(0),
})

const activeSegmentIndexPayloadSchema = z.object({
  activeSegmentIndex: z.number().int().min(0),
})

export const contentScriptMessageSchema = z.intersection(
  z.object({ source: z.literal('ielts-content-script') }),
  z.discriminatedUnion('type', [
    { type: z.literal('VIDEO_INFO'), payload: z.unknown().optional() },
    { type: z.literal('TIME_UPDATE'), payload: z.unknown().optional() },
    { type: z.literal('TRANSCRIPT_AVAILABLE'), payload: z.unknown().optional() },
    { type: z.literal('TRANSCRIPT_DATA'), payload: z.unknown().optional() },
    { type: z.literal('TRANSCRIPT_UNAVAILABLE'), payload: z.unknown().optional() },
    { type: z.literal('TRANSCRIPT_ERROR'), payload: z.unknown().optional() },
    { type: z.literal('TRANSCRIPT_LOADING'), payload: z.unknown().optional() },
    { type: z.literal('FOCUS_MODE'), payload: z.unknown().optional() },
    { type: z.literal('LEARNING_EVENT'), payload: z.unknown().optional() },
    { type: z.literal('LEARNING_MODE_STATE'), payload: z.unknown().optional() },
    { type: z.literal('EXERCISE_DATA'), payload: z.unknown().optional() },
    { type: z.literal('DICTATION_RESULT'), payload: z.unknown().optional() },
    { type: z.literal('ANALYSIS_DATA'), payload: z.unknown().optional() },
    { type: z.literal('START_PRACTICE'), payload: z.unknown().optional() },
    { type: z.literal('VOCAB_EXPLANATION'), payload: z.unknown().optional() },
    { type: z.literal('VOCAB_SAVED'), payload: z.unknown().optional() },
    { type: z.literal('SENTENCE_EXPLANATION'), payload: z.unknown().optional() },
    { type: z.literal('QUIZ_DATA'), payload: z.unknown().optional() },
    { type: z.literal('QUIZ_EVALUATION'), payload: z.unknown().optional() },
    { type: z.literal('MISTAKES_SAVED'), payload: z.unknown().optional() },
    { type: z.literal('TRANSLATED_SEGMENTS'), payload: z.unknown().optional() },
    { type: z.literal('SETTINGS_DATA'), payload: z.unknown().optional() },
    { type: z.literal('TRANSCRIPT_PLAY_SEGMENT'), payload: playSegmentPayloadSchema },
    { type: z.literal('TRANSCRIPT_PREVIOUS'), payload: z.number().optional() },
    { type: z.literal('TRANSCRIPT_NEXT'), payload: z.number().optional() },
    { type: z.literal('TRANSCRIPT_CONTINUE'), payload: z.null().optional() },
    { type: z.literal('TRANSCRIPT_ACTIVE_SEGMENT_INDEX'), payload: activeSegmentIndexPayloadSchema },
  ])
)

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
