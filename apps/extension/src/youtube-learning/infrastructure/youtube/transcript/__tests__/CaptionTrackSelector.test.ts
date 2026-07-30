import { describe, it, expect } from 'vitest'
import { CaptionTrackSelector } from '../CaptionTrackSelector'
import type { CaptionTrack } from '../types'

function makeTrack(overrides: Partial<CaptionTrack> & { languageCode: string }): CaptionTrack {
  return {
    baseUrl: `https://example.com/${overrides.languageCode}`,
    languageCode: overrides.languageCode,
    kind: 'auto',
    name: overrides.languageCode,
    isTranslatable: false,
    ...overrides,
  }
}

describe('CaptionTrackSelector', () => {
  const selector = new CaptionTrackSelector()

  it('returns null for empty track list', () => {
    expect(selector.select([], 'en')).toBeNull()
  })

  it('prefers exact language match with manual captions', () => {
    const tracks: CaptionTrack[] = [
      makeTrack({ languageCode: 'en', kind: 'auto' }),
      makeTrack({ languageCode: 'en', kind: 'manual' }),
      makeTrack({ languageCode: 'vi', kind: 'manual' }),
    ]
    const result = selector.select(tracks, 'en')
    expect(result?.languageCode).toBe('en')
    expect(result?.kind).toBe('manual')
  })

  it('falls back to auto-generated for exact language when no manual', () => {
    const tracks: CaptionTrack[] = [
      makeTrack({ languageCode: 'en', kind: 'auto' }),
      makeTrack({ languageCode: 'vi', kind: 'manual' }),
    ]
    const result = selector.select(tracks, 'en')
    expect(result?.languageCode).toBe('en')
    expect(result?.kind).toBe('auto')
  })

  it('prefers prefix match with manual captions', () => {
    const tracks: CaptionTrack[] = [
      makeTrack({ languageCode: 'en-US', kind: 'auto' }),
      makeTrack({ languageCode: 'en-GB', kind: 'manual' }),
    ]
    const result = selector.select(tracks, 'en')
    expect(result?.languageCode).toBe('en-GB')
    expect(result?.kind).toBe('manual')
  })

  it('falls back to English when preferred language not found', () => {
    const tracks: CaptionTrack[] = [
      makeTrack({ languageCode: 'en', kind: 'auto' }),
      makeTrack({ languageCode: 'fr', kind: 'manual' }),
    ]
    const result = selector.select(tracks, 'vi')
    expect(result?.languageCode).toBe('en')
  })

  it('falls back to first available when nothing matches', () => {
    const tracks: CaptionTrack[] = [
      makeTrack({ languageCode: 'ja', kind: 'auto' }),
      makeTrack({ languageCode: 'ko', kind: 'auto' }),
    ]
    const result = selector.select(tracks, 'vi')
    expect(result?.languageCode).toBe('ja')
  })

  it('prefers English manual over English auto as fallback', () => {
    const tracks: CaptionTrack[] = [
      makeTrack({ languageCode: 'en', kind: 'auto' }),
      makeTrack({ languageCode: 'en', kind: 'manual' }),
    ]
    const result = selector.select(tracks, 'vi')
    expect(result?.languageCode).toBe('en')
    expect(result?.kind).toBe('manual')
  })
})
