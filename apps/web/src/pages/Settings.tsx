import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'
import { useTheme } from '../context/ThemeContext'
import { DatabaseService } from '../services/storage/Database'
import { emitSettingsChanged } from '../features/websiteActions/eventEmitters'
import {
  loadNotificationPrefs,
  saveNotificationPrefs,
  type NotificationPrefs,
} from '../services/storage/notificationPrefs'
import { testConnection } from '../services/ai/testConnection'
import { OPENAI_BASE_URL, DEFAULT_MODEL } from '@ielts/settings'
import { ACCENT_COLOR_PRESETS, type ThemeMode } from '@ielts/theme'
import { ROUTES, STORAGE_KEYS, AI_PROVIDER_DEFINITIONS } from '@ielts/config'
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import ToggleSwitch from '../components/ui/ToggleSwitch'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton'
import { ErrorState } from '../components/ui/EmptyState'
import PageHeader from '../components/layout/PageHeader'
import PageContent from '../components/layout/PageContent'
import ProactiveTutorSettings from '../features/settings/ProactiveTutorSettings'
import {
  IconTarget,
  IconAITutor,
  IconStudyPlan,
  IconPalette,
  IconBell,
  IconSliders,
  IconDatabase,
  IconCheck,
  IconSettings,
  IconAlertCircle,
  IconClose,
  IconDelete,
  IconDownload,
  IconUpload,
  IconExtension,
  IconChevronDown,
} from '@ielts/ui'

const IELTS_TOPICS = [
  'Education', 'Technology', 'Environment', 'Health',
  'Work', 'Business', 'Travel', 'Culture', 'Society',
  'Crime', 'Government', 'Media', 'Globalization',
  'Family', 'Housing', 'Transport', 'Art', 'Sports', 'Science',
]

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

const BAND_OPTIONS = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9]

const NATIVE_LANGUAGE_OPTIONS = [
  { value: '', label: 'Not specified' },
  { value: 'Arabic', label: 'Arabic' },
  { value: 'Bengali', label: 'Bengali' },
  { value: 'Chinese', label: 'Chinese' },
  { value: 'English', label: 'English' },
  { value: 'French', label: 'French' },
  { value: 'German', label: 'German' },
  { value: 'Hindi', label: 'Hindi' },
  { value: 'Indonesian', label: 'Indonesian' },
  { value: 'Italian', label: 'Italian' },
  { value: 'Japanese', label: 'Japanese' },
  { value: 'Korean', label: 'Korean' },
  { value: 'Malay', label: 'Malay' },
  { value: 'Portuguese', label: 'Portuguese' },
  { value: 'Russian', label: 'Russian' },
  { value: 'Spanish', label: 'Spanish' },
  { value: 'Tamil', label: 'Tamil' },
  { value: 'Thai', label: 'Thai' },
  { value: 'Turkish', label: 'Turkish' },
  { value: 'Urdu', label: 'Urdu' },
  { value: 'Vietnamese', label: 'Vietnamese' },
]

interface FormErrors {
  targetBand?: string
  currentBand?: string
  nativeLanguage?: string
  dailyStudyMinutes?: string
  studyReminder?: string
}

interface SettingsSection {
  id: string
  label: string
  icon: React.ReactNode
  description: string
}

function getSectionIcon(id: string): React.ReactNode {
  const size = 18
  switch (id) {
    case 'goal': return <IconTarget size={size} />
    case 'ai-tutor': return <IconAITutor size={size} />
    case 'study-plan': return <IconStudyPlan size={size} />
    case 'appearance': return <IconPalette size={size} />
    case 'notifications': return <IconBell size={size} />
    case 'advanced': return <IconSliders size={size} />
    case 'proactive-tutor': return <IconBell size={size} />
    case 'data': return <IconDatabase size={size} />
    default: return null
  }
}

const SETTINGS_SECTIONS: SettingsSection[] = [
  { id: 'goal', label: 'Goal', icon: getSectionIcon('goal')!, description: 'Target band, exam date & study goals' },
  { id: 'ai-tutor', label: 'AI Tutor', icon: getSectionIcon('ai-tutor')!, description: 'AI provider, API key & model' },
  { id: 'study-plan', label: 'Study Plan', icon: getSectionIcon('study-plan')!, description: 'Weak skills, topics & schedule' },
  { id: 'appearance', label: 'Appearance', icon: getSectionIcon('appearance')!, description: 'Theme mode & accent color' },
  { id: 'proactive-tutor', label: 'AI Tutor Proactive', icon: getSectionIcon('proactive-tutor')!, description: 'Proactive tutor messages & reminders' },
  { id: 'notifications', label: 'Notifications', icon: getSectionIcon('notifications')!, description: 'Study reminders & alerts' },
  { id: 'advanced', label: 'Advanced', icon: getSectionIcon('advanced')!, description: 'Deep config & CORS proxy' },
  { id: 'data', label: 'Data', icon: getSectionIcon('data')!, description: 'Export, import & manage data' },
]

function SectionIcon({ icon }: { icon: React.ReactNode }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 'var(--spacing-lg)',
        height: 'var(--spacing-lg)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-primary)',
      }}
    >
      {icon}
    </span>
  )
}

export default function Settings() {
  const navigate = useNavigate()
  const { settings, updateSettings } = useSettings()
  const { mode: themeMode, accentColor, setMode: setThemeMode, setAccentColor } = useTheme()

  const [activeSection, setActiveSection] = useState('goal')
  const initialForm = {
    ...settings,
    targetBand: settings.study?.targetBand,
    currentBand: settings.study?.currentBand,
    examDate: settings.study?.examDate,
    dailyStudyMinutes: settings.study?.dailyStudyMinutes,
    weakSkills: settings.study?.weakSkills ?? [],
    studyGoal: settings.study?.studyGoal,
    preferredSchedule: settings.study?.preferredSchedule,
    nativeLanguage: settings.study?.nativeLanguage ?? '',
    preferredTopics: [],
    studyReminder: 'Time to study IELTS!',
  }
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [dirty, setDirty] = useState(false)
  const [notifications, setNotifications] = useState<NotificationPrefs>(loadNotificationPrefs)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const [aiTesting, setAiTesting] = useState(false)
  const [aiTestResult, setAiTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const defaultProvider = settings.ai?.providerId
  const [aiApiKeyInput, setAiApiKeyInput] = useState(() => {
    try { return localStorage.getItem(`${STORAGE_KEYS.localStorage.apiKeyPrefix}${defaultProvider}`) ?? '' } catch { return '' }
  })
  const [aiProviderInput, setAiProviderInput] = useState(settings.ai?.providerId ?? AI_PROVIDER_DEFINITIONS.openai.id)
  const [aiBaseUrlInput, setAiBaseUrlInput] = useState(settings.ai?.customApiUrl ?? AI_PROVIDER_DEFINITIONS.openai.defaultApiUrl ?? '')
  const [aiModelInput, setAiModelInput] = useState(settings.ai?.model ?? AI_PROVIDER_DEFINITIONS.openai.defaultModel ?? '')
  const [aiEnabledInput, setAiEnabledInput] = useState(true)

  const [confirmAction, setConfirmAction] = useState<{
    title: string
    message: string
    action: () => Promise<void> | void
    buttonLabel: string
    buttonVariant: 'danger' | 'primary'
  } | null>(null)

  const [showAdvancedNetwork, setShowAdvancedNetwork] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300)
    return () => clearTimeout(timer)
  }, [])



  useEffect(() => {
    saveNotificationPrefs(notifications)
  }, [notifications])

  const showFeedback = useCallback((type: 'success' | 'error', message: string) => {
    setFeedback({ type, message })
    setTimeout(() => setFeedback(null), 4000)
  }, [])

  const currentSectionData = useMemo(
    () => SETTINGS_SECTIONS.find(s => s.id === activeSection) ?? SETTINGS_SECTIONS[0],
    [activeSection],
  )

  function validate(): FormErrors {
    const errs: FormErrors = {}
    if (form.targetBand < 1 || form.targetBand > 9) {
      errs.targetBand = 'Target band must be between 1 and 9'
    }
    if (form.currentBand < 1 || form.currentBand > 9) {
      errs.currentBand = 'Current band must be between 1 and 9'
    }
    if (form.dailyStudyMinutes < 1 || form.dailyStudyMinutes > 1440) {
      errs.dailyStudyMinutes = 'Study time must be between 1 and 1440 minutes'
    }
    if (form.studyReminder.trim().length === 0) {
      errs.studyReminder = 'Reminder text is required'
    } else if (form.studyReminder.trim().length > 200) {
      errs.studyReminder = 'Reminder text must be 200 characters or less'
    }
    return errs
  }

  async function handleSave() {
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) {
      setActiveSection('goal')
      return
    }

    setSaving(true)
    try {
      updateSettings({
        ai: {
          providerId: aiProviderInput as any,
          model: aiModelInput,
          customApiUrl: aiBaseUrlInput || '',
        },
        study: {
          targetBand: form.targetBand,
          currentBand: form.currentBand,
          examDate: form.examDate || undefined,
          dailyStudyMinutes: form.dailyStudyMinutes,
          weakSkills: form.weakSkills ?? [],
          studyGoal: form.studyGoal,
          preferredSchedule: form.preferredSchedule ?? [],
          nativeLanguage: form.nativeLanguage,
        },
      })
      if (aiApiKeyInput) {
        try { localStorage.setItem(`${STORAGE_KEYS.localStorage.apiKeyPrefix}${aiProviderInput || 'openai'}`, aiApiKeyInput) } catch {}
      }
      if (notifications.enabled && 'Notification' in window) {
        Notification.requestPermission()
      }
      setDirty(false)
      const changedKeys = Object.entries(form).filter(([key, val]) => {
        const old = settings[key as keyof typeof settings]
        return old !== undefined && old !== val
      }).map(([key]) => key)
      emitSettingsChanged(changedKeys)
      showFeedback('success', 'Settings saved successfully.')
    } catch (error) {
      console.error('apps/web/src/pages/Settings.tsx error:', error);
      showFeedback('error', 'Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  function handleReset() {
    setConfirmAction({
      title: 'Reset Settings',
      message: 'Reset all settings to default values? This will not affect your learning data.',
      action: () => {
        const defaults = {
          targetBand: 7.0,
          currentBand: 5.5,
          examDate: '',
          nativeLanguage: '',
          dailyStudyMinutes: 60,
          weakSkills: [],
          preferredTopics: [],
          studyReminder: 'Time to study IELTS!',
          studyGoal: 'academic' as const,
          preferredSchedule: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const,
          aiApiKey: '',
          aiProvider: 'openai' as const,
          aiBaseUrl: '',
          aiEndpoint: '',
          aiModel: DEFAULT_AI_MODEL,
          aiEnabled: false,
          darkMode: false,
        }
        setForm(defaults)
        setAiApiKeyInput('')
        setAiProviderInput('openai')
        setAiBaseUrlInput('')
        setAiModelInput(DEFAULT_AI_MODEL)
        setAiEnabledInput(false)
        updateSettings(defaults)
        setThemeMode('system')
        setAccentColor('#2563eb')
        setNotifications({ enabled: false, reminderTime: '09:00' })
        setDirty(true)
        showFeedback('success', 'Settings reset to defaults.')
      },
      buttonLabel: 'Reset Settings',
      buttonVariant: 'danger',
    })
  }

  function toggleArrayItem(arr: string[], item: string): string[] {
    return arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]
  }

  async function handleExport() {
    try {
      const data = await DatabaseService.exportAll()
      const json = JSON.stringify(data, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const date = new Date().toISOString().slice(0, 10)
      const a = document.createElement('a')
      a.href = url
      a.download = `ielts-backup-${date}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showFeedback('success', 'Backup exported successfully.')
    } catch (err) {
      console.error('apps/web/src/pages/Settings.tsx error:', err);
      showFeedback('error', err instanceof Error ? err.message : 'Export failed')
    }
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const raw = JSON.parse(evt.target?.result as string)
        if (!raw || typeof raw.version !== 'number') {
          showFeedback('error', 'Invalid backup file format.')
          return
        }
        setConfirmAction({
          title: 'Import Backup',
          message: `Import backup created on ${new Date(raw.exportedAt).toLocaleString()}? This will overwrite ALL current data.`,
          action: async () => {
            try {
              await DatabaseService.importAll(raw as AppExportData)
              showFeedback('success', 'Data imported successfully.')
            } catch (err) {
              console.error('apps/web/src/pages/Settings.tsx error:', err);
              showFeedback('error', err instanceof Error ? err.message : 'Import failed.')
            }
          },
          buttonLabel: 'Import & Overwrite',
          buttonVariant: 'danger',
        })
      } catch (error) {
        console.error('apps/web/src/pages/Settings.tsx error:', error);
        showFeedback('error', 'Could not parse file.')
      }
    }
    reader.onerror = () => showFeedback('error', 'Failed to read file')
    reader.readAsText(file)
    e.target.value = ''
  }

  function handleClearAll() {
    setConfirmAction({
      title: 'Clear All Data',
      message: 'Delete ALL your data including vocabulary, tasks, sessions, notes, mistakes, and mock tests. This action cannot be undone. Export a backup first.',
      action: async () => {
        await DatabaseService.resetAll()
        window.location.reload()
      },
      buttonLabel: 'Delete Everything',
      buttonVariant: 'danger',
    })
  }

  function handleRequestNotification() {
    if (!('Notification' in window)) {
      showFeedback('error', 'Notifications are not supported in this browser.')
      return
    }
    Notification.requestPermission().then(perm => {
      if (perm === 'granted') {
        showFeedback('success', 'Notifications enabled.')
      } else {
        showFeedback('error', 'Notification permission denied.')
      }
    })
  }

  async function handleTestConnection() {
    if (!aiApiKeyInput) {
      setAiTestResult({ ok: false, message: 'Enter an API key first.' })
      return
    }
    setAiTesting(true)
    setAiTestResult(null)
    try {
      const result = await testConnection({
        apiKey: aiApiKeyInput,
        baseUrl: aiBaseUrlInput || OPENAI_BASE_URL,
        model: aiModelInput || DEFAULT_MODEL,
      })
      setAiTestResult({ ok: result.ok, message: result.message })
    } catch (error) {
      console.error('apps/web/src/pages/Settings.tsx error:', error);
      setAiTestResult({ ok: false, message: 'Connection test failed. Check your settings.' })
    } finally {
      setAiTesting(false)
    }
  }

  function setSectionRef(id: string, el: HTMLDivElement | null) {
    sectionRefs.current[id] = el
  }

  function scrollToSection(id: string) {
    setActiveSection(id)
  }

  if (pageError) {
    return (
      <div style={{ maxWidth: '768px', margin: '0 auto' }}>
        <ErrorState
          title="Failed to load settings"
          message={pageError}
          onRetry={() => {
            setPageError(null)
            setLoading(true)
            setTimeout(() => setLoading(false), 500)
          }}
          variant="card"
        />
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <LoadingSkeleton variant="text" width="160px" height="28px" />
          <div style={{ marginTop: 'var(--spacing-xs)' }}>
            <LoadingSkeleton variant="text" width="280px" />
          </div>
        </div>
        <div
          className="max-lg:hidden grid"
          style={{
            gridTemplateColumns: '200px 1fr',
            gap: 'var(--spacing-lg)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
            <LoadingSkeleton variant="rect" count={7} height="40px" />
          </div>
          <LoadingSkeleton variant="card" height="400px" />
        </div>
        <div className="lg:hidden">
          <LoadingSkeleton variant="card" height="400px" />
        </div>
      </div>
    )
  }

  return (
    <PageContent className="space-y-6">
      <PageHeader
        icon={<IconSettings size={22} />}
        title="Settings"
        description="Configure your IELTS learning goals and preferences"
      />

      {feedback && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-xs)',
            padding: 'var(--spacing-sm) var(--spacing-md)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: 'var(--spacing-md)',
            fontSize: 'var(--text-sm)',
            border: '1px solid',
            backgroundColor: feedback.type === 'success' ? 'var(--color-success-light)' : 'var(--color-danger-light)',
            borderColor: feedback.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
            color: feedback.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
          }}
        >
          {feedback.type === 'success' ? <IconCheck size={16} /> : <IconAlertCircle size={16} />}
          {feedback.message}
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-start" style={{ gap: 'var(--spacing-lg)' }}>
        <aside
          className="max-lg:hidden flex flex-col sticky"
          style={{
            width: '220px',
            flexShrink: 0,
            gap: '2px',
            top: 'var(--spacing-md)',
          }}
        >
          {SETTINGS_SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => scrollToSection(section.id)}
              role="tab"
              aria-selected={activeSection === section.id}
              aria-controls={`section-${section.id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                padding: 'var(--spacing-sm) var(--spacing-md)',
                borderRadius: 'var(--radius-lg)',
                border: 'none',
                background: activeSection === section.id ? 'var(--color-primary-light)' : 'transparent',
                color: activeSection === section.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                cursor: 'pointer',
                fontSize: 'var(--text-sm)',
                fontWeight: activeSection === section.id ? 600 : 400,
                textAlign: 'left',
                transition: 'all var(--transition-fast)',
                width: '100%',
              }}
              onMouseEnter={(e) => {
                if (activeSection !== section.id) {
                  e.currentTarget.style.background = 'var(--color-surface-alt)'
                }
              }}
              onMouseLeave={(e) => {
                if (activeSection !== section.id) {
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              <SectionIcon icon={section.icon} />
              <div>
                <div style={{ fontWeight: activeSection === section.id ? 600 : 500 }}>{section.label}</div>
                <div style={{ fontSize: '11px', color: 'var(--color-muted)', marginTop: '1px' }}>{section.description}</div>
              </div>
            </button>
          ))}
        </aside>

        <div className="lg:hidden" style={{ marginBottom: 'var(--spacing-md)', width: '100%', overflowX: 'auto', position: 'relative', scrollbarWidth: 'thin' }}>
          <div
            role="tablist"
            style={{
              display: 'flex',
              gap: 'var(--spacing-2xs)',
              paddingBottom: 'var(--spacing-xs)',
              minWidth: 'max-content',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {SETTINGS_SECTIONS.map((section) => (
              <button
                key={section.id}
                type="button"
                role="tab"
                aria-selected={activeSection === section.id}
                aria-controls={`section-${section.id}`}
                onClick={() => scrollToSection(section.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-2xs)',
                  padding: 'var(--spacing-xs) var(--spacing-sm)',
                  borderRadius: 'var(--radius-lg)',
                  border: 'none',
                  background: activeSection === section.id ? 'var(--color-primary-light)' : 'var(--color-surface-alt)',
                  color: activeSection === section.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  fontSize: 'var(--text-sm)',
                  fontWeight: activeSection === section.id ? 600 : 400,
                  whiteSpace: 'nowrap',
                  transition: 'all var(--transition-fast)',
                  minHeight: '44px',
                }}
              >
                <SectionIcon icon={section.icon} />
                {section.label}
              </button>
            ))}
          </div>
        </div>

        <main
          style={{ flex: 1, minWidth: 0 }}
          id={`section-${activeSection}`}
          role="tabpanel"
          aria-labelledby={activeSection}
        >
          <div
            ref={(el) => setSectionRef(activeSection, el)}
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}
          >
            <Card>
              <CardHeader>
                <CardTitle style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                  <SectionIcon icon={currentSectionData?.icon ?? ''} />
                  {currentSectionData?.label ?? ''} Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeSection === 'goal' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: 'var(--spacing-md)',
                      }}
                    >
                      <Select
                        id="target-band"
                        label="Target Band"
                        value={form.targetBand}
                        onChange={(e) => { setForm(prev => ({ ...prev, targetBand: parseFloat((e.target as HTMLSelectElement).value) })); setDirty(true) }}
                        error={errors.targetBand}
                        options={BAND_OPTIONS.map(b => ({ value: String(b), label: b.toFixed(1) }))}
                      />
                      <Select
                        id="current-band"
                        label="Current Estimated Band"
                        value={form.currentBand}
                        onChange={(e) => { setForm(prev => ({ ...prev, currentBand: parseFloat((e.target as HTMLSelectElement).value) })); setDirty(true) }}
                        error={errors.currentBand}
                        options={BAND_OPTIONS.map(b => ({ value: String(b), label: b.toFixed(1) }))}
                      />
                    </div>

                    <Input
                      id="exam-date"
                      type="date"
                      label="Exam Date"
                      value={form.examDate}
                      onChange={(e) => { setForm(prev => ({ ...prev, examDate: (e.target as HTMLInputElement).value })); setDirty(true) }}
                      helperText={form.examDate
                        ? `${Math.max(0, Math.ceil((new Date(form.examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} days until exam`
                        : 'Leave empty if not yet scheduled'
                      }
                    />

                    <Select
                      id="native-language"
                      label="Native Language"
                      value={form.nativeLanguage}
                      onChange={(e) => { setForm(prev => ({ ...prev, nativeLanguage: (e.target as HTMLSelectElement).value })); setDirty(true) }}
                      options={NATIVE_LANGUAGE_OPTIONS}
                    />

                    <Input
                      id="daily-study"
                      type="number"
                      label="Daily Study Time (minutes)"
                      min={1}
                      max={1440}
                      value={form.dailyStudyMinutes}
                      onChange={(e) => { setForm(prev => ({ ...prev, dailyStudyMinutes: Math.max(1, parseInt((e.target as HTMLInputElement).value) || 1) })); setDirty(true) }}
                      error={errors.dailyStudyMinutes}
                      helperText={`${form.dailyStudyMinutes} min/day = ${Math.round(form.dailyStudyMinutes / 60 * 10) / 10}h/day`}
                    />

                    <div>
                      <label
                        style={{
                          display: 'block',
                          marginBottom: 'var(--spacing-xs)',
                          fontSize: 'var(--text-sm)',
                          fontWeight: 500,
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        Study Goal
                      </label>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: 'var(--spacing-sm)',
                        }}
                      >
                        {(['academic', 'general'] as const).map((goal) => (
                          <button
                            key={goal}
                            type="button"
                            onClick={() => { setForm(prev => ({ ...prev, studyGoal: goal })); setDirty(true) }}
                            style={{
                              padding: 'var(--spacing-md)',
                              borderRadius: 'var(--radius-xl)',
                              border: `2px solid ${form.studyGoal === goal ? 'var(--color-primary)' : 'var(--color-border)'}`,
                              background: form.studyGoal === goal ? 'var(--color-primary-light)' : 'transparent',
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'all var(--transition-fast)',
                            }}
                          >
                            <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>
                              IELTS {goal.charAt(0).toUpperCase() + goal.slice(1)}
                            </div>
                            <div style={{ marginTop: 'var(--spacing-2xs)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                              {goal === 'academic' ? 'For university admission' : 'For work or migration'}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'ai-tutor' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                    <div
                      style={{
                        padding: 'var(--spacing-md)',
                        borderRadius: 'var(--radius-lg)',
                        background: 'var(--color-primary-light)',
                        border: '1px solid var(--color-border)',
                        fontSize: 'var(--text-sm)',
                        lineHeight: 1.6,
                      }}
                    >
                      <p style={{ margin: '0 0 var(--spacing-xs)', fontWeight: 600, color: 'var(--color-text)' }}>
                        Your Data Stays Local
                      </p>
                      <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
                        Your API key is stored only in this browser. It is never sent to any
                        server except the AI provider you configure. The app works fully without an API key.
                      </p>
                    </div>

                    <ToggleSwitch
                      enabled={aiEnabledInput}
                      onChange={(val) => { setAiEnabledInput(val); setDirty(true) }}
                      label="Enable AI Features"
                      description="Turn on AI-powered study tools including AI Tutor"
                    />

                    {aiEnabledInput && (
                      <>
                        <Select
                          id="ai-provider"
                          label="Provider"
                          value={aiProviderInput}
                          onChange={(e) => {
                            const val = (e.target as HTMLSelectElement).value
                            setAiProviderInput(val as 'openai' | 'custom')
                            if (val === 'openai') {
                              setAiBaseUrlInput('')
                              setAiModelInput(DEFAULT_AI_MODEL)
                            }
                            setAiTestResult(null)
                            setDirty(true)
                          }}
                          options={[
                            { value: 'openai', label: 'OpenAI' },
                            { value: 'custom', label: 'Custom (OpenAI-compatible)' },
                          ]}
                        />

                        <Input
                          id="ai-key"
                          type="password"
                          label="API Key"
                          value={aiApiKeyInput}
                          onChange={(e) => { setAiApiKeyInput((e.target as HTMLInputElement).value); setAiTestResult(null); setDirty(true) }}
                          placeholder="sk-..."
                          autoComplete="off"
                          helperText={
                            aiApiKeyInput
                              ? `${aiApiKeyInput.slice(0, 8)}...${aiApiKeyInput.slice(-4)}`
                              : 'No API key set'
                          }
                        />

                        <Input
                          id="ai-base-url"
                          type="text"
                          label="Base URL"
                          value={aiBaseUrlInput}
                          onChange={(e) => { setAiBaseUrlInput((e.target as HTMLInputElement).value); setAiTestResult(null); setDirty(true) }}
                          placeholder={OPENAI_BASE_URL}
                        />

                        <Input
                          id="ai-model"
                          type="text"
                          label="Model"
                          value={aiModelInput}
                          onChange={(e) => { setAiModelInput((e.target as HTMLInputElement).value); setAiTestResult(null); setDirty(true) }}
                          placeholder={DEFAULT_MODEL}
                        />

                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                          <Button variant="outline" size="sm" onClick={handleTestConnection} loading={aiTesting}>
                            Test Connection
                          </Button>
                          {aiTestResult && (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-2xs)',
                                padding: 'var(--spacing-xs) var(--spacing-sm)',
                                borderRadius: 'var(--radius-md)',
                                fontSize: 'var(--text-sm)',
                                background: aiTestResult.ok ? 'var(--color-success-light)' : 'var(--color-danger-light)',
                                color: aiTestResult.ok ? 'var(--color-success)' : 'var(--color-danger)',
                              }}
                            >
                              {aiTestResult.ok ? <IconCheck size={16} /> : <IconClose size={16} />}
                              {aiTestResult.message}
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {aiEnabledInput && !aiApiKeyInput && (
                      <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>
                        AI features are enabled but no API key is configured. Enter an API key to use AI Tutor.
                      </p>
                    )}
                  </div>
                )}

                {activeSection === 'study-plan' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                    <div>
                      <p style={{ margin: '0 0 var(--spacing-sm)', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text)' }}>
                        Weak Skills
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-2xs)' }}>
                        {SKILL_OPTIONS.map(skill => {
                          const isSelected = form.weakSkills.includes(skill)
                          return (
                            <button
                              key={skill}
                              type="button"
                              onClick={() => { setForm(prev => ({ ...prev, weakSkills: toggleArrayItem(prev.weakSkills, skill) })); setDirty(true) }}
                              style={{
                                padding: 'var(--spacing-xs) var(--spacing-sm)',
                                borderRadius: 'var(--radius-lg)',
                                border: '1px solid',
                                borderColor: isSelected ? 'var(--color-danger)' : 'var(--color-border)',
                                background: isSelected ? 'var(--color-danger-light)' : 'transparent',
                                color: isSelected ? 'var(--color-danger)' : 'var(--color-text-secondary)',
                                cursor: 'pointer',
                                fontSize: 'var(--text-xs)',
                                fontWeight: isSelected ? 600 : 400,
                                transition: 'all var(--transition-fast)',
                                minHeight: '36px',
                              }}
                            >
                              {skill}
                            </button>
                          )
                        })}
                      </div>
                      <p style={{ margin: 'var(--spacing-xs) 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>
                        {form.weakSkills.length === 0
                          ? 'Select your weak areas to focus your study plan'
                          : `${form.weakSkills.length} skill${form.weakSkills.length > 1 ? 's' : ''} selected`
                        }
                      </p>
                    </div>

                    <div>
                      <p style={{ margin: '0 0 var(--spacing-sm)', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text)' }}>
                        Preferred Topics
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-2xs)' }}>
                        {IELTS_TOPICS.map(topic => {
                          const isSelected = form.preferredTopics.includes(topic)
                          return (
                            <button
                              key={topic}
                              type="button"
                              onClick={() => { setForm(prev => ({ ...prev, preferredTopics: toggleArrayItem(prev.preferredTopics, topic) })); setDirty(true) }}
                              style={{
                                padding: 'var(--spacing-xs) var(--spacing-sm)',
                                borderRadius: 'var(--radius-lg)',
                                border: '1px solid',
                                borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
                                background: isSelected ? 'var(--color-primary-light)' : 'transparent',
                                color: isSelected ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                                cursor: 'pointer',
                                fontSize: 'var(--text-xs)',
                                fontWeight: isSelected ? 600 : 400,
                                transition: 'all var(--transition-fast)',
                                minHeight: '36px',
                              }}
                            >
                              {topic}
                            </button>
                          )
                        })}
                      </div>
                      <p style={{ margin: 'var(--spacing-xs) 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>
                        {form.preferredTopics.length === 0
                          ? 'Select topics you prefer to practice with'
                          : `${form.preferredTopics.length} topic${form.preferredTopics.length > 1 ? 's' : ''} selected`
                        }
                      </p>
                    </div>

                    <div>
                      <p style={{ margin: '0 0 var(--spacing-sm)', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text)' }}>
                        Study Schedule
                      </p>
                      <p style={{ margin: '0 0 var(--spacing-xs)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                        Which days do you plan to study?
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-2xs)' }}>
                        {DAYS_OF_WEEK.map(day => {
                          const isSelected = form.preferredSchedule.includes(day.value as typeof form.preferredSchedule[number])
                          return (
                            <button
                              key={day.value}
                              type="button"
                              onClick={() => { setForm(prev => ({ ...prev, preferredSchedule: toggleArrayItem(prev.preferredSchedule, day.value) as typeof prev.preferredSchedule })); setDirty(true) }}
                              style={{
                                padding: 'var(--spacing-xs) var(--spacing-sm)',
                                borderRadius: 'var(--radius-lg)',
                                border: '1px solid',
                                borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
                                background: isSelected ? 'var(--color-primary-light)' : 'transparent',
                                color: isSelected ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                                cursor: 'pointer',
                                fontSize: 'var(--text-xs)',
                                fontWeight: isSelected ? 600 : 400,
                                transition: 'all var(--transition-fast)',
                                minHeight: '36px',
                                minWidth: '44px',
                              }}
                              aria-label={day.label}
                            >
                              {day.label.slice(0, 3)}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <Input
                      id="reminder-text"
                      type="text"
                      label="Study Reminder"
                      value={form.studyReminder}
                      onChange={(e) => { setForm(prev => ({ ...prev, studyReminder: (e.target as HTMLInputElement).value })); setDirty(true) }}
                      maxLength={200}
                      error={errors.studyReminder}
                      helperText={`${form.studyReminder.length}/200 characters`}
                      placeholder="e.g., Time to study IELTS!"
                    />
                  </div>
                )}

                {activeSection === 'appearance' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                    <Select
                      id="theme-mode"
                      label="Theme Mode"
                      value={themeMode}
                      onChange={(e) => { setThemeMode(e.target.value as ThemeMode); setDirty(true) }}
                      options={[
                        { value: 'light', label: 'Light' },
                        { value: 'dark', label: 'Dark' },
                        { value: 'system', label: 'System' },
                      ]}
                    />

                    <div>
                      <label
                        style={{
                          display: 'block',
                          marginBottom: 'var(--spacing-sm)',
                          fontSize: 'var(--text-sm)',
                          fontWeight: 500,
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        Accent Color
                      </label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
                        {ACCENT_COLOR_PRESETS.map(c => (
                          <button
                            key={c.value}
                            type="button"
                            title={c.name}
                            onClick={() => { setAccentColor(c.value); setDirty(true) }}
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: 'var(--radius-full)',
                              border: '3px solid',
                              borderColor: accentColor === c.value ? 'var(--color-primary)' : 'transparent',
                              backgroundColor: c.value,
                              cursor: 'pointer',
                              transition: 'all var(--transition-fast)',
                              outline: 'none',
                              transform: accentColor === c.value ? 'scale(1.15)' : 'scale(1)',
                            }}
                            aria-label={`Set accent color to ${c.name}`}
                          />
                        ))}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: 'var(--spacing-md)',
                        borderRadius: 'var(--radius-lg)',
                        background: 'var(--color-surface-alt)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      <p style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text)' }}>
                        Preview
                      </p>
                      <div
                        style={{
                          marginTop: 'var(--spacing-sm)',
                          padding: 'var(--spacing-md)',
                          borderRadius: 'var(--radius-lg)',
                          background: 'var(--color-surface)',
                          border: '1px solid var(--color-border)',
                        }}
                      >
                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
                          <div style={{
                            width: '12px', height: '12px', borderRadius: 'var(--radius-full)',
                            backgroundColor: 'var(--color-primary)',
                          }} />
                          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>
                            Primary color preview
                          </span>
                          <span style={{
                            padding: '2px 8px', borderRadius: 'var(--radius-md)',
                            background: 'var(--color-primary)', color: 'var(--color-text-inverse)',
                            fontSize: 'var(--text-xs)', fontWeight: 600,
                          }}>
                            Badge
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'proactive-tutor' && (
                  <ProactiveTutorSettings />
                )}

                {activeSection === 'notifications' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                    <ToggleSwitch
                      enabled={notifications.enabled}
                      onChange={(val) => {
                        setNotifications(prev => ({ ...prev, enabled: val }))
                        if (val) handleRequestNotification()
                      }}
                      label="Enable Notifications"
                      description="Get reminded to study daily"
                    />

                    {notifications.enabled && (
                      <>
                        <Input
                          id="reminder-time"
                          type="time"
                          label="Reminder Time"
                          value={notifications.reminderTime}
                          onChange={(e) => setNotifications(prev => ({ ...prev, reminderTime: (e.target as HTMLInputElement).value }))}
                        />

                        <div
                          style={{
                            padding: 'var(--spacing-sm) var(--spacing-md)',
                            borderRadius: 'var(--radius-lg)',
                            background: 'var(--color-surface-alt)',
                            border: '1px solid var(--color-border)',
                          }}
                        >
                          <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                            {!('Notification' in window) && 'Notifications not supported in this browser. '}
                            Study reminder set for{' '}
                            <strong>{notifications.reminderTime}</strong>
                            {notifications.enabled ? '. Notifications are active.' : ''}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {activeSection === 'advanced' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                    <div
                      style={{
                        padding: 'var(--spacing-sm) var(--spacing-md)',
                        borderRadius: 'var(--radius-lg)',
                        background: 'var(--color-warning-light)',
                        border: '1px solid var(--color-warning)',
                        fontSize: 'var(--text-sm)',
                        color: 'var(--color-warning)',
                      }}
                    >
                      Only change these settings if you know what you are doing.
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() => setShowAdvancedNetwork(!showAdvancedNetwork)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                          padding: 'var(--spacing-sm)',
                          borderRadius: 'var(--radius-lg)',
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          color: 'var(--color-text)',
                          fontSize: 'var(--text-sm)',
                          fontWeight: 500,
                        }}
                      >
                        <span>CORS Proxy Configuration</span>
                        <IconChevronDown
                          size={16}
                          style={{
                            transition: 'transform var(--transition-fast)',
                            transform: showAdvancedNetwork ? 'rotate(180deg)' : 'none',
                          }}
                        />
                      </button>

                      {showAdvancedNetwork && (
                        <div style={{ padding: 'var(--spacing-sm) 0', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                          <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                            Some public API sources (Tatoeba, OER Commons) do not support direct browser access due to CORS restrictions.
                            Enable a CORS proxy to use them.
                          </p>
                          <CorsProxySection />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeSection === 'data' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                    <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                      Your data is stored locally in this browser. Download a backup regularly to avoid data loss.
                    </p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
                      <Button onClick={handleExport}>
                        <IconDownload size={16} />
                        Export Backup
                      </Button>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleFileSelected}
                        style={{ display: 'none' }}
                        aria-hidden="true"
                      />
                      <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                        <IconUpload size={16} />
                        Import Backup
                      </Button>

                      <Button variant="danger" onClick={handleClearAll}>
                        <IconDelete size={16} />
                        Clear All Data
                      </Button>
                    </div>

                    <div
                      style={{
                        padding: 'var(--spacing-md)',
                        borderRadius: 'var(--radius-lg)',
                        background: 'var(--color-surface-alt)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                        All data is stored locally. No data is ever sent to any server.
                        Regular backups are recommended in JSON format.
                      </p>
                    </div>

                    <div
                      style={{
                        padding: 'var(--spacing-md)',
                        borderRadius: 'var(--radius-lg)',
                        background: 'var(--color-primary-light)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                        <IconExtension size={20} />
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text)' }}>
                            Browser Extension
                          </p>
                          <p style={{ margin: '2px 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                            Manage vocabulary sync, import articles, and check connection status
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => navigate(ROUTES.settingsExtension)}
                        >
                          Manage Extension
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 'var(--spacing-md)',
                padding: 'var(--spacing-md) 0',
                borderTop: '1px solid var(--color-border)',
              }}
            >
              <Button onClick={handleSave} disabled={!dirty || saving} loading={saving}>
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
              <Button variant="ghost" onClick={handleReset}>
                Reset to Defaults
              </Button>
            </div>
          </div>
        </main>
      </div>

      <ConfirmDialog
        open={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        title={confirmAction?.title ?? ''}
        message={confirmAction?.message ?? ''}
        confirmLabel={confirmAction?.buttonLabel}
        cancelLabel="Cancel"
        variant={confirmAction?.buttonVariant ?? 'danger'}
        onConfirm={async () => {
          await confirmAction?.action()
        }}
      />
    </PageContent>
  )
}

// TODO: move to a proper storage repository
function loadCorsProxy(): { enabled: boolean; proxyUrl: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.localStorage.corsProxy)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { enabled: false, proxyUrl: 'https://corsproxy.io/?' }
}
function saveCorsProxy(val: { enabled: boolean; proxyUrl: string }): void {
  try { localStorage.setItem(STORAGE_KEYS.localStorage.corsProxy, JSON.stringify(val)) } catch { /* ignore */ }
}

function CorsProxySection() {
  const [corsConfig, setCorsConfig] = useState(loadCorsProxy)
  const corsEnabled = corsConfig.enabled
  const corsUrl = corsConfig.proxyUrl

  const setCorsEnabled = (val: boolean) => setCorsConfig(prev => ({ ...prev, enabled: val }))
  const setCorsUrl = (val: string) => setCorsConfig(prev => ({ ...prev, proxyUrl: val }))

  useEffect(() => {
    saveCorsProxy(corsConfig)
  }, [corsConfig])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text)' }}>
            Enable CORS Proxy
          </p>
          <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
            Routes requests through a proxy to bypass CORS restrictions
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={corsEnabled}
          onClick={() => setCorsEnabled(!corsEnabled)}
          style={{
            position: 'relative',
            display: 'inline-flex',
            height: '24px',
            width: '44px',
            flexShrink: 0,
            cursor: 'pointer',
            borderRadius: 'var(--radius-full)',
            border: '2px solid transparent',
            transition: 'background var(--transition-fast)',
            background: corsEnabled ? 'var(--color-primary)' : 'var(--color-border)',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              height: '20px',
              width: '20px',
              borderRadius: 'var(--radius-full)',
              background: 'white',
              boxShadow: 'var(--shadow-sm)',
              transition: 'transform var(--transition-fast)',
              transform: corsEnabled ? 'translateX(20px)' : 'translateX(0)',
            }}
          />
        </button>
      </div>

      {corsEnabled && (
        <div>
          <label
            htmlFor="cors-proxy-url"
            style={{
              display: 'block',
              marginBottom: 'var(--spacing-2xs)',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
            }}
          >
            Proxy URL
          </label>
          <div style={{ display: 'flex', gap: 'var(--spacing-xs)', alignItems: 'center' }}>
            <input
              id="cors-proxy-url"
              type="url"
              value={corsUrl}
              onChange={(e) => setCorsUrl(e.target.value)}
              placeholder="https://corsproxy.io/?"
              style={{
                flex: 1,
                padding: 'var(--spacing-xs) var(--spacing-sm)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text)',
                fontSize: 'var(--text-sm)',
              }}
            />
          </div>
          <p style={{ margin: 'var(--spacing-2xs) 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>
            Use a service like{' '}
            <a
              href="https://corsproxy.io/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--color-primary)' }}
            >
              corsproxy.io
            </a>{' '}
            or host your own.
          </p>
        </div>
      )}
    </div>
  )
}
