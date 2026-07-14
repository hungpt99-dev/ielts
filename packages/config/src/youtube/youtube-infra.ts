export interface YouTubeInfrastructureConfig {
  readonly apiBaseUrl: string
  readonly corsProxyBaseUrl?: string
  readonly timeoutMs: number
}

export const YOUTUBE_INFRA_CONFIG: YouTubeInfrastructureConfig = Object.freeze({
  apiBaseUrl: 'https://www.googleapis.com/youtube/v3',
  timeoutMs: 20_000,
})
