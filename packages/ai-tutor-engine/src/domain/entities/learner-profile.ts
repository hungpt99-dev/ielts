import type { BandScore, SkillBandScores, IELTSSection } from '../value-objects'

export type IELTSExamType = 'academic' | 'general-training'

export interface LearnerProfile {
  currentOverallBand: BandScore | null
  targetOverallBand: BandScore | null
  currentSkillBands: Partial<SkillBandScores> | null
  targetSkillBands: Partial<SkillBandScores> | null
  examType: IELTSExamType | null
  examDate: string | null
  timezone: string
  preferredLanguage: string
  studyIntensity: 'light' | 'moderate' | 'intense'
  weakSkills: IELTSSection[]
  strongSkills: IELTSSection[]
}

export interface LearnerProfileUpdate {
  currentOverallBand?: BandScore
  targetOverallBand?: BandScore
  examDate?: string
  examType?: IELTSExamType
  weakSkills?: IELTSSection[]
}
