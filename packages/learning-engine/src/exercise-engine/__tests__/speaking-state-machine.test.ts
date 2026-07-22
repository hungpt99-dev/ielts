import { describe, it, expect } from 'vitest'
import { createSpeakingState, canProvideHints, canProvideFeedback, canCorrectLearner, isExamSimulation, nextPhase, SPEAKING_PHASE_ORDER, getPhaseDuration } from '../domain/ielts/speaking-state-machine'
import type { SpeakingPhase } from '../domain/ielts/speaking-state-machine'

describe('Speaking State Machine', () => {
  it('practice mode allows hints and feedback', () => {
    const state = createSpeakingState('practice')
    expect(canProvideHints(state)).toBe(true)
    expect(canCorrectLearner(state)).toBe(true)
  })

  it('exam mode hides hints and feedback during test', () => {
    const state = createSpeakingState('exam')
    state.phase = 'part1'
    expect(canProvideHints(state)).toBe(false)
    expect(canCorrectLearner(state)).toBe(false)
    expect(canProvideFeedback(state)).toBe(false)
  })

  it('exam mode reveals feedback only at conclusion', () => {
    const state = createSpeakingState('exam')
    state.phase = 'conclusion'
    expect(canProvideFeedback(state)).toBe(true)
  })

  it('phases progress in correct order', () => {
    let phase: SpeakingPhase = 'introduction'
    const order: string[] = [phase]
    for (let i = 0; i < SPEAKING_PHASE_ORDER.length - 1; i++) {
      phase = nextPhase(phase)
      order.push(phase)
    }
    expect(order).toEqual(SPEAKING_PHASE_ORDER)
  })

  it('last phase does not advance', () => {
    expect(nextPhase('conclusion')).toBe('conclusion')
  })

  it('Part 2 has 60s preparation and 120s speaking', () => {
    expect(getPhaseDuration('part2-preparation')).toBe(60)
    expect(getPhaseDuration('part2-speaking')).toBe(120)
  })

  it('isExamSimulation detects exam mode', () => {
    expect(isExamSimulation(createSpeakingState('exam'))).toBe(true)
    expect(isExamSimulation(createSpeakingState('practice'))).toBe(false)
  })
})
