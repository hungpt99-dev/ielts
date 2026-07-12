import {
  explain,
  type AiExplainType,
  type AiExplainResult,
  type SimpleExplain,
  type TranslateExplain,
  type IeltsVocabResult,
  type GrammarExplain,
  type RewriteResult,
  type ExampleSentencesResult,
  type QuizResult,
  AI_EXPLAIN_LABELS,
} from '@ielts/ai'
import { injectContentStyles } from './sharedStyles'
import { safeSendMessage, safeFetchProviderConfig } from '../utils/safe-chrome'
import {
  emitExtensionSelectedTextExplained,
  emitExtensionSelectedTextSimplified,
} from '../background/eventEmitters'
import { iconToHtml } from '../utils/renderIcon'
import {
  IconWarning, IconAITutor, IconClose, IconExplain,
  IconGlobe, IconTarget, IconVocabularyBook, IconSimplify,
  IconEdit, IconHelpCircle, IconLock,
} from '@ielts/ui'

const PANEL_ID = 'ielts-ai-explain-panel'
const OVERLAY_ID = 'ielts-ai-explain-overlay'
const STYLES_ID = 'ielts-ai-explain-styles'

interface AiExplainEntry {
  type: AiExplainType
  data: AiExplainResult | null
  error: string | null
  loading: boolean
}

const getProviderConfig = safeFetchProviderConfig

let currentText = ''
let entries: Record<AiExplainType, AiExplainEntry> = {} as Record<AiExplainType, AiExplainEntry>
let activeTab: AiExplainType = 'simple'
let onClose: (() => void) | null = null
let panelEl: HTMLDivElement | null = null
let overlayEl: HTMLDivElement | null = null
let keyHandler: ((e: KeyboardEvent) => void) | null = null

const ALL_TYPES: AiExplainType[] = ['simple', 'translate', 'ielts-vocab', 'grammar', 'rewrite', 'example-sentences', 'quiz']

const TAB_ICONS: Record<AiExplainType, ReturnType<typeof iconToHtml>> = {
  simple: iconToHtml(IconExplain, 14),
  translate: iconToHtml(IconGlobe, 14),
  'ielts-vocab': iconToHtml(IconTarget, 14),
  grammar: iconToHtml(IconVocabularyBook, 14),
  rewrite: iconToHtml(IconSimplify, 14),
  'example-sentences': iconToHtml(IconEdit, 14),
  quiz: iconToHtml(IconHelpCircle, 14),
}

function createEntries(): Record<AiExplainType, AiExplainEntry> {
  const e = {} as Record<AiExplainType, AiExplainEntry>
  for (const t of ALL_TYPES) {
    e[t] = { type: t, data: null, error: null, loading: false }
  }
  return e
}

export function showExplainPanel(text: string, initialAction?: AiExplainType): void {
  const existing = document.getElementById(PANEL_ID)
  if (existing) existing.remove()
  const existingOverlay = document.getElementById(OVERLAY_ID)
  if (existingOverlay) existingOverlay.remove()

  currentText = text
  entries = createEntries()
  activeTab = initialAction || 'simple'

  const sourceUrl = window.location.href
  if (activeTab === 'simple') {
    emitExtensionSelectedTextExplained(text, sourceUrl)
  }
  if (activeTab === 'rewrite') {
    emitExtensionSelectedTextSimplified(text, sourceUrl)
  }

  injectContentStyles()
  injectStyles()
  overlayEl = createOverlay()
  panelEl = createPanel()
  document.body.appendChild(overlayEl)
  document.body.appendChild(panelEl)

  requestAnimationFrame(() => {
    if (panelEl) panelEl.style.opacity = '1'
    if (overlayEl) overlayEl.style.opacity = '1'
  })

  keyHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      closePanel()
    }
  }
  document.addEventListener('keydown', keyHandler)

  loadTab(activeTab)
}

function createOverlay(): HTMLDivElement {
  const el = document.createElement('div')
  el.id = OVERLAY_ID
  Object.assign(el.style, {
    position: 'fixed',
    inset: '0',
    background: 'var(--ielts-overlay)',
    zIndex: '2147483645',
    opacity: '0',
    transition: 'opacity 0.2s ease',
  })
  el.addEventListener('click', closePanel)
  return el
}

function createPanel(): HTMLDivElement {
  const el = document.createElement('div')
  el.id = PANEL_ID

  const panelStyles: Partial<CSSStyleDeclaration> = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 'min(600px, calc(100vw - 32px))',
    maxHeight: 'min(600px, calc(100vh - 32px))',
    background: 'var(--ielts-surface)',
    borderRadius: '14px',
    boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
    border: '1px solid var(--ielts-border)',
    zIndex: '2147483646',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color: 'var(--ielts-text)',
    opacity: '0',
    transition: 'opacity 0.2s ease',
    overflow: 'hidden',
  }
  Object.assign(el.style, panelStyles)

  el.setAttribute('role', 'dialog')
  el.setAttribute('aria-modal', 'true')
  el.setAttribute('aria-label', 'AI Explain Panel')

  el.innerHTML = `
    <div id="${PANEL_ID}-header" style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid var(--ielts-border);flex-shrink:0;">
      <div style="display:flex;align-items:center;gap:8px;font-size:15px;font-weight:600;color:var(--ielts-text);">
        ${iconToHtml(IconAITutor, 18)}
        <span>AI Explain</span>
      </div>
      <button id="${PANEL_ID}-close" style="background:none;border:none;color:var(--ielts-muted);font-size:18px;cursor:pointer;padding:4px 8px;border-radius:6px;line-height:1;" aria-label="Close panel">${iconToHtml(IconClose, 14)}</button>
    </div>
    <div id="${PANEL_ID}-text" style="padding:12px 18px;border-bottom:1px solid var(--ielts-border);font-size:13px;color:var(--ielts-text-secondary);max-height:80px;overflow-y:auto;flex-shrink:0;word-break:break-word;line-height:1.5;"></div>
    <div id="${PANEL_ID}-tabs" role="tablist" aria-label="AI explain options" style="display:flex;gap:4px;padding:10px 18px;border-bottom:1px solid var(--ielts-border);overflow-x:auto;flex-shrink:0;scrollbar-width:thin;"></div>
    <div id="${PANEL_ID}-body" role="tabpanel" style="flex:1;overflow-y:auto;padding:16px 18px;min-height:120px;scrollbar-width:thin;color:var(--ielts-text);"></div>
  `

  const textEl = el.querySelector(`#${PANEL_ID}-text`) as HTMLDivElement
  if (textEl) textEl.textContent = `"${currentText}"`

  const tabsEl = el.querySelector(`#${PANEL_ID}-tabs`) as HTMLDivElement
  if (tabsEl) {
    for (const t of ALL_TYPES) {
      const tab = document.createElement('button')
      tab.dataset.type = t
      tab.innerHTML = `${TAB_ICONS[t]} ${AI_EXPLAIN_LABELS[t]}`
      tab.setAttribute('role', 'tab')
      tab.setAttribute('aria-selected', String(t === activeTab))
      tab.setAttribute('aria-controls', `${PANEL_ID}-body`)
      Object.assign(tab.style, {
        padding: '6px 10px',
        borderRadius: '8px',
        border: 'none',
        fontSize: '12px',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        fontWeight: '500',
        transition: 'all 0.15s',
        background: t === activeTab ? 'var(--ielts-primary-light)' : 'transparent',
        color: t === activeTab ? 'var(--ielts-primary)' : 'var(--ielts-muted)',
        flexShrink: '0',
      })
      tab.addEventListener('mouseenter', () => {
        if (t !== activeTab) tab.style.background = 'var(--ielts-surface-alt)'
      })
      tab.addEventListener('mouseleave', () => {
        if (t !== activeTab) tab.style.background = 'transparent'
      })
      tab.addEventListener('click', () => switchTab(t))
      tabsEl.appendChild(tab)
    }
  }

  const closeBtn = el.querySelector(`#${PANEL_ID}-close`) as HTMLButtonElement
  if (closeBtn) closeBtn.addEventListener('click', closePanel)

  return el
}

function closePanel(): void {
  if (keyHandler) {
    document.removeEventListener('keydown', keyHandler)
    keyHandler = null
  }

  const pEl = panelEl
  const oEl = overlayEl
  panelEl = null
  overlayEl = null

  if (pEl) {
    pEl.style.opacity = '0'
    setTimeout(() => pEl.remove(), 200)
  }
  if (oEl) {
    oEl.style.opacity = '0'
    setTimeout(() => oEl.remove(), 200)
  }

  if (onClose) onClose()
}

function switchTab(type: AiExplainType): void {
  activeTab = type
  const tabsEl = panelEl?.querySelector(`#${PANEL_ID}-tabs`)
  if (tabsEl) {
    const buttons = tabsEl.querySelectorAll('button')
    buttons.forEach((btn) => {
      const t = btn.dataset.type as AiExplainType
      const isActive = t === type
      btn.setAttribute('aria-selected', String(isActive))
      btn.style.background = isActive ? 'var(--ielts-primary-light)' : 'transparent'
      btn.style.color = isActive ? 'var(--ielts-primary)' : 'var(--ielts-muted)'
    })
  }
  const bodyEl = panelEl?.querySelector(`#${PANEL_ID}-body`) as HTMLDivElement
  if (!bodyEl) return
  bodyEl.scrollTop = 0
  loadTab(type)
}

async function loadTab(type: AiExplainType): Promise<void> {
  const bodyEl = panelEl?.querySelector(`#${PANEL_ID}-body`) as HTMLDivElement
  if (!bodyEl) return

  const entry = entries[type]

  if (entry.loading) {
    renderLoading(bodyEl)
    return
  }
  if (entry.data) {
    renderResult(bodyEl, type, entry.data)
    return
  }
  if (entry.error) {
    renderError(bodyEl, entry.error)
    return
  }

  entry.loading = true
  renderLoading(bodyEl)

  const config = await getProviderConfig()

  if (!config.apiKey) {
    entry.loading = false
    entry.error = 'API key not configured. Please add your AI API key in the extension Settings.'
    renderMissingKey(bodyEl)
    return
  }

  const nativeLanguage = await new Promise<string>((resolve) => {
    chrome.storage.local.get('extensionSettings', (result) => {
      const s = result.extensionSettings as { nativeLanguage?: string } | undefined
      resolve(s?.nativeLanguage || '')
    })
  })

  const result = await explain(type, currentText, () => config, nativeLanguage || undefined)

  entry.loading = false
  if (result.error) {
    entry.error = result.error
    if (result.error.includes('API key')) {
      renderMissingKey(bodyEl)
    } else {
      renderError(bodyEl, result.error)
    }
  } else if (result.data) {
    entry.data = result.data
    renderResult(bodyEl, type, result.data)
  }
}

function renderLoading(bodyEl: HTMLDivElement): void {
  bodyEl.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 0;gap:12px;">
      <div class="${PANEL_ID}-spinner" style="width:28px;height:28px;border:3px solid var(--ielts-border);border-top-color:var(--ielts-primary);border-radius:50%;animation:${PANEL_ID}-spin 0.7s linear infinite;"></div>
      <div style="color:var(--ielts-muted);font-size:13px;" role="status">Analyzing text...</div>
    </div>
  `
}

function renderMissingKey(bodyEl: HTMLDivElement): void {
  bodyEl.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 16px;gap:12px;text-align:center;">
      <div style="font-size:32px;" role="img" aria-label="Key icon">${iconToHtml(IconLock, 32)}</div>
      <div style="color:var(--ielts-text);font-size:14px;font-weight:600;">AI API Key Required</div>
      <div style="color:var(--ielts-text-secondary);font-size:13px;line-height:1.5;max-width:360px;">
        Add your AI API key in the extension Settings to use AI features like explanations, translations, and vocabulary analysis.
      </div>
      <div style="display:flex;gap:8px;margin-top:4px;">
        <button id="${PANEL_ID}-open-settings" style="padding:8px 16px;border-radius:8px;border:none;background:var(--ielts-primary);color:var(--ielts-on-primary, #fff);font-size:13px;cursor:pointer;font-weight:500;">Open Settings</button>
        <button id="${PANEL_ID}-dismiss" style="padding:8px 16px;border-radius:8px;border:none;background:var(--ielts-surface-alt);color:var(--ielts-muted);font-size:13px;cursor:pointer;">Close</button>
      </div>
    </div>
  `

  const settingsBtn = bodyEl.querySelector(`#${PANEL_ID}-open-settings`)
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      closePanel()
      safeSendMessage({ type: 'OPEN_OPTIONS' })
    })
  }

  const dismissBtn = bodyEl.querySelector(`#${PANEL_ID}-dismiss`)
  if (dismissBtn) {
    dismissBtn.addEventListener('click', closePanel)
  }
}

function renderError(bodyEl: HTMLDivElement, error: string): void {
  bodyEl.innerHTML = `
    <div role="alert" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 16px;gap:12px;text-align:center;">
      <div role="img" aria-label="Warning">${iconToHtml(IconWarning, 28)}</div>
      <div style="color:var(--ielts-danger);font-size:13px;line-height:1.5;max-width:380px;word-break:break-word;">${escapeHtml(error)}</div>
      <button id="${PANEL_ID}-retry" style="padding:8px 16px;border-radius:8px;border:none;background:var(--ielts-surface-alt);color:var(--ielts-muted);font-size:13px;cursor:pointer;">Try Again</button>
    </div>
  `

  const retryBtn = bodyEl.querySelector(`#${PANEL_ID}-retry`)
  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      entries[activeTab].error = null
      loadTab(activeTab)
    })
  }
}

function renderResult(bodyEl: HTMLDivElement, type: AiExplainType, data: AiExplainResult): void {
  switch (type) {
    case 'simple':
      bodyEl.innerHTML = renderSimpleResult(data as SimpleExplain)
      break
    case 'translate':
      bodyEl.innerHTML = renderTranslateResult(data as TranslateExplain)
      break
    case 'ielts-vocab':
      bodyEl.innerHTML = renderIELTSVocabResult(data as IeltsVocabResult)
      break
    case 'grammar':
      bodyEl.innerHTML = renderGrammarResult(data as GrammarExplain)
      break
    case 'rewrite':
      bodyEl.innerHTML = renderRewriteResult(data as RewriteResult)
      break
    case 'example-sentences':
      bodyEl.innerHTML = renderExampleSentencesResult(data as ExampleSentencesResult)
      break
    case 'quiz':
      bodyEl.innerHTML = renderQuizResult(data as QuizResult)
      break
  }
}

function renderSection(title: string, content: string): string {
  return `
    <div style="margin-bottom:14px;">
      <div style="font-size:12px;font-weight:600;color:var(--ielts-muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">${title}</div>
      <div style="font-size:13px;color:var(--ielts-text);line-height:1.6;white-space:pre-wrap;word-break:break-word;">${content}</div>
    </div>
  `
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function renderSimpleResult(data: SimpleExplain): string {
  return sectionWrapper(renderSection('Explanation', escapeHtml(data.explanation)))
}

function renderTranslateResult(data: TranslateExplain): string {
  let html = renderSection('Translation', escapeHtml(data.translation))
  if (data.vocabularyNotes && data.vocabularyNotes.length > 0) {
    html += renderListSection('Vocabulary Notes', data.vocabularyNotes.map(v => `<strong>${escapeHtml(v.word)}</strong>: ${escapeHtml(v.meaning)}`))
  }
  return sectionWrapper(html)
}

function renderVerbConjugation(vc: { base: string; pastSimple: string; pastParticiple: string; presentParticiple: string; thirdPersonSingular: string }): string {
  const forms = [
    { label: 'V1', value: vc.base },
    { label: 'V2', value: vc.pastSimple },
    { label: 'V3', value: vc.pastParticiple },
    { label: '-ing', value: vc.presentParticiple },
    { label: '-s', value: vc.thirdPersonSingular },
  ].filter(f => f.value)
  if (forms.length === 0) return ''
  return `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;">${forms.map(f => `<span style="display:inline-flex;align-items:center;gap:3px;padding:2px 6px;border-radius:4px;background:var(--ielts-success);font-size:10px;color:var(--ielts-on-primary, #fff);"><span style="opacity:0.7">${f.label}</span> ${escapeHtml(f.value)}</span>`).join('')}</div>`
}

function renderVerbAnalysis(va: { verb: string; tense: string; aspect: string; voice: string; mood: string; explanation: string }): string {
  const fields = [
    { label: 'Tense', value: va.tense },
    { label: 'Aspect', value: va.aspect },
    { label: 'Voice', value: va.voice },
    { label: 'Mood', value: va.mood },
  ].filter(f => f.value)
  if (fields.length === 0) return ''
  return `<div style="margin-top:6px;padding-top:6px;border-top:1px solid var(--ielts-border);font-size:11px;">
    <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:4px;">${fields.map(f => `<span style="padding:1px 5px;border-radius:3px;background:var(--ielts-surface);color:var(--ielts-text-secondary);">${escapeHtml(f.label)}: <strong style="color:var(--ielts-text)">${escapeHtml(f.value)}</strong></span>`).join('')}</div>
    ${va.explanation ? `<div style="color:var(--ielts-muted);font-size:10px;line-height:1.4;">${escapeHtml(va.explanation)}</div>` : ''}
  </div>`
}

function renderIELTSVocabResult(data: IeltsVocabResult): string {
  let html = ''
  for (const w of data.words) {
    const verbConjugationHtml = w.verbConjugation ? renderVerbConjugation(w.verbConjugation) : ''
    const verbAnalysisHtml = w.verbAnalysis && w.verbAnalysis.verb ? renderVerbAnalysis(w.verbAnalysis) : ''
    html += `
      <div style="background:var(--ielts-surface-alt);border-radius:10px;padding:12px;margin-bottom:10px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
          <strong style="color:var(--ielts-primary);font-size:14px;">${escapeHtml(w.word)}</strong>
          ${w.partOfSpeech ? `<span style="color:var(--ielts-muted);font-size:11px;background:var(--ielts-surface-alt);padding:2px 6px;border-radius:4px;">${escapeHtml(w.partOfSpeech)}</span>` : ''}
        </div>
        <div style="color:var(--ielts-text);font-size:13px;margin-bottom:6px;">${escapeHtml(w.meaning)}</div>
        <div style="color:var(--ielts-text-secondary);font-size:12px;font-style:italic;">"${escapeHtml(w.example)}"</div>
        ${verbConjugationHtml}
        ${verbAnalysisHtml}
        ${w.synonyms.length > 0 ? `<div style="margin-top:6px;font-size:12px;color:var(--ielts-muted);">Synonyms: ${w.synonyms.map(s => `<span style="color:var(--ielts-primary);">${escapeHtml(s)}</span>`).join(', ')}</div>` : ''}
        ${w.collocations.length > 0 ? `<div style="font-size:12px;color:var(--ielts-muted);margin-top:2px;">Collocations: ${w.collocations.map(c => `<span style="color:var(--ielts-success);">${escapeHtml(c)}</span>`).join(', ')}</div>` : ''}
      </div>
    `
  }
  return sectionWrapper(html)
}

function renderGrammarVerbs(verbs: Array<{ verb: string; tense: string; aspect: string; voice: string; mood: string; explanation: string }>): string {
  if (verbs.length === 0) return ''
  let html = '<div style="margin-bottom:14px;"><div style="font-size:12px;font-weight:600;color:var(--ielts-muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">Verbs in this text</div>'
  for (const v of verbs) {
    const fields = [
      { label: 'Tense', value: v.tense },
      { label: 'Aspect', value: v.aspect },
      { label: 'Voice', value: v.voice },
      { label: 'Mood', value: v.mood },
    ].filter(f => f.value)
    html += `<div style="background:var(--ielts-surface);border-radius:8px;padding:8px 10px;margin-bottom:6px;">
      <div style="font-size:13px;font-weight:600;color:var(--ielts-primary);margin-bottom:4px;">${escapeHtml(v.verb)}${v.verb !== v.verb ? '' : ''}</div>
      ${fields.length > 0 ? `<div style="display:flex;flex-wrap:wrap;gap:3px;margin-bottom:4px;">${fields.map(f => `<span style="padding:1px 5px;border-radius:3px;background:var(--ielts-surface-alt);font-size:10px;color:var(--ielts-text-secondary);">${escapeHtml(f.label)}: <strong style="color:var(--ielts-text)">${escapeHtml(f.value)}</strong></span>`).join('')}</div>` : ''}
      ${v.explanation ? `<div style="font-size:11px;color:var(--ielts-text-secondary);line-height:1.4;">${escapeHtml(v.explanation)}</div>` : ''}
    </div>`
  }
  html += '</div>'
  return html
}

function renderGrammarResult(data: GrammarExplain): string {
  let html = renderSection('Explanation', escapeHtml(data.explanation))
  if (data.structure) {
    html += renderSection('Structure', escapeHtml(data.structure))
  }
  if (data.rules.length > 0) {
    html += renderListSection('Rules', data.rules.map(r => escapeHtml(r)))
  }
  if (data.commonMistakes.length > 0) {
    html += renderListSection('Common Mistakes', data.commonMistakes.map(m => escapeHtml(m)))
  }
  if (data.verbs && data.verbs.length > 0) {
    html += renderGrammarVerbs(data.verbs)
  }
  return sectionWrapper(html)
}

function renderRewriteResult(data: RewriteResult): string {
  let html = renderSection('Rewritten Version', escapeHtml(data.rewritten))
  if (data.changes) {
    html += renderSection('What Changed', escapeHtml(data.changes))
  }
  if (data.tone) {
    html += renderSection('Tone', escapeHtml(data.tone))
  }
  html += `
    <div style="margin-top:12px;">
      <button data-copy="${PANEL_ID}-copy-rewrite" style="padding:6px 14px;border-radius:6px;border:none;background:var(--ielts-surface-alt);color:var(--ielts-text-secondary);font-size:12px;cursor:pointer;">Copy to Clipboard</button>
    </div>
  `
  return sectionWrapper(html, () => {
    setTimeout(() => {
      const copyBtn = document.querySelector(`[data-copy="${PANEL_ID}-copy-rewrite"]`)
      if (copyBtn) {
        copyBtn.addEventListener('click', () => {
          navigator.clipboard.writeText(data.rewritten).then(() => {
            copyBtn.textContent = '✓ Copied!'
            setTimeout(() => { copyBtn.textContent = 'Copy to Clipboard' }, 2000)
          })
        })
      }
    }, 0)
  })
}

function renderExampleSentencesResult(data: ExampleSentencesResult): string {
  let html = ''
  for (let i = 0; i < data.sentences.length; i++) {
    html += `
      <div style="background:var(--ielts-surface-alt);border-radius:8px;padding:10px 14px;margin-bottom:8px;border-left:3px solid var(--ielts-primary);">
        <div style="color:var(--ielts-text);font-size:13px;line-height:1.6;">${i + 1}. ${escapeHtml(data.sentences[i])}</div>
      </div>
    `
  }
  if (data.explanation) {
    html += renderSection('Notes', escapeHtml(data.explanation))
  }
  return sectionWrapper(html)
}

function renderQuizResult(data: QuizResult): string {
  let html = ''
  for (let i = 0; i < data.questions.length; i++) {
    const q = data.questions[i]
    const letters = ['A', 'B', 'C', 'D', 'E', 'F']
    html += `
      <div style="background:var(--ielts-surface-alt);border-radius:10px;padding:14px;margin-bottom:12px;">
        <div style="font-size:13px;font-weight:600;color:var(--ielts-text);margin-bottom:8px;">Question ${i + 1}</div>
        <div style="font-size:13px;color:var(--ielts-text);margin-bottom:10px;line-height:1.5;">${escapeHtml(q.question)}</div>
        <div style="display:flex;flex-direction:column;gap:4px;">
          ${q.options.map((opt, oi) => `
            <div style="padding:6px 10px;border-radius:6px;font-size:13px;background:var(--ielts-surface);color:${oi === q.correctAnswer ? 'var(--ielts-success)' : 'var(--ielts-text-secondary)'};border-left:${oi === q.correctAnswer ? '3px solid var(--ielts-success)' : '3px solid transparent'};">
              ${letters[oi]}. ${escapeHtml(opt)}
            </div>
          `).join('')}
        </div>
        <div style="margin-top:8px;padding:8px 10px;background:var(--ielts-success);border-radius:6px;font-size:12px;color:var(--ielts-on-primary, #fff);line-height:1.5;">
          ${iconToHtml(IconAITutor, 16)} ${escapeHtml(q.explanation)}
        </div>
      </div>
    `
  }
  return sectionWrapper(html)
}

function renderListSection(title: string, items: string[]): string {
  return `
    <div style="margin-bottom:14px;">
      <div style="font-size:12px;font-weight:600;color:var(--ielts-muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">${title}</div>
      <ul style="margin:0;padding-left:18px;">
        ${items.map(i => `<li style="font-size:13px;color:var(--ielts-text);line-height:1.6;margin-bottom:4px;">${i}</li>`).join('')}
      </ul>
    </div>
  `
}

function sectionWrapper(content: string, afterRender?: () => void): string {
  const id = `${PANEL_ID}-section-${Date.now()}`
  const html = `<div id="${id}">${content}</div>`
  if (afterRender) {
    setTimeout(afterRender, 0)
  }
  return html
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
    #${PANEL_ID}-header button:hover { background: var(--ielts-surface-alt) !important; }
    #${PANEL_ID} button:focus-visible { outline: 2px solid var(--ielts-primary); outline-offset: 2px; }
    #${PANEL_ID}-text::-webkit-scrollbar,
    #${PANEL_ID}-body::-webkit-scrollbar,
    #${PANEL_ID}-tabs::-webkit-scrollbar { width: 4px; height: 4px; }
    #${PANEL_ID}-text::-webkit-scrollbar-track,
    #${PANEL_ID}-body::-webkit-scrollbar-track,
    #${PANEL_ID}-tabs::-webkit-scrollbar-track { background: transparent; }
    #${PANEL_ID}-text::-webkit-scrollbar-thumb,
    #${PANEL_ID}-body::-webkit-scrollbar-thumb,
    #${PANEL_ID}-tabs::-webkit-scrollbar-thumb { background: var(--ielts-border); border-radius: 2px; }
  `
  document.head.appendChild(style)
}

export function destroyExplainPanel(): void {
  closePanel()
  const style = document.getElementById(STYLES_ID)
  if (style) style.remove()
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'AI_EXPLAIN') {
    const text = message.payload?.text || ''
    const action = message.payload?.action as AiExplainType | undefined
    if (text) {
      showExplainPanel(text, action)
    }
    try { sendResponse({ success: true }) } catch { /* ignore */ }
    return false
  }
})
