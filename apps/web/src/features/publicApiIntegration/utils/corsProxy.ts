import type { CorsProxyConfig, PublicApiSourceConfig } from '../types'
import { DEFAULT_CORS_PROXY, CORS_PROXY_STORAGE_KEY } from '../types'

export function getCorsProxyConfig(): CorsProxyConfig {
  try {
    const raw = localStorage.getItem(CORS_PROXY_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as CorsProxyConfig
      if (parsed && typeof parsed.enabled === 'boolean' && typeof parsed.proxyUrl === 'string') {
        return parsed
      }
    }
  } catch (error) {
    console.error('apps/web/src/features/publicApiIntegration/utils/corsProxy.ts error:', error);
    // localStorage unavailable or invalid config
  }
  return { enabled: false, proxyUrl: DEFAULT_CORS_PROXY }
}

export function saveCorsProxyConfig(config: CorsProxyConfig): void {
  try {
    localStorage.setItem(CORS_PROXY_STORAGE_KEY, JSON.stringify(config))
  } catch (error) {
    console.error('apps/web/src/features/publicApiIntegration/utils/corsProxy.ts error:', error);
    // localStorage unavailable
  }
}

export function needsCorsProxy(source: PublicApiSourceConfig): boolean {
  return source.corsStatus === 'cors-bypass'
}

export function applyCorsProxy(url: string, source: PublicApiSourceConfig): string {
  if (!needsCorsProxy(source)) return url

  const config = getCorsProxyConfig()
  if (!config.enabled) return url

  const proxyBase = config.proxyUrl.replace(/\/+$/, '')
  const separator = proxyBase.includes('?') ? '' : '?'
  return `${proxyBase}${separator}${encodeURIComponent(url)}`
}

export async function fetchWithCorsProxy(
  url: string,
  source: PublicApiSourceConfig,
  options?: RequestInit,
): Promise<Response> {
  const proxiedUrl = applyCorsProxy(url, source)
  return fetch(proxiedUrl, options)
}
