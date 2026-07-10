export interface TimestampedSegment {
  id: string
  startMs: number
  endMs: number
  text: string
}

export function findActiveSegmentIndex(
  segments: TimestampedSegment[],
  currentTimeMs: number,
  lastKnownIndex: number,
): number {
  if (segments.length === 0) return -1

  // Check adjacent first (most common: advancing forward or small backward seek)
  if (lastKnownIndex >= 0 && lastKnownIndex < segments.length) {
    const cur = segments[lastKnownIndex]
    if (currentTimeMs >= cur.startMs && currentTimeMs < cur.endMs) {
      return lastKnownIndex
    }
    if (lastKnownIndex + 1 < segments.length) {
      const next = segments[lastKnownIndex + 1]
      if (currentTimeMs >= next.startMs && currentTimeMs < next.endMs) {
        return lastKnownIndex + 1
      }
    }
    if (lastKnownIndex - 1 >= 0) {
      const prev = segments[lastKnownIndex - 1]
      if (currentTimeMs >= prev.startMs && currentTimeMs < prev.endMs) {
        return lastKnownIndex - 1
      }
    }
  }

  // Binary search
  let low = 0
  let high = segments.length - 1

  while (low <= high) {
    const mid = (low + high) >>> 1
    const seg = segments[mid]

    if (currentTimeMs < seg.startMs) {
      high = mid - 1
    } else if (currentTimeMs >= seg.endMs) {
      low = mid + 1
    } else {
      return mid
    }
  }

  return -1
}
