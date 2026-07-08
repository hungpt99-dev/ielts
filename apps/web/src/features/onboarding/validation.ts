import type { OnboardingProfile } from './types'
import { BAND_OPTIONS } from './types'

export interface StepErrors {
  [key: string]: string
}

function isBandValue(v: unknown): v is number {
  return typeof v === 'number' && (BAND_OPTIONS as readonly number[]).includes(v)
}

export function validateWelcomeStep(): StepErrors {
  return {}
}

export function validateIeltsGoalStep(profile: OnboardingProfile): StepErrors {
  const errors: StepErrors = {}
  if (!isBandValue(profile.targetBand) || profile.targetBand < 1) {
    errors.targetBand = 'Please select your target band score'
  }
  return errors
}

export function validateCurrentLevelStep(profile: OnboardingProfile): StepErrors {
  const errors: StepErrors = {}
  if (profile.currentLevelKnown && (!isBandValue(profile.currentBand) || profile.currentBand < 1)) {
    errors.currentBand = 'Please select your current band score'
  }
  if (profile.currentLevelKnown && profile.targetBand > 0 && profile.currentBand >= profile.targetBand) {
    errors.currentBand = 'Current level should be lower than your target band'
  }
  return errors
}

export function validateExamTimelineStep(profile: OnboardingProfile): StepErrors {
  const errors: StepErrors = {}
  if (profile.hasExamDate && !profile.examDate) {
    errors.examDate = 'Please select your exam date'
  }
  if (profile.examDate && profile.hasExamDate) {
    const examDate = new Date(profile.examDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (examDate < today) {
      errors.examDate = 'Exam date cannot be in the past'
    }
  }
  return errors
}

export function validateStudyScheduleStep(profile: OnboardingProfile): StepErrors {
  const errors: StepErrors = {}
  if (profile.studyDaysPerWeek < 1 || profile.studyDaysPerWeek > 7) {
    errors.studyDaysPerWeek = 'Please select between 1 and 7 days'
  }
  if (profile.studyMinutesPerDay < 10) {
    errors.studyMinutesPerDay = 'Please set at least 10 minutes per day'
  }
  return errors
}

export function validateWeakSkillsStep(profile: OnboardingProfile): StepErrors {
  const errors: StepErrors = {}
  if (profile.weakSkills.length === 0) {
    errors.weakSkills = 'Please select at least one skill to improve'
  }
  return errors
}

export function validateLearningPreferencesStep(_profile: OnboardingProfile): StepErrors {
  return {}
}

export function validateAiTutorSetupStep(_profile: OnboardingProfile): StepErrors {
  return {}
}

export function validateExtensionSetupStep(_profile: OnboardingProfile): StepErrors {
  return {}
}

export function validateReviewStep(_profile: OnboardingProfile): StepErrors {
  return {}
}

export const stepValidators: ((profile: OnboardingProfile) => StepErrors)[] = [
  validateWelcomeStep,
  validateIeltsGoalStep,
  validateCurrentLevelStep,
  validateExamTimelineStep,
  validateStudyScheduleStep,
  validateWeakSkillsStep,
  validateLearningPreferencesStep,
  validateAiTutorSetupStep,
  validateReviewStep,
]
