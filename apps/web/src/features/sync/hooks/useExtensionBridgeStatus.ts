import { useState, useEffect, useRef, useCallback } from 'react'
import { getClient } from '../bridge/ExtensionBridgeClient'
import type { ExtensionStatus } from '../bridge/extensionBridge.types'

export function useExtensionBridgeStatus(): {
  status: ExtensionStatus
  check: () => void
} {
  const [status, setStatus] = useState<ExtensionStatus>({ state: 'checking' })
  const mountedRef = useRef(true)
  const checkIdRef = useRef(0)

  const check = useCallback(() => {
    const client = getClient()
    const thisCheck = ++checkIdRef.current

    setStatus({ state: 'checking' })

    client.ping().then((result) => {
      console.log('[SyncHook] ping resolved, result:', result, 'thisCheck:', thisCheck, 'currentCheck:', checkIdRef.current, 'mounted:', mountedRef.current)
      if (!mountedRef.current || thisCheck !== checkIdRef.current) return
      setStatus({
        state: 'connected',
        version: result.extensionVersion,
        bridgeVersion: result.bridgeVersion,
      })
    }).catch((err) => {
      console.log('[SyncHook] ping rejected, error:', err, 'thisCheck:', thisCheck, 'currentCheck:', checkIdRef.current, 'mounted:', mountedRef.current)
      if (!mountedRef.current || thisCheck !== checkIdRef.current) return
      setStatus({ state: 'not_detected' })
    })
  }, [])

  useEffect(() => {
    mountedRef.current = true
    const initialCheck = check
    initialCheck()
    const interval = setInterval(check, 30000)
    return () => {
      mountedRef.current = false
      checkIdRef.current++
      clearInterval(interval)
    }
  }, [check])

  return { status, check }
}
