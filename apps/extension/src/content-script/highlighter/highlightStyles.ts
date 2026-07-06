const STYLES_ID = 'ielts-highlight-styles'

export function injectHighlightStyles(): void {
  if (document.getElementById(STYLES_ID)) return

  const style = document.createElement('style')
  style.id = STYLES_ID
  style.textContent = `
    .ielts-journey-saved-keyword-highlight.ielts-journey-saved-keyword-highlight {
      background-color: var(--ielts-highlight, #fef9c3) !important;
      color: inherit !important;
      border-radius: 2px !important;
      padding: 0 2px !important;
      cursor: pointer !important;
      transition: background-color 0.2s ease, box-shadow 0.2s ease !important;
      box-decoration-break: clone !important;
      -webkit-box-decoration-break: clone !important;
      border-bottom: 2px solid color-mix(in srgb, var(--ielts-highlight, #fef9c3) 60%, var(--ielts-primary, #2563eb)) !important;
    }

    .ielts-journey-saved-keyword-highlight.ielts-journey-saved-keyword-highlight:hover {
      background-color: color-mix(in srgb, var(--ielts-highlight, #fef9c3) 75%, var(--ielts-primary, #2563eb)) !important;
      box-shadow: 0 1px 4px color-mix(in srgb, var(--ielts-highlight, #fef9c3) 50%, transparent) !important;
    }

    #ielts-journey-tooltip {
      all: initial;
      position: fixed;
      z-index: 2147483647;
      font-family: var(--ielts-font-sans, system-ui, -apple-system, sans-serif);
    }
  `
  document.head.appendChild(style)
}

export function tryRemoveHighlightStyles(): void {
  const el = document.getElementById(STYLES_ID)
  if (el) el.remove()
}
