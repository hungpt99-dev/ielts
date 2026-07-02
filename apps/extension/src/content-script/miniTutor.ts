import type { AiExplainType } from '@ielts/ai'
import { showExplainPanel } from './aiExplain'

interface SelectionPosition {
  x: number
  y: number
  width: number
  height: number
}

interface MiniTutorSelection {
  text: string
  pageTitle: string
  pageUrl: string
  position: SelectionPosition | null
}

function getActiveSelection(): MiniTutorSelection {
  const sel = window.getSelection()
  const selectionText = sel?.toString().trim() || ''
  let position: SelectionPosition | null = null

  if (sel && sel.rangeCount > 0) {
    const range = sel.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    if (rect.width > 0 || rect.height > 0) {
      position = {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
      }
    }
  }

  return {
    text: selectionText,
    pageTitle: document.title,
    pageUrl: window.location.href,
    position,
  }
}

function getSelectionContext(): MiniTutorSelection & {
  surroundingText: string
  selectionLength: number
} {
  const base = getActiveSelection()
  let surroundingText = ''

  if (base.text) {
    try {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null)
      const textNodes: string[] = []
      let node
      while ((node = walker.nextNode()) && textNodes.length < 50) {
        const t = (node as Text).textContent?.trim()
        if (t) textNodes.push(t)
      }
      const fullText = textNodes.join(' ')
      const idx = fullText.indexOf(base.text.slice(0, 50))
      if (idx >= 0) {
        const start = Math.max(0, idx - 100)
        const end = Math.min(fullText.length, idx + base.text.length + 100)
        surroundingText = (start > 0 ? '...' : '') +
          fullText.slice(start, end) +
          (end < fullText.length ? '...' : '')
      }
    } catch {
      surroundingText = base.text
    }
  }

  return {
    ...base,
    surroundingText,
    selectionLength: base.text.length,
  }
}

const ACTION_TO_AI_TYPE: Record<string, AiExplainType> = {
  explain: 'simple',
  simplify: 'rewrite',
  translate: 'vietnamese',
  exercise: 'quiz',
  vocabulary: 'ielts-vocab',
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'MINI_TUTOR_ACTION') {
    const { text, action } = message.payload as { text: string; action: string }

    const aiType = ACTION_TO_AI_TYPE[action]
    if (aiType) {
      showExplainPanel(text, aiType)
      sendResponse({ success: true, panelOpened: true })
    } else {
      sendResponse({ success: true, panelOpened: false })
    }
    return true
  }

  if (message.type === 'MINI_TUTOR_GET_SELECTION') {
    const selection = getActiveSelection()
    sendResponse(selection)
    return true
  }

  if (message.type === 'MINI_TUTOR_GET_SELECTION_FULL') {
    const context = getSelectionContext()
    sendResponse(context)
    return true
  }

  if (message.type === 'MINI_TUTOR_TRIGGER') {
    const { action } = message.payload as { action: string }
    const selection = getActiveSelection()

    if (!selection.text) {
      sendResponse({ success: false, error: 'No text selected' })
      return true
    }

    const aiType = ACTION_TO_AI_TYPE[action]
    if (aiType) {
      showExplainPanel(selection.text, aiType)
      sendResponse({ success: true, panelOpened: true })
    } else {
      showExplainPanel(selection.text, 'simple')
      sendResponse({ success: true, panelOpened: true })
    }
    return true
  }
})

export {}
