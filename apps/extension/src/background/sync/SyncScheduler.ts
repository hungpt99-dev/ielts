export class SyncScheduler {
  private debounceTimer: ReturnType<typeof setTimeout> | null = null
  private callback: (() => Promise<void>) | null = null

  setCallback(fn: () => Promise<void>): void {
    this.callback = fn
  }

  schedule(delayMs: number): void {
    this.cancel()
    this.debounceTimer = setTimeout(() => this.fire(), delayMs)
  }

  cancel(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }
  }

  private async fire(): Promise<void> {
    this.debounceTimer = null
    if (!this.callback) return
    try { await this.callback() } catch (error) {
      console.error('apps/extension/src/background/sync/SyncScheduler.ts error:', error);
    }
  }
}
