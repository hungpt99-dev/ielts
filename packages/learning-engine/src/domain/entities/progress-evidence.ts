export interface ProgressEvidence {
  id: string
  type: 'session-completed' | 'skill-improved' | 'mistake-reduced' | 'vocabulary-mastered' | 'streak-milestone' | 'consistency'
  description: string
  value: number
  previousValue?: number
  sourceSessionId: string
  occurredAt: string
}
