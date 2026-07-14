import { findMatches, hasAnyWord, type HighlightWord, type TextMatch } from './highlightMatcher'
import { showTooltip, scheduleHideTooltip, cancelHideTooltip, hideTooltip } from './highlightTooltip'

const HIGHLIGHT_CLASS = 'ielts-journey-saved-keyword-highlight'

const MAX_TEXT_NODES = 10000

const SKIP_TAGS = new Set([
  'script', 'style', 'iframe', 'svg', 'noscript',
  'textarea', 'input', 'select', 'button', 'option',
])

interface HighlightState {
  active: boolean
}

const state: HighlightState = {
  active: false,
}

let delegatedListenersAttached = false
let isModifyingDOM = false

function acceptTextNode(node: Text): number {
  const parent = node.parentElement
  if (!parent) return NodeFilter.FILTER_REJECT

  if (SKIP_TAGS.has(parent.tagName?.toLowerCase() ?? '')) {
    return NodeFilter.FILTER_REJECT
  }

  if (parent.closest?.(`.${HIGHLIGHT_CLASS}`)) {
    return NodeFilter.FILTER_REJECT
  }

  const style = getComputedStyle(parent)
  if (
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    (parent as HTMLElement).hidden
  ) {
    return NodeFilter.FILTER_REJECT
  }

  if ((parent as HTMLElement).contentEditable === 'true') {
    return NodeFilter.FILTER_REJECT
  }

  return NodeFilter.FILTER_ACCEPT
}

function getTextNodes(root: Node, limit = MAX_TEXT_NODES): Text[] {
  const nodes: Text[] = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: acceptTextNode })

  let node: Text | null
  while ((node = walker.nextNode() as Text | null)) {
    nodes.push(node)
    if (nodes.length >= limit) break
  }

  return nodes
}

function getHighlightWord(el: HTMLElement): HighlightWord | null {
  const data = el.dataset.highlight
  if (!data) return null
  try {
    return JSON.parse(data) as HighlightWord
  } catch (error) {
    console.error('apps/extension/src/content-script/highlighter/highlightEngine.ts error:', error);
    return null
  }
}

function handleHighlightMouseOver(e: MouseEvent): void {
  const target = e.target as Node
  if (!(target instanceof HTMLElement)) return
  const span = target.closest<HTMLSpanElement>(`.${HIGHLIGHT_CLASS}`)
  if (!span) return
  cancelHideTooltip()
  const word = getHighlightWord(span)
  if (word) showTooltip(word, e.clientX, e.clientY)
}

function handleHighlightMouseOut(e: MouseEvent): void {
  const target = e.target as Node
  if (!(target instanceof HTMLElement)) return
  const span = target.closest<HTMLSpanElement>(`.${HIGHLIGHT_CLASS}`)
  if (!span) return
  const related = e.relatedTarget as Node | null
  if (related && span.contains(related)) return
  scheduleHideTooltip(300)
}

function handleHighlightClick(e: MouseEvent): void {
  const target = e.target as Node
  if (!(target instanceof HTMLElement)) return
  const span = target.closest<HTMLSpanElement>(`.${HIGHLIGHT_CLASS}`)
  if (!span) return
  e.stopPropagation()
  const word = getHighlightWord(span)
  if (word) showTooltip(word, e.clientX, e.clientY, true)
}

function attachDelegatedListeners(): void {
  if (delegatedListenersAttached) return
  delegatedListenersAttached = true
  document.addEventListener('mouseover', handleHighlightMouseOver, { passive: true })
  document.addEventListener('mouseout', handleHighlightMouseOut, { passive: true })
  document.addEventListener('click', handleHighlightClick, true)
}

function detachDelegatedListeners(): void {
  if (!delegatedListenersAttached) return
  delegatedListenersAttached = false
  document.removeEventListener('mouseover', handleHighlightMouseOver)
  document.removeEventListener('mouseout', handleHighlightMouseOut)
  document.removeEventListener('click', handleHighlightClick, true)
}

function createHighlightSpan(match: TextMatch): HTMLSpanElement {
  const span = document.createElement('span')
  span.className = HIGHLIGHT_CLASS

  const { id, text, meaning, exampleSentence, personalNote } = match.word
  span.dataset.highlight = JSON.stringify({ id, text, meaning, exampleSentence, personalNote })

  return span
}

function splitAndHighlight(node: Text, matches: TextMatch[]): boolean {
  if (matches.length === 0) return false

  const parent = node.parentNode
  if (!parent) return false

  isModifyingDOM = true
  try {
    const text = node.textContent ?? ''
    const fragment = document.createDocumentFragment()
    let lastEnd = 0

    for (const m of matches) {
      if (m.start < lastEnd) continue
      if (m.start > text.length || m.end > text.length) continue

      if (m.start > lastEnd) {
        fragment.appendChild(document.createTextNode(text.slice(lastEnd, m.start)))
      }

      const span = createHighlightSpan(m)
      span.textContent = text.slice(m.start, m.end)
      fragment.appendChild(span)
      lastEnd = m.end
    }

    if (lastEnd < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastEnd)))
    }

    parent.replaceChild(fragment, node)
    return true
  } finally {
    isModifyingDOM = false
  }
}

export function highlightMatches(root: Node, words: HighlightWord[]): number {
  if (!state.active || words.length === 0) return 0

  attachDelegatedListeners()

  const textNodes = getTextNodes(root)
  let highlightCount = 0

  for (const node of textNodes) {
    const text = node.textContent ?? ''
    if (!hasAnyWord(text, words)) continue

    const matches = findMatches(text, words)
    if (matches.length > 0 && splitAndHighlight(node, matches)) {
      highlightCount += matches.length
    }
  }

  if (highlightCount > 0) {
    console.debug(`[IELTS Journey] Auto-highlight: ${highlightCount} matches highlighted`)
  }

  return highlightCount
}

export function isModifyingDOMForHighlight(): boolean {
  return isModifyingDOM
}

export function removeHighlights(root: Node): void {
  if (!(root instanceof Element)) return

  const highlighted = root.querySelectorAll(`.${HIGHLIGHT_CLASS}`)
  for (const el of highlighted) {
    const parent = el.parentNode
    if (!parent) continue
    parent.replaceChild(document.createTextNode(el.textContent ?? ''), el)
    parent.normalize()
  }
}

export function removeAllHighlights(): void {
  removeHighlights(document.body)
  detachDelegatedListeners()
  hideTooltip()
}

export function setActive(active: boolean): void {
  state.active = active
  if (!active) {
    detachDelegatedListeners()
  }
}

export function isActive(): boolean {
  return state.active
}

export function getHighlightWordFromElement(el: HTMLElement): HighlightWord | null {
  return getHighlightWord(el)
}
