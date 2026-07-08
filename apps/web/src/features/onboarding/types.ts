export type TutorStyle = 'encouraging' | 'direct' | 'detailed'
export type Intensity = 'light' | 'balanced' | 'intensive'
export type ExplanationStyle = 'simple' | 'detailed' | 'example-based' | 'step-by-step'
export type TutorTone = 'friendly' | 'strict' | 'motivational' | 'professional'
export type CorrectionDetail = 'quick' | 'detailed' | 'band-score'
export type ExtensionSetupStatus = 'not-installed' | 'installed' | 'connected' | 'skipped'
export type StudyDay = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'
export type StudyGoal = 'academic' | 'general'
export type WeekdayLabel = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'

export interface SkillBand {
  listening?: number
  reading?: number
  writing?: number
  speaking?: number
}

export interface OnboardingProfile {
  targetBand: number
  targetSkillBands: SkillBand
  currentBand: number
  currentSkillBands: SkillBand
  currentLevelKnown: boolean
  examDate: string
  hasExamDate: boolean
  studyDaysPerWeek: number
  studyMinutesPerDay: number
  preferredStudyTime: string
  preferredReminderTime: string
  intensity: Intensity
  weakSkills: string[]
  priorityGoals: string[]
  preferredLanguage: string
  explanationStyle: ExplanationStyle
  tutorTone: TutorTone
  tutorStyle: TutorStyle
  correctionDetail: CorrectionDetail
  studyGoal: StudyGoal
  preferredSchedule: StudyDay[]
  aiTutorPersonalizationEnabled: boolean
  proactiveTutorEnabled: boolean
  extensionSetupStatus: ExtensionSetupStatus
  onboardingCompleted: boolean
  createdAt: string
  updatedAt: string
}

export const BAND_OPTIONS = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9] as const

export const WEAK_SKILL_OPTIONS = [
  { value: 'Listening', label: 'Listening', description: 'Understanding audio and answering questions' },
  { value: 'Reading', label: 'Reading', description: 'Skimming, scanning, and comprehension' },
  { value: 'Writing', label: 'Writing', description: 'Task 1 & Task 2 essays' },
  { value: 'Speaking', label: 'Speaking', description: 'Fluency, pronunciation, and coherence' },
  { value: 'Vocabulary', label: 'Vocabulary', description: 'Academic word knowledge and usage' },
  { value: 'Grammar', label: 'Grammar', description: 'Sentence structure and accuracy' },
  { value: 'Pronunciation', label: 'Pronunciation', description: 'Sound production and intonation' },
  { value: 'Time Management', label: 'Time Management', description: 'Pacing during the exam' },
  { value: 'Test Strategy', label: 'Test Strategy', description: 'Approach and technique' },
] as const

export const PRIORITY_GOAL_OPTIONS = [
  { value: 'improve-writing-task-2', label: 'Improve Writing Task 2' },
  { value: 'speak-more-fluently', label: 'Speak more fluently' },
  { value: 'understand-listening-better', label: 'Understand listening audio better' },
  { value: 'read-faster', label: 'Read faster' },
  { value: 'build-academic-vocabulary', label: 'Build academic vocabulary' },
  { value: 'fix-grammar-mistakes', label: 'Fix grammar mistakes' },
  { value: 'improve-pronunciation', label: 'Improve pronunciation' },
  { value: 'master-test-strategy', label: 'Master test strategy' },
] as const

export const INTENSITY_OPTIONS: { value: Intensity; label: string; description: string }[] = [
  { value: 'light', label: 'Light', description: '20–30 minutes per day' },
  { value: 'balanced', label: 'Balanced', description: '45–90 minutes per day' },
  { value: 'intensive', label: 'Intensive', description: '2+ hours per day' },
]

export const EXPLANATION_STYLE_OPTIONS: { value: ExplanationStyle; label: string; description: string }[] = [
  { value: 'simple', label: 'Simple', description: 'Short and easy to understand' },
  { value: 'detailed', label: 'Detailed', description: 'Thorough with examples' },
  { value: 'example-based', label: 'Example Based', description: 'Learn through examples' },
  { value: 'step-by-step', label: 'Step by Step', description: 'Guided progression' },
]

export const TUTOR_TONE_OPTIONS: { value: TutorTone; label: string; description: string }[] = [
  { value: 'friendly', label: 'Friendly', description: 'Warm and supportive' },
  { value: 'strict', label: 'Strict', description: 'Direct and disciplined' },
  { value: 'motivational', label: 'Motivational', description: 'Encouraging and inspiring' },
  { value: 'professional', label: 'Professional', description: 'Formal and precise' },
]

export const CORRECTION_DETAIL_OPTIONS: { value: CorrectionDetail; label: string; description: string }[] = [
  { value: 'quick', label: 'Quick', description: 'Point out the mistake' },
  { value: 'detailed', label: 'Detailed', description: 'Explain why and how to fix' },
  { value: 'band-score', label: 'Band Score', description: 'Score-based feedback like real IELTS' },
]

export const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English', nativeLabel: 'English' },
  { value: 'vi', label: 'Vietnamese', nativeLabel: 'Tiếng Việt' },
  { value: 'ja', label: 'Japanese', nativeLabel: '日本語' },
  { value: 'ko', label: 'Korean', nativeLabel: '한국어' },
  { value: 'zh', label: 'Chinese', nativeLabel: '中文' },
  { value: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { value: 'ar', label: 'Arabic', nativeLabel: 'العربية' },
  { value: 'es', label: 'Spanish', nativeLabel: 'Español' },
] as const

export const STUDY_DAY_LABELS: Record<StudyDay, WeekdayLabel> = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday',
  thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
}

export function getDefaultProfile(): OnboardingProfile {
  const now = new Date().toISOString()
  return {
    targetBand: 7,
    targetSkillBands: {},
    currentBand: 0,
    currentSkillBands: {},
    currentLevelKnown: false,
    examDate: '',
    hasExamDate: false,
    studyDaysPerWeek: 5,
    studyMinutesPerDay: 60,
    preferredStudyTime: '09:00',
    preferredReminderTime: '08:00',
    intensity: 'balanced',
    weakSkills: [],
    priorityGoals: [],
    preferredLanguage: 'en',
    explanationStyle: 'detailed',
    tutorTone: 'friendly',
    tutorStyle: 'encouraging',
    correctionDetail: 'detailed',
    studyGoal: 'academic',
    preferredSchedule: ['mon', 'tue', 'wed', 'thu', 'fri'],
    aiTutorPersonalizationEnabled: true,
    proactiveTutorEnabled: false,
    extensionSetupStatus: 'not-installed',
    onboardingCompleted: false,
    createdAt: now,
    updatedAt: now,
  }
}

export const TOTAL_ONBOARDING_STEPS = 9
