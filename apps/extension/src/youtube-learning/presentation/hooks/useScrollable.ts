import { useCallback, useEffect, useRef, useState } from 'react'

interface ScrollableState {
  canScrollLeft: boolean
  canScrollRight: boolean
  isOverflowing: boolean
}

const SCROLL_AMOUNT = 200
const SCROLL_PADDING = 8
const OVERSCAN = 2

function areEqual(a: ScrollableState, b: ScrollableState): boolean {
  return a.canScrollLeft === b.canScrollLeft
    && a.canScrollRight === b.canScrollRight
    && a.isOverflowing === b.isOverflowing
}

export function useScrollable<T extends HTMLElement>() {
  const containerRef = useRef<T>(null)
  const [state, setState] = useState<ScrollableState>({
    canScrollLeft: false,
    canScrollRight: false,
    isOverflowing: false,
  })

  const measure = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    const hasOverflow = scrollWidth > clientWidth + OVERSCAN
    setState(prev => {
      const next: ScrollableState = {
        canScrollLeft: scrollLeft > OVERSCAN,
        canScrollRight: scrollLeft < scrollWidth - clientWidth - OVERSCAN,
        isOverflowing: hasOverflow,
      }
      return areEqual(prev, next) ? prev : next
    })
  }, [])

  const measureRef = useRef(measure)
  measureRef.current = measure

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    measureRef.current()

    const ro = new ResizeObserver(() => measureRef.current())
    ro.observe(el)
    const child = el.children[0]
    if (child) ro.observe(child)

    el.addEventListener('scroll', measureRef.current, { passive: true })

    return () => {
      ro.disconnect()
      el.removeEventListener('scroll', measureRef.current)
    }
  }, [])

  const scrollBy = useCallback((direction: 'left' | 'right') => {
    const el = containerRef.current
    if (!el) return
    const sign = direction === 'left' ? -1 : 1
    el.scrollBy({ left: sign * SCROLL_AMOUNT, behavior: 'smooth' })
  }, [])

  const scrollTabIntoView = useCallback((tabElement: HTMLElement | null) => {
    if (!tabElement || !containerRef.current) return
    const container = containerRef.current
    const containerRect = container.getBoundingClientRect()
    const tabRect = tabElement.getBoundingClientRect()

    if (tabRect.left < containerRect.left) {
      container.scrollBy({ left: tabRect.left - containerRect.left - SCROLL_PADDING, behavior: 'smooth' })
    } else if (tabRect.right > containerRect.right) {
      container.scrollBy({ left: tabRect.right - containerRect.right + SCROLL_PADDING, behavior: 'smooth' })
    }
  }, [])

  return { containerRef, ...state, scrollBy, scrollTabIntoView }
}
