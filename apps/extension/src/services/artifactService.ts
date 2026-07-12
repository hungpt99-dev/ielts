import { safeStorageGet, safeStorageSet } from '../utils/safe-chrome'
import { incrementDailyProgress, addSavedItem } from './storage'
import type { LearningEntry } from '../types'
import { emitExtensionArticleSaved } from '../background/eventEmitters'

export interface ExtensionArtifact {
  id: string
  url: string
  title: string
  description: string
  favicon: string
  contentText: string
  tags: string[]
  isFavorite: boolean
  category: 'article' | 'video' | 'reference' | 'tool' | 'other'
  contentType: string
  source: string
  wordCount: number
  readingStatus: 'unread' | 'in_progress' | 'completed' | 'saved_for_later'
  createdAt: string
  updatedAt: string
}

const ARTIFACTS_KEY = 'artifacts'

function extractFavicon(url: string): string {
  try {
    const u = new URL(url)
    return `${u.protocol}//${u.hostname}/favicon.ico`
  } catch {
    return ''
  }
}

export async function getAllArtifacts(): Promise<ExtensionArtifact[]> {
  try {
    const result = await safeStorageGet<ExtensionArtifact[]>(ARTIFACTS_KEY)
    return result[ARTIFACTS_KEY] || []
  } catch {
    return []
  }
}

export async function saveArtifact(artifact: ExtensionArtifact): Promise<void> {
  const items = await getAllArtifacts()
  items.unshift(artifact)
  await safeStorageSet({ [ARTIFACTS_KEY]: items })
}

export async function deleteArtifact(id: string): Promise<void> {
  const items = await getAllArtifacts()
  const filtered = items.filter(a => a.id !== id)
  if (filtered.length !== items.length) {
    await safeStorageSet({ [ARTIFACTS_KEY]: filtered })
  }
}

interface ExtractResult {
  title: string
  url: string
  content: string
  excerpt: string
  description: string
  wordCount: number
}

function crawlActiveTab(): Promise<ExtractResult> {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0]
      if (!tab?.id) { reject(new Error('No active tab found')); return }
      chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_ARTICLE' }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
          return
        }
        if (!response?.success) {
          reject(new Error(response?.error || 'Failed to extract page content'))
          return
        }
        resolve(response.data as ExtractResult)
      })
    })
  })
}

export async function saveCurrentPageAsArtifact(): Promise<ExtensionArtifact> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.url || !tab?.id) {
    throw new Error('No active page to save')
  }

  let extracted: ExtractResult | null = null
  try {
    extracted = await crawlActiveTab()
  } catch {
    // content extraction is best-effort
  }

  const now = new Date().toISOString()
  const title = extracted?.title || tab.title || 'Untitled'
  const url = extracted?.url || tab.url
  const content = extracted?.content || ''
  const description = extracted?.description || extracted?.excerpt || ''
  const wordCount = extracted?.wordCount || content.split(/\s+/).filter(Boolean).length

  const artifact: ExtensionArtifact = {
    id: crypto.randomUUID(),
    url,
    title,
    description,
    favicon: extractFavicon(url),
    contentText: content,
    tags: [],
    isFavorite: false,
    category: 'article',
    contentType: 'article',
    source: 'extension',
    wordCount,
    readingStatus: 'unread',
    createdAt: now,
    updatedAt: now,
  }

  await saveArtifact(artifact)
  await incrementDailyProgress('articlesSaved', 1)

  const entry: LearningEntry = {
    id: artifact.id,
    text: title,
    category: 'reading',
    topic: '',
    skill: 'reading',
    difficulty: '',
    tags: [],
    personalNote: '',
    pageTitle: title,
    pageUrl: url,
    status: 'new',
    createdAt: now,
    updatedAt: now,
  }
  await addSavedItem(entry)

  try {
    emitExtensionArticleSaved(title, url)
  } catch {
    // event emission is best-effort
  }

  return artifact
}
