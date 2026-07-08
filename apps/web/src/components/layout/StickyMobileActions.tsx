import type { ReactNode, HTMLAttributes } from 'react'

interface StickyMobileActionsProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  className?: string
  safeAreaBottom?: boolean
  zIndex?: number
}

export default function StickyMobileActions({
  children,
  className = '',
  safeAreaBottom = true,
  zIndex = 40,
  style,
  ...props
}: StickyMobileActionsProps) {
  return (
    <div
      className={className}
      style={{
        position: 'sticky',
        bottom: 0,
        zIndex,
        paddingBottom: safeAreaBottom
          ? 'env(safe-area-inset-bottom, 0px)'
          : undefined,
        backgroundColor: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
}
