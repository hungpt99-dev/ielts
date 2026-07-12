import { useState, useCallback, useRef } from 'react'
import type { RoadmapData } from '../roadmapService'
import { saveRoadmap } from '../roadmapService'

export interface RoadmapEditor {
  roadmap: RoadmapData | null
  isEditMode: boolean
  toggleEditMode: () => void
  applyCommand: (command: (r: RoadmapData) => RoadmapData) => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  loadRoadmap: (data: RoadmapData) => void
}

interface State {
  roadmap: RoadmapData | null
  isEditMode: boolean
  pastStates: RoadmapData[]
  futureStates: RoadmapData[]
}

export function useRoadmapEditor(): RoadmapEditor {
  const [state, setState] = useState<State>({
    roadmap: null,
    isEditMode: false,
    pastStates: [],
    futureStates: [],
  })
  const stateRef = useRef(state)
  stateRef.current = state

  const loadRoadmap = useCallback((data: RoadmapData) => {
    setState({
      roadmap: data,
      isEditMode: false,
      pastStates: [],
      futureStates: [],
    })
  }, [])

  const applyCommand = useCallback((command: (r: RoadmapData) => RoadmapData) => {
    const s = stateRef.current
    if (!s.roadmap) return
    const updated = command(s.roadmap)
    saveRoadmap(updated)
    setState({
      ...s,
      roadmap: updated,
      pastStates: [...s.pastStates, s.roadmap],
      futureStates: [],
    })
  }, [])

  const undo = useCallback(() => {
    const s = stateRef.current
    if (s.pastStates.length === 0) return
    const prev = s.pastStates[s.pastStates.length - 1]
    setState({
      ...s,
      roadmap: prev,
      pastStates: s.pastStates.slice(0, -1),
      futureStates: s.roadmap ? [s.roadmap, ...s.futureStates] : s.futureStates,
    })
  }, [])

  const redo = useCallback(() => {
    const s = stateRef.current
    if (s.futureStates.length === 0) return
    const next = s.futureStates[0]
    setState({
      ...s,
      roadmap: next,
      futureStates: s.futureStates.slice(1),
      pastStates: s.roadmap ? [...s.pastStates, s.roadmap] : s.pastStates,
    })
  }, [])

  const toggleEditMode = useCallback(() => {
    setState(prev => ({
      ...prev,
      isEditMode: !prev.isEditMode,
    }))
  }, [])

  return {
    roadmap: state.roadmap,
    isEditMode: state.isEditMode,
    toggleEditMode,
    applyCommand,
    undo,
    redo,
    canUndo: state.pastStates.length > 0,
    canRedo: state.futureStates.length > 0,
    loadRoadmap,
  }
}
