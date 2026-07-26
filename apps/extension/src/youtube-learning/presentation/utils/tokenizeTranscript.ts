export interface TokenizedWord {
  text: string
  isPunctuation: boolean
  isMeaningful: boolean
  normalized: string
}

const PUNCTUATION_CHARS = /[.,!?;:'"()\[\]{}–—…\u2013\u2014\u2026]+/g
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

function pushToken(tokens: TokenizedWord[], text: string): void {
  if (!text) return

  if (WHITESPACE_RE.test(text)) {
    tokens.push({ text, isPunctuation: false, isMeaningful: false, normalized: '' })
    return
  }

  if (PUNCTUATION_RE.test(text)) {
    tokens.push({ text, isPunctuation: true, isMeaningful: false, normalized: '' })
    return
  }

  const isMeaningful = isMeaningfulWord(text)
  tokens.push({
    text,
    isPunctuation: false,
    isMeaningful,
    normalized: isMeaningful ? normalizeWord(text) : '',
  })
}

export function tokenize(text: string): TokenizedWord[] {
  const tokens: TokenizedWord[] = []
  const parts = text.split(/(\s+)/)

  for (const part of parts) {
    if (!part) continue

    if (WHITESPACE_RE.test(part) || PUNCTUATION_RE.test(part) || isMeaningfulWord(part)) {
      pushToken(tokens, part)
      continue
    }

    let punctMatch: RegExpExecArray | null
    const punct: Array<{ text: string; index: number }> = []
    PUNCTUATION_CHARS.lastIndex = 0
    while ((punctMatch = PUNCTUATION_CHARS.exec(part)) !== null) {
      punct.push({ text: punctMatch[0], index: punctMatch.index })
    }

    let si = 0
    for (const pp of punct) {
      if (pp.index > si) {
        pushToken(tokens, part.slice(si, pp.index))
      }
      pushToken(tokens, pp.text)
      si = pp.index + pp.text.length
    }
    if (si < part.length) {
      pushToken(tokens, part.slice(si))
    }
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
