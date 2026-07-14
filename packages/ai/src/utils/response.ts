import { z } from 'zod'
import { AIError } from '../errors/types'

export function extractJSON(content: string): string {
  const jsonStart = content.indexOf('{')
  if (jsonStart === -1) {
    throw new AIError('AI response was not valid JSON.', 'INVALID_JSON')
  }
  let depth = 0
  for (let i = jsonStart; i < content.length; i++) {
    if (content[i] === '{') depth++
    else if (content[i] === '}') {
      depth--
      if (depth === 0) {
        return content.slice(jsonStart, i + 1)
      }
    }
  }
  throw new AIError('AI response was not valid JSON.', 'INVALID_JSON')
}

export function parseAndValidate<T>(
  content: string,
  schema: z.ZodType<T>,
): { data: T; error: null } | { data: null; error: string } {
  try {
    const json = extractJSON(content)
    const parsed = JSON.parse(json)
    const result = schema.safeParse(parsed)
    if (!result.success) {
      return { data: null, error: 'AI response had unexpected format. Try again.' }
    }
    return { data: result.data, error: null }
  } catch (err: unknown) {
    console.error('packages/ai/src/utils/response.ts error:', err: unknown);
    if (err instanceof AIError) {
      return { data: null, error: err.message }
    }
    return { data: null, error: 'AI response was not valid JSON. Try again.' }
  }
}
