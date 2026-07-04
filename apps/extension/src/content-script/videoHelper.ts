const PANEL_ID = 'ielts-video-helper'
const TOAST_ID = 'ielts-vh-toast'

import { safeSendMessage } from '../utils/safe-chrome'

interface VideoPageInfo {
  isVideoPage: boolean
  platform: string
  videoTitle: string
  videoUrl: string
  videoId: string
}

function detectVideoPage(): VideoPageInfo {
  const url = window.location.href
  const hostname = window.location.hostname

  if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
    const urlObj = new URL(url)
    const videoId = urlObj.searchParams.get('v') || ''
    const titleEl = document.querySelector('h1.ytd-watch-metadata, h1 yt-formatted-string.ytd-video-primary-info-renderer')
    const title = titleEl?.textContent?.trim() || document.title.replace(' - YouTube', '').trim()
    return {
      isVideoPage: !!videoId || hostname.includes('youtu.be'),
      platform: 'youtube',
      videoTitle: title,
      videoUrl: url,
      videoId: videoId || urlObj.pathname.slice(1),
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

function showToast(message: string) {
  const existing = document.getElementById(TOAST_ID)
  if (existing) existing.remove()

  const el = document.createElement('div')
  el.id = TOAST_ID
  el.textContent = message
  Object.assign(el.style, {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    background: '#0f172a',
    color: '#f1f5f9',
    padding: '10px 18px',
    borderRadius: '8px',
    fontSize: '13px',
    zIndex: '2147483647',
    boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    opacity: '1',
    transform: 'translateY(0)',
    transition: 'opacity 0.2s, transform 0.2s',
    pointerEvents: 'none',
    maxWidth: '380px',
    lineHeight: '1.4',
  })
  document.body.appendChild(el)
  setTimeout(() => {
    el.style.opacity = '0'
    el.style.transform = 'translateY(8px)'
    setTimeout(() => el.remove(), 250)
  }, 2800)
}

function injectStyles() {
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
      color: white;
      font-size: 14px;
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

class VideoHelperUI {
  private badge: HTMLDivElement | null = null

  init(): void {
    const info = detectVideoPage()
    if (!info.isVideoPage) return

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
      <div class="badge-icon">🎬</div>
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
      showToast('Opening Video Helper in popup...')
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

  destroy(): void {
    this.removeBadge()
  }
}

const instance = new VideoHelperUI()

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => instance.init())
} else {
  instance.init()
}

let lastUrl = location.href
const observer = new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href
    setTimeout(() => instance.init(), 1000)
  }
})
observer.observe(document, { subtree: true, childList: true })

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GET_VIDEO_PAGE_INFO') {
    const info = detectVideoPage()
    sendResponse(info)
    return true
  }
})

export {}
