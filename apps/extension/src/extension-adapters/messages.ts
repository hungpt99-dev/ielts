export const EXTENSION_MESSAGE_TYPES = {
  OPEN_MAIN_APP: 'OPEN_MAIN_APP',
  SAVE_SELECTED_TEXT: 'SAVE_SELECTED_TEXT',
  SAVE_ARTICLE: 'SAVE_ARTICLE',
  COLLECT_VOCABULARY: 'COLLECT_VOCABULARY',
  START_VOCABULARY_REVIEW: 'START_VOCABULARY_REVIEW',
  GET_ACTIVE_TAB_CONTEXT: 'GET_ACTIVE_TAB_CONTEXT',
  SET_HIGHLIGHTING_ENABLED: 'SET_HIGHLIGHTING_ENABLED',
  TOGGLE_YOUTUBE_LEARNING: 'TOGGLE_YOUTUBE_LEARNING',
  GET_EXTENSION_SETTINGS: 'GET_EXTENSION_SETTINGS',
  SAVE_EXTENSION_SETTINGS: 'SAVE_EXTENSION_SETTINGS',
  DATA_CHANGED: 'DATA_CHANGED',
  POPUP_OPENED: 'POPUP_OPENED',
  GET_DAILY_PROGRESS: 'GET_DAILY_PROGRESS',
  UPDATE_PROGRESS: 'UPDATE_PROGRESS',
  SAVE_SELECTION_FULL: 'SAVE_SELECTION_FULL',
  AI_EXPLAIN: 'AI_EXPLAIN',
  SAVE_ARTIFACT: 'SAVE_ARTIFACT',
  GET_PAGE_INFO: 'GET_PAGE_INFO',
  EXTRACT_ARTICLE: 'EXTRACT_ARTICLE',
  VIDEO_PAGE_DETECTED: 'VIDEO_PAGE_DETECTED',
  MINI_TUTOR_SAVE_RESULT: 'MINI_TUTOR_SAVE_RESULT',
  FETCH_TRANSCRIPT: 'FETCH_TRANSCRIPT',
  TOGGLE_FOCUS_MODE: 'TOGGLE_FOCUS_MODE',
  SET_AUTO_OPEN: 'SET_AUTO_OPEN',
  GET_POPUP_DASHBOARD: 'GET_POPUP_DASHBOARD',
} as const

export type ExtensionMessageType = typeof EXTENSION_MESSAGE_TYPES[keyof typeof EXTENSION_MESSAGE_TYPES]

export interface OpenMainAppMessage {
  type: typeof EXTENSION_MESSAGE_TYPES.OPEN_MAIN_APP
  route?: string
}

export interface SaveSelectedTextMessage {
  type: typeof EXTENSION_MESSAGE_TYPES.SAVE_SELECTED_TEXT
  payload: {
    text: string
    category?: string
    topic?: string
    sourceUrl?: string
  }
}

export interface SetHighlightingEnabledMessage {
  type: typeof EXTENSION_MESSAGE_TYPES.SET_HIGHLIGHTING_ENABLED
  enabled: boolean
}

export interface DataChangedMessage {
  type: typeof EXTENSION_MESSAGE_TYPES.DATA_CHANGED
  entity: string
  action: 'created' | 'updated' | 'deleted'
}

export type ExtensionMessage =
  | OpenMainAppMessage
  | SaveSelectedTextMessage
  | SetHighlightingEnabledMessage
  | DataChangedMessage
  | { type: typeof EXTENSION_MESSAGE_TYPES.SAVE_ARTICLE; payload: { title?: string; url?: string; content?: string } }
  | { type: typeof EXTENSION_MESSAGE_TYPES.COLLECT_VOCABULARY; payload: { word: string; context?: string } }
  | { type: typeof EXTENSION_MESSAGE_TYPES.START_VOCABULARY_REVIEW }
  | { type: typeof EXTENSION_MESSAGE_TYPES.GET_ACTIVE_TAB_CONTEXT }
  | { type: typeof EXTENSION_MESSAGE_TYPES.POPUP_OPENED }
  | { type: typeof EXTENSION_MESSAGE_TYPES.DATA_CHANGED; entity: string; action: 'created' | 'updated' | 'deleted' }

export const MAIN_APP_PATH = 'app/index.html'
export const MAIN_APP_DASHBOARD_URL = `${MAIN_APP_PATH}#/dashboard`
