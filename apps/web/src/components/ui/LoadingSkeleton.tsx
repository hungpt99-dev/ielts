import { type HTMLAttributes, type ReactNode } from 'react'

export type SkeletonVariant = 'text' | 'card' | 'circle' | 'avatar' | 'rect' | 'dashboard' | 'studyPlan' | 'vocabulary' | 'chat' | 'chart'

export interface LoadingSkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant
  width?: string | number
  height?: string | number
  count?: number
  gap?: string
}

const variantStyle: Record<SkeletonVariant, Record<string, string>> = {
  text: {
    height: '14px',
    borderRadius: 'var(--radius-xs)',
    width: '100%',
  },
  card: {
    height: '120px',
    borderRadius: 'var(--radius-2xl)',
    width: '100%',
  },
  circle: {
    height: '40px',
    width: '40px',
    borderRadius: 'var(--radius-full)',
  },
  avatar: {
    height: '32px',
    width: '32px',
    borderRadius: 'var(--radius-full)',
  },
  rect: {
    height: '80px',
    borderRadius: 'var(--radius-xl)',
    width: '100%',
  },
  dashboard: {
    height: '200px',
    borderRadius: 'var(--radius-2xl)',
    width: '100%',
  },
  studyPlan: {
    height: '100px',
    borderRadius: 'var(--radius-xl)',
    width: '100%',
  },
  vocabulary: {
    height: '60px',
    borderRadius: 'var(--radius-xl)',
    width: '100%',
  },
  chat: {
    height: '80px',
    borderRadius: 'var(--radius-xl)',
    width: '80%',
  },
  chart: {
    height: '160px',
    borderRadius: 'var(--radius-xl)',
    width: '100%',
  },
}

function SkeletonItem({ variant, width, height }: { variant: SkeletonVariant; width?: string | number; height?: string | number }) {
  return (
    <div
      style={{
        background: 'var(--color-skeleton)',
        backgroundImage: 'linear-gradient(90deg, var(--color-skeleton) 25%, rgba(255,255,255,0.3) 50%, var(--color-skeleton) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer-ltr 1.5s ease-in-out infinite',
        width: width ? (typeof width === 'number' ? `${width}px` : width) : variantStyle[variant].width ?? '100%',
        height: height ? (typeof height === 'number' ? `${height}px` : height) : variantStyle[variant].height,
        borderRadius: variantStyle[variant].borderRadius,
      }}
      aria-hidden="true"
    />
  )
}

export function LoadingSkeleton({
  variant = 'text',
  width,
  height,
  count = 1,
  gap = 'var(--spacing-sm)',
  style,
  ...props
}: LoadingSkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i)

  return (
    <div
      role="status"
      aria-label="Loading"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap,
        width: '100%',
        ...(style as Record<string, string>),
      }}
      {...props}
    >
      {items.map((i) => (
        <SkeletonItem key={i} variant={variant} width={width} height={height} />
      ))}
      <style>{`
        @keyframes shimmer-ltr {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}

interface SkeletonLayoutProps {
  children?: ReactNode
}

export function DashboardSkeleton({ children }: SkeletonLayoutProps) {
  if (children) {
    return <>{children}</>
  }
  return (
    <div className="mx-auto max-w-6xl space-y-4" aria-label="Loading dashboard">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        <LoadingSkeleton variant="dashboard" />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--spacing-sm)',
          }}
        >
          <LoadingSkeleton variant="card" count={4} gap="var(--spacing-sm)" />
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: 'var(--spacing-md)',
          }}
        >
          <LoadingSkeleton variant="card" height="260px" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            <LoadingSkeleton variant="card" height="120px" />
            <LoadingSkeleton variant="card" height="120px" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function TaskListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }} aria-label="Loading tasks">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)',
            padding: 'var(--spacing-sm) var(--spacing-md)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--color-border)',
          }}
        >
          <LoadingSkeleton variant="circle" width={20} height={20} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2xs)' }}>
            <LoadingSkeleton variant="text" width="60%" />
            <LoadingSkeleton variant="text" width="30%" height="10px" />
          </div>
          <LoadingSkeleton variant="text" width="40px" height="12px" />
        </div>
      ))}
    </div>
  )
}

export function SkillProgressSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 'var(--spacing-sm)',
      }}
      aria-label="Loading skill progress"
    >
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)',
            padding: 'var(--spacing-sm)',
            borderRadius: 'var(--radius-xl)',
          }}
        >
          <LoadingSkeleton variant="circle" width={40} height={40} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2xs)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <LoadingSkeleton variant="text" width="80px" />
              <LoadingSkeleton variant="text" width="30px" />
            </div>
            <LoadingSkeleton variant="rect" height="8px" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function StudyPlanSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }} aria-label="Loading study plan">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--spacing-sm)',
        }}
      >
        <LoadingSkeleton variant="text" width="200px" height="24px" />
        <LoadingSkeleton variant="text" width="80px" />
      </div>
      {Array.from({ length: 4 }, (_, i) => (
        <div
          key={i}
          style={{
            padding: 'var(--spacing-md)',
            borderRadius: 'var(--radius-2xl)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-xs)' }}>
            <LoadingSkeleton variant="text" width="120px" />
            <LoadingSkeleton variant="text" width="50px" />
          </div>
          <LoadingSkeleton variant="text" width="80%" />
          <div style={{ marginTop: 'var(--spacing-xs)' }}>
            <LoadingSkeleton variant="rect" height="6px" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function VocabListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }} aria-label="Loading vocabulary">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)',
            padding: 'var(--spacing-sm) var(--spacing-md)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--color-border)',
          }}
        >
          <LoadingSkeleton variant="circle" width={36} height={36} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2xs)' }}>
            <LoadingSkeleton variant="text" width="100px" />
            <LoadingSkeleton variant="text" width="160px" height="10px" />
          </div>
          <LoadingSkeleton variant="text" width="50px" height="18px" />
        </div>
      ))}
    </div>
  )
}

export function StatsRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.min(count, 4)}, 1fr)`,
        gap: 'var(--spacing-sm)',
      }}
      aria-label="Loading stats"
    >
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)',
            padding: 'var(--spacing-md)',
            borderRadius: 'var(--radius-2xl)',
            border: '1px solid var(--color-border)',
          }}
        >
          <LoadingSkeleton variant="circle" width={40} height={40} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2xs)' }}>
            <LoadingSkeleton variant="text" width="70px" height="12px" />
            <LoadingSkeleton variant="text" width="50px" height="20px" />
          </div>
        </div>
      ))}
    </div>
  )
}
