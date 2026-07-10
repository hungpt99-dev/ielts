import type { FormEvent } from 'react'
import PageContent from './layout/PageContent'
import Button from './ui/Button'
import { useFeedbackForm } from '../hooks/useFeedbackForm'

function FeedbackSubmitted({ onReset }: { onReset: () => void }) {
  return (
    <PageContent className="py-8 text-center">
      <div
        className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
        style={{ backgroundColor: 'var(--color-success-light)', color: 'var(--color-success)' }}
      >
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
        Thank you for your feedback!
      </h3>
      <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        Your email client should have opened with your message pre-filled. Just hit send.
      </p>
      <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>
        (Your message was also saved locally as a backup.)
      </p>
      <div className="mt-4">
        <Button variant="primary" onClick={onReset}>
          Send Another Message
        </Button>
      </div>
    </PageContent>
  )
}

function FeedbackForm({
  form,
  onFieldChange,
  onSubmit,
}: {
  form: { message: string; contact: string }
  onFieldChange: (field: 'message' | 'contact', value: string) => void
  onSubmit: (e: FormEvent) => void
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-2">
        <label
          htmlFor="feedback-message"
          className="block text-sm font-medium"
          style={{ color: 'var(--color-text)' }}
        >
          Your Message
        </label>
        <textarea
          id="feedback-message"
          required
          rows={5}
          value={form.message}
          onChange={(e) => onFieldChange('message', e.target.value)}
          placeholder="Describe your feedback, suggestion, or issue..."
          className="block w-full rounded-lg border px-4 py-3 text-sm outline-none transition-colors focus:ring-2"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text)',
          }}
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="feedback-contact"
          className="block text-sm font-medium"
          style={{ color: 'var(--color-text)' }}
        >
          Contact Info{' '}
          <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
            (optional)
          </span>
        </label>
        <input
          id="feedback-contact"
          type="text"
          value={form.contact}
          onChange={(e) => onFieldChange('contact', e.target.value)}
          placeholder="Email, Twitter, or any way to reach you"
          className="block w-full rounded-lg border px-4 py-3 text-sm outline-none transition-colors focus:ring-2"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text)',
          }}
        />
      </div>

      <Button variant="primary" type="submit">
        Send Feedback
      </Button>
    </form>
  )
}

export default function FeedbackSection() {
  const { form, setField, submitted, handleSubmit, reset } = useFeedbackForm()

  if (submitted) {
    return <FeedbackSubmitted onReset={reset} />
  }

  return (
    <FeedbackForm
      form={form}
      onFieldChange={setField}
      onSubmit={handleSubmit}
    />
  )
}
