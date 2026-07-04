const STYLES_ID = 'ielts-highlight-styles'

export function injectHighlightStyles(): void {
  if (document.getElementById(STYLES_ID)) return

  const style = document.createElement('style')
  style.id = STYLES_ID
  style.textContent = `
    .ielts-journey-saved-keyword-highlight.ielts-journey-saved-keyword-highlight {
      background-color: rgba(255, 213, 79, 0.35) !important;
      color: inherit !important;
      border-radius: 2px !important;
      padding: 0 1px !important;
      cursor: pointer !important;
      transition: background-color 0.15s ease !important;
      box-decoration-break: clone !important;
      -webkit-box-decoration-break: clone !important;
    }

    .ielts-journey-saved-keyword-highlight.ielts-journey-saved-keyword-highlight:hover {
      background-color: rgba(255, 213, 79, 0.6) !important;
    }

    @media (prefers-color-scheme: dark) {
      .ielts-journey-saved-keyword-highlight.ielts-journey-saved-keyword-highlight {
        background-color: rgba(251, 191, 36, 0.3) !important;
        border-bottom: 1px solid rgba(251, 191, 36, 0.5) !important;
      }
      .ielts-journey-saved-keyword-highlight.ielts-journey-saved-keyword-highlight:hover {
        background-color: rgba(251, 191, 36, 0.5) !important;
      }
    }

    .ielts-journey-tooltip {
      all: initial;
      position: fixed;
      z-index: 2147483647;
      font-family: system-ui, -apple-system, sans-serif;
    }
  `
  document.head.appendChild(style)
}

export function tryRemoveHighlightStyles(): void {
  const el = document.getElementById(STYLES_ID)
  if (el) el.remove()
}
