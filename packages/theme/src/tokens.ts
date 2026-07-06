import type { ColorTokens } from './colors'
import { COLORS, DARK_COLORS } from './colors'
import type { RadiusTokens } from './radius'
import { RADIUS } from './radius'
import type { SpacingTokens } from './spacing'
import { SPACING } from './spacing'
import type { TypographyTokens } from './typography'
import { TYPOGRAPHY } from './typography'

export type { ColorTokens, RadiusTokens, SpacingTokens, TypographyTokens }
export { COLORS, DARK_COLORS, RADIUS, SPACING, TYPOGRAPHY }

export interface DesignTokens {
  color: ColorTokens
  radius: RadiusTokens
  spacing: SpacingTokens
  font: TypographyTokens
  shadow: ShadowTokens
  zIndex: ZIndexTokens
  breakpoint: BreakpointTokens
  transition: TransitionTokens
  animation: AnimationTokens
  extension: ExtensionTokens
}

export interface ShadowTokens {
  xs: string
  sm: string
  md: string
  lg: string
  xl: string
  '2xl': string
  inner: string
  colored: string
  tutor: string
  elevated: string
}

export interface ZIndexTokens {
  dropdown: string
  sticky: string
  fixed: string
  modalBackdrop: string
  modal: string
  popover: string
  toast: string
  tooltip: string
  aiTutor: string
  extensionMenu: string
  highlight: string
}

export interface BreakpointTokens {
  sm: string
  md: string
  lg: string
  xl: string
  '2xl': string
}

export interface TransitionTokens {
  fast: string
  normal: string
  slow: string
}

export interface AnimationTokens {
  fadeIn: string
  slideUp: string
  slideDown: string
  slideInRight: string
  slideInLeft: string
  slideInUp: string
  pulse: string
  spin: string
  scaleIn: string
}

export interface ExtensionTokens {
  width: string
  minHeight: string
  maxHeight: string
}

export const TOKENS: DesignTokens = {
  color: COLORS,
  radius: RADIUS,
  spacing: SPACING,
  font: TYPOGRAPHY,
  shadow: {
    xs: '0 1px 1px 0 rgb(0 0 0 / 0.03)',
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    colored: '0 4px 14px 0 rgb(37 99 235 / 0.3)',
    tutor: '0 4px 14px 0 rgb(14 165 233 / 0.2)',
    elevated: '0 8px 32px 0 rgb(0 0 0 / 0.12)',
  },
  zIndex: {
    dropdown: '100',
    sticky: '200',
    fixed: '300',
    modalBackdrop: '400',
    modal: '500',
    popover: '600',
    toast: '700',
    tooltip: '800',
    aiTutor: '900',
    extensionMenu: '1000',
    highlight: '2147483647',
  },
  breakpoint: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  transition: {
    fast: '150ms ease',
    normal: '200ms ease',
    slow: '300ms ease',
  },
  animation: {
    fadeIn: 'fadeIn var(--transition-normal)',
    slideUp: 'slideUp var(--transition-normal)',
    slideDown: 'slideDown var(--transition-normal)',
    slideInRight: 'slideInRight var(--transition-normal)',
    slideInLeft: 'slideInLeft var(--transition-normal)',
    slideInUp: 'slideInUp var(--transition-normal)',
    pulse: 'pulse 1.5s ease-in-out infinite',
    spin: 'spin 0.6s linear infinite',
    scaleIn: 'scaleIn var(--transition-normal)',
  },
  extension: {
    width: '400px',
    minHeight: '500px',
    maxHeight: '600px',
  },
}

export const DARK_TOKENS: Partial<DesignTokens> = {
  color: DARK_COLORS as ColorTokens,
  shadow: {
    xs: '0 1px 1px 0 rgb(0 0 0 / 0.2)',
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.3)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.4)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.4)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.4)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.5)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.1)',
    colored: '0 4px 14px 0 rgb(59 130 246 / 0.4)',
    tutor: '0 4px 14px 0 rgb(56 189 248 / 0.3)',
    elevated: '0 8px 32px 0 rgb(0 0 0 / 0.35)',
  },
}

export const ACCENT_COLOR_PRESETS = [
  { name: 'Blue', value: '#2563eb' },
  { name: 'Green', value: '#16a34a' },
  { name: 'Purple', value: '#7c3aed' },
  { name: 'Rose', value: '#e11d48' },
  { name: 'Orange', value: '#ea580c' },
  { name: 'Teal', value: '#0d9488' },
  { name: 'Indigo', value: '#4f46e5' },
  { name: 'Pink', value: '#db2777' },
] as const

export const DEFAULT_ACCENT_COLOR = '#2563eb'
export const THEME_MODES = ['light', 'dark', 'system'] as const
