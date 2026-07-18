export const ATTEMPT_STATUS = {
  NOT_STARTED: 'not-started',
  IN_PROGRESS: 'in-progress',
  SUBMITTED: 'submitted',
  EVALUATED: 'evaluated',
  COMPLETED: 'completed',
} as const

export type AttemptStatus = (typeof ATTEMPT_STATUS)[keyof typeof ATTEMPT_STATUS]
