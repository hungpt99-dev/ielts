import { useRef, useEffect, useCallback } from 'react'
import type { RoadmapPhase } from '../roadmapService'

interface PhaseMilestoneTimelineProps {
  phases: RoadmapPhase[]
  currentPhaseIndex: number
  onPhaseClick: (index: number) => void
}

function PhaseNode({
  phase,
  isCurrent,
  isComplete,
  isLocked,
  onClick,
}: {
  phase: RoadmapPhase
  isCurrent: boolean
  isComplete: boolean
  isLocked: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 shrink-0 transition-all hover:scale-105 active:scale-95"
      style={{ width: 96, minWidth: 96 }}
      aria-label={`${phase.name}${isCurrent ? ' — current phase' : ''}${isComplete ? ' — completed' : ''}${isLocked ? ' — upcoming' : ''}`}
      aria-current={isCurrent ? 'step' : undefined}
    >
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold transition-all duration-300"
        style={{
          backgroundColor: isComplete
            ? 'var(--color-success)'
            : isCurrent
              ? 'var(--color-primary)'
              : 'var(--color-surface-alt)',
          color: isComplete || isCurrent
            ? 'var(--color-on-primary)'
            : 'var(--color-muted)',
          boxShadow: isCurrent
            ? '0 0 0 3px var(--color-primary-light), 0 0 0 6px var(--color-surface)'
            : 'none',
          animation: isCurrent ? 'pulse 2s ease-in-out infinite' : 'none',
          opacity: isLocked ? 0.5 : 1,
        }}
      >
        {isComplete ? '✓' : isLocked ? '🔒' : phase.order + 1}
      </div>
      <span
        className="text-center text-xs font-medium leading-tight"
        style={{
          color: isCurrent
            ? 'var(--color-primary)'
            : isComplete
              ? 'var(--color-success)'
              : 'var(--color-text-secondary)',
          opacity: isLocked ? 0.5 : 1,
        }}
      >
        {phase.name}
      </span>
      <span className="text-[10px] leading-tight" style={{ color: 'var(--color-muted)' }}>
        {phase.targetRange}
      </span>
    </button>
  )
}

export default function PhaseMilestoneTimeline({ phases, currentPhaseIndex, onPhaseClick }: PhaseMilestoneTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scrollToCurrent = useCallback(() => {
    if (!scrollRef.current || phases.length === 0) return
    const nodes = scrollRef.current.querySelectorAll('[aria-current="step"]')
    if (nodes.length > 0) {
      nodes[0].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [phases.length])

  useEffect(() => {
    scrollToCurrent()
  }, [scrollToCurrent])

  if (phases.length <= 1) return null

  return (
    <section aria-label="Study plan phases">
      <div
        className="flex items-center gap-0 overflow-x-auto rounded-2xl border p-4"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
        ref={scrollRef}
      >
        <style>{`
          .timeline-scroll::-webkit-scrollbar { display: none; }
        `}</style>
        <div className="flex items-center gap-0 mx-auto">
          {phases.map((phase, index) => {
            const isCurrent = index === currentPhaseIndex
            const isComplete = phase.isComplete
            const isLocked = !isComplete && !isCurrent && index > currentPhaseIndex

            return (
              <div key={phase.id} className="flex items-center">
                <PhaseNode
                  phase={phase}
                  isCurrent={isCurrent}
                  isComplete={isComplete}
                  isLocked={isLocked}
                  onClick={() => onPhaseClick(index)}
                />
                {index < phases.length - 1 && (
                  <div
                    className="h-0.5 w-8 sm:w-12"
                    style={{
                      backgroundColor: index < currentPhaseIndex || phases[index].isComplete
                        ? 'var(--color-success)'
                        : 'var(--color-border)',
                      backgroundImage: index >= currentPhaseIndex && !phases[index].isComplete
                        ? 'repeating-linear-gradient(90deg, var(--color-border) 0, var(--color-border) 4px, transparent 4px, transparent 8px)'
                        : 'none',
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
      {phases.length > 4 && (
        <p className="mt-1 text-center text-xs" style={{ color: 'var(--color-muted)' }}>
          Phase {currentPhaseIndex + 1} of {phases.length} · Scroll for more
        </p>
      )}
    </section>
  )
}
