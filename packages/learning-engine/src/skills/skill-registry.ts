import type { LearningSkillModule } from './skill-module'
import type { IELTSSection } from '../domain/value-objects'

export class SkillRegistry {
  private modules = new Map<IELTSSection, LearningSkillModule>()

  register(module: LearningSkillModule): void {
    this.modules.set(module.skill, module)
  }

  get(skill: IELTSSection): LearningSkillModule | undefined {
    return this.modules.get(skill)
  }

  getAll(): LearningSkillModule[] {
    return Array.from(this.modules.values())
  }

  getRegisteredSkills(): IELTSSection[] {
    return Array.from(this.modules.keys())
  }

  isRegistered(skill: IELTSSection): boolean {
    return this.modules.has(skill)
  }
}
