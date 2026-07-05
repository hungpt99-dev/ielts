import type { ProviderConfig } from '@ielts/ai'
import type {
  StudyPlanUserProfile,
  StudyPlanCalculatedMeta,
  StudyPlanData,
  DailyPlanItem,
  GlobalStudyStrategy,
  PlanChunkRequest,
  GenerationProgress,
  GenerationStep,
  GenerationState,
  ContinueGenerationOptions,
} from './types'
import { calculatePlanMeta, calculateDefaultChunkSize } from './utils/dateUtils'
import { validateFullPlan, findMissingRanges, findMissingDayNumbers } from './utils/validation'
import { generateGlobalStudyStrategy } from './services/globalStrategyService'
import { generateDailyPlanChunk } from './services/dailyPlanService'
import { StudyPlanStore } from './storage/studyPlanStore'

export interface OrchestratorOptions {
  profile: StudyPlanUserProfile
  getConfig: () => ProviderConfig | null
  chunkSize?: number
  modelCapacity?: 'small' | 'medium' | 'large'
  signal?: AbortSignal
  onProgress?: (progress: GenerationProgress) => void
  existingPlanId?: string
  continueOptions?: ContinueGenerationOptions
}

export interface OrchestratorResult {
  plan: StudyPlanData | null
  error: string | null
  state: GenerationState
}

function makeProgress(
  step: GenerationStep,
  chunkIndex: number,
  totalChunks: number,
  currentDayStart: number,
  currentDayEnd: number,
  totalDays: number,
  generatedDays: number,
  message: string,
): GenerationProgress {
  return { step, chunkIndex, totalChunks, currentDayStart, currentDayEnd, totalDays, generatedDays, message }
}

function getChunkSize(options: OrchestratorOptions): number {
  if (options.chunkSize != null && options.chunkSize > 0) return options.chunkSize
  const capacity = options.modelCapacity ?? 'small'
  return calculateDefaultChunkSize(capacity)
}

async function createOrLoadPlan(
  profile: StudyPlanUserProfile,
  calculatedMeta: StudyPlanCalculatedMeta,
  existingPlanId?: string,
): Promise<{ plan: StudyPlanData | null; isNew: boolean; error: string | null }> {
  if (existingPlanId) {
    const existing = await StudyPlanStore.getPlan(existingPlanId)
    if (existing) {
      return { plan: existing, isNew: false, error: null }
    }
    return { plan: null, isNew: false, error: `Plan not found: ${existingPlanId}` }
  }

  const plan = await StudyPlanStore.saveProfileAndMeta(profile, calculatedMeta)
  return { plan, isNew: true, error: null }
}

export async function generateStudyPlan(
  options: OrchestratorOptions,
): Promise<OrchestratorResult> {
  const { profile, getConfig, signal, onProgress, existingPlanId, continueOptions } = options

  const calculatedMeta = calculatePlanMeta(profile)
  const chunkSize = getChunkSize(options)
  const totalDays = calculatedMeta.totalDays
  const totalChunks = Math.ceil(totalDays / chunkSize)

  const state: GenerationState = {
    planId: null,
    strategy: null,
    dailyPlans: [],
    generatedDayNumbers: new Set(),
    failedChunks: [],
    missingDayNumbers: [],
    status: 'draft',
    progress: makeProgress('creating-strategy', 0, totalChunks, 0, 0, totalDays, 0, 'Planning your IELTS study journey'),
    error: null,
  }

  function emitProgress(overrides: Partial<GenerationProgress> = {}): void {
    const p = { ...state.progress, ...overrides }
    state.progress = p
    onProgress?.(p)
  }

  try {
    const { plan: planData, isNew, error: planError } = await createOrLoadPlan(profile, calculatedMeta, existingPlanId)
    if (planError || !planData) {
      state.status = 'failed'
      state.error = planError ?? 'Failed to create plan'
      return { plan: null, error: state.error, state }
    }

    state.planId = planData.id

    if (continueOptions?.retainExistingDays !== false && !isNew) {
      const existingDays = await StudyPlanStore.getDailyPlans(planData.id)
      state.dailyPlans = existingDays
      for (const d of existingDays) {
        state.generatedDayNumbers.add(d.dayNumber)
      }
    }

    if (isNew || !planData.globalStrategy?.planSummary) {
      emitProgress(makeProgress('creating-strategy', 0, totalChunks, 0, 0, totalDays, state.generatedDayNumbers.size, 'Creating global study strategy'))

      const strategyResult = await generateGlobalStudyStrategy(profile, calculatedMeta, getConfig)
      if (strategyResult.error || !strategyResult.data) {
        state.status = 'failed'
        state.error = strategyResult.error ?? 'Failed to generate strategy'
        await StudyPlanStore.updatePlanMeta(planData.id, { status: 'failed' })
        return { plan: await StudyPlanStore.getPlan(planData.id), error: state.error, state }
      }

      state.strategy = strategyResult.data
      await StudyPlanStore.saveGlobalStrategy(planData.id, strategyResult.data)
      await StudyPlanStore.updatePlanMeta(planData.id, { status: 'generating' })
    } else {
      state.strategy = planData.globalStrategy
      await StudyPlanStore.updatePlanMeta(planData.id, { status: 'generating' })
    }

    while (true) {
      if (signal?.aborted) {
        state.status = 'cancelled'
        state.error = 'Generation cancelled by user'
        await StudyPlanStore.updatePlanMeta(planData.id, { status: 'cancelled' })
        return { plan: await StudyPlanStore.getPlan(planData.id), error: state.error, state }
      }

      state.missingDayNumbers = findMissingDayNumbers(state.dailyPlans, calculatedMeta)

      if (state.missingDayNumbers.length === 0) {
        break
      }

      const existingDayNumbers = new Set(state.dailyPlans.map(d => d.dayNumber))
      const missingRanges = findMissingRanges(
        state.dailyPlans,
        calculatedMeta,
        chunkSize,
      )

      if (missingRanges.length === 0) {
        break
      }

      const range = missingRanges[0]
      const chunkIndex = state.failedChunks.length > 0
        ? state.failedChunks[0]
        : Math.floor((range.startDayNumber - 1) / chunkSize)

      state.status = 'generating'

      const dayNumbers = range.dayNumbers.filter(dn => !existingDayNumbers.has(dn))

      if (dayNumbers.length === 0) {
        state.missingDayNumbers = findMissingDayNumbers(state.dailyPlans, calculatedMeta)
        continue
      }

      const sortedDays = [...state.dailyPlans].sort((a, b) => a.dayNumber - b.dayNumber)
      const previousChunkSummary = sortedDays.length > 0
        ? `Generated through Day ${sortedDays[sortedDays.length - 1].dayNumber} (${sortedDays[sortedDays.length - 1].date}). Phase: ${sortedDays[sortedDays.length - 1].phaseName}.`
        : null

      const alreadyGeneratedDays = sortedDays.map(d => ({
        dayNumber: d.dayNumber,
        date: d.date,
        phase: d.phaseName,
      }))

      emitProgress(makeProgress(
        'generating-chunk',
        chunkIndex,
        totalChunks,
        dayNumbers[0],
        dayNumbers[dayNumbers.length - 1],
        totalDays,
        state.generatedDayNumbers.size,
        `Generating days ${dayNumbers[0]} to ${dayNumbers[dayNumbers.length - 1]} of ${totalDays}`,
      ))

      const chunkRequest: PlanChunkRequest = {
        userProfile: profile,
        calculatedMeta,
        globalStrategy: state.strategy!,
        alreadyGeneratedDays,
        chunkStartDate: range.startDate,
        chunkEndDate: range.endDate,
        chunkDayNumbers: dayNumbers,
        chunkIndex,
        totalChunks,
        previousChunkSummary,
      }

      emitProgress(makeProgress(
        'validating-chunk',
        chunkIndex,
        totalChunks,
        dayNumbers[0],
        dayNumbers[dayNumbers.length - 1],
        totalDays,
        state.generatedDayNumbers.size,
        `Validating days ${dayNumbers[0]} to ${dayNumbers[dayNumbers.length - 1]}`,
      ))

      const chunkResult = await generateDailyPlanChunk(chunkRequest, planData.id, getConfig)

      if (signal?.aborted) {
        state.status = 'cancelled'
        state.error = 'Generation cancelled by user'
        await StudyPlanStore.updatePlanMeta(planData.id, { status: 'cancelled' })
        return { plan: await StudyPlanStore.getPlan(planData.id), error: state.error, state }
      }

      if (chunkResult.error || !chunkResult.data) {
        const failMsg = chunkResult.error ?? 'Unknown chunk generation error'
        state.failedChunks.push(chunkIndex)

        if (state.failedChunks.length >= 3) {
          state.status = 'failed'
          state.error = `Generation failed after ${state.failedChunks.length} retries. Last error: ${failMsg}`
          await StudyPlanStore.updatePlanMeta(planData.id, { status: 'failed' })
          return { plan: await StudyPlanStore.getPlan(planData.id), error: state.error, state }
        }

        emitProgress(makeProgress(
          'repairing-days',
          chunkIndex,
          totalChunks,
          dayNumbers[0],
          dayNumbers[dayNumbers.length - 1],
          totalDays,
          state.generatedDayNumbers.size,
          `Retrying days ${dayNumbers[0]} to ${dayNumbers[dayNumbers.length - 1]}`,
        ))
        continue
      }

      state.failedChunks = []

      const savedDays = await StudyPlanStore.saveDailyPlans(planData.id, chunkResult.data)
      for (const d of savedDays) {
        const existingIndex = state.dailyPlans.findIndex(p => p.dayNumber === d.dayNumber)
        if (existingIndex >= 0) {
          state.dailyPlans[existingIndex] = d
        } else {
          state.dailyPlans.push(d)
        }
        state.generatedDayNumbers.add(d.dayNumber)
      }

      state.dailyPlans.sort((a, b) => a.dayNumber - b.dayNumber)

      const generatedCount = state.dailyPlans.length
      const percentage = totalDays > 0 ? Math.round((generatedCount / totalDays) * 100) : 0

      await StudyPlanStore.updatePlanMeta(planData.id, {
        progress: { generatedDays: generatedCount, totalDays, percentage },
      })
    }

    const fullValidation = validateFullPlan(state.dailyPlans, calculatedMeta)

    if (fullValidation.isValid) {
      state.status = 'complete'
      emitProgress(makeProgress(
        'finalizing',
        totalChunks,
        totalChunks,
        totalDays,
        totalDays,
        totalDays,
        totalDays,
        'Your IELTS study plan is ready!',
      ))

      await StudyPlanStore.updatePlanMeta(planData.id, {
        status: 'complete',
        progress: { generatedDays: totalDays, totalDays, percentage: 100 },
      })

      const finalPlan = await StudyPlanStore.getPlan(planData.id)
      return { plan: finalPlan, error: null, state }
    }

    const remainingMissing = findMissingDayNumbers(state.dailyPlans, calculatedMeta)

    if (remainingMissing.length > 0) {
      state.status = 'partial'
      state.error = `Plan has ${remainingMissing.length} missing day(s). Use continueGeneration to fill them.`
      await StudyPlanStore.updatePlanMeta(planData.id, {
        status: 'partial',
        progress: {
          generatedDays: state.dailyPlans.length,
          totalDays,
          percentage: Math.round((state.dailyPlans.length / totalDays) * 100),
        },
      })

      return {
        plan: await StudyPlanStore.getPlan(planData.id),
        error: state.error,
        state,
      }
    }

    state.status = 'complete'
    emitProgress(makeProgress(
      'finalizing',
      totalChunks,
      totalChunks,
      totalDays,
      totalDays,
      totalDays,
      totalDays,
      'Your IELTS study plan is ready!',
    ))

    await StudyPlanStore.updatePlanMeta(planData.id, {
      status: 'complete',
      progress: { generatedDays: totalDays, totalDays, percentage: 100 },
    })

    return { plan: await StudyPlanStore.getPlan(planData.id), error: null, state }
  } catch (err) {
    state.status = 'failed'
    state.error = err instanceof Error ? err.message : 'Unknown error during plan generation'
    if (state.planId) {
      await StudyPlanStore.updatePlanMeta(state.planId, { status: 'failed' }).catch(() => {})
    }
    return { plan: state.planId ? await StudyPlanStore.getPlan(state.planId).catch(() => null) : null, error: state.error, state }
  }
}

export async function continueGeneration(
  planId: string,
  getConfig: () => ProviderConfig | null,
  options?: {
    signal?: AbortSignal
    onProgress?: (progress: GenerationProgress) => void
    chunkSize?: number
    modelCapacity?: 'small' | 'medium' | 'large'
    continueOptions?: ContinueGenerationOptions
  },
): Promise<OrchestratorResult> {
  const plan = await StudyPlanStore.getPlan(planId)
  if (!plan) {
    return {
      plan: null,
      error: `Plan not found: ${planId}`,
      state: {
        planId: null,
        strategy: null,
        dailyPlans: [],
        generatedDayNumbers: new Set(),
        failedChunks: [],
        missingDayNumbers: [],
        status: 'failed',
        progress: makeProgress('finalizing', 0, 0, 0, 0, 0, 0, 'Plan not found'),
        error: `Plan not found: ${planId}`,
      },
    }
  }

  return generateStudyPlan({
    profile: plan.profileSnapshot,
    getConfig,
    signal: options?.signal,
    onProgress: options?.onProgress,
    chunkSize: options?.chunkSize,
    modelCapacity: options?.modelCapacity,
    existingPlanId: planId,
    continueOptions: options?.continueOptions ?? {
      retainExistingDays: true,
      retryFailedChunks: true,
      fillMissingDays: true,
    },
  })
}

export async function deletePlan(planId: string): Promise<void> {
  await StudyPlanStore.deletePlan(planId)
}

export async function getGenerationState(planId: string): Promise<GenerationState | null> {
  const plan = await StudyPlanStore.getPlan(planId)
  if (!plan) return null

  const generatedDayNumbers = new Set(plan.dailyPlans.map(d => d.dayNumber))
  const missingDayNumbers = findMissingDayNumbers(plan.dailyPlans, plan.calculatedMeta)
  const totalDays = plan.calculatedMeta.totalDays
  const chunkSize = calculateDefaultChunkSize('small')
  const totalChunks = Math.ceil(totalDays / chunkSize)

  return {
    planId: plan.id,
    strategy: plan.globalStrategy,
    dailyPlans: plan.dailyPlans,
    generatedDayNumbers,
    failedChunks: [],
    missingDayNumbers,
    status: plan.status,
    progress: makeProgress(
      plan.status === 'complete' ? 'finalizing' : 'generating-chunk',
      0,
      totalChunks,
      0,
      0,
      totalDays,
      generatedDayNumbers.size,
      plan.status === 'complete'
        ? 'Plan is complete'
        : `Generated ${generatedDayNumbers.size} of ${totalDays} days`,
    ),
    error: null,
  }
}

export type { GenerationState, GenerationProgress, OrchestratorOptions, OrchestratorResult }
