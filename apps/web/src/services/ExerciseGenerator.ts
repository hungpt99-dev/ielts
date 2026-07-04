import type { TaskEntry, AiContent } from '../models'
import type { Exercise, ExerciseQuestion, AnswerExplanation, ExerciseSkill, ExerciseDifficulty } from '@ielts/exercises'
import { generateId, nowISO } from '../utils'
import { getContentForSkill } from '../features/tasks/ieltsContent'
import type { StudySkill, ContentTemplate } from '../features/tasks/types'
import { DatabaseService } from './storage/Database'
import type { IDatabase } from './storage/Database'

export interface UserData {
  weakSkills: string[]
  currentBand: number
  targetBand: number
  vocabularyWords?: Array<{ word: string; meaning: string }>
  recentMistakes?: Array<{ mistake: string; correction: string; skill: string }>
}

const CATEGORY_TO_SKILL: Record<string, ExerciseSkill> = {
  Reading: 'reading',
  Listening: 'listening',
  'Writing Task 1': 'writing',
  'Writing Task 2': 'writing',
  'Speaking Part 1': 'speaking',
  'Speaking Part 2': 'speaking',
  'Speaking Part 3': 'speaking',
  Vocabulary: 'vocabulary',
  Grammar: 'grammar',
}

const CATEGORY_TO_STUDY_SKILL: Record<string, StudySkill> = {
  Reading: 'Reading',
  Listening: 'Listening',
  'Writing Task 1': 'Writing',
  'Writing Task 2': 'Writing',
  'Speaking Part 1': 'Speaking',
  'Speaking Part 2': 'Speaking',
  'Speaking Part 3': 'Speaking',
  Vocabulary: 'Vocabulary',
  Grammar: 'Grammar',
}

function mapDifficulty(task: TaskEntry): ExerciseDifficulty {
  const time = task.timeMinutes
  if (time <= 15) return 'beginner'
  if (time <= 25) return 'intermediate'
  return 'advanced'
}

function makeExplanation(correctAnswer: string, explanation: string, tips?: string[]): AnswerExplanation {
  return { correctAnswer, explanation, tips }
}

function buildQuestionsFromContent(template: ContentTemplate): ExerciseQuestion[] {
  const { questions, topic } = template.getContent()
  return questions.map(q => {
    const correctAnswer = q.correctAnswer ?? ''
    const question: ExerciseQuestion = {
      id: generateId(),
      type: q.type === 'multiple-choice' ? 'multiple-choice'
        : q.type === 'fill-blank' ? 'gap-fill'
        : q.type === 'short-answer' ? 'short-answer'
        : q.type === 'speaking' || q.type === 'writing' ? 'short-answer'
        : 'short-answer',
      question: q.question,
      options: q.options,
      correctAnswer,
      explanation: makeExplanation(
        String(correctAnswer),
        `Review the topic "${topic}" for more context.`
      ),
      tags: [topic],
    }
    return question
  })
}

function buildSpeakingQuestions(template: ContentTemplate): ExerciseQuestion[] {
  const { questions } = template.getContent()
  return questions.map(q => {
    const correctAnswer = q.correctAnswer ?? ''
    return {
      id: generateId(),
      type: 'short-answer',
      question: q.question,
      options: q.options,
      correctAnswer,
      explanation: makeExplanation(
        String(correctAnswer),
        'Practice speaking your answer aloud. Record yourself and review.'
      ),
      tags: ['speaking'],
    }
  })
}

function inferTopicFromTask(task: TaskEntry): string {
  if (task.title) {
    const cleaned = task.title.replace(/^(Speaking|Writing|Reading|Listening|Vocabulary|Grammar)\s*/i, '').trim()
    if (cleaned && cleaned.length > 3) return cleaned
  }
  if (task.description) {
    const words = task.description.split(/\s+/).slice(0, 5).join(' ')
    if (words.length > 3) return words
  }
  return task.category
}

function inferDifficultyFromUser(userData: UserData): ExerciseDifficulty {
  const avg = (userData.currentBand + userData.targetBand) / 2
  if (avg < 5.5) return 'beginner'
  if (avg < 7) return 'intermediate'
  return 'advanced'
}

export async function generateExercise(
  task: TaskEntry,
  userData: UserData,
): Promise<Exercise> {
  const skill = CATEGORY_TO_SKILL[task.category] ?? 'reading'
  const studySkill = CATEGORY_TO_STUDY_SKILL[task.category] ?? 'Reading'
  const topic = inferTopicFromTask(task)
  const difficulty = mapDifficulty(task)

  const templates = getContentForSkill(studySkill)
  const matchingTemplate = templates.find(t =>
    t.title.toLowerCase().includes(topic.toLowerCase()) ||
    t.getContent().topic.toLowerCase().includes(topic.toLowerCase())
  ) ?? templates[0]

  let questions: ExerciseQuestion[]

  if (skill === 'speaking') {
    questions = matchingTemplate
      ? buildSpeakingQuestions(matchingTemplate)
      : buildDefaultSpeakingQuestions(topic, userData)
  } else if (skill === 'writing') {
    questions = matchingTemplate
      ? buildQuestionsFromContent(matchingTemplate)
      : buildDefaultWritingQuestions(topic, userData)
  } else if (skill === 'reading') {
    questions = matchingTemplate
      ? buildQuestionsFromContent(matchingTemplate)
      : buildDefaultReadingQuestions(topic, userData)
  } else if (skill === 'listening') {
    questions = matchingTemplate
      ? buildQuestionsFromContent(matchingTemplate)
      : buildDefaultListeningQuestions(topic, userData)
  } else {
    questions = matchingTemplate
      ? buildQuestionsFromContent(matchingTemplate)
      : buildDefaultVocabularyQuestions(topic, userData)
  }

  const totalPoints = questions.reduce((sum, q) => sum + (q.points ?? 1), 0)

  const exercise: Exercise = {
    id: generateId(),
    title: `${task.title || topic} - Practice`,
    skill,
    topic,
    source: 'user-created',
    difficulty,
    questions,
    totalPoints,
    estimatedMinutes: task.timeMinutes || Math.ceil(questions.length * 2),
    status: 'published',
    tags: [skill, topic, task.category.toLowerCase().replace(/\s+/g, '-')],
    sourceId: task.id,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  }

  await saveExercise(exercise, task)

  return exercise
}

function exerciseToEntry(
  exercise: Exercise,
  task?: TaskEntry,
): Omit<ExerciseEntry, 'id' | 'createdAt' | 'updatedAt'> & { id?: string } {
  return {
    id: exercise.id,
    title: exercise.title,
    description: exercise.description ?? '',
    skill: exercise.skill as ExerciseEntry['skill'],
    topic: exercise.topic,
    source: exercise.source as ExerciseEntry['source'],
    difficulty: exercise.difficulty as ExerciseEntry['difficulty'],
    content: JSON.stringify(exercise),
    questions: JSON.stringify(exercise.questions),
    totalPoints: exercise.totalPoints,
    estimatedMinutes: exercise.estimatedMinutes,
    status: exercise.status === 'draft' ? 'draft' : exercise.status === 'archived' ? 'archived' : 'published',
    tags: exercise.tags,
    sourceId: exercise.sourceId ?? task?.id ?? exercise.id,
    contentVersion: exercise.contentVersion,
    metadata: JSON.stringify(exercise.metadata ?? {}),
    isFavorite: false,
  }
}

function getExerciseTableName(skill: ExerciseSkill): keyof IDatabase | null {
  switch (skill) {
    case 'speaking': return 'speakingExercises'
    case 'writing': return 'writingExercises'
    case 'reading': return 'readingExercises'
    case 'listening': return 'listeningExercises'
    default: return null
  }
}

export async function saveExercise(
  exercise: Exercise,
  task?: TaskEntry,
): Promise<void> {
  const tableName = getExerciseTableName(exercise.skill)
  if (!tableName) return

  const entry = exerciseToEntry(exercise, task)

  try {
    const fullEntry = {
      ...entry,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    }

    const existing = await DatabaseService.queryByIndex<{ id: string }>(
      tableName,
      'sourceId',
      fullEntry.sourceId ?? exercise.id,
    )

    if (existing && existing.length > 0) {
      await DatabaseService.update(tableName, existing[0].id, {
        ...fullEntry,
        createdAt: undefined,
      })
    } else {
      await DatabaseService.add(tableName, fullEntry)
    }
  } catch {
    // Storage may not be available (e.g. in test environment)
  }
}

function buildDefaultSpeakingQuestions(topic: string, userData: UserData): ExerciseQuestion[] {
  const band = userData.currentBand || 5
  const difficulty = band < 6 ? 'beginner' : band < 7 ? 'intermediate' : 'advanced'
  const questions: ExerciseQuestion[] = [
    {
      id: generateId(),
      type: 'short-answer',
      question: `Part 1: Let's talk about ${topic}. Do you like ${topic}? Why or why not?`,
      correctAnswer: 'Sample answer will vary',
      explanation: makeExplanation('Varies', 'Speak for 30-45 seconds. Give reasons for your answer.'),
      points: 5,
      difficulty,
      tags: ['speaking', 'part-1', topic],
    },
    {
      id: generateId(),
      type: 'short-answer',
      question: `Part 2: Describe your experience with ${topic}. You should say: what it is, when you experienced it, how you felt about it, and explain why it is important to you.`,
      correctAnswer: 'Sample answer will vary',
      explanation: makeExplanation('Varies', 'Speak for 1-2 minutes. Use the bullet points to structure your answer.'),
      points: 10,
      difficulty,
      tags: ['speaking', 'part-2', topic],
    },
    {
      id: generateId(),
      type: 'short-answer',
      question: `Part 3: How has ${topic} changed in recent years? What do you think will happen in the future?`,
      correctAnswer: 'Sample answer will vary',
      explanation: makeExplanation('Varies', 'Give extended answers (30-60 seconds). Discuss both present and future.'),
      points: 5,
      difficulty,
      tags: ['speaking', 'part-3', topic],
    },
  ]
  return questions
}

function buildDefaultWritingQuestions(topic: string, userData: UserData): ExerciseQuestion[] {
  const band = userData.currentBand || 5
  const difficulty = band < 6 ? 'beginner' : band < 7 ? 'intermediate' : 'advanced'
  const questions: ExerciseQuestion[] = [
    {
      id: generateId(),
      type: 'short-answer',
      question: `Write a paragraph about "${topic}". Include your main opinion and at least two supporting reasons with examples.`,
      correctAnswer: 'Sample answer will vary',
      explanation: makeExplanation('Varies', 'Write 150-200 words. Use topic sentences and supporting details.'),
      points: 10,
      difficulty,
      tags: ['writing', topic],
    },
    {
      id: generateId(),
      type: 'multiple-choice',
      question: `Which sentence best introduces a paragraph about "${topic}"?`,
      options: [
        `This essay will discuss ${topic}.`,
        `${topic} is a topic that has many different aspects to consider.`,
        `There are several key factors to consider when examining ${topic}.`,
        `In recent years, ${topic} has become an increasingly important issue.`,
      ],
      correctAnswer: 3,
      explanation: makeExplanation('3', 'A strong introduction mentions the topic and its current relevance to engage the reader.'),
      points: 2,
      difficulty,
      tags: ['writing', topic],
    },
  ]
  return questions
}

function buildDefaultReadingQuestions(topic: string, userData: UserData): ExerciseQuestion[] {
  const band = userData.currentBand || 5
  const difficulty = band < 6 ? 'beginner' : band < 7 ? 'intermediate' : 'advanced'
  const questions: ExerciseQuestion[] = [
    {
      id: generateId(),
      type: 'multiple-choice',
      question: `Read the passage: "${topic} plays an important role in modern society. Experts agree that understanding ${topic} is essential for personal and professional development." What is the main idea?`,
      options: [
        `${topic} is not important`,
        `${topic} plays an important role in modern society`,
        `Experts disagree about ${topic}`,
        `Only professionals need to understand ${topic}`,
      ],
      correctAnswer: 1,
      explanation: makeExplanation('1', 'The passage states that the topic plays an important role in modern society.'),
      points: 2,
      difficulty,
      tags: ['reading', topic],
    },
    {
      id: generateId(),
      type: 'gap-fill',
      question: `Complete the sentence: "Understanding ${topic} is essential for _____ and professional development."`,
      correctAnswer: 'personal',
      explanation: makeExplanation('personal', 'The passage mentions "personal and professional development."'),
      blanks: [{ position: 0, correctAnswer: 'personal' }],
      points: 2,
      difficulty,
      tags: ['reading', topic],
    },
    {
      id: generateId(),
      type: 'short-answer',
      question: `Based on your understanding of "${topic}", explain why it is relevant to daily life. Provide one specific example.`,
      correctAnswer: 'Sample answer will vary',
      explanation: makeExplanation('Varies', 'Use specific examples from your personal experience.'),
      points: 3,
      difficulty,
      tags: ['reading', topic],
    },
  ]
  return questions
}

function buildDefaultListeningQuestions(topic: string, userData: UserData): ExerciseQuestion[] {
  const band = userData.currentBand || 5
  const difficulty = band < 6 ? 'beginner' : band < 7 ? 'intermediate' : 'advanced'
  const questions: ExerciseQuestion[] = [
    {
      id: generateId(),
      type: 'multiple-choice',
      question: `Imagine you hear a lecture about "${topic}". What information would you expect to learn first?`,
      options: [
        `The history of ${topic}`,
        `An introduction and overview of ${topic}`,
        `Specific statistics about ${topic}`,
        `Personal opinions about ${topic}`,
      ],
      correctAnswer: 1,
      explanation: makeExplanation('1', 'Lectures typically start with an introduction and overview before going into details.'),
      points: 2,
      difficulty,
      tags: ['listening', topic],
    },
    {
      id: generateId(),
      type: 'gap-fill',
      question: `Fill in the blank: "Today we will discuss ${topic}, which is divided into _____ main sections."`,
      correctAnswer: 'three',
      blanks: [{ position: 0, correctAnswer: 'three' }],
      explanation: makeExplanation('three', 'IELTS listening passages are often structured with an introduction followed by several sections.'),
      points: 2,
      difficulty,
      tags: ['listening', topic],
    },
    {
      id: generateId(),
      type: 'multiple-choice',
      question: `When listening to information about "${topic}", which detail is most important to note?`,
      options: [
        `Every single word the speaker says`,
        `Key dates, names, and main ideas`,
        `The speaker's personal opinions only`,
        `The background music`,
      ],
      correctAnswer: 1,
      explanation: makeExplanation('1', 'Focus on key information like dates, names, and main ideas rather than every word.'),
      points: 2,
      difficulty,
      tags: ['listening', 'strategy', topic],
    },
  ]
  return questions
}

function buildDefaultVocabularyQuestions(topic: string, _userData: UserData): ExerciseQuestion[] {
  const questions: ExerciseQuestion[] = [
    {
      id: generateId(),
      type: 'gap-fill',
      question: `Complete the sentence related to "${topic}": "The study of ${topic} requires _____ understanding of key concepts."`,
      correctAnswer: 'a thorough',
      blanks: [{ position: 0, correctAnswer: 'a thorough' }],
      explanation: makeExplanation('a thorough', '"A thorough understanding" is a common collocation in academic English.'),
      points: 2,
      tags: ['vocabulary', topic],
    },
    {
      id: generateId(),
      type: 'multiple-choice',
      question: `Which word is most closely related to "${topic}"?`,
      options: ['irrelevant', 'related', 'random', 'temporary'],
      correctAnswer: 1,
      explanation: makeExplanation('1', '"Related" means connected or associated, which is most relevant to studying a topic.'),
      points: 2,
      tags: ['vocabulary', topic],
    },
  ]
  return questions
}

export async function getSavedExercisesForReview(): Promise<AiContent[]> {
  try {
    const all = await DatabaseService.getAll<AiContent>('aiContents')
    return all
      .filter(c => c.tags.includes('exercise-generator'))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } catch {
    return []
  }
}

export function parseExerciseFromAiContent(content: AiContent): Exercise | null {
  try {
    return JSON.parse(content.content) as Exercise
  } catch {
    return null
  }
}
