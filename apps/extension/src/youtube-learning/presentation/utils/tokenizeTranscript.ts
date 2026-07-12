export interface TokenizedWord {
  text: string
  isPunctuation: boolean
  isMeaningful: boolean
  normalized: string
}

const PUNCTUATION_RE = /^[.,!?;:'"()\[\]{}–—…\u2013\u2014\u2026]+$/
const WHITESPACE_RE = /^\s+$/
const WORD_RE = /^[a-zA-Z\u00C0-\u024F\u0400-\u04FF\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]+(?:['\u2019][a-zA-Z]+)?$/
const HYPHENATED_WORD_RE = /^[a-zA-Z\u00C0-\u024F]+(?:-[a-zA-Z\u00C0-\u024F]+)+$/
const NUMBER_RE = /^\d+(?:[.,]\d+)?$/

function isMeaningfulWord(part: string): boolean {
  if (NUMBER_RE.test(part)) return true
  if (WORD_RE.test(part)) return true
  if (HYPHENATED_WORD_RE.test(part)) return true
  return false
}

export function tokenize(text: string): TokenizedWord[] {
  const tokens: TokenizedWord[] = []
  const parts = text.split(/(\s+)/)

  for (const part of parts) {
    if (!part) continue

    if (WHITESPACE_RE.test(part)) continue

    if (PUNCTUATION_RE.test(part)) {
      tokens.push({ text: part, isPunctuation: true, isMeaningful: false, normalized: '' })
      continue
    }

    const isMeaningful = isMeaningfulWord(part)
    tokens.push({
      text: part,
      isPunctuation: false,
      isMeaningful,
      normalized: isMeaningful ? normalizeWord(part) : '',
    })
  }

  return tokens
}

export function normalizeWord(word: string): string {
  return word
    .toLowerCase()
    .replace(/^['\u2019]+|['\u2019]+$/g, '')
    .replace(/[^a-zA-Z\u00C0-\u024F\u0400-\u04FF\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF'’-]/g, '')
}

export function tokenizeSegment(text: string, maxWords?: number): TokenizedWord[] {
  const tokens = tokenize(text)
  if (maxWords && maxWords > 0) {
    let wordCount = 0
    const result: TokenizedWord[] = []
    for (const token of tokens) {
      if (token.isMeaningful) wordCount++
      if (wordCount > maxWords) break
      result.push(token)
    }
    return result
  }
  return tokens
}

export function formatTime(seconds: number): string {
  if (!seconds || seconds < 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
