import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { OnboardingProfile } from './types'
import { getDefaultProfile, TOTAL_ONBOARDING_STEPS } from './types'
import { onboardingRepository } from './OnboardingRepository'
import { stepValidators } from './validation'
import type { StepErrors } from './validation'
import { completeOnboarding } from './onboardingService'
import { ROUTES } from '@ielts/config'
import OnboardingLayout from './components/OnboardingLayout'
import Button from '../../components/ui/Button'
import WelcomeStep from './components/steps/WelcomeStep'
import IeltsGoalStep from './components/steps/IeltsGoalStep'
import CurrentLevelStep from './components/steps/CurrentLevelStep'
import ExamTimelineStep from './components/steps/ExamTimelineStep'
import StudyScheduleStep from './components/steps/StudyScheduleStep'
import WeakSkillsStep from './components/steps/WeakSkillsStep'
import LearningPreferencesStep from './components/steps/LearningPreferencesStep'
import AiTutorSetupStep from './components/steps/AiTutorSetupStep'
import ReviewStep from './components/steps/ReviewStep'

const STEP_CONFIGS: { title: string; description: string }[] = [
  { title: 'Welcome to IELTS Journey', description: '' },
  { title: 'What band score do you need?', description: 'Set your target IELTS band score' },
  { title: 'What is your current level?', description: 'Tell us your estimated IELTS level' },
  { title: 'When is your exam?', description: 'Set your exam date for a personalized timeline' },
  { title: 'What is your study schedule?', description: 'Choose your intensity and weekly plan' },
  { title: 'Which skills need practice?', description: 'Select your weak areas and focus goals' },
  { title: 'Learning preferences', description: 'Customize how the AI Tutor works for you' },
  { title: 'AI Tutor setup', description: 'Personalize your AI Tutor experience' },
  { title: 'Review your profile', description: 'Check everything before starting' },
]

export default function OnboardingFlow() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [profile, setProfile] = useState<OnboardingProfile>(getDefaultProfile)
  const [errors, setErrors] = useState<StepErrors>({})
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState(false)

  useEffect(() => {
    const saved = onboardingRepository.load()
    if (!saved.onboardingCompleted && saved.targetBand > 0) {
      setProfile(saved)
      setStep(1)
    }
  }, [])

  useEffect(() => {
    if (step > 0) {
      onboardingRepository.save(profile)
    }
  }, [profile, step])

  const update = useCallback((patch: Partial<OnboardingProfile>) => {
    setProfile(prev => ({ ...prev, ...patch }))
    setErrors({})
  }, [])

  function validateCurrentStep(): boolean {
    const validator = stepValidators[step]
    if (!validator) return true
    const stepErrors = validator(profile)
    setErrors(stepErrors)
    return Object.keys(stepErrors).length === 0
  }

  function handleNext() {
    if (!validateCurrentStep()) return

    if (step < TOTAL_ONBOARDING_STEPS - 1) {
      setStep(s => s + 1)
    } else {
      handleFinish()
    }
  }

  function handleBack() {
    if (step > 0) setStep(s => s - 1)
  }

  async function handleFinish() {
    setIsSaving(true)
    setSaveError(false)
    try {
      const completed = { ...profile, onboardingCompleted: true }
      onboardingRepository.save(completed)
      onboardingRepository.markCompleted()
      await completeOnboarding({
        currentBand: completed.currentBand || 5.5,
        targetBand: completed.targetBand,
        examDate: completed.hasExamDate ? completed.examDate : '',
        dailyStudyMinutes: completed.studyMinutesPerDay,
        weakSkills: completed.weakSkills,
        strongSkills: [],
        preferredTopics: completed.priorityGoals,
        studyGoal: completed.studyGoal,
        preferredSchedule: completed.preferredSchedule,
        preferredLanguage: completed.preferredLanguage,
        tutorStyle: completed.tutorStyle,
      })
      navigate(ROUTES.dashboard, { replace: true })
    } catch (error) {
      console.error('apps/web/src/features/onboarding/OnboardingFlow.tsx error:', error);
      setSaveError(true)
      setIsSaving(false)
    }
  }

  const currentConfig = STEP_CONFIGS[step]
  const isFirstStep = step === 0
  const isLastStep = step === TOTAL_ONBOARDING_STEPS - 1

  function renderStep() {
    switch (step) {
      case 0: return <WelcomeStep onStart={() => setStep(1)} />
      case 1: return <IeltsGoalStep profile={profile} update={update} errors={errors} />
      case 2: return <CurrentLevelStep profile={profile} update={update} errors={errors} />
      case 3: return <ExamTimelineStep profile={profile} update={update} errors={errors} />
      case 4: return <StudyScheduleStep profile={profile} update={update} errors={errors} />
      case 5: return <WeakSkillsStep profile={profile} update={update} errors={errors} />
      case 6: return <LearningPreferencesStep profile={profile} update={update} errors={errors} />
      case 7: return <AiTutorSetupStep profile={profile} update={update} errors={errors} />
      case 8: return <ReviewStep profile={profile} errors={errors} />
      default: return null
    }
  }

  if (isFirstStep) {
    return (
      <OnboardingLayout
        currentStep={step}
        stepTitle={currentConfig.title}
        stepDescription={currentConfig.description}
        showBack={false}
      >
        <WelcomeStep onStart={() => setStep(1)} />
      </OnboardingLayout>
    )
  }

  return (
    <OnboardingLayout
      currentStep={step}
      stepTitle={currentConfig.title}
      stepDescription={currentConfig.description}
      onBack={handleBack}
      showBack
      footer={
        saveError ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)', marginBottom: 'var(--spacing-xs)' }}>
              Something went wrong saving your profile. Please try again.
            </p>
            <div style={{ display: 'flex', gap: 'var(--spacing-xs)', justifyContent: 'center' }}>
              <Button variant="primary" onClick={handleFinish} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Try Again'}
              </Button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <Button variant="ghost" onClick={handleBack} fullWidth size="md">
              Back
            </Button>
            <Button variant="primary" onClick={handleNext} fullWidth size="md" disabled={isSaving}>
              {isLastStep ? 'Finish Setup' : 'Continue'}
            </Button>
          </div>
        )
      }
    >
      {renderStep()}
    </OnboardingLayout>
  )
}
