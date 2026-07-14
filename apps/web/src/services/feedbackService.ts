import type { FeedbackFormData, FeedbackSubmission, FeedbackConfig } from '../models/feedback'
import { DEFAULT_FEEDBACK_CONFIG } from '../models/feedback'

interface DeliveryStrategy {
  readonly channel: string
  deliver(data: FeedbackSubmission): void
}

class MailToDelivery implements DeliveryStrategy {
  readonly channel = 'mailto'

  constructor(private config: FeedbackConfig['email']) {}

  deliver(data: FeedbackSubmission): void {
    const subject = encodeURIComponent(this.config.subject)
    const body = encodeURIComponent(
      [
        `Message: ${data.message}`,
        '',
        `Contact: ${data.contact || '(not provided)'}`,
        '',
        '---',
        'Sent from IELTS Journey',
      ].join('\n'),
    )
    window.location.href = `mailto:${this.config.to}?subject=${subject}&body=${body}`
  }
}

class LocalStorageDelivery implements DeliveryStrategy {
  readonly channel = 'localStorage'

  constructor(private storageKey: string) {}

  deliver(data: FeedbackSubmission): void {
    try {
      const existing: FeedbackSubmission[] = JSON.parse(
        localStorage.getItem(this.storageKey) || '[]',
      )
      existing.push(data)
      localStorage.setItem(this.storageKey, JSON.stringify(existing))
    } catch (error) {
      console.error('apps/web/src/services/feedbackService.ts error:', error);
      // Silently fail — primary channel handles notification
    }
  }
}

export class FeedbackDeliveryService {
  private strategies: DeliveryStrategy[]

  constructor(config: FeedbackConfig = DEFAULT_FEEDBACK_CONFIG) {
    this.strategies = config.channels.map((channel) => {
      switch (channel) {
        case 'mailto':
          return new MailToDelivery(config.email)
      }
    })
  }

  submit(data: FeedbackFormData): void {
    const submission: FeedbackSubmission = {
      ...data,
      submittedAt: new Date().toISOString(),
    }

    const fallback = new LocalStorageDelivery(
      DEFAULT_FEEDBACK_CONFIG.storageKey,
    )

    let delivered = false
    for (const strategy of this.strategies) {
      try {
        strategy.deliver(submission)
        delivered = true
      } catch (error) {
        console.error('apps/web/src/services/feedbackService.ts error:', error);
        continue
      }
    }

    if (!delivered) {
      fallback.deliver(submission)
    }
  }
}

export const feedbackService = new FeedbackDeliveryService()
