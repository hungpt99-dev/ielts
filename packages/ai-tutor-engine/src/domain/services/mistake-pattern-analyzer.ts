import type { MistakePattern } from '../entities/learner-context'
import type { IELTSSection } from '../value-objects'

export interface MistakeAnalysisInput {
  mistakes: Array<{
    skill: IELTSSection
    category: string
    text: string
    createdAt: string
  }>
}

export function detectRecurringPatterns(input: MistakeAnalysisInput): MistakePattern[] {
  const grouped = new Map<string, { skill: IELTSSection; texts: string[]; dates: string[] }>()

  for (const m of input.mistakes) {
    const pattern = inferPattern(m.text)
    const key = `${m.skill}:${pattern}`
    if (!grouped.has(key)) {
      grouped.set(key, { skill: m.skill, texts: [], dates: [] })
    }
    const entry = grouped.get(key)!
    entry.texts.push(m.text)
    entry.dates.push(m.createdAt)
  }

  const patterns: MistakePattern[] = []
  for (const [key, entry] of grouped) {
    if (entry.texts.length >= 2) {
      patterns.push({
        pattern: key.split(':')[1],
        skill: entry.skill,
        frequency: entry.texts.length,
        examples: entry.texts.slice(0, 3),
      })
    }
  }

  return patterns.sort((a, b) => b.frequency - a.frequency)
}

function inferPattern(text: string): string {
  const articlePattern = /\b(a|an|the)\b/i
  const verbPattern = /\b(is|are|was|were|have|has|had|do|does|did)\b/i
  const prepositionPattern = /\b(in|on|at|to|for|with|by|about)\b/i
  const pluralPattern = /\b\w+(s|es)\b/g

  if (articlePattern.test(text)) return 'article-usage'
  if (prepositionPattern.test(text)) return 'preposition-usage'
  if (verbPattern.test(text)) return 'verb-tense'
  if ((text.match(pluralPattern) || []).length > 2) return 'plural-usage'

  return 'general'
}
