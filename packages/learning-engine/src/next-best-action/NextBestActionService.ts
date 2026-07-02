import type { NextBestAction, StudySkill, WeakSkill, DueReviews } from '../types'

/**
 * Priority scale (1-10):
 *  10 = imminent exam mock test
 *   7 = start-streak prompt, top weak-skill practice
 *   5 = fallback daily practice
 *   3-7 = vocabulary review (based on count)
 *   2-5 = mistake review (based on count)
 */
export class NextBestActionService {
  calculateNextBestActions(
    weakSkills: WeakSkill[],
    dueReviews: DueReviews,
    profile: { studyStreak: number; examCountdownDays: number | null },
  ): NextBestAction[] {
    const actions: NextBestAction[] = []

    if (profile.examCountdownDays !== null && profile.examCountdownDays <= 7) {
      actions.push({
        actionType: 'mock-test',
        skill: null,
        title: 'Take a mock test',
        description: 'Your exam is soon. Practice with a full mock test.',
        priority: 10,
        reason: `Only ${profile.examCountdownDays} days until exam`,
      })
    }

    if (dueReviews.totalDue > 0) {
      actions.push({
        actionType: 'vocabulary-review',
        skill: 'vocabulary',
        title: 'Review vocabulary',
        description: `${dueReviews.vocabularyDue.length} vocabulary items need review.`,
        priority: this.calculatePriority(dueReviews.totalDue, 3, 7),
        reason: `${dueReviews.totalDue} items due for spaced repetition review`,
      })
    }

    if (dueReviews.mistakesDue.length > 0) {
      actions.push({
        actionType: 'mistake-review',
        skill: this.getMistakeSkill(dueReviews),
        title: 'Review mistakes',
        description: `${dueReviews.mistakesDue.length} mistakes need attention.`,
        priority: this.calculatePriority(dueReviews.mistakesDue.length, 2, 5),
        reason: 'Reviewing mistakes prevents them from becoming habits',
      })
    }

    const topWeak = weakSkills.filter(w => w.severity === 'high').slice(0, 2)
    for (const weak of topWeak) {
      const practiceType = this.weakSkillToPracticeType(weak.skill)
      actions.push({
        actionType: practiceType,
        skill: weak.skill,
        title: `Practice ${weak.skill}`,
        description: `Your ${weak.skill} accuracy is ${weak.accuracy}%. Focus on improving this skill.`,
        priority: this.calculatePriority(Math.round((100 - weak.accuracy) / 10), 5, 8),
        reason: `${weak.skill} is a weak area (${weak.severity} severity)`,
      })
    }

    if (profile.studyStreak === 0) {
      actions.push({
        actionType: 'daily-lesson',
        skill: null,
        title: 'Start your study streak',
        description: 'Begin with a short 15-minute session.',
        priority: 7,
        reason: 'Build a daily study habit',
      })
    }

    if (actions.length === 0) {
      actions.push({
        actionType: 'exercise',
        skill: 'reading',
        title: 'Daily practice',
        description: 'Keep up your progress with a practice exercise.',
        priority: 5,
        reason: 'Consistent daily practice yields the best results',
      })
    }

    return actions.sort((a, b) => b.priority - a.priority)
  }

  /** Clamp a raw count/score into [minPrio, maxPrio] priority range */
  private calculatePriority(value: number, minPrio: number, maxPrio: number): number {
    return Math.min(maxPrio, Math.max(minPrio, value))
  }

  private getMistakeSkill(dueReviews: DueReviews): StudySkill {
    const skillCount = new Map<StudySkill, number>()
    for (const m of dueReviews.mistakesDue) {
      const s = m.mistake.skill as StudySkill
      skillCount.set(s, (skillCount.get(s) || 0) + 1)
    }
    let topSkill: StudySkill = 'grammar'
    let maxCount = 0
    for (const [skill, count] of skillCount) {
      if (count > maxCount) {
        maxCount = count
        topSkill = skill
      }
    }
    return topSkill
  }

  private weakSkillToPracticeType(weakSkill: StudySkill): NextBestAction['actionType'] {
    const map: Record<StudySkill, NextBestAction['actionType']> = {
      reading: 'reading-practice',
      listening: 'listening-practice',
      writing: 'writing-practice',
      speaking: 'speaking-practice',
      vocabulary: 'vocabulary-review',
      grammar: 'exercise',
    }
    return map[weakSkill] || 'exercise'
  }
}
