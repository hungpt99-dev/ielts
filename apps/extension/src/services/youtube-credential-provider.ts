import type { AiCredentialProvider, AiProviderId, AiCredential } from '@ielts/config'

export class ExtensionYouTubeCredentialProvider implements AiCredentialProvider {
  async getCredential(_providerId: AiProviderId): Promise<AiCredential | undefined> {
    return new Promise((resolve) => {
      chrome.storage.local.get('aiApiKey', (result) => {
        const key = result.aiApiKey as string | undefined
        resolve(key ? { apiKey: key } : undefined)
      })
    })
  }

  async storeCredential(_providerId: AiProviderId, credential: AiCredential): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set({ aiApiKey: credential.apiKey }, resolve)
    })
  }

  async clearCredential(_providerId: AiProviderId): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.remove('aiApiKey', resolve)
    })
  }
}
