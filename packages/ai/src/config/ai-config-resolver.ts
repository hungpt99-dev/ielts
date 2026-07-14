import {
  type AiProviderId,
  type AiProviderDefinition,
  type DefaultAiConfig,
  getProviderById,
} from '@ielts/config'
import type { AiCredentialProvider } from './credential-provider'

export interface AiUserSettings {
  providerId: AiProviderId
  model?: string
  customApiUrl?: string
  temperature?: number
}

export interface ResolvedAiConnectionConfig {
  readonly providerId: AiProviderId
  readonly adapterType: 'openai-compatible'
  readonly apiUrl: string
  readonly model: string
  readonly apiKey?: string
  readonly timeoutMs: number
  readonly maxRetries: number
  readonly temperature: number
}

export class AiConfigurationResolver {
  constructor(
    private readonly credentialProvider: AiCredentialProvider,
    private readonly appDefaults: DefaultAiConfig,
  ) {}

  async resolve(userSettings: AiUserSettings): Promise<ResolvedAiConnectionConfig> {
    const provider = this.getProviderOrThrow(userSettings.providerId)
    const credential = await this.credentialProvider.getCredential(userSettings.providerId)

    return {
      providerId: provider.id,
      adapterType: 'openai-compatible',
      apiUrl: userSettings.customApiUrl || provider.defaultApiUrl || '',
      model: userSettings.model || provider.defaultModel || this.appDefaults.defaultModel,
      apiKey: credential?.apiKey,
      timeoutMs: this.appDefaults.timeoutMs,
      maxRetries: this.appDefaults.maxRetries,
      temperature: userSettings.temperature ?? this.appDefaults.temperature,
    }
  }

  private getProviderOrThrow(providerId: AiProviderId): AiProviderDefinition {
    const provider = getProviderById(providerId)
    if (!provider) {
      throw new Error(`Unsupported AI provider: ${providerId}`)
    }
    return provider
  }
}
