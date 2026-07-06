import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ProgressReviewPanel, {
  TrendArrow,
  SkillProgressTable,
  VocabSection,
  RepeatedMistakesList,
  RecommendationsList,
  TutorFeedbackCard,
} from '../components/ProgressReviewPanel'
import type { ProgressReviewReport } from '../components/ProgressReviewPanel'
import type { DateRange } from '../components/DateRangeSelector'

const mockReport: ProgressReviewReport = {
  overallSummary: 'During this period, you studied for 120 minutes across 8 sessions, completing 5 tasks across 6 active days.',
  improvements: ['Reading: 75% accuracy, showing improvement', 'Vocabulary: 20 words mastered'],
  struggles: ['Writing: 45% accuracy — needs more practice'],
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
    { skill: 'Reading', status: 'improving', sessions: 5, accuracy: 75, trend: 'improving', analysis: 'Reading: 5 sessions, 75% accuracy — trend is improving.' },
    { skill: 'Writing', status: 'needs work', sessions: 2, accuracy: 45, trend: 'declining', analysis: 'Writing: 2 sessions, 45% accuracy — trend is declining.' },
  ],
  studyPlanAdherence: 'You studied on 6 active days with 60% consistency (current streak: 3 days).',
  recommendedFocus: ['Focus on Writing skills — your weakest area.', 'Improve study consistency. Aim for daily practice.'],
  tutorFeedback: 'Great work on maintaining a consistent study routine! Your vocabulary growth is strong. Remember, IELTS preparation is a marathon, not a sprint.',
}

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
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
    renderWithRouter(<ProgressReviewPanel {...defaultProps()} />)
    expect(screen.getByText('AI Progress Review')).toBeInTheDocument()
    expect(
      screen.getByText('Your personalized learning analysis from your AI Tutor'),
    ).toBeInTheDocument()
  })

  it('renders the date range selector', () => {
    renderWithRouter(<ProgressReviewPanel {...defaultProps()} />)
    expect(screen.getByRole('group', { name: 'Review period selector' })).toBeInTheDocument()
  })

  it('renders empty state when no report, not loading, not error, and not yet generated', () => {
    renderWithRouter(<ProgressReviewPanel {...defaultProps()} />)
    expect(screen.getByText('Ready for Your Progress Review?')).toBeInTheDocument()
  })

  it('renders loading skeleton when loading', () => {
    const { container } = renderWithRouter(<ProgressReviewPanel {...defaultProps({ loading: true })} />)
    const skeleton = container.querySelector('[role="status"]')
    expect(skeleton).toBeTruthy()
  })

  it('renders error state with retry button', () => {
    const onGenerate = vi.fn()
    renderWithRouter(
      <ProgressReviewPanel
        {...defaultProps({ error: 'API key not configured', onGenerate })}
      />,
    )
    expect(screen.getByText("Couldn't Generate Your Review")).toBeInTheDocument()
    expect(screen.getByText('API key not configured')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Try Again'))
    expect(onGenerate).toHaveBeenCalledTimes(1)
  })

  it('renders overall summary content', () => {
    renderWithRouter(<ProgressReviewPanel {...defaultProps({ report: mockReport })} />)
    expect(screen.getByText(mockReport.overallSummary)).toBeInTheDocument()
  })

  it('renders repeated mistakes', () => {
    renderWithRouter(<ProgressReviewPanel {...defaultProps({ report: mockReport })} />)
    expect(
      screen.getByText(`"${mockReport.repeatedMistakes[0].pattern}"`),
    ).toBeInTheDocument()
  })

  it('renders vocabulary stats', () => {
    renderWithRouter(<ProgressReviewPanel {...defaultProps({ report: mockReport })} />)
    expect(screen.getByText('Total Saved')).toBeInTheDocument()
    expect(screen.getByText('Mastered')).toBeInTheDocument()
    expect(screen.getByText('Still Learning')).toBeInTheDocument()
  })

  it('renders skill progress items', () => {
    renderWithRouter(<ProgressReviewPanel {...defaultProps({ report: mockReport })} />)
    expect(screen.getByText('Reading')).toBeInTheDocument()
    expect(screen.getByText('Writing')).toBeInTheDocument()
  })

  it('renders study plan adherence', () => {
    renderWithRouter(<ProgressReviewPanel {...defaultProps({ report: mockReport })} />)
    expect(screen.getByText(mockReport.studyPlanAdherence)).toBeInTheDocument()
  })

  it('renders recommended focus list', () => {
    renderWithRouter(<ProgressReviewPanel {...defaultProps({ report: mockReport })} />)
    expect(screen.getByText(mockReport.recommendedFocus[0])).toBeInTheDocument()
    expect(screen.getByText(mockReport.recommendedFocus[1])).toBeInTheDocument()
  })

  it('renders tutor feedback', () => {
    renderWithRouter(<ProgressReviewPanel {...defaultProps({ report: mockReport })} />)
    expect(screen.getByText('AI Tutor Says')).toBeInTheDocument()
    expect(screen.getByText(mockReport.tutorFeedback)).toBeInTheDocument()
  })

  it('calls onGenerate when Generate button is clicked', () => {
    const onGenerate = vi.fn()
    renderWithRouter(<ProgressReviewPanel {...defaultProps({ onGenerate })} />)
    fireEvent.click(screen.getByText('Generate AI Progress Report'))
    expect(onGenerate).toHaveBeenCalledTimes(1)
    const range = onGenerate.mock.calls[0][0] as DateRange
    expect(range.start).toBeTruthy()
    expect(range.end).toBeTruthy()
  })

  it('has correct aria-region for accessibility', () => {
    renderWithRouter(<ProgressReviewPanel {...defaultProps()} />)
    expect(
      screen.getByRole('region', { name: 'AI Progress Review' }),
    ).toBeInTheDocument()
  })
})

describe('TrendArrow', () => {
  it('renders improving label', () => {
    render(<TrendArrow trend="improving" />)
    expect(screen.getByLabelText('Trend: improving')).toBeInTheDocument()
  })

  it('renders declining label', () => {
    render(<TrendArrow trend="declining" />)
    expect(screen.getByLabelText('Trend: declining')).toBeInTheDocument()
  })

  it('renders stable label', () => {
    render(<TrendArrow trend="stable" />)
    expect(screen.getByLabelText('Trend: stable')).toBeInTheDocument()
  })
})

describe('RepeatedMistakesList', () => {
  it('renders mistakes list', () => {
    const mistakes = [
      { pattern: 'Verb tense error', skill: 'grammar', frequency: 3, analysis: 'Practice present perfect.' },
      { pattern: 'Article misuse', skill: 'grammar', frequency: 2, analysis: 'Review article rules.' },
    ]
    render(<RepeatedMistakesList mistakes={mistakes} />)
    expect(screen.getByText('"Verb tense error"')).toBeInTheDocument()
    expect(screen.getByText('"Article misuse"')).toBeInTheDocument()
  })

  it('renders empty message when no mistakes', () => {
    render(<RepeatedMistakesList mistakes={[]} />)
    expect(
      screen.getByText('No repeated mistakes detected in this period.'),
    ).toBeInTheDocument()
  })
})

describe('SkillProgressTable', () => {
  it('renders skill items with accuracy and sessions', () => {
    const skills = [
      { skill: 'Reading', status: 'improving', sessions: 5, accuracy: 80, trend: 'improving', analysis: 'Good progress.' },
    ]
    render(<SkillProgressTable skills={skills} />)
    expect(screen.getByText('Reading')).toBeInTheDocument()
    expect(screen.getByText('5 sessions')).toBeInTheDocument()
  })

  it('renders empty message when no skills', () => {
    render(<SkillProgressTable skills={[]} />)
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
    expect(screen.getByText("AI Tutor's Final Note")).toBeInTheDocument()
    expect(screen.getByText('Keep up the great work!')).toBeInTheDocument()
  })
})

describe('ProgressReviewPanel Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders empty state then transitions to report', () => {
    const onGenerate = vi.fn()
    const { rerender } = render(
      <MemoryRouter>
        <ProgressReviewPanel
          report={null}
          loading={false}
          error={null}
          onGenerate={onGenerate}
        />
      </MemoryRouter>,
    )

    expect(screen.getByText('Ready for Your Progress Review?')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Generate AI Progress Report'))
    expect(onGenerate).toHaveBeenCalledTimes(1)

    rerender(
      <MemoryRouter>
        <ProgressReviewPanel
          report={mockReport}
          loading={false}
          error={null}
          onGenerate={onGenerate}
        />
      </MemoryRouter>,
    )

    expect(screen.getByText(mockReport.overallSummary)).toBeInTheDocument()
  })

  it('renders error state then retry then report', () => {
    const onGenerate = vi.fn()
    const { rerender } = render(
      <MemoryRouter>
        <ProgressReviewPanel
          report={null}
          loading={false}
          error={'API error'}
          onGenerate={onGenerate}
        />
      </MemoryRouter>,
    )

    expect(screen.getByText("Couldn't Generate Your Review")).toBeInTheDocument()

    fireEvent.click(screen.getByText('Try Again'))
    expect(onGenerate).toHaveBeenCalledTimes(1)

    rerender(
      <MemoryRouter>
        <ProgressReviewPanel
          report={mockReport}
          loading={false}
          error={null}
          onGenerate={onGenerate}
        />
      </MemoryRouter>,
    )

    expect(screen.getByText(mockReport.overallSummary)).toBeInTheDocument()
  })
})
