import { useState, useCallback } from 'react'
import type { RoadmapData } from '../roadmapService'
import { saveRoadmap } from '../roadmapService'

export interface RoadmapEditor {
  roadmap: RoadmapData | null
  isEditMode: boolean
  toggleEditMode: () => void
  applyCommand: (command: (r: RoadmapData) => RoadmapData | Promise<RoadmapData>) => Promise<void>
  loadRoadmap: (data: RoadmapData) => void
}

export function useRoadmapEditor(): RoadmapEditor {
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)

  const loadRoadmap = useCallback((data: RoadmapData) => {
    saveRoadmap(data)
    setRoadmap(data)
    setIsEditMode(false)
  }, [])

  const applyCommand = useCallback(async (command: (r: RoadmapData) => RoadmapData | Promise<RoadmapData>) => {
    if (!roadmap) return
    const updated = await command(roadmap)
    saveRoadmap(updated)
    setRoadmap(updated)
  }, [roadmap])

  const toggleEditMode = useCallback(() => {
    setIsEditMode(prev => !prev)
  }, [])

  return { roadmap, isEditMode, toggleEditMode, applyCommand, loadRoadmap }
}
