const NAVIGATION_SETTLE_MS = 800
const YT_NAVIGATE_DELAY_MS = 500

export interface YouTubeDOMObserverCallbacks {
  onUrlChange?: (url: string) => void
  onVideoChange?: (videoId: string) => void
  onPlayerReady?: () => void
  onPlayerDestroyed?: () => void
  onLayoutChange?: () => void
  onTheatreMode?: (active: boolean) => void
  onFullscreen?: (active: boolean) => void
  onPageLayoutChange?: () => void
}

export class YouTubeDOMObserver {
  private urlObserver: MutationObserver | null = null
  private layoutObserver: MutationObserver | null = null
  private playerObserver: MutationObserver | null = null
  private titleObserver: MutationObserver | null = null
  private bodyObserver: MutationObserver | null = null
  private lastUrl: string = ''
  private lastVideoId: string = ''
  private callbacks: YouTubeDOMObserverCallbacks
  private isRunning = false

  constructor(callbacks: YouTubeDOMObserverCallbacks = {}) {
    this.callbacks = callbacks
    this.lastUrl = window.location.href
  }

  start(): void {
    if (this.isRunning) return
    this.isRunning = true
    this.lastUrl = window.location.href
    this.setupUrlObserver()
    this.setupLayoutObserver()
    this.setupPlayerObserver()
    this.setupTitleObserver()
    this.setupYTTracking()
  }

  stop(): void {
    this.isRunning = false
    this.urlObserver?.disconnect()
    this.layoutObserver?.disconnect()
    this.playerObserver?.disconnect()
    this.titleObserver?.disconnect()
    this.bodyObserver?.disconnect()
    this.removeYTTracking()
  }

  private setupUrlObserver(): void {
    this.urlObserver = new MutationObserver(() => {
      if (window.location.href !== this.lastUrl) {
        this.lastUrl = window.location.href
        this.callbacks.onUrlChange?.(this.lastUrl)
        const videoId = this.extractVideoId()
        if (videoId && videoId !== this.lastVideoId) {
          this.lastVideoId = videoId
          setTimeout(() => this.callbacks.onVideoChange?.(videoId), NAVIGATION_SETTLE_MS)
        }
      }
    })
    const container = document.querySelector('#content, #page-manager, #columns')
    this.urlObserver.observe(container || document.body, { childList: true, subtree: true })
  }

  private setupLayoutObserver(): void {
    const target = document.querySelector('#columns') || document.querySelector('#page-manager') || document.body
    this.layoutObserver = new MutationObserver(() => {
      this.callbacks.onPageLayoutChange?.()
      this.checkTheatreMode()
    })
    this.layoutObserver.observe(target, { subtree: true, childList: true, attributes: false })
  }

  private setupPlayerObserver(): void {
    const playerContainer = document.querySelector('#movie_player, #player-container, #player')
    if (!playerContainer) {
      this.bodyObserver = new MutationObserver(() => {
        const player = document.querySelector('#movie_player, #player-container, #player')
        if (player) {
          this.bodyObserver?.disconnect()
          this.setupPlayerObserver()
        }
      })
      this.bodyObserver.observe(document.body, { childList: true, subtree: true })
      return
    }
    this.playerObserver = new MutationObserver(() => {
      const playerExists = !!document.querySelector('#movie_player video, #player-container video')
      if (playerExists) {
        this.callbacks.onPlayerReady?.()
      } else {
        this.callbacks.onPlayerDestroyed?.()
      }
      this.checkTheatreMode()
      this.checkFullscreen()
    })
    this.playerObserver.observe(playerContainer, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] })
  }

  private setupTitleObserver(): void {
    const titleContainer = document.querySelector('#title, h1.ytd-watch-metadata, #container h1')
    if (!titleContainer) return
    this.titleObserver = new MutationObserver(() => {
      this.callbacks.onLayoutChange?.()
    })
    this.titleObserver.observe(titleContainer, { childList: true, characterData: true, subtree: true })
  }

  private checkTheatreMode(): void {
    const player = document.querySelector('#movie_player')
    if (!player) return
    const isTheatre = player.classList.contains('ytp-theater-mode') ||
      document.querySelector('.ytp-theater-mode') !== null
    this.callbacks.onTheatreMode?.(isTheatre)
  }

  private checkFullscreen(): void {
    this.callbacks.onFullscreen?.(!!document.fullscreenElement)
  }

  private extractVideoId(): string {
    const url = window.location.href
    try {
      const urlObj = new URL(url)
      if (urlObj.pathname.startsWith('/shorts/')) {
        return urlObj.pathname.split('/shorts/')[1]?.split('?')[0] || ''
      }
      return urlObj.searchParams.get('v') || ''
    } catch {
      return ''
    }
  }

  private setupYTTracking(): void {
    document.addEventListener('yt-navigate-finish', this.handleYTNavigate)
    document.addEventListener('yt-navigate-start', this.handleYTNavigateStart)
  }

  private removeYTTracking(): void {
    document.removeEventListener('yt-navigate-finish', this.handleYTNavigate)
    document.removeEventListener('yt-navigate-start', this.handleYTNavigateStart)
  }

  private handleYTNavigate = (): void => {
    setTimeout(() => {
      const newUrl = window.location.href
      if (newUrl !== this.lastUrl) {
        this.lastUrl = newUrl
        this.callbacks.onUrlChange?.(newUrl)
        const videoId = this.extractVideoId()
        if (videoId && videoId !== this.lastVideoId) {
          this.lastVideoId = videoId
          setTimeout(() => this.callbacks.onVideoChange?.(videoId), NAVIGATION_SETTLE_MS)
        }
      }
    }, YT_NAVIGATE_DELAY_MS)
  }

  private handleYTNavigateStart = (): void => {
    this.lastUrl = window.location.href
  }

  destroy(): void {
    this.stop()
    this.callbacks = {}
  }
}
