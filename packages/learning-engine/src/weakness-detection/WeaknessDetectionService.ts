import type {
  MistakeEntry,
  ReadingPracticeSession,
  ListeningPracticeSession,
  WritingSession,
  SpeakingSession,
} from '@ielts/storage'
import type {
  WeaknessReport,
  WeakSkill,
  RepeatedMistake,
  MistakeCategorySummary,
  StudySkill,
} from '../types'

export class WeaknessDetectionService {
  getWeaknessReport(
    mistakes: MistakeEntry[],
    readingPractices: ReadingPracticeSession[],
    listeningPractices: ListeningPracticeSession[],
    writingSessions: WritingSession[],
    speakingSessions: SpeakingSession[],
  ): WeaknessReport {
    return {
      weakSkills: this.detectWeakSkills(readingPractices, listeningPractices, writingSessions, speakingSessions),
      repeatedMistakes: this.detectRepeatedMistakes(mistakes),
      frequentMistakeCategories: this.getMistakeCategorySummaries(mistakes),
    }
  }

  detectWeakSkills(
    readingPractices: ReadingPracticeSession[],
    listeningPractices: ListeningPracticeSession[],
    writingSessions: WritingSession[],
    speakingSessions: SpeakingSession[],
  ): WeakSkill[] {
    const weakSkills: WeakSkill[] = []

    const rAcc = this.computePracticeAccuracy(readingPractices)
    weakSkills.push({
      skill: 'reading',
      accuracy: rAcc,
      sessionCount: readingPractices.length,
      severity: this.categorizeSeverity(rAcc),
    })

    const lAcc = this.computePracticeAccuracy(listeningPractices)
    weakSkills.push({
      skill: 'listening',
      accuracy: lAcc,
      sessionCount: listeningPractices.length,
      severity: this.categorizeSeverity(lAcc),
    })

    const wAcc = this.computeWritingAccuracy(writingSessions)
    weakSkills.push({
      skill: 'writing',
      accuracy: wAcc,
      sessionCount: writingSessions.length,
      severity: this.categorizeSeverity(wAcc),
    })

    const sAcc = this.computeSpeakingAccuracy(speakingSessions)
    weakSkills.push({
      skill: 'speaking',
      accuracy: sAcc,
      sessionCount: speakingSessions.length,
      severity: this.categorizeSeverity(sAcc),
    })

    weakSkills.push({
      skill: 'vocabulary',
      accuracy: 0,
      sessionCount: 0,
      severity: 'medium',
    })

    weakSkills.push({
      skill: 'grammar',
      accuracy: 0,
      sessionCount: 0,
      severity: 'medium',
    })

    return weakSkills.sort((a, b) => a.accuracy - b.accuracy)
  }

  detectRepeatedMistakes(mistakes: MistakeEntry[]): RepeatedMistake[] {
    const patternMap = new Map<string, { count: number; skill: StudySkill; examples: string[] }>()

    for (const m of mistakes) {
      if (m.repetitionCount < 2) continue

      const key = `${m.skill}:${m.mistake.slice(0, 40)}`
      const existing = patternMap.get(key) || { count: 0, skill: m.skill as StudySkill, examples: [] }
      existing.count += m.repetitionCount
      if (existing.examples.length < 3) {
        existing.examples.push(m.mistake)
      }
      patternMap.set(key, existing)
    }

    return Array.from(patternMap.entries())
      .filter(([_, v]) => v.count >= 2)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([_, v]) => ({
        pattern: v.examples[0] || '',
        skill: v.skill,
        frequency: v.count,
        suggestion: this.generateSuggestion(v.skill, v.examples[0] || ''),
      }))
  }

  getMistakeCategorySummaries(mistakes: MistakeEntry[]): MistakeCategorySummary[] {
    const skillMap = new Map<StudySkill, { total: number; unresolved: number; resolved: number }>()

    for (const m of mistakes) {
      const skill = m.skill as StudySkill
      if (!skillMap.has(skill)) {
        skillMap.set(skill, { total: 0, unresolved: 0, resolved: 0 })
      }
      const entry = skillMap.get(skill)!
      entry.total++
      if (m.status === 'resolved') {
        entry.resolved++
      } else {
        entry.unresolved++
      }
    }

    return Array.from(skillMap.entries()).map(([skill, data]) => ({
      skill,
      totalMistakes: data.total,
      unresolvedCount: data.unresolved,
      resolvedCount: data.resolved,
    }))
  }

  private computePracticeAccuracy(
    practices: (ReadingPracticeSession | ListeningPracticeSession)[],
  ): number {
    if (practices.length === 0) return 0
    const totalCorrect = practices.reduce((s, p) => s + (p.score || 0), 0)
    const totalQuestions = practices.reduce((s, p) => s + (p.totalQuestions || 0), 0)
    if (totalQuestions === 0) return 0
    return Math.round((totalCorrect / totalQuestions) * 100)
  }

  private computeWritingAccuracy(sessions: WritingSession[]): number {
    if (sessions.length === 0) return 0
    const avgBand = sessions.reduce((s, w) => s + (w.estimatedBand || 0), 0) / sessions.length
    return Math.round((avgBand / 9) * 100)
  }

  private computeSpeakingAccuracy(sessions: SpeakingSession[]): number {
    if (sessions.length === 0) return 0
    const avgRating = sessions.reduce((s, sp) => s + (sp.selfRating || 0), 0) / sessions.length
    return Math.round((avgRating / 10) * 100)
  }

  private categorizeSeverity(accuracy: number): 'low' | 'medium' | 'high' {
    if (accuracy >= 80) return 'low'
    if (accuracy >= 60) return 'medium'
    return 'high'
  }

  private generateSuggestion(skill: StudySkill, _mistakeExample: string): string {
    const suggestions: Record<StudySkill, string> = {
      reading: 'Practice skimming and scanning techniques. Focus on understanding question types.',
      listening: 'Practice active listening with transcripts. Focus on signpost language.',
      writing: 'Review essay structure and practice with timed writing tasks.',
      speaking: 'Practice with speaking prompts and record yourself for self-review.',
      vocabulary: 'Use spaced repetition to review vocabulary regularly.',
      grammar: 'Review grammar rules and practice with targeted exercises.',
    }
    return suggestions[skill] || 'Review the fundamentals of this skill area.'
  }
}
