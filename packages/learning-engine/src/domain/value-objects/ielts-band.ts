// ──────────────────────────────────────────────
// IELTS Band Domain Model
// ──────────────────────────────────────────────
// Official IELTS bands are reported in whole and half bands only.
// Internal continuous scores are a separate concept.
// Conversion between the two happens through centralized functions.

export const OFFICIAL_IELTS_BANDS = [
  0, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9,
] as const;

export const OFFICIAL_BAND_SET: ReadonlySet<number> = new Set(OFFICIAL_IELTS_BANDS);

export type OfficialIeltsBand = (typeof OFFICIAL_IELTS_BANDS)[number];

export type InternalProficiencyScore = number;

export interface IeltsLevelEstimate {
  officialBand: OfficialIeltsBand;
  internalScore: InternalProficiencyScore;
  confidence?: number;
}

export type IeltsSkill = 'listening' | 'reading' | 'writing' | 'speaking';

export interface SkillBandProfile {
  listening: OfficialIeltsBand;
  reading: OfficialIeltsBand;
  writing: OfficialIeltsBand;
  speaking: OfficialIeltsBand;
  overall: OfficialIeltsBand;
}

export function isOfficialIeltsBand(value: number): value is OfficialIeltsBand {
  return OFFICIAL_BAND_SET.has(value);
}

export function toNearestOfficialBand(score: number): OfficialIeltsBand {
  if (score <= 0) return 0;
  if (score >= 9) return 9;

  const roundedToHalf = Math.floor(score * 2 + 0.5) / 2;

  if (roundedToHalf <= 0) return 0;
  if (roundedToHalf >= 9) return 9;

  let nearestBand: OfficialIeltsBand = 0;
  let minDiff = Infinity;

  for (const band of OFFICIAL_IELTS_BANDS) {
    const diff = Math.abs(roundedToHalf - band);
    if (diff < minDiff) {
      minDiff = diff;
      nearestBand = band;
    }
  }

  return nearestBand;
}

export function roundToOfficialBand(score: number): OfficialIeltsBand {
  const nearestHalf = Math.round(score * 2) / 2;
  return toNearestOfficialBand(nearestHalf);
}

export function toDisplayBand(band: OfficialIeltsBand): string {
  if (Number.isInteger(band)) {
    return `${band}.0`;
  }
  return band.toFixed(1);
}

export function normalizeInternalScore(score: number): InternalProficiencyScore {
  if (typeof score !== 'number' || isNaN(score)) return 0;
  return Math.max(0, Math.min(9, Math.round(score * 100) / 100));
}

export function createSkillBandProfile(
  overall: number,
  listening: number,
  reading: number,
  writing: number,
  speaking: number,
): SkillBandProfile {
  return {
    overall: toNearestOfficialBand(overall),
    listening: toNearestOfficialBand(listening),
    reading: toNearestOfficialBand(reading),
    writing: toNearestOfficialBand(writing),
    speaking: toNearestOfficialBand(speaking),
  };
}

export function validateOfficialBand(value: number): OfficialIeltsBand {
  if (!isOfficialIeltsBand(value)) {
    return toNearestOfficialBand(value);
  }
  return value;
}

export function bandGap(from: OfficialIeltsBand, to: OfficialIeltsBand): number {
  return Math.max(0, to - from);
}
