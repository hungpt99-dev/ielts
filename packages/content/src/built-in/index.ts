import { BUILT_IN_IELTS_TOPICS, IELTS_TOPICS_PACK_ID } from './topics'
import { BUILT_IN_READING_PASSAGES, READING_PASSAGES_PACK_ID } from './reading'
import { BUILT_IN_WRITING_PROMPTS, WRITING_PROMPTS_PACK_ID } from './writing'
import { BUILT_IN_SPEAKING_QUESTIONS, SPEAKING_QUESTIONS_PACK_ID } from './speaking'
import { BUILT_IN_GRAMMAR_NOTES, GRAMMAR_NOTES_PACK_ID } from './grammar'
import { BUILT_IN_LISTENING_TRANSCRIPTS, LISTENING_TRANSCRIPTS_PACK_ID } from './listening'
import { BUILT_IN_USEFUL_PHRASES, USEFUL_PHRASES_PACK_ID } from './phrases'
import type { ContentPackMeta } from '../types'

export interface BuiltInPack {
  meta: ContentPackMeta
  items: unknown[]
}

export {
  BUILT_IN_IELTS_TOPICS,
  IELTS_TOPICS_PACK_ID,
  BUILT_IN_READING_PASSAGES,
  READING_PASSAGES_PACK_ID,
  BUILT_IN_WRITING_PROMPTS,
  WRITING_PROMPTS_PACK_ID,
  BUILT_IN_SPEAKING_QUESTIONS,
  SPEAKING_QUESTIONS_PACK_ID,
  BUILT_IN_GRAMMAR_NOTES,
  GRAMMAR_NOTES_PACK_ID,
  BUILT_IN_LISTENING_TRANSCRIPTS,
  LISTENING_TRANSCRIPTS_PACK_ID,
  BUILT_IN_USEFUL_PHRASES,
  USEFUL_PHRASES_PACK_ID,
}

export interface PackEntry {
  id: string
  name: string
  tableName: string
  items: unknown[]
  contentType: string
}

export const ALL_BUILT_IN_PACKS: PackEntry[] = [
  {
    id: IELTS_TOPICS_PACK_ID,
    name: 'IELTS Topics',
    tableName: 'ieltsTopics',
    items: BUILT_IN_IELTS_TOPICS,
    contentType: 'ielts-topic',
  },
  {
    id: READING_PASSAGES_PACK_ID,
    name: 'Reading Passages',
    tableName: 'readingPassages',
    items: BUILT_IN_READING_PASSAGES,
    contentType: 'reading-passage',
  },
  {
    id: WRITING_PROMPTS_PACK_ID,
    name: 'Writing Prompts',
    tableName: 'writingPrompts',
    items: BUILT_IN_WRITING_PROMPTS,
    contentType: 'writing-prompt',
  },
  {
    id: SPEAKING_QUESTIONS_PACK_ID,
    name: 'Speaking Questions',
    tableName: 'speakingQuestions',
    items: BUILT_IN_SPEAKING_QUESTIONS,
    contentType: 'speaking-question',
  },
  {
    id: GRAMMAR_NOTES_PACK_ID,
    name: 'Grammar Notes',
    tableName: 'grammarNotes',
    items: BUILT_IN_GRAMMAR_NOTES,
    contentType: 'grammar-note',
  },
  {
    id: LISTENING_TRANSCRIPTS_PACK_ID,
    name: 'Listening Transcripts',
    tableName: 'listeningTranscripts',
    items: BUILT_IN_LISTENING_TRANSCRIPTS,
    contentType: 'listening-transcript',
  },
  {
    id: USEFUL_PHRASES_PACK_ID,
    name: 'Useful Phrases',
    tableName: 'usefulPhrases',
    items: BUILT_IN_USEFUL_PHRASES,
    contentType: 'useful-phrase',
  },
]

export const BUILT_IN_TABLES: Record<string, string> = {
  [IELTS_TOPICS_PACK_ID]: 'ieltsTopics',
  [READING_PASSAGES_PACK_ID]: 'readingPassages',
  [WRITING_PROMPTS_PACK_ID]: 'writingPrompts',
  [SPEAKING_QUESTIONS_PACK_ID]: 'speakingQuestions',
  [GRAMMAR_NOTES_PACK_ID]: 'grammarNotes',
  [LISTENING_TRANSCRIPTS_PACK_ID]: 'listeningTranscripts',
  [USEFUL_PHRASES_PACK_ID]: 'usefulPhrases',
}
