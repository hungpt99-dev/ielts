import { describe, it, expect } from 'vitest'
import {
  isCorsError,
  isRateLimitError,
  isAuthError,
  isNetworkError,
  isServerError,
  classifyError,
  buildErrorMessage,
  buildSuggestions,
  checkSourceUsability,
} from './errorHandling'
import { PUBLIC_API_SOURCES } from '../types'
import type { PublicApiSourceConfig } from '../types'

const mockSource: PublicApiSourceConfig = PUBLIC_API_SOURCES[0]

describe('isCorsError', () => {
  it('detects TypeError with "Failed to fetch" message', () => {
    expect(isCorsError(new TypeError('Failed to fetch'))).toBe(true)
  })

  it('detects TypeError with NetworkError message', () => {
    expect(isCorsError(new TypeError('NetworkError when attempting to fetch resource'))).toBe(true)
  })

  it('returns false for DOMException abort', () => {
    expect(isCorsError(new DOMException('The user aborted a request', 'AbortError'))).toBe(false)
  })

  it('returns false for regular errors', () => {
    expect(isCorsError(new Error('Something went wrong'))).toBe(false)
  })

  it('returns false for non-error values', () => {
    expect(isCorsError(null)).toBe(false)
    expect(isCorsError('string error')).toBe(false)
    expect(isCorsError(undefined)).toBe(false)
  })
})

describe('isRateLimitError', () => {
  it('returns true for status 429', () => {
    expect(isRateLimitError(new Error('Too Many Requests'), 429)).toBe(true)
  })

  it('returns true when message mentions rate', () => {
    expect(isRateLimitError(new Error('Rate limit exceeded'))).toBe(true)
  })

  it('returns true when message mentions quota', () => {
    expect(isRateLimitError(new Error('API quota exceeded'))).toBe(true)
  })

  it('returns true when message mentions throttle', () => {
    expect(isRateLimitError(new Error('Request throttled'))).toBe(true)
  })

  it('returns false for other errors', () => {
    expect(isRateLimitError(new Error('Not found'), 404)).toBe(false)
  })
})

describe('isAuthError', () => {
  it('returns true for status 401', () => {
    expect(isAuthError(new Error('Unauthorized'), 401)).toBe(true)
  })

  it('returns true for status 403', () => {
    expect(isAuthError(new Error('Forbidden'), 403)).toBe(true)
  })

  it('returns true when message mentions API key', () => {
    expect(isAuthError(new Error('Invalid API key'))).toBe(true)
  })

  it('returns true when message mentions auth', () => {
    expect(isAuthError(new Error('Authentication failed'))).toBe(true)
  })

  it('returns false for other errors', () => {
    expect(isAuthError(new Error('Not found'), 404)).toBe(false)
  })
})

describe('isNetworkError', () => {
  it('returns true for TypeError', () => {
    expect(isNetworkError(new TypeError('Failed to fetch'))).toBe(true)
  })

  it('returns false for other error types', () => {
    expect(isNetworkError(new Error('Something'))).toBe(false)
    expect(isNetworkError('string')).toBe(false)
  })
})

describe('isServerError', () => {
  it('returns true for status 500', () => {
    expect(isServerError(new Error('Server error'), 500)).toBe(true)
  })

  it('returns true for status 502', () => {
    expect(isServerError(new Error('Bad Gateway'), 502)).toBe(true)
  })

  it('returns true for status 503', () => {
    expect(isServerError(new Error('Service Unavailable'), 503)).toBe(true)
  })

  it('returns false for client errors', () => {
    expect(isServerError(new Error('Not found'), 404)).toBe(false)
  })

  it('returns false when no status', () => {
    expect(isServerError(new Error('No status'))).toBe(false)
  })
})

describe('classifyError', () => {
  it('classifies CORS errors', () => {
    expect(classifyError(new TypeError('Failed to fetch'))).toBe('cors')
  })

  it('classifies rate limit errors', () => {
    expect(classifyError(new Error('Rate limit'), 429)).toBe('rate-limit')
  })

  it('classifies auth errors', () => {
    expect(classifyError(new Error('Invalid API key'), 403)).toBe('auth')
  })

  it('classifies network errors', () => {
    expect(classifyError(new TypeError('load failed'))).toBe('network')
  })

  it('classifies server errors', () => {
    expect(classifyError(new Error('Server error'), 500)).toBe('server')
  })

  it('defaults to unknown', () => {
    expect(classifyError(new Error('Something else'), 418)).toBe('unknown')
  })
})

describe('buildErrorMessage', () => {
  it('returns CORS error info with suggestions', () => {
    const result = buildErrorMessage(new TypeError('Failed to fetch'), mockSource)
    expect(result.type).toBe('cors')
    expect(result.title).toBe('CORS Restriction')
    expect(result.message).toContain(mockSource.label)
    expect(result.suggestions.length).toBeGreaterThan(0)
  })

  it('returns rate limit error info', () => {
    const result = buildErrorMessage(new Error('Rate limit exceeded'), mockSource)
    expect(result.type).toBe('rate-limit')
    expect(result.title).toBe('Rate Limit Exceeded')
    expect(result.suggestions.length).toBeGreaterThan(0)
  })

  it('returns auth error info', () => {
    const result = buildErrorMessage(new Error('Invalid API key'), mockSource)
    expect(result.type).toBe('auth')
    expect(result.title).toBe('API Key Issue')
    expect(result.suggestions.length).toBeGreaterThan(0)
  })

  it('returns server error info', () => {
    const err = { status: 500, message: 'Internal Server Error' }
    const result = buildErrorMessage(err, mockSource)
    expect(result.type).toBe('server')
    expect(result.title).toBe('Server Error')
    expect(result.message).toContain('500')
  })

  it('handles unknown errors gracefully', () => {
    const result = buildErrorMessage(new Error('Something odd'), mockSource)
    expect(result.type).toBe('unknown')
    expect(result.title).toBe('Search Error')
    expect(result.message).toBe('Something odd')
  })

  it('handles null error', () => {
    const result = buildErrorMessage(null as unknown as Error, mockSource)
    expect(result.type).toBe('unknown')
    expect(result.message).toBe('An unexpected error occurred.')
  })
})

describe('buildSuggestions', () => {
  it('provides CORS-related suggestions', () => {
    const suggestions = buildSuggestions('cors', mockSource)
    expect(suggestions.some(s => s.type === 'switch-source')).toBe(true)
    expect(suggestions.some(s => s.type === 'manual-import')).toBe(true)
  })

  it('provides retry suggestions for rate-limit', () => {
    const suggestions = buildSuggestions('rate-limit', mockSource)
    expect(suggestions.some(s => s.type === 'retry-later')).toBe(true)
    expect(suggestions.some(s => s.type === 'try-different-query')).toBe(true)
  })

  it('provides key config suggestions for auth', () => {
    const suggestions = buildSuggestions('auth', mockSource)
    expect(suggestions.some(s => s.type === 'switch-source')).toBe(true)
  })

  it('provides network suggestions', () => {
    const suggestions = buildSuggestions('network', mockSource)
    expect(suggestions.some(s => s.type === 'check-connection')).toBe(true)
  })

  it('provides retry suggestions for server error', () => {
    const suggestions = buildSuggestions('server', mockSource)
    expect(suggestions.some(s => s.type === 'retry-later')).toBe(true)
  })
})

describe('checkSourceUsability', () => {
  it('marks no-cors sources as unusable', () => {
    const youtube = PUBLIC_API_SOURCES.find(s => s.name === 'youtube')!
    const result = checkSourceUsability(youtube)
    expect(result.usable).toBe(false)
    expect(result.warnings.length).toBeGreaterThan(0)
    expect(result.errorInfo).not.toBeNull()
    expect(result.errorInfo!.type).toBe('cors')
  })

  it('marks direct sources as usable', () => {
    const wiktionary = PUBLIC_API_SOURCES.find(s => s.name === 'wiktionary')!
    const result = checkSourceUsability(wiktionary)
    expect(result.usable).toBe(true)
    expect(result.warnings.length).toBe(0)
    expect(result.errorInfo).toBeNull()
  })

  it('warns about sources requiring API keys', () => {
    const youtube = PUBLIC_API_SOURCES.find(s => s.name === 'youtube')!
    const result = checkSourceUsability(youtube)
    expect(result.warnings.some(w => w.includes('API key'))).toBe(true)
  })
})
