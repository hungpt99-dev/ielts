import type { LearningSourceContent } from '../domain/entities/learning-activity'

export interface ContentValidationResult {
  valid: boolean
  normalized: LearningSourceContent | null
  warnings: string[]
}

export function normalizeContent(raw: Partial<LearningSourceContent>): ContentValidationResult {
  const warnings: string[] = []

  if (!raw.text || raw.text.trim().length === 0) {
    return { valid: false, normalized: null, warnings: ['Content text is empty'] }
  }

  if (!raw.type) {
    return { valid: false, normalized: null, warnings: ['Content type is required'] }
  }

  const maxLength = 10000
  let text = raw.text.trim()
  if (text.length > maxLength) {
    text = text.slice(0, maxLength)
    warnings.push(`Content truncated from ${raw.text.length} to ${maxLength} characters`)
  }

  const normalized: LearningSourceContent = {
    id: raw.id ?? `content-${Date.now()}`,
    type: raw.type,
    title: raw.title?.trim(),
    text,
    language: raw.language ?? 'en',
    topic: raw.topic?.trim(),
    sourceUrl: raw.sourceUrl?.trim(),
    metadata: raw.metadata,
  }

  if (normalized.text.length < 20) {
    warnings.push('Content is very short — may not generate meaningful exercises')
  }

  return { valid: true, normalized, warnings }
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

export function selectRelevantSegment(text: string, maxTokens: number): string {
  const maxChars = maxTokens * 4
  if (text.length <= maxChars) return text

  const segments = text.split(/\n\n+/)
  let selected = ''
  for (const segment of segments) {
    if ((selected.length + segment.length) <= maxChars) {
      selected += (selected ? '\n\n' : '') + segment
    } else {
      break
    }
  }

  return selected || text.slice(0, maxChars)
}
