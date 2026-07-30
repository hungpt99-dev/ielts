import type { HighlightWord } from './highlightMatcher'

const TOOLTIP_ID = 'ielts-journey-tooltip'
const FADE_DURATION = 150

let hideTimer: ReturnType<typeof setTimeout> | null = null

function escapeHtml(str: string): string {
  return str.replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function buildTooltipContent(word: HighlightWord): string {
  const reviewUrl = chrome.runtime.getURL('app/index.html#/review')
  const hasWordFamily = word.wordFamily && word.wordFamily.length > 0
  const hasCollocations = word.collocations && word.collocations.length > 0

  let html = ''

  if (word.pronunciation) {
    html += `<div style="font-weight:700;font-size:16px;margin-bottom:2px;color:#fbbf24;">${escapeHtml(word.text)} <span style="font-weight:400;font-size:13px;color:#94a3b8;">${escapeHtml(word.pronunciation)}</span></div>`
  } else {
    html += `<div style="font-weight:700;font-size:16px;margin-bottom:2px;color:#fbbf24;">${escapeHtml(word.text)}</div>`
  }

  if (word.partOfSpeech) {
    html += `<div style="margin-bottom:4px;font-size:12px;color:#94a3b8;font-style:italic;">${escapeHtml(word.partOfSpeech)}</div>`
  }

  if (word.meaning) {
    html += `<div style="margin-bottom:4px;color:#e2e8f0;font-size:13px;line-height:1.5;">${escapeHtml(word.meaning)}</div>`
  }

  if (word.translation) {
    html += `<div style="margin-bottom:4px;color:#64748b;font-size:12px;">${escapeHtml(word.translation)}</div>`
  }

  if (word.exampleSentence) {
    html += `<div style="margin-bottom:6px;font-style:italic;color:#94a3b8;font-size:12px;line-height:1.5;border-left:2px solid #475569;padding-left:10px;">"${escapeHtml(word.exampleSentence)}"</div>`
  }

  if (hasWordFamily) {
    html += `<div style="margin-bottom:6px;">`
    html += `<div style="font-size:11px;font-weight:600;color:#64748b;margin-bottom:3px;">Word Forms</div>`
    html += `<div style="display:flex;flex-wrap:wrap;gap:4px;">`
    for (const wf of word.wordFamily) {
      const pos = wf.partOfSpeech ? ` <span style="color:#94a3b8;">${escapeHtml(wf.partOfSpeech)}</span>` : ''
      html += `<span style="font-size:11px;background:#334155;color:#e2e8f0;padding:2px 8px;border-radius:6px;">${escapeHtml(wf.word)}${pos}</span>`
    }
    html += `</div></div>`
  }

  if (hasCollocations) {
    html += `<div style="margin-bottom:6px;">`
    html += `<div style="font-size:11px;font-weight:600;color:#64748b;margin-bottom:3px;">Collocations</div>`
    html += `<div style="display:flex;flex-wrap:wrap;gap:4px;">`
    for (const c of word.collocations) {
      html += `<span style="font-size:11px;background:#1e293b;color:#94a3b8;border:1px solid #334155;padding:2px 8px;border-radius:6px;">${escapeHtml(c)}</span>`
    }
    html += `</div></div>`
  }

  if (word.personalNote) {
    html += `<div style="margin-bottom:6px;font-size:12px;color:#94a3b8;">${escapeHtml(word.personalNote)}</div>`
  }

  html += `<div style="display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:8px;padding-top:8px;border-top:1px solid #334155;">`
  if (word.cefrLevel) {
    html += `<span style="font-size:10px;font-weight:600;background:#334155;color:#e2e8f0;padding:1px 6px;border-radius:4px;">${escapeHtml(word.cefrLevel)}</span>`
  }
  if (word.difficulty) {
    html += `<span style="font-size:10px;font-weight:600;background:#1e3a5f;color:#60a5fa;padding:1px 6px;border-radius:4px;">${escapeHtml(word.difficulty)}</span>`
  }
  if (word.topic) {
    html += `<span style="font-size:10px;font-weight:500;color:#64748b;">${escapeHtml(word.topic)}</span>`
  }
  html += `</div>`

  html += `<div style="margin-top:8px;padding-top:8px;border-top:1px solid #334155;">
    <a href="${reviewUrl}" target="_blank" rel="noopener noreferrer" style="color:#60a5fa;font-size:12px;text-decoration:none;font-weight:500;">
      Review in IELTS Journey →
    </a>
  </div>`

  return html
}

function createTooltip(): HTMLDivElement {
  const el = document.createElement('div')
  el.id = TOOLTIP_ID
  el.setAttribute('role', 'tooltip')

  Object.assign(el.style, {
    position: 'fixed',
    zIndex: '2147483647',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    background: '#1e293b',
    color: '#f1f5f9',
    borderRadius: '12px',
    padding: '14px 18px',
    fontSize: '13px',
    lineHeight: '1.5',
    maxWidth: '360px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    border: '1px solid #334155',
    opacity: '0',
    transform: 'translateY(4px)',
    transition: 'opacity 0.15s ease, transform 0.15s ease',
    pointerEvents: 'auto',
  })

  return el
}

function positionTooltip(x: number, y: number, el: HTMLDivElement): void {
  const tooltipWidth = el.offsetWidth || 360
  const tooltipHeight = el.offsetHeight || 100
  const padding = 12

  let left = x - tooltipWidth / 2
  let top = y - tooltipHeight - padding

  if (top < 8) top = y + padding
  if (left < 8) left = 8

  const maxLeft = window.innerWidth - tooltipWidth - 8
  if (left > maxLeft) left = maxLeft

  el.style.left = `${left}px`
  el.style.top = `${top}px`
}

function getTooltipElement(): HTMLDivElement | null {
  return document.getElementById(TOOLTIP_ID) as HTMLDivElement | null
}

function onOutsideClick(e: MouseEvent): void {
  const el = getTooltipElement()
  if (el && !el.contains(e.target as Node)) {
    hideTooltip()
  }
}

function onEscape(e: KeyboardEvent): void {
  if (e.key === 'Escape') {
    hideTooltip()
  }
}

function attachGlobalListeners(): void {
  document.addEventListener('mousedown', onOutsideClick)
  document.addEventListener('keydown', onEscape)
}

function detachGlobalListeners(): void {
  document.removeEventListener('mousedown', onOutsideClick)
  document.removeEventListener('keydown', onEscape)
}

export function showTooltip(word: HighlightWord, x: number, y: number, sticky = false): void {
  cancelHideTooltip()

  let el = getTooltipElement()
  if (!el) {
    el = createTooltip()
    document.body.appendChild(el)
  }

  el.innerHTML = buildTooltipContent(word)

  el.onmouseenter = cancelHideTooltip
  el.onmouseleave = () => scheduleHideTooltip(200)

  requestAnimationFrame(() => {
    positionTooltip(x, y, el)
    el.style.opacity = '1'
    el.style.transform = 'translateY(0)'
  })

  if (sticky) {
    attachGlobalListeners()
  }
}

export function scheduleHideTooltip(delay: number): void {
  if (hideTimer) clearTimeout(hideTimer)
  hideTimer = setTimeout(() => {
    hideTooltip()
  }, delay)
}

export function cancelHideTooltip(): void {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
}

export function hideTooltip(): void {
  const el = getTooltipElement()
  if (el) {
    el.style.opacity = '0'
    el.style.transform = 'translateY(4px)'
    setTimeout(() => {
      el.remove()
    }, FADE_DURATION)
  }

  detachGlobalListeners()
}

export function destroyTooltip(): void {
  cancelHideTooltip()
  const el = getTooltipElement()
  if (el) {
    el.remove()
  }
  detachGlobalListeners()
}
