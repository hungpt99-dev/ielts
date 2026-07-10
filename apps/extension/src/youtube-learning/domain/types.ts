export type StudyActivityType =
  | 'learning-mode-started' | 'learning-mode-ended'
  | 'word-opened' | 'word-saved' | 'sentence-saved'
  | 'note-created' | 'note-edited' | 'note-deleted'
  | 'exercise-started' | 'exercise-completed'
  | 'dictation-attempt' | 'shadowing-attempt'
  | 'speaking-attempt' | 'summary-submitted'
  | 'transcript-segment-replayed'
  | 'video-analysis-completed'
  | 'tutor-intervention'
  | 'study-session-completed'
  | 'playlist-created' | 'playlist-video-added'

export interface VideoPageInfo {
  isVideoPage: boolean
  platform: string
  videoId: string
  videoTitle: string
  videoUrl: string
  channelName: string
  channelId: string
}

export interface TranscriptSegmentData {
  id: string
  start: number
  end: number
  text: string
  words?: Array<{ word: string; start: number; end: number }>
}

export interface TranscriptData {
  videoId: string
  language: string
  source: 'manual' | 'auto-generated' | 'unknown'
  segments: TranscriptSegmentData[]
  fullText: string
}
