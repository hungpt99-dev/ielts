import { describe, it, expect } from 'vitest'
import { CaptionDownloadError } from '../CaptionDownloader'

describe('CaptionDownloadError', () => {
  it('formats HTTP 403 error with status', () => {
    const err = new CaptionDownloadError({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      redirected: false,
      finalUrl: 'https://example.com',
      contentType: '',
      bodyLength: 0,
      bodyPreview: '',
    })
    expect(err.message).toContain('HTTP 403 Forbidden')
    expect(err.status).toBe(403)
    expect(err.statusText).toBe('Forbidden')
  })

  it('formats HTTP 404 error', () => {
    const err = new CaptionDownloadError({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      redirected: false,
      finalUrl: 'https://example.com',
      contentType: '',
      bodyLength: 0,
      bodyPreview: '',
    })
    expect(err.message).toContain('HTTP 404 Not Found')
  })

  it('formats HTTP 200 with empty body', () => {
    const err = new CaptionDownloadError({
      ok: true,
      status: 200,
      statusText: 'OK',
      redirected: false,
      finalUrl: 'https://example.com',
      contentType: 'text/xml',
      bodyLength: 0,
      bodyPreview: '',
    })
    expect(err.message).toContain('HTTP 200 but body empty')
    expect(err.message).toContain('text/xml')
  })

  it('formats HTTP 200 with non-caption content type', () => {
    const err = new CaptionDownloadError({
      ok: true,
      status: 200,
      statusText: 'OK',
      redirected: false,
      finalUrl: 'https://example.com',
      contentType: 'text/html',
      bodyLength: 15,
      bodyPreview: '<html></html>',
    })
    expect(err.message).toContain('YouTube returned HTML instead of captions')
    expect(err.contentType).toBe('text/html')
    expect(err.bodyLength).toBe(15)
  })

  it('formats redirect response', () => {
    const err = new CaptionDownloadError({
      ok: false,
      status: 302,
      statusText: 'Found',
      redirected: true,
      finalUrl: 'https://accounts.google.com/login',
      contentType: '',
      bodyLength: 0,
      bodyPreview: '',
    })
    expect(err.message).toContain('HTTP 302 Found')
    expect(err.requestUrl).toBe('https://accounts.google.com/login')
  })

  it('formats network error', () => {
    const err = new CaptionDownloadError({
      ok: false,
      status: 0,
      statusText: 'NetworkError',
      redirected: false,
      finalUrl: 'https://example.com',
      contentType: '',
      bodyLength: 0,
      bodyPreview: '',
      error: 'Failed to fetch',
    })
    expect(err.message).toContain('Network error: Failed to fetch')
  })
})
