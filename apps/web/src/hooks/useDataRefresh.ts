import { useEffect } from 'react'

export function useDataRefresh(onChange?: () => void): void {
  useEffect(() => {
    // no-op: auto-sync removed per extension-first refactor
  }, [onChange])
}
