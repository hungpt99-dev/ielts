import { useEffect } from 'react'
import type { SyncEntityType } from '@ielts/storage'

export function useDataRefresh(onChange?: (entityType: SyncEntityType) => void): void {
  useEffect(() => {
    // no-op: auto-sync removed
  }, [onChange])
}
