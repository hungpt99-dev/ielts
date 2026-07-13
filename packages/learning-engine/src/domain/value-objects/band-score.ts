export type BandScore = number

export type IELTSSection = 'listening' | 'reading' | 'writing' | 'speaking'

export interface SkillBandScores {
  listening: BandScore
  reading: BandScore
  writing: BandScore
  speaking: BandScore
}
