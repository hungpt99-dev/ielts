export type IeltsVariant = 'academic' | 'general_training'

export const IELTS_VARIANTS = ['academic', 'general_training'] as const

export function isIeltsVariant(value: string): value is IeltsVariant {
  return (IELTS_VARIANTS as readonly string[]).includes(value)
}
