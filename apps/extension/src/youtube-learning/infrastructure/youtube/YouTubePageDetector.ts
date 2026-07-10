import type { VideoPageInfo } from '../../domain/types'

export type { VideoPageInfo }

export function extractYoutubeVideoId(url: string): string {
  try {
    const urlObj = new URL(url)
    if (urlObj.hostname.includes('youtu.be')) {
      return urlObj.pathname.slice(1).split('/')[0].split('?')[0]
    }
    if (urlObj.pathname.startsWith('/shorts/')) {
      return urlObj.pathname.split('/shorts/')[1]?.split('?')[0] || ''
    }
    const id = urlObj.searchParams.get('v') || ''
    if (id) return id
    const match = urlObj.pathname.match(/^\/embed\/([^/?]+)/)
    return match?.[1] || ''
  } catch {
    return ''
  }
}

export function extractYoutubeChannelId(): string {
  const link = document.querySelector<HTMLAnchorElement>('#owner #channel-name a')
  if (link?.href) {
    const match = link.href.match(/channel\/(UC[\w-]+)/)
    if (match) return match[1]
    const userMatch = link.href.match(/\/(@[\w.-]+)/)
    if (userMatch) return userMatch[1]
  }
  return ''
}

export function extractYoutubeTitle(): string {
  const titleSelectors = [
    'h1.ytd-watch-metadata yt-formatted-string',
    'h1 yt-formatted-string.ytd-watch-metadata',
    '#title h1 yt-formatted-string',
    '.ytd-watch-metadata h1',
  ]
  for (const sel of titleSelectors) {
    const el = document.querySelector(sel)
    const text = el?.textContent?.trim()
    if (text) return text
  }
  return document.title.replace(' - YouTube', '').replace(' - YouTube Shorts', '').trim()
}

export function extractYoutubeChannelName(): string {
  const selectors = [
    '#owner #channel-name yt-formatted-string',
    '#owner ytd-channel-name yt-formatted-string',
    'ytd-video-owner-renderer ytd-channel-name yt-formatted-string',
    '#upload-info #channel-name yt-formatted-string',
  ]
  for (const sel of selectors) {
    const el = document.querySelector(sel)
    const text = el?.textContent?.trim()
    if (text) return text
  }
  return ''
}

export function detectVideoPage(): VideoPageInfo {
  const url = window.location.href
  const hostname = window.location.hostname

  if (!hostname.includes('youtube.com') && !hostname.includes('youtu.be')) {
    return { isVideoPage: false, platform: '', videoId: '', videoTitle: '', videoUrl: '', channelName: '', channelId: '' }
  }

  const videoId = extractYoutubeVideoId(url)
  if (!videoId) {
    return { isVideoPage: false, platform: '', videoId: '', videoTitle: '', videoUrl: '', channelName: '', channelId: '' }
  }

  return {
    isVideoPage: true,
    platform: 'youtube',
    videoId,
    videoTitle: extractYoutubeTitle(),
    videoUrl: url,
    channelName: extractYoutubeChannelName(),
    channelId: extractYoutubeChannelId(),
  }
}

export function isYouTubeWatchPage(): boolean {
  const url = window.location.href
  const hostname = window.location.hostname
  if (!hostname.includes('youtube.com') && !hostname.includes('youtu.be')) return false
  const videoId = extractYoutubeVideoId(url)
  return !!videoId
}

export function isYouTubeShorts(): boolean {
  return window.location.pathname.startsWith('/shorts/')
}
