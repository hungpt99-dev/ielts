import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { completeOnboarding, type OnboardingData } from './onboardingService'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'

const BAND_OPTIONS = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9]

const SKILL_OPTIONS = [
  'Reading', 'Listening', 'Writing', 'Speaking', 'Vocabulary', 'Grammar',
]

const DAYS_OF_WEEK = [
  { value: 'mon', label: 'Monday' },
  { value: 'tue', label: 'Tuesday' },
  { value: 'wed', label: 'Wednesday' },
  { value: 'thu', label: 'Thursday' },
  { value: 'fri', label: 'Friday' },
  { value: 'sat', label: 'Saturday' },
  { value: 'sun', label: 'Sunday' },
]

const TOPIC_OPTIONS = [
  'Education', 'Technology', 'Environment', 'Health',
  'Work', 'Business', 'Travel', 'Culture', 'Society',
  'Crime', 'Government', 'Media', 'Globalization',
  'Family', 'Housing', 'Transport', 'Art', 'Sports', 'Science',
]

interface StepProps {
  data: OnboardingData
  update: (patch: Partial<OnboardingData>) => void
  errors: Record<string, string>
  onNext: () => void
  onBack?: () => void
}

function StepGoal({ data, update, errors, onNext }: StepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
          <svg className="h-7 w-7 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
          </svg>
        </div>
        <h2 className="mt-4 text-xl font-bold text-[var(--color-text)]">Welcome to IELTS Journey</h2>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Let's set up your personalized IELTS study plan. This takes 2 minutes.
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-[var(--color-text-secondary)]">I am preparing for</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => update({ studyGoal: 'academic' })}
            className={`rounded-xl border-2 p-4 text-left transition-all ${
              data.studyGoal === 'academic'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-[var(--color-border)] hover:border-blue-300'
            }`}
          >
            <p className="text-sm font-semibold text-[var(--color-text)]">IELTS Academic</p>
            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">For university admission</p>
          </button>
          <button
            type="button"
            onClick={() => update({ studyGoal: 'general' })}
            className={`rounded-xl border-2 p-4 text-left transition-all ${
              data.studyGoal === 'general'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-[var(--color-border)] hover:border-blue-300'
            }`}
          >
            <p className="text-sm font-semibold text-[var(--color-text)]">IELTS General</p>
            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">For work or migration</p>
          </button>
        </div>
      </div>

      <Select
        label="Your current IELTS level"
        value={String(data.currentBand)}
        onChange={(e) => update({ currentBand: parseFloat(e.target.value) })}
        options={BAND_OPTIONS.map(b => ({ value: String(b), label: b.toFixed(1) }))}
        placeholder="Select your level"
        error={errors.currentBand}
      />

      <Select
        label="Your target IELTS band"
        value={String(data.targetBand)}
        onChange={(e) => update({ targetBand: parseFloat(e.target.value) })}
        options={BAND_OPTIONS.map(b => ({ value: String(b), label: b.toFixed(1) }))}
        placeholder="Select target band"
        error={errors.targetBand}
      />

      <Input
        label="Exam date (optional)"
        type="date"
        value={data.examDate}
        onChange={(e) => update({ examDate: e.target.value })}
        helperText="Set this to get a countdown and priority plan"
      />

      {errors.targetBand && <p className="text-xs text-[var(--color-danger)]">{errors.targetBand}</p>}
      {errors.currentBand && <p className="text-xs text-[var(--color-danger)]">{errors.currentBand}</p>}

      <Button className="w-full" size="lg" onClick={onNext}>
        Continue
      </Button>
    </div>
  )
}

function StepStudyPreferences({ data, update, errors, onNext, onBack }: StepProps) {
  function toggleArrayItem(arr: string[], item: string): string[] {
    return arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
          <svg className="h-7 w-7 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h2 className="mt-4 text-xl font-bold text-[var(--color-text)]">Study Preferences</h2>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Tell us about your study habits so we can plan your daily tasks.
        </p>
      </div>

      <Input
        label="How much time can you study each day? (minutes)"
        type="number"
        min={5}
        max={480}
        value={String(data.dailyStudyMinutes)}
        onChange={(e) => update({ dailyStudyMinutes: Math.max(5, parseInt(e.target.value) || 30) })}
        error={errors.dailyStudyMinutes}
        helperText="Recommended: 30-120 minutes"
      />

      <div className="space-y-2">
        <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
          Which days can you study?
        </label>
        <div className="flex flex-wrap gap-2">
          {DAYS_OF_WEEK.map(day => (
            <button
              key={day.value}
              type="button"
              onClick={() => update({ preferredSchedule: toggleArrayItem(data.preferredSchedule, day.value) as OnboardingData['preferredSchedule'] })}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                data.preferredSchedule.includes(day.value as OnboardingData['preferredSchedule'][number])
                  ? 'bg-blue-600 text-white'
                  : 'bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] hover:brightness-95'
              }`}
            >
              {day.label.slice(0, 3)}
            </button>
          ))}
        </div>
        {errors.preferredSchedule && <p className="text-xs text-[var(--color-danger)]">{errors.preferredSchedule}</p>}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
          What are your weak skills? (select all that apply)
        </label>
        <div className="flex flex-wrap gap-2">
          {SKILL_OPTIONS.map(skill => (
            <button
              key={skill}
              type="button"
              onClick={() => update({ weakSkills: toggleArrayItem(data.weakSkills, skill) })}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                data.weakSkills.includes(skill)
                  ? 'bg-red-600 text-white'
                  : 'bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] hover:brightness-95'
              }`}
            >
              {skill}
            </button>
          ))}
        </div>
        <p className="text-xs text-[var(--color-muted)]">Don't worry, you can change these later</p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
          Preferred topics (optional)
        </label>
        <div className="flex flex-wrap gap-2">
          {TOPIC_OPTIONS.map(topic => (
            <button
              key={topic}
              type="button"
              onClick={() => update({ preferredTopics: toggleArrayItem(data.preferredTopics, topic) })}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                data.preferredTopics.includes(topic)
                  ? 'bg-purple-600 text-white'
                  : 'bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] hover:brightness-95'
              }`}
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        {onBack && (
          <Button variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
        )}
        <Button className="flex-1" size="lg" onClick={onNext}>
          Continue
        </Button>
      </div>
    </div>
  )
}

function StepSummary({ data, errors, onNext, onBack }: StepProps) {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)

  async function handleComplete() {
    setSaving(true)
    try {
      await completeOnboarding(data)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setSaving(false)
    }
  }

  const bandGap = data.targetBand - data.currentBand

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/40">
          <svg className="h-7 w-7 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="mt-4 text-xl font-bold text-[var(--color-text)]">Your Learning Profile</h2>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Here is your personalized IELTS learning plan summary.
        </p>
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--color-text-secondary)]">IELTS Type</span>
          <span className="text-sm font-semibold text-[var(--color-text)] capitalize">{data.studyGoal}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--color-text-secondary)]">Current Level</span>
          <span className="text-sm font-semibold text-[var(--color-text)]">{data.currentBand.toFixed(1)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--color-text-secondary)]">Target Band</span>
          <span className="text-sm font-semibold text-[var(--color-text)]">{data.targetBand.toFixed(1)}</span>
        </div>
        {data.examDate && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--color-text-secondary)]">Exam Date</span>
            <span className="text-sm font-semibold text-[var(--color-text)]">{data.examDate}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--color-text-secondary)]">Daily Study</span>
          <span className="text-sm font-semibold text-[var(--color-text)]">{data.dailyStudyMinutes} min</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--color-text-secondary)]">Study Days</span>
          <span className="text-sm font-semibold text-[var(--color-text)]">{data.preferredSchedule.length} days/week</span>
        </div>
      </div>

      {bandGap > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            You need to improve by <strong>{bandGap.toFixed(1)} bands</strong>. Your personalized roadmap will help you get there step by step.
          </p>
        </div>
      )}

      {data.weakSkills.length > 0 && (
        <div>
          <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">We will focus on:</p>
          <div className="flex flex-wrap gap-2">
            {data.weakSkills.map(skill => (
              <span key={skill} className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {errors.form && <p className="text-xs text-[var(--color-danger)]">{errors.form}</p>}

      <div className="flex gap-3">
        {onBack && (
          <Button variant="outline" onClick={onBack} className="flex-1" disabled={saving}>
            Back
          </Button>
        )}
        <Button className="flex-1" size="lg" onClick={handleComplete} loading={saving}>
          Start Learning
        </Button>
      </div>
    </div>
  )
}

export default function OnboardingForm() {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<OnboardingData>({
    currentBand: 5.5,
    targetBand: 7.0,
    examDate: '',
    dailyStudyMinutes: 60,
    weakSkills: [],
    preferredTopics: [],
    studyGoal: 'academic',
    preferredSchedule: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  function update(patch: Partial<OnboardingData>) {
    setData(prev => ({ ...prev, ...patch }))
    setErrors({})
  }

  function validateStep(stepIndex: number): boolean {
    const newErrors: Record<string, string> = {}

    if (stepIndex === 0) {
      if (data.targetBand < 1 || data.targetBand > 9) {
        newErrors.targetBand = 'Target band must be between 1 and 9'
      }
      if (data.currentBand < 1 || data.currentBand > 9) {
        newErrors.currentBand = 'Current level must be between 1 and 9'
      }
      if (data.targetBand <= data.currentBand) {
        newErrors.targetBand = 'Target band must be higher than current level'
      }
    }

    if (stepIndex === 1) {
      if (data.dailyStudyMinutes < 5) {
        newErrors.dailyStudyMinutes = 'Study time must be at least 5 minutes'
      }
      if (data.preferredSchedule.length === 0) {
        newErrors.preferredSchedule = 'Select at least one study day'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleNext() {
    if (validateStep(step)) {
      setStep(s => Math.min(s + 1, 2))
    }
  }

  function handleBack() {
    setStep(s => Math.max(s - 1, 0))
  }

  const steps = [
    <StepGoal key="goal" data={data} update={update} errors={errors} onNext={handleNext} />,
    <StepStudyPreferences key="prefs" data={data} update={update} errors={errors} onNext={handleNext} onBack={handleBack} />,
    <StepSummary key="summary" data={data} update={update} errors={errors} onNext={handleNext} onBack={handleBack} />,
  ]

  return (
    <div className="flex min-h-screen items-center justify-center p-4" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="w-full max-w-lg">
        <div className="mb-8 flex items-center justify-center gap-2">
          <span className="text-lg font-bold text-[var(--color-text)]">IELTS Journey</span>
        </div>

        <div className="mb-6 flex items-center justify-center gap-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  i <= step
                    ? 'bg-blue-600 text-white'
                    : 'bg-[var(--color-surface-alt)] text-[var(--color-muted)]'
                }`}
              >
                {i + 1}
              </div>
              {i < 2 && (
                <div
                  className={`h-0.5 w-8 transition-colors ${
                    i < step ? 'bg-blue-600' : 'bg-[var(--color-border)]'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8 shadow-sm">
          {steps[step]}
        </div>

        <p className="mt-4 text-center text-xs text-[var(--color-muted)]">
          Step {step + 1} of 3
        </p>
      </div>
    </div>
  )
}
