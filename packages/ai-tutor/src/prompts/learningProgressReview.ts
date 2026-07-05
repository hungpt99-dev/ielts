interface PromptVersion {
  version: number
  description: string
}

const PROMPT_VERSION: PromptVersion = {
  version: 1,
  description: 'Initial AI Learning Progress Review report prompt',
}

export interface SkillProgress {
  skill: 'reading' | 'listening' | 'writing' | 'speaking' | 'vocabulary' | 'grammar'
  sessions: number
  totalMinutes: number
  accuracy: number
  trend: 'improving' | 'declining' | 'stable'
}

export interface WeakSkill {
  skill: 'reading' | 'listening' | 'writing' | 'speaking' | 'vocabulary' | 'grammar'
  accuracy: number
  sessionCount: number
  severity: 'low' | 'medium' | 'high'
}

export interface RepeatedMistake {
  pattern: string
  skill: string
  frequency: number
  suggestion: string
}

export interface WeaknessReport {
  weakSkills: WeakSkill[]
  repeatedMistakes: RepeatedMistake[]
  frequentMistakeCategories: { skill: string; totalMistakes: number; unresolvedCount: number; resolvedCount: number }[]
}

export interface StudyConsistency {
  currentStreak: number
  longestStreak: number
  totalStudyDays: number
  consistencyPercent: number
  weeklyHistory: { date: string; studied: boolean; minutes: number }[]
}

export interface VocabularyStatus {
  total: number
  new: number
  learning: number
  reviewing: number
  mastered: number
}

export interface ReviewSummary {
  totalStudyMinutes: number
  totalTasksCompleted: number
  totalSessions: number
  daysActive: number
  totalVocabularySaved: number
  totalVocabularyMastered: number
  totalMistakes: number
  resolvedMistakes: number
  studyConsistency: StudyConsistency
}

export interface ProgressReviewData {
  dateRange: { start: string; end: string }
  summary: ReviewSummary
  skillProgress: SkillProgress[]
  weaknessReport: WeaknessReport
  vocabularyStatus: VocabularyStatus
  progressTrend: 'improving' | 'declining' | 'stable' | 'insufficient_data'
  recommendations: string[]
  tutorFeedback: string
}

export interface AIProgressReviewResponse {
  overallSummary: string
  improvements: string[]
  struggles: string[]
  repeatedMistakes: {
    pattern: string
    skill: string
    frequency: number
    analysis: string
  }[]
  vocabularyReviewStatus: {
    summary: string
    totalSaved: number
    mastered: number
    stillLearning: number
    recommendation: string
  }
  skillProgress: {
    skill: string
    status: string
    sessions: number
    accuracy: number
    trend: string
    analysis: string
  }[]
  studyPlanAdherence: string
  recommendedFocus: string[]
  tutorFeedback: string
}

export const LEARNING_PROGRESS_REVIEW_RESPONSE_SCHEMA: Record<string, unknown> = {
  type: 'object',
  properties: {
    overallSummary: {
      type: 'string',
      description: 'A concise overall summary of the user\'s learning progress during this period, covering what they studied, how much time they spent, and general observations.',
    },
    improvements: {
      type: 'array',
      items: { type: 'string' },
      description: 'List of specific areas where the user has shown clear improvement during this review period.',
    },
    struggles: {
      type: 'array',
      items: { type: 'string' },
      description: 'List of specific areas or skills the user still struggles with and needs to focus on.',
    },
    repeatedMistakes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          pattern: { type: 'string', description: 'Description of the mistake pattern.' },
          skill: { type: 'string', description: 'The skill area this mistake belongs to.' },
          frequency: { type: 'number', description: 'How many times this mistake pattern appeared.' },
          analysis: { type: 'string', description: 'Tutor analysis of why this mistake happens and how to fix it.' },
        },
      },
    },
    vocabularyReviewStatus: {
      type: 'object',
      properties: {
        summary: { type: 'string', description: 'Plain-language summary of the user\'s vocabulary learning progress.' },
        totalSaved: { type: 'number' },
        mastered: { type: 'number' },
        stillLearning: { type: 'number' },
        recommendation: { type: 'string', description: 'Specific advice on vocabulary study for the next period.' },
      },
    },
    skillProgress: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          skill: { type: 'string', enum: ['reading', 'listening', 'writing', 'speaking'] },
          status: { type: 'string', description: 'e.g. "improving", "needs work", "strong", "insufficient practice"' },
          sessions: { type: 'number' },
          accuracy: { type: 'number' },
          trend: { type: 'string', enum: ['improving', 'declining', 'stable'] },
          analysis: { type: 'string', description: 'Detailed tutor analysis for this skill.' },
        },
      },
    },
    studyPlanAdherence: {
      type: 'string',
      description: 'Assessment of whether the user is following their study plan well, with specific observations.',
    },
    recommendedFocus: {
      type: 'array',
      items: { type: 'string' },
      description: 'Top 3-5 recommended focus areas for the next study period, prioritized by impact.',
    },
    tutorFeedback: {
      type: 'string',
      description: 'Encouraging, personalized tutor-style feedback that motivates the user to continue studying.',
    },
  },
  required: [
    'overallSummary',
    'improvements',
    'struggles',
    'repeatedMistakes',
    'vocabularyReviewStatus',
    'skillProgress',
    'studyPlanAdherence',
    'recommendedFocus',
    'tutorFeedback',
  ],
}

function formatSkillProgressSection(skillProgress: SkillProgress[]): string {
  if (skillProgress.length === 0) return '  No skill practice data recorded in this period.'
  return skillProgress
    .map(s => {
      const trendIcon = s.trend === 'improving' ? '↑' : s.trend === 'declining' ? '↓' : '→'
      return `  - ${s.skill.charAt(0).toUpperCase() + s.skill.slice(1)}: ${s.sessions} session(s), ${Math.round(s.totalMinutes)} min, ${s.accuracy}% accuracy (${trendIcon} ${s.trend})`
    })
    .join('\n')
}

function formatWeaknessSection(weaknessReport: WeaknessReport): string {
  const parts: string[] = []

  if (weaknessReport.weakSkills.length > 0) {
    const weakLines = weaknessReport.weakSkills
      .filter(w => w.severity === 'high' || w.severity === 'medium')
      .map(w => `  - ${w.skill} (accuracy: ${w.accuracy}%, severity: ${w.severity}, sessions: ${w.sessionCount})`)
    if (weakLines.length > 0) {
      parts.push('Weak areas:')
      parts.push(weakLines.join('\n'))
    }
  }

  if (weaknessReport.repeatedMistakes.length > 0) {
    const mistakeLines = weaknessReport.repeatedMistakes.map(m =>
      `  - "${m.pattern}" (skill: ${m.skill}, frequency: ${m.frequency}x) — suggestion: ${m.suggestion}`,
    )
    parts.push('Repeated mistake patterns:')
    parts.push(mistakeLines.join('\n'))
  }

  return parts.join('\n') || '  No significant weak areas detected.'
}

function formatVocabularySection(vocabularyStatus: VocabularyStatus): string {
  return [
    `  Total vocabulary saved: ${vocabularyStatus.total}`,
    `  New: ${vocabularyStatus.new}`,
    `  Learning: ${vocabularyStatus.learning}`,
    `  Reviewing: ${vocabularyStatus.reviewing}`,
    `  Mastered: ${vocabularyStatus.mastered}`,
  ].join('\n')
}

function formatSummarySection(summary: ReviewSummary): string {
  const c = summary.studyConsistency
  return [
    `  Study period: ${summary.daysActive} active days out of review period`,
    `  Total study time: ${summary.totalStudyMinutes} minutes`,
    `  Sessions completed: ${summary.totalSessions}`,
    `  Tasks completed: ${summary.totalTasksCompleted}`,
    `  Study streak: ${c.currentStreak} days (longest: ${c.longestStreak})`,
    `  Consistency: ${c.consistencyPercent}%`,
    `  Total mistakes recorded: ${summary.totalMistakes} (resolved: ${summary.resolvedMistakes})`,
  ].join('\n')
}

export function buildLearningProgressReviewPrompt(
  data: ProgressReviewData,
): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `You are an experienced IELTS tutor reviewing a student's learning progress. Your role is to analyze their study data thoroughly and provide honest, constructive, and encouraging feedback — just like a real tutor would.

Guidelines:
- Be specific and reference actual numbers and trends from the data.
- Be encouraging but honest — if the student is slacking, say so constructively.
- Write in a warm, professional tutor tone (use "you").
- Provide actionable, specific advice for the next study period.
- Do NOT repeat the raw data back as-is — interpret and analyze it.

You must respond with valid JSON only, matching the schema provided below. No other text outside the JSON.`

  const userPrompt = `Generate a detailed AI Learning Progress Review report for the student based on their study data below.

## Study Period
From: ${data.dateRange.start}
To: ${data.dateRange.end}

## Learning Summary
${formatSummarySection(data.summary)}

## Skill-by-Skill Progress
${formatSkillProgressSection(data.skillProgress)}

Overall progress trend: ${data.progressTrend}

## Weakness & Mistake Analysis
${formatWeaknessSection(data.weaknessReport)}

## Vocabulary Status
${formatVocabularySection(data.vocabularyStatus)}

## Auto-generated Recommendations
${data.recommendations.length > 0 ? data.recommendations.map(r => `  - ${r}`).join('\n') : '  (none generated)'}

## Auto-generated Tutor Feedback (raw — analyze and expand on this)
${data.tutorFeedback}

---

Now, acting as the student's personal IELTS tutor, generate a comprehensive progress report covering ALL of the following sections:

1. **Overall Summary** — A clear, concise paragraph summarizing the student's learning during this period.
2. **What Improved** — Specific skills, habits, or areas where the student made progress.
3. **What Still Needs Work** — Areas where the student continues to struggle or has not practiced enough.
4. **Repeated Mistakes** — Review each repeated mistake pattern, explain why it matters, and how to overcome it.
5. **Vocabulary Review Status** — Assess the student's vocabulary journey: how many words saved, how many mastered, and what they should do next.
6. **Skill-by-Skill Progress** — For each of Listening, Reading, Writing, and Speaking that has data: assess performance, accuracy, trend, and give specific advice.
7. **Study Plan Adherence** — Based on consistency, active days, and streak, evaluate whether the student is sticking to their plan.
8. **Recommended Focus for Next Period** — Prioritized list of 3-5 specific actions or areas to focus on.
9. **Tutor Feedback** — A warm, personalized, encouraging message from the tutor to close the review.

Respond with valid JSON in this exact format:
${JSON.stringify(LEARNING_PROGRESS_REVIEW_RESPONSE_SCHEMA, null, 2)}`

  return { systemPrompt, userPrompt }
}

export function getVersionInfo(): PromptVersion {
  return PROMPT_VERSION
}
