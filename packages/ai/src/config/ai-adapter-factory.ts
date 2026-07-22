import type { AiProviderDefinition } from '@ielts/config'
import type { AIAdapter } from '../adapters/types'
import { OpenAiCompatibleAdapter } from '../adapters/openai'

export class AiAdapterFactory {
  create(_provider: AiProviderDefinition): AIAdapter {
    if (_provider.adapter === 'openai-compatible') {
      return new OpenAiCompatibleAdapter()
    }
    return new OpenAiCompatibleAdapter()
  }
}
