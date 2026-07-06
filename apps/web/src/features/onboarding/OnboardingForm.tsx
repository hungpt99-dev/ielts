import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { completeOnboarding, type OnboardingData } from './onboardingService'
import { Button, Badge, ProgressBar } from '@ielts/ui'

const BAND_OPTIONS = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9]

const BAND_DESCRIPTIONS: Record<string, string> = {
  '1.0': 'Non-user — cannot use English at all',
  '1.5': 'Intermittent user — no real communication possible',
  '2.0': 'Intermittent user — great difficulty understanding English',
  '2.5': 'Intermittent user — understands isolated words and simple phrases',
  '3.0': 'Extremely limited user — conveys and understands only general meaning',
  '3.5': 'Extremely limited user — frequent breakdowns in communication',
  '4.0': 'Limited user — basic competence in familiar situations',
  '4.5': 'Limited user — frequent problems in understanding and expression',
  '5.0': 'Modest user — partial command, coping with overall meaning',
  '5.5': 'Modest user — has partial command, makes many mistakes',
  '6.0': 'Competent user — generally effective command despite inaccuracies',
  '6.5': 'Competent user — good command with some occasional inaccuracies',
  '7.0': 'Good user — operational command, occasional inaccuracies',
  '7.5': 'Good user — handles complex language well, occasional slip-ups',
  '8.0': 'Very good user — fully operational command with only occasional errors',
  '8.5': 'Very good user — fluent and accurate, only rare minor errors',
  '9.0': 'Expert user — fully operational command of English',
}

const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English', flag: '🌍' },
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
]

const SKILL_OPTIONS = [
  { value: 'Reading', icon: '📖' },
  { value: 'Listening', icon: '🎧' },
  { value: 'Writing', icon: '✍️' },
  { value: 'Speaking', icon: '🗣️' },
  { value: 'Vocabulary', icon: '📚' },
  { value: 'Grammar', icon: '📝' },
]

const TUTOR_STYLES = [
  {
    id: 'encouraging' as const,
    title: 'Encouraging & Supportive',
    description: 'Warm, motivational guidance with plenty of encouragement',
    preview: "You're doing great! Let's keep going step by step. Remember, every mistake is a learning opportunity.",
    icon: '🌟',
  },
  {
    id: 'direct' as const,
    title: 'Direct & Efficient',
    description: 'Clear, no-nonsense feedback focused on improvement',
    preview: "Here's what you need to improve. Let's focus on your weakest areas first. Time is limited.",
    icon: '🎯',
  },
  {
    id: 'detailed' as const,
    title: 'Detailed & Explanatory',
    description: 'In-depth explanations that build deep understanding',
    preview: "Let me explain why this answer is correct. When you understand the rule, you can apply it anywhere.",
    icon: '🔍',
  },
]

const GENERATION_MESSAGES = [
  'Analyzing your current level and target...',
  'Planning your personalized study timeline...',
  'Building daily tasks for your weak skills...',
  'Preparing your vocabulary review system...',
  'Setting up your AI Tutor...',
  'Almost ready — finalizing your learning plan...',
]

const STUDY_TIPS = [
  'Consistent 30-minute daily practice can improve 1 band in 3 months.',
  'Reviewing vocabulary in context helps retain 3x more words.',
  'Mixing reading and listening practice boosts overall comprehension.',
  'Writing one essay per week can improve your Writing score by 0.5 bands.',
  'Speaking practice with AI feedback is as effective as a human tutor.',
  'Tracking your mistakes helps you avoid repeating them.',
  'Taking a 5-minute break every 25 minutes improves focus.',
]

const STUDY_TIME_ANCHORS = [
  { value: 15, label: 'Quick' },
  { value: 30, label: 'Light' },
  { value: 60, label: 'Standard' },
  { value: 90, label: 'Focused' },
  { value: 120, label: 'Intensive' },
]

const STEP_ICONS = ['🌐', '📊', '🎯', '📅', '⏰', '💪', '🤖', '✨']

interface StepConfig {
  title: string
  subtitle: string
}

const stepConfigs: StepConfig[] = [
  { title: 'What language do you prefer?', subtitle: 'Choose your preferred language for the app interface' },
  { title: 'What is your current IELTS level?', subtitle: 'Select your current estimated band score' },
  { title: 'What band score do you need?', subtitle: 'Select your target IELTS band score' },
  { title: 'When is your IELTS exam?', subtitle: 'Set your exam date to get a personalized countdown' },
  { title: 'How much time can you study each day?', subtitle: 'We\'ll build your daily plan around your schedule' },
  { title: 'Which skills need the most work?', subtitle: 'Tell us your strengths and areas for improvement' },
  { title: 'How would you like your AI Tutor to teach you?', subtitle: 'Choose a teaching style that works best for you' },
  { title: 'Creating your personal IELTS Journey...', subtitle: '' },
]

function getProgressStats(studyMinutes: number) {
  return {
    wordsPerMonth: Math.round(studyMinutes / 5 * 10),
    questionsPerWeek: Math.round(studyMinutes / 15 * 7),
  }
}

function StepLanguage({ data, update }: { data: OnboardingData; update: (patch: Partial<OnboardingData>) => void }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {LANGUAGE_OPTIONS.map(lang => (
          <button
            key={lang.code}
            type="button"
            onClick={() => update({ preferredLanguage: lang.code })}
            style={{
              padding: 'var(--spacing-md)',
              borderRadius: 'var(--radius-xl)',
              border: `2px solid ${data.preferredLanguage === lang.code ? 'var(--color-primary)' : 'var(--color-border)'}`,
              background: data.preferredLanguage === lang.code ? 'var(--color-primary-light)' : 'var(--color-surface)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--spacing-xs)',
              fontFamily: 'var(--font-sans)',
              fontWeight: data.preferredLanguage === lang.code ? 'var(--weight-semibold)' : 'var(--weight-normal)',
              color: data.preferredLanguage === lang.code ? 'var(--color-primary-dark)' : 'var(--color-text)',
              minHeight: '80px',
              position: 'relative',
            }}
            aria-pressed={data.preferredLanguage === lang.code}
          >
            <span style={{ fontSize: 'var(--text-2xl)', lineHeight: '1' }}>{lang.flag}</span>
            <span style={{ fontSize: 'var(--text-sm)', textAlign: 'center' }}>{lang.label}</span>
            {data.preferredLanguage === lang.code && (
              <span style={{ position: 'absolute', top: 'var(--spacing-2xs)', right: 'var(--spacing-2xs)', color: 'var(--color-primary)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
              </span>
            )}
          </button>
        ))}
      </div>
      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', textAlign: 'center' }}>You can change this anytime in Settings</p>
    </div>
  )
}

function StepCurrentBand({ data, update }: { data: OnboardingData; update: (patch: Partial<OnboardingData>) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 max-h-[320px] overflow-y-auto" style={{ scrollbarWidth: 'thin', paddingRight: 'var(--spacing-xs)' }}>
        {BAND_OPTIONS.filter(b => b <= data.targetBand).map(band => {
          const key = band.toFixed(1)
          const isSelected = data.currentBand === band
          return (
            <button
              key={key}
              type="button"
              onClick={() => update({ currentBand: band })}
              style={{
                padding: 'var(--spacing-sm)',
                borderRadius: 'var(--radius-lg)',
                border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                background: isSelected ? 'var(--color-primary-light)' : 'var(--color-surface)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                fontFamily: 'var(--font-sans)',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-3xs)',
                minHeight: '72px',
              }}
              aria-pressed={isSelected}
            >
              <span style={{
                fontSize: 'var(--text-lg)',
                fontWeight: 'var(--weight-bold)',
                color: isSelected ? 'var(--color-primary-dark)' : 'var(--color-text)',
              }}>
                {key}
              </span>
              <span style={{
                fontSize: 'var(--text-2xs)',
                color: 'var(--color-text-secondary)',
                lineHeight: 'var(--leading-tight)',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {BAND_DESCRIPTIONS[key]?.split('—')[1]?.trim() || ''}
              </span>
            </button>
          )
        })}
      </div>
      {data.currentBand > 0 && (
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-primary)', fontWeight: 'var(--weight-medium)', textAlign: 'center' }}>
          That's a great starting point!
        </p>
      )}
    </div>
  )
}

function StepTargetBand({ data, update }: { data: OnboardingData; update: (patch: Partial<OnboardingData>) => void }) {
  const bandGap = data.targetBand - data.currentBand
  const difficulty = bandGap <= 1 ? 'Easy' : bandGap <= 2 ? 'Manageable' : 'Challenging'
  const diffColor = bandGap <= 1 ? 'var(--color-success)' : bandGap <= 2 ? 'var(--color-warning)' : 'var(--color-danger)'

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 max-h-[280px] overflow-y-auto" style={{ scrollbarWidth: 'thin', paddingRight: 'var(--spacing-xs)' }}>
        {BAND_OPTIONS.filter(b => b >= 4.0).map(band => {
          const key = band.toFixed(1)
          const isSelected = data.targetBand === band
          const disabled = band <= data.currentBand
          return (
            <button
              key={key}
              type="button"
              onClick={() => !disabled && update({ targetBand: band })}
              disabled={disabled}
              style={{
                padding: 'var(--spacing-sm)',
                borderRadius: 'var(--radius-lg)',
                border: `2px solid ${isSelected ? 'var(--color-primary)' : disabled ? 'var(--color-border-light)' : 'var(--color-border)'}`,
                background: isSelected ? 'var(--color-primary-light)' : disabled ? 'var(--color-surface-alt)' : 'var(--color-surface)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all var(--transition-fast)',
                fontFamily: 'var(--font-sans)',
                textAlign: 'left',
                opacity: disabled ? 0.5 : 1,
                minHeight: '56px',
              }}
              aria-pressed={isSelected}
            >
              <span style={{
                fontSize: 'var(--text-lg)',
                fontWeight: 'var(--weight-bold)',
                color: isSelected ? 'var(--color-primary-dark)' : disabled ? 'var(--color-muted)' : 'var(--color-text)',
              }}>
                {key}
              </span>
            </button>
          )
        })}
      </div>

      {data.targetBand > data.currentBand && (
        <div style={{
          padding: 'var(--spacing-md)',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--color-primary-light)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', flexWrap: 'wrap', justifyContent: 'center' }}>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)' }}>
              {data.currentBand.toFixed(1)}
            </span>
            <svg width="24" height="8" viewBox="0 0 24 8" fill="none" style={{ color: 'var(--color-primary)' }}>
              <path d="M1 4h20M17 1l4 3-4 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: 'var(--color-primary-dark)' }}>
              {data.targetBand.toFixed(1)}
            </span>
            <Badge variant={bandGap <= 1 ? 'success' : bandGap <= 2 ? 'warning' : 'danger'} size="sm">
              +{bandGap.toFixed(1)} band gap
            </Badge>
          </div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', textAlign: 'center', marginTop: 'var(--spacing-xs)' }}>
            Difficulty: <span style={{ color: diffColor, fontWeight: 'var(--weight-semibold)' }}>{difficulty}</span>
            {bandGap <= 1 ? ' — Great choice, you\'re close!' : bandGap <= 2 ? ' — Manageable with consistent effort.' : ' — We\'ll work hard together!'}
          </p>
        </div>
      )}
    </div>
  )
}

function StepExamDate({ data, update }: { data: OnboardingData; update: (patch: Partial<OnboardingData>) => void }) {
  const today = new Date()
  const quickOptions = [
    { label: '1 month', days: 30 },
    { label: '3 months', days: 90 },
    { label: '6 months', days: 180 },
  ]

  function setQuickDate(daysFromNow: number) {
    const d = new Date(today)
    d.setDate(d.getDate() + daysFromNow)
    update({ examDate: d.toISOString().split('T')[0] })
  }

  const examDateObj = data.examDate ? new Date(data.examDate) : null
  const daysUntilExam = examDateObj ? Math.ceil((examDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null

  return (
    <div className="space-y-5">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)' }}>
        {quickOptions.map(opt => (
          <button
            key={opt.days}
            type="button"
            onClick={() => setQuickDate(opt.days)}
            style={{
              padding: 'var(--spacing-xs) var(--spacing-md)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-medium)',
              color: 'var(--color-text)',
              transition: 'all var(--transition-fast)',
              flex: '1',
              minWidth: '80px',
              textAlign: 'center',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.background = 'var(--color-primary-light)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'var(--color-surface)' }}
          >
            {opt.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => update({ examDate: '' })}
          style={{
            padding: 'var(--spacing-xs) var(--spacing-md)',
            borderRadius: 'var(--radius-lg)',
            border: `1px solid ${!data.examDate ? 'var(--color-primary)' : 'var(--color-border)'}`,
            background: !data.examDate ? 'var(--color-primary-light)' : 'var(--color-surface)',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--weight-medium)',
            color: !data.examDate ? 'var(--color-primary-dark)' : 'var(--color-text-secondary)',
            transition: 'all var(--transition-fast)',
            flex: '1',
            minWidth: '80px',
            textAlign: 'center',
          }}
        >
          Not sure yet
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
        <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)' }}>
          Or pick a custom date
        </label>
        <input
          type="date"
          value={data.examDate}
          onChange={(e) => update({ examDate: e.target.value })}
          min={today.toISOString().split('T')[0]}
          style={{
            padding: 'var(--spacing-sm) var(--spacing-md)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--text-base)',
            color: 'var(--color-text)',
            width: '100%',
            minHeight: '48px',
          }}
        />
      </div>

      {daysUntilExam && daysUntilExam > 0 && (
        <div style={{
          padding: 'var(--spacing-md)',
          borderRadius: 'var(--radius-lg)',
          background: daysUntilExam < 14 ? 'var(--color-danger-light)' : 'var(--color-success-light)',
          textAlign: 'center',
        }}>
          <span style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: daysUntilExam < 14 ? 'var(--color-danger-dark)' : 'var(--color-success-dark)' }}>
            {daysUntilExam} days away
          </span>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-2xs)' }}>
            {daysUntilExam < 14
              ? 'Your exam is soon. Let\'s focus on your highest-impact areas.'
              : `That gives you approximately ${Math.floor(daysUntilExam / 7)} weeks of preparation.`}
          </p>
        </div>
      )}

      {!data.examDate && (
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', textAlign: 'center' }}>
          No problem — you can set it later and AI will adjust your plan.
        </p>
      )}
    </div>
  )
}

function StepStudyTime({ data, update }: { data: OnboardingData; update: (patch: Partial<OnboardingData>) => void }) {
  const stats = getProgressStats(data.dailyStudyMinutes)
  const [sliderValue, setSliderValue] = useState(data.dailyStudyMinutes)

  useEffect(() => {
    setSliderValue(data.dailyStudyMinutes)
  }, [data.dailyStudyMinutes])

  return (
    <div className="space-y-6">
      <div style={{ textAlign: 'center' }}>
        <span style={{ fontSize: 'var(--text-4xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-primary)' }}>
          {sliderValue}
        </span>
        <span style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-secondary)', marginLeft: 'var(--spacing-xs)' }}>
          minutes / day
        </span>
      </div>

      <div style={{ padding: '0 var(--spacing-xs)' }}>
        <input
          type="range"
          min={15}
          max={180}
          step={5}
          value={sliderValue}
          onChange={(e) => {
            const val = parseInt(e.target.value)
            setSliderValue(val)
            update({ dailyStudyMinutes: val })
          }}
          style={{
            width: '100%',
            height: '8px',
            WebkitAppearance: 'none',
            appearance: 'none',
            background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${((sliderValue - 15) / (180 - 15)) * 100}%, var(--color-surface-alt) ${((sliderValue - 15) / (180 - 15)) * 100}%, var(--color-surface-alt) 100%)`,
            borderRadius: 'var(--radius-full)',
            outline: 'none',
            cursor: 'pointer',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--spacing-xs)' }}>
          {STUDY_TIME_ANCHORS.map(anchor => (
            <span key={anchor.value} style={{
              fontSize: 'var(--text-2xs)',
              color: sliderValue >= anchor.value ? 'var(--color-primary)' : 'var(--color-muted)',
              fontWeight: sliderValue === anchor.value ? 'var(--weight-semibold)' : 'var(--weight-normal)',
            }}>
              {anchor.label}
            </span>
          ))}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'var(--spacing-xs)',
        padding: 'var(--spacing-md)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--color-surface-alt)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: 'var(--color-primary)' }}>
            ~{stats.wordsPerMonth}
          </span>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>words learned / month</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: 'var(--color-primary)' }}>
            ~{stats.questionsPerWeek}
          </span>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>practice qs / week</p>
        </div>
      </div>

      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', textAlign: 'center' }}>You can always adjust this later.</p>
    </div>
  )
}

function StepSkills({ data, update }: { data: OnboardingData; update: (patch: Partial<OnboardingData>) => void }) {
  function toggleSkill(skill: string, targetList: 'weak' | 'strong') {
    const weakSet = new Set(data.weakSkills)
    const strongSet = new Set(data.strongSkills)

    if (targetList === 'weak') {
      if (weakSet.has(skill)) {
        weakSet.delete(skill)
      } else {
        weakSet.add(skill)
        strongSet.delete(skill)
      }
    } else {
      if (strongSet.has(skill)) {
        strongSet.delete(skill)
      } else {
        strongSet.add(skill)
        weakSet.delete(skill)
      }
    }

    update({
      weakSkills: Array.from(weakSet),
      strongSkills: Array.from(strongSet),
    })
  }

  const showPriorityWarning = data.weakSkills.length > 4

  return (
    <div className="space-y-5">
      <div>
        <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-danger-dark)', marginBottom: 'var(--spacing-xs)' }}>
          I need practice with:
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)' }}>
          {SKILL_OPTIONS.map(skill => {
            const isSelected = data.weakSkills.includes(skill.value)
            return (
              <button
                key={skill.value}
                type="button"
                onClick={() => toggleSkill(skill.value, 'weak')}
                style={{
                  padding: 'var(--spacing-xs) var(--spacing-md)',
                  borderRadius: 'var(--radius-lg)',
                  border: `2px solid ${isSelected ? 'var(--color-danger)' : 'var(--color-border)'}`,
                  background: isSelected ? 'var(--color-danger-light)' : 'var(--color-surface)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: isSelected ? 'var(--weight-semibold)' : 'var(--weight-medium)',
                  color: isSelected ? 'var(--color-danger-dark)' : 'var(--color-text)',
                  transition: 'all var(--transition-fast)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-2xs)',
                  minHeight: '40px',
                }}
              >
                <span>{skill.icon}</span>
                <span>{skill.value}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-success-dark)', marginBottom: 'var(--spacing-xs)' }}>
          I'm confident in:
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)' }}>
          {SKILL_OPTIONS.map(skill => {
            const isSelected = data.strongSkills.includes(skill.value)
            return (
              <button
                key={skill.value}
                type="button"
                onClick={() => toggleSkill(skill.value, 'strong')}
                style={{
                  padding: 'var(--spacing-xs) var(--spacing-md)',
                  borderRadius: 'var(--radius-lg)',
                  border: `2px solid ${isSelected ? 'var(--color-success)' : 'var(--color-border)'}`,
                  background: isSelected ? 'var(--color-success-light)' : 'var(--color-surface)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: isSelected ? 'var(--weight-semibold)' : 'var(--weight-medium)',
                  color: isSelected ? 'var(--color-success-dark)' : 'var(--color-text)',
                  transition: 'all var(--transition-fast)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-2xs)',
                  minHeight: '40px',
                }}
              >
                <span>{skill.icon}</span>
                <span>{skill.value}</span>
              </button>
            )
          })}
        </div>
      </div>

      {showPriorityWarning && (
        <div style={{
          padding: 'var(--spacing-sm) var(--spacing-md)',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--color-warning-light)',
          fontSize: 'var(--text-sm)',
          color: 'var(--color-warning-dark)',
        }}>
          That's a lot to work on! Which 2-3 are most urgent?
        </div>
      )}

      {data.weakSkills.length === 0 && data.strongSkills.length > 0 && (
        <div style={{
          padding: 'var(--spacing-sm) var(--spacing-md)',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--color-info-light)',
          fontSize: 'var(--text-sm)',
          color: 'var(--color-info-dark)',
        }}>
          Even experts have areas to improve! Which skill do you want to practice most?
        </div>
      )}

      {data.weakSkills.length === 0 && (
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)', textAlign: 'center' }}>
          Select at least one skill you want to improve.
        </p>
      )}
    </div>
  )
}

function StepTutorStyle({ data, update }: { data: OnboardingData; update: (patch: Partial<OnboardingData>) => void }) {
  return (
    <div className="space-y-4">
      {TUTOR_STYLES.map(style => {
        const isSelected = data.tutorStyle === style.id
        return (
          <button
            key={style.id}
            type="button"
            onClick={() => update({ tutorStyle: style.id })}
            style={{
              width: '100%',
              padding: 'var(--spacing-md)',
              borderRadius: 'var(--radius-xl)',
              border: `2px solid ${isSelected ? 'var(--color-tutor-accent)' : 'var(--color-border)'}`,
              background: isSelected ? 'var(--color-tutor-accent-light)' : 'var(--color-surface)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
              fontFamily: 'var(--font-sans)',
              textAlign: 'left',
              position: 'relative',
            }}
            aria-pressed={isSelected}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
              <span style={{ fontSize: 'var(--text-2xl)' }}>{style.icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)' }}>
                  {style.title}
                </p>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{style.description}</p>
              </div>
              {isSelected && (
                <span style={{ color: 'var(--color-tutor-accent)' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                </span>
              )}
            </div>
            {isSelected && (
              <div style={{
                marginTop: 'var(--spacing-sm)',
                padding: 'var(--spacing-sm)',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--color-tutor-background)',
                fontSize: 'var(--text-sm)',
                color: 'var(--color-tutor-text)',
                fontStyle: 'italic',
                lineHeight: 'var(--leading-relaxed)',
              }}>
                "{style.preview}"
              </div>
            )}
          </button>
        )
      })}
      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', textAlign: 'center' }}>You can change this anytime in Settings.</p>
    </div>
  )
}

function StepGenerating({ onComplete, onCancel }: { onComplete: () => void; onCancel: () => void }) {
  const [progress, setProgress] = useState(0)
  const [messageIndex, setMessageIndex] = useState(0)
  const [tipIndex, setTipIndex] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const totalDuration = 8000
    const interval = 80
    const step = 100 / (totalDuration / interval)

    intervalRef.current = setInterval(() => {
      setProgress(prev => {
        const next = prev + step
        if (next >= 100) {
          clearInterval(intervalRef.current!)
          setTimeout(onComplete, 300)
          return 100
        }
        return next
      })
    }, interval)

    const msgInterval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % GENERATION_MESSAGES.length)
    }, 2000)

    const tipInterval = setInterval(() => {
      setTipIndex(prev => (prev + 1) % STUDY_TIPS.length)
    }, 4000)

    return () => {
      clearInterval(intervalRef.current!)
      clearInterval(msgInterval)
      clearInterval(tipInterval)
    }
  }, [onComplete])

  return (
    <div className="space-y-6" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 'var(--text-4xl)', animation: 'pulse 1.5s ease-in-out infinite' }}>
        ✨
      </div>

      <div>
        <p style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)' }}>
          Creating your personal
        </p>
        <p style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)' }}>
          IELTS Journey...
        </p>
      </div>

      <ProgressBar value={progress} variant="primary" size="md" showLabel animated />

      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-primary)', fontWeight: 'var(--weight-medium)', minHeight: '1.5em' }}>
        {GENERATION_MESSAGES[messageIndex]}
      </p>

      <div style={{
        padding: 'var(--spacing-sm) var(--spacing-md)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--color-surface-alt)',
        fontSize: 'var(--text-xs)',
        color: 'var(--color-muted)',
        lineHeight: 'var(--leading-relaxed)',
        minHeight: '2.5em',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        💡 {STUDY_TIPS[tipIndex]}
      </div>

      <button
        type="button"
        onClick={onCancel}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--color-muted)',
          cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--text-sm)',
          textDecoration: 'underline',
          padding: 'var(--spacing-xs)',
        }}
      >
        Cancel
      </button>
    </div>
  )
}

export default function OnboardingForm() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [showSkipConfirm, setShowSkipConfirm] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState(false)
  const [genLoading, setGenLoading] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const [data, setData] = useState<OnboardingData>({
    currentBand: 5.5,
    targetBand: 7.0,
    examDate: '',
    dailyStudyMinutes: 60,
    weakSkills: [],
    strongSkills: [],
    preferredTopics: [],
    studyGoal: 'academic',
    preferredSchedule: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
    preferredLanguage: 'en',
    tutorStyle: 'encouraging',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  function update(patch: Partial<OnboardingData>) {
    setData(prev => ({ ...prev, ...patch }))
    setErrors({})
  }

  function validateStep(stepIndex: number): boolean {
    const newErrors: Record<string, string> = {}

    if (stepIndex === 1 && data.currentBand < 1) {
      newErrors.currentBand = 'Please select your current level'
    }
    if (stepIndex === 2) {
      if (data.targetBand <= data.currentBand) {
        newErrors.targetBand = 'Target band must be higher than current level'
      }
    }
    if (stepIndex === 5 && data.weakSkills.length === 0) {
      newErrors.weakSkills = 'Select at least one skill to improve'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleNext() {
    if (validateStep(step)) {
      if (step === 6) {
        setStep(7)
        setGenerating(true)
        setGenError(false)
      } else {
        setStep(s => Math.min(s + 1, 7))
        if (contentRef.current) contentRef.current.scrollTop = 0
      }
    }
  }

  function handleBack() {
    if (step === 7 && generating) {
      setGenerating(false)
      setStep(6)
      return
    }
    setStep(s => Math.max(s - 1, 0))
    if (contentRef.current) contentRef.current.scrollTop = 0
  }

  const handleGenerationComplete = useCallback(async () => {
    if (genLoading) return
    setGenLoading(true)
    setGenError(false)
    try {
      await completeOnboarding(data)
      navigate('/dashboard', { replace: true })
    } catch {
      setGenError(true)
      setGenerating(false)
    } finally {
      setGenLoading(false)
    }
  }, [data, navigate, genLoading])

  function handleGenRetry() {
    setGenError(false)
    setGenerating(true)
  }

  const totalSteps = 8
  const isFirstStep = step === 0
  const isLastStep = step === 7

  const steps = [
    <StepLanguage key="lang" data={data} update={update} />,
    <StepCurrentBand key="current" data={data} update={update} />,
    <StepTargetBand key="target" data={data} update={update} />,
    <StepExamDate key="exam" data={data} update={update} />,
    <StepStudyTime key="study" data={data} update={update} />,
    <StepSkills key="skills" data={data} update={update} />,
    <StepTutorStyle key="tutor" data={data} update={update} />,
    null,
  ]

  function handleSkip() {
    navigate('/dashboard', { replace: true })
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--color-background)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--spacing-sm) var(--spacing-md)',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
          {!isFirstStep && (
            <button
              type="button"
              onClick={handleBack}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-lg)',
                border: 'none',
                background: 'none',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
              }}
              aria-label="Go back"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <span style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)' }}>
            IELTS Journey
          </span>
        </div>

        {!isLastStep && !generating && (
          <button
            type="button"
            onClick={() => setShowSkipConfirm(true)}
            style={{
              padding: 'var(--spacing-2xs) var(--spacing-sm)',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: 'none',
              color: 'var(--color-muted)',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-sm)',
            }}
          >
            Skip
          </button>
        )}
      </header>

      {showSkipConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--color-overlay)',
            padding: 'var(--spacing-md)',
          }}
          onClick={() => setShowSkipConfirm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius-2xl)',
              padding: 'var(--spacing-xl)',
              maxWidth: '360px',
              width: '100%',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)', marginBottom: 'var(--spacing-xs)' }}>
              Skip onboarding?
            </p>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
              You can set this up later in Settings. Are you sure?
            </p>
            <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
              <Button variant="secondary" fullWidth onClick={() => setShowSkipConfirm(false)}>
                Stay
              </Button>
              <Button variant="ghost" fullWidth onClick={handleSkip}>
                Skip
              </Button>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: 'var(--spacing-md) var(--spacing-md) 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-2xs)' }}>
          {Array.from({ length: totalSteps }, (_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2xs)' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: 'var(--radius-full)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 'var(--text-2xs)',
                  fontWeight: 'var(--weight-bold)',
                  fontFamily: 'var(--font-sans)',
                  transition: 'all var(--transition-normal)',
                  background: i < step ? 'var(--color-primary)' : i === step ? 'var(--color-primary)' : 'var(--color-surface-alt)',
                  color: i <= step ? 'white' : 'var(--color-muted)',
                  boxShadow: i === step ? '0 0 0 3px var(--color-primary-light)' : 'none',
                }}
                aria-label={`Step ${i + 1}${i < step ? ': completed' : ''}${i === step ? ': current' : ''}`}
              >
                {i < step ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              {i < totalSteps - 1 && (
                <div
                  style={{
                    width: step > 0 ? '12px' : '8px',
                    height: '2px',
                    borderRadius: '1px',
                    background: i < step ? 'var(--color-primary)' : 'var(--color-border)',
                    transition: 'background var(--transition-normal)',
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div
        ref={contentRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 'var(--spacing-lg) var(--spacing-md)',
          maxWidth: '480px',
          width: '100%',
          margin: '0 auto',
        }}
      >
        {generating && step === 7 ? (
          genError ? (
            <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl) 0' }}>
              <div style={{ fontSize: 'var(--text-4xl)', marginBottom: 'var(--spacing-md)' }}>⚠️</div>
              <p style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)', marginBottom: 'var(--spacing-xs)' }}>
                Generation Failed
              </p>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
                Your settings are saved. We couldn't create your study plan right now.
              </p>
              <div style={{ display: 'flex', gap: 'var(--spacing-xs)', justifyContent: 'center' }}>
                <Button variant="primary" onClick={handleGenRetry}>
                  Try Again
                </Button>
                <Button variant="secondary" onClick={() => navigate('/dashboard', { replace: true })}>
                  Go to Dashboard
                </Button>
              </div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', marginTop: 'var(--spacing-md)' }}>
                Your AI Tutor can help set up your plan later.
              </p>
            </div>
          ) : (
            <StepGenerating onComplete={handleGenerationComplete} onCancel={() => { setStep(6); setGenerating(false) }} />
          )
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)' }}>
              <span style={{ fontSize: 'var(--text-3xl)' }}>{STEP_ICONS[step]}</span>
              <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)', marginTop: 'var(--spacing-sm)' }}>
                {stepConfigs[step].title}
              </h1>
              {stepConfigs[step].subtitle && (
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-2xs)' }}>
                  {stepConfigs[step].subtitle}
                </p>
              )}
            </div>

            {steps[step]}

            {errors.currentBand && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)', marginTop: 'var(--spacing-xs)' }}>{errors.currentBand}</p>}
            {errors.targetBand && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)', marginTop: 'var(--spacing-xs)' }}>{errors.targetBand}</p>}
            {errors.weakSkills && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)', marginTop: 'var(--spacing-xs)' }}>{errors.weakSkills}</p>}

            <div style={{
              display: 'flex',
              gap: 'var(--spacing-xs)',
              marginTop: 'var(--spacing-xl)',
            }}>
              {!isFirstStep && (
                <Button variant="ghost" onClick={handleBack} fullWidth>
                  Back
                </Button>
              )}
              {!isLastStep && (
                <Button variant="primary" onClick={handleNext} fullWidth>
                  {step === 6 ? 'Generate My Plan' : 'Continue'}
                </Button>
              )}
            </div>
          </>
        )}
      </div>

      <footer
        style={{
          padding: 'var(--spacing-sm) var(--spacing-md)',
          textAlign: 'center',
          fontSize: 'var(--text-2xs)',
          color: 'var(--color-muted)',
          borderTop: '1px solid var(--color-border-light)',
        }}
      >
        Your data stays on your device · No account needed · Privacy first
      </footer>
    </div>
  )
}
