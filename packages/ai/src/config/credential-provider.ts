import type { AiProviderId, AiCredential } from '@ielts/config'

export interface AiCredentialProvider {
  getCredential(providerId: AiProviderId): Promise<AiCredential | undefined>
  storeCredential(providerId: AiProviderId, credential: AiCredential): Promise<void>
  clearCredential(providerId: AiProviderId): Promise<void>
}
