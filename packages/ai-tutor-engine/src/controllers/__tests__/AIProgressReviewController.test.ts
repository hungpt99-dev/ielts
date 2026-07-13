import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AIProgressReviewController } from '../AIProgressReviewController'
import type { ProgressReviewData } from '../../prompts/learningProgressReview'

function makeMinimalData(overrides?: Partial<ProgressReviewData>): ProgressReviewData {
  return {
    dateRange: { start: '2026-06-01', end: '2026-06-30' },
    summary: {
      totalStudyMinutes: 480,
      totalTasksCompleted: 12,
      totalSessions: 18,
      daysActive: 20,
      totalVocabularySaved: 50,
      totalVocabularyMastered: 10,
      totalMistakes: 8,
      resolvedMistakes: 5,
      studyConsistency: {
        currentStreak: 5,
        longestStreak: 12,
        totalStudyDays: 20,
        consistencyPercent: 67,
        weeklyHistory: [],
      },
    },
    skillProgress: [
      { skill: 'reading', sessions: 6, totalMinutes: 180, accuracy: 72, trend: 'improving' },
      { skill: 'listening', sessions: 5, totalMinutes: 150, accuracy: 65, trend: 'stable' },
      { skill: 'writing', sessions: 3, totalMinutes: 90, accuracy: 58, trend: 'improving' },
      { skill: 'speaking', sessions: 2, totalMinutes: 60, accuracy: 60, trend: 'declining' },
    ],
    weaknessReport: {
      weakSkills: [
        { skill: 'speaking', accuracy: 55, sessionCount: 2, severity: 'high' },
        { skill: 'writing', accuracy: 60, sessionCount: 3, severity: 'medium' },
        { skill: 'reading', accuracy: 80, sessionCount: 6, severity: 'low' },
      ],
      repeatedMistakes: [
        { pattern: 'Incorrect article usage', skill: 'writing', frequency: 5, suggestion: 'Review definite and indefinite articles' },
        { pattern: 'Misunderstanding time expressions', skill: 'listening', frequency: 3, suggestion: 'Practice time-related dialogues' },
      ],
      frequentMistakeCategories: [
        { skill: 'writing', totalMistakes: 10, unresolvedCount: 4, resolvedCount: 6 },
      ],
    },
    vocabularyStatus: { total: 50, new: 15, learning: 20, reviewing: 10, mastered: 5 },
    progressTrend: 'improving',
    recommendations: [
      'Practice speaking more frequently',
      'Review article usage in writing',
    ],
    tutorFeedback: 'You are making great progress! Focus on speaking practice.',
    ...overrides,
  }
}

function validAIJson(): string {
  return JSON.stringify({
    overallSummary: 'You studied 480 minutes this month with consistent effort.',
    improvements: ['Reading comprehension improved from 65% to 72%'],
    struggles: ['Speaking fluency still needs work'],
    repeatedMistakes: [
      { pattern: 'Article misuse', skill: 'writing', frequency: 5, analysis: 'Focus on definite vs indefinite articles' },
    ],
    vocabularyReviewStatus: {
      summary: 'You saved 50 words, 5 mastered',
      totalSaved: 50,
      mastered: 5,
      stillLearning: 30,
      recommendation: 'Review daily',
    },
    skillProgress: [
      { skill: 'reading', status: 'improving', sessions: 6, accuracy: 72, trend: 'improving', analysis: 'Strong progress' },
    ],
    studyPlanAdherence: 'You studied 20 out of 30 days — good consistency',
    recommendedFocus: ['Speaking drills', 'Article review'],
    tutorFeedback: 'Keep up the great work!',
  })
}

describe('AIProgressReviewController', () => {
  let controller: AIProgressReviewController
  let callAI: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    callAI = vi.fn()
    controller = new AIProgressReviewController(callAI)
  })

  describe('generateReview', () => {
    it('returns success with parsed report when AI returns valid JSON', async () => {
      callAI.mockResolvedValue({ content: validAIJson(), error: null })
      const data = makeMinimalData()
      const result = await controller.generateReview(data)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.report.overallSummary).toBe('You studied 480 minutes this month with consistent effort.')
        expect(result.report.improvements).toHaveLength(1)
        expect(result.report.struggles).toHaveLength(1)
        expect(result.report.repeatedMistakes).toHaveLength(1)
        expect(result.report.skillProgress).toHaveLength(1)
        expect(result.report.recommendedFocus).toHaveLength(2)
        expect(result.report.tutorFeedback).toBe('Keep up the great work!')
      }
    })

    it('extracts JSON when content has surrounding text', async () => {
      callAI.mockResolvedValue({ content: `Here is your report:\n${validAIJson()}\n\nRegards`, error: null })
      const result = await controller.generateReview(makeMinimalData())

      expect(result.success).toBe(true)
    })

    it('calls AI with prompts from buildLearningProgressReviewPrompt', async () => {
      callAI.mockResolvedValue({ content: validAIJson(), error: null })
      await controller.generateReview(makeMinimalData())

      expect(callAI).toHaveBeenCalledTimes(1)
      const [systemPrompt, userPrompt] = callAI.mock.calls[0]
      expect(systemPrompt).toContain('IELTS tutor')
      expect(userPrompt).toContain('Generate a detailed AI Learning Progress Review report')
      expect(userPrompt).toContain('2026-06-01')
    })

    it('returns failure with fallback when AI returns an error', async () => {
      callAI.mockResolvedValue({ content: null, error: 'API rate limit exceeded' })
      const result = await controller.generateReview(makeMinimalData())

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('API rate limit exceeded')
        expect(result.fallback.overallSummary).toBeTruthy()
        expect(result.fallback.tutorFeedback).toBeTruthy()
      }
    })

    it('returns failure with fallback when AI returns no content', async () => {
      callAI.mockResolvedValue({ content: null, error: null })
      const result = await controller.generateReview(makeMinimalData())

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('AI returned no content')
        expect(result.fallback).toBeDefined()
      }
    })

    it('returns failure with fallback when AI returns unparseable text', async () => {
      callAI.mockResolvedValue({ content: 'Sorry, I cannot generate a report right now.', error: null })
      const result = await controller.generateReview(makeMinimalData())

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Failed to parse AI response')
      }
    })

    it('returns failure with fallback when JSON is missing required fields', async () => {
      const incompleteJson = JSON.stringify({ overallSummary: 'Summary only' })
      callAI.mockResolvedValue({ content: incompleteJson, error: null })
      const result = await controller.generateReview(makeMinimalData())

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Failed to parse AI response')
      }
    })

    it('returns failure with fallback when AI call throws', async () => {
      callAI.mockRejectedValue(new Error('Network failure'))
      const result = await controller.generateReview(makeMinimalData())

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Network failure')
        expect(result.fallback).toBeDefined()
      }
    })

    it('returns failure with fallback when AI call throws a non-Error', async () => {
      callAI.mockRejectedValue('string error')
      const result = await controller.generateReview(makeMinimalData())

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Unknown error')
      }
    })
  })

  describe('buildFallbackReport', () => {
    it('includes overall summary with study stats', async () => {
      callAI.mockResolvedValue({ content: null, error: 'error' })
      const data = makeMinimalData()
      const result = await controller.generateReview(data) as { success: false; fallback: { overallSummary: string } }

      expect(result.fallback.overallSummary).toContain('480 minutes')
      expect(result.fallback.overallSummary).toContain('18 sessions')
      expect(result.fallback.overallSummary).toContain('12 tasks')
      expect(result.fallback.overallSummary).toContain('20 active days')
    })

    it('maps improving skills to improvements', async () => {
      callAI.mockResolvedValue({ content: null, error: 'error' })
      const result = await controller.generateReview(makeMinimalData()) as { success: false; fallback: { improvements: string[] } }

      expect(result.fallback.improvements).toHaveLength(2)
      expect(result.fallback.improvements[0]).toContain('reading')
      expect(result.fallback.improvements[1]).toContain('writing')
    })

    it('shows default improvement message when no improving skills', async () => {
      callAI.mockResolvedValue({ content: null, error: 'error' })
      const data = makeMinimalData({
        skillProgress: [
          { skill: 'reading', sessions: 1, totalMinutes: 30, accuracy: 60, trend: 'declining' },
        ],
      })
      const result = await controller.generateReview(data) as { success: false; fallback: { improvements: string[] } }

      expect(result.fallback.improvements).toEqual(['Keep practicing — improvement comes with consistent effort.'])
    })

    it('maps high-severity weak skills to struggles', async () => {
      callAI.mockResolvedValue({ content: null, error: 'error' })
      const result = await controller.generateReview(makeMinimalData()) as { success: false; fallback: { struggles: string[] } }

      expect(result.fallback.struggles).toHaveLength(1)
      expect(result.fallback.struggles[0]).toContain('speaking')
    })

    it('returns empty struggles when no high-severity weaknesses', async () => {
      callAI.mockResolvedValue({ content: null, error: 'error' })
      const data = makeMinimalData({
        weaknessReport: {
          ...makeMinimalData().weaknessReport,
          weakSkills: [
            { skill: 'reading', accuracy: 80, sessionCount: 6, severity: 'low' },
          ],
        },
      })
      const result = await controller.generateReview(data) as { success: false; fallback: { struggles: string[] } }

      expect(result.fallback.struggles).toHaveLength(0)
    })

    it('builds repeatedMistakes from weakness report', async () => {
      callAI.mockResolvedValue({ content: null, error: 'error' })
      const result = await controller.generateReview(makeMinimalData()) as { success: false; fallback: { repeatedMistakes: Array<{ pattern: string; skill: string; frequency: number; analysis: string }> } }

      expect(result.fallback.repeatedMistakes).toHaveLength(2)
      expect(result.fallback.repeatedMistakes[0].pattern).toBe('Incorrect article usage')
      expect(result.fallback.repeatedMistakes[0].analysis).toBe('Review definite and indefinite articles')
    })

    it('uses default recommendedFocus when no recommendations provided', async () => {
      callAI.mockResolvedValue({ content: null, error: 'error' })
      const data = makeMinimalData({ recommendations: [] })
      const result = await controller.generateReview(data) as { success: false; fallback: { recommendedFocus: string[] } }

      expect(result.fallback.recommendedFocus).toEqual(['Focus on consistent daily practice.'])
    })
  })
})
