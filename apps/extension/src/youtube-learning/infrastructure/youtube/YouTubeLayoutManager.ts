export const PANEL_IFRAME_ID = 'ielts-youtube-panel-iframe'
export const PANEL_STYLE_ID = 'ielts-youtube-panel-styles'
export const LEARNING_BADGE_ID = 'ielts-youtube-learning-badge'
export const PANEL_WIDTH = 380

export interface PanelPosition {
  top: number
  right: number
  width: number
  height: number
}

export class YouTubeLayoutManager {
  private iframe: HTMLIFrameElement | null = null
  private styleElement: HTMLStyleElement | null = null
  private badge: HTMLButtonElement | null = null
  private panelVisible = false

  injectPanel(): HTMLIFrameElement {
    if (this.iframe) return this.iframe

    this.injectStyles()

    this.iframe = document.createElement('iframe')
    this.iframe.id = PANEL_IFRAME_ID
    this.iframe.src = chrome.runtime.getURL('youtube-learning.html')
    this.iframe.setAttribute('aria-label', 'IELTS Journey YouTube Learning Panel')
    this.iframe.setAttribute('allow', 'microphone')
    this.applyPanelStyles()

    document.body.appendChild(this.iframe)
    this.panelVisible = true
    return this.iframe
  }

  removePanel(): void {
    if (this.iframe) {
      this.iframe.remove()
      this.iframe = null
    }
    this.panelVisible = false
  }

  showPanel(): void {
    if (this.iframe) {
      this.iframe.style.display = ''
      this.panelVisible = true
    }
  }

  hidePanel(): void {
    if (this.iframe) {
      this.iframe.style.display = 'none'
      this.panelVisible = false
    }
  }

  isPanelVisible(): boolean {
    return this.panelVisible && this.iframe !== null
  }

  updatePanelPosition(): void {
    if (!this.iframe) return
    this.applyPanelStyles()
  }

  injectBadge(onClick: () => void): HTMLButtonElement {
    this.removeBadge()

    this.badge = document.createElement('button')
    this.badge.id = LEARNING_BADGE_ID
    this.badge.setAttribute('aria-label', 'Open IELTS Journey Learning')
    this.badge.title = 'Study with IELTS Journey'

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('width', '18')
    svg.setAttribute('height', '18')
    svg.setAttribute('viewBox', '0 0 24 24')
    svg.setAttribute('fill', 'none')
    svg.setAttribute('stroke', 'currentColor')
    svg.setAttribute('stroke-width', '2')
    svg.setAttribute('stroke-linecap', 'round')
    svg.setAttribute('stroke-linejoin', 'round')

    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
    polygon.setAttribute('points', '23 7 16 12 23 17 23 7')
    svg.appendChild(polygon)

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    rect.setAttribute('x', '1')
    rect.setAttribute('y', '5')
    rect.setAttribute('width', '15')
    rect.setAttribute('height', '14')
    rect.setAttribute('rx', '2')
    rect.setAttribute('ry', '2')
    svg.appendChild(rect)

    this.badge.appendChild(svg)
    this.badge.addEventListener('click', onClick)
    document.body.appendChild(this.badge)
    return this.badge
  }

  removeBadge(): void {
    const existing = document.getElementById(LEARNING_BADGE_ID)
    if (existing) existing.remove()
    this.badge = null
  }

  updatePrimaryColumn(): void {
    const pm = document.querySelector('#page-manager')
    const flexy = document.querySelector('ytd-watch-flexy')
    if (!pm) return
    if (this.panelVisible) {
      (pm as HTMLElement).style.width = `calc(100vw - ${PANEL_WIDTH}px)`;
      (pm as HTMLElement).style.marginLeft = '0';
      (pm as HTMLElement).style.marginRight = '0';
      (pm as HTMLElement).style.maxWidth = '100%';
      (pm as HTMLElement).style.display = 'flex';
      (pm as HTMLElement).style.flexDirection = 'column';
      (pm as HTMLElement).style.minHeight = '100vh';
      if (flexy) {
        (flexy as HTMLElement).style.flex = '1';
        (flexy as HTMLElement).style.display = 'flex';
        (flexy as HTMLElement).style.flexDirection = 'column';
        (flexy as HTMLElement).style.justifyContent = 'center';
        (flexy as HTMLElement).style.width = '100%';
        (flexy as HTMLElement).style.maxWidth = '100%';
      }
      // Remove YouTube's width constraints so video fills available space
      const primary = document.querySelector('#primary')
      const inner = document.querySelector('#primary-inner')
      const player = document.querySelector('#movie_player')
      if (primary) {
        (primary as HTMLElement).style.maxWidth = '100%';
        (primary as HTMLElement).style.width = '100%';
        (primary as HTMLElement).style.marginRight = '0';
      }
      if (inner) {
        (inner as HTMLElement).style.maxWidth = '100%';
        (inner as HTMLElement).style.width = '100%';
      }
      if (player) {
        (player as HTMLElement).style.maxWidth = '100%';
        (player as HTMLElement).style.width = '100%';
      }
    } else {
      (pm as HTMLElement).style.width = '';
      (pm as HTMLElement).style.marginLeft = '';
      (pm as HTMLElement).style.marginRight = '';
      (pm as HTMLElement).style.maxWidth = '';
      (pm as HTMLElement).style.display = '';
      (pm as HTMLElement).style.flexDirection = '';
      (pm as HTMLElement).style.minHeight = '';
      if (flexy) {
        (flexy as HTMLElement).style.flex = '';
        (flexy as HTMLElement).style.display = '';
        (flexy as HTMLElement).style.flexDirection = '';
        (flexy as HTMLElement).style.justifyContent = '';
        (flexy as HTMLElement).style.width = '';
        (flexy as HTMLElement).style.maxWidth = '';
      }
      const primary = document.querySelector('#primary')
      const inner = document.querySelector('#primary-inner')
      const player = document.querySelector('#movie_player')
      if (primary) {
        (primary as HTMLElement).style.maxWidth = '';
        (primary as HTMLElement).style.width = '';
        (primary as HTMLElement).style.marginRight = '';
      }
      if (inner) {
        (inner as HTMLElement).style.maxWidth = '';
        (inner as HTMLElement).style.width = '';
      }
      if (player) {
        (player as HTMLElement).style.maxWidth = '';
        (player as HTMLElement).style.width = '';
      }
    }
  }

  resetLayout(): void {
    const pm = document.querySelector('#page-manager')
    const flexy = document.querySelector('ytd-watch-flexy')
    if (pm) {
      (pm as HTMLElement).style.width = '';
      (pm as HTMLElement).style.marginLeft = '';
      (pm as HTMLElement).style.marginRight = '';
      (pm as HTMLElement).style.maxWidth = '';
      (pm as HTMLElement).style.display = '';
      (pm as HTMLElement).style.flexDirection = '';
      (pm as HTMLElement).style.minHeight = '';
    }
    if (flexy) {
      (flexy as HTMLElement).style.flex = '';
      (flexy as HTMLElement).style.display = '';
      (flexy as HTMLElement).style.flexDirection = '';
      (flexy as HTMLElement).style.justifyContent = '';
    }
  }

  private injectStyles(): void {
    if (document.getElementById(PANEL_STYLE_ID)) return
    this.styleElement = document.createElement('style')
    this.styleElement.id = PANEL_STYLE_ID
    this.styleElement.textContent = `
      #${PANEL_IFRAME_ID} {
        position: fixed !important;
        top: 0 !important;
        right: 0 !important;
        width: ${PANEL_WIDTH}px !important;
        height: 100vh !important;
        border: none !important;
        z-index: 9999 !important;
        background: #0f172a !important;
        box-shadow: -4px 0 16px rgba(0,0,0,0.3) !important;
        transition: transform 0.2s ease, width 0.2s ease !important;
      }

      #${LEARNING_BADGE_ID} {
        position: fixed !important;
        top: 80px !important;
        right: 16px !important;
        z-index: 9998 !important;
        width: 40px !important;
        height: 40px !important;
        border-radius: 10px !important;
        background: linear-gradient(135deg, #3b82f6, #7c3aed) !important;
        border: none !important;
        cursor: pointer !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        color: white !important;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3) !important;
        transition: transform 0.15s, opacity 0.15s !important;
      }

      #${LEARNING_BADGE_ID}:hover {
        transform: scale(1.05) !important;
      }
    `
    document.head.appendChild(this.styleElement)
  }

  private applyPanelStyles(): void {
    if (!this.iframe) return

    Object.assign(this.iframe.style, {
      position: 'fixed',
      top: '0',
      right: '0',
      width: `${PANEL_WIDTH}px`,
      height: '100vh',
      border: 'none',
      zIndex: '9999',
      background: '#0f172a',
      boxShadow: '-4px 0 16px rgba(0,0,0,0.3)',
    })
  }

  getPreferredWidth(): number {
    return PANEL_WIDTH
  }

  destroy(): void {
    this.removePanel()
    this.removeBadge()
    this.resetLayout()
    const style = document.getElementById(PANEL_STYLE_ID)
    if (style) style.remove()
  }
}
