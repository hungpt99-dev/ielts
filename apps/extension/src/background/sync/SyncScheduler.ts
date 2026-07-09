const RETRY_DELAYS = [2000, 5000, 10000, 30000]

export class SyncScheduler {
  private debounceTimer: ReturnType<typeof setTimeout> | null = null
  private retryTimer: ReturnType<typeof setTimeout> | null = null
  private retryCount = 0
  private callback: (() => Promise<void>) | null = null

  setCallback(fn: () => Promise<void>): void {
    this.callback = fn
  }

  scheduleDebounce(delayMs = 3000): void {
    this.clearDebounce()
    this.debounceTimer = setTimeout(() => this.fire(), delayMs)
  }

  scheduleRetry(): void {
    this.clearRetry()
    if (this.retryCount >= RETRY_DELAYS.length) return
    const delay = RETRY_DELAYS[this.retryCount]
    this.retryCount++
    this.retryTimer = setTimeout(() => this.fire(), delay)
  }

  resetRetry(): void {
    this.retryCount = 0
  }

  clearAll(): void {
    this.clearDebounce()
    this.clearRetry()
  }

  private clearDebounce(): void {
    if (this.debounceTimer) { clearTimeout(this.debounceTimer); this.debounceTimer = null }
  }

  private clearRetry(): void {
    if (this.retryTimer) { clearTimeout(this.retryTimer); this.retryTimer = null }
  }

  private async fire(): Promise<void> {
    this.clearAll()
    if (!this.callback) return
    try { await this.callback() } catch {}
  }
}
