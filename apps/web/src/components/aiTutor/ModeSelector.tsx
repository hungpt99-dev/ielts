import { useId } from 'react'
import type { AssistantMode } from '../../types'

interface ModeSelectorProps {
  selectedMode: AssistantMode
  onModeChange: (mode: AssistantMode) => void
  disabled?: boolean
}

interface ModeOption {
  mode: AssistantMode
  label: string
  icon: string
  description: string
}

const MODE_OPTIONS: ModeOption[] = [
  {
    mode: 'friendly-chat',
    label: 'Friendly Chat',
    icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
    description: 'Casual conversation with learning connection',
  },
  {
    mode: 'ielts-tutor',
    label: 'IELTS Tutor',
    icon: '🎓',
    description: 'Full IELTS teaching and guidance',
  },
  {
    mode: 'speaking-partner',
    label: 'Speaking Partner',
    icon: '🗣️',
    description: 'Practice IELTS speaking with feedback',
  },
  {
    mode: 'writing-coach',
    label: 'Writing Coach',
    icon: '✍️',
    description: 'Writing help from ideas to band scores',
  },
  {
    mode: 'grammar-teacher',
    label: 'Grammar Teacher',
    icon: '📚',
    description: 'Grammar explanations and exercises',
  },
  {
    mode: 'vocabulary-coach',
    label: 'Vocabulary Coach',
    icon: '📖',
    description: 'Build and practice your vocabulary',
  },
  {
    mode: 'reading-explainer',
    label: 'Reading Explainer',
    icon: '📰',
    description: 'Discuss articles and reading passages',
  },
  {
    mode: 'listening-coach',
    label: 'Listening Coach',
    icon: '🎧',
    description: 'Work with transcripts and listening',
  },
  {
    mode: 'study-planner',
    label: 'Study Planner',
    icon: '📅',
    description: 'Plan your IELTS study journey',
  },
  {
    mode: 'motivation-coach',
    label: 'Motivation Coach',
    icon: '⭐',
    description: 'Stay motivated and on track',
  },
  {
    mode: 'socratic-tutor',
    label: 'Socratic Tutor',
    icon: '🔍',
    description: 'Learn through guided questions',
  },
]

export default function ModeSelector({ selectedMode, onModeChange, disabled }: ModeSelectorProps) {
  const labelId = useId()

  return (
    <div role="radiogroup" aria-labelledby={labelId}>
      <h3
        id={labelId}
        className="mb-3 text-sm font-semibold uppercase tracking-wide"
        style={{ color: 'var(--color-muted)' }}
      >
        Assistant Mode
      </h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {MODE_OPTIONS.map(({ mode, label, icon, description }) => {
          const isSelected = selectedMode === mode
          return (
            <button
              key={mode}
              role="radio"
              aria-checked={isSelected}
              aria-label={label}
              disabled={disabled}
              onClick={() => onModeChange(mode)}
              className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
                  : 'border-transparent bg-transparent hover:border-slate-300 hover:bg-slate-50 dark:hover:border-slate-600 dark:hover:bg-slate-800/50'
              }`}
            >
              {icon.startsWith('M') ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                </svg>
              ) : (
                <span className="text-2xl" aria-hidden="true">{icon}</span>
              )}
              <span
                className={`text-xs font-medium leading-tight ${
                  isSelected
                    ? 'text-blue-700 dark:text-blue-300'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {label}
              </span>
              <span className="text-[10px] leading-tight text-slate-400 dark:text-slate-500">
                {description}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
