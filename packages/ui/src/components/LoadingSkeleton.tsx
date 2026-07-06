import { type HTMLAttributes } from 'react'

export type SkeletonVariant = 'text' | 'card' | 'circle' | 'avatar' | 'rect' | 'dashboard' | 'studyPlan' | 'vocabulary' | 'chat' | 'chart'
export type ShimmerDirection = 'ltr' | 'rtl' | 'ttb'

export interface LoadingSkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant
  width?: string | number
  height?: string | number
  count?: number
  gap?: string
  shimmerDirection?: ShimmerDirection
}

const variantStyle: Record<SkeletonVariant, Record<string, string>> = {
  text: {
    height: '14px',
    borderRadius: 'var(--radius-xs)',
    width: '100%',
  },
  card: {
    height: '120px',
    borderRadius: 'var(--radius-xl)',
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
    borderRadius: 'var(--radius-lg)',
    width: '100%',
  },
  dashboard: {
    height: '200px',
    borderRadius: 'var(--radius-xl)',
    width: '100%',
  },
  studyPlan: {
    height: '100px',
    borderRadius: 'var(--radius-lg)',
    width: '100%',
  },
  vocabulary: {
    height: '60px',
    borderRadius: 'var(--radius-lg)',
    width: '100%',
  },
  chat: {
    height: '80px',
    borderRadius: 'var(--radius-lg)',
    width: '80%',
  },
  chart: {
    height: '160px',
    borderRadius: 'var(--radius-lg)',
    width: '100%',
  },
}

const shimmerGradientMap: Record<ShimmerDirection, string> = {
  ltr: 'linear-gradient(90deg, var(--color-skeleton) 25%, var(--color-surface) 50%, var(--color-skeleton) 75%)',
  rtl: 'linear-gradient(270deg, var(--color-skeleton) 25%, var(--color-surface) 50%, var(--color-skeleton) 75%)',
  ttb: 'linear-gradient(180deg, var(--color-skeleton) 25%, var(--color-surface) 50%, var(--color-skeleton) 75%)',
}

const shimmerAnimationMap: Record<ShimmerDirection, string> = {
  ltr: 'shimmerLtr 1.5s ease-in-out infinite',
  rtl: 'shimmerRtl 1.5s ease-in-out infinite',
  ttb: 'shimmerTtb 1.5s ease-in-out infinite',
}

export function LoadingSkeleton({
  variant = 'text',
  width,
  height,
  count = 1,
  gap = 'var(--spacing-sm)',
  shimmerDirection = 'ltr',
  style,
  ...props
}: LoadingSkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i)

  const skeletonStyle: Record<string, string> = {
    background: shimmerGradientMap[shimmerDirection],
    backgroundSize: shimmerDirection === 'ttb' ? '100% 200%' : '200% 100%',
    animation: shimmerAnimationMap[shimmerDirection],
    width: width ? (typeof width === 'number' ? `${width}px` : width) : variantStyle[variant].width ?? '100%',
    height: height
      ? typeof height === 'number'
        ? `${height}px`
        : height
      : variantStyle[variant].height,
    borderRadius: variantStyle[variant].borderRadius,
  }

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
        <div key={i} style={skeletonStyle as Record<string, string>} />
      ))}
    </div>
  )
}
