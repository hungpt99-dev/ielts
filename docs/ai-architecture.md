# AI Architecture

> Design of the optional AI integration layer using the Adapter Pattern for provider-agnostic AI access.

---

## 1. Design Principles

- **No hard-coded API keys** — Keys are user-provided and stored locally
- **No direct AI calls from UI** — Components go through service layer
- **Provider-agnostic** — Adapter pattern makes providers swappable
- **Prompt separation** — Prompts are versioned, modular, and separate from code
- **Response validation** — All AI responses are validated with Zod schemas
- **Graceful degradation** — Handle errors, timeouts, and invalid JSON without crashing
- **Privacy-safe** — Only send user data to AI when explicitly triggered

---

## 2. Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                         │
│  Components call feature services (never AI directly)         │
└──────────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                          │
│  Feature Services                                            │
│    ├── AI Tutor Service                                      │
│    ├── Exercise Generation Service                            │
│    ├── Vocabulary Service (AI enrichment)                     │
│    └── ...                                                    │
└──────────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────┐
│                    AI PACKAGE (packages/ai)                   │
│                                                               │
│  ┌────────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │  Services  │  │ Prompts  │  │ Schemas  │  │  Adapters │  │
│  │  (orchest- │  │ (version-│  │ (Zod     │  │  (OpenAI, │  │
│  │   rate)    │  │  ed)     │  │  valid.) │  │  Generic) │  │
│  └────────────┘  └──────────┘  └──────────┘  └───────────┘  │
│                                                               │
│  ┌────────────┐  ┌──────────┐  ┌──────────┐                 │
│  │  Client    │  │  Errors  │  │  Utils   │                 │
│  │  (fetch)   │  │  (typed) │  │  (cache) │                 │
│  └────────────┘  └──────────┘  └──────────┘                 │
└──────────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────┐
│                    EXTERNAL                                   │
│  OpenAI-compatible API (user-configured endpoint)            │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Package Structure

```
packages/ai/src/
├── index.ts              # Public API barrel
├── client/
│   ├── index.ts          # HTTP client for AI API
│   └── types.ts          # Request/response types
├── adapters/
│   ├── index.ts          # Adapter registry
│   ├── types.ts          # Adapter interface
│   └── openai.ts         # OpenAI-compatible adapter
├── prompts/
│   ├── index.ts          # Prompt registry
│   ├── types.ts          # Prompt template types
│   ├── vocabulary.ts     # Vocabulary-related prompts
│   ├── article.ts        # Article/reading prompts
│   ├── video.ts          # YouTube/video prompts
│   ├── dictionary.ts     # Dictionary definition prompts
│   └── explain.ts        # Text explanation prompts
├── schemas/
│   ├── index.ts          # Schema registry
│   ├── vocabulary.ts     # Response schemas for vocab
│   ├── article.ts        # Response schemas for articles
│   ├── video.ts          # Response schemas for videos
│   ├── dictionary.ts     # Response schemas for dictionary
│   └── explain.ts        # Response schemas for explain
├── services/
│   ├── index.ts          # Service registry
│   ├── vocabulary.ts     # Vocabulary AI service
│   ├── article.ts        # Article AI service
│   ├── video.ts          # Video AI service
│   ├── dictionary.ts     # Dictionary AI service
│   └── explain.ts        # Text explanation service
├── errors/
│   ├── index.ts          # Error types
│   └── types.ts          # AIError definitions
└── utils/
    ├── index.ts          # Utility exports
    ├── cache.ts          # Response caching
    └── response.ts       # Response parsing helpers
```

---

## 4. Adapter Pattern

### 4.1 Interface

```typescript
// packages/ai/src/adapters/types.ts
export interface IAiAdapter {
  generateCompletion(params: CompletionParams): Promise<AiResponse>
  testConnection(): Promise<boolean>
}

export interface CompletionParams {
  model: string
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  temperature?: number
  maxTokens?: number
}
```

### 4.2 OpenAI Adapter

```typescript
// packages/ai/src/adapters/openai.ts
export class OpenAIAdapter implements IAiAdapter {
  constructor(private config: AiProviderConfig) {}

  async generateCompletion(params: CompletionParams): Promise<AiResponse> {
    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: params.model,
        messages: params.messages,
        temperature: params.temperature ?? 0.7,
        max_tokens: params.maxTokens ?? 1024,
      }),
    })

    if (!response.ok) {
      throw new AIError(`API error: ${response.status}`, 'API_ERROR')
    }

    const data = await response.json()
    return this.parseResponse(data)
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.generateCompletion({
        model: this.config.model,
        messages: [{ role: 'user', content: 'ping' }],
        maxTokens: 1,
      })
      return true
    } catch {
      return false
    }
  }
}
```

### 4.3 Provider Configuration

Users configure their AI provider in settings:

```typescript
interface AiProviderConfig {
  provider: 'openai' | 'openai-compatible'
  baseUrl: string        // Default: https://api.openai.com/v1
  apiKey: string         // User-provided
  model: string          // Default: gpt-4o-mini
  temperature: number    // Default: 0.7
  maxTokens: number      // Default: 1024
}
```

---

## 5. Prompt System

### 5.1 Structure

Prompts are separated from code and organized by domain:

```typescript
// packages/ai/src/prompts/vocabulary.ts
export const vocabularyPrompts = {
  generateExamples: (word: string, meaning: string) => ({
    role: 'system' as const,
    content: `You are an IELTS vocabulary tutor. Generate 3 example sentences.`,
  }),
  explainMeaning: (word: string) => ({
    role: 'user' as const,
    content: `Explain the word "${word}" in simple English...`,
  }),
}
```

### 5.2 Prompt Versioning

Each prompt template includes a version identifier to track changes:

```typescript
const PROMPT_VERSION = 'v1'

interface PromptTemplate {
  version: string
  build(context: PromptContext): string
}
```

---

## 6. Response Validation

All AI responses are validated with Zod schemas:

```typescript
// packages/ai/src/schemas/vocabulary.ts
export const VocabularyResponseSchema = z.object({
  word: z.string(),
  meaning: z.string(),
  partOfSpeech: z.string(),
  exampleSentence: z.string(),
  synonyms: z.array(z.string()),
})

// Parse and validate
const result = VocabularyResponseSchema.safeParse(aiResponse)
if (!result.success) {
  throw new ValidationError('Invalid AI response format')
}
```

---

## 7. Error Handling

```typescript
// packages/ai/src/errors/types.ts
export class AIError extends Error {
  constructor(
    message: string,
    public code: 'API_ERROR' | 'TIMEOUT' | 'INVALID_RESPONSE' | 'RATE_LIMITED' | 'AUTH_ERROR' | 'NETWORK_ERROR'
  ) {
    super(message)
    this.name = 'AIError'
  }
}
```

Error handling strategy:

| Error | Handling |
|-------|----------|
| Network error | Retry with backoff, show "Check internet" message |
| Auth error | Prompt user to check API key |
| Rate limited | Show cool-down message, suggest waiting |
| Invalid response | Log error, show "AI returned unexpected format" |
| Timeout | Retry once, then show friendly error |
| API key missing | Show "Configure AI in settings" banner |

---

## 8. Privacy Controls

- AI features are **opt-in** — the user must configure an API key
- No data is sent to AI without explicit user action (clicking a button)
- The proactive message system works with **local rules by default** — AI-powered proactive messages are optional
- Users can see exactly what text is being sent to the AI before confirming
- API key is stored in `localStorage` or `chrome.storage.local` and never hard-coded

---

## 9. Adding a New AI Provider

```typescript
// 1. Implement IAiAdapter
export class CustomProviderAdapter implements IAiAdapter {
  // ... implementation
}

// 2. Register in the adapter factory
import { CustomProviderAdapter } from './adapters/custom'

export function createAdapter(config: AiProviderConfig): IAiAdapter {
  switch (config.provider) {
    case 'openai':
      return new OpenAIAdapter(config)
    case 'custom':
      return new CustomProviderAdapter(config)
    default:
      throw new AIError(`Unknown provider: ${config.provider}`, 'CONFIG_ERROR')
  }
}
```
