export type BandScore = 0 | 1 | 1.5 | 2 | 2.5 | 3 | 3.5 | 4 | 4.5 | 5 | 5.5 | 6 | 6.5 | 7 | 7.5 | 8 | 8.5 | 9

export type IELTSSection = 'listening' | 'reading' | 'writing' | 'speaking' | 'grammar' | 'vocabulary'

export interface SkillBandScores {
  listening: BandScore
  reading: BandScore
  writing: BandScore
  speaking: BandScore
}

export function isValidBandScore(value: number): value is BandScore {
  const valid = [0, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9]
  return valid.includes(value as BandScore)
}
