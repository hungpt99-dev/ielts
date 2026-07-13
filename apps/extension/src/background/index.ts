import type { SaveCategory, LearningEntry } from '../types'
import { updateDailyProgress, incrementDailyProgress } from '../services/storage'
import { saveEntry } from '../storage/indexedDB'
import { saveVocabularyEntry } from '../storage/vocabularyStore'
import { safeStorageSet } from '../utils/safe-chrome'
import { initMessaging } from './messaging'
import { initAiService } from './ai-service'

interface AiExplainItem {
  id: string
  title: string
  action: string
}

const AI_EXPLAIN_ITEMS: AiExplainItem[] = [
  { id: 'ai-explain-simple', title: 'Explain in Simple English', action: 'simple' },
  { id: 'ai-explain-translate', title: 'Translate', action: 'translate' },
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

    chrome.contextMenus.create({
      id: 'save-as-artifact',
      title: 'Save page as Artifact',
      contexts: ['page'],
    })
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
  if (!tab?.id) return

  if (info.menuItemId === 'save-as-artifact') {
    const artifact = {
      url: tab.url || '',
      title: tab.title || '',
      description: '',
      favicon: tab.url ? `https://www.google.com/s2/favicons?domain=${new URL(tab.url).hostname}&sz=32` : '',
      tags: [],
      isFavorite: false,
      category: 'article',
    }
    chrome.tabs.sendMessage(tab.id, {
      type: 'SAVE_ARTIFACT',
      payload: artifact,
    }).catch(() => {
      // Content script not available on this tab — silently ignore
    })
    return
  }

  if (!info.selectionText) return

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
initAiService()

// Sync bridge handlers
import('./messageHandlers/syncBridgeHandler').then(({ handleGetSyncStatus, handleExportData, handleImportData }) => {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || typeof message !== 'object') return false
    const msg = message as Record<string, unknown>

    if (msg.type === 'GET_SYNC_STATUS') {
      handleGetSyncStatus().then(sendResponse)
      return true
    }

    if (msg.type === 'EXPORT_EXTENSION_DATA') {
      handleExportData().then(sendResponse)
      return true
    }

    if (msg.type === 'IMPORT_EXTENSION_DATA') {
      handleImportData(msg.payload).then(sendResponse)
      return true
    }

    return false
  })
})

// Bidirectional sync handler (called from popup)
import('./sync/bidirectionalSyncController').then(({ syncBidirectional }) => {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || typeof message !== 'object') return false
    const msg = message as Record<string, unknown>

    if (msg.type === 'BIDIRECTIONAL_SYNC') {
      syncBidirectional().then(sendResponse).catch(() => sendResponse({ failed: 1 }))
      return true
    }

    return false
  })
})

// Web connection checker
import('./sync/webTabConnection').then(({ findWebAppTab }) => {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || typeof message !== 'object') return false
    const msg = message as Record<string, unknown>
    if (msg.type === 'CHECK_WEB_CONNECTION') {
      findWebAppTab().then((tab) => sendResponse({ connected: !!tab })).catch(() => sendResponse({ connected: false }))
      return true
    }
    return false
  })
})

// Auto sync message handlers
import('./sync/SyncMessageHandlers').then(({ registerSyncMessageHandlers }) => {
  registerSyncMessageHandlers()
})

// Trigger auto sync when extension popup opens
import('./sync/AutoSyncController').then(({ onExtensionPopupOpen }) => {
  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === 'POPUP_OPENED') { onExtensionPopupOpen() }
    return false
  })
})

// Process batched saves queued by content scripts via chrome.storage.local.
// Content scripts write to _pendingSaves (array) at most once per 2 seconds.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return
  const items = changes['_pendingSaves']?.newValue as Array<Record<string, unknown>> | undefined
  if (!items || !Array.isArray(items) || items.length === 0) return

  safeStorageSet({ _pendingSaves: [] }).then(async () => {
    let vocabCount = 0

    for (const pending of items) {
      if (!pending.text || !pending.category) continue
      try {
        const now = new Date().toISOString()
        const sharedId = crypto.randomUUID()

        const learningEntry: LearningEntry = {
          id: sharedId,
          text: pending.text as string,
          category: pending.category as LearningEntry['category'],
          topic: (pending.topic as string) || 'general',
          skill: ((pending.skill as string) || 'general') as LearningEntry['skill'],
          difficulty: ((pending.difficulty as string) || '') as LearningEntry['difficulty'],
          tags: (pending.tags as string[]) || [],
          personalNote: (pending.note as string) || '',
          pageTitle: (pending.pageTitle as string) || '',
          pageUrl: (pending.pageUrl as string) || '',
          status: 'new',
          createdAt: now,
          updatedAt: now,
        }
        await saveEntry(learningEntry)

        if (pending.category === 'vocabulary') {
          vocabCount++
          const text = pending.text as string
          await saveVocabularyEntry({
            id: sharedId,
            word: text.split(/\s+/)[0].replace(/[.,!?;:'"()\-]/g, ''),
            sourceSentence: text,
            pageTitle: (pending.pageTitle as string) || '',
            pageUrl: (pending.pageUrl as string) || '',
            topic: (pending.topic as string) || 'general',
            personalNote: (pending.note as string) || '',
            tags: (pending.tags as string[]) || [],
            meaning: '',
            translation: '',
            partOfSpeech: '',
            pronunciation: '',
            exampleSentence: '',
            synonyms: [],
            antonyms: [],
            collocations: [],
            wordFamily: [],
            difficulty: '',
            status: 'new',
            addedToReview: true,
            reviewId: '',
            createdAt: now,
            updatedAt: now,
          }).catch(() => {})
        }
      } catch (err) {
        console.error('[PendingSave] Item failed:', err)
      }
    }

    if (vocabCount > 0) {
      await incrementDailyProgress('wordsAdded', vocabCount)
    }
  })
})

export {}
