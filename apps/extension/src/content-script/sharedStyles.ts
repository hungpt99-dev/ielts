const STYLES_ID = 'ielts-content-styles'

const LIGHT_VARS = `
  --ielts-bg: #f8fafc;
  --ielts-surface: #ffffff;
  --ielts-surface-alt: #f1f5f9;
  --ielts-primary: #2563eb;
  --ielts-primary-hover: #1d4ed8;
  --ielts-primary-light: #dbeafe;
  --ielts-primary-dark: #1e40af;
  --ielts-on-primary: #ffffff;
  --ielts-text: #0f172a;
  --ielts-text-secondary: #475569;
  --ielts-muted: #94a3b8;
  --ielts-text-inverse: #ffffff;
  --ielts-border: #e2e8f0;
  --ielts-border-light: #f1f5f9;
  --ielts-success: #22c55e;
  --ielts-success-light: #dcfce7;
  --ielts-warning: #f59e0b;
  --ielts-warning-light: #fef3c7;
  --ielts-danger: #ef4444;
  --ielts-danger-light: #fee2e2;
  --ielts-info: #3b82f6;
  --ielts-info-light: #dbeafe;
  --ielts-skill-listening: #06b6d4;
  --ielts-skill-listening-light: #cffafe;
  --ielts-skill-reading: #8b5cf6;
  --ielts-skill-reading-light: #ede9fe;
  --ielts-skill-writing: #f59e0b;
  --ielts-skill-writing-light: #fef3c7;
  --ielts-skill-speaking: #ec4899;
  --ielts-skill-speaking-light: #fce7f3;
  --ielts-tutor-bg: #f0f9ff;
  --ielts-tutor-text: #0c4a6e;
  --ielts-tutor-border: #bae6fd;
  --ielts-tutor-accent: #0ea5e9;
  --ielts-overlay: rgba(0,0,0,0.4);
  --ielts-highlight: #fef9c3;
  --ielts-radius-sm: 0.375rem;
  --ielts-radius-md: 0.5rem;
  --ielts-radius-lg: 0.75rem;
  --ielts-radius-xl: 1rem;
  --ielts-radius-full: 9999px;
  --ielts-shadow-sm: 0 1px 2px rgb(0 0 0 / 0.05);
  --ielts-shadow-md: 0 4px 6px rgb(0 0 0 / 0.1);
  --ielts-shadow-lg: 0 10px 15px rgb(0 0 0 / 0.1);
  --ielts-font-sans: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
`

const DARK_VARS = `
  --ielts-bg: #0f172a;
  --ielts-surface: #1e293b;
  --ielts-surface-alt: #334155;
  --ielts-primary: #3b82f6;
  --ielts-primary-hover: #60a5fa;
  --ielts-primary-light: #1e3a5f;
  --ielts-primary-dark: #93c5fd;
  --ielts-text: #f1f5f9;
  --ielts-text-secondary: #94a3b8;
  --ielts-muted: #64748b;
  --ielts-text-inverse: #0f172a;
  --ielts-border: #334155;
  --ielts-border-light: #1e293b;
  --ielts-success: #22c55e;
  --ielts-success-light: #14532d;
  --ielts-warning: #f59e0b;
  --ielts-warning-light: #78350f;
  --ielts-danger: #ef4444;
  --ielts-danger-light: #7f1d1d;
  --ielts-info: #3b82f6;
  --ielts-info-light: #1e3a5f;
  --ielts-skill-listening: #22d3ee;
  --ielts-skill-listening-light: #164e63;
  --ielts-skill-reading: #a78bfa;
  --ielts-skill-reading-light: #3b0764;
  --ielts-skill-writing: #fbbf24;
  --ielts-skill-writing-light: #78350f;
  --ielts-skill-speaking: #f472b6;
  --ielts-skill-speaking-light: #831843;
  --ielts-tutor-bg: #0c4a6e;
  --ielts-tutor-text: #e0f2fe;
  --ielts-tutor-border: #0e7490;
  --ielts-tutor-accent: #38bdf8;
  --ielts-overlay: rgba(0,0,0,0.6);
  --ielts-highlight: #713f12;
  --ielts-shadow-sm: 0 1px 2px rgb(0 0 0 / 0.3);
  --ielts-shadow-md: 0 4px 6px rgb(0 0 0 / 0.4);
  --ielts-shadow-lg: 0 10px 15px rgb(0 0 0 / 0.4);
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
      display: flex;
      font-family: var(--ielts-font-sans, system-ui, -apple-system, sans-serif);
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
