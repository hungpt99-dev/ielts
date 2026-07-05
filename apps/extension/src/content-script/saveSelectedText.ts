import type { SaveCategory } from '../types'
import {
  safeStorageGet,
  safeStorageSet,
  safeSendMessage,
} from '../utils/safe-chrome'

interface SaveSelectionPayload {
  text: string
  category: SaveCategory
  pageTitle: string
  pageUrl: string
  note?: string
  topic?: string
  difficulty?: string
  tags?: string[]
}

function showToast(message: string) {
  const existing = document.querySelector('#ielts-toast')
  if (existing) existing.remove()

  const toast = document.createElement('div')
  toast.id = 'ielts-toast'
  toast.textContent = message
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    background: '#2563eb',
    color: '#ffffff',
    padding: '12px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    zIndex: '2147483647',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    transition: 'opacity 0.3s',
    opacity: '1',
    pointerEvents: 'none',
  })
  document.body.appendChild(toast)
  setTimeout(() => {
    toast.style.opacity = '0'
    setTimeout(() => toast.remove(), 300)
  }, 2000)
}

function getSelectedText(): string {
  const sel = window.getSelection()
  return sel?.toString().trim() || ''
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'SAVE_SELECTION') {
    const payload = message.payload as SaveSelectionPayload
    showToast(`Saved as ${payload.category}`)
    try { sendResponse({ success: true }) } catch { /* ignore */ }
    return false
  }

  if (message.type === 'GET_PAGE_INFO') {
    try {
      sendResponse({
        title: document.title,
        url: window.location.href,
        selectedText: getSelectedText(),
      })
    } catch { /* ignore */ }
    return false
  }

  if (message.type === 'SAVE_ARTIFACT') {
    const payload = message.payload as Record<string, unknown>
    safeStorageGet<any[]>('artifacts').then((result) => {
      const items = result.artifacts || []
      items.unshift({
        id: crypto.randomUUID(),
        url: payload.url || window.location.href,
        title: payload.title || document.title,
        description: (payload.description as string) || '',
        favicon: (payload.favicon as string) || '',
        tags: (payload.tags as string[]) || [],
        isFavorite: false,
        category: (payload.category as string) || 'article',
        source: 'extension',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      safeStorageSet({ artifacts: items })
    })
    showToast('Page saved as Artifact')
    try { sendResponse({ success: true }) } catch { /* ignore */ }
    return false
  }

  if (message.type === 'SAVE_SELECTION_FULL') {
    const payload = message.payload as SaveSelectionPayload

    showToast(`Saved as ${payload.category}`)

    safeSendMessage({
      type: 'SAVE_SELECTION_FULL',
      payload: {
        text: payload.text,
        category: payload.category,
        pageTitle: payload.pageTitle,
        pageUrl: payload.pageUrl,
        topic: payload.topic,
        difficulty: payload.difficulty,
        note: payload.note,
        tags: payload.tags,
      },
    })

    try { sendResponse({ success: true }) } catch { /* ignore */ }
    return false
  }
})

export {}
