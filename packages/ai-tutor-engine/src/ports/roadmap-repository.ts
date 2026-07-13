import type { RoadmapContext } from '../domain/entities/learner-context'

export interface RoadmapRepository {
  getActiveRoadmap(): Promise<RoadmapContext | null>
}
