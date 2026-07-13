# Adding an AI Provider

The AI layer is provider-neutral through the `AIAdapter` interface in `@ielts/ai`.

## Interface

All providers implement (`packages/ai/src/adapters/types.ts`):

```typescript
interface AIAdapter {
  complete(request: CompletionRequest, config: AIAdapterConfig): Promise<CompletionResponse>
  testConnection(config: AIAdapterConfig): Promise<boolean>
}
```

## Steps

### 1. Create the adapter

Location: `packages/ai/src/adapters/<provider-name>.ts`

Extend the pattern from `packages/ai/src/adapters/openai.ts`:

```typescript
import type { AIAdapter, AIAdapterConfig, CompletionRequest, CompletionResponse } from './types'
import { AIAuthError, AIRateLimitError, AINetworkError } from '../errors/types'

export class MyProviderAdapter implements AIAdapter {
  async complete(request: CompletionRequest, config: AIAdapterConfig): Promise<CompletionResponse> {
    const url = `${config.baseUrl.replace(/\/+$/, '')}/chat/completions`
    // … fetch with provider-specific headers and body …
  }

  async testConnection(config: AIAdapterConfig): Promise<boolean> {
    // … lightweight call to verify credentials …
  }
}
```

### 2. Handle provider-specific errors

Map HTTP status codes to the canonical error types:

| Provider response | Error class |
|---|---|
| 401 Unauthorized | `AIAuthError` |
| 429 Rate Limited | `AIRateLimitError` |
| Network failure | `AINetworkError` |
| Empty response | `AIEmptyResponseError` |

### 3. Register in `createAIClient`

In `packages/ai/src/client/index.ts`, add the provider option:

```typescript
export function createAIClient(provider?: string, adapter?: AIAdapter): AIClient {
  const actual = adapter ?? (provider === 'myprovider' ? new MyProviderAdapter() : new OpenAIAdapter())
  // …
}
```

### 4. Add provider configuration

Settings are stored in the `UserConfiguration.advanced.providers` map:

```typescript
interface AiProviderConfig {
  providerId: string
  provider: AiProviderType    // add your provider type to this union
  apiKey: string
  baseUrl: string
  model: string
  temperature: number
  maxTokens: number
  systemPrompt: string
  costLimit: number
  usageLimit: number
  fallbackProvider: string | null
}
```

Update the `AiProviderType` union in `apps/web/src/features/configuration/models.ts`.

### 5. No secrets in source

- API keys are stored in `localStorage` (web) or `chrome.storage` (extension), never in source code.
- Default `baseUrl` should point to the provider's standard API endpoint.
- Users configure their own API key through the Settings UI.

### 6. Add tests

Location: `packages/ai/src/__tests__/adapters.test.ts`

- Mock `fetch` responses for each provider endpoint.
- Test `complete` with valid/expired/invalid API keys.
- Test `testConnection` returns `true`/`false` correctly.
- Test error mapping for each HTTP status code.
