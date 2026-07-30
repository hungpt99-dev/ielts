import { useState } from 'react'
import Card, { CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import type { AICoachFeedback, BandScore } from '../types'
import BandVisualization from './BandVisualization'
import VocabularyPanel from './VocabularyPanel'
import GrammarFeedback from './GrammarFeedback'

interface AICoachPanelProps {
  feedback: AICoachFeedback | null
  loading: boolean
  error: string | null
  transcript: string
  bandScore?: BandScore | null
}

interface CollapsibleSectionProps {
  isOpen: boolean
  onToggle: () => void
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}

function CollapsibleSection({ isOpen, onToggle, title, icon, children }: CollapsibleSectionProps) {
  return (
    <Card className="overflow-hidden">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-[var(--color-surface-alt)]"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center" style={{ color: 'var(--color-muted)' }}>
            {icon}
          </span>
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            {title}
          </span>
        </div>
        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          style={{ color: 'var(--color-muted)' }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="border-t px-4 pb-4" style={{ borderColor: 'var(--color-border-light)' }}>
          {children}
        </div>
      )}
    </Card>
  )
}

export default function AICoachPanel({ feedback, loading, error, transcript, bandScore }: AICoachPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    feedback: true,
    strengths: true,
    areasToImprove: true,
    bandBreakdown: true,
    vocabulary: false,
    grammar: false,
    fluency: false,
    pronunciation: false,
    taskAchievement: false,
  })

  function toggleSection(key: string) {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent>
            <div className="flex flex-col items-center py-8">
              <div className="mb-4 flex items-center gap-3">
                <div
                  className="h-8 w-8 animate-spin rounded-full"
                  style={{
                    borderWidth: '3px',
                    borderColor: 'var(--color-primary)',
                    borderTopColor: 'transparent',
                  }}
                />
                <span className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>
                  Analyzing your response...
                </span>
              </div>
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="h-2 w-2 animate-pulse rounded-full"
                    style={{
                      backgroundColor: 'var(--color-primary)',
                      animationDelay: `${i * 0.2}s`,
                      opacity: 0.4,
                    }}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardContent>
              <div className="space-y-3">
                <div
                  className="h-4 w-2/3 animate-pulse rounded"
                  style={{ backgroundColor: 'var(--color-skeleton)' }}
                />
                <div
                  className="h-3 w-full animate-pulse rounded"
                  style={{ backgroundColor: 'var(--color-skeleton)' }}
                />
                <div
                  className="h-3 w-4/5 animate-pulse rounded"
                  style={{ backgroundColor: 'var(--color-skeleton)' }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <div className="py-4 text-center">
            <p className="text-sm font-medium" style={{ color: 'var(--color-danger)' }}>
              {error}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!feedback && !transcript.trim()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Coach</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center py-8 text-center">
            <svg className="mb-3 h-10 w-10" style={{ color: 'var(--color-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
            <p className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>
              AI Coach waiting
            </p>
            <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>
              Record your answer to receive AI-powered feedback on your speaking performance.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!feedback) return null

  return (
    <div className="space-y-4">
      <Card variant="elevated" padding="lg">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
            Estimated Band Score
          </p>
          <p
            className="mt-1 text-5xl font-bold"
            style={{ color: 'var(--color-primary)' }}
          >
            {feedback.estimatedBand.toFixed(1)}
          </p>
          <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>
            IELTS Speaking Band
          </p>
        </div>
      </Card>

      <CollapsibleSection
        isOpen={expandedSections.bandBreakdown}
        onToggle={() => toggleSection('bandBreakdown')}
        title="Band Breakdown"
        icon={
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
        }
      >
        <BandVisualization
          fluency={bandScore?.fluency ?? feedback.estimatedBand}
          vocabulary={bandScore?.vocabulary ?? feedback.estimatedBand}
          grammar={bandScore?.grammar ?? feedback.estimatedBand}
          pronunciation={bandScore?.pronunciation ?? feedback.estimatedBand}
          coherence={bandScore?.coherence ?? feedback.estimatedBand}
        />
      </CollapsibleSection>

      <CollapsibleSection
        isOpen={expandedSections.feedback}
        onToggle={() => toggleSection('feedback')}
        title="Overall Feedback"
        icon={
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
        }
      >
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text)' }}>
          {feedback.overallFeedback}
        </p>
      </CollapsibleSection>

      {feedback.strengths.length > 0 && (
        <CollapsibleSection
          isOpen={expandedSections.strengths}
          onToggle={() => toggleSection('strengths')}
          title="Strengths"
          icon={
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        >
          <ul className="space-y-2">
            {feedback.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--color-success)' }}>
                <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                {s}
              </li>
            ))}
          </ul>
        </CollapsibleSection>
      )}

      {feedback.areasToImprove.length > 0 && (
        <CollapsibleSection
          isOpen={expandedSections.areasToImprove}
          onToggle={() => toggleSection('areasToImprove')}
          title="Areas to Improve"
          icon={
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077l1.41-.513m14.095-5.13l1.41-.513M5.106 17.785l1.15-.964m11.49-9.642l1.149-.964M7.501 19.795l.75-1.3m7.5-12.99l.75-1.3m-6.063 16.658l.26-1.477m2.605-14.772l.26-1.477m0 17.726l-.26-1.477M10.698 4.614l-.26-1.477M16.5 19.794l-.75-1.299M7.5 4.205L12 12m6.894 5.785l-1.149-.964M6.256 7.178l-1.15-.964m15.352 8.864l-1.41-.513M4.954 9.435l-1.41-.514M12.002 12l-3.75 6.495" />
            </svg>
          }
        >
          <ul className="space-y-2">
            {feedback.areasToImprove.map((a, i) => (
              <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--color-warning)' }}>
                <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                {a}
              </li>
            ))}
          </ul>
        </CollapsibleSection>
      )}

      {feedback.grammarCorrections.length > 0 && (
        <CollapsibleSection
          isOpen={expandedSections.grammar}
          onToggle={() => toggleSection('grammar')}
          title="Grammar Corrections"
          icon={
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
          }
        >
          <GrammarFeedback corrections={feedback.grammarCorrections} />
        </CollapsibleSection>
      )}

      {feedback.vocabularySuggestions.length > 0 && (
        <CollapsibleSection
          isOpen={expandedSections.vocabulary}
          onToggle={() => toggleSection('vocabulary')}
          title="Vocabulary Suggestions"
          icon={
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          }
        >
          <VocabularyPanel suggestions={feedback.vocabularySuggestions} />
        </CollapsibleSection>
      )}

      {feedback.fluencyFeedback && (
        <CollapsibleSection
          isOpen={expandedSections.fluency}
          onToggle={() => toggleSection('fluency')}
          title="Fluency Feedback"
          icon={
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        >
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text)' }}>
            {feedback.fluencyFeedback}
          </p>
        </CollapsibleSection>
      )}

      {feedback.pronunciationFeedback && (
        <CollapsibleSection
          isOpen={expandedSections.pronunciation}
          onToggle={() => toggleSection('pronunciation')}
          title="Pronunciation Feedback"
          icon={
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
            </svg>
          }
        >
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text)' }}>
            {feedback.pronunciationFeedback}
          </p>
        </CollapsibleSection>
      )}

      {feedback.taskAchievementFeedback && (
        <CollapsibleSection
          isOpen={expandedSections.taskAchievement}
          onToggle={() => toggleSection('taskAchievement')}
          title="Task Achievement"
          icon={
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
            </svg>
          }
        >
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text)' }}>
            {feedback.taskAchievementFeedback}
          </p>
        </CollapsibleSection>
      )}
    </div>
  )
}
