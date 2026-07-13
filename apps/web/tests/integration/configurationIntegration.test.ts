import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createDefaultConfiguration, saveConfiguration, loadConfiguration, clearConfiguration, migrateFromLegacySettings } from '../../src/features/configuration/storage'

const LEGACY_KEY = 'ielts-settings'

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-07-03T10:00:00Z'))
})

afterEach(() => {
  vi.useRealTimers()
  localStorage.clear()
})

describe('End-to-end: Configuration Persistence', () => {
  it('saves configuration and loads it back correctly', () => {
    const config = createDefaultConfiguration()
    config.basic.targetBand = 8.5
    config.basic.dailyStudyMinutes = 120
    config.basic.tutorMode = 'strict-examiner'
    config.advanced.tutorConfig.mode = 'strict-examiner'
    config.advanced.tutorConfig.explanationStyle = 'socratic'
    config.advanced.privacy.privacyLevel = 'local-with-analytics'
    config.advanced.vocabReview.reviewsPerDay = 30

    saveConfiguration(config)
    const loaded = loadConfiguration()

    expect(loaded.basic.targetBand).toBe(8.5)
    expect(loaded.basic.dailyStudyMinutes).toBe(120)
    expect(loaded.basic.tutorMode).toBe('strict-examiner')
    expect(loaded.advanced.tutorConfig.mode).toBe('strict-examiner')
    expect(loaded.advanced.tutorConfig.explanationStyle).toBe('socratic')
    expect(loaded.advanced.privacy.privacyLevel).toBe('local-with-analytics')
    expect(loaded.advanced.vocabReview.reviewsPerDay).toBe(30)
  })

  it('loads default config when nothing is stored', () => {
    const config = loadConfiguration()
    expect(config.basic.targetBand).toBe(7.0)
    expect(config.advanced.tutorConfig.mode).toBe('friendly-tutor')
  })
})

describe('End-to-end: Migration from Legacy Settings', () => {
  it('migrates legacy settings using migrateFromLegacySettings', () => {
    const legacy = {
      targetBand: 6.0,
      examDate: '2026-12-15',
      dailyStudyMinutes: 45,
      aiApiKey: 'sk-legacy',
      aiProvider: 'deepseek',
      aiModel: 'deepseek-chat',
    }
    localStorage.setItem(LEGACY_KEY, JSON.stringify(legacy))

    const migrated = migrateFromLegacySettings()
    expect(migrated).not.toBeNull()
    expect(migrated!.basic.targetBand).toBe(6.0)
    expect(migrated!.basic.examDate).toBe('2026-12-15')
    expect(migrated!.basic.dailyStudyMinutes).toBe(45)
    expect(migrated!.advanced.providers['default-openai'].apiKey).toBe('sk-legacy')
    expect(migrated!.advanced.providers['default-openai'].provider).toBe('deepseek')
    expect(migrated!.advanced.providers['default-openai'].model).toBe('deepseek-chat')
  })

  it('migrated configuration is saveable and reloadable', () => {
    const legacy = { targetBand: 7.5, aiApiKey: 'sk-test' }
    localStorage.setItem(LEGACY_KEY, JSON.stringify(legacy))

    const migrated = migrateFromLegacySettings()
    expect(migrated).not.toBeNull()

    migrated!.basic.dailyStudyMinutes = 90
    saveConfiguration(migrated!)

    localStorage.removeItem(LEGACY_KEY)
    const reloaded = loadConfiguration()
    expect(reloaded.basic.targetBand).toBe(7.5)
    expect(reloaded.basic.dailyStudyMinutes).toBe(90)
    expect(reloaded.advanced.providers['default-openai'].apiKey).toBe('sk-test')
  })
})



describe('End-to-end: Multiple config save/load cycles', () => {
  it('survives multiple save and load cycles', () => {
    const config1 = createDefaultConfiguration()
    config1.basic.targetBand = 6.5
    saveConfiguration(config1)
    const loaded1 = loadConfiguration()
    expect(loaded1.basic.targetBand).toBe(6.5)

    const config2 = loaded1
    config2.basic.targetBand = 7.5
    config2.advanced.tutorConfig.mode = 'vocabulary-focused-tutor'
    saveConfiguration(config2)
    const loaded2 = loadConfiguration()
    expect(loaded2.basic.targetBand).toBe(7.5)
    expect(loaded2.advanced.tutorConfig.mode).toBe('vocabulary-focused-tutor')
  })

  it('clearConfiguration resets to defaults on next load', () => {
    const config = createDefaultConfiguration()
    config.basic.targetBand = 9
    saveConfiguration(config)
    clearConfiguration()

    const loaded = loadConfiguration()
    expect(loaded.basic.targetBand).toBe(7.0)
  })
})
