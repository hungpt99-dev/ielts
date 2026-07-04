import type { SharedSettings } from './types'

export type SharedSettingsPatch = Partial<SharedSettings>

export const SETTINGS_BRIDGE_ACTIONS = {
  SETTINGS_CHANGED: 'SETTINGS_CHANGED',
  SETTINGS_SYNC: 'SETTINGS_SYNC',
} as const

export type SettingsBridgeAction = typeof SETTINGS_BRIDGE_ACTIONS[keyof typeof SETTINGS_BRIDGE_ACTIONS]

export const BRIDGE_SOURCES = {
  PAGE: 'ielts-page',
  EXTENSION: 'ielts-extension',
} as const

export type BridgeSource = typeof BRIDGE_SOURCES[keyof typeof BRIDGE_SOURCES]

export function createSettingsBridgeMessage(
  source: BridgeSource,
  action: SettingsBridgeAction,
  data: SharedSettingsPatch,
) {
  return { source, action, data }
}
