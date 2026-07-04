import type { SaveCategory } from '../types'
import type { AiExplainType } from '@ielts/ai'
import { showExplainPanel } from './aiExplain'
import { injectContentStyles } from './sharedStyles'
import {
  safeStorageGet,
  safeStorageSet,
  safeSyncGet,
  safeSendMessage,
} from '../utils/safe-chrome'

const FLOATING_TOOLBAR_ID = 'ielts-ft-bar'
const FLOATING_STYLES_ID = 'ielts-ft-styles'
const TOAST_ID = 'ielts-ft-toast'

interface ToolbarAction {
  id: string
  icon: string
  label: string
  category?: SaveCategory
  isAiAction?: boolean
}

const ACTIONS: ToolbarAction[] = [
  { id: 'save-word', icon: '📖', label: 'Save Word', category: 'vocabulary' },
  { id: 'save-sentence', icon: '📝', label: 'Save Sentence', category: 'sentence' },
  { id: 'save-mistake', icon: '⚠️', label: 'Mistake Note', category: 'mistake' },
  { id: 'divider', icon: '', label: '' },
  { id: 'explain', icon: '💡', label: 'Explain Meaning', isAiAction: true },
  { id: 'simplify', icon: '✂️', label: 'Simplify Text', isAiAction: true },
  { id: 'translate', icon: '🌐', label: 'Translate to VN', isAiAction: true },
  { id: 'ielts-vocab', icon: '🎯', label: 'IELTS Vocab', isAiAction: true },
]

class FloatingToolbar {
  private bar: HTMLDivElement | null = null
  private styleEl: HTMLStyleElement | null = null
  private selectedText = ''
  private isEnabled = true
  private hideTimer: ReturnType<typeof setTimeout> | null = null

  async init(): Promise<void> {
    await this.loadSettings()
    if (!this.isEnabled) return
    injectContentStyles()
    this.injectStyles()
    this.addListeners()
  }

  private async loadSettings(): Promise<void> {
    const result = await safeSyncGet<any>(['extensionSettings'])
    const settings = result.extensionSettings || {}
    this.isEnabled = settings.floatingToolbar !== false
  }

  private addListeners(): void {
    document.addEventListener('mouseup', this.onMouseUp)
    document.addEventListener('mousedown', this.onMouseDown)
    document.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('scroll', this.hide, { passive: true })

    chrome.storage.onChanged.addListener((changes) => {
      if (!changes.extensionSettings) return
      const next = changes.extensionSettings.newValue
      const enabled = next?.floatingToolbar !== false
      if (enabled !== this.isEnabled) {
        this.isEnabled = enabled
        if (!enabled) this.hide()
      }
    })
  }

  private onMouseUp = (e: MouseEvent): void => {
    if (this.bar?.contains(e.target as Node)) return

    if (this.hideTimer) {
      clearTimeout(this.hideTimer)
      this.hideTimer = null
    }

    setTimeout(() => {
      const sel = window.getSelection()
      const text = sel?.toString().trim() || ''
      if (text.length < 1) {
        this.hide()
        return
      }
      this.selectedText = text
      const range = sel?.getRangeAt(0)
      if (range) {
        this.show(range.getBoundingClientRect())
      }
    }, 0)
  }

  private onMouseDown = (e: MouseEvent): void => {
    if (this.bar && !this.bar.contains(e.target as Node)) {
      this.hide()
    }
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') this.hide()
    if (e.key === 'Shift' || e.key.startsWith('Arrow')) {
      setTimeout(() => {
        const sel = window.getSelection()
        const text = sel?.toString().trim() || ''
        if (text.length >= 1) {
          this.selectedText = text
          const range = sel?.getRangeAt(0)
          if (range) this.show(range.getBoundingClientRect())
        }
      }, 0)
    }
  }

  private show(rect: DOMRect): void {
    this.removeBar()

    this.bar = document.createElement('div')
    this.bar.id = FLOATING_TOOLBAR_ID
    this.bar.setAttribute('role', 'toolbar')
    this.bar.setAttribute('aria-label', 'IELTS learning toolbar')

    const barWidth = 440
    const barHeight = 44

    let left = rect.left + rect.width / 2 - barWidth / 2
    let top = rect.top - barHeight - 10
    let arrowUp = true

    if (top < 6) {
      top = rect.bottom + 10
      arrowUp = false
    }
    if (left < 8) left = 8
    if (left + barWidth > window.innerWidth - 8) {
      left = window.innerWidth - barWidth - 8
    }

    Object.assign(this.bar.style, {
      position: 'fixed',
      left: `${left}px`,
      top: `${top}px`,
      zIndex: '2147483646',
      display: 'flex',
      alignItems: 'center',
      gap: '2px',
      padding: '4px 8px',
      background: 'var(--ielts-surface)',
      border: '1px solid var(--ielts-border)',
      borderRadius: '10px',
      boxShadow: '0 6px 20px rgba(0,0,0,0.35), 0 1px 3px rgba(0,0,0,0.2)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      userSelect: 'none',
      opacity: '0',
      transform: 'translateY(4px)',
      transition: 'opacity 0.15s ease, transform 0.15s ease',
    })

    requestAnimationFrame(() => {
      if (this.bar) {
        this.bar.style.opacity = '1'
        this.bar.style.transform = 'translateY(0)'
      }
    })

    const arrow = document.createElement('div')
    Object.assign(arrow.style, {
      position: 'absolute',
      left: '50%',
      marginLeft: '-6px',
      width: '0',
      height: '0',
      border: '6px solid transparent',
      ...(arrowUp
        ? { top: '100%', borderTopColor: 'var(--ielts-border)', borderBottom: 'none' }
        : { bottom: '100%', borderBottomColor: 'var(--ielts-border)', borderTop: 'none' }),
      pointerEvents: 'none',
    })
    this.bar.appendChild(arrow)

    for (const action of ACTIONS) {
      if (action.id === 'divider') {
        const div = document.createElement('div')
        Object.assign(div.style, {
          width: '1px',
          height: '24px',
          background: 'var(--ielts-border)',
          margin: '0 4px',
          flexShrink: '0',
        })
        this.bar.appendChild(div)
        continue
      }

      const btn = document.createElement('button')
      btn.dataset.action = action.id
      btn.title = action.label
      btn.setAttribute('aria-label', action.label)
      btn.setAttribute('role', 'button')
      btn.tabIndex = 0

      Object.assign(btn.style, {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '36px',
        height: '36px',
        border: 'none',
        borderRadius: '8px',
        background: 'transparent',
        color: 'var(--ielts-text)',
        fontSize: '16px',
        cursor: 'pointer',
        transition: 'background 0.12s',
        flexShrink: '0',
        padding: '0',
        lineHeight: '1',
      })
      btn.innerHTML = action.icon

      btn.addEventListener('mouseenter', () => {
        btn.style.background = 'var(--ielts-surface-alt)'
      })
      btn.addEventListener('mouseleave', () => {
        btn.style.background = 'transparent'
      })
      btn.addEventListener('focus', () => {
        btn.style.background = 'var(--ielts-surface-alt)'
      })
      btn.addEventListener('blur', () => {
        btn.style.background = 'transparent'
      })
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        this.execute(action)
      })
      this.bar.appendChild(btn)
    }

    const closeBtn = document.createElement('button')
    closeBtn.innerHTML = '✕'
    closeBtn.title = 'Close toolbar'
    closeBtn.setAttribute('aria-label', 'Close')
    closeBtn.tabIndex = 0

    Object.assign(closeBtn.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '28px',
      height: '28px',
      border: 'none',
      borderRadius: '6px',
      background: 'transparent',
      color: 'var(--ielts-muted)',
      fontSize: '12px',
      cursor: 'pointer',
      transition: 'all 0.12s',
      marginLeft: '4px',
      flexShrink: '0',
      padding: '0',
      lineHeight: '1',
    })
    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.background = 'var(--ielts-surface-alt)'
      closeBtn.style.color = 'var(--ielts-text)'
    })
    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.background = 'transparent'
      closeBtn.style.color = 'var(--ielts-muted)'
    })
    closeBtn.addEventListener('focus', () => {
      closeBtn.style.background = 'var(--ielts-surface-alt)'
    })
    closeBtn.addEventListener('blur', () => {
      closeBtn.style.background = 'transparent'
      closeBtn.style.color = 'var(--ielts-muted)'
    })
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      this.hide()
    })

    this.bar.appendChild(closeBtn)
    document.body.appendChild(this.bar)
  }

  private execute(action: ToolbarAction): void {
    const text = this.selectedText
    if (!text) return

    this.hide()

    if (action.category) {
      this.saveText(text, action.category)
    } else if (action.isAiAction) {
      this.triggerAI(action, text)
    }
  }

  private async saveText(text: string, category: SaveCategory): Promise<void> {
    const entry = {
      id: crypto.randomUUID(),
      text,
      category,
      pageTitle: document.title,
      pageUrl: window.location.href,
      savedAt: new Date().toISOString(),
      note: '',
      topic: '',
      difficulty: '',
      tags: [] as string[],
    }

    const result = await safeStorageGet<any[]>('savedItems')
    const items = result.savedItems || []
    items.unshift(entry)
    await safeStorageSet({ savedItems: items })

    safeSendMessage({
      type: 'UPDATE_PROGRESS',
      payload: {
        wordsAdded: category === 'vocabulary' ? 1 : 0,
        notesAdded: category === 'mistake' ? 1 : 0,
      },
    })

    this.toast(`Saved as ${category}`)
  }

  private actionToAiType: Record<string, AiExplainType> = {
    explain: 'simple',
    simplify: 'rewrite',
    translate: 'vietnamese',
    'ielts-vocab': 'ielts-vocab',
  }

  private triggerAI(action: ToolbarAction, text: string): void {
    const aiType = this.actionToAiType[action.id]
    if (aiType) {
      showExplainPanel(text, aiType)
    } else {
      this.toast(`AI action not available: ${action.label}`)
    }
  }

  private toast(message: string): void {
    const existing = document.getElementById(TOAST_ID)
    if (existing) existing.remove()

    const el = document.createElement('div')
    el.id = TOAST_ID
    el.textContent = message

    Object.assign(el.style, {
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      background: 'var(--ielts-surface)',
      color: 'var(--ielts-text)',
      padding: '10px 18px',
      borderRadius: '8px',
      fontSize: '13px',
      zIndex: '2147483647',
      boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      border: '1px solid var(--ielts-border)',
      opacity: '0',
      transform: 'translateY(8px)',
      transition: 'opacity 0.2s, transform 0.2s',
      pointerEvents: 'none',
      maxWidth: '380px',
      lineHeight: '1.4',
    })
    el.setAttribute('role', 'alert')
    el.setAttribute('aria-live', 'polite')

    document.body.appendChild(el)

    requestAnimationFrame(() => {
      el.style.opacity = '1'
      el.style.transform = 'translateY(0)'
    })

    setTimeout(() => {
      el.style.opacity = '0'
      el.style.transform = 'translateY(8px)'
      setTimeout(() => el.remove(), 250)
    }, 2800)
  }

  private removeBar(): void {
    const existing = document.getElementById(FLOATING_TOOLBAR_ID)
    if (existing) existing.remove()
  }

  private hide = (): void => {
    this.removeBar()
    this.bar = null
    this.selectedText = ''
  }

  private injectStyles(): void {
    if (document.getElementById(FLOATING_STYLES_ID)) return

    const style = document.createElement('style')
    style.id = FLOATING_STYLES_ID
    style.textContent = `
      #${FLOATING_TOOLBAR_ID} button:focus-visible {
        outline: 2px solid var(--ielts-primary);
        outline-offset: 2px;
      }
      #${FLOATING_TOOLBAR_ID}::-webkit-scrollbar { width: 4px; height: 4px; }
      #${FLOATING_TOOLBAR_ID}::-webkit-scrollbar-track { background: transparent; }
      #${FLOATING_TOOLBAR_ID}::-webkit-scrollbar-thumb { background: var(--ielts-border); border-radius: 2px; }
    `
    document.head.appendChild(style)
    this.styleEl = style
  }

  destroy(): void {
    document.removeEventListener('mouseup', this.onMouseUp)
    document.removeEventListener('mousedown', this.onMouseDown)
    document.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('scroll', this.hide)
    this.hide()
    if (this.styleEl) this.styleEl.remove()
  }
}

const toolbar = new FloatingToolbar()
toolbar.init()
