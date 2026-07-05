import { useState, useCallback, useEffect } from 'react'
import { useConfiguration } from '../configSlice'
import type { ConfigurationBasic, AiResponseLanguage, AiTutorMode } from '../models'
import Input from '../../../components/ui/Input'
import Select from '../../../components/ui/Select'
import Button from '../../../components/ui/Button'

const BAND_OPTIONS = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9]

const RESPONSE_LANGUAGE_OPTIONS: { value: AiResponseLanguage; label: string }[] = [
  { value: 'english', label: 'English' },
  { value: 'vietnamese', label: 'Vietnamese' },
  { value: 'both', label: 'Both' },
]

const TUTOR_MODE_OPTIONS: { value: AiTutorMode; label: string; description: string }[] = [
  { value: 'friendly-tutor', label: 'Friendly Tutor', description: 'Supportive and encouraging' },
  { value: 'strict-examiner', label: 'Strict IELTS Examiner', description: 'Official exam standards' },
  { value: 'simple-english-teacher', label: 'Simple English Teacher', description: 'Uses simple English explanations' },
  { value: 'vietnamese-explanation-tutor', label: 'Vietnamese Explanation Tutor', description: 'Explains in Vietnamese' },
  { value: 'motivation-coach', label: 'Motivation Coach', description: 'Keeps you motivated' },
  { value: 'grammar-focused-tutor', label: 'Grammar-Focused Tutor', description: 'Focuses on grammar accuracy' },
  { value: 'vocabulary-focused-tutor', label: 'Vocabulary-Focused Tutor', description: 'Expands your vocabulary' },
  { value: 'writing-correction-tutor', label: 'Writing Correction Tutor', description: 'Corrects writing in detail' },
  { value: 'speaking-practice-tutor', label: 'Speaking Practice Tutor', description: 'Practices speaking with you' },
]

interface FormErrors {
  targetBand?: string
  examDate?: string
  dailyStudyMinutes?: string
}

export default function BasicSettingsForm() {
  const { config, actions } = useConfiguration()
  const [form, setForm] = useState<ConfigurationBasic>({ ...config.basic })
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    setForm(config.basic)
  }, [config.basic])

  const validate = useCallback((values: ConfigurationBasic): FormErrors => {
    const errs: FormErrors = {}
    if (values.targetBand < 1 || values.targetBand > 9) {
      errs.targetBand = 'Target band must be between 1.0 and 9.0'
    }
    if (values.dailyStudyMinutes < 1 || values.dailyStudyMinutes > 1440) {
      errs.dailyStudyMinutes = 'Study time must be between 1 and 1440 minutes'
    }
    if (values.examDate && isNaN(Date.parse(values.examDate))) {
      errs.examDate = 'Please enter a valid date'
    }
    return errs
  }, [])

  const updateField = useCallback(
    <K extends keyof ConfigurationBasic>(field: K, value: ConfigurationBasic[K]) => {
      const next = { ...form, [field]: value }
      setForm(next)
      const errs = validate(next)
      setErrors(errs)
      if (!errs[field as keyof FormErrors]) {
        actions.updateBasicField(field, value)
      }
    },
    [form, actions, validate],
  )

  const tutorModeLabel = TUTOR_MODE_OPTIONS.find(o => o.value === form.tutorMode)

  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <Select
          label="Target IELTS Band"
          value={String(form.targetBand)}
          onChange={e => updateField('targetBand', parseFloat(e.target.value))}
          error={errors.targetBand}
          options={BAND_OPTIONS.map(b => ({ value: String(b), label: b.toFixed(1) }))}
        />

        <Input
          label="Exam Date"
          type="date"
          value={form.examDate}
          onChange={e => updateField('examDate', e.target.value)}
          error={errors.examDate}
          helperText="Leave empty if not yet scheduled"
        />
      </div>

      <Select
        label="AI Response Language"
        value={form.responseLanguage}
        onChange={e => updateField('responseLanguage', e.target.value as AiResponseLanguage)}
        options={RESPONSE_LANGUAGE_OPTIONS}
      />

      <div>
        <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          AI Tutor Personality
        </label>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TUTOR_MODE_OPTIONS.map(mode => (
            <button
              key={mode.value}
              type="button"
              onClick={() => updateField('tutorMode', mode.value)}
              className={`rounded-xl border-2 p-3 text-left transition-all ${
                form.tutorMode === mode.value
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                  : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50'
              }`}
            >
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                {mode.label}
              </p>
              <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                {mode.description}
              </p>
            </button>
          ))}
        </div>
        {tutorModeLabel && (
          <p className="mt-2 text-xs" style={{ color: 'var(--color-muted)' }}>
            Current: {tutorModeLabel.label} — {tutorModeLabel.description}
          </p>
        )}
      </div>

      <Input
        label="Daily Study Time (minutes)"
        type="number"
        min={1}
        max={1440}
        value={form.dailyStudyMinutes}
        onChange={e =>
          updateField('dailyStudyMinutes', Math.max(1, parseInt(e.target.value) || 1))
        }
        error={errors.dailyStudyMinutes}
        helperText="Recommended: 30–120 minutes"
      />

      <div className="flex justify-end gap-3 pt-2">
        <Button
          variant="ghost"
          onClick={() => {
            setForm(config.basic)
            setErrors({})
          }}
        >
          Discard Changes
        </Button>
        <Button
          onClick={() => {
            const errs = validate(form)
            setErrors(errs)
            if (Object.keys(errs).length === 0) {
              actions.updateBasic(form)
            }
          }}
        >
          Save Settings
        </Button>
      </div>
    </div>
  )
}
