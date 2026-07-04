import type { SaveCategory } from '../types'
import { updateDailyProgress } from '../services/storage'
import { initMessaging } from './messaging'
import { initializeStorageBridge } from './storage-bridge'

interface AiExplainItem {
  id: string
  title: string
  action: string
}

const AI_EXPLAIN_ITEMS: AiExplainItem[] = [
  { id: 'ai-explain-simple', title: 'Explain in Simple English', action: 'simple' },
  { id: 'ai-explain-vietnamese', title: 'Explain in Vietnamese', action: 'vietnamese' },
  { id: 'ai-explain-ielts-vocab', title: 'IELTS Vocabulary', action: 'ielts-vocab' },
  { id: 'ai-explain-grammar', title: 'Grammar Explanation', action: 'grammar' },
  { id: 'ai-explain-rewrite', title: 'Rewrite Naturally', action: 'rewrite' },
  { id: 'ai-explain-sentences', title: 'Example Sentences', action: 'example-sentences' },
  { id: 'ai-explain-quiz', title: 'Quiz Questions', action: 'quiz' },
]

const CATEGORY_MAP: Record<string, SaveCategory> = {
  'save-vocabulary': 'vocabulary',
  'save-sentence': 'sentence',
  'save-phrase': 'phrase',
  'save-grammar': 'grammar',
  'save-reading': 'reading',
  'save-writing': 'writing',
  'save-speaking': 'speaking',
  'save-mistake': 'mistake',
}

const SAVE_CATEGORY_ITEMS: { id: string; title: string; category: SaveCategory }[] = [
  { id: 'save-vocabulary', title: 'Save as Vocabulary', category: 'vocabulary' },
  { id: 'save-sentence', title: 'Save as Example Sentence', category: 'sentence' },
  { id: 'save-phrase', title: 'Save as Useful Phrase', category: 'phrase' },
  { id: 'save-grammar', title: 'Save as Grammar Note', category: 'grammar' },
  { id: 'save-reading', title: 'Save as Reading Material', category: 'reading' },
  { id: 'save-writing', title: 'Save as Writing Idea', category: 'writing' },
  { id: 'save-speaking', title: 'Save as Speaking Idea', category: 'speaking' },
  { id: 'save-mistake', title: 'Save as Mistake Note', category: 'mistake' },
]

function createContextMenus(): void {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'save-selection',
      title: 'Save to IELTS Journey',
      contexts: ['selection'],
    })

    for (const item of SAVE_CATEGORY_ITEMS) {
      chrome.contextMenus.create({
        id: item.id,
        title: item.title,
        contexts: ['selection'],
        parentId: 'save-selection',
      })
    }

    chrome.contextMenus.create({
      id: 'ai-explain',
      title: 'Explain with AI',
      contexts: ['selection'],
    })

    for (const item of AI_EXPLAIN_ITEMS) {
      chrome.contextMenus.create({
        id: item.id,
        title: item.title,
        contexts: ['selection'],
        parentId: 'ai-explain',
      })
    }
  })
}

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    const { initializeOnInstall } = await import('../services/storage')
    await initializeOnInstall()
    await updateDailyProgress({ streak: 1 })
  }
  createContextMenus()
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!info.selectionText || !tab?.id) return

  const category = CATEGORY_MAP[info.menuItemId as string]
  if (category) {
    chrome.tabs.sendMessage(tab.id, {
      type: 'SAVE_SELECTION_FULL',
      payload: {
        text: info.selectionText,
        category,
        pageTitle: tab.title,
        pageUrl: tab.url,
      },
    }).catch(() => {
      // Content script not available on this tab — silently ignore
    })
    return
  }

  const aiItem = AI_EXPLAIN_ITEMS.find((i) => i.id === info.menuItemId)
  if (aiItem) {
    chrome.tabs.sendMessage(tab.id, {
      type: 'AI_EXPLAIN',
      payload: {
        text: info.selectionText,
        action: aiItem.action,
      },
    }).catch(() => {
      // Content script not available on this tab — silently ignore
    })
  }
})

initMessaging()
initializeStorageBridge()

export {}
