# AI Troubleshooting

## API Key Not Set

- **Symptom**: `AIConfigError` with message "API key not configured. Add your AI API key in Settings."
- **Fix**: Go to Settings > AI Provider and enter your API key.
- **Check**: `localStorage` key `ielts-settings` → `advanced.providers[].apiKey`.
- **Check**: `createAIClient` checks `config.apiKey` and returns an error result (not throw) for missing keys.

## Rate Limits

- **Symptom**: `AIRateLimitError` with message "Rate limit exceeded. Wait a moment and try again."
- **Cause**: Too many requests within the provider's time window.
- **Fix**: Wait and retry. The `generateResultCache` in `@ielts/ai` may reduce repeat requests.
- **Prevention**: Configure `costLimit` and `usageLimit` in provider settings.

## Malformed Response

- **Symptom**: AI returns content that fails Zod validation in the calling service.
- **Location**: Validation happens in `@ielts/ai`'s service functions (e.g., `explain.ts`, `article.ts`) using Zod schemas.
- **Debugging**: Check the raw AI response in the browser's Network tab. The Zod error message includes the schema path that failed.
- **Fix**: Improve the system prompt to request more structured output. Add fallback parsing in the service.

## Timeout

- **Symptom**: AI call hangs or returns after a long delay.
- **Default timeout**: No explicit timeout in `OpenAIAdapter.complete` — the browser's `fetch` timeout applies.
- **Fix**: Reduce `maxTokens` in provider settings. Check network latency to the provider's endpoint.

## Network Error

- **Symptom**: `AINetworkError` with message "Network error. Check your internet connection and API endpoint."
- **Check**: Internet connectivity. Provider endpoint health (e.g., `https://api.openai.com` status).
- **Check**: Any firewall or VPN blocking the provider's domain.
- **Fallback**: If `fallbackProvider` is configured, the system retries with the fallback.

## Provider Unavailable

- **Symptom**: Provider-specific errors in console.
- **Check**: `baseUrl` in provider settings. Default for OpenAI is `https://api.openai.com`.
- **Custom providers**: If using OpenRouter, Groq, or local endpoints, verify the URL and model name.

## Fallback Behavior

- The `callAI` function returns `{ content: null, error: '...' }` for recoverable failures (no throw).
- Engines that wrap `callAI` should check `result.error` and decide fallback behavior (e.g., template-based exercises, cached responses).
- The `generateResultCache` stores successful responses to serve as fallback for repeat requests.
