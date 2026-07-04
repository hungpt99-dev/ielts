import { describe, it, expect, beforeEach } from 'vitest'
import { highlightMatches, removeHighlights, removeAllHighlights, setActive, isActive } from '../highlightEngine'
import type { HighlightWord } from '../highlightMatcher'

function word(id: string, text: string): HighlightWord {
  return { id, text, meaning: 'test meaning', exampleSentence: '', personalNote: '' }
}

beforeEach(() => {
  document.body.innerHTML = ''
  setActive(true)
})

describe('highlightEngine', () => {
  describe('setActive / isActive', () => {
    it('tracks active state', () => {
      expect(isActive()).toBe(true)
      setActive(false)
      expect(isActive()).toBe(false)
      setActive(true)
      expect(isActive()).toBe(true)
    })
  })

  describe('highlightMatches', () => {
    it('highlights matching text in body', () => {
      document.body.innerHTML = '<p>Protect the environment</p>'
      const count = highlightMatches(document.body, [word('1', 'environment')])
      expect(count).toBe(1)

      const highlights = document.querySelectorAll('.ielts-journey-saved-keyword-highlight')
      expect(highlights).toHaveLength(1)
      expect(highlights[0].textContent).toBe('environment')
      expect(highlights[0] instanceof HTMLSpanElement).toBe(true)
    })

    it('does not highlight inside script tags', () => {
      document.body.innerHTML = '<script>var environment = "test"</script><p>safe text</p>'
      const count = highlightMatches(document.body, [word('1', 'environment')])
      expect(count).toBe(0)
    })

    it('does not highlight inside style tags', () => {
      document.body.innerHTML = '<style>.environment { color: red; }</style><p>safe text</p>'
      const count = highlightMatches(document.body, [word('1', 'environment')])
      expect(count).toBe(0)
    })

    it('does not highlight hidden elements', () => {
      document.body.innerHTML = '<div style="display:none">environment</div><p>safe text</p>'
      const count = highlightMatches(document.body, [word('1', 'environment')])
      expect(count).toBe(0)
    })

    it('does not highlight when active is false', () => {
      setActive(false)
      document.body.innerHTML = '<p>test environment</p>'
      const count = highlightMatches(document.body, [word('1', 'environment')])
      expect(count).toBe(0)
    })

    it('does not highlight with empty word list', () => {
      document.body.innerHTML = '<p>test environment</p>'
      const count = highlightMatches(document.body, [])
      expect(count).toBe(0)
    })

    it('highlights multiple matches', () => {
      document.body.innerHTML = '<p>the cat and the dog</p>'
      const count = highlightMatches(document.body, [word('1', 'the')])
      expect(count).toBe(2)

      const highlights = document.querySelectorAll('.ielts-journey-saved-keyword-highlight')
      expect(highlights).toHaveLength(2)
    })

    it('stores word data in dataset', () => {
      document.body.innerHTML = '<p>environment</p>'
      highlightMatches(document.body, [word('1', 'environment')])
      const el = document.querySelector('.ielts-journey-saved-keyword-highlight') as HTMLElement

      expect(el).toBeTruthy()
      const data = JSON.parse(el.dataset.highlight || '{}')
      expect(data.id).toBe('1')
      expect(data.text).toBe('environment')
      expect(data.meaning).toBe('test meaning')
    })
  })

  describe('removeHighlights', () => {
    it('removes highlight spans and restores text', () => {
      document.body.innerHTML = '<p>Protect the environment</p>'
      highlightMatches(document.body, [word('1', 'environment')])
      expect(document.querySelectorAll('.ielts-journey-saved-keyword-highlight')).toHaveLength(1)

      removeHighlights(document.body)
      expect(document.querySelectorAll('.ielts-journey-saved-keyword-highlight')).toHaveLength(0)
      expect(document.body.textContent).toContain('environment')
    })
  })

  describe('removeAllHighlights', () => {
    it('removes all highlights from document', () => {
      document.body.innerHTML = '<p>environment and climate change</p>'
      highlightMatches(document.body, [word('1', 'environment'), word('2', 'climate')])
      expect(document.querySelectorAll('.ielts-journey-saved-keyword-highlight').length).toBeGreaterThan(0)

      removeAllHighlights()
      expect(document.querySelectorAll('.ielts-journey-saved-keyword-highlight')).toHaveLength(0)
    })
  })
})
