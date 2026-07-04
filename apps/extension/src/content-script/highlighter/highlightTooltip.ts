import type { HighlightWord } from './highlightMatcher'

const TOOLTIP_ID = 'ielts-journey-tooltip'
const FADE_DURATION = 150

let hideTimer: ReturnType<typeof setTimeout> | null = null

function escapeHtml(str: string): string {
  return str.replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function buildTooltipContent(word: HighlightWord): string {
  const title = escapeHtml(word.text)
  const meaning = escapeHtml(word.meaning)
  const example = escapeHtml(word.exampleSentence)
  const note = escapeHtml(word.personalNote)
  const reviewUrl = `https://ielts-journey.app/review/${encodeURIComponent(word.text)}`

  let html = `
    <div style="font-weight:600;font-size:14px;margin-bottom:${meaning ? '6px' : '0'};color:#fbbf24;">
      ${title}
    </div>`

  if (meaning) {
    html += `<div style="margin-bottom:6px;color:#e2e8f0;">${meaning}</div>`
  }

  if (example) {
    html += `<div style="margin-bottom:6px;font-style:italic;color:#94a3b8;font-size:12px;border-left:2px solid #334155;padding-left:8px;">${example}</div>`
  }

  if (note) {
    html += `<div style="margin-bottom:6px;font-size:12px;color:#94a3b8;">${note}</div>`
  }

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
    borderRadius: '10px',
    padding: '12px 16px',
    fontSize: '13px',
    lineHeight: '1.5',
    maxWidth: '320px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
    border: '1px solid #334155',
    opacity: '0',
    transform: 'translateY(4px)',
    transition: 'opacity 0.15s ease, transform 0.15s ease',
    pointerEvents: 'auto',
  })

  return el
}

function positionTooltip(x: number, y: number, el: HTMLDivElement): void {
  const tooltipWidth = el.offsetWidth || 280
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
