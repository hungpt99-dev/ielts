export interface HighlightWord {
  id: string
  text: string
  meaning: string
  exampleSentence: string
  personalNote: string
}

export interface TextMatch {
  start: number
  end: number
  word: HighlightWord
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildWordPattern(word: string): RegExp {
  const escaped = escapeRegex(word)
  return new RegExp(`(?<=^|[^\\p{L}])${escaped}(?=[^\\p{L}]|$)`, 'giu')
}

function isOverlap(
  start: number,
  end: number,
  occupied: Set<number>,
): boolean {
  for (let i = start; i < end; i++) {
    if (occupied.has(i)) return true
  }
  return false
}

export function findMatches(
  text: string,
  words: HighlightWord[],
): TextMatch[] {
  if (!text || words.length === 0) return []

  const sorted = [...words].sort((a, b) => b.text.length - a.text.length)

  const matches: TextMatch[] = []
  const occupied = new Set<number>()

  for (const word of sorted) {
    const pattern = buildWordPattern(word.text)
    let match: RegExpExecArray | null

    while ((match = pattern.exec(text)) !== null) {
      const start = match.index
      const end = start + match[0].length

      if (!isOverlap(start, end, occupied)) {
        matches.push({ start, end, word })
        for (let i = start; i < end; i++) {
          occupied.add(i)
        }
      }
    }
  }

  matches.sort((a, b) => a.start - b.start)
  return matches
}

export function normalizeWords(words: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  const sorted = [...words].sort((a, b) => b.length - a.length)

  for (const w of sorted) {
    const key = w.toLowerCase().trim()
    if (key && !seen.has(key)) {
      seen.add(key)
      result.push(w)
    }
  }

  return result
}
