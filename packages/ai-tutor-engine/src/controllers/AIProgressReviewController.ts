import { buildLearningProgressReviewPrompt } from '../prompts/learningProgressReview'
import type { ProgressReviewData, AIProgressReviewResponse } from '../prompts/learningProgressReview'

export interface AICallFn {
  (systemPrompt: string, userPrompt: string): Promise<{ content: string | null; error: string | null }>
}

export interface ProgressReviewSuccess {
  success: true
  report: AIProgressReviewResponse
}

export interface ProgressReviewFailure {
  success: false
  error: string
  fallback: AIProgressReviewResponse
}

export type ProgressReviewResult = ProgressReviewSuccess | ProgressReviewFailure

export class AIProgressReviewController {
  constructor(private callAI: AICallFn) {}

  async generateReview(data: ProgressReviewData): Promise<ProgressReviewResult> {
    try {
      const { systemPrompt, userPrompt } = buildLearningProgressReviewPrompt(data)
      const { content, error } = await this.callAI(systemPrompt, userPrompt)

      if (error || !content) {
        const message = error || 'AI returned no content'
        console.warn('[AIProgressReviewController] AI call failed:', message)
        return { success: false, error: message, fallback: this.buildFallbackReport(data) }
      }

      const parsed = this.parseAIResponse(content)
      if (!parsed) {
        console.warn('[AIProgressReviewController] Failed to parse AI response')
        return { success: false, error: 'Failed to parse AI response', fallback: this.buildFallbackReport(data) }
      }

      return { success: true, report: parsed }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error('[AIProgressReviewController] Unexpected error:', err)
      return { success: false, error: message, fallback: this.buildFallbackReport(data) }
    }
  }

  private parseAIResponse(content: string): AIProgressReviewResponse | null {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) return null
      const parsed = JSON.parse(jsonMatch[0])
      return this.validateResponse(parsed) ? (parsed as AIProgressReviewResponse) : null
    } catch {
      return null
    }
  }

  private validateResponse(parsed: unknown): boolean {
    if (!parsed || typeof parsed !== 'object') return false
    const r = parsed as Record<string, unknown>

    const required: (keyof AIProgressReviewResponse)[] = [
      'overallSummary',
      'improvements',
      'struggles',
      'repeatedMistakes',
      'vocabularyReviewStatus',
      'skillProgress',
      'studyPlanAdherence',
      'recommendedFocus',
      'tutorFeedback',
    ]

    for (const key of required) {
      if (!(key in r)) return false
    }

    return true
  }

  private buildFallbackReport(data: ProgressReviewData): AIProgressReviewResponse {
    const weakSkills = data.weaknessReport.weakSkills.filter(w => w.severity === 'high')
    const improvingSkills = data.skillProgress.filter(s => s.trend === 'improving')

    return {
      overallSummary: `During this period, you studied for ${data.summary.totalStudyMinutes} minutes across ${data.summary.totalSessions} sessions, completing ${data.summary.totalTasksCompleted} tasks across ${data.summary.daysActive} active days.`,
      improvements: improvingSkills.length > 0
        ? improvingSkills.map(s => `${s.skill}: ${s.accuracy}% accuracy, trending up`)
        : ['Keep practicing — improvement comes with consistent effort.'],
      struggles: weakSkills.length > 0
        ? weakSkills.map(w => `${w.skill}: ${w.accuracy}% accuracy — needs focused practice`)
        : [],
      repeatedMistakes: data.weaknessReport.repeatedMistakes.map(m => ({
        pattern: m.pattern,
        skill: m.skill,
        frequency: m.frequency,
        analysis: m.suggestion,
      })),
      vocabularyReviewStatus: {
        summary: `You saved ${data.vocabularyStatus.total} words (${data.vocabularyStatus.mastered} mastered, ${data.vocabularyStatus.learning + data.vocabularyStatus.reviewing} still learning).`,
        totalSaved: data.vocabularyStatus.total,
        mastered: data.vocabularyStatus.mastered,
        stillLearning: data.vocabularyStatus.learning + data.vocabularyStatus.reviewing,
        recommendation: 'Continue reviewing vocabulary daily using spaced repetition.',
      },
      skillProgress: data.skillProgress.map(s => ({
        skill: s.skill,
        status: s.trend === 'improving' ? 'improving' : s.trend === 'declining' ? 'needs work' : 'stable',
        sessions: s.sessions,
        accuracy: s.accuracy,
        trend: s.trend,
        analysis: `${s.skill}: ${s.sessions} sessions, ${s.accuracy}% accuracy — trend is ${s.trend}.`,
      })),
      studyPlanAdherence: `You studied on ${data.summary.daysActive} active days with ${data.summary.studyConsistency.consistencyPercent}% consistency (current streak: ${data.summary.studyConsistency.currentStreak} days).`,
      recommendedFocus: data.recommendations.length > 0 ? data.recommendations : ['Focus on consistent daily practice.'],
      tutorFeedback: data.tutorFeedback,
    }
  }
}
