import { describe, it, expect } from 'vitest';
import {
  OFFICIAL_IELTS_BANDS,
  isOfficialIeltsBand,
  toNearestOfficialBand,
  roundToOfficialBand,
  toDisplayBand,
  normalizeInternalScore,
  validateOfficialBand,
  bandGap,
  createSkillBandProfile,
} from '../ielts-band';

describe('OFFICIAL_IELTS_BANDS', () => {
  it('contains all valid IELTS bands', () => {
    expect(OFFICIAL_IELTS_BANDS).toEqual([
      0, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9,
    ]);
  });

  it('contains 18 valid values', () => {
    expect(OFFICIAL_IELTS_BANDS.length).toBe(18);
  });
});

describe('isOfficialIeltsBand', () => {
  it('returns true for valid official bands', () => {
    expect(isOfficialIeltsBand(0)).toBe(true);
    expect(isOfficialIeltsBand(5.5)).toBe(true);
    expect(isOfficialIeltsBand(6.0)).toBe(true);
    expect(isOfficialIeltsBand(6.5)).toBe(true);
    expect(isOfficialIeltsBand(7)).toBe(true);
    expect(isOfficialIeltsBand(9)).toBe(true);
  });

  it('returns false for unsupported decimal values', () => {
    expect(isOfficialIeltsBand(5.6)).toBe(false);
    expect(isOfficialIeltsBand(5.8)).toBe(false);
    expect(isOfficialIeltsBand(5.9)).toBe(false);
    expect(isOfficialIeltsBand(6.1)).toBe(false);
    expect(isOfficialIeltsBand(6.3)).toBe(false);
    expect(isOfficialIeltsBand(6.4)).toBe(false);
    expect(isOfficialIeltsBand(6.6)).toBe(false);
    expect(isOfficialIeltsBand(7.1)).toBe(false);
    expect(isOfficialIeltsBand(8.7)).toBe(false);
  });

  it('returns false for out of range values', () => {
    expect(isOfficialIeltsBand(-1)).toBe(false);
    expect(isOfficialIeltsBand(10)).toBe(false);
  });
});

describe('toNearestOfficialBand', () => {
  it('rounds 5.6 to 5.5', () => {
    expect(toNearestOfficialBand(5.6)).toBe(5.5);
  });

  it('rounds 5.75 to 6.0', () => {
    expect(toNearestOfficialBand(5.75)).toBe(6.0);
  });

  it('rounds 5.8 to 6.0', () => {
    expect(toNearestOfficialBand(5.8)).toBe(6.0);
  });

  it('rounds 5.9 to 6.0', () => {
    expect(toNearestOfficialBand(5.9)).toBe(6.0);
  });

  it('rounds 6.1 to 6.0', () => {
    expect(toNearestOfficialBand(6.1)).toBe(6.0);
  });

  it('rounds 6.3 to 6.5', () => {
    expect(toNearestOfficialBand(6.3)).toBe(6.5);
  });

  it('rounds 6.4 to 6.5', () => {
    expect(toNearestOfficialBand(6.4)).toBe(6.5);
  });

  it('rounds 6.6 to 6.5', () => {
    expect(toNearestOfficialBand(6.6)).toBe(6.5);
  });

  it('rounds 6.24 to 6.0', () => {
    expect(toNearestOfficialBand(6.24)).toBe(6.0);
  });

  it('rounds 6.25 to 6.5', () => {
    expect(toNearestOfficialBand(6.25)).toBe(6.5);
  });

  it('clamps to 0 for negative values', () => {
    expect(toNearestOfficialBand(-1)).toBe(0);
  });

  it('clamps to 9 for values above 9', () => {
    expect(toNearestOfficialBand(10)).toBe(9);
  });

  it('handles exact official band values', () => {
    expect(toNearestOfficialBand(5.5)).toBe(5.5);
    expect(toNearestOfficialBand(6.0)).toBe(6.0);
    expect(toNearestOfficialBand(7.5)).toBe(7.5);
  });

  it('handles 0', () => {
    expect(toNearestOfficialBand(0)).toBe(0);
  });

  it('handles 9', () => {
    expect(toNearestOfficialBand(9)).toBe(9);
  });
});

describe('roundToOfficialBand', () => {
  it('rounds then converts to nearest official band', () => {
    expect(roundToOfficialBand(5.6)).toBe(5.5);
    expect(roundToOfficialBand(5.74)).toBe(5.5);
    expect(roundToOfficialBand(5.75)).toBe(6.0);
    expect(roundToOfficialBand(5.76)).toBe(6.0);
  });
});

describe('toDisplayBand', () => {
  it('formats integer bands with .0', () => {
    expect(toDisplayBand(6)).toBe('6.0');
    expect(toDisplayBand(7)).toBe('7.0');
    expect(toDisplayBand(9)).toBe('9.0');
  });

  it('formats half bands with one decimal', () => {
    expect(toDisplayBand(5.5)).toBe('5.5');
    expect(toDisplayBand(6.5)).toBe('6.5');
    expect(toDisplayBand(7.5)).toBe('7.5');
  });
});

describe('normalizeInternalScore', () => {
  it('clamps negative values to 0', () => {
    expect(normalizeInternalScore(-5)).toBe(0);
  });

  it('clamps values above 9 to 9', () => {
    expect(normalizeInternalScore(12)).toBe(9);
  });

  it('rounds to 2 decimal places', () => {
    expect(normalizeInternalScore(5.555)).toBe(5.56);
  });

  it('returns 0 for NaN', () => {
    expect(normalizeInternalScore(NaN)).toBe(0);
  });

  it('passes through valid internal scores unchanged', () => {
    expect(normalizeInternalScore(5.5)).toBe(5.5);
    expect(normalizeInternalScore(5.72)).toBe(5.72);
    expect(normalizeInternalScore(6.05)).toBe(6.05);
  });
});

describe('validateOfficialBand', () => {
  it('passes valid bands through unchanged', () => {
    expect(validateOfficialBand(6.5)).toBe(6.5);
    expect(validateOfficialBand(7)).toBe(7);
  });

  it('normalizes invalid bands to nearest official', () => {
    expect(validateOfficialBand(5.8)).toBe(6.0);
    expect(validateOfficialBand(6.3)).toBe(6.5);
  });
});

describe('bandGap', () => {
  it('calculates gap between official bands', () => {
    expect(bandGap(5.5, 6.5)).toBe(1.0);
    expect(bandGap(6.0, 7.0)).toBe(1.0);
  });

  it('returns 0 when from equals to', () => {
    expect(bandGap(6.5, 6.5)).toBe(0);
  });

  it('returns 0 when from is greater than to', () => {
    expect(bandGap(7.0, 6.5)).toBe(0);
  });
});

describe('createSkillBandProfile', () => {
  it('creates profile with all values rounded to official bands', () => {
    const profile = createSkillBandProfile(5.8, 6.3, 6.1, 5.2, 5.6);
    expect(profile.overall).toBe(6.0);
    expect(profile.listening).toBe(6.5);
    expect(profile.reading).toBe(6.0);
    expect(profile.writing).toBe(5.0);
    expect(profile.speaking).toBe(5.5);
  });
});
