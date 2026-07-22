export type SpeakingPhase = 'introduction' | 'part1' | 'part2-preparation' | 'part2-speaking' | 'part2-followup' | 'part3' | 'conclusion'

export type SpeakingMode = 'practice' | 'exam'

export interface SpeakingState {
  phase: SpeakingPhase
  mode: SpeakingMode
  currentPart: 1 | 2 | 3
  currentQuestionIndex: number
  totalParts: number
  elapsedSeconds: number
  phaseStartTime: string
  responses: SpeakingResponse[]
  preparationSecondsRemaining?: number
  speakingSecondsRemaining?: number
}

export interface SpeakingResponse {
  questionId: string
  transcript: string
  audioUrl?: string
  durationSeconds: number
  submittedAt: string
  part: 1 | 2 | 3
}

export const SPEAKING_PHASE_ORDER: SpeakingPhase[] = [
  'introduction', 'part1', 'part2-preparation', 'part2-speaking', 'part2-followup', 'part3', 'conclusion',
]

export const SPEAKING_PHASE_DURATIONS: Record<SpeakingPhase, number> = {
  'introduction': 30,
  'part1': 270,
  'part2-preparation': 60,
  'part2-speaking': 120,
  'part2-followup': 15,
  'part3': 270,
  'conclusion': 15,
}

export const SPEAKING_PART_MAP: Record<SpeakingPhase, 1 | 2 | 3 | null> = {
  'introduction': null,
  'part1': 1,
  'part2-preparation': 2,
  'part2-speaking': 2,
  'part2-followup': 2,
  'part3': 3,
  'conclusion': null,
}

export function createSpeakingState(mode: SpeakingMode): SpeakingState {
  return {
    phase: 'introduction',
    mode,
    currentPart: 1,
    currentQuestionIndex: 0,
    totalParts: 3,
    elapsedSeconds: 0,
    phaseStartTime: new Date().toISOString(),
    responses: [],
  }
}

export function canProvideHints(state: SpeakingState): boolean {
  return state.mode === 'practice'
}

export function canProvideFeedback(state: SpeakingState): boolean {
  return state.phase === 'conclusion'
}

export function canCorrectLearner(state: SpeakingState): boolean {
  return state.mode === 'practice'
}

export function nextPhase(currentPhase: SpeakingPhase): SpeakingPhase {
  const idx = SPEAKING_PHASE_ORDER.indexOf(currentPhase)
  if (idx < 0 || idx >= SPEAKING_PHASE_ORDER.length - 1) return currentPhase
  return SPEAKING_PHASE_ORDER[idx + 1]
}

export function getPhaseDuration(phase: SpeakingPhase): number {
  return SPEAKING_PHASE_DURATIONS[phase] || 60
}

export function isExamSimulation(state: SpeakingState): boolean {
  return state.mode === 'exam'
}
