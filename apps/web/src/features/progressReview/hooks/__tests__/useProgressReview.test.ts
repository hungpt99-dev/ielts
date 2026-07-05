import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import type { ProgressReviewReport } from '../../components/ProgressReviewPanel'

const mockGenerateProgressReview = vi.hoisted(() => vi.fn())

vi.mock('../../services/progressReviewService', () => ({
  generateProgressReview: mockGenerateProgressReview,
}))

import { useProgressReview } from '../useProgressReview'

const mockReport: ProgressReviewReport = {
  overallSummary: 'You studied for 120 minutes.',
  improvements: ['Reading improved'],
  struggles: ['Writing needs work'],
  repeatedMistakes: [{ pattern: 'Verb tense', skill: 'grammar', frequency: 2, analysis: 'Practice more.' }],
  vocabularyReviewStatus: { summary: '20 words saved', totalSaved: 20, mastered: 5, stillLearning: 15, recommendation: 'Keep reviewing.' },
  skillProgress: [{ skill: 'Reading', status: 'improving', sessions: 5, accuracy: 80, trend: 'improving', analysis: 'Good progress.' }],
  studyPlanAdherence: 'You studied 10 of 14 days.',
  recommendedFocus: ['Focus on Writing'],
  tutorFeedback: 'Great work! Keep it up.',
}

describe('useProgressReview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns initial state with null report, false loading, and null error', () => {
    const { result } = renderHook(() => useProgressReview())

    expect(result.current.report).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.generate).toBeInstanceOf(Function)
  })

  it('sets loading to true when generate is called', async () => {
    mockGenerateProgressReview.mockImplementation(() => new Promise(() => {}))

    const { result } = renderHook(() => useProgressReview())

    act(() => {
      result.current.generate({ start: '2026-07-01', end: '2026-07-07' })
    })

    expect(result.current.loading).toBe(true)
    expect(result.current.report).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('updates report when generate completes successfully', async () => {
    mockGenerateProgressReview.mockResolvedValue({ report: mockReport, error: null })

    const { result } = renderHook(() => useProgressReview())

    act(() => {
      result.current.generate({ start: '2026-07-01', end: '2026-07-07' })
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.report).toEqual(mockReport)
    expect(result.current.error).toBeNull()
  })

  it('sets error when service returns an error with no report', async () => {
    mockGenerateProgressReview.mockResolvedValue({ report: null, error: 'AI API key not configured' })

    const { result } = renderHook(() => useProgressReview())

    act(() => {
      result.current.generate({ start: '2026-07-01', end: '2026-07-07' })
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.report).toBeNull()
    expect(result.current.error).toBe('AI API key not configured')
  })

  it('sets both report and error when service returns partial error', async () => {
    mockGenerateProgressReview.mockResolvedValue({ report: mockReport, error: 'AI response could not be parsed' })

    const { result } = renderHook(() => useProgressReview())

    act(() => {
      result.current.generate({ start: '2026-07-01', end: '2026-07-07' })
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.report).toEqual(mockReport)
    expect(result.current.error).toBe('AI response could not be parsed')
  })

  it('handles exceptions from the service', async () => {
    mockGenerateProgressReview.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useProgressReview())

    act(() => {
      result.current.generate({ start: '2026-07-01', end: '2026-07-07' })
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.report).toBeNull()
    expect(result.current.error).toBe('Network error')
  })

  it('handles non-Error exceptions from the service', async () => {
    mockGenerateProgressReview.mockRejectedValue('Unknown failure')

    const { result } = renderHook(() => useProgressReview())

    act(() => {
      result.current.generate({ start: '2026-07-01', end: '2026-07-07' })
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.report).toBeNull()
    expect(result.current.error).toBe('Failed to generate progress review')
  })

  it('resets previous state when generate is called again', async () => {
    mockGenerateProgressReview
      .mockResolvedValueOnce({ report: mockReport, error: null })
      .mockResolvedValueOnce({ report: null, error: 'New error' })

    const { result } = renderHook(() => useProgressReview())

    act(() => {
      result.current.generate({ start: '2026-07-01', end: '2026-07-07' })
    })

    await waitFor(() => {
      expect(result.current.report).toEqual(mockReport)
    })

    act(() => {
      result.current.generate({ start: '2026-07-08', end: '2026-07-14' })
    })

    expect(result.current.loading).toBe(true)
    expect(result.current.report).toBeNull()
    expect(result.current.error).toBeNull()

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.report).toBeNull()
    expect(result.current.error).toBe('New error')
  })
})
