# Error Reference

## Error Categories

### Storage Errors (`@ielts/storage`)

| Error | Base | Cause | Recovery |
|---|---|---|---|
| `StorageError` | `Error` | Generic database operation failure | Retry operation |
| `ValidationError` | `StorageError` | Zod schema validation failure | Fix input data per schema |
| `MigrationError` | `Error` | Schema migration failure | App restart retries migration |
| `BackupError` | `Error` | Export/import failure | Check data integrity |
| `EntityNotFoundError` | `StorageError` | Entity not found by ID | Verify ID; create if needed |
| `DuplicateEntityError` | `StorageError` | Entity with same ID exists | Use `update` instead of `create` |
| `DatabaseClosedError` | `StorageError` | Database not initialised | Call `getDb()` first |

**Behaviour**: `safeDb()` wraps all repository operations. On `DatabaseClosedError`, it auto-reconnects. Other errors propagate to the caller.

### AI Errors (`@ielts/ai`)

| Error | Code | Cause | Recovery |
|---|---|---|---|
| `AIError` | `'UNKNOWN'` | Generic AI failure | Check logs, retry |
| `AIAuthError` | `'AUTH_ERROR'` | Invalid API key | Update API key in Settings |
| `AIRateLimitError` | `'RATE_LIMIT'` | Provider rate limit hit | Wait and retry |
| `AINetworkError` | `'NETWORK_ERROR'` | Network/endpoint unreachable | Check internet and endpoint URL |
| `AIEmptyResponseError` | `'EMPTY_RESPONSE'` | AI returned no content | Retry |
| `AIConfigError` | `'CONFIG_ERROR'` | API key not configured | Add API key in Settings |

**Behaviour**: All AI errors are thrown from `callAI()` / `complete()`. Callers should catch and display appropriate user messages.

### Tutor Errors (`@ielts/ai-tutor-engine`)

`TutorError` is an **interface** (not a class) with:

| Code | Meaning | Recoverable |
|---|---|---|
| `profile_unavailable` | Learner profile not found | Yes |
| `progress_unavailable` | Progress data missing | Yes |
| `invalid_context` | Context cannot be built | Yes |
| `ai_not_configured` | AI provider not set up | Yes |
| `ai_quota_exceeded` | Rate limit / quota hit | Yes |
| `ai_timeout` | AI call timed out | Yes |
| `ai_output_invalid` | AI response parsing failed | Yes |
| `storage_failure` | Repository operation failed | Yes |
| `context_build_failure` | Learner context assembly failed | Yes |
| `memory_failure` | Tutor memory operation failed | Yes |
| `event_processing_failure` | Event handler error | Yes |
| `generation_cancelled` | User cancelled operation | No |
| `unsupported_tutor_mode` | Mode not implemented | No |

**Behaviour**: `TutorOperationResult<T>` wraps success/partial/failure results. Recoverable errors allow retry; non-recoverable errors surface to the UI.

### Learning Errors (`@ielts/learning-engine`)

The learning engine returns `LearningOperationResult<T>` with status `'success' \| 'partial' \| 'failure' \| 'cancelled'`. Errors include:

| Scenario | Handling |
|---|---|
| Session not found | `EntityNotFoundError` |
| Exercise generation failure | Warning in result; fallback exercises used |
| AI unavailable | `OfflineTutorIntelligenceAdapter` provides deterministic fallback |
| Validation failure | `ValidationError` from Zod schema |

## Error Handling Patterns

1. **Repository layer**: `safeDb()` catches and wraps IndexedDB errors as `StorageError`.
2. **Application layer**: Use case functions return `OperationResult` types with status, data, and error fields.
3. **UI layer**: Components display user-friendly messages from error codes.
4. **Offline resilience**: The system degrades gracefully — when AI is unavailable, deterministic grading and template-based exercises are used as fallbacks.
