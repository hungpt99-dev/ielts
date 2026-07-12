import { useState, useCallback, useRef } from 'react'
import type { RoadmapData } from '../roadmapService'
import { saveRoadmap } from '../roadmapService'

export interface RoadmapEditor {
  roadmap: RoadmapData | null
  isEditMode: boolean
  toggleEditMode: () => void
  enterEditMode: () => void
  exitEditMode: () => void
  applyCommand: (command: (r: RoadmapData) => RoadmapData) => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  loadRoadmap: (data: RoadmapData) => void
}

export function useRoadmapEditor(): RoadmapEditor {
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [pastStates, setPastStates] = useState<RoadmapData[]>([])
  const [futureStates, setFutureStates] = useState<RoadmapData[]>([])
  const roadmapRef = useRef<RoadmapData | null>(null)

  const loadRoadmap = useCallback((data: RoadmapData) => {
    setRoadmap(data)
    roadmapRef.current = data
    setPastStates([])
    setFutureStates([])
    setIsEditMode(false)
  }, [])

  const applyCommand = useCallback((command: (r: RoadmapData) => RoadmapData) => {
    setRoadmap(prev => {
      if (!prev) return prev
      const updated = command(prev)
      roadmapRef.current = updated
      setPastStates(p => [...p, prev])
      setFutureStates([])
      saveRoadmap(updated)
      return updated
    })
  }, [])

  const undo = useCallback(() => {
    if (pastStates.length === 0) return
    const prev = pastStates[pastStates.length - 1]
    roadmapRef.current = prev
    setPastStates(p => p.slice(0, -1))
    setRoadmap(prev => {
      setFutureStates(f => [prev, ...f])
      return prev
    })
  }, [pastStates])

  const redo = useCallback(() => {
    if (futureStates.length === 0) return
    const next = futureStates[0]
    roadmapRef.current = next
    setFutureStates(f => f.slice(1))
    setRoadmap(prev => {
      setPastStates(p => [...p, prev])
      return next
    })
  }, [futureStates])

  const enterEditMode = useCallback(() => {
    setPastStates([])
    setFutureStates([])
    setIsEditMode(true)
  }, [])

  const exitEditMode = useCallback(() => {
    setPastStates([])
    setFutureStates([])
    setIsEditMode(false)
  }, [])

  const toggleEditMode = useCallback(() => {
    setIsEditMode(prev => !prev)
  }, [])

  return {
    roadmap,
    isEditMode,
    enterEditMode,
    exitEditMode,
    toggleEditMode,
    applyCommand,
    undo,
    redo,
    canUndo: pastStates.length > 0,
    canRedo: futureStates.length > 0,
    loadRoadmap,
  }
}
