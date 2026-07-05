import { describe, it, expect, beforeEach } from 'vitest'
import {
  highlightMatches,
  removeHighlights,
  removeAllHighlights,
  setActive,
  isActive,
  getHighlightWordFromElement,
} from '../highlightEngine'
import type { HighlightWord } from '../highlightMatcher'

function word(id: string, text: string, overrides?: Partial<HighlightWord>): HighlightWord {
  return { id, text, meaning: 'test meaning', exampleSentence: '', personalNote: '', ...overrides }
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

    it('defaults to inactive before first set', () => {
      setActive(false)
      setActive(true)
      setActive(false)
      expect(isActive()).toBe(false)
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

    it('highlights multiple matches of the same word', () => {
      document.body.innerHTML = '<p>the cat and the dog</p>'
      const count = highlightMatches(document.body, [word('1', 'the')])
      expect(count).toBe(2)

      const highlights = document.querySelectorAll('.ielts-journey-saved-keyword-highlight')
      expect(highlights).toHaveLength(2)
    })

    it('highlights multiple different words', () => {
      document.body.innerHTML = '<p>the cat and the dog</p>'
      const count = highlightMatches(document.body, [
        word('1', 'cat'),
        word('2', 'dog'),
      ])
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

    it('stores full word data including example and note', () => {
      document.body.innerHTML = '<p>perseverance</p>'
      const w = word('2', 'perseverance', {
        meaning: 'kiên trì',
        exampleSentence: 'She showed great perseverance.',
        personalNote: 'My favorite word',
      })
      highlightMatches(document.body, [w])
      const el = document.querySelector('.ielts-journey-saved-keyword-highlight') as HTMLElement
      const data = JSON.parse(el.dataset.highlight || '{}')
      expect(data.meaning).toBe('kiên trì')
      expect(data.exampleSentence).toBe('She showed great perseverance.')
      expect(data.personalNote).toBe('My favorite word')
    })

    it('does not highlight inside already highlighted elements', () => {
      document.body.innerHTML = '<p>environment climate</p>'
      highlightMatches(document.body, [word('1', 'environment')])
      highlightMatches(document.body, [word('2', 'climate')])
      const highlights = document.querySelectorAll('.ielts-journey-saved-keyword-highlight')
      expect(highlights).toHaveLength(2)
    })

    it('handles text with no matching words gracefully', () => {
      document.body.innerHTML = '<p>nothing to see here</p>'
      const count = highlightMatches(document.body, [word('1', 'missing')])
      expect(count).toBe(0)
    })

    it('handles root with no text nodes', () => {
      const div = document.createElement('div')
      const count = highlightMatches(div, [word('1', 'test')])
      expect(count).toBe(0)
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

    it('removes multiple highlight spans and restores text order', () => {
      document.body.innerHTML = '<p>the cat and the dog</p>'
      highlightMatches(document.body, [word('1', 'cat'), word('2', 'dog')])
      expect(document.querySelectorAll('.ielts-journey-saved-keyword-highlight')).toHaveLength(2)

      removeHighlights(document.body)
      expect(document.querySelectorAll('.ielts-journey-saved-keyword-highlight')).toHaveLength(0)
      expect(document.body.textContent).toBe('the cat and the dog')
    })

    it('is a no-op when root is not an Element', () => {
      removeHighlights(document.createTextNode('text') as unknown as Node)
      expect(document.querySelectorAll('.ielts-journey-saved-keyword-highlight')).toHaveLength(0)
    })

    it('is a no-op when root has no highlights', () => {
      document.body.innerHTML = '<p>plain text</p>'
      removeHighlights(document.body)
      expect(document.body.textContent).toBe('plain text')
    })

    it('is a no-op on empty body', () => {
      removeHighlights(document.body)
      expect(document.body.innerHTML).toBe('')
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

    it('is a no-op when no highlights exist', () => {
      document.body.innerHTML = '<p>plain text</p>'
      removeAllHighlights()
      expect(document.body.textContent).toBe('plain text')
    })
  })

  describe('getHighlightWordFromElement', () => {
    it('returns the word from element data', () => {
      document.body.innerHTML = '<p>environment</p>'
      highlightMatches(document.body, [word('1', 'environment')])
      const el = document.querySelector('.ielts-journey-saved-keyword-highlight') as HTMLElement
      const result = getHighlightWordFromElement(el)
      expect(result).not.toBeNull()
      expect(result!.id).toBe('1')
      expect(result!.text).toBe('environment')
    })

    it('returns null when element has no data', () => {
      const el = document.createElement('span')
      expect(getHighlightWordFromElement(el)).toBeNull()
    })

    it('returns null when element data is invalid JSON', () => {
      const el = document.createElement('span')
      el.dataset.highlight = 'not-valid-json'
      expect(getHighlightWordFromElement(el)).toBeNull()
    })

    it('returns null when element data is empty string', () => {
      const el = document.createElement('span')
      el.dataset.highlight = ''
      expect(getHighlightWordFromElement(el)).toBeNull()
    })
  })
})
