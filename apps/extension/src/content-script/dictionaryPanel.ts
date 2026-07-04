import {
  generateDictionaryEntry,
  dictionaryCache,
  type DictionaryEntry,
} from '@ielts/ai'
import { injectContentStyles } from './sharedStyles'
import {
  safeStorageGet,
  safeStorageSet,
  safeSendMessage,
  safeFetchProviderConfig,
} from '../utils/safe-chrome'

const PANEL_ID = 'ielts-dict-panel'
const TOAST_ID = 'ielts-dict-toast'
const STYLES_ID = 'ielts-dict-styles'

const getProviderConfig = safeFetchProviderConfig

let panelEl: HTMLDivElement | null = null
let currentWord = ''
let currentContext = ''
let isPanelVisible = false
let hideTimer: ReturnType<typeof setTimeout> | null = null
let panelManualDismiss = false

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

function getContextForWord(word: string, node?: Node): string {
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

function init(): void {
  injectContentStyles()
  injectStyles()
  document.addEventListener('mouseup', onMouseUp)
  document.addEventListener('mousedown', onMouseDown)
  document.addEventListener('keydown', onKeyDown)
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', scheduleHide, { passive: true })
}

function onMouseUp(e: MouseEvent): void {
  if (panelEl?.contains(e.target as Node)) return
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
  setTimeout(() => {
    const sel = window.getSelection()
    const text = sel?.toString().trim() || ''
    if (!text || text.length > 60 || !isWordOnly(text)) {
      if (!panelManualDismiss) hidePanel()
      return
    }
    const word = normalizeWord(text)
    if (!word) {
      if (!panelManualDismiss) hidePanel()
      return
    }
    panelManualDismiss = false
    currentWord = word
    currentContext = ''
    const range = sel?.getRangeAt(0)
    if (range) {
      const contextNode = range.startContainer
      currentContext = getContextForWord(word, contextNode)
      showPanel(range.getBoundingClientRect())
    }
  }, 250)
}

function onMouseDown(e: MouseEvent): void {
  if (panelEl && !panelEl.contains(e.target as Node)) {
    panelManualDismiss = true
    scheduleHide()
  }
}

function onKeyDown(e: KeyboardEvent): void {
  if (e.key === 'Escape') {
    panelManualDismiss = true
    hidePanel()
  }
}

function onScroll(): void {
  if (isPanelVisible) scheduleHide()
}

function scheduleHide(): void {
  if (hideTimer) clearTimeout(hideTimer)
  hideTimer = setTimeout(() => {
    hidePanel()
    hideTimer = null
  }, 300)
}

function showPanel(rect: DOMRect): void {
  removePanel()

  isPanelVisible = true
  panelEl = document.createElement('div')
  panelEl.id = PANEL_ID
  panelEl.setAttribute('role', 'dialog')
  panelEl.setAttribute('aria-label', `Dictionary: ${currentWord}`)

  const panelWidth = 320
  const panelHeight = 80

  let left = rect.left + rect.width / 2 - panelWidth / 2
  let top = rect.top - panelHeight - 8

  if (top < 4) {
    top = rect.bottom + 8
  }
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
    borderRadius: '10px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.35), 0 2px 6px rgba(0,0,0,0.2)',
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

  panelEl.innerHTML = `
    <div id="${PANEL_ID}-header" style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px 0;gap:8px;">
      <div style="display:flex;align-items:center;gap:6px;flex:1;min-width:0;">
        <span style="flex-shrink:0;font-size:15px;">📖</span>
        <span id="${PANEL_ID}-word" style="font-size:14px;font-weight:600;color:var(--ielts-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(currentWord)}</span>
      </div>
      <div id="${PANEL_ID}-meta" style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
        <span id="${PANEL_ID}-pos" style="display:none;font-size:11px;color:var(--ielts-muted);background:var(--ielts-surface-alt);padding:2px 6px;border-radius:4px;"></span>
        <span id="${PANEL_ID}-pron" style="display:none;font-size:11px;color:var(--ielts-muted);font-style:italic;"></span>
      </div>
    </div>
    <div id="${PANEL_ID}-body" style="padding:4px 12px 8px;min-height:32px;color:var(--ielts-text);"></div>
    <div id="${PANEL_ID}-footer" style="display:none;padding:0 12px 8px;gap:6px;align-items:center;">
      <button id="${PANEL_ID}-save" style="display:flex;align-items:center;gap:4px;padding:5px 12px;border:none;border-radius:6px;background:var(--ielts-primary);color:#fff;font-size:12px;cursor:pointer;font-weight:500;line-height:1;">📥 Save Word</button>
      <button id="${PANEL_ID}-close" aria-label="Close" style="display:flex;align-items:center;justify-content:center;width:26px;height:26px;border:none;border-radius:6px;background:transparent;color:var(--ielts-muted);font-size:13px;cursor:pointer;line-height:1;">✕</button>
    </div>
  `

  document.body.appendChild(panelEl)
  bindEvents()
  loadDictionaryData()
}

function bindEvents(): void {
  const closeBtn = panelEl?.querySelector(`#${PANEL_ID}-close`)
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      panelManualDismiss = true
      hidePanel()
    })
  }

  const saveBtn = panelEl?.querySelector(`#${PANEL_ID}-save`)
  if (saveBtn) {
    saveBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      saveWord()
    })
  }
}

async function loadDictionaryData(): Promise<void> {
  const bodyEl = panelEl?.querySelector(`#${PANEL_ID}-body`) as HTMLDivElement
  if (!bodyEl) return

  const cached = dictionaryCache.get(currentWord, currentContext)
  if (cached) {
    renderDictionaryData(cached)
    return
  }

  bodyEl.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;padding:8px 0;">
      <div class="${PANEL_ID}-spinner" style="width:16px;height:16px;border:2px solid var(--ielts-border);border-top-color:var(--ielts-primary);border-radius:50%;animation:${PANEL_ID}-spin 0.7s linear infinite;flex-shrink:0;"></div>
      <span style="color:var(--ielts-muted);font-size:12px;">Looking up "${escapeHtml(currentWord)}"...</span>
    </div>
  `

  const config = await getProviderConfig()

  if (!config.apiKey) {
    bodyEl.innerHTML = `
      <div style="padding:6px 0;">
        <div style="font-size:12px;color:var(--ielts-text-secondary);line-height:1.5;">
          <span style="color:var(--ielts-warning);">⚠️</span> Add AI key in Settings to see dictionary data.
        </div>
      </div>
    `
    showFooter()
    return
  }

  const result = await generateDictionaryEntry(currentWord, currentContext, () => config)

  if (result.data) {
    renderDictionaryData(result.data)
  } else if (result.error) {
      bodyEl.innerHTML = `
        <div style="padding:6px 0;">
          <div style="font-size:12px;color:var(--ielts-danger);line-height:1.5;">${escapeHtml(result.error)}</div>
        </div>
      `
    showFooter()
  }
}

function renderDictionaryData(data: DictionaryEntry): void {
  const bodyEl = panelEl?.querySelector(`#${PANEL_ID}-body`) as HTMLDivElement
  const posEl = panelEl?.querySelector(`#${PANEL_ID}-pos`) as HTMLSpanElement
  const pronEl = panelEl?.querySelector(`#${PANEL_ID}-pron`) as HTMLSpanElement
  if (!bodyEl) return

  if (data.partOfSpeech && posEl) {
    posEl.textContent = data.partOfSpeech
    posEl.style.display = 'inline'
  }
  if (data.pronunciation && pronEl) {
    pronEl.textContent = data.pronunciation
    pronEl.style.display = 'inline'
  }

  let html = ''

  html += `<div style="margin-bottom:6px;"><span style="font-size:12px;color:var(--ielts-text-secondary);line-height:1.5;">${escapeHtml(data.meaning)}</span></div>`

  if (data.exampleSentence) {
    html += `<div style="margin-bottom:4px;font-size:12px;color:var(--ielts-muted);font-style:italic;line-height:1.4;">"${escapeHtml(data.exampleSentence)}"</div>`
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
  showFooter()
}

function showFooter(): void {
  const footer = panelEl?.querySelector(`#${PANEL_ID}-footer`) as HTMLDivElement
  if (footer) {
    footer.style.display = 'flex'
  }
}

async function saveWord(): Promise<void> {
  const entry = {
    id: crypto.randomUUID(),
    word: currentWord,
    sourceSentence: currentContext,
    pageTitle: document.title,
    pageUrl: window.location.href,
    topic: '',
    personalNote: '',
    tags: [] as string[],
    meaning: '',
    meaningVi: '',
    partOfSpeech: '',
    pronunciation: '',
    exampleSentence: '',
    synonyms: [] as string[],
    antonyms: [] as string[],
    collocations: [] as string[],
    wordFamily: [] as string[],
    difficulty: '' as const,
    status: 'new' as const,
    addedToReview: false,
    reviewId: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const cached = dictionaryCache.get(currentWord, currentContext)
  if (cached) {
    entry.meaning = cached.meaning
    entry.meaningVi = cached.meaningVi
    entry.partOfSpeech = cached.partOfSpeech
    entry.pronunciation = cached.pronunciation
    entry.exampleSentence = cached.exampleSentence
    entry.synonyms = cached.synonyms
    entry.collocations = cached.collocations
  }

  const vocabResult = await safeStorageGet<any[]>('vocabulary')
  const vocabItems = vocabResult.vocabulary || []
  vocabItems.unshift(entry)
  await safeStorageSet({ vocabulary: vocabItems })

  safeSendMessage({
    type: 'UPDATE_PROGRESS',
    payload: { wordsAdded: 1 },
  })

  showToast(`"${currentWord}" saved to vocabulary`)
  panelManualDismiss = true
  hidePanel()
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

function hidePanel(): void {
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
  isPanelVisible = false
}

function removePanel(): void {
  const existing = document.getElementById(PANEL_ID)
  if (existing) existing.remove()
  panelEl = null
  isPanelVisible = false
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
    #${PANEL_ID}-save:hover { opacity: 0.9 !important; }
    #${PANEL_ID} button:focus-visible { outline: 2px solid var(--ielts-primary); outline-offset: 2px; }
    #${PANEL_ID}-body::-webkit-scrollbar { width: 3px; }
    #${PANEL_ID}-body::-webkit-scrollbar-track { background: transparent; }
    #${PANEL_ID}-body::-webkit-scrollbar-thumb { background: var(--ielts-border); border-radius: 2px; }
  `
  document.head.appendChild(style)
}

export function destroyDictionaryPanel(): void {
  document.removeEventListener('mouseup', onMouseUp)
  document.removeEventListener('mousedown', onMouseDown)
  document.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', scheduleHide)
  removePanel()
  const style = document.getElementById(STYLES_ID)
  if (style) style.remove()
}

init()

export {}
