import type { HighlightWord } from './highlightMatcher'

const TOOLTIP_ID = 'ielts-journey-tooltip'

let hideTimer: ReturnType<typeof setTimeout> | null = null

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

  if (top < 8) {
    top = y + padding
  }

  if (left < 8) {
    left = 8
  }

  const maxLeft = window.innerWidth - tooltipWidth - 8
  if (left > maxLeft) {
    left = maxLeft
  }

  el.style.left = `${left}px`
  el.style.top = `${top}px`
}

export function showTooltip(
  word: HighlightWord,
  x: number,
  y: number,
  sticky = false,
): void {
  cancelHideTooltip()

  let el = document.getElementById(TOOLTIP_ID) as HTMLDivElement | null

  if (!el) {
    el = createTooltip()
    document.body.appendChild(el)
  }

  const escapedText = word.text.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const escapedMeaning = word.meaning
    ? word.meaning.replace(/</g, '&lt;').replace(/>/g, '&gt;')
    : ''
  const escapedExample = word.exampleSentence
    ? word.exampleSentence.replace(/</g, '&lt;').replace(/>/g, '&gt;')
    : ''
  const escapedNote = word.personalNote
    ? word.personalNote.replace(/</g, '&lt;').replace(/>/g, '&gt;')
    : ''

  let html = `
    <div style="font-weight:600;font-size:14px;margin-bottom:${word.meaning ? '6px' : '0'};color:#fbbf24;">
      ${escapedText}
    </div>
  `

  if (escapedMeaning) {
    html += `<div style="margin-bottom:6px;color:#e2e8f0;">${escapedMeaning}</div>`
  }

  if (escapedExample) {
    html += `<div style="margin-bottom:6px;font-style:italic;color:#94a3b8;font-size:12px;border-left:2px solid #334155;padding-left:8px;">${escapedExample}</div>`
  }

  if (escapedNote) {
    html += `<div style="margin-bottom:6px;font-size:12px;color:#94a3b8;">${escapedNote}</div>`
  }

  el.innerHTML = html + `<div style="margin-top:8px;padding-top:8px;border-top:1px solid #334155;">
    <a href="https://ielts-journey.app/review/${encodeURIComponent(word.text)}" target="_blank" rel="noopener noreferrer" style="color:#60a5fa;font-size:12px;text-decoration:none;font-weight:500;">
      Review in IELTS Journey →
    </a>
  </div>`

  el.onmouseenter = cancelHideTooltip
  el.onmouseleave = () => scheduleHideTooltip(200)

  document.body.appendChild(el)

  requestAnimationFrame(() => {
    positionTooltip(x, y, el)
    el.style.opacity = '1'
    el.style.transform = 'translateY(0)'
  })

  if (sticky) {
    document.addEventListener('mousedown', onOutsideClick)
    document.addEventListener('keydown', onEscape)
  }
}

function onOutsideClick(e: MouseEvent): void {
  const el = document.getElementById(TOOLTIP_ID)
  if (el && !el.contains(e.target as Node)) {
    hideTooltip()
  }
}

function onEscape(e: KeyboardEvent): void {
  if (e.key === 'Escape') {
    hideTooltip()
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
  const el = document.getElementById(TOOLTIP_ID)
  if (el) {
    el.style.opacity = '0'
    el.style.transform = 'translateY(4px)'
    hideTimer = setTimeout(() => {
      el.remove()
    }, 150)
  }

  document.removeEventListener('mousedown', onOutsideClick)
  document.removeEventListener('keydown', onEscape)
}

export function destroyTooltip(): void {
  hideTooltip()
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
}
