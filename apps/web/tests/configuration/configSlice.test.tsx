import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createDefaultConfiguration } from '../../src/features/configuration/storage'

function getMockState() {
  if (!globalThis.__configMockState) {
    globalThis.__configMockState = {
      config: createDefaultConfiguration(),
      actions: {
        updateBasic: vi.fn(),
        updateBasicField: vi.fn(),
        updateAdvanced: vi.fn(),
        updateAdvancedField: vi.fn(),
        updateTutorConfig: vi.fn(),
        addProvider: vi.fn(),
        updateProvider: vi.fn(),
        removeProvider: vi.fn(),
        setActiveProvider: vi.fn(),
        resetConfig: vi.fn(),
      },
    }
  }
  return globalThis.__configMockState
}

vi.mock('../../src/features/configuration/configSlice', () => ({
  ConfigProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useConfiguration: () => ({
    config: getMockState().config,
    actions: getMockState().actions,
  }),
}))

beforeEach(() => {
  Object.assign(getMockState().config, createDefaultConfiguration())
  vi.clearAllMocks()
  localStorage.clear()
})

describe('ConfigActions', () => {
  it('updateBasic patches basic configuration', () => {
    const { result } = renderHook(() => useConfiguration())
    act(() => { result.current.actions.updateBasic({ targetBand: 8.5 }) })
    expect(getMockState().actions.updateBasic).toHaveBeenCalledWith({ targetBand: 8.5 })
  })

  it('updateBasicField updates a single field', () => {
    const { result } = renderHook(() => useConfiguration())
    act(() => { result.current.actions.updateBasicField('targetBand', 9) })
    expect(getMockState().actions.updateBasicField).toHaveBeenCalledWith('targetBand', 9)
  })

  it('updateAdvanced patches advanced configuration', () => {
    const { result } = renderHook(() => useConfiguration())
    act(() => { result.current.actions.updateAdvanced({ activeProviderId: 'p2' }) })
    expect(getMockState().actions.updateAdvanced).toHaveBeenCalledWith({ activeProviderId: 'p2' })
  })

  it('addProvider adds a new provider', () => {
    const { result } = renderHook(() => useConfiguration())
    const provider = {
      providerId: 'p2',
      provider: 'claude' as const,
      apiKey: '',
      baseUrl: '',
      model: 'claude-3',
      temperature: 0.5,
      maxTokens: 4096,
      systemPrompt: '',
      costLimit: 20,
      usageLimit: 500,
      fallbackProvider: null,
    }
    act(() => { result.current.actions.addProvider(provider) })
    expect(getMockState().actions.addProvider).toHaveBeenCalledWith(provider)
  })

  it('setActiveProvider switches active provider', () => {
    const { result } = renderHook(() => useConfiguration())
    act(() => { result.current.actions.setActiveProvider('p2') })
    expect(getMockState().actions.setActiveProvider).toHaveBeenCalledWith('p2')
  })

  it('resetConfig resets to defaults', () => {
    const { result } = renderHook(() => useConfiguration())
    act(() => { result.current.actions.resetConfig() })
    expect(getMockState().actions.resetConfig).toHaveBeenCalled()
  })

  it('updateTutorConfig updates tutor behavior', () => {
    const { result } = renderHook(() => useConfiguration())
    act(() => { result.current.actions.updateTutorConfig({ mode: 'strict-examiner' }) })
    expect(getMockState().actions.updateTutorConfig).toHaveBeenCalledWith({ mode: 'strict-examiner' })
  })

  it('updateProvider patches a specific provider', () => {
    const { result } = renderHook(() => useConfiguration())
    act(() => { result.current.actions.updateProvider('default-openai', { temperature: 0.3 }) })
    expect(getMockState().actions.updateProvider).toHaveBeenCalledWith('default-openai', { temperature: 0.3 })
  })

  it('removeProvider removes a provider', () => {
    const { result } = renderHook(() => useConfiguration())
    act(() => { result.current.actions.removeProvider('default-openai') })
    expect(getMockState().actions.removeProvider).toHaveBeenCalledWith('default-openai')
  })
})

function useConfiguration() {
  return { config: getMockState().config, actions: getMockState().actions }
}

declare global {
  var __configMockState:
    | { config: ReturnType<typeof createDefaultConfiguration>; actions: Record<string, ReturnType<typeof vi.fn>> }
    | undefined
}
