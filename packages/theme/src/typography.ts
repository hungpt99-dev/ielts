export interface TypographyTokens {
  sans: string
  mono: string
  size: {
    xs: string
    sm: string
    base: string
    lg: string
    xl: string
    '2xl': string
    '3xl': string
    '4xl': string
    '5xl': string
    '6xl': string
  }
  weight: {
    normal: string
    medium: string
    semibold: string
    bold: string
  }
  leading: {
    tight: string
    normal: string
    relaxed: string
  }
}

export const TYPOGRAPHY: TypographyTokens = {
  sans: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  mono: '"JetBrains Mono", "Fira Code", monospace',
  size: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '3.75rem',
  },
  weight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  leading: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
}
