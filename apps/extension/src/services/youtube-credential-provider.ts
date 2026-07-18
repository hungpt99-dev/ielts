import { STORAGE_KEYS } from '@ielts/config'
import type { AiProviderId, AiCredential } from '@ielts/config'
import type { AiCredentialProvider } from '@ielts/ai'

export class ExtensionYouTubeCredentialProvider implements AiCredentialProvider {
  async getCredential(_providerId: AiProviderId): Promise<AiCredential | undefined> {
    return new Promise((resolve) => {
      chrome.storage.local.get(STORAGE_KEYS.extensionLocal.aiApiKey, (result) => {
        const key = result[STORAGE_KEYS.extensionLocal.aiApiKey] as string | undefined
        resolve(key ? { apiKey: key } : undefined)
      })
    })
  }

  async storeCredential(_providerId: AiProviderId, credential: AiCredential): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [STORAGE_KEYS.extensionLocal.aiApiKey]: credential.apiKey }, resolve)
    })
  }

  async clearCredential(_providerId: AiProviderId): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.remove(STORAGE_KEYS.extensionLocal.aiApiKey, resolve)
    })
  }
}
