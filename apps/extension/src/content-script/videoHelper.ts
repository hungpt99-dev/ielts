import { safeSendMessage } from '../utils/safe-chrome'

const PANEL_ID = 'ielts-video-helper'

interface VideoPageInfo {
  isVideoPage: boolean
  platform: string
  videoTitle: string
  videoUrl: string
  videoId: string
}

const VIDEO_BADGE_SVG = `
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
`

function extractYoutubeVideoId(url: string): string {
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
  } catch (error) {
    console.error('apps/extension/src/content-script/videoHelper.ts error:', error);
    return ''
  }
}

function extractYoutubeTitle(): string {
  const selectors = [
    'h1.ytd-watch-metadata yt-formatted-string',
    'h1.ytd-video-primary-info-renderer',
    '#title h1 yt-formatted-string',
    '.video-title',
    '#container h1 yt-formatted-string',
  ]
  for (const sel of selectors) {
    const el = document.querySelector(sel)
    const text = el?.textContent?.trim()
    if (text) return text
  }
  return document.title.replace(' - YouTube', '').replace(' - YouTube Shorts', '').trim()
}

function detectVideoPage(): VideoPageInfo {
  const url = window.location.href
  const hostname = window.location.hostname

  if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
    const videoId = extractYoutubeVideoId(url)
    const isVideoPage = !!videoId
    return {
      isVideoPage,
      platform: 'youtube',
      videoTitle: isVideoPage ? extractYoutubeTitle() : '',
      videoUrl: url,
      videoId,
    }
  }

  if (hostname.includes('vimeo.com')) {
    const urlObj = new URL(url)
    const videoId = urlObj.pathname.split('/')[1] || ''
    const titleEl = document.querySelector('[data-title], .clip_header-title, h1')
    return {
      isVideoPage: !!videoId && /^\d+$/.test(videoId),
      platform: 'vimeo',
      videoTitle: titleEl?.textContent?.trim() || document.title.replace(' | Vimeo', '').trim(),
      videoUrl: url,
      videoId,
    }
  }

  return {
    isVideoPage: false,
    platform: '',
    videoTitle: '',
    videoUrl: '',
    videoId: '',
  }
}

function injectStyles(): void {
  if (document.getElementById(`${PANEL_ID}-styles`)) return
  const style = document.createElement('style')
  style.id = `${PANEL_ID}-styles`
  style.textContent = `
    #${PANEL_ID}-badge {
      position: fixed;
      top: 80px;
      right: 16px;
      z-index: 2147483646;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: #0f172a;
      border-radius: 10px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.3);
      border: 1px solid rgba(255,255,255,0.08);
      font-family: system-ui, -apple-system, sans-serif;
      cursor: pointer;
      transition: transform 0.15s, opacity 0.15s;
      opacity: 0;
      transform: translateX(20px);
    }
    #${PANEL_ID}-badge:hover {
      transform: translateX(0) scale(1.03);
    }
    #${PANEL_ID}-badge.show {
      opacity: 1;
      transform: translateX(0);
    }
    #${PANEL_ID}-badge .badge-icon {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      background: linear-gradient(135deg, #3b82f6, #7c3aed);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    #${PANEL_ID}-badge .badge-text {
      font-size: 12px;
      color: #f1f5f9;
      font-weight: 500;
      white-space: nowrap;
    }
    #${PANEL_ID}-badge .badge-sub {
      font-size: 10px;
      color: #94a3b8;
    }
  `
  document.head.appendChild(style)
}

/**
 * Extract the JSON object starting at `startIdx` in `text` by counting braces.
 * Handles nested objects, strings containing braces, and multiline content.
 */
function extractJsonBounded(text: string, startIdx: number): { json: string; endIdx: number } | null {
  if (text[startIdx] !== '{') return null
  let depth = 0
  let inString = false
  let escape = false
  for (let i = startIdx; i < text.length; i++) {
    const ch = text[i]
    if (escape) { escape = false; continue }
    if (ch === '\\') { escape = true; continue }
    if (ch === '"') { inString = !inString; continue }
    if (inString) continue
    if (ch === '{') depth++
    if (ch === '}') depth--
    if (depth === 0) {
      return { json: text.slice(startIdx, i + 1), endIdx: i + 1 }
    }
  }
  return null
}

async function extractYoutubeTranscriptFromPage(): Promise<string> {
  try {
    const scripts = document.querySelectorAll('script')
    let captionTracks: Array<{ languageCode: string; baseUrl: string }> | null = null

    for (const s of scripts) {
      const text = s.textContent || ''
      if (!text.includes('ytInitialPlayerResponse') && !text.includes('playerCaptionsTracklistRenderer')) continue

      const matchIdx = text.indexOf('ytInitialPlayerResponse')
      if (matchIdx === -1) continue

      const eqIdx = text.indexOf('=', matchIdx)
      if (eqIdx === -1) continue

      const bounded = extractJsonBounded(text, eqIdx + 1)
      if (!bounded) continue

      try {
        const parsed = JSON.parse(bounded.json)
        const tracks = (parsed as any)?.captions?.playerCaptionsTracklistRenderer?.captionTracks
        if (tracks?.length) {
          captionTracks = tracks
          break
        }
      } catch (error) {
        console.error('apps/extension/src/content-script/videoHelper.ts error:', error);
        continue
      }
    }

    if (!captionTracks) {
      const dataEl = document.getElementById('player-container')
      if (dataEl) {
        const dataScript = dataEl.querySelector('script')
        if (dataScript?.textContent) {
          const initMatch = dataScript.textContent.match(/window\.__INITIAL_STATE__\s*=\s*(.*?});\s*<\/script>/)
          if (initMatch) {
            try {
              const state = JSON.parse(initMatch[1])
              const tracks = (state as any)?.playerOverlays?.playerOverlayRenderer?.captionsTracklist ??
                             (state as any)?.captions?.playerCaptionsTracklistRenderer?.captionTracks
              if (tracks?.length) {
                captionTracks = tracks
              }
            } catch (error) {
 console.error('apps/extension/src/content-script/videoHelper.ts error:', error);
 /* continue */ }
          }
        }
      }
    }

    if (!captionTracks?.length) return ''

    const track = captionTracks.find((t) => t.languageCode === 'en')
      || captionTracks.find((t) => t.languageCode?.startsWith('en'))
      || captionTracks[0]
    if (!track?.baseUrl) return ''

    const response = await fetch(track.baseUrl)
    const xml = await response.text()
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xml, 'text/xml')
    const texts = xmlDoc.querySelectorAll('text')
    const segments = Array.from(texts)
      .map(t => t.textContent?.trim())
      .filter((t): t is string => !!t)

    return segments.join(' ')
  } catch (error) {
    console.error('apps/extension/src/content-script/videoHelper.ts error:', error);
    return ''
  }
}

class VideoHelperUI {
  private badge: HTMLDivElement | null = null
  private lastVideoId = ''
  private hidden = false

  setHidden(hidden: boolean): void {
    this.hidden = hidden
    if (hidden) {
      this.removeBadge()
    } else {
      this.lastVideoId = ''
      this.init()
    }
  }

  init(): void {
    if (this.hidden) return

    const info = detectVideoPage()
    if (!info.isVideoPage) {
      this.removeBadge()
      this.lastVideoId = ''
      return
    }

    if (info.videoId === this.lastVideoId) return
    this.lastVideoId = info.videoId

    injectStyles()
    this.createBadge(info)

    safeSendMessage({
      type: 'VIDEO_PAGE_DETECTED',
      payload: {
        isVideoPage: true,
        platform: info.platform,
        videoTitle: info.videoTitle,
        videoUrl: info.videoUrl,
        videoId: info.videoId,
      },
    })
  }

  private createBadge(info: VideoPageInfo): void {
    this.removeBadge()

    this.badge = document.createElement('div')
    this.badge.id = `${PANEL_ID}-badge`
    this.badge.setAttribute('role', 'button')
    this.badge.setAttribute('tabindex', '0')
    this.badge.setAttribute('aria-label', 'IELTS Video Helper')

    this.badge.innerHTML = `
      <div class="badge-icon">${VIDEO_BADGE_SVG}</div>
      <div>
        <div class="badge-text">IELTS Video Helper</div>
        <div class="badge-sub">Save for learning</div>
      </div>
    `

    this.badge.addEventListener('click', () => {
      this.badge?.classList.remove('show')
      safeSendMessage({
        type: 'VIDEO_HELPER_OPEN',
        payload: {
          videoTitle: info.videoTitle,
          videoUrl: info.videoUrl,
          videoId: info.videoId,
          platform: info.platform,
        },
      })
    })

    document.body.appendChild(this.badge)

    requestAnimationFrame(() => {
      this.badge?.classList.add('show')
    })

    this.badge.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        this.badge?.click()
      }
    })
  }

  private removeBadge(): void {
    const existing = document.getElementById(`${PANEL_ID}-badge`)
    if (existing) existing.remove()
  }

  async getTranscript(): Promise<string> {
    const info = detectVideoPage()
    if (info.platform === 'youtube' && info.videoId) {
      return extractYoutubeTranscriptFromPage()
    }
    return ''
  }

  destroy(): void {
    this.removeBadge()
  }
}

const instance = new VideoHelperUI()

function initVideoHelper(): void {
  instance.init()
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initVideoHelper)
} else {
  initVideoHelper()
}

let lastUrl = location.href

function onUrlChange(): void {
  if (location.href !== lastUrl) {
    lastUrl = location.href
    setTimeout(() => instance.init(), 800)
  }
}

const observer = new MutationObserver(() => onUrlChange())
observer.observe(document, { subtree: true, childList: true })

document.addEventListener('yt-navigate-finish', () => {
  setTimeout(() => instance.init(), 500)
})

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GET_VIDEO_PAGE_INFO') {
    const info = detectVideoPage()
    try { sendResponse(info) } catch (error) {
 console.error('apps/extension/src/content-script/videoHelper.ts error:', error);
 /* ignore */ }
    return true
  }

  if (message.type === 'FETCH_YOUTUBE_TRANSCRIPT') {
    instance.getTranscript().then((transcript) => {
      try { sendResponse({ transcript }) } catch (error) {
 console.error('apps/extension/src/content-script/videoHelper.ts error:', error);
 /* ignore */ }
    })
    return true
  }
})

export function setVideoHelperHidden(hidden: boolean): void {
  instance.setHidden(hidden)
}

export { detectVideoPage }
