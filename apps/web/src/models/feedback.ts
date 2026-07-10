export interface FeedbackFormData {
  message: string
  contact: string
}

export interface FeedbackSubmission extends FeedbackFormData {
  submittedAt: string
}

export type DeliveryChannel = 'mailto'

export interface FeedbackConfig {
  email: {
    to: string
    subject: string
  }
  storageKey: string
  channels: DeliveryChannel[]
}

export const DEFAULT_FEEDBACK_CONFIG: FeedbackConfig = {
  email: {
    to: 'pthung591@gmail.com',
    subject: 'IELTS Journey Feedback',
  },
  storageKey: 'ielts-feedback',
  channels: ['mailto'],
}
