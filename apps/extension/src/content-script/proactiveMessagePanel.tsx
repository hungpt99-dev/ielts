import { injectContentStyles } from './sharedStyles'
import { iconToHtml } from '../utils/renderIcon'
import {
  IconVocabularyBook,
  IconWarning,
  IconTodayPlan,
  IconSpeaking,
  IconWriting,
  IconReading,
  IconListening,
  IconTarget,
  IconThumbsUp,
  IconSaved,
  IconExplain,
  IconProgress,
  IconHelpCircle,
  IconClock,
} from '@ielts/ui'

const PANEL_ID = 'ielts-proactive-panel'
const STYLES_ID = 'ielts-proactive-styles'

interface ProactiveMessageData {
  id: string
  title: string
  message: string
  category?: string
  priority?: 'high' | 'medium' | 'low'
  action?: {
    type: string
    label: string
    payload?: Record<string, unknown>
  }
}

type DismissHandler = (id: string) => void
type ActionHandler = (data: ProactiveMessageData) => void

let panelEl: HTMLDivElement | null = null
let onDismiss: DismissHandler | null = null
let onAction: ActionHandler | null = null

const categoryIcons: Record<string, string> = {
  'vocabulary-review': iconToHtml(IconVocabularyBook, 18),
  'mistake-review': iconToHtml(IconWarning, 18),
  'study-plan': iconToHtml(IconTodayPlan, 18),
  'speaking-practice': iconToHtml(IconSpeaking, 18),
  'writing-practice': iconToHtml(IconWriting, 18),
  'reading-practice': iconToHtml(IconReading, 18),
  'listening-practice': iconToHtml(IconListening, 18),
  'exam-countdown': iconToHtml(IconTarget, 18),
  motivation: iconToHtml(IconThumbsUp, 18),
  'saved-content': iconToHtml(IconSaved, 18),
  'daily-tip': iconToHtml(IconExplain, 18),
  'progress-report': iconToHtml(IconProgress, 18),
  suggestion: iconToHtml(IconHelpCircle, 18),
}

function getCategoryIcon(category?: string): string {
  return (category && categoryIcons[category]) || iconToHtml(IconSpeaking, 18)
}

function createPanel(data: ProactiveMessageData): HTMLDivElement {
  const existing = document.getElementById(PANEL_ID)
  if (existing) existing.remove()

  const el = document.createElement('div')
  el.id = PANEL_ID
  el.setAttribute('role', 'alert')
  el.setAttribute('aria-live', 'polite')

  Object.assign(el.style, {
    position: 'fixed',
    bottom: '80px',
    right: '20px',
    width: '340px',
    maxWidth: 'calc(100vw - 32px)',
    background: 'var(--ielts-surface, #f8fafc)',
    borderRadius: '12px',
    boxShadow: '0 8px 28px rgba(0,0,0,0.35), 0 2px 6px rgba(0,0,0,0.2)',
    border: `1px solid ${
      data.priority === 'high' ? 'var(--ielts-warning, #d97706)' : 'var(--ielts-border, #e2e8f0)'
    }`,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color: 'var(--ielts-text, #0f172a)',
    zIndex: '2147483646',
    padding: '14px 16px',
    opacity: '0',
    transform: 'translateY(8px)',
    transition: 'opacity 0.2s ease, transform 0.2s ease',
    cursor: 'default',
  })

  el.innerHTML = `
    <div style="display:flex;align-items:flex-start;gap:10px;">
      <span style="font-size:18px;flex-shrink:0;margin-top:1px;">${getCategoryIcon(data.category)}</span>
      <div style="flex:1;min-width:0;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:4px;">
          <span style="font-weight:600;font-size:13px;color:var(--ielts-text, #0f172a);line-height:1.3;">
            ${escapeHtml(data.title)}
          </span>
          <button id="${PANEL_ID}-close" aria-label="Dismiss" title="Dismiss"
            style="flex-shrink:0;width:22px;height:22px;display:flex;align-items:center;justify-content:center;border:none;border-radius:4px;background:transparent;color:var(--ielts-muted, #94a3b8);cursor:pointer;font-size:12px;line-height:1;padding:0;">
            ✕
          </button>
        </div>
        <p style="margin:0;font-size:12px;color:var(--ielts-text-secondary, #475569);line-height:1.5;">
          ${escapeHtml(data.message)}
        </p>
        <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap;">
          <button id="${PANEL_ID}-snooze"
            style="${secondaryBtnStyle}">
            ${iconToHtml(IconClock, 14)} Snooze
          </button>
          <button id="${PANEL_ID}-dismiss"
            style="${secondaryBtnStyle}">
            Dismiss
          </button>
          ${
            data.action
              ? `<button id="${PANEL_ID}-action"
                  style="${primaryBtnStyle}">
                  ${escapeHtml(data.action.label)}
                </button>`
              : ''
          }
        </div>
      </div>
    </div>
  `

  bindEvents(el, data)
  return el
}

function bindEvents(el: HTMLDivElement, data: ProactiveMessageData): void {
  const closeBtn = el.querySelector(`#${PANEL_ID}-close`) as HTMLButtonElement
  const dismissBtn = el.querySelector(`#${PANEL_ID}-dismiss`) as HTMLButtonElement
  const snoozeBtn = el.querySelector(`#${PANEL_ID}-snooze`) as HTMLButtonElement
  const actionBtn = el.querySelector(`#${PANEL_ID}-action`) as HTMLButtonElement

  const handleDismiss = () => {
    hide()
    onDismiss?.(data.id)
  }

  closeBtn?.addEventListener('click', (e) => {
    e.stopPropagation()
    handleDismiss()
  })

  dismissBtn?.addEventListener('click', (e) => {
    e.stopPropagation()
    handleDismiss()
  })

  snoozeBtn?.addEventListener('click', (e) => {
    e.stopPropagation()
    hide()
    onDismiss?.(data.id)
  })

  actionBtn?.addEventListener('click', (e) => {
    e.stopPropagation()
    hide()
    onAction?.(data)
  })
}

export function showProactiveMessage(
  data: ProactiveMessageData,
  handlers?: {
    onDismiss?: DismissHandler
    onAction?: ActionHandler
  },
): void {
  injectContentStyles()
  injectStyles()

  if (handlers?.onDismiss) onDismiss = handlers.onDismiss
  if (handlers?.onAction) onAction = handlers.onAction

  panelEl = createPanel(data)
  document.body.appendChild(panelEl)

  requestAnimationFrame(() => {
    if (panelEl) {
      panelEl.style.opacity = '1'
      panelEl.style.transform = 'translateY(0)'
    }
  })

  autoHide()
}

export function hide(): void {
  if (panelEl) {
    panelEl.style.opacity = '0'
    panelEl.style.transform = 'translateY(8px)'
    setTimeout(() => {
      if (panelEl) {
        panelEl.remove()
        panelEl = null
      }
    }, 200)
  }
}

let autoHideTimer: ReturnType<typeof setTimeout> | null = null

function autoHide(): void {
  if (autoHideTimer) clearTimeout(autoHideTimer)
  autoHideTimer = setTimeout(() => {
    hide()
  }, 15000)
}

function injectStyles(): void {
  if (document.getElementById(STYLES_ID)) return

  const style = document.createElement('style')
  style.id = STYLES_ID
  style.textContent = `
    #${PANEL_ID} * { box-sizing: border-box; }
    #${PANEL_ID} button:hover { opacity: 0.85; }
    #${PANEL_ID} button:focus-visible { outline: 2px solid var(--ielts-primary, #2563eb); outline-offset: 2px; }
  `
  document.head.appendChild(style)
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

const secondaryBtnStyle = [
  'padding:4px 10px',
  'border-radius:6px',
  'border:1px solid var(--ielts-border, #e2e8f0)',
  'background:var(--ielts-surface, #f8fafc)',
  'color:var(--ielts-text-secondary, #475569)',
  'font-size:11px',
  'cursor:pointer',
  'font-weight:500',
  'transition:background 0.12s',
  'font-family:inherit',
  'line-height:1.3',
].join(';')

const primaryBtnStyle = [
  'padding:4px 12px',
  'border-radius:6px',
  'border:none',
  'background:var(--ielts-primary, #2563eb)',
  'color:var(--ielts-on-primary, #ffffff)',
  'font-size:11px',
  'cursor:pointer',
  'font-weight:600',
  'transition:opacity 0.12s',
  'font-family:inherit',
  'line-height:1.3',
].join(';')

export function destroyProactiveMessagePanel(): void {
  hide()
  const style = document.getElementById(STYLES_ID)
  if (style) style.remove()
}
