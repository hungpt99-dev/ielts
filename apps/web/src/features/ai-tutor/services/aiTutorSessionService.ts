import type { TutorSession, FeedbackSummary, TeacherAdviceItem } from '../types/aiTutor.types'
import type { RawLearningProfile } from '../repositories/learningProfileRepository'
import type { SkillType } from '../../personalization/types'

interface SessionStrategy {
  focus: string
  skill: string
  focusArea: string
}

function capitalizeSkill(skill: string): string {
  if (skill === 'vocabulary') return 'Vocabulary'
  if (skill === 'grammar') return 'Grammar'
  if (skill === 'reading') return 'Reading'
  if (skill === 'listening') return 'Listening'
  if (skill === 'writing') return 'Writing'
  if (skill === 'speaking') return 'Speaking'
  return skill.charAt(0).toUpperCase() + skill.slice(1)
}

const WEAK_SKILL_LESSONS: Record<string, { title: string; reason: string; estimatedTime: string }> = {
  Reading: {
    title: 'Reading Comprehension Practice',
    reason: 'Practice skimming, scanning, and understanding complex passages to improve your Reading score.',
    estimatedTime: '30 minutes',
  },
  Listening: {
    title: 'Listening for Key Information',
    reason: 'Train your ear to catch important details, signpost words, and speaker attitudes in IELTS Listening.',
    estimatedTime: '30 minutes',
  },
  Writing: {
    title: 'Writing Task Structure & Coherence',
    reason: 'Learn to structure your essays with clear introductions, body paragraphs, and conclusions.',
    estimatedTime: '45 minutes',
  },
  Speaking: {
    title: 'Speaking Fluency & Pronunciation',
    reason: 'Practice expressing ideas clearly, using varied vocabulary, and maintaining natural flow.',
    estimatedTime: '20 minutes',
  },
  Grammar: {
    title: 'Grammar Accuracy Review',
    reason: 'Master the most common grammar patterns tested in IELTS, including tenses and conditionals.',
    estimatedTime: '25 minutes',
  },
  Vocabulary: {
    title: 'Topic-Specific Vocabulary Building',
    reason: 'Expand your active vocabulary for common IELTS topics like environment, education, and technology.',
    estimatedTime: '20 minutes',
  },
}

export function determineSessionStrategy(profile: RawLearningProfile): SessionStrategy {
  const ctx = profile.context
  const weakSkills = ctx.profile.weakSkills
  const unfinished = ctx.progress.todayUnfinished
  const dueReviews = ctx.vocabulary.dueForReview
  const isUrgent = ctx.exam.isUrgent
  const mistakesDue = ctx.mistakes.dueForReview

  if (isUrgent && weakSkills.length > 0) {
    return { focus: 'Urgent Practice', skill: weakSkills[0], focusArea: weakSkills[0] }
  }
  if (unfinished > 0) {
    const categories = [...new Set(ctx.tasks.today.map(t => t.category))]
    const skill = categories[0] || 'Reading'
    return { focus: "Complete Today's Tasks", skill: capitalizeSkill(skill), focusArea: skill }
  }
  if (dueReviews > 5) {
    return { focus: 'Vocabulary Review', skill: 'Vocabulary', focusArea: 'Vocabulary' }
  }
  if (mistakesDue > 3) {
    return { focus: 'Mistake Review', skill: 'Grammar', focusArea: 'Mistakes' }
  }
  if (weakSkills.length > 0) {
    return { focus: `Improve ${weakSkills[0]}`, skill: weakSkills[0], focusArea: weakSkills[0] }
  }
  return { focus: 'Daily Practice', skill: 'Reading', focusArea: 'Reading' }
}

export function buildSessionFromStrategy(strategy: SessionStrategy, profile: RawLearningProfile): TutorSession {
  const lesson = WEAK_SKILL_LESSONS[strategy.skill]
  if (lesson) {
    return {
      focus: strategy.focus,
      lessonTitle: lesson.title,
      reason: lesson.reason,
      estimatedTime: lesson.estimatedTime,
      skill: strategy.skill,
      focusArea: strategy.focusArea,
    }
  }
  return {
    focus: strategy.focus,
    lessonTitle: 'Welcome to Your IELTS Journey',
    reason: 'Set up your target band, exam date, and study preferences so your AI Tutor can prepare personalized lessons for you.',
    estimatedTime: '10 minutes',
    skill: strategy.skill,
    focusArea: strategy.focusArea,
  }
}

export function getFeedbackSummary(profile: RawLearningProfile): FeedbackSummary {
  const ctx = profile.context
  const weakSkills = ctx.profile.weakSkills
  const mistakesDue = ctx.mistakes.dueForReview
  const streak = ctx.progress.studyStreak
  const dueReviews = ctx.vocabulary.dueForReview
  const isUrgent = ctx.exam.isUrgent
  const countdown = ctx.exam.countdownDays

  let mainWeakness = 'Keep studying to get personalized insights'
  if (weakSkills.length > 0) {
    mainWeakness = `Weak in ${weakSkills.join(', ')}`
  }
  if (isUrgent && weakSkills.length > 0) {
    mainWeakness = `URGENT: ${weakSkills.join(', ')} need attention (exam in ${countdown}d)`
  }

  let mostCommonIssue = 'No issues detected yet'
  if (ctx.mistakes.topSkill) {
    mostCommonIssue = `${ctx.mistakes.topSkill}: ${ctx.mistakes.bySkill[ctx.mistakes.topSkill] ?? 0} mistakes`
  }
  if (dueReviews > 5) {
    mostCommonIssue += `${mostCommonIssue === 'No issues detected yet' ? '' : ' · '}${dueReviews} vocab reviews due`
  }

  let nextStep = "Start Today's Lesson"
  if (streak === 0) {
    nextStep = 'Start Your First Session'
  } else if (mistakesDue > 5) {
    nextStep = 'Review Your Mistakes'
  } else if (dueReviews > 5) {
    nextStep = 'Review Vocabulary'
  } else if (isUrgent) {
    nextStep = 'Mock Test Prep'
  }

  return {
    mainWeakness,
    mostCommonIssue,
    recommendedNextStep: nextStep,
    streak,
    examCountdown: countdown,
    isExamUrgent: isUrgent,
  }
}

export function generateAdviceItems(profile: RawLearningProfile): Omit<TeacherAdviceItem, 'iconName'>[] {
  const ctx = profile.context
  const items: Omit<TeacherAdviceItem, 'iconName'>[] = []

  if (ctx.progress.todayUnfinished > 0) {
    items.push({
      key: 'complete-tasks',
      title: `Complete ${ctx.progress.todayUnfinished} Task${ctx.progress.todayUnfinished > 1 ? 's' : ''}`,
      description: `You have unfinished tasks from today's plan.`,
      actionLabel: 'Open Plan',
    })
  }

  if (ctx.vocabulary.dueForReview > 0) {
    items.push({
      key: 'vocabulary-review',
      title: `Review ${ctx.vocabulary.dueForReview} Word${ctx.vocabulary.dueForReview > 1 ? 's' : ''}`,
      description: `Due for spaced repetition review.`,
      actionLabel: 'Review Now',
    })
  }

  if (ctx.mistakes.dueForReview > 0) {
    items.push({
      key: 'review-mistakes',
      title: `Review ${ctx.mistakes.dueForReview} Mistake${ctx.mistakes.dueForReview > 1 ? 's' : ''}`,
      description: ctx.mistakes.topSkill
        ? `Mostly in ${ctx.mistakes.topSkill}.`
        : 'Review your recent mistakes.',
      actionLabel: 'Review',
    })
  }

  for (const skill of ctx.profile.weakSkills) {
    const key = skill.toLowerCase()
    if (!items.some(i => i.key.includes(key))) {
      items.push({
        key: `practice-${key}`,
        title: `Practice ${skill}`,
        description: `Marked as a weak area. Focused practice will improve your band score.`,
        actionLabel: `Practice ${skill}`,
      })
    }
  }

  if (ctx.exam.isUrgent) {
    items.push({
      key: 'mock-test-prep',
      title: 'Mock Test Time',
      description: `Exam in ${ctx.exam.countdownDays}d. Take a mock test to assess readiness.`,
      actionLabel: 'View Mock Tests',
    })
  }

  if (ctx.vocabulary.totalWords === 0 && ctx.mistakes.total === 0 && ctx.progress.studyStreak === 0) {
    items.push({
      key: 'start-learning',
      title: 'Start Your IELTS Journey',
      description: 'Begin with a lesson or practice exercise to get personalized advice.',
      actionLabel: 'Get Started',
    })
  }

  return items
}
