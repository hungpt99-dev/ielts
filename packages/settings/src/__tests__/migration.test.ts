import { describe, it, expect } from 'vitest'
import { migrateFromLegacySettings } from '../migration'

describe('migrateFromLegacySettings', () => {
  it('transforms a complete legacy AppSettings object to UserConfiguration', () => {
    const legacy = {
      targetBand: 7.0,
      currentBand: 5.5,
      examDate: '2026-09-15',
      dailyStudyMinutes: 60,
      weakSkills: ['writing', 'speaking'],
      aiApiKey: 'sk-test-key',
      aiBaseUrl: 'https://api.openai.com/v1',
      aiModel: 'gpt-4o-mini',
      themeMode: 'dark',
    }
    const result = migrateFromLegacySettings(legacy)
    expect(result).not.toBeNull()
    expect(result!.version).toBe(1)
    expect(result!.ai?.providerId).toBe('openai')
    expect(result!.ai?.model).toBe('gpt-4o-mini')
    expect(result!.ai?.customApiUrl).toBe('https://api.openai.com/v1')
    expect(result!.study?.targetBand).toBe(7.0)
    expect(result!.study?.currentBand).toBe(5.5)
    expect(result!.study?.examDate).toBe('2026-09-15')
    expect(result!.study?.weakSkills).toEqual(['writing', 'speaking'])
    expect(result!.theme?.mode).toBe('dark')
    expect((result as any).aiApiKey).toBeUndefined()
  })

  it('returns null for empty input', () => {
    expect(migrateFromLegacySettings({})).toBeNull()
  })

  it('uses defaults for missing values', () => {
    const result = migrateFromLegacySettings({ targetBand: 8.0 })
    expect(result).not.toBeNull()
    expect(result!.study?.targetBand).toBe(8.0)
    expect(result!.study?.dailyStudyMinutes).toBe(60)
    expect(result!.study?.weakSkills).toEqual([])
    expect(result!.ai?.providerId).toBe('openai')
    expect(result!.theme?.mode).toBe('system')
  })

  it('handles legacy aiEndpoint field', () => {
    const legacy = { aiEndpoint: 'https://custom.com/v1' }
    const result = migrateFromLegacySettings(legacy)
    expect(result!.ai?.customApiUrl).toBe('https://custom.com/v1')
  })
})
