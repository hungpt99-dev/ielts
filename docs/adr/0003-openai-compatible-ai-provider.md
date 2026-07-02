# ADR 0003: OpenAI-Compatible AI Provider with Adapter Pattern

**Date:** 2026-07-01
**Status:** Accepted
**Decision:** Support OpenAI-compatible API providers through an adapter pattern, with all AI features being optional and user-controlled.

---

## Context

The app needs optional AI capabilities:
- Vocabulary enrichment (definitions, examples)
- Exercise generation
- AI Tutor chat
- Text explanation and simplification
- Dictionary lookups

### Requirements

- AI must be **optional** — core features work without it
- User provides their **own API key** — never hard-coded
- Support **custom endpoints** (not just OpenAI)
- All AI calls go **directly from browser** to the AI API
- Response validation with **Zod schemas**
- **Graceful handling** of errors and invalid responses

## Decision

Use the **Adapter Pattern** with an `IAiAdapter` interface:

```typescript
interface IAiAdapter {
  complete(params: CompletionParams): Promise<AiResponse>
  testConnection(): Promise<boolean>
}
```

- Default adapter: **OpenAI-compatible** (OpenAI, Azure, Groq, Together, etc.)
- Users configure: base URL, API key, model, temperature, max tokens
- Adapter factory creates the appropriate adapter
- Prompt builders are versioned and modular
- Responses are validated against Zod schemas

## Consequences

### Positive

- **Provider-agnostic:** Easy to add new providers
- **User-controlled:** User owns their API key and data sent to AI
- **Privacy-safe:** Only explicitly selected text is sent
- **Graceful degradation:** AI failures don't crash the app
- **Testable:** Adapters can be mocked in tests

### Negative

- **Additional complexity:** Adapter layer, prompt builders, response validators
- **User setup required:** User must obtain and configure their own API key
- **Cost borne by user:** AI usage costs are the user's responsibility
- **CORS considerations:** Browser → API calls must be supported by the endpoint

## Provider Configuration

Users can configure:

| Field | Default | Description |
|-------|---------|-------------|
| `baseUrl` | `https://api.openai.com/v1` | API endpoint |
| `apiKey` | — | User's API key |
| `model` | `gpt-4o-mini` | Model identifier |
| `temperature` | `0.7` | Response creativity |
| `maxTokens` | `1024` | Max response length |

## Privacy Design

- AI features are **opt-in** (disabled by default)
- API key stored in `localStorage` or `chrome.storage.local`
- Only text the user explicitly selects is sent to the API
- Proactive messages use local rules by default; AI-powered version is optional
- Users can see what text will be sent before confirming

## Related

- [AI Architecture](../ai-architecture.md)
- [Security & Privacy](../security-privacy.md)
