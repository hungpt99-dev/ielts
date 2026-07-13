export interface RegisteredPrompt {
  id: string
  version: number
  description: string
  systemPrompt: string
  buildUserPrompt?: (...args: unknown[]) => string
}

export class PromptRegistry {
  private prompts = new Map<string, RegisteredPrompt[]>()

  register(prompt: RegisteredPrompt): void {
    const existing = this.prompts.get(prompt.id) ?? []
    const dupe = existing.find(p => p.version === prompt.version)
    if (dupe) {
      Object.assign(dupe, prompt)
      return
    }
    existing.push(prompt)
    existing.sort((a, b) => a.version - b.version)
    this.prompts.set(prompt.id, existing)
  }

  get(id: string, version?: number): RegisteredPrompt {
    const entries = this.prompts.get(id)
    if (!entries || entries.length === 0) {
      throw new Error(`Prompt "${id}" not found in registry`)
    }
    if (version !== undefined) {
      const found = entries.find(p => p.version === version)
      if (!found) throw new Error(`Prompt "${id}" version ${version} not found`)
      return found
    }
    return entries[entries.length - 1]
  }

  getLatest(id: string): RegisteredPrompt {
    return this.get(id)
  }

  getAllVersions(id: string): RegisteredPrompt[] {
    return this.prompts.get(id) ?? []
  }

  getRegisteredIds(): string[] {
    return Array.from(this.prompts.keys())
  }

  has(id: string): boolean {
    return this.prompts.has(id)
  }

  remove(id: string, version?: number): void {
    if (version !== undefined) {
      const entries = this.prompts.get(id)
      if (entries) {
        const filtered = entries.filter(p => p.version !== version)
        if (filtered.length > 0) {
          this.prompts.set(id, filtered)
        } else {
          this.prompts.delete(id)
        }
      }
    } else {
      this.prompts.delete(id)
    }
  }

  clear(): void {
    this.prompts.clear()
  }
}

let defaultRegistry: PromptRegistry | null = null

export function getDefaultPromptRegistry(): PromptRegistry {
  if (!defaultRegistry) {
    defaultRegistry = new PromptRegistry()
  }
  return defaultRegistry
}

export function setDefaultPromptRegistry(registry: PromptRegistry): void {
  defaultRegistry = registry
}
