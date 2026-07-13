export type WritingTaskType = 'task-1' | 'task-2'
export type WritingExamType = 'academic' | 'general-training'

export interface WritingReviewRequest {
  text: string
  taskType: WritingTaskType
  examType: WritingExamType
  topic: string
  targetBand: number
  language?: string
}

export interface WritingFeedbackResult {
  estimatedBand: number
  taskResponse: string
  coherenceAndCohesion: string
  lexicalResource: string
  grammarRangeAndAccuracy: string
  improvedVersion: string
  grammarIssues: Array<{ text: string; correction: string; explanation: string }>
  vocabularySuggestions: Array<{ word: string; suggestion: string }>
  overallFeedback: string
}

export interface WritingExerciseRequest {
  taskType: WritingTaskType
  examType: WritingExamType
  topic: string
  bandLevel: number
}

export interface WritingExerciseResult {
  prompt: string
  instructions: string
  tips: string[]
}

export interface WritingTutorModule {
  reviewWriting(request: WritingReviewRequest): Promise<WritingFeedbackResult>
  generateExercise(request: WritingExerciseRequest): Promise<WritingExerciseResult>
  brainstormIdeas(topic: string, taskType: WritingTaskType, language?: string): Promise<string[]>
  generateOutline(topic: string, taskType: WritingTaskType, language?: string): Promise<string>
  improveThesis(thesis: string, topic: string, language?: string): Promise<string>
  checkParagraphStructure(paragraph: string, language?: string): Promise<string>
}
