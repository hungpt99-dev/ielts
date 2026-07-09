import type { VocabularyEntry, MistakeEntry } from '../../models'

export interface ExtensionVocabEntryData {
  id: string
  word: string
  sourceSentence: string
  pageTitle: string
  pageUrl: string
  topic: string
  personalNote: string
  tags: string[]
  meaning: string
  meaningVi: string
  partOfSpeech: string
  pronunciation: string
  exampleSentence: string
  synonyms: string[]
  antonyms: string[]
  collocations: string[]
  wordFamily: string[]
  difficulty: 'easy' | 'medium' | 'hard' | ''
  status: 'new' | 'learning' | 'reviewing' | 'mastered'
  createdAt: string
  updatedAt: string
}

export interface ExtensionArticleEntryData {
  id: string
  title: string
  url: string
  content: string
  selectedParagraph: string
  topic: string
  tags: string[]
  personalNote: string
  difficulty: 'easy' | 'medium' | 'hard' | ''
  status: 'new' | 'reading' | 'reviewed'
  createdAt: string
  updatedAt: string
}

export interface ExtensionMistakeEntryData {
  id: string
  mistake: string
  correction: string
  explanation: string
  source: string
  topic: string
  date: string
  skill: 'vocabulary' | 'grammar' | 'reading' | 'listening' | 'writing' | 'speaking'
  status: 'new' | 'reviewing' | 'fixed'
  repetitionCount: number
  createdAt: string
  updatedAt: string
}

export interface SharedSettingsPatchData {
  aiProvider: string
  aiModel: string
  aiBaseUrl: string
  aiApiKey: string
  themeMode: 'light' | 'dark' | 'system'
}

const MISTAKE_STATUS_MAP: Record<string, MistakeEntry['status']> = {
  new: 'new',
  reviewing: 'reviewed',
  fixed: 'resolved',
  reviewed: 'reviewed',
  resolved: 'resolved',
}

export function mapExtensionVocabToWeb(ext: ExtensionVocabEntryData): VocabularyEntry {
  return {
    id: ext.id,
    word: ext.word,
    meaning: ext.meaning || ext.sourceSentence,
    meaningVi: ext.meaningVi || '',
    pronunciation: ext.pronunciation || '',
    partOfSpeech: ext.partOfSpeech || '',
    topic: ext.topic || 'general',
    exampleSentence: ext.exampleSentence || ext.sourceSentence,
    collocations: ext.collocations || [],
    synonyms: ext.synonyms || [],
    antonyms: ext.antonyms || [],
    wordFamily: ext.wordFamily || [],
    personalNote: ext.personalNote || '',
    difficulty: ext.difficulty === '' ? 'medium' : ext.difficulty as 'easy' | 'medium' | 'hard',
    status: ext.status,
    tags: ext.tags || [],
    createdAt: ext.createdAt,
    updatedAt: ext.updatedAt,
  }
}

export function mapExtensionMistakeToWeb(ext: ExtensionMistakeEntryData): MistakeEntry {
  return {
    id: ext.id,
    mistake: ext.mistake,
    correction: ext.correction,
    explanation: ext.explanation || '',
    source: ext.source || '',
    date: ext.date,
    skill: ext.skill,
    status: MISTAKE_STATUS_MAP[ext.status] || 'new',
    repetitionCount: ext.repetitionCount || 0,
    createdAt: ext.createdAt,
    updatedAt: ext.updatedAt,
  }
}

export function mapWebSettingsToPatch(settings: {
  aiProvider?: string
  aiModel?: string
  aiBaseUrl?: string
  aiEndpoint?: string
  aiApiKey?: string
  darkMode?: boolean
}): SharedSettingsPatchData {
  return {
    aiProvider: settings.aiProvider || 'openai',
    aiModel: settings.aiModel || 'gpt-4o-mini',
    aiBaseUrl: settings.aiBaseUrl || settings.aiEndpoint || '',
    aiApiKey: settings.aiApiKey || '',
    themeMode: settings.darkMode ? 'dark' : 'light',
  }
}
