import type { ProviderModelCapability } from '@ielts/config'

export interface ModelCapabilities {
  supportsTemperature: boolean
  supportsMaxTokens: boolean
  supportsMaxCompletionTokens: boolean
  supportsReasoningEffort: boolean
  minTemperature?: number
  maxTemperature?: number
}

function capabilities(
  overrides: Partial<ModelCapabilities> = {},
): ModelCapabilities {
  return {
    supportsTemperature: true,
    supportsMaxTokens: true,
    supportsMaxCompletionTokens: false,
    supportsReasoningEffort: false,
    ...overrides,
  }
}

const CAPABILITIES: Record<string, ModelCapabilities> = {
  'o1': capabilities({
    supportsTemperature: false,
    supportsMaxTokens: false,
    supportsMaxCompletionTokens: true,
  }),
  'o1-mini': capabilities({
    supportsTemperature: false,
    supportsMaxTokens: false,
    supportsMaxCompletionTokens: true,
  }),
  'o1-pro': capabilities({
    supportsTemperature: false,
    supportsMaxTokens: false,
    supportsMaxCompletionTokens: true,
  }),
  'o3': capabilities({
    supportsTemperature: false,
    supportsMaxTokens: false,
    supportsMaxCompletionTokens: true,
    supportsReasoningEffort: true,
  }),
  'o3-mini': capabilities({
    supportsTemperature: false,
    supportsMaxTokens: false,
    supportsMaxCompletionTokens: true,
    supportsReasoningEffort: true,
  }),
  'o4-mini': capabilities({
    supportsTemperature: false,
    supportsMaxTokens: false,
    supportsMaxCompletionTokens: true,
    supportsReasoningEffort: true,
  }),
  'gpt-5': capabilities({
    supportsTemperature: false,
    supportsMaxTokens: false,
    supportsMaxCompletionTokens: true,
  }),
  'gpt-4.1': capabilities(),
  'gpt-4o': capabilities(),
  'gpt-4-turbo': capabilities(),
  'gpt-4': capabilities(),
  'gpt-3.5-turbo': capabilities(),
  'claude': capabilities(),
  'gemini': capabilities(),
  'deepseek': capabilities(),
  'llama': capabilities(),
  'mixtral': capabilities(),
}

export function getModelCapabilities(model: string): ModelCapabilities {
  const trimmed = model.trim().toLowerCase()

  for (const [prefix, caps] of Object.entries(CAPABILITIES)) {
    if (trimmed.startsWith(prefix)) {
      return caps
    }
  }

  return capabilities()
}

function providerCapabilityToModelCapability(pc: ProviderModelCapability): ModelCapabilities {
  return {
    supportsTemperature: pc.supportsTemperature,
    supportsMaxTokens: pc.supportsMaxTokens,
    supportsMaxCompletionTokens: pc.supportsMaxCompletionTokens,
    supportsReasoningEffort: pc.supportsReasoningEffort,
  }
}

export function getProviderModelCapabilities(
  _providerId: string | undefined,
  model: string,
  providerCapabilities?: ProviderModelCapability[],
): ModelCapabilities {
  if (providerCapabilities && providerCapabilities.length > 0) {
    const trimmed = model.trim().toLowerCase()
    for (const pc of providerCapabilities) {
      if (trimmed.startsWith(pc.modelPrefix)) {
        return providerCapabilityToModelCapability(pc)
      }
    }
  }
  return getModelCapabilities(model)
}

export function buildRequestBody(
  model: string,
  messages: { role: string; content: string }[],
  params: {
    temperature?: number
    maxTokens?: number
    maxCompletionTokens?: number
    reasoningEffort?: string
  },
  providerId?: string,
  providerCapabilities?: ProviderModelCapability[],
): Record<string, unknown> {
  const caps = getProviderModelCapabilities(providerId, model, providerCapabilities)
  const body: Record<string, unknown> = {
    model: model.trim(),
    messages,
  }

  if (caps.supportsTemperature && params.temperature !== undefined) {
    body.temperature = params.temperature
  }

  if (caps.supportsMaxCompletionTokens && params.maxCompletionTokens !== undefined) {
    body.max_completion_tokens = params.maxCompletionTokens
  } else if (caps.supportsMaxCompletionTokens && params.maxTokens !== undefined) {
    body.max_completion_tokens = params.maxTokens
  } else if (caps.supportsMaxTokens && params.maxTokens !== undefined) {
    body.max_tokens = params.maxTokens
  }

  if (caps.supportsReasoningEffort && params.reasoningEffort !== undefined) {
    body.reasoning_effort = params.reasoningEffort
  }

  return body
}

const PROVIDER_CAPABILITIES: Record<string, ModelCapabilities> = {
  'openai-compatible': capabilities(),
}

export function getProviderCapabilities(providerId: string): ModelCapabilities {
  return PROVIDER_CAPABILITIES[providerId] ?? capabilities()
}
