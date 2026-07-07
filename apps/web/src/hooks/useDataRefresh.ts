import { useEffect } from 'react'
import { onDataChange } from '../services/storage/DataSyncManager'
import type { SyncEntityType } from '@ielts/storage'

export function useDataRefresh(onChange?: (entityType: SyncEntityType) => void): void {
  useEffect(() => {
    return onDataChange((entityType) => {
      onChange?.(entityType)
    })
  }, [onChange])
}
