import { z } from 'zod'
import {
  youtubeVideoSchema,
  transcriptSchema,
  videoAnalysisSchema,
  videoVocabularySourceSchema,
  savedSentenceSchema,
  timestampedNoteSchema,
  learningPlaylistSchema,
  playlistItemSchema,
  videoStudySessionSchema,
  studyActivitySchema,
  exerciseSchema,
  exerciseAttemptSchema,
  dictationAttemptSchema,
  shadowingAttemptSchema,
  speakingAttemptSchema,
  summaryAttemptSchema,
  tutorInterventionSchema,
  aiGenerationCacheSchema,
  channelEvaluationSchema,
} from './youtube-schemas'

export const isoStringSchema = z.string().refine(v => !isNaN(Date.parse(v)), { message: 'Invalid ISO date string' })

export const vocabDifficultySchema = z.enum(['easy', 'medium', 'hard'])
export const vocabStatusSchema = z.enum(['new', 'learning', 'reviewing', 'mastered'])
export const grammarStatusSchema = z.enum(['weak', 'reviewing', 'mastered'])
export const mistakeStatusSchema = z.enum(['new', 'reviewed', 'resolved'])
export const learningStatusSchema = z.enum(['new', 'learning', 'reviewing', 'mastered', 'needs-review'])
export const speakingPartSchema = z.union([z.literal(1), z.literal(2), z.literal(3)])
export const writingTaskTypeSchema = z.enum(['task1', 'task2'])
export const mistakeSkillSchema = z.enum(['vocabulary', 'grammar', 'reading', 'listening', 'writing', 'speaking'])
export const skillSchema = z.enum(['reading', 'listening', 'writing', 'speaking', 'vocabulary', 'grammar'])
export const ieltsSkillSchema = z.enum(['reading', 'listening', 'writing', 'speaking', 'vocabulary', 'grammar', 'general'])
export const reviewRatingSchema = z.enum(['again', 'hard', 'good', 'easy'])
export const difficultySchema = z.enum(['easy', 'medium', 'hard'])
export const passageSourceSchema = z.enum(['user-created', 'pasted'])
export const taskCategorySchema = z.enum([
  'Vocabulary', 'Reading', 'Listening', 'Writing Task 1', 'Writing Task 2',
  'Speaking Part 1', 'Speaking Part 2', 'Speaking Part 3', 'Grammar', 'Mock Test',
])
export const questionTypeSchema = z.enum([
  'True / False / Not Given', 'Matching Headings', 'Multiple Choice',
  'Sentence Completion', 'Summary Completion', 'Matching Information',
])
export const aiTypeSchema = z.enum(['vocabulary', 'reading', 'listening', 'writing', 'speaking', 'grammar', 'general'])
export const contentTypeSchema = z.enum([
  'dictionary', 'vocabulary-list', 'reading', 'listening', 'article',
  'video', 'exercise', 'writing-prompt', 'speaking-topic', 'reference',
])
export const artifactCategorySchema = z.enum(['article', 'video', 'reference', 'tool', 'other', 'note'])

export const artifactSchema = z.object({
  id: z.string().min(1),
  url: z.string().default(''),
  title: z.string().min(1),
  description: z.string().default(''),
  favicon: z.string().default(''),
  tags: z.array(z.string()).default([]),
  isFavorite: z.boolean().default(false),
  category: artifactCategorySchema.default('article'),
  source: z.string().default('manual'),
  createdAt: isoStringSchema,
  updatedAt: isoStringSchema,
}).passthrough()

export const sourceNameSchema = z.enum([
  'wiktionary', 'datamuse', 'tatoeba', 'oer-commons', 'wikipedia', 'gutendex', 'youtube',
])

export const verbConjugationSchema = z.object({
  base: z.string().default(''),
  pastSimple: z.string().default(''),
  pastParticiple: z.string().default(''),
  presentParticiple: z.string().default(''),
  thirdPersonSingular: z.string().default(''),
})

export const vocabularyEntrySchema = z.object({
  id: z.string().min(1),
  word: z.string().min(1),
  meaning: z.string().min(1),
  meaningVi: z.string().default(''),
  pronunciation: z.string().default(''),
  partOfSpeech: z.string().default(''),
  topic: z.string().min(1),
  exampleSentence: z.string().default(''),
  collocations: z.array(z.string()).default([]),
  synonyms: z.array(z.string()).default([]),
  antonyms: z.array(z.string()).default([]),
  wordFamily: z.array(z.string()).default([]),
  verbConjugation: verbConjugationSchema.optional(),
  personalNote: z.string().default(''),
  difficulty: vocabDifficultySchema,
  status: vocabStatusSchema,
  cefrLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2', '']).default(''),
  ieltsRelevance: z.enum(['low', 'medium', 'high', '']).default(''),
  tags: z.array(z.string()).default([]),
  createdAt: isoStringSchema,
  updatedAt: isoStringSchema,
})

export const vocabReviewEntrySchema = z.object({
  id: z.string().min(1),
  vocabularyId: z.string().min(1),
  interval: z.number().min(0),
  easeFactor: z.number().min(1.3),
  repetitions: z.number().min(0),
  nextReviewDate: isoStringSchema,
  lastReviewDate: isoStringSchema,
  history: z.array(z.object({
    date: isoStringSchema,
    rating: reviewRatingSchema,
  })).default([]),
})

export const taskEntrySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().default(''),
  category: taskCategorySchema,
  date: isoStringSchema,
  isDone: z.boolean().default(false),
  isRecurring: z.boolean().default(false),
  recurringDays: z.array(z.number()).default([]),
  notes: z.string().default(''),
  timeMinutes: z.number().default(0),
  createdAt: isoStringSchema,
  updatedAt: isoStringSchema,
  completedAt: isoStringSchema.nullable().default(null),
})

export const readingSessionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  topic: z.string().default(''),
  sourceUrl: z.string().default(''),
  passageText: z.string().default(''),
  questionType: questionTypeSchema,
  totalQuestions: z.number().default(0),
  correctAnswers: z.number().default(0),
  accuracy: z.number().default(0),
  timeSpentMinutes: z.number().default(0),
  newVocabulary: z.array(z.string()).default([]),
  summary: z.string().default(''),
  mistakes: z.string().default(''),
  notes: z.string().default(''),
  createdAt: isoStringSchema,
})

export const listeningSessionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  sourceUrl: z.string().default(''),
  topic: z.string().default(''),
  durationMinutes: z.number().default(0),
  section: z.number().default(0),
  score: z.number().default(0),
  transcriptNotes: z.string().default(''),
  newVocabulary: z.array(z.string()).default([]),
  difficultSentences: z.string().default(''),
  mistakes: z.string().default(''),
  shadowingNotes: z.string().default(''),
  selfRating: z.number().default(0),
  createdAt: isoStringSchema,
})

export const writingSessionSchema = z.object({
  id: z.string().min(1),
  taskType: writingTaskTypeSchema,
  question: z.string().min(1),
  essay: z.string().default(''),
  topic: z.string().default(''),
  wordCount: z.number().default(0),
  timeSpentMinutes: z.number().default(0),
  estimatedBand: z.number().default(0),
  feedback: z.string().default(''),
  grammarMistakes: z.string().default(''),
  vocabularyMistakes: z.string().default(''),
  coherenceNotes: z.string().default(''),
  improvedSentences: z.string().default(''),
  betterVersion: z.string().default(''),
  personalReflection: z.string().default(''),
  createdAt: isoStringSchema,
})

export const speakingSessionSchema = z.object({
  id: z.string().min(1),
  part: speakingPartSchema,
  question: z.string().min(1),
  answerNotes: z.string().default(''),
  topic: z.string().default(''),
  durationSeconds: z.number().default(0),
  selfRating: z.number().default(0),
  fluencyNotes: z.string().default(''),
  vocabularyNotes: z.string().default(''),
  grammarMistakes: z.string().default(''),
  pronunciationNotes: z.string().default(''),
  betterExpressions: z.string().default(''),
  improvedAnswer: z.string().default(''),
  createdAt: isoStringSchema,
})

export const grammarNoteSchema = z.object({
  id: z.string().min(1),
  topic: z.string().min(1),
  explanation: z.string().min(1),
  exampleSentences: z.array(z.string()).default([]),
  commonMistakes: z.array(z.string()).default([]),
  correctedExamples: z.array(z.string()).default([]),
  personalNote: z.string().default(''),
  relatedSkill: z.string().default(''),
  status: grammarStatusSchema,
  createdAt: isoStringSchema,
  updatedAt: isoStringSchema,
})

export const mistakeEntrySchema = z.object({
  id: z.string().min(1),
  mistake: z.string().min(1),
  correction: z.string().min(1),
  explanation: z.string().default(''),
  source: z.string().default(''),
  date: isoStringSchema,
  skill: mistakeSkillSchema,
  status: mistakeStatusSchema,
  repetitionCount: z.number().default(0),
  createdAt: isoStringSchema,
  updatedAt: isoStringSchema,
})

export const mockTestEntrySchema = z.object({
  id: z.string().min(1),
  date: isoStringSchema,
  listeningScore: z.number().default(0),
  readingScore: z.number().default(0),
  writingBand: z.number().default(0),
  speakingBand: z.number().default(0),
  overallBand: z.number().default(0),
  notes: z.string().default(''),
  weakAreas: z.array(z.string()).default([]),
  improvementPlan: z.string().default(''),
  createdAt: isoStringSchema,
})

export const topicProgressSchema = z.object({
  id: z.string().min(1),
  topicId: z.string().min(1),
  topic: z.string().min(1),
  progressPercent: z.number().min(0).max(100),
  vocabularyCount: z.number().default(0),
  readingCount: z.number().default(0),
  listeningCount: z.number().default(0),
  writingCount: z.number().default(0),
  speakingCount: z.number().default(0),
  weakPoints: z.array(z.string()).default([]),
  lastReviewedAt: isoStringSchema.optional().default(() => new Date().toISOString()),
  updatedAt: isoStringSchema,
})

export const passageEntrySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  content: z.string().default(''),
  highlightedWords: z.array(z.string()).default([]),
  source: passageSourceSchema,
  createdAt: isoStringSchema,
  updatedAt: isoStringSchema,
})

export const ieltsTopicSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().default(''),
  skill: ieltsSkillSchema,
  tags: z.array(z.string()).default([]),
  color: z.string().default(''),
  createdAt: isoStringSchema,
  updatedAt: isoStringSchema,
})

export const exampleSentenceSchema = z.object({
  id: z.string().min(1),
  sentence: z.string().min(1),
  meaning: z.string().min(1),
  vocabularyId: z.string().optional(),
  topic: z.string().default(''),
  source: z.string().default(''),
  tags: z.array(z.string()).default([]),
  isFavorite: z.boolean().default(false),
  status: learningStatusSchema,
  createdAt: isoStringSchema,
  updatedAt: isoStringSchema,
})

export const readingPassageSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  content: z.string().default(''),
  source: z.string().default(''),
  topic: z.string().default(''),
  difficulty: difficultySchema,
  wordCount: z.number().default(0),
  tags: z.array(z.string()).default([]),
  isFavorite: z.boolean().default(false),
  status: learningStatusSchema,
  notes: z.string().default(''),
  createdAt: isoStringSchema,
  updatedAt: isoStringSchema,
})

export const listeningTranscriptSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  transcript: z.string().default(''),
  source: z.string().default(''),
  topic: z.string().default(''),
  difficulty: difficultySchema,
  audioUrl: z.string().optional(),
  tags: z.array(z.string()).default([]),
  isFavorite: z.boolean().default(false),
  status: learningStatusSchema,
  notes: z.string().default(''),
  createdAt: isoStringSchema,
  updatedAt: isoStringSchema,
})

export const writingPromptSchema = z.object({
  id: z.string().min(1),
  taskType: writingTaskTypeSchema,
  question: z.string().min(1),
  topic: z.string().default(''),
  instructions: z.string().default(''),
  tags: z.array(z.string()).default([]),
  difficulty: difficultySchema,
  isFavorite: z.boolean().default(false),
  status: learningStatusSchema,
  isDone: z.boolean().default(false),
  notes: z.string().default(''),
  createdAt: isoStringSchema,
  updatedAt: isoStringSchema,
})

export const speakingQuestionSchema = z.object({
  id: z.string().min(1),
  part: speakingPartSchema,
  question: z.string().min(1),
  topic: z.string().default(''),
  cueCard: z.string().optional(),
  followUpQuestions: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  difficulty: difficultySchema,
  isFavorite: z.boolean().default(false),
  status: learningStatusSchema,
  isDone: z.boolean().default(false),
  notes: z.string().default(''),
  createdAt: isoStringSchema,
  updatedAt: isoStringSchema,
})

export const studyNoteSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  content: z.string().default(''),
  topic: z.string().default(''),
  skill: z.string().default(''),
  tags: z.array(z.string()).default([]),
  isFavorite: z.boolean().default(false),
  isDraft: z.boolean().default(false),
  createdAt: isoStringSchema,
  updatedAt: isoStringSchema,
})

export const customStudyPlanSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().default(''),
  goal: z.string().default(''),
  startDate: isoStringSchema,
  endDate: isoStringSchema,
  dailyMinutes: z.number().default(0),
  daysOfWeek: z.array(z.number()).default([]),
  tasks: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().default(''),
    category: taskCategorySchema,
    durationMinutes: z.number().default(0),
    isDone: z.boolean().default(false),
  })).default([]),
  isActive: z.boolean().default(false),
  progress: z.number().default(0),
  createdAt: isoStringSchema,
  updatedAt: isoStringSchema,
})

export const usefulPhraseSchema = z.object({
  id: z.string().min(1),
  phrase: z.string().min(1),
  meaning: z.string().min(1),
  usageExample: z.string().default(''),
  topic: z.string().default(''),
  skill: z.string().default(''),
  tags: z.array(z.string()).default([]),
  difficulty: difficultySchema,
  isFavorite: z.boolean().default(false),
  status: learningStatusSchema,
  createdAt: isoStringSchema,
  updatedAt: isoStringSchema,
})

export const aiContentSchema = z.object({
  id: z.string().min(1),
  type: aiTypeSchema,
  prompt: z.string().min(1),
  content: z.string().default(''),
  title: z.string().default(''),
  topic: z.string().default(''),
  model: z.string().default(''),
  tokens: z.number().default(0),
  tags: z.array(z.string()).default([]),
  isFavorite: z.boolean().default(false),
  createdAt: isoStringSchema,
})

export const publicApiContentSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  content: z.string().default(''),
  contentType: contentTypeSchema,
  sourceType: z.literal('public-api'),
  sourceName: sourceNameSchema,
  sourceUrl: z.string().default(''),
  licenseName: z.string().min(1),
  attribution: z.string().default(''),
  importedAt: isoStringSchema,
  skill: z.string().default(''),
  topic: z.string().default(''),
  difficulty: vocabDifficultySchema,
  tags: z.array(z.string()).default([]),
  userNotes: z.string().default(''),
  aiClassification: z.object({
    topic: z.string(),
    skill: z.string(),
    difficulty: vocabDifficultySchema,
    tags: z.array(z.string()),
    vocabulary: z.array(z.string()),
    summary: z.string(),
  }).optional(),
})

export const progressRecordSchema = z.object({
  id: z.string().min(1),
  date: isoStringSchema,
  skill: skillSchema,
  metric: z.string().min(1),
  value: z.number(),
  unit: z.string().min(1),
  notes: z.string().default(''),
  tags: z.array(z.string()).default([]),
  createdAt: isoStringSchema,
})

export const contentMetaSchema = z.object({
  id: z.string().min(1),
  packId: z.string().min(1),
  packName: z.string().default(''),
  packVersion: z.number().min(1),
  contentCount: z.number().default(0),
  seededAt: isoStringSchema,
  updatedAt: isoStringSchema,
})

export const userContentEditSchema = z.object({
  id: z.string().min(1),
  originalId: z.string().min(1),
  userItemId: z.string().min(1),
  contentType: z.string().min(1),
  tableName: z.string().min(1),
  editedAt: isoStringSchema,
  createdAt: isoStringSchema,
})

export const readingQuestionSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['multiple-choice', 'true-false-not-given', 'matching-headings', 'gap-fill']),
  question: z.string(),
  options: z.array(z.string()).optional(),
  correctAnswer: z.union([z.string(), z.number(), z.array(z.string())]),
  explanation: z.string().default(''),
  headings: z.array(z.string()).optional(),
  paragraphs: z.array(z.object({ id: z.string(), text: z.string() })).optional(),
  correctMatches: z.record(z.string(), z.number()).optional(),
  blanks: z.array(z.string()).optional(),
})

export const readingPracticeSessionSchema = z.object({
  id: z.string().min(1),
  passageId: z.string().min(1),
  title: z.string().min(1),
  topic: z.string().default(''),
  passageText: z.string().default(''),
  questions: z.array(readingQuestionSchema).default([]),
  answers: z.record(z.string(), z.unknown()).default({}),
  score: z.number().default(0),
  totalQuestions: z.number().default(0),
  accuracy: z.number().default(0),
  timeSpentSeconds: z.number().default(0),
  mistakes: z.array(z.object({
    questionId: z.string(),
    question: z.string(),
    userAnswer: z.string(),
    correctAnswer: z.string(),
    explanation: z.string(),
  })).default([]),
  createdAt: isoStringSchema,
})

export const listeningQuestionSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['multiple-choice', 'gap-fill']),
  question: z.string(),
  options: z.array(z.string()).optional(),
  correctAnswer: z.union([z.string(), z.number(), z.array(z.string())]),
  explanation: z.string().default(''),
  blanks: z.array(z.string()).optional(),
})

export const listeningExerciseSchema = z.object({
  id: z.string(),
  title: z.string(),
  topic: z.string(),
  transcript: z.string(),
  audioUrl: z.string(),
  audioType: z.enum(['audio', 'youtube']),
  questions: z.array(listeningQuestionSchema),
  difficulty: difficultySchema,
  wordCount: z.number(),
  estimatedMinutes: z.number(),
})

export const listeningPracticeSessionSchema = z.object({
  id: z.string().min(1),
  exerciseId: z.string().min(1),
  title: z.string().min(1),
  topic: z.string().default(''),
  transcript: z.string().default(''),
  audioUrl: z.string().default(''),
  questions: z.array(listeningQuestionSchema).default([]),
  answers: z.record(z.string(), z.unknown()).default({}),
  score: z.number().default(0),
  totalQuestions: z.number().default(0),
  accuracy: z.number().default(0),
  timeSpentSeconds: z.number().default(0),
  notes: z.string().default(''),
  mistakes: z.array(z.object({
    questionId: z.string(),
    question: z.string(),
    userAnswer: z.string(),
    correctAnswer: z.string(),
    explanation: z.string(),
  })).default([]),
  createdAt: isoStringSchema,
})

export const appExportDataSchema = z.object({
  version: z.number(),
  exportedAt: isoStringSchema,
  settings: z.record(z.string(), z.unknown()),
  vocabulary: z.array(vocabularyEntrySchema).default([]),
  vocabularyReviews: z.array(vocabReviewEntrySchema).default([]),
  tasks: z.array(taskEntrySchema).default([]),
  readingSessions: z.array(readingSessionSchema).default([]),
  readingPracticeSessions: z.array(readingPracticeSessionSchema).default([]),
  listeningSessions: z.array(listeningSessionSchema).default([]),
  listeningPracticeSessions: z.array(listeningPracticeSessionSchema).default([]),
  writingSessions: z.array(writingSessionSchema).default([]),
  speakingSessions: z.array(speakingSessionSchema).default([]),
  grammarNotes: z.array(grammarNoteSchema).default([]),
  mistakes: z.array(mistakeEntrySchema).default([]),
  mockTests: z.array(mockTestEntrySchema).default([]),
  topicsProgress: z.array(topicProgressSchema).default([]),
  passages: z.array(passageEntrySchema).default([]),
  ieltsTopics: z.array(ieltsTopicSchema).default([]),
  exampleSentences: z.array(exampleSentenceSchema).default([]),
  readingPassages: z.array(readingPassageSchema).default([]),
  listeningTranscripts: z.array(listeningTranscriptSchema).default([]),
  writingPrompts: z.array(writingPromptSchema).default([]),
  speakingQuestions: z.array(speakingQuestionSchema).default([]),
  studyNotes: z.array(studyNoteSchema).default([]),
  customStudyPlans: z.array(customStudyPlanSchema).default([]),
  usefulPhrases: z.array(usefulPhraseSchema).default([]),
  aiContents: z.array(aiContentSchema).default([]),
  publicApiContent: z.array(publicApiContentSchema).default([]),
  progressRecords: z.array(progressRecordSchema).default([]),
})

export const exerciseSkillSchema = z.enum(['reading', 'listening', 'writing', 'speaking', 'vocabulary', 'grammar'])
export const exerciseDifficultySchema = z.enum(['beginner', 'intermediate', 'advanced'])
export const exerciseSourceSchema = z.enum(['built-in', 'user-created', 'ai-generated', 'web-content', 'mistake-review', 'vocabulary-practice'])

export const exerciseEntrySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().default(''),
  skill: exerciseSkillSchema,
  topic: z.string().default(''),
  source: exerciseSourceSchema,
  difficulty: exerciseDifficultySchema,
  content: z.string().default(''),
  questions: z.string().default('[]'),
  totalPoints: z.number().default(0),
  estimatedMinutes: z.number().default(0),
  status: z.enum(['draft', 'published', 'archived']).default('published'),
  tags: z.array(z.string()).default([]),
  sourceId: z.string().optional(),
  contentVersion: z.number().optional(),
  metadata: z.string().default('{}'),
  isFavorite: z.boolean().default(false),
  createdAt: isoStringSchema,
  updatedAt: isoStringSchema,
})

export const tableSchemas: Record<string, z.ZodTypeAny> = {
  vocabulary: vocabularyEntrySchema,
  vocabularyReviews: vocabReviewEntrySchema,
  tasks: taskEntrySchema,
  readingSessions: readingSessionSchema,
  readingPracticeSessions: readingPracticeSessionSchema,
  listeningSessions: listeningSessionSchema,
  listeningPracticeSessions: listeningPracticeSessionSchema,
  writingSessions: writingSessionSchema,
  speakingSessions: speakingSessionSchema,
  grammarNotes: grammarNoteSchema,
  mistakes: mistakeEntrySchema,
  mockTests: mockTestEntrySchema,
  topicsProgress: topicProgressSchema,
  passages: passageEntrySchema,
  ieltsTopics: ieltsTopicSchema,
  exampleSentences: exampleSentenceSchema,
  readingPassages: readingPassageSchema,
  listeningTranscripts: listeningTranscriptSchema,
  writingPrompts: writingPromptSchema,
  speakingQuestions: speakingQuestionSchema,
  studyNotes: studyNoteSchema,
  customStudyPlans: customStudyPlanSchema,
  usefulPhrases: usefulPhraseSchema,
  aiContents: aiContentSchema,
  publicApiContent: publicApiContentSchema,
  progressRecords: progressRecordSchema,
  contentMeta: contentMetaSchema,
  userContentEdits: userContentEditSchema,
  speakingExercises: exerciseEntrySchema,
  writingExercises: exerciseEntrySchema,
  readingExercises: exerciseEntrySchema,
  listeningExercises: exerciseEntrySchema,
  youtubeVideos: youtubeVideoSchema,
  transcripts: transcriptSchema,
  videoAnalyses: videoAnalysisSchema,
  videoVocabularySources: videoVocabularySourceSchema,
  savedSentences: savedSentenceSchema,
  timestampedNotes: timestampedNoteSchema,
  learningPlaylists: learningPlaylistSchema,
  playlistItems: playlistItemSchema,
  videoStudySessions: videoStudySessionSchema,
  studyActivities: studyActivitySchema,
  youtubeExercises: exerciseSchema,
  exerciseAttempts: exerciseAttemptSchema,
  dictationAttempts: dictationAttemptSchema,
  shadowingAttempts: shadowingAttemptSchema,
  speakingAttempts: speakingAttemptSchema,
  summaryAttempts: summaryAttemptSchema,
  tutorInterventions: tutorInterventionSchema,
  aiGenerationCache: aiGenerationCacheSchema,
  channelEvaluations: channelEvaluationSchema,
}
