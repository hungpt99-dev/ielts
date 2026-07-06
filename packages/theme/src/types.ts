import type { ColorTokens } from './colors'
import type { RadiusTokens } from './radius'
import type { SpacingTokens } from './spacing'
import type { TypographyTokens } from './typography'
import type {
  DesignTokens,
  ShadowTokens,
  ZIndexTokens,
  BreakpointTokens,
  TransitionTokens,
  AnimationTokens,
  ExtensionTokens,
} from './tokens'

export type { ColorTokens, RadiusTokens, SpacingTokens, TypographyTokens }
export type {
  DesignTokens,
  ShadowTokens,
  ZIndexTokens,
  BreakpointTokens,
  TransitionTokens,
  AnimationTokens,
  ExtensionTokens,
}

export type ThemeMode = 'light' | 'dark' | 'system'

export interface ThemeContextValue {
  mode: ThemeMode
  dark: boolean
  accentColor: string
  setMode: (mode: ThemeMode) => void
  toggle: () => void
  setAccentColor: (color: string) => void
}
