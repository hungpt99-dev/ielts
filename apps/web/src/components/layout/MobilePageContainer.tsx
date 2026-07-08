import type { ReactNode, HTMLAttributes } from 'react'

interface MobilePageContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  disableBottomPadding?: boolean
  className?: string
}

export default function MobilePageContainer({
  children,
  disableBottomPadding = false,
  className = '',
  style,
  ...props
}: MobilePageContainerProps) {
  return (
    <div
      className={`w-full min-w-0 ${className}`}
      style={{
        paddingLeft: 'var(--safe-area-left, env(safe-area-inset-left, 0px))',
        paddingRight: 'var(--safe-area-right, env(safe-area-inset-right, 0px))',
        paddingBottom: disableBottomPadding
          ? undefined
          : 'calc(var(--spacing-lg, 1.5rem) + var(--safe-area-bottom, env(safe-area-inset-bottom, 0px)))',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
}
