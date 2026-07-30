import type { SpeakingPart } from '../../models'

export interface SpeakingQuestion {
  id: string
  part: 1 | 2 | 3
  question: string
  topic: string
  difficulty?: string
  estimatedTime?: string
  followUp?: string[]
  cueCard?: {
    topic: string
    points: string[]
    followUp: string[]
  }
}

export interface SpeakingPhrase {
  category: string
  phrases: string[]
}

export interface BandScore {
  overall: number
  fluency: number
  vocabulary: number
  grammar: number
  pronunciation: number
  coherence: number
  taskAchievement: number
}

export interface GrammarCorrection {
  original: string
  corrected: string
  explanation: string
}

export interface VocabularySuggestion {
  word: string
  alternatives: string[]
  type: 'basic' | 'advanced' | 'idiom' | 'collocation' | 'academic'
}

export interface SessionStats {
  bandScore: BandScore
  durationSeconds: number
  wordsSpoken: number
  wordsPerMinute: number
  vocabularyRichness: string
  grammarAccuracy: string
  fillersUsed: number
  longestPause: number
  improvementTips: string[]
}

export interface ModelAnswer {
  band: 6 | 7 | 8 | 9
  content: string
  vocabulary: string[]
  grammar: string[]
  expressions: string[]
}

export type SessionStage =
  | 'browse'
  | 'preparation'
  | 'speaking'
  | 'analyzing'
  | 'results'
  | 'history'

export interface AICoachFeedback {
  estimatedBand: number
  overallFeedback: string
  strengths: string[]
  areasToImprove: string[]
  grammarCorrections: GrammarCorrection[]
  vocabularySuggestions: VocabularySuggestion[]
  fluencyFeedback: string
  pronunciationFeedback: string
  taskAchievementFeedback: string
  modelAnswers: ModelAnswer[]
  followUpQuestions: string[]
  improvedAnswer?: string
}

export interface SpeakingState {
  stage: SessionStage
  selectedQuestion: SpeakingQuestion | null
  sessionId: string | null
  answerTranscript: string
  aiCoachFeedback: AICoachFeedback | null
  sessionStats: SessionStats | null
  aiLoading: boolean
  aiError: string | null
  quickNotes: string
  keywordChips: string[]
  recordingTime: number
  savedPhrases: string[]
  history: SpeakingSession[]
  loading: boolean
  error: string | null
}

import type { SpeakingSession } from '../../models'

export type SpeakingAction =
  | { type: 'SET_STAGE'; stage: SessionStage }
  | { type: 'START_SESSION'; question: SpeakingQuestion; sessionId: string | null }
  | { type: 'SET_SESSION_ID'; sessionId: string }
  | { type: 'SET_ANSWER_TRANSCRIPT'; transcript: string }
  | { type: 'SET_AI_FEEDBACK'; feedback: AICoachFeedback }
  | { type: 'SET_AI_LOADING'; loading: boolean }
  | { type: 'SET_AI_ERROR'; error: string | null }
  | { type: 'SET_SESSION_STATS'; stats: SessionStats }
  | { type: 'SET_QUICK_NOTES'; notes: string }
  | { type: 'SET_KEYWORD_CHIPS'; chips: string[] }
  | { type: 'ADD_KEYWORD_CHIP'; chip: string }
  | { type: 'REMOVE_KEYWORD_CHIP'; index: number }
  | { type: 'SET_RECORDING_TIME'; time: number }
  | { type: 'TOGGLE_SAVED_PHRASE'; phrase: string }
  | { type: 'SET_HISTORY'; history: SpeakingSession[] }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'RESET_SESSION' }
  | { type: 'RESET_ALL' }

export const emptyBandScore: BandScore = {
  overall: 0,
  fluency: 0,
  vocabulary: 0,
  grammar: 0,
  pronunciation: 0,
  coherence: 0,
  taskAchievement: 0,
}

export const initialState: SpeakingState = {
  stage: 'browse',
  selectedQuestion: null,
  sessionId: null,
  answerTranscript: '',
  aiCoachFeedback: null,
  sessionStats: null,
  aiLoading: false,
  aiError: null,
  quickNotes: '',
  keywordChips: [],
  recordingTime: 0,
  savedPhrases: [],
  history: [],
  loading: true,
  error: null,
}

export function speakingReducer(state: SpeakingState, action: SpeakingAction): SpeakingState {
  switch (action.type) {
    case 'SET_STAGE':
      return { ...state, stage: action.stage }
    case 'START_SESSION':
      return {
        ...state,
        stage: action.question.part === 2 ? 'preparation' : 'speaking',
        selectedQuestion: action.question,
        sessionId: action.sessionId,
        answerTranscript: '',
        aiCoachFeedback: null,
        sessionStats: null,
        aiLoading: false,
        aiError: null,
        quickNotes: '',
        keywordChips: [],
        recordingTime: 0,
      }
    case 'SET_SESSION_ID':
      return { ...state, sessionId: action.sessionId }
    case 'SET_ANSWER_TRANSCRIPT':
      return { ...state, answerTranscript: action.transcript }
    case 'SET_AI_FEEDBACK':
      return { ...state, aiCoachFeedback: action.feedback, aiLoading: false, aiError: null }
    case 'SET_AI_LOADING':
      return { ...state, aiLoading: action.loading }
    case 'SET_AI_ERROR':
      return { ...state, aiError: action.error, aiLoading: false }
    case 'SET_SESSION_STATS':
      return { ...state, sessionStats: action.stats }
    case 'SET_QUICK_NOTES':
      return { ...state, quickNotes: action.notes }
    case 'SET_KEYWORD_CHIPS':
      return { ...state, keywordChips: action.chips }
    case 'ADD_KEYWORD_CHIP':
      return { ...state, keywordChips: [...state.keywordChips, action.chip].filter((v, i, a) => a.indexOf(v) === i) }
    case 'REMOVE_KEYWORD_CHIP':
      return { ...state, keywordChips: state.keywordChips.filter((_, i) => i !== action.index) }
    case 'SET_RECORDING_TIME':
      return { ...state, recordingTime: action.time }
    case 'TOGGLE_SAVED_PHRASE':
      return {
        ...state,
        savedPhrases: state.savedPhrases.includes(action.phrase)
          ? state.savedPhrases.filter(p => p !== action.phrase)
          : [...state.savedPhrases, action.phrase],
      }
    case 'SET_HISTORY':
      return { ...state, history: action.history, loading: false }
    case 'SET_LOADING':
      return { ...state, loading: action.loading }
    case 'SET_ERROR':
      return { ...state, error: action.error, loading: false }
    case 'RESET_SESSION':
      return {
        ...state,
        stage: 'browse',
        selectedQuestion: null,
        sessionId: null,
        answerTranscript: '',
        aiCoachFeedback: null,
        sessionStats: null,
        aiLoading: false,
        aiError: null,
        quickNotes: '',
        keywordChips: [],
        recordingTime: 0,
      }
    case 'RESET_ALL':
      return { ...initialState, loading: false }
    default:
      return state
  }
}
