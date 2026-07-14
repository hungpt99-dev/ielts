const STORAGE_KEY = 'ielts-youtube-focus-mode'

interface FocusModeTarget {
  selector: string
  style: string
  label: string
}

const FOCUS_TARGETS: FocusModeTarget[] = [
  { selector: '#related', style: 'display: none !important', label: 'Related videos' },
  { selector: '#comments', style: 'display: none !important', label: 'Comments' },
  { selector: '#comment-section', style: 'display: none !important', label: 'Comments section' },
  { selector: '#chat-container', style: 'display: none !important', label: 'Live chat' },
  { selector: 'ytd-live-chat-frame', style: 'display: none !important', label: 'Live chat frame' },
  { selector: '#notification-count', style: 'display: none !important', label: 'Notifications' },
  { selector: 'ytd-reel-shelf-renderer', style: 'display: none !important', label: 'Shorts shelf' },
  { selector: 'ytd-shorts', style: 'display: none !important', label: 'Shorts' },
  { selector: '#guide-container', style: 'display: none !important', label: 'Side guide' },
  { selector: '#guide-wrapper', style: 'display: none !important', label: 'Guide wrapper' },
  { selector: '#guide-inner-content', style: 'display: none !important', label: 'Guide inner' },
  { selector: '#masthead-container', style: 'display: none !important', label: 'Top bar' },
  { selector: '#header', style: 'display: none !important', label: 'Header' },
  { selector: '#footer', style: 'display: none !important', label: 'Footer' },
  { selector: '#page-header', style: 'display: none !important', label: 'Page header' },
  { selector: '#above-the-fold', style: 'display: none !important', label: 'Above fold' },
  { selector: '#donation-shelf', style: 'display: none !important', label: 'Donation shelf' },
  { selector: '#merch-shelf', style: 'display: none !important', label: 'Merch shelf' },
  { selector: '#subscribe-button', style: 'display: none !important', label: 'Subscribe button' },
  { selector: '#owner', style: 'display: none !important', label: 'Channel owner' },
  { selector: '#meta', style: 'display: none !important', label: 'Video meta' },
  { selector: '#info-container', style: 'display: none !important', label: 'Info container' },
  { selector: '#info', style: 'display: none !important', label: 'Info bar' },
  { selector: '#title', style: 'display: none !important', label: 'Video title' },
  { selector: '#description', style: 'display: none !important', label: 'Description' },
  { selector: '#description-container', style: 'display: none !important', label: 'Description container' },
  { selector: '#bottom-row', style: 'display: none !important', label: 'Bottom row' },
  { selector: '#top-row', style: 'display: none !important', label: 'Top row' },
  { selector: '#movie_player ~ #placeholder-area', style: 'display: none !important', label: 'Placeholder' },
  { selector: '#alerts', style: 'display: none !important', label: 'Alerts' },
  { selector: 'ytd-banner-promo-renderer', style: 'display: none !important', label: 'Banner promo' },
  { selector: 'yt-mealbar-promo-renderer', style: 'display: none !important', label: 'Mealbar promo' },
]

const STYLE_ELEMENT_ID = 'ielts-focus-mode-style'

export class FocusMode {
  private active = false
  private styleElement: HTMLStyleElement | null = null

  async isEnabled(): Promise<boolean> {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEY)
      return !!result[STORAGE_KEY]
    } catch (error) {
      console.error('apps/extension/src/youtube-learning/infrastructure/youtube/FocusMode.ts error:', error);
      return false
    }
  }

  async enable(): Promise<void> {
    this.active = true
    this.applyStyles()
    await this.savePreference(true)
  }

  async disable(): Promise<void> {
    this.active = false
    this.removeStyles()
    await this.savePreference(false)
  }

  async toggle(): Promise<boolean> {
    if (this.active) {
      await this.disable()
      return false
    }
    await this.enable()
    return true
  }

  isActive(): boolean {
    return this.active
  }

  private applyStyles(): void {
    if (this.styleElement) return

    const rules = FOCUS_TARGETS.map(t => `${t.selector} { ${t.style} }`).join('\n')
    const cleanupRule = `
      html, body { overflow: auto !important; background-color: #000 !important; }
      #columns { display: flex !important; flex-direction: row !important; }
      #primary { width: 100% !important; max-width: 100% !important; flex: 1 !important; }
      #primary #primary-inner { width: 100% !important; max-width: 100% !important; }
      #primary ytd-watch-flexy { flex-direction: column !important; }
      #primary .html5-video-player { width: 100% !important; }
      #secondary { display: none !important; }
      #page-manager { margin-top: 0 !important; background-color: #000 !important; }
      ytd-watch-flexy[flexy_] #columns.ytd-watch-flexy, ytd-watch-flexy[flexy] #columns.ytd-watch-flexy { min-width: 100% !important; }
      #movie_player { max-width: 100vw !important; }
      ytd-watch-flexy #primary.ytd-watch-flexy { margin-right: 0 !important; }
    `

    this.styleElement = document.createElement('style')
    this.styleElement.id = STYLE_ELEMENT_ID
    this.styleElement.textContent = rules + '\n' + cleanupRule
    document.head.appendChild(this.styleElement)
  }

  private removeStyles(): void {
    const existing = document.getElementById(STYLE_ELEMENT_ID)
    if (existing) existing.remove()
    this.styleElement = null
  }

  private async savePreference(enabled: boolean): Promise<void> {
    try {
      await chrome.storage.local.set({ [STORAGE_KEY]: enabled })
    } catch (error) {
      console.error('apps/extension/src/youtube-learning/infrastructure/youtube/FocusMode.ts error:', error);
      // Storage unavailable
    }
  }

  destroy(): void {
    this.removeStyles()
  }
}


