import { LocalTutorStorage } from '../storage/LocalTutorStorage'
import type { ProactiveSuggestion, TutorMemory, SavedAiNote, ExerciseResult, WritingFeedbackRecord } from '../../models/aiTutorModels'

function daysBetween(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24))
}

function isRecentlyGenerated(title: string, existing: ProactiveSuggestion[]): boolean {
  return existing.some(s => s.title === title)
}

export class SuggestionEngine {
  private async analyzeMistakePatterns(
    memory: TutorMemory,
    existing: ProactiveSuggestion[],
  ): Promise<Omit<ProactiveSuggestion, 'id' | 'createdAt'>[]> {
    const results: Omit<ProactiveSuggestion, 'id' | 'createdAt'>[] = []

    for (const pattern of memory.repeatedMistakePatterns.slice(0, 3)) {
      const title = `Practice: ${pattern.pattern}`
      if (isRecentlyGenerated(title, existing)) continue
      results.push({
        type: 'weakness-practice',
        title,
        description: pattern.suggestion || `You often make ${pattern.pattern} mistakes. Let's do some practice exercises!`,
        action: pattern.skill === 'grammar' ? 'teach-me' : 'quiz-me',
        actionLabel: 'Practice Now',
        skill: pattern.skill,
        isAccepted: false,
        isDismissed: false,
      })
    }

    const weakSkills = [...new Set(memory.weakPoints.map(w => w.skill))]
    for (const skill of weakSkills.slice(0, 2)) {
      const title = `Improve Your ${skill.charAt(0).toUpperCase() + skill.slice(1)}`
      if (isRecentlyGenerated(title, existing)) continue
      const weakCount = memory.weakPoints.filter(w => w.skill === skill).length
      results.push({
        type: 'weakness-practice',
        title,
        description: `You identified ${weakCount} weak area${weakCount > 1 ? 's' : ''} in ${skill}. Let's work on improving!`,
        action: 'practice-with-me',
        actionLabel: 'Start Practice',
        skill,
        isAccepted: false,
        isDismissed: false,
      })
    }

    return results
  }

  private async analyzeSavedVocabulary(
    savedNotes: SavedAiNote[],
    existing: ProactiveSuggestion[],
  ): Promise<Omit<ProactiveSuggestion, 'id' | 'createdAt'>[]> {
    const results: Omit<ProactiveSuggestion, 'id' | 'createdAt'>[] = []
    const vocabNotes = savedNotes.filter(n => n.type === 'vocabulary')

    if (vocabNotes.length < 3) return results

    const title = 'Review Saved Vocabulary'
    if (isRecentlyGenerated(title, existing)) return results

    const tags = [...new Set(vocabNotes.flatMap(n => n.tags || []))].slice(0, 3)
    results.push({
      type: 'vocabulary-review',
      title,
      description: `You saved ${vocabNotes.length} vocabulary items${tags.length > 0 ? ` about ${tags.join(', ')}` : ''}. Let's review and practice them!`,
      action: 'quiz-me',
      actionLabel: 'Review Now',
      isAccepted: false,
      isDismissed: false,
    })

    return results
  }

  private async analyzeExamDate(
    memory: TutorMemory,
    existing: ProactiveSuggestion[],
  ): Promise<Omit<ProactiveSuggestion, 'id' | 'createdAt'>[]> {
    const results: Omit<ProactiveSuggestion, 'id' | 'createdAt'>[] = []
    if (!memory.examDate) return results

    const daysUntilExam = daysBetween(new Date(memory.examDate), new Date())
    if (daysUntilExam <= 0) return results

    if (daysUntilExam <= 7) {
      const title = 'Exam Week — Final Preparation!'
      if (isRecentlyGenerated(title, existing)) return results
      results.push({
        type: 'exam-prep',
        title,
        description: `Your IELTS exam is in ${daysUntilExam} day${daysUntilExam > 1 ? 's' : ''}. Focus on mock tests, review your weak areas, and rest well before the big day!`,
        action: 'practice-with-me',
        actionLabel: 'Start Mock Test',
        skill: 'exam-strategy',
        isAccepted: false,
        isDismissed: false,
      })
    } else if (daysUntilExam <= 30) {
      const title = `Exam in ${daysUntilExam} Days`
      if (isRecentlyGenerated(title, existing)) return results
      results.push({
        type: 'exam-prep',
        title,
        description: `Your IELTS exam is ${daysUntilExam} days away. Let's create a focused study plan targeting Writing Task 2 and your weak areas.`,
        action: 'practice-with-me',
        actionLabel: 'Start Prep',
        isAccepted: false,
        isDismissed: false,
      })
    } else if (daysUntilExam <= 60) {
      const title = 'Exam Preparation Phase'
      if (!isRecentlyGenerated(title, existing)) {
        results.push({
          type: 'exam-prep',
          title,
          description: `You have ${daysUntilExam} days until your IELTS exam. Consistent daily practice now will make a big difference!`,
          action: 'practice-with-me',
          actionLabel: 'Study Now',
          isAccepted: false,
          isDismissed: false,
        })
      }
    }

    return results
  }

  private async analyzeStudyConsistency(
    memory: TutorMemory,
    existing: ProactiveSuggestion[],
  ): Promise<Omit<ProactiveSuggestion, 'id' | 'createdAt'>[]> {
    const results: Omit<ProactiveSuggestion, 'id' | 'createdAt'>[] = []
    if (!memory.lastStudyDate) return results

    const daysSinceStudy = daysBetween(new Date(), new Date(memory.lastStudyDate))
    if (daysSinceStudy <= 2) return results

    const title = daysSinceStudy > 7 ? "Let's Get Back on Track!" : 'Time to Study!'
    if (isRecentlyGenerated(title, existing)) return results

    results.push({
      type: 'custom',
      title,
      description: daysSinceStudy > 7
        ? `It's been ${daysSinceStudy} days since your last study session. Don't worry — every day is a fresh start! Let's begin with a short review.`
        : `It's been ${daysSinceStudy} days since your last study session. A little practice each day makes a big difference for IELTS!`,
      action: 'practice-with-me',
      actionLabel: 'Start Learning',
      isAccepted: false,
      isDismissed: false,
    })

    return results
  }

  private async analyzeExerciseResults(
    exerciseResults: ExerciseResult[],
    existing: ProactiveSuggestion[],
  ): Promise<Omit<ProactiveSuggestion, 'id' | 'createdAt'>[]> {
    const results: Omit<ProactiveSuggestion, 'id' | 'createdAt'>[] = []
    if (exerciseResults.length === 0) return results

    const recent = exerciseResults.slice(-5).filter(r => r.total > 0 && r.score / r.total < 0.7)
    if (recent.length < 2) return results

    const topics = [...new Set(recent.map(r => r.topic))]
    const title = topics.length > 0
      ? `Review: ${topics.slice(0, 2).join(' & ')}`
      : 'Review Recent Exercises'

    if (isRecentlyGenerated(title, existing)) return results

    results.push({
      type: 'mistake-review',
      title,
      description: `You scored below 70% on ${recent.length} recent exercise${recent.length > 1 ? 's' : ''}${topics.length > 0 ? ` about ${topics.slice(0, 3).join(', ')}` : ''}. Let's review the correct answers and strengthen your understanding!`,
      action: 'teach-me',
      actionLabel: 'Review Now',
      skill: topics[0],
      isAccepted: false,
      isDismissed: false,
    })

    return results
  }

  private async analyzeWritingFeedback(
    writingFeedbacks: WritingFeedbackRecord[],
    existing: ProactiveSuggestion[],
  ): Promise<Omit<ProactiveSuggestion, 'id' | 'createdAt'>[]> {
    const results: Omit<ProactiveSuggestion, 'id' | 'createdAt'>[] = []
    if (writingFeedbacks.length === 0) return results

    const title = 'Review Writing Feedback'
    if (isRecentlyGenerated(title, existing)) return results

    const hasGrammarIssues = writingFeedbacks.some(f => f.grammarIssues.length > 0)
    const hasVocabIssues = writingFeedbacks.some(f => f.vocabularyIssues.length > 0)

    if (hasGrammarIssues || hasVocabIssues) {
      const issues: string[] = []
      if (hasGrammarIssues) issues.push('grammar')
      if (hasVocabIssues) issues.push('vocabulary')
      results.push({
        type: 'mistake-review',
        title,
        description: `Your writing feedback shows ${issues.join(' and ')} areas to improve. Reviewing feedback regularly helps you avoid repeated mistakes!`,
        action: 'teach-me',
        actionLabel: 'View Feedback',
        skill: 'writing',
        isAccepted: false,
        isDismissed: false,
      })
    }

    return results
  }

  private async analyzeSavedContent(
    savedNotes: SavedAiNote[],
    existing: ProactiveSuggestion[],
  ): Promise<Omit<ProactiveSuggestion, 'id' | 'createdAt'>[]> {
    const results: Omit<ProactiveSuggestion, 'id' | 'createdAt'>[] = []
    const contentNotes = savedNotes.filter(n => n.type === 'note' && n.content.length > 50)

    if (contentNotes.length === 0) return results

    const title = 'Practice with Saved Content'
    if (isRecentlyGenerated(title, existing)) return results

    results.push({
      type: 'article-practice',
      title,
      description: `You saved ${contentNotes.length} piece${contentNotes.length > 1 ? 's' : ''} of content. Let's turn them into reading or speaking practice!`,
      action: 'make-exercise',
      actionLabel: 'Use Content',
      skill: 'reading',
      isAccepted: false,
      isDismissed: false,
    })

    return results
  }

  async generateSuggestions(): Promise<ProactiveSuggestion[]> {
    const storage = LocalTutorStorage

    const [memory, existing, savedNotes, exerciseResults, writingFeedbacks] = await Promise.all([
      storage.loadMemory(),
      storage.getAllSuggestions(),
      storage.getAllSavedNotes(),
      storage.getAllExerciseResults(),
      storage.getAllWritingFeedbacks(),
    ])

    const candidates = await Promise.all([
      this.analyzeMistakePatterns(memory, existing),
      this.analyzeSavedVocabulary(savedNotes, existing),
      this.analyzeExamDate(memory, existing),
      this.analyzeStudyConsistency(memory, existing),
      this.analyzeExerciseResults(exerciseResults, existing),
      this.analyzeWritingFeedback(writingFeedbacks, existing),
      this.analyzeSavedContent(savedNotes, existing),
    ])

    const allCandidates = candidates.flat()

    const saved: ProactiveSuggestion[] = []
    for (const c of allCandidates.slice(0, 5)) {
      const suggestion = await storage.addSuggestion(c)
      saved.push(suggestion)
    }

    return saved
  }

  async getPendingSuggestions(): Promise<ProactiveSuggestion[]> {
    const pending = await LocalTutorStorage.getPendingSuggestions()
    if (pending.length < 3) {
      const generated = await this.generateSuggestions()
      return [...pending, ...generated]
    }
    return pending
  }

  async acceptSuggestion(id: string): Promise<void> {
    await LocalTutorStorage.acceptSuggestion(id)
    const memory = await LocalTutorStorage.loadMemory()
    memory.acceptedRecommendations += 1
    await LocalTutorStorage.saveMemory(memory)
  }

  async dismissSuggestion(id: string): Promise<void> {
    await LocalTutorStorage.dismissSuggestion(id)
  }
}

export const suggestionEngine = new SuggestionEngine()
