import { loadAppSettings } from '../../services/storage/SettingsStorage'
import { DatabaseService } from '../../services/storage/Database'
import { loadRoadmap, getTodayTask } from '../roadmap/roadmapService'
import type { TaskEntry, VocabularyEntry, VocabReviewEntry, MistakeEntry } from '../../models'
import type { PersonalizationContext, SkillType, RecommendationReason } from '../personalization/types'
import { buildPersonalizationContext } from '../personalization/personalizationService'

export interface TutorSuggestion {
  title: string
  description: string
  skill: SkillType
  reason: RecommendationReason
  priority: 'high' | 'medium' | 'low'
  estimatedMinutes: number
  actionLabel: string
  actionPath: string
  contextExplanation: string
}

export interface ExercisePrompt {
  skill: SkillType
  topic: string
  prompt: string
  instructions: string
  wordsToUse?: string[]
  estimatedMinutes: number
}

export interface MistakeReview {
  mistake: string
  skill: string
  explanation: string
  suggestion: string
  example: string
}

export interface TutorDailyBriefing {
  greeting: string
  focusArea: string
  whyTodayMatters: string
  suggestedTasks: TutorSuggestion[]
  streakMessage: string
  weakSkillReminder: string | null
  examCountdownMessage: string | null
}

function capitalizeSkill(skill: string): SkillType {
  if (skill === 'vocabulary') return 'Vocabulary'
  if (skill === 'grammar') return 'Grammar'
  if (skill === 'reading') return 'Reading'
  if (skill === 'listening') return 'Listening'
  if (skill === 'writing') return 'Writing'
  if (skill === 'speaking') return 'Speaking'
  return skill.charAt(0).toUpperCase() + skill.slice(1) as SkillType
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10)
}

function getExamCountdown(examDate: string): number {
  if (!examDate) return 0
  const exam = new Date(examDate.slice(0, 10) + 'T00:00:00.000Z')
  if (isNaN(exam.getTime())) return 0
  const now = new Date()
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const diff = exam.getTime() - today.getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

function computeStreak(tasks: TaskEntry[]): number {
  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const doneDates = new Set(
    tasks
      .filter(t => t.isDone && t.completedAt)
      .map(t => t.completedAt!.slice(0, 10))
  )
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    if (doneDates.has(key)) {
      streak++
    } else {
      break
    }
  }
  return streak
}

export class AITutorService {
  async buildContext(): Promise<PersonalizationContext> {
    return buildPersonalizationContext()
  }

  async getDailyBriefing(ctx?: PersonalizationContext): Promise<TutorDailyBriefing> {
    const context = ctx ?? await this.buildContext()
    const settings = loadAppSettings()
    const streak = context.progress.studyStreak
    const weakSkills = context.profile.weakSkills
    const countdownDays = context.exam.countdownDays
    const todayUnfinished = context.progress.todayUnfinished
    const suggestions = this.suggestTasks(context)

    const greeting = this.buildGreeting(streak, todayUnfinished, weekDay())
    const focusArea = this.determineFocusArea(context)
    const whyTodayMatters = this.explainWhyTodayMatters(context)
    const streakMessage = this.buildStreakMessage(streak)
    const weakSkillReminder = weakSkills.length > 0
      ? `Your weak ${weakSkills.length > 1 ? 'skills are' : 'skill is'} ${weekDay() === 1 || weekDay() === 4 ? '' : ''}${weakSkills.join(' and ')}. ${context.exam.isUrgent ? 'Since your exam is near, focus on improving these areas.' : 'Make time to practice them this week.'}`
      : null
    const examCountdownMessage = countdownDays > 0
      ? countdownDays <= 7
        ? `Your IELTS exam is in ${countdownDays} day${countdownDays > 1 ? 's' : ''}! Focus on mock tests and reviewing your weak areas.`
        : countdownDays <= 30
          ? `Your IELTS exam is in ${countdownDays} days. Stay consistent with your study plan.`
          : `You have ${countdownDays} days until your IELTS exam. You have plenty of time — keep building your skills step by step.`
      : null

    return {
      greeting,
      focusArea,
      whyTodayMatters,
      suggestedTasks: suggestions,
      streakMessage,
      weakSkillReminder,
      examCountdownMessage,
    }
  }

  private buildStreakMessage(streak: number): string {
    if (streak === 0) return 'Start your IELTS journey today — every session builds momentum!'
    if (streak === 1) return '1-day streak! Great start — come back tomorrow to keep it going.'
    if (streak < 7) return `${streak}-day streak! You're building a powerful study habit.`
    if (streak < 30) return `${streak}-day streak! Consistent practice is the key to IELTS success.`
    return `${streak}-day streak! Your dedication is extraordinary. Keep shining!`
  }

  private buildGreeting(streak: number, todayUnfinished: number, dayOfWeek: number): string {
    const timeOfDay = getTimeOfDay()
    if (streak === 0 && todayUnfinished === 0) {
      return `Good ${timeOfDay}! Ready to start your IELTS journey? Every expert was once a beginner. Let's take your first step today.`
    }
    if (todayUnfinished > 0) {
      return `Good ${timeOfDay}! You have ${todayUnfinished} task${todayUnfinished > 1 ? 's' : ''} to finish from earlier. Let's get them done!`
    }
    if (streak >= 30) {
      const cheers = ['Incredible', 'Amazing', 'Outstanding', 'Remarkable']
      const cheer = cheers[Math.floor(Math.random() * cheers.length)]
      return `Good ${timeOfDay}! ${cheer} — you've studied for ${streak} consecutive days! Your consistency is truly impressive.`
    }
    if (streak >= 7) {
      return `Good ${timeOfDay}! You're on a ${streak}-day streak. Keep the momentum going!`
    }
    if (streak > 0) {
      return `Good ${timeOfDay}! You're on a ${streak}-day streak. Keep building your habit!`
    }
    return `Good ${timeOfDay}! Ready for today's IELTS practice?`
  }

  private determineFocusArea(ctx: PersonalizationContext): string {
    if (ctx.exam.isUrgent && ctx.profile.weakSkills.length > 0) {
      return `Urgent: Focus on your weakest skill — ${ctx.profile.weakSkills[0]}`
    }
    if (ctx.progress.todayUnfinished > 0) {
      const categories = [...new Set(ctx.tasks.today.map(t => t.category))]
      return `Continue your ${categories.slice(0, 2).join(' and ')} tasks`
    }
    if (ctx.roadmap.currentSkillFocus) {
      return `Today's roadmap focus: ${ctx.roadmap.currentSkillFocus}`
    }
    if (ctx.vocabulary.dueForReview > 0) {
      return `Review ${ctx.vocabulary.dueForReview} vocabulary word${ctx.vocabulary.dueForReview > 1 ? 's' : ''} due for review`
    }
    return 'Practice a skill to maintain your progress'
  }

  private explainWhyTodayMatters(ctx: PersonalizationContext): string {
    const parts: string[] = []

    if (ctx.exam.isUrgent) {
      parts.push(`Your IELTS exam is in ${ctx.exam.countdownDays} days. Every session counts.`)
    } else if (ctx.exam.countdownDays > 0) {
      parts.push(`You have ${ctx.exam.countdownDays} days until your exam. Consistent daily practice builds lasting skills.`)
    }

    if (ctx.mistakes.recent > 0) {
      parts.push(`You made ${ctx.mistakes.recent} mistake${ctx.mistakes.recent > 1 ? 's' : ''} recently — reviewing them now prevents repeated errors on test day.`)
    }

    if (ctx.vocabulary.dueForReview > 5) {
      parts.push(`You have ${ctx.vocabulary.dueForReview} vocabulary words waiting for review. Spaced repetition helps you remember them long-term.`)
    }

    if (ctx.progress.studyStreak > 0) {
      const streakBenefits = ['builds momentum', 'trains your brain for regular learning', 'creates a powerful study habit']
      parts.push(`Your ${ctx.progress.studyStreak}-day streak ${streakBenefits[ctx.progress.studyStreak % 3]}.`)
    }

    if (ctx.profile.weakSkills.length > 0 && !ctx.exam.isUrgent) {
      parts.push(`Targeting your weak area${ctx.profile.weakSkills.length > 1 ? 's' : ''} (${ctx.profile.weakSkills.join(', ')}) will improve your overall band score the most.`)
    }

    if (parts.length === 0) {
      return 'Every IELTS study session brings you closer to your target band. Let\'s make today productive!'
    }

    return parts.join(' ')
  }

  suggestTasks(ctx: PersonalizationContext): TutorSuggestion[] {
    const suggestions: TutorSuggestion[] = []
    const weakSkills = ctx.profile.weakSkills

    if (ctx.progress.todayUnfinished > 0) {
      const categories = [...new Set(ctx.tasks.today.map(t => t.category))]
      suggestions.push({
        title: `Complete Today's Task${ctx.progress.todayUnfinished > 1 ? 's' : ''}`,
        description: `You have ${ctx.progress.todayUnfinished} incomplete task${ctx.progress.todayUnfinished > 1 ? 's' : ''}: ${categories.slice(0, 3).join(', ')}. Finishing them keeps your study plan on track.`,
        skill: (categories[0] as SkillType) ?? 'Vocabulary',
        reason: 'missed_task',
        priority: 'high',
        estimatedMinutes: 15 * ctx.progress.todayUnfinished,
        actionLabel: 'Open Tasks',
        actionPath: '/plan',
        contextExplanation: `These tasks were planned for you to build consistent progress. Completing them today prevents gaps in your learning.`,
      })
    }

    if (ctx.exam.isUrgent && weakSkills.length > 0) {
      const skill = weakSkills[0]
      suggestions.push({
        title: `Urgent: Improve ${skill} Skills`,
        description: `Your exam is in ${ctx.exam.countdownDays} day${ctx.exam.countdownDays > 1 ? 's' : ''}. ${skill} is your weakest area — improving it can raise your overall band score significantly.`,
        skill,
        reason: 'exam_urgency',
        priority: 'high',
        estimatedMinutes: Math.min(30, ctx.profile.dailyStudyMinutes),
        actionLabel: `Practice ${skill}`,
        actionPath: `/${skill.toLowerCase()}`,
        contextExplanation: `IELTS examiners weigh all skills equally. Your ${skill} score has the most room for improvement, so focusing here gives you the best return on your study time.`,
      })
    }

    if (ctx.vocabulary.dueForReview > 0) {
      suggestions.push({
        title: `Review ${ctx.vocabulary.dueForReview} Vocabulary Word${ctx.vocabulary.dueForReview > 1 ? 's' : ''}`,
        description: `You have ${ctx.vocabulary.dueForReview} word${ctx.vocabulary.dueForReview > 1 ? 's' : ''} waiting for review based on your learning schedule.`,
        skill: 'Vocabulary',
        reason: 'due_review',
        priority: ctx.vocabulary.dueForReview > 10 ? 'high' : 'medium',
        estimatedMinutes: Math.min(15, ctx.vocabulary.dueForReview * 2),
        actionLabel: 'Review Now',
        actionPath: '/vocabulary',
        contextExplanation: `Spaced repetition research shows that reviewing words at the right time helps you remember them permanently. These words are due now.`,
      })
    }

    if (ctx.mistakes.dueForReview > 0) {
      suggestions.push({
        title: `Review ${ctx.mistakes.dueForReview} Mistake${ctx.mistakes.dueForReview > 1 ? 's' : ''}`,
        description: ctx.mistakes.topSkill
          ? `You have mistakes to review, mostly in ${ctx.mistakes.topSkill}. Understanding errors prevents them in the exam.`
          : `Review your recent mistakes to avoid repeating them.`,
        skill: ctx.mistakes.topSkill ?? 'Grammar',
        reason: 'low_accuracy',
        priority: ctx.mistakes.dueForReview > 5 ? 'high' : 'medium',
        estimatedMinutes: Math.min(10, ctx.mistakes.dueForReview * 2),
        actionLabel: 'Review Mistakes',
        actionPath: '/mistakes',
        contextExplanation: `Common mistakes often follow patterns. Reviewing them helps you recognise and correct these patterns before the exam.`,
      })
    }

    if (weakSkills.length > 0) {
      const skill = weakSkills[0]
      if (!suggestions.some(s => s.skill === skill && s.reason === 'weak_skill')) {
        suggestions.push({
          title: `Practice ${skill} — Your Weakest Area`,
          description: `You identified ${skill} as a weak skill. Targeted practice here will boost your confidence and your band score.`,
          skill,
          reason: 'weak_skill',
          priority: 'medium',
          estimatedMinutes: 20,
          actionLabel: `Practice ${skill}`,
          actionPath: `/${skill.toLowerCase()}`,
          contextExplanation: `Improving your weakest skill from Band ${ctx.profile.currentBand} to Band ${ctx.profile.targetBand} requires focused, deliberate practice. Each session builds measurable progress.`,
        })
      }
    }

    if (ctx.vocabulary.recentCount > 0) {
      suggestions.push({
        title: `Practice ${Math.min(ctx.vocabulary.recentCount, 5)} New Word${Math.min(ctx.vocabulary.recentCount, 5) > 1 ? 's' : ''}`,
        description: `You recently saved ${ctx.vocabulary.recentCount} word${ctx.vocabulary.recentCount > 1 ? 's' : ''}. Practice them with exercises to make them part of your active vocabulary.`,
        skill: 'Vocabulary',
        reason: 'spaced_repetition',
        priority: 'medium',
        estimatedMinutes: 10,
        actionLabel: 'Practice Now',
        actionPath: '/vocabulary',
        contextExplanation: `New vocabulary moves from short-term to long-term memory through active practice. Using words in context is the most effective way to remember them.`,
      })
    }

    if (ctx.roadmap.nextTaskTitle && ctx.progress.todayUnfinished === 0) {
      suggestions.push({
        title: ctx.roadmap.nextTaskTitle,
        description: `Your next roadmap task focuses on ${ctx.roadmap.currentSkillFocus ?? 'IELTS skills'}. Follow your personalized learning path.`,
        skill: ctx.roadmap.nextTaskSkill ?? 'Reading',
        reason: 'roadmap_next',
        priority: 'medium',
        estimatedMinutes: 20,
        actionLabel: 'Start Task',
        actionPath: '/plan',
        contextExplanation: `Your learning roadmap was built based on your target band, current level, and exam date. Each task moves you closer to your goal.`,
      })
    }

    if (suggestions.length === 0) {
      suggestions.push({
        title: 'Daily IELTS Warm-Up',
        description: 'Start with a short reading exercise or learn 5 new vocabulary words to maintain your skills.',
        skill: 'Reading',
        reason: 'recommended_content',
        priority: 'low',
        estimatedMinutes: 15,
        actionLabel: 'Start Learning',
        actionPath: '/dashboard',
        contextExplanation: `Even on rest days, 15 minutes of English exposure helps maintain your language feel and keeps your study habit strong.`,
      })
    }

    return suggestions.sort((a, b) => {
      const order: Record<string, number> = { high: 0, medium: 1, low: 2 }
      return order[a.priority] - order[b.priority]
    })
  }

  async generateExerciseFromVocabulary(
    count: number = 3,
    ctx?: PersonalizationContext,
  ): Promise<ExercisePrompt[]> {
    const context = ctx ?? await this.buildContext()
    const prompts: ExercisePrompt[] = []

    const vocabulary = await DatabaseService.getAll<VocabularyEntry>('vocabulary')
    const vocabForPractice = vocabulary.slice(0, Math.max(count * 2, 6))

    if (vocabForPractice.length === 0) {
      return [{
        skill: 'Vocabulary',
        topic: 'Environment',
        prompt: 'Write a paragraph about environmental protection using topic-specific vocabulary.',
        instructions: 'Write 4-5 sentences describing why protecting the environment is important. Try to use words like: sustainable, pollution, conservation, ecosystem, and biodiversity.',
        wordsToUse: ['sustainable', 'pollution', 'conservation', 'ecosystem', 'biodiversity'],
        estimatedMinutes: 10,
      }]
    }

    const chunkSize = Math.ceil(vocabForPractice.length / count)
    for (let i = 0; i < count; i++) {
      const chunk = vocabForPractice.slice(i * chunkSize, (i + 1) * chunkSize)
      if (chunk.length === 0) break

      const words = chunk.map(v => v.word || v.text || 'word')
      const meanings = chunk.map(v => v.meaning || v.definition || '').filter(Boolean)

      prompts.push({
        skill: 'Vocabulary',
        topic: `Saved Vocabulary Set ${i + 1}`,
        prompt: `Practice using these ${words.length} saved word${words.length > 1 ? 's' : ''} in context: ${words.join(', ')}`,
        instructions: meanings.length > 0
          ? `Write one sentence for each word below to show you understand its meaning:\n${words.map((w, j) => `- "${w}": ${meanings[j] ?? 'use in context'}`).join('\n')}`
          : `Write one sentence for each word: ${words.join(', ')}`,
        wordsToUse: words,
        estimatedMinutes: Math.max(5, words.length * 2),
      })
    }

    return prompts
  }

  async reviewRecentMistakes(ctx?: PersonalizationContext): Promise<MistakeReview[]> {
    const context = ctx ?? await this.buildContext()
    const reviews: MistakeReview[] = []

    const mistakes = await DatabaseService.getAll<MistakeEntry>('mistakes')
    const recentMistakes = mistakes
      .filter(m => m.status !== 'resolved')
      .slice(0, 5)

    for (const mistake of recentMistakes) {
      const skill = capitalizeSkill(mistake.skill)
      reviews.push({
        mistake: mistake.text || mistake.description || '',
        skill,
        explanation: this.generateMistakeExplanation(mistake),
        suggestion: this.generateMistakeSuggestion(skill, mistake),
        example: this.generateCorrectExample(skill),
      })
    }

    if (reviews.length === 0) {
      reviews.push({
        mistake: 'No unresolved mistakes found.',
        skill: 'General',
        explanation: 'You have resolved all your recorded mistakes. Great work! Keep practicing to maintain your progress.',
        suggestion: 'Try taking a new practice exercise to identify areas for improvement.',
        example: 'Consistent practice helps you discover and fix small errors before the exam.',
      })
    }

    return reviews
  }

  private generateMistakeExplanation(mistake: MistakeEntry): string {
    const skill = mistake.skill.toLowerCase()
    if (skill.includes('grammar') || skill.includes('writing')) {
      return `This mistake relates to your ${skill} skills. Understanding the correct form will help you avoid similar errors in the exam.`
    }
    if (skill.includes('vocabulary')) {
      return `Word choice is important for IELTS. Using the right word in context shows the examiner your vocabulary range.`
    }
    if (skill.includes('speaking')) {
      return `Fluency and pronunciation improve with awareness. Noticing this pattern is the first step to fixing it.`
    }
    if (skill.includes('listening')) {
      return `Listening mistakes often happen due to similar-sounding words or distractions. Practice focused listening.`
    }
    if (skill.includes('reading')) {
      return `Reading mistakes often come from skimming too quickly or misinterpreting the question. Try reading more carefully.`
    }
    return `Reviewing this mistake helps you understand the correct approach and avoid repeating it.`
  }

  private generateMistakeSuggestion(skill: SkillType, mistake: MistakeEntry): string {
    switch (skill) {
      case 'Grammar':
        return 'Review the specific grammar rule, write 3 correct example sentences, and practice with online exercises.'
      case 'Vocabulary':
        return 'Look up the correct word usage in a dictionary, note the collocations, and use it in a sentence.'
      case 'Writing':
        return 'Rewrite the sentence with the correct structure. Read it aloud to check if it sounds natural.'
      case 'Speaking':
        return 'Practice saying the correct version aloud 3 times. Record yourself to check pronunciation.'
      case 'Reading':
        return 'Re-read the passage more slowly. Identify keywords that helped you find the correct answer.'
      case 'Listening':
        return 'Listen to the audio again with the transcript. Identify the exact words you missed.'
      default:
        return 'Review the correct answer and try a similar practice exercise to reinforce your understanding.'
    }
  }

  private generateCorrectExample(skill: SkillType): string {
    const examples: Record<SkillType, string> = {
      Grammar: 'Correct: "She has been studying English for three years." Instead of: "She have been studying English for three years."',
      Vocabulary: 'Correct: "The chart illustrates a significant increase." Instead of: "The chart shows a big increase."',
      Writing: 'Correct: "In conclusion, the benefits of renewable energy outweigh the drawbacks." Instead of: "In conclusion, renewable energy is good."',
      Speaking: 'Correct: "I believe that education plays a crucial role in personal development." Instead of: "I think education is important."',
      Reading: 'Correct strategy: Scan for keywords in the question, then find the same keywords in the passage.',
      Listening: 'Correct strategy: Listen for signpost words like "however", "firstly", and "in conclusion" to follow the structure.',
    }
    return examples[skill] || examples.Grammar
  }

  async getProactiveMessage(ctx?: PersonalizationContext): Promise<{ message: string; type: 'motivation' | 'warning' | 'tip' | 'reminder' } | null> {
    const context = ctx ?? await this.buildContext()

    if (context.progress.todayUnfinished > 0) {
      return {
        message: `Today you should focus on ${context.roadmap.currentSkillFocus ?? 'your tasks'} because you have ${context.progress.todayUnfinished} task${context.progress.todayUnfinished > 1 ? 's' : ''} waiting. Completing them keeps your roadmap on track.`,
        type: 'reminder',
      }
    }

    if (context.vocabulary.recentCount >= 5) {
      return {
        message: `You saved ${context.vocabulary.recentCount} new word${context.vocabulary.recentCount > 1 ? 's' : ''} recently. Want to review them now and practice with exercises?`,
        type: 'tip',
      }
    }

    if (context.exam.isExamSoon) {
      return {
        message: `Your exam is in ${context.exam.countdownDays} day${context.exam.countdownDays > 1 ? 's' : ''}! Focus on mock tests and reviewing your weak areas. You've prepared well — trust your practice!`,
        type: 'motivation',
      }
    }

    if (context.profile.weakSkills.length > 0) {
      const weakSkill = context.profile.weakSkills[0]
      const weakTasks = context.tasks.pending.filter(t => t.category === weakSkill)
      const overdueTasks = weakTasks.filter(t => {
        const daysSince = Math.floor((Date.now() - new Date(t.date).getTime()) / (1000 * 60 * 60 * 24))
        return daysSince > 2
      })
      if (overdueTasks.length >= 2) {
        return {
          message: `Your ${weakSkill} practice is behind schedule. Let's do one focused session today to get back on track.`,
          type: 'warning',
        }
      }
    }

    if (context.exam.countdownDays > 0 && context.exam.countdownDays <= 14) {
      return {
        message: `Your exam is getting closer (${context.exam.countdownDays} days). Let's focus on your weakest skill: ${context.profile.weakSkills[0] ?? 'general practice'}. Intensive focus now makes a real difference.`,
        type: 'warning',
      }
    }

    if (context.mistakes.dueForReview > 3) {
      return {
        message: `You have ${context.mistakes.dueForReview} mistake${context.mistakes.dueForReview > 1 ? 's' : ''} to review. Reviewing them now helps you avoid repeating them in the exam.`,
        type: 'reminder',
      }
    }

    if (context.progress.studyStreak === 0) {
      return {
        message: 'Start your IELTS journey today. Even one small task builds momentum. What would you like to practice?',
        type: 'motivation',
      }
    }

    if (context.progress.studyStreak > 0 && context.progress.studyStreak % 7 === 0) {
      return {
        message: `Amazing — ${context.progress.studyStreak} days in a row! Consistency is the most important factor in IELTS success. Keep showing up!`,
        type: 'motivation',
      }
    }

    return null
  }

  async answerQuestion(query: string, ctx?: PersonalizationContext): Promise<string> {
    const context = ctx ?? await this.buildContext()
    const lower = query.toLowerCase()

    const weakSkills = context.profile.weakSkills
    const suggestions = this.suggestTasks(context)
    const topSuggestion = suggestions[0]

    if (/\b(what should i study|what to do|recommend|suggest|what today)\b/.test(lower)) {
      if (topSuggestion) {
        return `Based on your progress, I recommend: **${topSuggestion.title}**. ${topSuggestion.contextExplanation}\n\nYou can start by clicking "Open ${topSuggestion.skill}" in your dashboard.`
      }
      return 'Start with a short vocabulary review or reading practice. Even 15 minutes of focused study makes a difference every day.'
    }

    if (/\b(weak|struggl|difficult|need to improve|worst)\b/.test(lower)) {
      if (weakSkills.length > 0) {
        const weakSkill = weakSkills[0]
        const mistakeCount = context.mistakes.bySkill[weakSkill] ?? 0
        return `Your weakest area is **${weakSkill}** with ${mistakeCount} recorded mistake${mistakeCount > 1 ? 's' : ''}.\n\nTo improve:\n1. Practice ${weakSkill}-specific exercises (${context.profile.dailyStudyMinutes} min/day recommended)\n2. Review your mistakes in ${weakSkill} regularly\n3. Use IELTS-style ${weakSkill} tasks from your roadmap\n\nYour target is Band ${context.profile.targetBand} and your current level is Band ${context.profile.currentBand}. Focused practice on ${weakSkill} will help close this gap.`
      }
      return 'You haven\'t identified any weak skills yet. Go to Settings to set your weak areas, and I can give you targeted advice.'
    }

    if (/\b(exam|test date|when.*exam|countdown)\b/.test(lower)) {
      if (context.exam.countdownDays > 0) {
        if (context.exam.isExamSoon) {
          return `Your IELTS exam is in **${context.exam.countdownDays} day${context.exam.countdownDays > 1 ? 's' : ''}**! Focus on:\n• Full mock tests under timed conditions\n• Reviewing your most common mistakes\n• Getting plenty of rest\n\nYou've been preparing — trust your practice!`
        }
        return `Your IELTS exam is in **${context.exam.countdownDays} days**. ${context.exam.isUrgent ? 'Time to intensify your preparation!' : `You have enough time to improve systematically. Stay consistent with your ${context.profile.dailyStudyMinutes}-minute daily study plan.`}`
      }
      return 'You haven\'t set your exam date yet. Go to Settings to add it, so I can help you plan your preparation timeline.'
    }

    if (/\b(vocabulary|word|meaning|phrase)\b/.test(lower)) {
      const vocabCount = context.vocabulary.totalWords
      const dueCount = context.vocabulary.dueForReview
      return `You've saved **${vocabCount} vocabulary word${vocabCount > 1 ? 's' : ''}** so far.\n• ${dueCount} word${dueCount > 1 ? 's' : ''} due for review\n• ${context.vocabulary.masteredCount} mastered\n• ${context.vocabulary.learningCount} still learning\n\nRegular review using spaced repetition helps you remember vocabulary long-term. Would you like me to create a practice exercise from your saved words?`
    }

    if (/\b(mistake|error|wrong|incorrect)\b/.test(lower)) {
      return `You have **${context.mistakes.total} recorded mistake${context.mistakes.total > 1 ? 's' : ''}** (${context.mistakes.dueForReview} due for review).\n\nTop mistake areas:\n${Object.entries(context.mistakes.bySkill).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([skill, count]) => `• ${skill}: ${count}`).join('\n')}\n\nReviewing mistakes regularly turns weak points into strengths. Open Mistake Notebook to review them.`
    }

    if (/\b(roadmap|plan|path|progress|how.*far)\b/.test(lower)) {
      if (context.roadmap.exists) {
        return `Your IELTS roadmap is **${context.roadmap.currentPhaseName ? `in phase "${context.roadmap.currentPhaseName}"` : 'active'}** with **${context.roadmap.phaseProgress}%** overall progress.\n\nCurrent focus: ${context.roadmap.currentSkillFocus ?? 'Not set'}\nNext task: ${context.roadmap.nextTaskTitle ?? 'No pending tasks'}\n\nYou're making steady progress toward Band ${context.profile.targetBand}.`
      }
      return 'You haven\'t generated your learning roadmap yet. Complete the onboarding to create a personalized study plan based on your target band and exam date.'
    }

    if (/\b(progress|streak|how.*doing|consistency)\b/.test(lower)) {
      return `Your current stats:\n• Study streak: ${context.progress.studyStreak} day${context.progress.studyStreak !== 1 ? 's' : ''}\n• Total study hours: ${context.progress.totalStudyHours}\n• Vocabulary saved: ${context.vocabulary.totalWords}\n• Tasks completed: ${context.tasks.completedCount}\n• Current band: ${context.profile.currentBand} → Target: ${context.profile.targetBand}\n\nConsistency is key. Even on busy days, 15 minutes of English exposure helps maintain your progress.`
    }

    if (/\b(motivat|encourage|tired|stuck|give up|burnout)\b/.test(lower)) {
      const streak = context.progress.studyStreak
      if (streak > 0) {
        return `You've studied for **${streak} consecutive day${streak > 1 ? 's' : ''}** — that's already a huge achievement! IELTS preparation is a marathon, not a sprint. Every session, even short ones, builds your skills.\n\nRemember: Band ${context.profile.targetBand} is your goal. You're currently at Band ${context.profile.currentBand}. Every mistake you fix, every word you learn, every task you complete moves you closer. Keep going — you can do this! 💪`
      }
      return 'Every IELTS journey starts with a single step. You have the goal (Band ' + String(context.profile.targetBand) + '), now let\'s build the path. Start with one small task today, and tomorrow will be easier. You\'ve got this! 🌟'
    }

    return null
  }
}

function weekDay(): number {
  return new Date().getDay()
}

function getTimeOfDay(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  return 'evening'
}

export const aiTutorService = new AITutorService()
