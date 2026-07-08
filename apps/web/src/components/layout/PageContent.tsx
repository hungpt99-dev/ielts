import type { ReactNode, HTMLAttributes } from 'react'

interface PageContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export default function PageContent({
  children,
  className = '',
  style,
  ...props
}: PageContentProps) {
  return (
    <div
      className={`w-full min-w-0 ${className}`}
      style={{ paddingTop: 'var(--spacing-md)', ...style }}
      {...props}
    >
      {children}
    </div>
  )
}
