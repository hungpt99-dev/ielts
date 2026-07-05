import { createContext, useContext, useCallback, useRef, useState, useEffect } from 'react'
import type { StudyPlanUserProfile, StudyPlanData, DailyPlanItem, DailyPlanStatus, GenerationProgress, GenerationState } from '../types'
import { generateStudyPlan, continueGeneration, deletePlan as deletePlanOrchestrator, getGenerationState as fetchGenerationState } from '../orchestrator'
import { StudyPlanStore } from '../storage/studyPlanStore'
import type { ProviderConfig } from '@ielts/ai'

interface StartGenerationOptions {
  chunkSize?: number
  modelCapacity?: 'small' | 'medium' | 'large'
  existingPlanId?: string
}

interface ResumeGenerationOptions {
  chunkSize?: number
  modelCapacity?: 'small' | 'medium' | 'large'
}

interface UseStudyPlanState {
  plan: StudyPlanData | null
  generationState: GenerationState | null
  isGenerating: boolean
  currentProgress: GenerationProgress | null
  progressMessages: Array<{ message: string; timestamp: number }>
  error: string | null
  planList: StudyPlanData[]
}

interface UseStudyPlanActions {
  startGeneration: (profile: StudyPlanUserProfile, options?: StartGenerationOptions) => Promise<void>
  cancelGeneration: () => void
  resumeGeneration: (planId: string, options?: ResumeGenerationOptions) => Promise<void>
  retryFailedChunk: () => Promise<void>
  regenerateFullPlan: (profile: StudyPlanUserProfile, options?: StartGenerationOptions) => Promise<void>
  updateDailyPlanStatus: (planId: string, date: string, status: DailyPlanStatus) => Promise<void>
  updateDailyPlan: (planId: string, date: string, changes: Partial<DailyPlanItem>) => Promise<void>
  deletePlan: (planId: string) => Promise<void>
  loadPlan: (planId: string) => Promise<void>
  loadAllPlans: () => Promise<void>
}

interface StudyPlanContextValue {
  state: UseStudyPlanState
  actions: UseStudyPlanActions
}

const initialState: UseStudyPlanState = {
  plan: null,
  generationState: null,
  isGenerating: false,
  currentProgress: null,
  progressMessages: [],
  error: null,
  planList: [],
}

const StudyPlanContext = createContext<StudyPlanContextValue | null>(null)

function getConfig(): ProviderConfig | null {
  try {
    const raw = localStorage.getItem('ielts-ai-config')
    if (!raw) return null
    return JSON.parse(raw) as ProviderConfig
  } catch {
    return null
  }
}

export function StudyPlanProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<UseStudyPlanState>(initialState)
  const abortRef = useRef<AbortController | null>(null)
  const retryProfileRef = useRef<StudyPlanUserProfile | null>(null)
  const retryPlanIdRef = useRef<string | null>(null)
  const isGeneratingRef = useRef(false)

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const addProgressMessage = useCallback((message: string) => {
    setState(prev => {
      const messages = [...prev.progressMessages, { message, timestamp: Date.now() }]
      if (messages.length > 100) messages.splice(0, messages.length - 100)
      return { ...prev, progressMessages: messages }
    })
  }, [])

  const onProgress = useCallback((progress: GenerationProgress) => {
    setState(prev => ({
      ...prev,
      currentProgress: progress,
      isGenerating: true,
    }))
    addProgressMessage(progress.message)
  }, [addProgressMessage])

  const startGeneration = useCallback(async (
    profile: StudyPlanUserProfile,
    options?: StartGenerationOptions,
  ) => {
    abortRef.current?.abort()
    const abortController = new AbortController()
    abortRef.current = abortController
    isGeneratingRef.current = true
    retryProfileRef.current = profile
    retryPlanIdRef.current = null

    setState(prev => ({
      ...prev,
      isGenerating: true,
      error: null,
      currentProgress: null,
      progressMessages: [{ message: 'Planning your IELTS study journey', timestamp: Date.now() }],
    }))

    try {
      const result = await generateStudyPlan({
        profile,
        getConfig,
        signal: abortController.signal,
        onProgress,
        chunkSize: options?.chunkSize,
        modelCapacity: options?.modelCapacity,
        existingPlanId: options?.existingPlanId,
      })

      if (!isGeneratingRef.current) return

      setState(prev => ({
        ...prev,
        plan: result.plan,
        generationState: result.state,
        isGenerating: result.state.status === 'generating',
        error: result.error,
        currentProgress: result.state.progress,
      }))
    } catch (err) {
      if (!isGeneratingRef.current) return
      if (abortController.signal.aborted) return

      const message = err instanceof Error ? err.message : 'Failed to generate study plan'
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: message,
      }))
      addProgressMessage(`Error: ${message}`)
    } finally {
      isGeneratingRef.current = false
    }
  }, [onProgress, addProgressMessage])

  const cancelGeneration = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    isGeneratingRef.current = false
    setState(prev => ({
      ...prev,
      plan: prev.plan ? { ...prev.plan, status: 'cancelled' as const } : prev.plan,
      generationState: prev.generationState
        ? { ...prev.generationState, status: 'cancelled' as const }
        : prev.generationState,
      isGenerating: false,
      currentProgress: null,
      error: 'Generation cancelled by user',
    }))
    addProgressMessage('Generation cancelled')
  }, [addProgressMessage])

  const resumeGeneration = useCallback(async (
    planId: string,
    options?: ResumeGenerationOptions,
  ) => {
    abortRef.current?.abort()
    const abortController = new AbortController()
    abortRef.current = abortController
    isGeneratingRef.current = true
    retryPlanIdRef.current = planId

    setState(prev => ({
      ...prev,
      isGenerating: true,
      error: null,
    }))

    try {
      const result = await continueGeneration(planId, getConfig, {
        signal: abortController.signal,
        onProgress,
        chunkSize: options?.chunkSize,
        modelCapacity: options?.modelCapacity,
        continueOptions: {
          retainExistingDays: true,
          retryFailedChunks: true,
          fillMissingDays: true,
        },
      })

      if (!isGeneratingRef.current) return

      setState(prev => ({
        ...prev,
        plan: result.plan,
        generationState: result.state,
        isGenerating: result.state.status === 'generating',
        error: result.error,
        currentProgress: result.state.progress,
      }))
    } catch (err) {
      if (!isGeneratingRef.current) return
      if (abortController.signal.aborted) return

      const message = err instanceof Error ? err.message : 'Failed to resume generation'
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: message,
      }))
      addProgressMessage(`Error: ${message}`)
    } finally {
      isGeneratingRef.current = false
    }
  }, [onProgress, addProgressMessage])

  const retryFailedChunk = useCallback(async () => {
    const planId = retryPlanIdRef.current ?? state.plan?.id
    if (!planId) {
      setState(prev => ({ ...prev, error: 'No plan to retry' }))
      return
    }
    return resumeGeneration(planId)
  }, [state.plan?.id, resumeGeneration])

  const regenerateFullPlan = useCallback(async (
    profile: StudyPlanUserProfile,
    options?: StartGenerationOptions,
  ) => {
    const existingPlanId = state.plan?.id
    if (existingPlanId) {
      await StudyPlanStore.deleteDailyPlans(existingPlanId)
    }
    return startGeneration(profile, { ...options, existingPlanId })
  }, [state.plan?.id, startGeneration])

  const updateDailyPlanStatus = useCallback(async (
    planId: string,
    date: string,
    status: DailyPlanStatus,
  ) => {
    try {
      await StudyPlanStore.updateDailyPlanStatus(planId, date, status)
      setState(prev => {
        if (!prev.plan) return prev
        const updatedPlans = prev.plan.dailyPlans.map(d =>
          d.date === date ? { ...d, status } : d,
        )
        return {
          ...prev,
          plan: { ...prev.plan, dailyPlans: updatedPlans },
          generationState: prev.generationState
            ? { ...prev.generationState, dailyPlans: updatedPlans }
            : null,
        }
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update daily plan status'
      setState(prev => ({ ...prev, error: message }))
    }
  }, [])

  const updateDailyPlan = useCallback(async (
    planId: string,
    date: string,
    changes: Partial<DailyPlanItem>,
  ) => {
    try {
      await StudyPlanStore.updateDailyPlan(planId, date, changes)
      setState(prev => {
        if (!prev.plan) return prev
        const updatedPlans = prev.plan.dailyPlans.map(d =>
          d.date === date ? { ...d, ...changes } : d,
        )
        return {
          ...prev,
          plan: { ...prev.plan, dailyPlans: updatedPlans },
          generationState: prev.generationState
            ? { ...prev.generationState, dailyPlans: updatedPlans }
            : null,
        }
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update daily plan'
      setState(prev => ({ ...prev, error: message }))
    }
  }, [])

  const deletePlan = useCallback(async (planId: string) => {
    try {
      await deletePlanOrchestrator(planId)
      setState(prev => {
        const planList = prev.planList.filter(p => p.id !== planId)
        const plan = prev.plan?.id === planId ? null : prev.plan
        const generationState = prev.generationState?.planId === planId ? null : prev.generationState
        return { ...prev, plan, generationState, planList }
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete plan'
      setState(prev => ({ ...prev, error: message }))
    }
  }, [])

  const loadPlan = useCallback(async (planId: string) => {
    try {
      const plan = await StudyPlanStore.getPlan(planId)
      const generationState = await fetchGenerationState(planId)
      setState(prev => ({
        ...prev,
        plan,
        generationState,
        error: null,
      }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load plan'
      setState(prev => ({ ...prev, error: message }))
    }
  }, [])

  const loadAllPlans = useCallback(async () => {
    try {
      const planList = await StudyPlanStore.getAllPlans()
      setState(prev => ({ ...prev, planList, error: null }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load plans'
      setState(prev => ({ ...prev, error: message }))
    }
  }, [])

  const actions: UseStudyPlanActions = {
    startGeneration,
    cancelGeneration,
    resumeGeneration,
    retryFailedChunk,
    regenerateFullPlan,
    updateDailyPlanStatus,
    updateDailyPlan,
    deletePlan,
    loadPlan,
    loadAllPlans,
  }

  return (
    <StudyPlanContext.Provider value={{ state, actions }}>
      {children}
    </StudyPlanContext.Provider>
  )
}

export function useStudyPlan(): StudyPlanContextValue {
  const ctx = useContext(StudyPlanContext)
  if (!ctx) {
    throw new Error('useStudyPlan must be used within a StudyPlanProvider')
  }
  return ctx
}

export default useStudyPlan
