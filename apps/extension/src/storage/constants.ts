export const STORE_NAMES = {
  LEARNING_ENTRIES: 'learningEntries',
  VOCABULARY: 'vocabulary',
  ARTICLES: 'articles',
  VIDEOS: 'videos',
  MISTAKES: 'mistakes',
} as const

export const STORAGE_KEYS = {
  VOCABULARY: 'vocabulary',
  DAILY_PROGRESS: 'dailyProgress',
  LAST_SYNC_TIME: 'lastSyncTime',
  AI_API_KEY: 'aiApiKey',
  EXTENSION_SETTINGS: 'extensionSettings',
  IELTS_USER: 'ieltsUser',
  SAVED_ITEMS: 'savedItems',
} as const

export const IDB_INDEXES = {
  CATEGORY: 'category',
  CREATED_AT: 'createdAt',
  TOPIC: 'topic',
  SKILL: 'skill',
  STATUS: 'status',
  WORD: 'word',
  ADDED_TO_REVIEW: 'addedToReview',
  IS_READING_PRACTICE: 'isReadingPractice',
  PLATFORM: 'platform',
} as const

export const MESSAGE_TYPES = {
  VOCAB_SAVED: 'VOCAB_SAVED',
  SAVE_SELECTION_FULL: 'SAVE_SELECTION_FULL',
  SETTINGS_SYNC: 'SETTINGS_SYNC',
  GET_PAGE_INFO: 'GET_PAGE_INFO',
  AI_EXPLAIN: 'AI_EXPLAIN',
} as const

export const PROGRESS_KEYS = {
  WORDS_ADDED: 'wordsAdded',
  NOTES_ADDED: 'notesAdded',
  ARTICLES_SAVED: 'articlesSaved',
} as const
