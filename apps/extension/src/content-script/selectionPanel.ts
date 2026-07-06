import type { SaveCategory } from '../types'
import type { AiExplainType } from '@ielts/ai'
import {
  generateDictionaryEntry,
  dictionaryCache,
  type DictionaryEntry,
} from '@ielts/ai'
import { showExplainPanel } from './aiExplain'
import { injectContentStyles } from './sharedStyles'
import { handleVocabSaved } from './vocabularySaveHandler'
import {
  safeSyncGet,
  safeSendMessage,
  safeFetchProviderConfig,
} from '../utils/safe-chrome'

const SHADOW_HOST_ID = 'ielts-sp-shadow'
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
  { id: 'explain', icon: '💡', label: 'Explain', isAiAction: true },
  { id: 'simplify', icon: '✂️', label: 'Simplify', isAiAction: true },
  { id: 'translate', icon: '🌐', label: 'Translate', isAiAction: true },
  { id: 'ielts-vocab', icon: '🎯', label: 'IELTS Vocab', isAiAction: true },
]

const ACTION_TO_AI_TYPE: Record<string, AiExplainType> = {
  explain: 'simple',
  simplify: 'rewrite',
  translate: 'vietnamese',
  'ielts-vocab': 'ielts-vocab',
}

let shadowHost: HTMLDivElement | null = null
let shadowRoot: ShadowRoot | null = null
let panelEl: HTMLElement | null = null
let styleEl: HTMLStyleElement | null = null
let selectedText = ''
let isEnabled = true
let scrollTimer: ReturnType<typeof setTimeout> | null = null
let selectionCheckTimer: ReturnType<typeof setTimeout> | null = null
let mouseDownTarget: EventTarget | null = null

const PANEL_CSS = `
  :host {
    all: initial;
    display: block;
    position: fixed;
    z-index: 2147483646;
    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    pointer-events: none;
  }
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  .panel {
    background: var(--ielts-surface, #ffffff);
    border: 1px solid var(--ielts-border, #e2e8f0);
    border-radius: 12px;
    box-shadow: 0 8px 28px rgba(0,0,0,0.35), 0 2px 6px rgba(0,0,0,0.2);
    overflow: hidden;
    pointer-events: auto;
    opacity: 0;
    transform: translateY(4px);
    transition: opacity 0.15s ease, transform 0.15s ease;
    width: 420px;
    max-width: calc(100vw - 16px);
  }
  .panel.visible {
    opacity: 1;
    transform: translateY(0);
  }
  .panel-text {
    padding: 8px 12px 0;
    font-size: 12px;
    color: var(--ielts-text-secondary, #475569);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.4;
    max-width: 100%;
  }
  .panel-actions {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 6px 10px 8px;
  }
  .panel-actions.has-body {
    border-bottom: 1px solid var(--ielts-border, #e2e8f0);
  }
  .panel-body {
    padding: 0 12px 10px;
    color: var(--ielts-text, #0f172a);
    font-size: 13px;
    line-height: 1.5;
    max-height: 200px;
    overflow-y: auto;
  }
  .panel-body::-webkit-scrollbar {
    width: 3px;
  }
  .panel-body::-webkit-scrollbar-track {
    background: transparent;
  }
  .panel-body::-webkit-scrollbar-thumb {
    background: var(--ielts-border, #e2e8f0);
    border-radius: 2px;
  }

  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: var(--ielts-text, #0f172a);
    font-size: 16px;
    cursor: pointer;
    transition: background 0.12s;
    flex-shrink: 0;
    padding: 0;
    line-height: 1;
    position: relative;
  }
  .action-btn:hover {
    background: var(--ielts-surface-alt, #f1f5f9);
  }
  .action-btn:focus-visible {
    outline: 2px solid var(--ielts-primary, #2563eb);
    outline-offset: 2px;
  }
  .action-divider {
    width: 1px;
    height: 24px;
    background: var(--ielts-border, #e2e8f0);
    margin: 0 4px;
    flex-shrink: 0;
  }
  .close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--ielts-muted, #94a3b8);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.12s;
    margin-left: 4px;
    flex-shrink: 0;
    padding: 0;
    line-height: 1;
  }
  .close-btn:hover {
    background: var(--ielts-surface-alt, #f1f5f9);
    color: var(--ielts-text, #0f172a);
  }

  .dict-pos {
    font-size: 11px;
    color: var(--ielts-muted, #94a3b8);
    background: var(--ielts-surface-alt, #f1f5f9);
    padding: 2px 6px;
    border-radius: 4px;
  }
  .dict-pronunciation {
    font-size: 11px;
    color: var(--ielts-muted, #94a3b8);
    font-style: italic;
  }
  .dict-speak-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--ielts-muted, #94a3b8);
    cursor: pointer;
    padding: 0;
    line-height: 1;
    flex-shrink: 0;
    font-size: 14px;
    transition: background 0.12s;
  }
  .dict-speak-btn:hover {
    background: var(--ielts-surface-alt, #f1f5f9);
    color: var(--ielts-text, #0f172a);
  }
  .dict-meaning {
    font-size: 12px;
    color: var(--ielts-text, #0f172a);
    line-height: 1.5;
  }
  .dict-example {
    font-size: 12px;
    color: var(--ielts-muted, #94a3b8);
    font-style: italic;
    line-height: 1.4;
  }
  .dict-tag {
    font-size: 11px;
    color: var(--ielts-muted, #94a3b8);
  }
  .dict-tag span {
    color: var(--ielts-primary, #2563eb);
  }
  .dict-tag .success {
    color: var(--ielts-success, #22c55e);
  }

  .loading-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid var(--ielts-border, #e2e8f0);
    border-top-color: var(--ielts-primary, #2563eb);
    border-radius: 50%;
    animation: sp-spin 0.7s linear infinite;
    flex-shrink: 0;
  }
  .loading-text {
    color: var(--ielts-muted, #94a3b8);
    font-size: 12px;
  }
  .error-text {
    font-size: 12px;
    color: var(--ielts-text-secondary, #475569);
    line-height: 1.5;
  }
  .error-icon {
    color: var(--ielts-warning, #f59e0b);
  }
  .no-key-msg {
    padding: 4px 0;
    font-size: 12px;
    color: var(--ielts-text-secondary, #475569);
    line-height: 1.5;
  }

  @keyframes sp-spin {
    to { transform: rotate(360deg); }
  }
`

async function init(): Promise<void> {
  await loadSettings()
  if (!isEnabled) return
  injectContentStyles()
  document.addEventListener('mouseup', onMouseUp)
  document.addEventListener('mousedown', onMouseDown)
  document.addEventListener('keydown', onKeyDown)
  document.addEventListener('selectionchange', onSelectionChange)
  document.addEventListener('touchstart', onTouchStart, { passive: true })
  window.addEventListener('scroll', onScroll, { passive: true })

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
  if (shadowHost?.contains(e.target as Node)) return

  mouseDownTarget = null
  scheduleSelectionCheck(0)
}

function scheduleSelectionCheck(delay: number = 80): void {
  if (selectionCheckTimer) clearTimeout(selectionCheckTimer)
  selectionCheckTimer = setTimeout(() => {
    selectionCheckTimer = null
    performSelectionCheck()
  }, delay)
}

function performSelectionCheck(): void {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) {
    hide()
    return
  }
  const text = sel.toString().trim()
  if (text.length < 1) {
    hide()
    return
  }
  selectedText = text
  const range = sel.getRangeAt(0)
  if (range) show(range.getBoundingClientRect())
}

function onMouseDown(e: MouseEvent): void {
  mouseDownTarget = e.target
  if (selectionCheckTimer) {
    clearTimeout(selectionCheckTimer)
    selectionCheckTimer = null
  }
  if (shadowHost && !shadowHost.contains(e.target as Node)) {
    hide()
  }
}

function onKeyDown(e: KeyboardEvent): void {
  if (e.key === 'Escape') hide()
  if (e.key === 'Shift' || e.key.startsWith('Arrow')) {
    scheduleSelectionCheck(0)
  }
}

function onSelectionChange(): void {
  if (!isEnabled) return
  if (mouseDownTarget) return
  scheduleSelectionCheck(120)
}

function onTouchStart(e: TouchEvent): void {
  if (shadowHost && !shadowHost.contains(e.target as Node)) {
    hide()
  }
}

function onScroll(): void {
  if (scrollTimer) clearTimeout(scrollTimer)
  scrollTimer = setTimeout(() => {
    hide()
  }, 80)
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

function createShadowPanel(rect: DOMRect): void {
  removePanel()

  shadowHost = document.createElement('div')
  shadowHost.id = SHADOW_HOST_ID
  shadowRoot = shadowHost.attachShadow({ mode: 'closed' })

  const styleSheet = document.createElement('style')
  styleSheet.textContent = PANEL_CSS
  shadowRoot.appendChild(styleSheet)

  panelEl = document.createElement('div')
  panelEl.className = 'panel'
  shadowRoot.appendChild(panelEl)

  const panelWidth = 420
  let left = rect.left + rect.width / 2 - panelWidth / 2
  let top = rect.top - 8

  if (top < 4) top = rect.bottom + 8
  if (left < 8) left = 8
  if (left + panelWidth > window.innerWidth - 8) {
    left = window.innerWidth - panelWidth - 8
  }

  Object.assign(shadowHost.style, {
    left: `${left}px`,
    top: `${top}px`,
    position: 'fixed' as const,
    pointerEvents: 'none' as const,
    zIndex: '2147483646',
  })

  document.body.appendChild(shadowHost)
}

function renderPanel(isWord: boolean): void {
  if (!panelEl) return

  const escapedText = escapeHtml(selectedText)

  let actionsHtml = ''
  for (const action of ACTIONS) {
    if (action.id === 'divider') {
      actionsHtml += `<div class="action-divider"></div>`
    } else {
      actionsHtml += `<button class="action-btn" data-action="${action.id}" title="${escapeHtml(action.label)}" aria-label="${escapeHtml(action.label)}" role="button" tabindex="0">${action.icon}</button>`
    }
  }
  actionsHtml += `<button class="close-btn" data-action="close" aria-label="Close" title="Close" tabindex="0">✕</button>`

  panelEl.innerHTML = `
    <div class="panel-text">&ldquo;${escapedText}&rdquo;</div>
    <div class="panel-actions${isWord ? ' has-body' : ''}">
      ${actionsHtml}
    </div>
    <div class="panel-body" style="display:${isWord ? 'block' : 'none'};">&nbsp;</div>
  `

  requestAnimationFrame(() => {
    panelEl?.classList.add('visible')
  })

  bindEvents()

  if (isWord) {
    loadDictionaryData()
  }
}

function show(rect: DOMRect): void {
  const isWord = isWordOnly(selectedText)
  createShadowPanel(rect)
  renderPanel(isWord)
}

function bindEvents(): void {
  if (!panelEl || !shadowRoot) return

  const buttons = panelEl.querySelectorAll('[data-action]')
  buttons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      const actionId = (btn as HTMLElement).dataset.action || ''
      if (actionId === 'close') {
        hide()
        return
      }
      const action = ACTIONS.find(a => a.id === actionId)
      if (action) execute(action)
    })
  })
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
  showToast(`Saved as ${category}`)

  safeSendMessage({
    type: 'SAVE_SELECTION_FULL',
    payload: {
      text,
      category,
      pageTitle: document.title,
      pageUrl: window.location.href,
    },
  })

  if (category === 'vocabulary') {
    handleVocabSaved(text)
  }
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
  const bodyEl = panelEl?.querySelector('.panel-body') as HTMLElement
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
      <div class="loading-spinner"></div>
      <span class="loading-text">Looking up &ldquo;${escapeHtml(word)}&rdquo;&hellip;</span>
    </div>
  `

  const config = await getProviderConfig()

  if (!config.apiKey) {
    bodyEl.innerHTML = `
      <div class="no-key-msg"><span class="error-icon">⚠</span> Add AI key in Settings to see dictionary data.</div>
    `
    return
  }

  const result = await generateDictionaryEntry(word, context, () => config)
  if (result.data) {
    renderDictionaryData(result.data)
  } else if (result.error) {
    bodyEl.innerHTML = `<div class="error-text">${escapeHtml(result.error)}</div>`
  }
}

function renderDictionaryData(data: DictionaryEntry): void {
  const bodyEl = panelEl?.querySelector('.panel-body') as HTMLElement
  if (!bodyEl) return

  let html = ''

  if (data.partOfSpeech || data.pronunciation) {
    html += `<div style="margin-bottom:6px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">`
    if (data.partOfSpeech) {
      html += `<span class="dict-pos">${escapeHtml(data.partOfSpeech)}</span>`
    }
    if (data.pronunciation) {
      html += `<span class="dict-pronunciation">${escapeHtml(data.pronunciation)}</span>`
    }
    html += `<button class="dict-speak-btn" data-action="speak" title="Listen to pronunciation" aria-label="Listen to pronunciation">🔊</button>`
    html += `</div>`
  }

  html += `<div class="dict-meaning" style="margin-bottom:4px;">${escapeHtml(data.meaning)}</div>`

  if (data.exampleSentence) {
    html += `<div class="dict-example" style="margin-bottom:4px;">&ldquo;${escapeHtml(data.exampleSentence)}&rdquo;</div>`
  }

  if (data.synonyms.length > 0) {
    html += `<div class="dict-tag" style="margin-bottom:2px;">Synonyms: <span>${data.synonyms.map(s => escapeHtml(s)).join(', ')}</span></div>`
  }

  if (data.collocations.length > 0) {
    html += `<div class="dict-tag" style="margin-bottom:2px;">Collocations: <span class="success">${data.collocations.map(c => escapeHtml(c)).join(', ')}</span></div>`
  }

  if (data.ieltsTopic) {
    html += `<div class="dict-tag" style="margin-top:2px;">🏷 Topic: <span>${escapeHtml(data.ieltsTopic)}</span></div>`
  }

  bodyEl.innerHTML = html

  const speakBtn = bodyEl.querySelector('[data-action="speak"]') as HTMLElement
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
    background: 'var(--ielts-surface, #ffffff)',
    color: 'var(--ielts-text, #0f172a)',
    padding: '10px 18px',
    borderRadius: '8px',
    fontSize: '13px',
    zIndex: '2147483647',
    boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    border: '1px solid var(--ielts-border, #e2e8f0)',
    opacity: '0',
    transform: 'translateY(8px)',
    transition: 'opacity 0.2s, transform 0.2s',
    pointerEvents: 'none',
    maxWidth: '380px',
    lineHeight: '1.4',
  } as Record<string, string>)
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
  if (shadowHost) {
    shadowHost.remove()
    shadowHost = null
    shadowRoot = null
    panelEl = null
  }
}

function hide(): void {
  if (panelEl) {
    panelEl.classList.remove('visible')
    setTimeout(() => {
      removePanel()
    }, 150)
  }
  selectedText = ''
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

export function destroySelectionPanel(): void {
  document.removeEventListener('mouseup', onMouseUp)
  document.removeEventListener('mousedown', onMouseDown)
  document.removeEventListener('keydown', onKeyDown)
  document.removeEventListener('selectionchange', onSelectionChange)
  document.removeEventListener('touchstart', onTouchStart)
  window.removeEventListener('scroll', onScroll)
  if (scrollTimer) clearTimeout(scrollTimer)
  if (selectionCheckTimer) clearTimeout(selectionCheckTimer)
  removePanel()
  if (styleEl) styleEl.remove()
}

init().catch((err) => {
  console.error('[IELTS] Selection panel init failed:', err)
})

export {}
