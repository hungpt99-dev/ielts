import type { ReactNode, HTMLAttributes } from 'react'

interface SafeAreaContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  top?: boolean
  bottom?: boolean
  left?: boolean
  right?: boolean
  className?: string
}

export default function SafeAreaContainer({
  children,
  top = false,
  bottom = false,
  left = false,
  right = false,
  className = '',
  style,
  ...props
}: SafeAreaContainerProps) {
  const paddingTop = top ? 'var(--safe-area-top, env(safe-area-inset-top, 0px))' : undefined
  const paddingBottom = bottom ? 'var(--safe-area-bottom, env(safe-area-inset-bottom, 0px))' : undefined
  const paddingLeft = left ? 'var(--safe-area-left, env(safe-area-inset-left, 0px))' : undefined
  const paddingRight = right ? 'var(--safe-area-right, env(safe-area-inset-right, 0px))' : undefined

  return (
    <div
      className={className}
      style={{
        paddingTop,
        paddingBottom,
        paddingLeft,
        paddingRight,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
}
