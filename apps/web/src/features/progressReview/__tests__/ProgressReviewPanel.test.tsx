import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ProgressReviewPanel, {
  TrendBadge,
  SkillProgressSection,
  VocabSection,
  RepeatedMistakesCard,
  RecommendationsList,
  TutorFeedbackCard,
} from '../components/ProgressReviewPanel'
import type { ProgressReviewReport } from '../components/ProgressReviewPanel'
import type { DateRange } from '../components/DateRangeSelector'

const mockReport: ProgressReviewReport = {
  overallSummary: 'During this period, you studied for 120 minutes across 8 sessions, completing 5 tasks across 6 active days.',
  improvements: ['Reading: 75% accuracy, showing improvement', 'Vocabulary: 20 words mastered'],
  struggles: ['Writing: 45% accuracy \u2014 needs more practice'],
  repeatedMistakes: [
    { pattern: 'Incorrect verb tense', skill: 'grammar', frequency: 3, analysis: 'Focus on present perfect vs past simple.' },
  ],
  vocabularyReviewStatus: {
    summary: 'You saved 30 words (15 mastered, 15 still learning).',
    totalSaved: 30,
    mastered: 15,
    stillLearning: 15,
    recommendation: 'Continue reviewing vocabulary daily using spaced repetition.',
  },
  skillProgress: [
    { skill: 'Reading', status: 'improving', sessions: 5, accuracy: 75, trend: 'improving', analysis: 'Reading: 5 sessions, 75% accuracy \u2014 trend is improving.' },
    { skill: 'Writing', status: 'needs work', sessions: 2, accuracy: 45, trend: 'declining', analysis: 'Writing: 2 sessions, 45% accuracy \u2014 trend is declining.' },
  ],
  studyPlanAdherence: 'You studied on 6 active days with 60% consistency (current streak: 3 days).',
  recommendedFocus: ['Focus on Writing skills \u2014 your weakest area.', 'Improve study consistency. Aim for daily practice.'],
  tutorFeedback: 'Great work on maintaining a consistent study routine! Your vocabulary growth is strong. Remember, IELTS preparation is a marathon, not a sprint.',
}

function defaultProps(overrides?: Partial<React.ComponentProps<typeof ProgressReviewPanel>>) {
  return {
    report: null,
    loading: false,
    error: null,
    onGenerate: vi.fn(),
    ...overrides,
  }
}

describe('ProgressReviewPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the header and description', () => {
    render(<ProgressReviewPanel {...defaultProps()} />)
    expect(screen.getByText('AI Learning Progress Review')).toBeInTheDocument()
    expect(
      screen.getByText('Get a detailed analysis of your study progress with personalized tutor feedback.'),
    ).toBeInTheDocument()
  })

  it('renders the date range selector', () => {
    render(<ProgressReviewPanel {...defaultProps()} />)
    expect(screen.getByRole('group', { name: 'Review period selector' })).toBeInTheDocument()
  })

  it('renders empty state when no report, not loading, not error, and not yet generated', () => {
    render(<ProgressReviewPanel {...defaultProps()} />)
    expect(screen.getByText('No Progress Report Yet')).toBeInTheDocument()
    expect(
      screen.getByText(/Select a period and click/),
    ).toBeInTheDocument()
  })

  it('renders loading spinner when loading', () => {
    render(<ProgressReviewPanel {...defaultProps({ loading: true })} />)
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument()
    expect(screen.getByText(/Analyzing your study data/)).toBeInTheDocument()
  })

  it('renders error state with retry button', () => {
    const onGenerate = vi.fn()
    render(
      <ProgressReviewPanel
        {...defaultProps({ error: 'API key not configured', onGenerate })}
      />,
    )
    expect(screen.getByText('Failed to Generate Report')).toBeInTheDocument()
    expect(screen.getByText('API key not configured')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Try Again'))
    expect(onGenerate).toHaveBeenCalledTimes(1)
  })

  it('renders all report sections when report is provided', () => {
    render(<ProgressReviewPanel {...defaultProps({ report: mockReport })} />)
    const sections = [
      'Overall Learning Summary',
      'What You Improved',
      'What You Still Struggle With',
      'Repeated Mistakes',
      'Vocabulary Review Status',
      'Skill-by-Skill Progress',
      'Study Plan Adherence',
      'Recommended Focus for Next Period',
      "Tutor's Feedback",
    ]
    for (const section of sections) {
      expect(screen.getByText(section)).toBeInTheDocument()
    }
  })

  it('renders overall summary content', () => {
    render(<ProgressReviewPanel {...defaultProps({ report: mockReport })} />)
    expect(screen.getByText(mockReport.overallSummary)).toBeInTheDocument()
  })

  it('renders improvements list', () => {
    render(<ProgressReviewPanel {...defaultProps({ report: mockReport })} />)
    expect(screen.getByText(mockReport.improvements[0])).toBeInTheDocument()
    expect(screen.getByText(mockReport.improvements[1])).toBeInTheDocument()
  })

  it('renders struggles list', () => {
    render(<ProgressReviewPanel {...defaultProps({ report: mockReport })} />)
    expect(screen.getByText(mockReport.struggles[0])).toBeInTheDocument()
  })

  it('renders repeated mistakes', () => {
    render(<ProgressReviewPanel {...defaultProps({ report: mockReport })} />)
    expect(
      screen.getByText(`"${mockReport.repeatedMistakes[0].pattern}"`),
    ).toBeInTheDocument()
    expect(
      screen.getByText(mockReport.repeatedMistakes[0].analysis),
    ).toBeInTheDocument()
  })

  it('renders vocabulary stats', () => {
    render(<ProgressReviewPanel {...defaultProps({ report: mockReport })} />)
    expect(screen.getByText(mockReport.vocabularyReviewStatus.summary)).toBeInTheDocument()
    expect(screen.getByText('Total Saved')).toBeInTheDocument()
    expect(screen.getByText('Mastered')).toBeInTheDocument()
    expect(screen.getByText('Still Learning')).toBeInTheDocument()
  })

  it('renders skill progress items', () => {
    render(<ProgressReviewPanel {...defaultProps({ report: mockReport })} />)
    expect(screen.getByText('Reading')).toBeInTheDocument()
    expect(screen.getByText('Writing')).toBeInTheDocument()
  })

  it('renders study plan adherence', () => {
    render(<ProgressReviewPanel {...defaultProps({ report: mockReport })} />)
    expect(screen.getByText(mockReport.studyPlanAdherence)).toBeInTheDocument()
  })

  it('renders recommended focus list', () => {
    render(<ProgressReviewPanel {...defaultProps({ report: mockReport })} />)
    expect(screen.getByText(mockReport.recommendedFocus[0])).toBeInTheDocument()
    expect(screen.getByText(mockReport.recommendedFocus[1])).toBeInTheDocument()
  })

  it('renders tutor feedback', () => {
    render(<ProgressReviewPanel {...defaultProps({ report: mockReport })} />)
    expect(screen.getByText('AI Tutor Says')).toBeInTheDocument()
    expect(screen.getByText(mockReport.tutorFeedback)).toBeInTheDocument()
  })

  it('renders regenerate button when report is visible', () => {
    render(<ProgressReviewPanel {...defaultProps({ report: mockReport })} />)
    expect(screen.getByText('Regenerate Report')).toBeInTheDocument()
  })

  it('calls onGenerate when Generate button is clicked', () => {
    const onGenerate = vi.fn()
    render(<ProgressReviewPanel {...defaultProps({ onGenerate })} />)
    fireEvent.click(screen.getByText('Generate Progress Report'))
    expect(onGenerate).toHaveBeenCalledTimes(1)
    const range = onGenerate.mock.calls[0][0] as DateRange
    expect(range.start).toBeTruthy()
    expect(range.end).toBeTruthy()
  })

  it('calls onGenerate when Regenerate Report is clicked', () => {
    const onGenerate = vi.fn()
    render(
      <ProgressReviewPanel
        {...defaultProps({ report: mockReport, onGenerate })}
      />,
    )
    fireEvent.click(screen.getByText('Regenerate Report'))
    expect(onGenerate).toHaveBeenCalledTimes(1)
  })

  it('has correct aria-region for accessibility', () => {
    render(<ProgressReviewPanel {...defaultProps()} />)
    expect(
      screen.getByRole('region', { name: 'AI Learning Progress Review' }),
    ).toBeInTheDocument()
  })
})

describe('TrendBadge', () => {
  it('renders improving label', () => {
    render(<TrendBadge trend="improving" />)
    expect(screen.getByText('\u2191 Improving')).toBeInTheDocument()
  })

  it('renders declining label', () => {
    render(<TrendBadge trend="declining" />)
    expect(screen.getByText('\u2193 Declining')).toBeInTheDocument()
  })

  it('renders stable label', () => {
    render(<TrendBadge trend="stable" />)
    expect(screen.getByText('\u2192 Stable')).toBeInTheDocument()
  })

  it('renders unknown trend as-is', () => {
    render(<TrendBadge trend="unknown" />)
    expect(screen.getByText('unknown')).toBeInTheDocument()
  })
})

describe('RepeatedMistakesCard', () => {
  it('renders mistakes list', () => {
    const mistakes = [
      { pattern: 'Verb tense error', skill: 'grammar', frequency: 3, analysis: 'Practice present perfect.' },
      { pattern: 'Article misuse', skill: 'grammar', frequency: 2, analysis: 'Review article rules.' },
    ]
    render(<RepeatedMistakesCard mistakes={mistakes} />)
    expect(screen.getByText('"Verb tense error"')).toBeInTheDocument()
    expect(screen.getByText('"Article misuse"')).toBeInTheDocument()
  })

  it('renders empty message when no mistakes', () => {
    render(<RepeatedMistakesCard mistakes={[]} />)
    expect(
      screen.getByText('No repeated mistakes detected in this period.'),
    ).toBeInTheDocument()
  })
})

describe('SkillProgressSection', () => {
  it('renders skill items with accuracy and sessions', () => {
    const skills = [
      { skill: 'Reading', status: 'improving', sessions: 5, accuracy: 80, trend: 'improving', analysis: 'Good progress.' },
    ]
    render(<SkillProgressSection skills={skills} />)
    expect(screen.getByText('Reading')).toBeInTheDocument()
    expect(screen.getByText('5 sessions')).toBeInTheDocument()
    expect(screen.getByText('80% accuracy')).toBeInTheDocument()
  })

  it('renders empty message when no skills', () => {
    render(<SkillProgressSection skills={[]} />)
    expect(
      screen.getByText('No skill practice recorded in this period.'),
    ).toBeInTheDocument()
  })
})

describe('VocabSection', () => {
  it('renders vocabulary stats', () => {
    const vocab = {
      summary: 'You saved 20 words.',
      totalSaved: 20,
      mastered: 8,
      stillLearning: 12,
      recommendation: 'Review daily.',
    }
    render(<VocabSection vocab={vocab} />)
    expect(screen.getByText('20')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('Review daily.')).toBeInTheDocument()
  })

  it('handles zero total gracefully', () => {
    const vocab = {
      summary: 'No words saved.',
      totalSaved: 0,
      mastered: 0,
      stillLearning: 0,
      recommendation: 'Start saving words.',
    }
    render(<VocabSection vocab={vocab} />)
    expect(screen.getByText('0% mastered')).toBeInTheDocument()
  })
})

describe('RecommendationsList', () => {
  it('renders recommendations as ordered list', () => {
    render(<RecommendationsList items={['Focus on Writing', 'Practice daily']} />)
    expect(screen.getByText('Focus on Writing')).toBeInTheDocument()
    expect(screen.getByText('Practice daily')).toBeInTheDocument()
    expect(
      screen.getByRole('list', { name: 'Recommended focus areas' }),
    ).toBeInTheDocument()
  })

  it('renders empty message when no recommendations', () => {
    render(<RecommendationsList items={[]} />)
    expect(
      screen.getByText('No specific recommendations available.'),
    ).toBeInTheDocument()
  })
})

describe('TutorFeedbackCard', () => {
  it('renders feedback with AI Tutor label', () => {
    render(<TutorFeedbackCard feedback="Keep up the great work!" />)
    expect(screen.getByText('AI Tutor Says')).toBeInTheDocument()
    expect(screen.getByText('Keep up the great work!')).toBeInTheDocument()
  })
})

describe('ProgressReviewPanel Integration', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-05T12:00:00Z'))
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('flows through states: empty -> loading -> report', () => {
    const onGenerate = vi.fn()
    const { rerender } = render(
      <ProgressReviewPanel
        report={null}
        loading={false}
        error={null}
        onGenerate={onGenerate}
      />,
    )

    expect(screen.getByText('No Progress Report Yet')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Generate Progress Report'))
    expect(onGenerate).toHaveBeenCalledTimes(1)

    rerender(
      <ProgressReviewPanel
        report={null}
        loading={true}
        error={null}
        onGenerate={onGenerate}
      />,
    )

    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument()

    rerender(
      <ProgressReviewPanel
        report={mockReport}
        loading={false}
        error={null}
        onGenerate={onGenerate}
      />,
    )

    expect(screen.getByText('Overall Learning Summary')).toBeInTheDocument()
    expect(screen.getByText(mockReport.overallSummary)).toBeInTheDocument()
  })

  it('flows through: empty -> error -> retry -> loading -> report', () => {
    const onGenerate = vi.fn()
    const { rerender } = render(
      <ProgressReviewPanel
        report={null}
        loading={false}
        error={null}
        onGenerate={onGenerate}
      />,
    )

    fireEvent.click(screen.getByText('Generate Progress Report'))

    rerender(
      <ProgressReviewPanel
        report={null}
        loading={false}
        error={'API error'}
        onGenerate={onGenerate}
      />,
    )

    expect(screen.getByText('Failed to Generate Report')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Try Again'))
    expect(onGenerate).toHaveBeenCalledTimes(2)

    rerender(
      <ProgressReviewPanel
        report={null}
        loading={true}
        error={null}
        onGenerate={onGenerate}
      />,
    )

    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument()

    rerender(
      <ProgressReviewPanel
        report={mockReport}
        loading={false}
        error={null}
        onGenerate={onGenerate}
      />,
    )

    expect(screen.getByText(mockReport.overallSummary)).toBeInTheDocument()
  })
})
