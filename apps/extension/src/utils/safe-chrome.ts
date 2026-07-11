/* eslint-disable @typescript-eslint/no-explicit-any */
import { OPENAI_BASE_URL, DEFAULT_MODEL } from '@ielts/settings'

const CONTEXT_INVALIDATED = 'Extension context invalidated'

function isContextError(err: unknown): boolean {
  return (
    err instanceof Error &&
    (err.message.includes(CONTEXT_INVALIDATED) ||
      err.message.includes('Receiving end does not exist') ||
      err.message.includes('Could not establish connection'))
  )
}

export function safeStorageGet<T>(
  keys: string | string[],
): Promise<Record<string, T | undefined>> {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.get(keys, (result) => {
        if (chrome.runtime.lastError) {
          if (!isContextError(chrome.runtime.lastError)) {
            console.warn('[IELTS] storage.local.get error:', chrome.runtime.lastError)
          }
          resolve({})
          return
        }
        resolve(result as Record<string, T | undefined>)
      })
    } catch (err) {
      if (!isContextError(err)) {
        console.warn('[IELTS] storage.local.get threw:', err)
      }
      resolve({})
    }
  })
}

export function safeStorageSet(
  data: Record<string, unknown>,
): Promise<void> {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.set(data, () => {
        chrome.runtime.lastError
        resolve()
      })
    } catch {
      resolve()
    }
  })
}

export function safeSyncGet<T>(
  keys: string | string[],
): Promise<Record<string, T | undefined>> {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.get(keys, (result) => {
        resolve(result as Record<string, T | undefined>)
      })
    } catch {
      resolve({})
    }
  })
}

export async function safeSendMessage(message: Record<string, unknown>): Promise<void> {
  try {
    await chrome.runtime.sendMessage(message)
  } catch (err) {
    if (!isContextError(err)) {
      console.warn('[IELTS] sendMessage error:', err)
    }
  }
}

export function safeSendMessageCb(
  message: Record<string, unknown>,
  cb?: (response: unknown) => void,
): void {
  try {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        if (!isContextError(chrome.runtime.lastError)) {
          console.warn('[IELTS] sendMessage error:', chrome.runtime.lastError)
        }
        return
      }
      cb?.(response)
    })
  } catch {
    // Extension context invalidated — silently ignore
  }
}

let cachedConfig: { apiKey: string; baseUrl: string; model: string } | null = null

export function safeFetchProviderConfig(): Promise<{
  apiKey: string
  baseUrl: string
  model: string
}> {
  if (cachedConfig) return Promise.resolve(cachedConfig)

  return (async () => {
    try {
      const [syncResult, localResult] = await Promise.all([
        safeSyncGet<any>(['extensionSettings']),
        safeStorageGet<any>(['aiApiKey']),
      ])
      const syncSettings = syncResult.extensionSettings || {}

      const apiKey = localResult.aiApiKey || ''
      const baseUrl = syncSettings.aiBaseUrl || OPENAI_BASE_URL
      const model = syncSettings.aiModel || DEFAULT_MODEL

      cachedConfig = { apiKey, baseUrl, model }
      return cachedConfig
    } catch {
      return { apiKey: '', baseUrl: OPENAI_BASE_URL, model: DEFAULT_MODEL }
    }
  })()
}
