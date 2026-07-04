import type { SaveCategory } from '../types'
import type { AiExplainType } from '@ielts/ai'
import {
  generateDictionaryEntry,
  dictionaryCache,
  type DictionaryEntry,
} from '@ielts/ai'
import { showExplainPanel } from './aiExplain'
import { injectContentStyles } from './sharedStyles'
import {
  safeStorageGet,
  safeStorageSet,
  safeSyncGet,
  safeSendMessage,
  safeFetchProviderConfig,
} from '../utils/safe-chrome'

const PANEL_ID = 'ielts-sp-panel'
const STYLES_ID = 'ielts-sp-styles'
const TOAST_ID = 'ielts-sp-toast'

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

const ACTION_TO_AI_TYPE: Record<string, AiExplainType> = {
  explain: 'simple',
  simplify: 'rewrite',
  translate: 'vietnamese',
  'ielts-vocab': 'ielts-vocab',
}

let panelEl: HTMLDivElement | null = null
let styleEl: HTMLStyleElement | null = null
let selectedText = ''
let isEnabled = true

async function init(): Promise<void> {
  await loadSettings()
  if (!isEnabled) return
  injectContentStyles()
  injectStyles()
  document.addEventListener('mouseup', onMouseUp)
  document.addEventListener('mousedown', onMouseDown)
  document.addEventListener('keydown', onKeyDown)
  window.addEventListener('scroll', hide, { passive: true })

  chrome.storage.onChanged.addListener((changes) => {
    if (!changes.extensionSettings) return
    const next = changes.extensionSettings.newValue
    const enabled = next?.floatingToolbar !== false
    if (enabled !== isEnabled) {
      isEnabled = enabled
      if (!enabled) hide()
    }
  })
}

async function loadSettings(): Promise<void> {
  const result = await safeSyncGet<any>(['extensionSettings'])
  const settings = result.extensionSettings || {}
  isEnabled = settings.floatingToolbar !== false
}

function onMouseUp(e: MouseEvent): void {
  if (!isEnabled) return
  if (panelEl?.contains(e.target as Node)) return

  setTimeout(() => {
    const sel = window.getSelection()
    const text = sel?.toString().trim() || ''
    if (text.length < 1) {
      hide()
      return
    }
    selectedText = text
    const range = sel?.getRangeAt(0)
    if (range) show(range.getBoundingClientRect())
  }, 0)
}

function onMouseDown(e: MouseEvent): void {
  if (panelEl && !panelEl.contains(e.target as Node)) {
    hide()
  }
}

function onKeyDown(e: KeyboardEvent): void {
  if (e.key === 'Escape') hide()
  if (e.key === 'Shift' || e.key.startsWith('Arrow')) {
    setTimeout(() => {
      const sel = window.getSelection()
      const text = sel?.toString().trim() || ''
      if (text.length >= 1) {
        selectedText = text
        const range = sel?.getRangeAt(0)
        if (range) show(range.getBoundingClientRect())
      }
    }, 0)
  }
}

function isWordOnly(text: string): boolean {
  const cleaned = text.trim().replace(/[.,!?;:'"()\-]/g, '')
  const words = cleaned.split(/\s+/).filter(Boolean)
  if (words.length < 1 || words.length > 2) return false
  for (const w of words) {
    if (!/^[a-zA-Z\u00C0-\u024F]+(?:'[a-zA-Z]+)?$/.test(w)) return false
  }
  return true
}

function normalizeWord(text: string): string {
  return text.trim().replace(/[.,!?;:'"()\-]/g, '').toLowerCase()
}

function getContextForWord(word: string): string {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return ''
  const range = sel.getRangeAt(0)
  const node = range.startContainer
  if (!node || !node.textContent) return ''
  const text = node.textContent
  const idx = text.toLowerCase().indexOf(word.toLowerCase())
  if (idx === -1) return ''
  const start = Math.max(0, idx - 60)
  const end = Math.min(text.length, idx + word.length + 60)
  let snippet = text.slice(start, end).replace(/\s+/g, ' ').trim()
  if (start > 0) snippet = '...' + snippet
  if (end < text.length) snippet = snippet + '...'
  return snippet
}

function show(rect: DOMRect): void {
  removePanel()

  const isWord = isWordOnly(selectedText)

  panelEl = document.createElement('div')
  panelEl.id = PANEL_ID
  panelEl.setAttribute('role', 'dialog')
  panelEl.setAttribute('aria-label', 'IELTS learning panel')

  const panelWidth = 420

  let left = rect.left + rect.width / 2 - panelWidth / 2
  let top = rect.top - 8

  if (top < 4) top = rect.bottom + 8
  if (left < 8) left = 8
  if (left + panelWidth > window.innerWidth - 8) {
    left = window.innerWidth - panelWidth - 8
  }

  Object.assign(panelEl.style, {
    position: 'fixed',
    left: `${left}px`,
    top: `${top}px`,
    zIndex: '2147483646',
    width: `${panelWidth}px`,
    background: 'var(--ielts-surface)',
    borderRadius: '12px',
    boxShadow: '0 8px 28px rgba(0,0,0,0.35), 0 2px 6px rgba(0,0,0,0.2)',
    border: '1px solid var(--ielts-border)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color: 'var(--ielts-text)',
    opacity: '0',
    transform: 'translateY(4px)',
    transition: 'opacity 0.15s ease, transform 0.15s ease',
    overflow: 'hidden',
    cursor: 'default',
  })

  requestAnimationFrame(() => {
    if (panelEl) {
      panelEl.style.opacity = '1'
      panelEl.style.transform = 'translateY(0)'
    }
  })

  let actionsHtml = ''
  for (const action of ACTIONS) {
    if (action.id === 'divider') {
      actionsHtml += `<div style="width:1px;height:24px;background:var(--ielts-border);margin:0 4px;flex-shrink:0;"></div>`
    } else {
      actionsHtml += `<button data-action="${action.id}" title="${action.label}" aria-label="${action.label}" role="button" tabindex="0" style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;border:none;border-radius:8px;background:transparent;color:var(--ielts-text);font-size:16px;cursor:pointer;transition:background 0.12s;flex-shrink:0;padding:0;line-height:1;">${action.icon}</button>`
    }
  }
  actionsHtml += `<button id="${PANEL_ID}-close" aria-label="Close" title="Close" tabindex="0" style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border:none;border-radius:6px;background:transparent;color:var(--ielts-muted);font-size:12px;cursor:pointer;transition:all 0.12s;margin-left:4px;flex-shrink:0;padding:0;line-height:1;">✕</button>`

  panelEl.innerHTML = `
    <div id="${PANEL_ID}-text" style="padding:8px 12px 0;font-size:12px;color:var(--ielts-text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.4;max-width:100%;">
      &ldquo;${escapeHtml(selectedText)}&rdquo;
    </div>
    <div id="${PANEL_ID}-actions" style="display:flex;align-items:center;gap:2px;padding:6px 10px 8px;border-bottom:${isWord ? '1px solid var(--ielts-border)' : 'none'};">
      ${actionsHtml}
    </div>
    <div id="${PANEL_ID}-body" style="display:${isWord ? 'block' : 'none'};padding:0 12px 10px;min-height:${isWord ? '32px' : '0'};color:var(--ielts-text);font-size:13px;line-height:1.5;"></div>
  `

  document.body.appendChild(panelEl)
  bindEvents()

  if (isWord) {
    loadDictionaryData()
  }
}

function bindEvents(): void {
  if (!panelEl) return

  const closeBtn = panelEl.querySelector(`#${PANEL_ID}-close`) as HTMLButtonElement
  if (closeBtn) {
    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.background = 'var(--ielts-surface-alt)'
      closeBtn.style.color = 'var(--ielts-text)'
    })
    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.background = 'transparent'
      closeBtn.style.color = 'var(--ielts-muted)'
    })
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      hide()
    })
  }

  const actionsEl = panelEl.querySelector(`#${PANEL_ID}-actions`)
  if (actionsEl) {
    const buttons = actionsEl.querySelectorAll('button[data-action]')
    buttons.forEach(btn => {
      btn.addEventListener('mouseenter', () => { (btn as HTMLButtonElement).style.background = 'var(--ielts-surface-alt)' })
      btn.addEventListener('mouseleave', () => { (btn as HTMLButtonElement).style.background = 'transparent' })
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        const actionId = (btn as HTMLButtonElement).dataset.action || ''
        const action = ACTIONS.find(a => a.id === actionId)
        if (action) execute(action)
      })
    })
  }
}

function execute(action: ToolbarAction): void {
  const text = selectedText
  if (!text) return
  hide()

  if (action.category) {
    saveText(text, action.category)
  } else if (action.isAiAction) {
    triggerAI(action, text)
  }
}

async function saveText(text: string, category: SaveCategory): Promise<void> {
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

  if (category === 'vocabulary') {
    try {
      window.postMessage({
        source: 'ielts-extension',
        action: 'VOCAB_SAVED',
        data: entry,
      }, window.location.origin)
    } catch { /* ignore */ }
  }

  showToast(`Saved as ${category}`)
}

function triggerAI(action: ToolbarAction, text: string): void {
  const aiType = ACTION_TO_AI_TYPE[action.id]
  if (aiType) {
    showExplainPanel(text, aiType)
  } else {
    showToast(`AI action not available: ${action.label}`)
  }
}

async function loadDictionaryData(): Promise<void> {
  const bodyEl = panelEl?.querySelector(`#${PANEL_ID}-body`) as HTMLDivElement
  if (!bodyEl) return

  const word = normalizeWord(selectedText)
  if (!word) return

  const context = getContextForWord(word)

  const cached = dictionaryCache.get(word, context)
  if (cached) {
    renderDictionaryData(cached)
    return
  }

  bodyEl.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;padding:4px 0;">
      <div class="${PANEL_ID}-spinner" style="width:14px;height:14px;border:2px solid var(--ielts-border);border-top-color:var(--ielts-primary);border-radius:50%;animation:${PANEL_ID}-spin 0.7s linear infinite;flex-shrink:0;"></div>
      <span style="color:var(--ielts-muted);font-size:12px;">Looking up &ldquo;${escapeHtml(word)}&rdquo;&hellip;</span>
    </div>
  `

  const config = await getProviderConfig()

  if (!config.apiKey) {
    bodyEl.innerHTML = `
      <div style="padding:4px 0;font-size:12px;color:var(--ielts-text-secondary);line-height:1.5;">
        <span style="color:var(--ielts-warning);">⚠</span> Add AI key in Settings to see dictionary data.
      </div>
    `
    return
  }

  const result = await generateDictionaryEntry(word, context, () => config)
  if (result.data) {
    renderDictionaryData(result.data)
  } else if (result.error) {
    bodyEl.innerHTML = `
      <div style="padding:4px 0;font-size:12px;color:var(--ielts-text-secondary);line-height:1.5;">${escapeHtml(result.error)}</div>
    `
  }
}

function renderDictionaryData(data: DictionaryEntry): void {
  const bodyEl = panelEl?.querySelector(`#${PANEL_ID}-body`) as HTMLDivElement
  if (!bodyEl) return

  let html = ''

  if (data.partOfSpeech || data.pronunciation) {
    html += `<div style="margin-bottom:6px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">`
    if (data.partOfSpeech) {
      html += `<span style="font-size:11px;color:var(--ielts-muted);background:var(--ielts-surface-alt);padding:2px 6px;border-radius:4px;">${escapeHtml(data.partOfSpeech)}</span>`
    }
    if (data.pronunciation) {
      html += `<span style="font-size:11px;color:var(--ielts-muted);font-style:italic;">${escapeHtml(data.pronunciation)}</span>`
    }
    html += `<button id="${PANEL_ID}-speak" title="Listen to pronunciation" aria-label="Listen to pronunciation" style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border:none;border-radius:4px;background:transparent;color:var(--ielts-muted);cursor:pointer;padding:0;line-height:1;flex-shrink:0;font-size:14px;">🔊</button>`
    html += `</div>`
  }

  html += `<div style="margin-bottom:4px;"><span style="font-size:12px;color:var(--ielts-text);line-height:1.5;">${escapeHtml(data.meaning)}</span></div>`

  if (data.exampleSentence) {
    html += `<div style="margin-bottom:4px;font-size:12px;color:var(--ielts-muted);font-style:italic;line-height:1.4;">&ldquo;${escapeHtml(data.exampleSentence)}&rdquo;</div>`
  }

  if (data.synonyms.length > 0) {
    html += `<div style="margin-bottom:2px;font-size:11px;color:var(--ielts-muted);">Synonyms: <span style="color:var(--ielts-primary);">${data.synonyms.map(s => escapeHtml(s)).join(', ')}</span></div>`
  }

  if (data.collocations.length > 0) {
    html += `<div style="margin-bottom:2px;font-size:11px;color:var(--ielts-muted);">Collocations: <span style="color:var(--ielts-success);">${data.collocations.map(c => escapeHtml(c)).join(', ')}</span></div>`
  }

  if (data.ieltsTopic) {
    html += `<div style="margin-top:2px;font-size:11px;color:var(--ielts-muted);">🏷 Topic: <span style="color:var(--ielts-primary);">${escapeHtml(data.ieltsTopic)}</span></div>`
  }

  bodyEl.innerHTML = html

  const speakBtn = document.getElementById(`${PANEL_ID}-speak`)
  if (speakBtn) {
    speakBtn.addEventListener('click', () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(normalizeWord(selectedText) || data.word)
        utterance.lang = 'en-US'
        utterance.rate = 0.85
        window.speechSynthesis.speak(utterance)
      }
    })
  }
}

function showToast(message: string): void {
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

const getProviderConfig = safeFetchProviderConfig

function removePanel(): void {
  const existing = document.getElementById(PANEL_ID)
  if (existing) existing.remove()
  panelEl = null
}

function hide(): void {
  if (panelEl) {
    panelEl.style.opacity = '0'
    panelEl.style.transform = 'translateY(4px)'
    setTimeout(() => {
      if (panelEl) {
        panelEl.remove()
        panelEl = null
      }
    }, 150)
  }
  selectedText = ''
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function injectStyles(): void {
  if (document.getElementById(STYLES_ID)) return

  const style = document.createElement('style')
  style.id = STYLES_ID
  style.textContent = `
    @keyframes ${PANEL_ID}-spin {
      to { transform: rotate(360deg); }
    }
    #${PANEL_ID} * { box-sizing: border-box; }
    #${PANEL_ID} button:hover { opacity: 0.85; }
    #${PANEL_ID}-close:hover { background: var(--ielts-surface-alt) !important; }
    #${PANEL_ID} button:focus-visible { outline: 2px solid var(--ielts-primary); outline-offset: 2px; }
    #${PANEL_ID}-body::-webkit-scrollbar { width: 3px; }
    #${PANEL_ID}-body::-webkit-scrollbar-track { background: transparent; }
    #${PANEL_ID}-body::-webkit-scrollbar-thumb { background: var(--ielts-border); border-radius: 2px; }
  `
  document.head.appendChild(style)
  styleEl = style
}

export function destroySelectionPanel(): void {
  document.removeEventListener('mouseup', onMouseUp)
  document.removeEventListener('mousedown', onMouseDown)
  document.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('scroll', hide)
  removePanel()
  if (styleEl) styleEl.remove()
}

init().catch((err) => {
  console.error('[IELTS] Selection panel init failed:', err)
})

export {}
