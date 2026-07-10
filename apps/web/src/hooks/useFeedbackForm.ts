import { useState, useCallback } from 'react'
import type { FeedbackFormData } from '../models/feedback'
import { feedbackService } from '../services/feedbackService'

const INITIAL_FORM: FeedbackFormData = { message: '', contact: '' }

export function useFeedbackForm() {
  const [form, setForm] = useState<FeedbackFormData>(INITIAL_FORM)
  const [submitted, setSubmitted] = useState(false)

  const setField = useCallback((field: keyof FeedbackFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }, [])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    feedbackService.submit(form)
    setSubmitted(true)
    setForm(INITIAL_FORM)
  }, [form])

  const reset = useCallback(() => {
    setSubmitted(false)
  }, [])

  return { form, setField, submitted, handleSubmit, reset } as const
}
