/* eslint-disable @typescript-eslint/no-explicit-any */

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
          resolve({})
          return
        }
        resolve(result as Record<string, T | undefined>)
      })
    } catch {
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
      chrome.storage.sync.get(keys, (result) => {
        if (chrome.runtime.lastError) {
          resolve({})
          return
        }
        resolve(result as Record<string, T | undefined>)
      })
    } catch {
      resolve({})
    }
  })
}

export function safeSyncSet(
  data: Record<string, unknown>,
): Promise<void> {
  return new Promise((resolve) => {
    try {
      chrome.storage.sync.set(data, () => {
        resolve()
      })
    } catch {
      resolve()
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

export function safeFetchProviderConfig(): Promise<{
  apiKey: string
  baseUrl: string
  model: string
}> {
  return (async () => {
    try {
      const [syncResult, localResult] = await Promise.all([
        safeSyncGet<any>(['extensionSettings']),
        safeStorageGet<any>(['aiApiKey']),
      ])
      const settings = syncResult.extensionSettings || {}
      return {
        apiKey: localResult.aiApiKey || '',
        baseUrl: settings.aiBaseUrl || 'https://api.openai.com/v1',
        model: settings.aiModel || 'gpt-4o-mini',
      }
    } catch {
      return { apiKey: '', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' }
    }
  })()
}
