import { useState, useCallback, useEffect, useMemo } from 'react'
import { useConfiguration } from '../configSlice'
import { AI_PROVIDER_DEFINITIONS, getVisibleProviders } from '@ielts/config'
import type { AiProviderId } from '@ielts/config'
import type {
  AiProviderConfig,
  AiTutorConfig,
  ExplanationStyle,
  CorrectionStrictness,
  ExerciseDifficulty,
  FeedbackDepth,
  AutomationLevel,
  StudyReminderFrequency,
  PrivacyLevel,
  VocabReviewSettings,
  SpeakingFeedbackSettings,
  WritingCorrectionSettings,
  PrivacySettings,
} from '../models'
import Input from '../../../components/ui/Input'
import Textarea from '../../../components/ui/Textarea'
import Select from '../../../components/ui/Select'
import ToggleSwitch from '../../../components/ui/ToggleSwitch'
import Button from '../../../components/ui/Button'

const EXPLANATION_STYLE_OPTIONS: { value: ExplanationStyle; label: string }[] = [
  { value: 'simple', label: 'Simple' },
  { value: 'detailed', label: 'Detailed' },
  { value: 'example-based', label: 'Example-Based' },
  { value: 'socratic', label: 'Socratic (Question-Based)' },
  { value: 'step-by-step', label: 'Step-by-Step' },
]

const CORRECTION_STRICTNESS_OPTIONS: { value: CorrectionStrictness; label: string }[] = [
  { value: 'gentle', label: 'Gentle' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'strict', label: 'Strict' },
]

const EXERCISE_DIFFICULTY_OPTIONS: { value: ExerciseDifficulty; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
  { value: 'adaptive', label: 'Adaptive (AI-Adjusted)' },
]

const FEEDBACK_DEPTH_OPTIONS: { value: FeedbackDepth; label: string }[] = [
  { value: 'minimal', label: 'Minimal' },
  { value: 'standard', label: 'Standard' },
  { value: 'thorough', label: 'Thorough' },
]

const AUTOMATION_LEVEL_OPTIONS: { value: AutomationLevel; label: string }[] = [
  { value: 'manual', label: 'Manual' },
  { value: 'semi-automatic', label: 'Semi-Automatic' },
  { value: 'automatic', label: 'Automatic' },
]

const REMINDER_FREQUENCY_OPTIONS: { value: StudyReminderFrequency; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekdays', label: 'Weekdays Only' },
  { value: 'custom', label: 'Custom' },
]

const PRIVACY_LEVEL_OPTIONS: { value: PrivacyLevel; label: string }[] = [
  { value: 'local-only', label: 'Local Only' },
  { value: 'local-with-analytics', label: 'Local with Anonymous Analytics' },
]

function createDefaultProvider(type: AiProviderId = 'openai'): AiProviderConfig {
  const def = AI_PROVIDER_DEFINITIONS[type]
  return {
    providerId: `provider-${type}-${Date.now()}`,
    provider: type,
    apiKey: '',
    baseUrl: def.defaultApiUrl ?? '',
    model: def.defaultModel ?? '',
    temperature: 0.7,
    maxTokens: 2048,
    systemPrompt: '',
    costLimit: 10,
    usageLimit: 1000,
    fallbackProvider: null,
  }
}

interface FormErrors {
  apiKey?: string
  baseUrl?: string
  model?: string
  temperature?: string
  maxTokens?: string
  costLimit?: string
  usageLimit?: string
  reviewsPerDay?: string
}

export default function AdvancedSettingsForm() {
  const { config, actions } = useConfiguration()
  const [activeProviderId, setActiveProviderId] = useState(config.advanced.activeProviderId)
  const [providerForm, setProviderForm] = useState<AiProviderConfig>(
    () => config.advanced.providers[config.advanced.activeProviderId] ?? createDefaultProvider(),
  )
  const [tutorConfig, setTutorConfig] = useState<AiTutorConfig>({ ...config.advanced.tutorConfig })
  const [vocabReview, setVocabReview] = useState<VocabReviewSettings>({ ...config.advanced.vocabReview })
  const [speakingFeedback, setSpeakingFeedback] = useState<SpeakingFeedbackSettings>({
    ...config.advanced.speakingFeedback,
  })
  const [writingCorrection, setWritingCorrection] = useState<WritingCorrectionSettings>({
    ...config.advanced.writingCorrection,
  })
  const [privacy, setPrivacy] = useState<PrivacySettings>({ ...config.advanced.privacy })
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    setActiveProviderId(config.advanced.activeProviderId)
    setProviderForm(
      config.advanced.providers[config.advanced.activeProviderId] ?? createDefaultProvider(),
    )
    setTutorConfig({ ...config.advanced.tutorConfig })
    setVocabReview({ ...config.advanced.vocabReview })
    setSpeakingFeedback({ ...config.advanced.speakingFeedback })
    setWritingCorrection({ ...config.advanced.writingCorrection })
    setPrivacy({ ...config.advanced.privacy })
  }, [config.advanced])

  const validate = useCallback((): FormErrors => {
    const errs: FormErrors = {}
    if (providerForm.provider !== 'local') {
      if (!providerForm.apiKey.trim()) {
        errs.apiKey = 'API key is required for this provider'
      }
    }
    if (providerForm.provider === 'custom' || providerForm.provider === 'local') {
      if (!providerForm.baseUrl.trim()) {
        errs.baseUrl = 'Base URL is required'
      }
    }
    if (!providerForm.model.trim()) {
      errs.model = 'Model name is required'
    }
    if (providerForm.temperature < 0 || providerForm.temperature > 2) {
      errs.temperature = 'Temperature must be between 0 and 2'
    }
    if (providerForm.maxTokens < 1 || providerForm.maxTokens > 1000000) {
      errs.maxTokens = 'Max tokens must be between 1 and 1,000,000'
    }
    if (providerForm.costLimit < 0) {
      errs.costLimit = 'Cost limit must be 0 or greater'
    }
    if (providerForm.usageLimit < 1) {
      errs.usageLimit = 'Usage limit must be 1 or greater'
    }
    if (vocabReview.reviewsPerDay < 1 || vocabReview.reviewsPerDay > 500) {
      errs.reviewsPerDay = 'Reviews per day must be between 1 and 500'
    }
    return errs
  }, [providerForm, vocabReview.reviewsPerDay])

  const updateProviderField = useCallback(
    <K extends keyof AiProviderConfig>(field: K, value: AiProviderConfig[K]) => {
      setProviderForm(prev => ({ ...prev, [field]: value }))
    },
    [],
  )

  const updateTutorField = useCallback(
    <K extends keyof AiTutorConfig>(field: K, value: AiTutorConfig[K]) => {
      setTutorConfig(prev => ({ ...prev, [field]: value }))
    },
    [],
  )

  const providerIds = useMemo(
    () => Object.keys(config.advanced.providers),
    [config.advanced.providers],
  )

  const handleSwitchProvider = useCallback(
    (id: string) => {
      const provider = config.advanced.providers[id]
      if (provider) {
        setActiveProviderId(id)
        setProviderForm({ ...provider })
      }
    },
    [config.advanced.providers],
  )

  const handleAddProvider = useCallback(() => {
    const newProvider = createDefaultProvider()
    actions.addProvider(newProvider)
    setActiveProviderId(newProvider.providerId)
    setProviderForm({ ...newProvider })
  }, [actions])

  const handleRemoveProvider = useCallback(() => {
    if (providerIds.length <= 1) return
    actions.removeProvider(activeProviderId)
    const nextId = providerIds.find(id => id !== activeProviderId)
    if (nextId) {
      setActiveProviderId(nextId)
      setProviderForm({ ...config.advanced.providers[nextId] })
    }
  }, [providerIds, activeProviderId, actions, config.advanced.providers])

  const handleSave = useCallback(() => {
    const errs = validate()
    if (Object.keys(errs).length > 0) return

    actions.updateProvider(providerForm.providerId, providerForm)
    actions.setActiveProvider(activeProviderId)
    actions.updateTutorConfig(tutorConfig)
    actions.updateAdvancedField('vocabReview', vocabReview)
    actions.updateAdvancedField('speakingFeedback', speakingFeedback)
    actions.updateAdvancedField('writingCorrection', writingCorrection)
    actions.updateAdvancedField('privacy', privacy)
  }, [
    providerForm,
    activeProviderId,
    tutorConfig,
    vocabReview,
    speakingFeedback,
    writingCorrection,
    privacy,
    actions,
    validate,
  ])

  const handleDiscard = useCallback(() => {
    setActiveProviderId(config.advanced.activeProviderId)
    setProviderForm(
      config.advanced.providers[config.advanced.activeProviderId] ?? createDefaultProvider(),
    )
    setTutorConfig({ ...config.advanced.tutorConfig })
    setVocabReview({ ...config.advanced.vocabReview })
    setSpeakingFeedback({ ...config.advanced.speakingFeedback })
    setWritingCorrection({ ...config.advanced.writingCorrection })
    setPrivacy({ ...config.advanced.privacy })
    setErrors({})
  }, [config.advanced])

  const fallbackOptions = useMemo(
    () =>
      providerIds
        .filter(id => id !== activeProviderId)
        .map(id => ({
          value: id,
          label: config.advanced.providers[id]?.provider ?? id,
        })),
    [providerIds, activeProviderId, config.advanced.providers],
  )

  const availableProviders = useMemo(() => getVisibleProviders(), [])

  const providerSelectOptions = useMemo(
    () =>
      providerIds.map(id => ({
        value: id,
        label: config.advanced.providers[id]?.provider ?? id,
      })),
    [providerIds, config.advanced.providers],
  )

  return (
    <div className="space-y-8">
      {/* ---------- AI Provider ---------- */}
      <section>
        <h3
          className="mb-4 text-lg font-semibold"
          style={{ color: 'var(--color-text)' }}
        >
          AI Provider
        </h3>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="w-full sm:min-w-[200px] sm:flex-1">
            <Select
              label="Active Provider"
              value={activeProviderId}
              onChange={e => handleSwitchProvider(e.target.value)}
              options={providerSelectOptions}
            />
          </div>
          <Button variant="outline" size="sm" onClick={handleAddProvider} className="w-full sm:w-auto">
            + Add Provider
          </Button>
          {providerIds.length > 1 && (
            <Button variant="danger" size="sm" onClick={handleRemoveProvider} className="w-full sm:w-auto">
              Remove
            </Button>
          )}
        </div>

        <div
          className="space-y-4 rounded-lg border p-4"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Provider Type"
              value={providerForm.provider}
              onChange={e =>
                updateProviderField('provider', e.target.value as AiProviderId)
              }
              options={availableProviders.map(p => ({
                value: p.id,
                label: p.displayName,
              }))}
            />
            <Input
              label="Model"
              value={providerForm.model}
              onChange={e => updateProviderField('model', e.target.value)}
              error={errors.model}
              placeholder="e.g. gpt-4o-mini"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="API Key"
              type="password"
              value={providerForm.apiKey}
              onChange={e => updateProviderField('apiKey', e.target.value)}
              error={errors.apiKey}
              helperText="Stored locally in your browser"
            />
            <Input
              label="Base URL"
              value={providerForm.baseUrl}
              onChange={e => updateProviderField('baseUrl', e.target.value)}
              error={errors.baseUrl}
              placeholder="https://api.openai.com/v1"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Temperature"
              type="number"
              min={0}
              max={2}
              step={0.1}
              value={providerForm.temperature}
              onChange={e =>
                updateProviderField('temperature', parseFloat(e.target.value) || 0.7)
              }
              error={errors.temperature}
              helperText="0 = precise, 2 = creative"
            />
            <Input
              label="Max Tokens"
              type="number"
              min={1}
              max={1000000}
              value={providerForm.maxTokens}
              onChange={e =>
                updateProviderField('maxTokens', parseInt(e.target.value) || 2048)
              }
              error={errors.maxTokens}
            />
            <Input
              label="Cost Limit ($)"
              type="number"
              min={0}
              step={0.5}
              value={providerForm.costLimit}
              onChange={e =>
                updateProviderField('costLimit', parseFloat(e.target.value) || 0)
              }
              error={errors.costLimit}
              helperText="Monthly spending cap"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Usage Limit (requests)"
              type="number"
              min={1}
              value={providerForm.usageLimit}
              onChange={e =>
                updateProviderField('usageLimit', parseInt(e.target.value) || 1000)
              }
              error={errors.usageLimit}
              helperText="Max requests per month"
            />
            <Select
              label="Fallback Provider"
              value={providerForm.fallbackProvider ?? ''}
              onChange={e =>
                updateProviderField('fallbackProvider', e.target.value || null)
              }
              options={fallbackOptions}
              placeholder="No fallback"
            />
          </div>

          <Textarea
            label="System Prompt (Optional)"
            value={providerForm.systemPrompt}
            onChange={e => updateProviderField('systemPrompt', e.target.value)}
            rows={3}
            placeholder="Override the default system prompt for this provider..."
          />
        </div>
      </section>

      {/* ---------- AI Tutor Behavior ---------- */}
      <section>
        <h3
          className="mb-4 text-lg font-semibold"
          style={{ color: 'var(--color-text)' }}
        >
          AI Tutor Behavior
        </h3>

        <div
          className="space-y-4 rounded-lg border p-4"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Explanation Style"
              value={tutorConfig.explanationStyle}
              onChange={e =>
                updateTutorField(
                  'explanationStyle',
                  e.target.value as ExplanationStyle,
                )
              }
              options={EXPLANATION_STYLE_OPTIONS}
            />
            <Select
              label="Correction Strictness"
              value={tutorConfig.correctionStrictness}
              onChange={e =>
                updateTutorField(
                  'correctionStrictness',
                  e.target.value as CorrectionStrictness,
                )
              }
              options={CORRECTION_STRICTNESS_OPTIONS}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Exercise Difficulty"
              value={tutorConfig.exerciseDifficulty}
              onChange={e =>
                updateTutorField(
                  'exerciseDifficulty',
                  e.target.value as ExerciseDifficulty,
                )
              }
              options={EXERCISE_DIFFICULTY_OPTIONS}
            />
            <Select
              label="Feedback Depth"
              value={tutorConfig.feedbackDepth}
              onChange={e =>
                updateTutorField('feedbackDepth', e.target.value as FeedbackDepth)
              }
              options={FEEDBACK_DEPTH_OPTIONS}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Automation Level"
              value={tutorConfig.automationLevel}
              onChange={e =>
                updateTutorField(
                  'automationLevel',
                  e.target.value as AutomationLevel,
                )
              }
              options={AUTOMATION_LEVEL_OPTIONS}
            />
            <Select
              label="Study Reminder Frequency"
              value={tutorConfig.studyReminderFrequency}
              onChange={e =>
                updateTutorField(
                  'studyReminderFrequency',
                  e.target.value as StudyReminderFrequency,
                )
              }
              options={REMINDER_FREQUENCY_OPTIONS}
            />
          </div>

          <Textarea
            label="Custom System Prompt (Optional)"
            value={tutorConfig.customSystemPrompt}
            onChange={e => updateTutorField('customSystemPrompt', e.target.value)}
            rows={3}
            placeholder="Extra instructions for the AI tutor..."
          />
        </div>
      </section>

      {/* ---------- Vocabulary Review ---------- */}
      <section>
        <h3
          className="mb-4 text-lg font-semibold"
          style={{ color: 'var(--color-text)' }}
        >
          Vocabulary Review
        </h3>

        <div
          className="space-y-4 rounded-lg border p-4"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <Input
            label="Reviews Per Day"
            type="number"
            min={1}
            max={500}
            value={vocabReview.reviewsPerDay}
            onChange={e =>
              setVocabReview(prev => ({
                ...prev,
                reviewsPerDay: parseInt(e.target.value) || 1,
              }))
            }
            error={errors.reviewsPerDay}
            helperText="Recommended: 10–50"
          />
          <ToggleSwitch
            label="Spaced Repetition"
            description="Optimize review timing for long-term memory"
            enabled={vocabReview.enableSpacedRepetition}
            onChange={v =>
              setVocabReview(prev => ({ ...prev, enableSpacedRepetition: v }))
            }
          />
          <ToggleSwitch
            label="Context Sentences"
            description="Show words in context sentences"
            enabled={vocabReview.enableContextSentences}
            onChange={v =>
              setVocabReview(prev => ({ ...prev, enableContextSentences: v }))
            }
          />
          <ToggleSwitch
            label="Example Sentences"
            description="Show example sentences for each word"
            enabled={vocabReview.enableExampleSentences}
            onChange={v =>
              setVocabReview(prev => ({ ...prev, enableExampleSentences: v }))
            }
          />
          <ToggleSwitch
            label="Synonyms"
            description="Show synonyms for new vocabulary"
            enabled={vocabReview.enableSynonyms}
            onChange={v =>
              setVocabReview(prev => ({ ...prev, enableSynonyms: v }))
            }
          />
        </div>
      </section>

      {/* ---------- Speaking Feedback ---------- */}
      <section>
        <h3
          className="mb-4 text-lg font-semibold"
          style={{ color: 'var(--color-text)' }}
        >
          Speaking Feedback
        </h3>

        <div
          className="space-y-4 rounded-lg border p-4"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <ToggleSwitch
            label="Pronunciation Feedback"
            description="Get feedback on pronunciation accuracy"
            enabled={speakingFeedback.enablePronunciationFeedback}
            onChange={v =>
              setSpeakingFeedback(prev => ({
                ...prev,
                enablePronunciationFeedback: v,
              }))
            }
          />
          <ToggleSwitch
            label="Fluency Feedback"
            description="Get feedback on speaking fluency"
            enabled={speakingFeedback.enableFluencyFeedback}
            onChange={v =>
              setSpeakingFeedback(prev => ({ ...prev, enableFluencyFeedback: v }))
            }
          />
          <ToggleSwitch
            label="Vocabulary Feedback"
            description="Get feedback on vocabulary usage"
            enabled={speakingFeedback.enableVocabularyFeedback}
            onChange={v =>
              setSpeakingFeedback(prev => ({
                ...prev,
                enableVocabularyFeedback: v,
              }))
            }
          />
          <ToggleSwitch
            label="Grammar Feedback"
            description="Get feedback on grammatical accuracy"
            enabled={speakingFeedback.enableGrammarFeedback}
            onChange={v =>
              setSpeakingFeedback(prev => ({ ...prev, enableGrammarFeedback: v }))
            }
          />
        </div>
      </section>

      {/* ---------- Writing Correction ---------- */}
      <section>
        <h3
          className="mb-4 text-lg font-semibold"
          style={{ color: 'var(--color-text)' }}
        >
          Writing Correction
        </h3>

        <div
          className="space-y-4 rounded-lg border p-4"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <ToggleSwitch
            label="Grammar Correction"
            description="Correct grammatical errors in writing"
            enabled={writingCorrection.enableGrammarCorrection}
            onChange={v =>
              setWritingCorrection(prev => ({
                ...prev,
                enableGrammarCorrection: v,
              }))
            }
          />
          <ToggleSwitch
            label="Vocabulary Suggestions"
            description="Suggest better word choices"
            enabled={writingCorrection.enableVocabularySuggestion}
            onChange={v =>
              setWritingCorrection(prev => ({
                ...prev,
                enableVocabularySuggestion: v,
              }))
            }
          />
          <ToggleSwitch
            label="Structure Feedback"
            description="Provide feedback on essay structure"
            enabled={writingCorrection.enableStructureFeedback}
            onChange={v =>
              setWritingCorrection(prev => ({
                ...prev,
                enableStructureFeedback: v,
              }))
            }
          />
          <ToggleSwitch
            label="Coherence Feedback"
            description="Evaluate paragraph and idea coherence"
            enabled={writingCorrection.enableCoherenceFeedback}
            onChange={v =>
              setWritingCorrection(prev => ({
                ...prev,
                enableCoherenceFeedback: v,
              }))
            }
          />
          <ToggleSwitch
            label="Show Improved Version"
            description="Display a rewritten improved version"
            enabled={writingCorrection.showImprovedVersion}
            onChange={v =>
              setWritingCorrection(prev => ({
                ...prev,
                showImprovedVersion: v,
              }))
            }
          />
        </div>
      </section>

      {/* ---------- Privacy & Data Usage ---------- */}
      <section>
        <h3
          className="mb-4 text-lg font-semibold"
          style={{ color: 'var(--color-text)' }}
        >
          Privacy & Data Usage
        </h3>

        <div
          className="space-y-4 rounded-lg border p-4"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <Select
            label="Privacy Level"
            value={privacy.privacyLevel}
            onChange={e =>
              setPrivacy(prev => ({
                ...prev,
                privacyLevel: e.target.value as PrivacyLevel,
              }))
            }
            options={PRIVACY_LEVEL_OPTIONS}
          />
          <ToggleSwitch
            label="Anonymous Analytics"
            description="Share anonymous usage data to improve the app"
            enabled={privacy.allowAnonymousAnalytics}
            onChange={v =>
              setPrivacy(prev => ({ ...prev, allowAnonymousAnalytics: v }))
            }
          />
          <ToggleSwitch
            label="Crash Reporting"
            description="Automatically send crash reports"
            enabled={privacy.allowCrashReporting}
            onChange={v =>
              setPrivacy(prev => ({ ...prev, allowCrashReporting: v }))
            }
          />
          <ToggleSwitch
            label="Store Conversation History"
            description="Keep a record of AI tutor conversations"
            enabled={privacy.storeConversationHistory}
            onChange={v =>
              setPrivacy(prev => ({ ...prev, storeConversationHistory: v }))
            }
          />
          <ToggleSwitch
            label="Store Usage Statistics"
            description="Track study time and progress locally"
            enabled={privacy.storeUsageStatistics}
            onChange={v =>
              setPrivacy(prev => ({ ...prev, storeUsageStatistics: v }))
            }
          />
        </div>
      </section>

      {/* ---------- Actions ---------- */}
      <div
        className="flex flex-col gap-3 border-t pt-6 sm:flex-row sm:justify-end"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <Button variant="ghost" onClick={handleDiscard} className="w-full sm:w-auto">
          Discard Changes
        </Button>
        <Button onClick={handleSave} className="w-full sm:w-auto">Save Settings</Button>
      </div>
    </div>
  )
}
