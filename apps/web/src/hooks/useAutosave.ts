import { useEffect, useRef, useCallback } from 'react'

export function useAutosave<T>(
  value: T,
  onSave: (value: T) => Promise<void>,
  delay: number = 1500,
) {
  const firstRender = useRef(true)
  const prevValue = useRef(value)
  const onSaveRef = useRef(onSave)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const valueRef = useRef(value)

  useEffect(() => {
    onSaveRef.current = onSave
  }, [onSave])

  useEffect(() => {
    valueRef.current = value
  }, [value])

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      prevValue.current = value
      return
    }

    if (prevValue.current === value) return
    prevValue.current = value

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      onSaveRef.current(valueRef.current).catch(() => {})
    }, delay)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [value, delay])

  const flush = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    await onSaveRef.current(valueRef.current)
  }, [])

  return { flush }
}
