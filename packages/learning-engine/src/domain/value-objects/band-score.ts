export type BandScore = number

export type IELTSSection = 'listening' | 'reading' | 'writing' | 'speaking' | 'grammar' | 'vocabulary'

export interface SkillBandScores {
  listening: BandScore
  reading: BandScore
  writing: BandScore
  speaking: BandScore
}
