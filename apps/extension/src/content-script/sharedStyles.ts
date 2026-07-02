const STYLES_ID = 'ielts-content-styles'

const LIGHT_VARS = `
  --ielts-bg: #ffffff;
  --ielts-surface: #f8fafc;
  --ielts-surface-alt: #f1f5f9;
  --ielts-primary: #2563eb;
  --ielts-primary-hover: #1d4ed8;
  --ielts-primary-light: #dbeafe;
  --ielts-text: #0f172a;
  --ielts-text-secondary: #475569;
  --ielts-muted: #94a3b8;
  --ielts-border: #e2e8f0;
  --ielts-success: #16a34a;
  --ielts-warning: #d97706;
  --ielts-danger: #dc2626;
  --ielts-info: #0891b2;
  --ielts-overlay: rgba(0,0,0,0.4);
`

const DARK_VARS = `
  --ielts-bg: #0f172a;
  --ielts-surface: #1e293b;
  --ielts-surface-alt: #334155;
  --ielts-primary: #3b82f6;
  --ielts-primary-hover: #60a5fa;
  --ielts-primary-light: #1e3a5f;
  --ielts-text: #f1f5f9;
  --ielts-text-secondary: #94a3b8;
  --ielts-muted: #64748b;
  --ielts-border: #334155;
  --ielts-success: #22c55e;
  --ielts-warning: #f59e0b;
  --ielts-danger: #ef4444;
  --ielts-info: #06b6d4;
  --ielts-overlay: rgba(0,0,0,0.6);
`

export function injectContentStyles(): void {
  if (document.getElementById(STYLES_ID)) return

  const style = document.createElement('style')
  style.id = STYLES_ID
  style.textContent = `
    :root {
      ${LIGHT_VARS}
    }
    @media (prefers-color-scheme: dark) {
      :root {
        ${DARK_VARS}
      }
    }
    [data-ielts-theme="dark"] {
      ${DARK_VARS}
    }
    [data-ielts-theme="light"] {
      ${LIGHT_VARS}
    }

    .ielts-toolbar,
    .ielts-dict-panel,
    .ielts-ai-panel,
    .ielts-toast {
      all: initial;
      font-family: system-ui, -apple-system, sans-serif;
    }
    .ielts-toolbar *,
    .ielts-dict-panel *,
    .ielts-ai-panel *,
    .ielts-toast * {
      box-sizing: border-box;
    }
    .ielts-btn:focus-visible,
    .ielts-toolbar button:focus-visible,
    .ielts-dict-panel button:focus-visible,
    .ielts-ai-panel button:focus-visible {
      outline: 2px solid var(--ielts-primary);
      outline-offset: 2px;
    }
  `
  document.head.appendChild(style)
}

export function tryRemoveContentStyles(): void {
  const el = document.getElementById(STYLES_ID)
  if (el) el.remove()
}
