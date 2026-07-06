import { topicContextManager } from './aiTutor/TopicContextManager'
import type { QuickActionType } from '../models/aiTutorModels'

export type AppPage =
  | 'dashboard'
  | 'plan'
  | 'vocabulary'
  | 'vocabulary-review'
  | 'review'
  | 'reading'
  | 'listening'
  | 'writing'
  | 'speaking'
  | 'grammar'
  | 'mistakes'
  | 'mock-tests'
  | 'progress'
  | 'search'
  | 'settings'
  | 'unknown'

export interface PageInfo {
  page: AppPage
  label: string
  path: string
}

export interface ContextAwareQuickAction {
  type: QuickActionType
  label: string
  icon: string
  relevance: number
}

export interface ContextSuggestion {
  title: string
  message: string
  action?: QuickActionType
  actionLabel: string
}

const PAGE_LABELS: Record<AppPage, string> = {
  'dashboard': 'Dashboard',
  'plan': 'Study Plan',
  'vocabulary': 'Vocabulary',
  'vocabulary-review': 'Vocabulary Review',
  'review': 'Review Center',
  'reading': 'Reading',
  'listening': 'Listening',
  'writing': 'Writing',
  'speaking': 'Speaking',
  'grammar': 'Grammar',
  'mistakes': 'Mistake Notebook',
  'mock-tests': 'Mock Tests',
  'progress': 'Progress',
  'search': 'Search',
  'settings': 'Settings',
  'unknown': '',
}

function pathToPage(path: string): AppPage {
  if (path === '/' || path === '') return 'dashboard'
  if (path.startsWith('/plan')) return 'plan'
  if (path.startsWith('/review-center')) return 'review'
  if (path.startsWith('/review')) return 'vocabulary-review'
  if (path.startsWith('/vocabulary')) return 'vocabulary'
  if (path.startsWith('/reading')) return 'reading'
  if (path.startsWith('/listening')) return 'listening'
  if (path.startsWith('/writing')) return 'writing'
  if (path.startsWith('/speaking')) return 'speaking'
  if (path.startsWith('/grammar')) return 'grammar'
  if (path.startsWith('/mistakes')) return 'mistakes'
  if (path.startsWith('/mock-tests')) return 'mock-tests'
  if (path.startsWith('/progress')) return 'progress'
  if (path.startsWith('/search')) return 'search'
  if (path.startsWith('/settings')) return 'settings'
  return 'unknown'
}

const PAGE_CONTEXT_ACTIONS: Record<AppPage, ContextAwareQuickAction[]> = {
  vocabulary: [
    { type: 'quiz-me', label: 'Quiz me', icon: 'IconHelpCircle', relevance: 10 },
    { type: 'teach-me', label: 'Teach vocabulary', icon: 'IconVocabularyBook', relevance: 9 },
    { type: 'make-exercise', label: 'Generate exercise', icon: 'IconEdit', relevance: 8 },
    { type: 'practice-with-me', label: 'Practice now', icon: 'IconTarget', relevance: 7 },
    { type: 'correct-english', label: 'Explain my mistake', icon: 'IconExplain', relevance: 5 },
    { type: 'remind-later', label: 'Remind me later', icon: 'IconTimer', relevance: 3 },
  ],
  'vocabulary-review': [
    { type: 'quiz-me', label: 'Quiz me', icon: 'IconHelpCircle', relevance: 10 },
    { type: 'practice-with-me', label: 'Practice now', icon: 'IconTarget', relevance: 9 },
    { type: 'make-exercise', label: 'Generate exercise', icon: 'IconEdit', relevance: 8 },
    { type: 'teach-me', label: 'Teach vocabulary', icon: 'IconVocabularyBook', relevance: 7 },
    { type: 'remind-later', label: 'Remind me later', icon: 'IconTimer', relevance: 3 },
  ],
  writing: [
    { type: 'teach-me', label: 'Essay tips', icon: 'IconArticle', relevance: 10 },
    { type: 'practice-with-me', label: 'Brainstorm ideas', icon: 'IconExplain', relevance: 9 },
    { type: 'correct-english', label: 'Check my writing', icon: 'IconSearch', relevance: 8 },
    { type: 'make-exercise', label: 'Task 2 practice', icon: 'IconEdit', relevance: 7 },
    { type: 'remind-later', label: 'Remind me later', icon: 'IconTimer', relevance: 3 },
  ],
  speaking: [
    { type: 'practice-with-me', label: 'Speaking practice', icon: 'IconSpeaking', relevance: 10 },
    { type: 'teach-me', label: 'Speaking tips', icon: 'IconVocabularyBook', relevance: 9 },
    { type: 'quiz-me', label: 'Part 1 questions', icon: 'IconHelpCircle', relevance: 8 },
    { type: 'make-exercise', label: 'Cue card practice', icon: 'IconVocabularyReview', relevance: 7 },
    { type: 'correct-english', label: 'Fix pronunciation', icon: 'IconVolume', relevance: 6 },
    { type: 'remind-later', label: 'Remind me later', icon: 'IconTimer', relevance: 3 },
  ],
  reading: [
    { type: 'teach-me', label: 'Explain passage', icon: 'IconVocabulary', relevance: 10 },
    { type: 'make-exercise', label: 'Generate questions', icon: 'IconHelpCircle', relevance: 9 },
    { type: 'quiz-me', label: 'Reading quiz', icon: 'IconHelpCircle', relevance: 8 },
    { type: 'practice-with-me', label: 'Skim & scan', icon: 'IconTarget', relevance: 7 },
    { type: 'remind-later', label: 'Remind me later', icon: 'IconTimer', relevance: 3 },
  ],
  listening: [
    { type: 'teach-me', label: 'Explain transcript', icon: 'IconListening', relevance: 10 },
    { type: 'practice-with-me', label: 'Listening practice', icon: 'IconTarget', relevance: 9 },
    { type: 'quiz-me', label: 'Comprehension quiz', icon: 'IconHelpCircle', relevance: 8 },
    { type: 'make-exercise', label: 'Gap fill exercise', icon: 'IconEdit', relevance: 7 },
    { type: 'remind-later', label: 'Remind me later', icon: 'IconTimer', relevance: 3 },
  ],
  grammar: [
    { type: 'teach-me', label: 'Explain grammar', icon: 'IconVocabularyBook', relevance: 10 },
    { type: 'make-exercise', label: 'Grammar exercise', icon: 'IconEdit', relevance: 9 },
    { type: 'quiz-me', label: 'Grammar quiz', icon: 'IconHelpCircle', relevance: 8 },
    { type: 'correct-english', label: 'Fix my grammar', icon: 'IconExplain', relevance: 7 },
    { type: 'remind-later', label: 'Remind me later', icon: 'IconTimer', relevance: 3 },
  ],
  mistakes: [
    { type: 'correct-english', label: 'Explain mistakes', icon: 'IconExplain', relevance: 10 },
    { type: 'teach-me', label: 'Teach correct usage', icon: 'IconVocabularyBook', relevance: 9 },
    { type: 'make-exercise', label: 'Drill exercises', icon: 'IconEdit', relevance: 8 },
    { type: 'quiz-me', label: 'Test yourself', icon: 'IconHelpCircle', relevance: 7 },
    { type: 'remind-later', label: 'Remind me later', icon: 'IconTimer', relevance: 3 },
  ],
  dashboard: [
    { type: 'practice-with-me', label: "Today's practice", icon: 'IconTarget', relevance: 10 },
    { type: 'teach-me', label: 'Recommend next topic', icon: 'IconVocabularyBook', relevance: 9 },
    { type: 'quiz-me', label: 'Daily quiz', icon: 'IconHelpCircle', relevance: 8 },
    { type: 'make-exercise', label: 'Generate exercise', icon: 'IconEdit', relevance: 7 },
    { type: 'remind-later', label: 'Remind me later', icon: 'IconTimer', relevance: 3 },
  ],
  plan: [
    { type: 'practice-with-me', label: 'Start today\'s plan', icon: 'IconArticle', relevance: 10 },
    { type: 'teach-me', label: 'Optimize my plan', icon: 'IconVocabularyBook', relevance: 8 },
    { type: 'remind-later', label: 'Remind me later', icon: 'IconTimer', relevance: 5 },
  ],
  review: [
    { type: 'quiz-me', label: 'Review quiz', icon: 'IconHelpCircle', relevance: 10 },
    { type: 'practice-with-me', label: 'Practice weak spots', icon: 'IconTarget', relevance: 9 },
    { type: 'make-exercise', label: 'Generate review', icon: 'IconEdit', relevance: 7 },
    { type: 'remind-later', label: 'Remind me later', icon: 'IconTimer', relevance: 3 },
  ],
  'mock-tests': [
    { type: 'practice-with-me', label: 'Start mock test', icon: 'IconArticle', relevance: 10 },
    { type: 'teach-me', label: 'Test strategies', icon: 'IconVocabularyBook', relevance: 8 },
    { type: 'correct-english', label: 'Review mistakes', icon: 'IconExplain', relevance: 7 },
    { type: 'remind-later', label: 'Remind me later', icon: 'IconTimer', relevance: 3 },
  ],
  progress: [
    { type: 'teach-me', label: 'Improve weak areas', icon: 'IconProgress', relevance: 10 },
    { type: 'practice-with-me', label: 'Practice now', icon: 'IconTarget', relevance: 9 },
    { type: 'remind-later', label: 'Remind me later', icon: 'IconTimer', relevance: 3 },
  ],
  search: [
    { type: 'teach-me', label: 'Explain results', icon: 'IconVocabularyBook', relevance: 7 },
    { type: 'remind-later', label: 'Remind me later', icon: 'IconTimer', relevance: 3 },
  ],
  settings: [
    { type: 'remind-later', label: 'Remind me later', icon: 'IconTimer', relevance: 3 },
  ],
  unknown: [],
}

const PAGE_CONTEXT_SUGGESTIONS: Record<AppPage, (topic?: string) => ContextSuggestion | null> = {
  vocabulary: (topic) => ({
    title: topic ? `Learning ${topic} vocabulary` : 'Building your vocabulary',
    message: topic
      ? `I see you're studying ${topic} vocabulary. Want me to help you practice these words?`
      : 'I see you\'re building your vocabulary. I can create flashcards or a quiz from your saved words!',
    action: 'quiz-me',
    actionLabel: 'Practice vocabulary',
  }),
  'vocabulary-review': () => ({
    title: 'Review time',
    message: 'Reviewing vocabulary regularly helps you remember longer. I can create a quick quiz from your saved words!',
    action: 'quiz-me',
    actionLabel: 'Start review',
  }),
  writing: (topic) => ({
    title: topic ? `Writing about ${topic}` : 'Working on writing',
    message: topic
      ? `I see you're working on writing about "${topic}". Want help brainstorming ideas or checking your structure?`
      : 'I can help you brainstorm ideas, check your essay structure, or suggest better vocabulary for your writing.',
    action: 'teach-me',
    actionLabel: 'Get writing help',
  }),
  speaking: () => ({
    title: 'Speaking practice',
    message: 'Practicing speaking is key for IELTS. I can simulate a speaking test with Part 1, 2, and 3 questions!',
    action: 'practice-with-me',
    actionLabel: 'Start speaking',
  }),
  reading: (topic) => ({
    title: topic ? `Reading about ${topic}` : 'Reading practice',
    message: topic
      ? `I see you're reading about "${topic}". I can explain difficult parts or create comprehension questions.`
      : 'I can help you understand the passage, explain difficult vocabulary, or create reading comprehension questions.',
    action: 'teach-me',
    actionLabel: 'Get reading help',
  }),
  listening: () => ({
    title: 'Listening practice',
    message: 'I can help you with listening comprehension. Share a transcript and I\'ll create questions for you!',
    action: 'teach-me',
    actionLabel: 'Get listening help',
  }),
  grammar: (topic) => ({
    title: topic ? `Studying ${topic} grammar` : 'Grammar study',
    message: topic
      ? `I see you're studying "${topic}" grammar. I can explain the rules and give you practice exercises.`
      : 'Grammar is the foundation of good English. Tell me what grammar point you\'re working on and I\'ll explain it!',
    action: 'teach-me',
    actionLabel: 'Teach me grammar',
  }),
  mistakes: () => ({
    title: 'Reviewing mistakes',
    message: 'Learning from mistakes is one of the fastest ways to improve. I can explain your mistakes and create targeted practice!',
    action: 'correct-english',
    actionLabel: 'Review mistakes',
  }),
  dashboard: () => ({
    title: 'Your learning dashboard',
    message: 'I can help you decide what to study next. Based on your progress, I can recommend the best focus area for today.',
    action: 'practice-with-me',
    actionLabel: 'Recommend now',
  }),
  plan: () => ({
    title: 'Study plan',
    message: 'I see you\'re looking at your study plan. I can help you adjust it based on your progress and upcoming exam.',
    action: 'teach-me',
    actionLabel: 'Optimize plan',
  }),
  review: () => ({
    title: 'Review center',
    message: 'Regular review is essential. I can quiz you on your saved vocabulary and past mistakes!',
    action: 'quiz-me',
    actionLabel: 'Start review',
  }),
  'mock-tests': () => ({
    title: 'Mock test prep',
    message: 'Taking mock tests is great practice. I can help you review your answers and focus on weak areas afterward.',
    action: 'practice-with-me',
    actionLabel: 'Prep tips',
  }),
  progress: () => ({
    title: 'Track your progress',
    message: 'I notice you\'re checking your progress. Let me suggest areas where you can improve the most!',
    action: 'teach-me',
    actionLabel: 'Get suggestions',
  }),
  search: () => null,
  settings: () => null,
  unknown: () => null,
}

type PageChangeListener = (page: PageInfo) => void

export class ChatContext {
  private currentPage: PageInfo = { page: 'unknown', label: '', path: '/' }
  private listeners: Set<PageChangeListener> = new Set()
  private initialized = false

  private handlePopState = () => {
    this.updatePage()
  }

  initialize(): void {
    if (this.initialized) return
    this.updatePage()
    window.addEventListener('popstate', this.handlePopState)
    this.initialized = true
  }

  destroy(): void {
    window.removeEventListener('popstate', this.handlePopState)
    this.listeners.clear()
    this.initialized = false
  }

  private updatePage(): void {
    const path = window.location.pathname
    const page = pathToPage(path)
    const label = PAGE_LABELS[page]
    const info: PageInfo = { page, label, path }
    if (info.page !== this.currentPage.page || info.path !== this.currentPage.path) {
      this.currentPage = info
      this.notifyListeners(info)
    }
  }

  getCurrentPage(): PageInfo {
    return this.currentPage
  }

  getCurrentTopicLabel(): string {
    return topicContextManager.getCurrentTopicLabel()
  }

  getContextAwareQuickActions(limit = 6): ContextAwareQuickAction[] {
    const actions = PAGE_CONTEXT_ACTIONS[this.currentPage.page] || PAGE_CONTEXT_ACTIONS.unknown
    return [...actions]
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit)
  }

  getContextSuggestion(): ContextSuggestion | null {
    const topic = this.getCurrentTopicLabel()
    const generator = PAGE_CONTEXT_SUGGESTIONS[this.currentPage.page]
    if (!generator) return null
    return generator(topic || undefined)
  }

  onPageChange(listener: PageChangeListener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notifyListeners(info: PageInfo): void {
    for (const listener of this.listeners) {
      try {
        listener(info)
      } catch {}
    }
  }

  refresh(): void {
    this.updatePage()
  }
}

export const chatContext = new ChatContext()
