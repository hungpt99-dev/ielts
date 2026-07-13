import type { ProgressRepository, SkillProgress } from '@ielts/learning-engine'
import { safeStorageGet, safeStorageSet } from '../../utils/safe-chrome'

const PROGRESS_KEY = 'engine-skill-progress'
const OVERALL_KEY = 'engine-overall-progress'

export const extensionProgressRepository: ProgressRepository = {
  async getSkillProgress(skill: string) {
    const result = await safeStorageGet<Record<string, SkillProgress>>(PROGRESS_KEY)
    const all = result[PROGRESS_KEY] ?? {}
    return all[skill] ?? null
  },

  async updateSkillProgress(skill: string, progress: SkillProgress) {
    const result = await safeStorageGet<Record<string, SkillProgress>>(PROGRESS_KEY)
    const all = result[PROGRESS_KEY] ?? {}
    all[skill] = progress
    await safeStorageSet({ [PROGRESS_KEY]: all })
  },

  async getOverallProgress() {
    const result = await safeStorageGet<number>(OVERALL_KEY)
    return result[OVERALL_KEY] ?? 0
  },

  async updateOverallProgress(percent: number) {
    await safeStorageSet({ [OVERALL_KEY]: percent })
  },
}
