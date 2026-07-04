import { findMatches, type HighlightWord, type TextMatch } from './highlightMatcher'
import { showTooltip, scheduleHideTooltip, cancelHideTooltip } from './highlightTooltip'

const HIGHLIGHT_CLASS = 'ielts-journey-saved-keyword-highlight'

interface HighlightState {
  wordIds: Set<string>
  active: boolean
}

let state: HighlightState = {
  wordIds: new Set(),
  active: false,
}

function getTextNodes(root: Node): Text[] {
  const nodes: Text[] = []
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node: Text): number {
        const parent = node.parentElement
        if (!parent) return NodeFilter.FILTER_REJECT

        const tag = parent.tagName?.toLowerCase()
        if (
          tag === 'script' ||
          tag === 'style' ||
          tag === 'iframe' ||
          tag === 'svg' ||
          tag === 'noscript' ||
          tag === 'textarea' ||
          tag === 'input' ||
          tag === 'select' ||
          tag === 'button' ||
          tag === 'option'
        ) {
          return NodeFilter.FILTER_REJECT
        }

        if (parent.closest?.(`.${HIGHLIGHT_CLASS}`)) {
          return NodeFilter.FILTER_REJECT
        }

        const style = getComputedStyle(parent)
        if (
          style.display === 'none' ||
          style.visibility === 'hidden' ||
          (parent as HTMLElement)?.hidden
        ) {
          return NodeFilter.FILTER_REJECT
        }

        if ((parent as HTMLElement)?.contentEditable === 'true') {
          return NodeFilter.FILTER_REJECT
        }

        return NodeFilter.FILTER_ACCEPT
      },
    },
  )

  let node: Text | null
  while ((node = walker.nextNode() as Text | null)) {
    nodes.push(node)
  }

  return nodes
}

function hasAnyWord(text: string, words: HighlightWord[]): boolean {
  const lower = text.toLowerCase()
  for (const w of words) {
    if (lower.includes(w.text.toLowerCase())) return true
  }
  return false
}

function splitAndHighlight(
  node: Text,
  matches: TextMatch[],
): boolean {
  if (matches.length === 0) return false

  const parent = node.parentNode
  if (!parent) return false
  const text = node.textContent || ''

  const fragment = document.createDocumentFragment()
  let lastEnd = 0

  for (const m of matches) {
    if (m.start > lastEnd) {
      fragment.appendChild(document.createTextNode(text.slice(lastEnd, m.start)))
    }

    const highlightAttr = JSON.stringify({
      id: m.word.id,
      text: m.word.text,
      meaning: m.word.meaning,
      exampleSentence: m.word.exampleSentence,
      personalNote: m.word.personalNote,
    })

    const span = document.createElement('span')
    span.className = HIGHLIGHT_CLASS
    span.dataset.highlight = highlightAttr
    span.textContent = text.slice(m.start, m.end)

    span.addEventListener('mouseenter', (e) => {
      cancelHideTooltip()
      showTooltip(m.word, e.clientX, e.clientY)
    })
    span.addEventListener('mouseleave', () => {
      scheduleHideTooltip(300)
    })
    span.addEventListener('click', (e) => {
      e.stopPropagation()
      showTooltip(m.word, e.clientX, e.clientY, true)
    })

    fragment.appendChild(span)
    lastEnd = m.end
  }

  if (lastEnd < text.length) {
    fragment.appendChild(document.createTextNode(text.slice(lastEnd)))
  }

  parent.replaceChild(fragment, node)
  return true
}

export function highlightMatches(
  root: Node,
  words: HighlightWord[],
): number {
  if (!state.active || words.length === 0) return 0

  const textNodes = getTextNodes(root)
  let highlightCount = 0

  for (const node of textNodes) {
    const text = node.textContent || ''
    if (!hasAnyWord(text, words)) continue

    const matches = findMatches(text, words)
    if (matches.length > 0) {
      if (splitAndHighlight(node, matches)) {
        highlightCount += matches.length
      }
    }
  }

  return highlightCount
}

export function removeHighlights(root: Node): void {
  if (!(root instanceof Element)) return
  const highlighted = root.querySelectorAll(`.${HIGHLIGHT_CLASS}`)
  for (const el of highlighted) {
    const parent = el.parentNode
    if (!parent) continue
    const text = el.textContent || ''
    parent.replaceChild(document.createTextNode(text), el)
    parent.normalize()
  }
}

export function removeAllHighlights(): void {
  removeHighlights(document.body)
}

export function setActive(active: boolean): void {
  state.active = active
}

export function isActive(): boolean {
  return state.active
}

export function setWordIds(ids: Set<string>): void {
  state.wordIds = ids
}

export function getHighlightWordFromElement(
  el: HTMLElement,
): HighlightWord | null {
  const data = el.dataset.highlight
  if (!data) return null
  try {
    return JSON.parse(data) as HighlightWord
  } catch {
    return null
  }
}
