export class SyncLock {
  private locked = false

  async acquire(): Promise<boolean> {
    if (this.locked) return false
    this.locked = true
    return true
  }

  release(): void {
    this.locked = false
  }

  get isLocked(): boolean {
    return this.locked
  }
}

export const syncLock = new SyncLock()
