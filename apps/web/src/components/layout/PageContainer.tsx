import type { ReactNode, HTMLAttributes } from 'react'

export type ContainerWidth = 'full' | 'wide' | 'standard' | 'narrow' | 'chat'

interface PageContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  width?: ContainerWidth
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
  className = '',
  style,
  ...props
}: PageContainerProps) {
  return (
    <div
      className={`mx-auto w-full px-4 sm:px-6 lg:px-8 ${widths[width]} ${className}`}
      style={style}
      {...props}
    >
      {children}
    </div>
  )
}
