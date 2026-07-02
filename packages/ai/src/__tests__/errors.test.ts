import { describe, it, expect } from 'vitest'
import {
  AIError, AIAuthError, AIRateLimitError,
  AINetworkError, AIEmptyResponseError, AIConfigError,
} from '../errors/types'

describe('AIError', () => {
  it('creates AIError with default code', () => {
    const err = new AIError('Something went wrong')
    expect(err.message).toBe('Something went wrong')
    expect(err.code).toBe('UNKNOWN')
    expect(err.name).toBe('AIError')
  })

  it('creates AIError with custom code', () => {
    const err = new AIError('Custom error', 'CUSTOM_CODE')
    expect(err.code).toBe('CUSTOM_CODE')
  })

  it('creates AIAuthError with default message', () => {
    const err = new AIAuthError()
    expect(err.message).toContain('API key')
    expect(err.code).toBe('AUTH_ERROR')
    expect(err.name).toBe('AIAuthError')
  })

  it('creates AIAuthError with custom message', () => {
    const err = new AIAuthError('Custom auth error')
    expect(err.message).toBe('Custom auth error')
  })

  it('creates AIRateLimitError with default message', () => {
    const err = new AIRateLimitError()
    expect(err.message).toContain('Rate limit')
    expect(err.code).toBe('RATE_LIMIT')
    expect(err.name).toBe('AIRateLimitError')
  })

  it('creates AINetworkError with default message', () => {
    const err = new AINetworkError()
    expect(err.message).toContain('Network error')
    expect(err.code).toBe('NETWORK_ERROR')
    expect(err.name).toBe('AINetworkError')
  })

  it('creates AIEmptyResponseError with default message', () => {
    const err = new AIEmptyResponseError()
    expect(err.message).toContain('empty response')
    expect(err.code).toBe('EMPTY_RESPONSE')
    expect(err.name).toBe('AIEmptyResponseError')
  })

  it('creates AIConfigError with default message', () => {
    const err = new AIConfigError()
    expect(err.message).toContain('API key not configured')
    expect(err.code).toBe('CONFIG_ERROR')
    expect(err.name).toBe('AIConfigError')
  })

  it('is an instance of Error', () => {
    expect(new AIError('test')).toBeInstanceOf(Error)
    expect(new AIAuthError()).toBeInstanceOf(AIError)
    expect(new AIRateLimitError()).toBeInstanceOf(AIError)
    expect(new AINetworkError()).toBeInstanceOf(Error)
  })
})
