import type { AiProviderDefinition } from '@ielts/config'
import type { AIAdapter } from '../adapters/types'
import { OpenAIAdapter } from '../adapters/openai'

export class AiAdapterFactory {
  create(_provider: AiProviderDefinition): AIAdapter {
    return new OpenAIAdapter()
  }
}
