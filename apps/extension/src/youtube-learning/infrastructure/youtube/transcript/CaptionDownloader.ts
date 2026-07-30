import type { ICaptionDownloader } from './interfaces'

export class CaptionDownloadError extends Error {
  public readonly status: number
  public readonly statusText: string
  public readonly contentType: string
  public readonly bodyLength: number
  public readonly bodyPreview: string
  public readonly requestUrl: string

  constructor(diag: {
    ok: boolean; status: number; statusText: string; redirected: boolean;
    finalUrl: string; contentType: string; bodyLength: number;
    bodyPreview: string; error?: string;
  }) {
    const reason = diag.error
      ? `Network error: ${diag.error}`
      : diag.contentType?.startsWith('text/html')
        ? `YouTube returned HTML instead of captions. Content-Type: ${diag.contentType}, body: ${diag.bodyLength} bytes.`
        : diag.status === 200
          ? `HTTP 200 but body empty or invalid (${diag.bodyLength} bytes, type: ${diag.contentType || 'unknown'})`
          : `HTTP ${diag.status} ${diag.statusText}`
    super(`Failed to download captions: ${reason}`)
    this.name = 'CaptionDownloadError'
    this.status = diag.status
    this.statusText = diag.statusText
    this.contentType = diag.contentType
    this.bodyLength = diag.bodyLength
    this.bodyPreview = diag.bodyPreview
    this.requestUrl = diag.finalUrl
  }
}

export class CaptionDownloader implements ICaptionDownloader {
  private readonly timeoutMs: number

  constructor(timeoutMs = 10_000) {
    this.timeoutMs = timeoutMs
  }

  async download(url: string, signal?: AbortSignal): Promise<string> {
    const controller = new AbortController()
    const tid = setTimeout(() => controller.abort(), this.timeoutMs)
    const onAbort = (): void => controller.abort()
    signal?.addEventListener('abort', onAbort, { once: true })

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        credentials: 'include',
      })
      const body = await response.text()

      if (!response.ok || !body.trim() || response.headers.get('content-type')?.startsWith('text/html')) {
        throw new CaptionDownloadError({
          ok: response.ok, status: response.status, statusText: response.statusText,
          redirected: response.redirected, finalUrl: response.url,
          contentType: response.headers.get('content-type') || '',
          bodyLength: body.length, bodyPreview: body.slice(0, 500),
        })
      }

      return body
    } catch (err) {
      if (err instanceof CaptionDownloadError) throw err
      throw new CaptionDownloadError({
        ok: false, status: 0, statusText: 'NetworkError', redirected: false,
        finalUrl: url, contentType: '', bodyLength: 0, bodyPreview: '',
        error: err instanceof Error ? err.message : String(err),
      })
    } finally {
      clearTimeout(tid)
      signal?.removeEventListener('abort', onAbort)
    }
  }
}
