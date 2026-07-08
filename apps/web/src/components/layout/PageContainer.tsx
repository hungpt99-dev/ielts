import type { ReactNode, HTMLAttributes } from 'react'

export type ContainerWidth = 'full' | 'wide' | 'standard' | 'narrow' | 'chat'

interface PageContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  width?: ContainerWidth
  disableSafeArea?: boolean
}

const widths: Record<ContainerWidth, string> = {
  full: 'w-full',
  wide: 'max-w-7xl',
  standard: 'max-w-5xl',
  narrow: 'max-w-3xl',
  chat: 'max-w-4xl',
}

export default function PageContainer({
  children,
  width = 'wide',
  disableSafeArea = false,
  className = '',
  style,
  ...props
}: PageContainerProps) {
  return (
    <div
      className={`mx-auto w-full min-w-0 ${widths[width]} px-4 sm:px-6 lg:px-8 ${className}`}
      style={{
        paddingLeft: disableSafeArea
          ? undefined
          : 'calc(var(--spacing-md, 1rem) + var(--safe-area-left, env(safe-area-inset-left, 0px)))',
        paddingRight: disableSafeArea
          ? undefined
          : 'calc(var(--spacing-md, 1rem) + var(--safe-area-right, env(safe-area-inset-right, 0px)))',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
}
