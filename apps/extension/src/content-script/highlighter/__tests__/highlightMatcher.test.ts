import { describe, it, expect } from 'vitest'
import { findMatches, normalizeWords, type HighlightWord } from '../highlightMatcher'

function word(id: string, text: string): HighlightWord {
  return { id, text, meaning: '', exampleSentence: '', personalNote: '' }
}

describe('highlightMatcher', () => {
  describe('normalizeWords', () => {
    it('deduplicates case-insensitive duplicates', () => {
      const result = normalizeWords(['Hello', 'hello', 'HELLO'])
      expect(result).toEqual(['Hello'])
    })

    it('removes empty strings', () => {
      const result = normalizeWords(['test', '', '  '])
      expect(result).toEqual(['test'])
    })

    it('sorts by length descending', () => {
      const result = normalizeWords(['a', 'long phrase', 'medium'])
      expect(result).toEqual(['long phrase', 'medium', 'a'])
    })

    it('returns empty array for empty input', () => {
      expect(normalizeWords([])).toEqual([])
    })
  })

  describe('findMatches', () => {
    it('matches single word case-insensitively', () => {
      const words = [word('1', 'environment')]
      const matches = findMatches('Protect the Environment', words)
      expect(matches).toHaveLength(1)
      expect(matches[0].word.text).toBe('environment')
    })

    it('matches whole words only', () => {
      const words = [word('1', 'art')]
      const matches = findMatches('article heart art artist', words)
      expect(matches).toHaveLength(1)
      expect(matches[0].start).toBe(14)
      expect(matches[0].end).toBe(17)
      expect(matches[0].word.text).toBe('art')
    })

    it('matches phrases exactly', () => {
      const words = [word('1', 'as a result')]
      const matches = findMatches('As a result of the study', words)
      expect(matches).toHaveLength(1)
      expect(matches[0].word.text).toBe('as a result')
    })

    it('matches with surrounding punctuation', () => {
      const words = [word('1', 'environment')]
      const matches = findMatches('the environment.', words)
      expect(matches).toHaveLength(1)
      expect(matches[0].word.text).toBe('environment')
    })

    it('prefers longer phrases over shorter words', () => {
      const words = [
        word('1', 'climate'),
        word('2', 'climate change'),
      ]
      const matches = findMatches('climate change is real', words)
      expect(matches).toHaveLength(1)
      expect(matches[0].word.text).toBe('climate change')
    })

    it('highlights both when they do not overlap', () => {
      const words = [
        word('1', 'climate'),
        word('2', 'real'),
      ]
      const matches = findMatches('climate change is real', words)
      expect(matches).toHaveLength(2)
      expect(matches[0].word.text).toBe('climate')
      expect(matches[1].word.text).toBe('real')
    })

    it('handles regex special characters in words', () => {
      const words = [word('1', 'c++')]
      const matches = findMatches('I know c++ programming', words)
      expect(matches).toHaveLength(1)
      expect(matches[0].word.text).toBe('c++')
    })

    it('does not highlight inside other words', () => {
      const words = [word('1', 'the')]
      const matches = findMatches('theme theater mother', words)
      expect(matches).toHaveLength(0)
    })

    it('matches multiple occurrences of the same word', () => {
      const words = [word('1', 'the')]
      const matches = findMatches('the cat and the dog', words)
      expect(matches).toHaveLength(2)
    })

    it('returns empty array for empty text', () => {
      const words = [word('1', 'test')]
      expect(findMatches('', words)).toEqual([])
    })

    it('returns empty array for empty word list', () => {
      expect(findMatches('some text', [])).toEqual([])
    })

    it('handles Unicode characters', () => {
      const words = [word('1', 'résumé')]
      const matches = findMatches('Update your résumé for the job', words)
      expect(matches).toHaveLength(1)
      expect(matches[0].word.text).toBe('résumé')
    })
  })
})
