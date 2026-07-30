import type { SaveCategory } from '../types'
import { STORAGE_KEYS } from '@ielts/config'
import {
  safeStorageGet,
  safeStorageSet,
  logContentError,
} from '../utils/safe-chrome'
import {
  emitExtensionSelectedTextSaved,
  emitExtensionVocabularySaved,
  emitExtensionArticleSaved,
} from '../background/eventEmitters'
import { extractArticle } from './articleExtractor'

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
    background: 'var(--ielts-primary, #2563eb)',
    color: 'var(--ielts-on-primary, #ffffff)',
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
    try { sendResponse({ success: true }) } catch (error) {
 logContentError('apps/extension/src/content-script/saveSelectedText.ts', error);
 /* ignore */ }
    return false
  }

  if (message.type === 'GET_PAGE_INFO') {
    try {
      sendResponse({
        title: document.title,
        url: window.location.href,
        selectedText: getSelectedText(),
      })
    } catch (error) {
 logContentError('apps/extension/src/content-script/saveSelectedText.ts', error);
 /* ignore */ }
    return false
  }

  if (message.type === 'EXTRACT_ARTICLE') {
    try {
      const result = extractArticle()
      sendResponse({ success: true, data: result })
    } catch (error) {
      logContentError('apps/extension/src/content-script/saveSelectedText.ts', error);
      sendResponse({ success: false, error: 'Failed to extract article' })
    }
    return false
  }

  if (message.type === 'SAVE_ARTIFACT') {
    const payload = message.payload as Record<string, unknown>
    const title = (payload.title as string) || document.title
    const url = (payload.url as string) || window.location.href

    chrome.storage.local.get(STORAGE_KEYS.extensionLocal.pendingSaves, (result) => {
      const existing = (result[STORAGE_KEYS.extensionLocal.pendingSaves] as Array<Record<string, unknown>>) || []
      existing.push({
        text: url,
        category: 'article',
        pageTitle: title,
        pageUrl: url,
        description: payload.description || '',
        timestamp: Date.now(),
      })
      safeStorageSet({ [STORAGE_KEYS.extensionLocal.pendingSaves]: existing })
    })
    emitExtensionArticleSaved(title, url)
    showToast('Page saved as Artifact')
    try { sendResponse({ success: true }) } catch (error) {
 logContentError('apps/extension/src/content-script/saveSelectedText.ts', error);
 /* ignore */ }
    return false
  }

  if (message.type === 'SAVE_SELECTION_FULL') {
    const payload = message.payload as SaveSelectionPayload

    showToast(`Saved as ${payload.category}`)

    chrome.storage.local.get(STORAGE_KEYS.extensionLocal.pendingSaves, (result) => {
      const existing = (result[STORAGE_KEYS.extensionLocal.pendingSaves] as Array<Record<string, unknown>>) || []
      existing.push({
        text: payload.text,
        category: payload.category,
        pageTitle: payload.pageTitle || document.title,
        pageUrl: payload.pageUrl || window.location.href,
        topic: payload.topic,
        difficulty: payload.difficulty,
        note: payload.note,
        tags: payload.tags,
        timestamp: Date.now(),
      })
      safeStorageSet({ [STORAGE_KEYS.extensionLocal.pendingSaves]: existing })
    })

    if (payload.category === 'vocabulary') {
      emitExtensionVocabularySaved(
        payload.text.split(/\s+/)[0] || payload.text,
        payload.text,
        payload.pageUrl || window.location.href,
      )
    } else {
      emitExtensionSelectedTextSaved(
        payload.text,
        payload.pageUrl || window.location.href,
      )
    }

    try { sendResponse({ success: true }) } catch (error) {
 logContentError('apps/extension/src/content-script/saveSelectedText.ts', error);
 /* ignore */ }
    return false
  }
})

export {}
