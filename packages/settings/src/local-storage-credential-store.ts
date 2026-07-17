import { STORAGE_KEYS } from '@ielts/config'
import type { AiProviderId, AiCredential } from '@ielts/config'
import type { AiCredentialProvider } from '@ielts/ai'

export class LocalStorageCredentialStore implements AiCredentialProvider {
  private readonly keyPrefix: string

  constructor(keyPrefix?: string) {
    this.keyPrefix = keyPrefix ?? STORAGE_KEYS.localStorage.apiKeyPrefix
  }

  async getCredential(providerId: AiProviderId): Promise<AiCredential | undefined> {
    try {
      const raw = localStorage.getItem(`${this.keyPrefix}${providerId}`)
      if (!raw) return undefined
      return { apiKey: raw }
    } catch {
      return undefined
    }
  }

  async storeCredential(providerId: AiProviderId, credential: AiCredential): Promise<void> {
    try {
      localStorage.setItem(`${this.keyPrefix}${providerId}`, credential.apiKey)
    } catch {
      /* localStorage full or unavailable */
    }
  }

  async clearCredential(providerId: AiProviderId): Promise<void> {
    try {
      localStorage.removeItem(`${this.keyPrefix}${providerId}`)
    } catch {
      /* ignore */
    }
  }
}
