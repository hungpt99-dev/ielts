import { type ReactNode } from 'react'

export interface MobileNavItem {
  id: string
  label: string
  icon: ReactNode
  active?: boolean
  badge?: number
  onClick: () => void
}

export interface MobileBottomNavigationProps {
  items: MobileNavItem[]
}

export function MobileBottomNavigation({ items }: MobileBottomNavigationProps) {
  return (
    <nav
      role="navigation"
      aria-label="Mobile navigation"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        width: '100%',
        height: '72px',
        background: 'var(--glass-background)',
        borderTop: '1px solid var(--color-border-light)',
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 'var(--z-fixed)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
        backdropFilter: 'blur(16px) saturate(180%)',
        boxShadow: 'var(--shadow-elevated)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={item.onClick}
          aria-current={item.active ? 'page' : undefined}
          aria-label={item.label}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2px',
            padding: 'var(--spacing-2xs) var(--spacing-sm)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: item.active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            transition: 'color var(--transition-fast), transform var(--transition-fast)',
            position: 'relative',
            minWidth: '56px',
            minHeight: '48px',
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'manipulation',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            flex: 1,
            maxWidth: '96px',
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.92)'
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = ''
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = ''
          }}
          onTouchStart={(e) => {
            e.currentTarget.style.transform = 'scale(0.92)'
          }}
          onTouchEnd={(e) => {
            e.currentTarget.style.transform = ''
          }}
        >
          {item.active && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '24px',
                height: '3px',
                borderRadius: '0 0 var(--radius-full) var(--radius-full)',
                background: 'var(--color-primary)',
              }}
            />
          )}
          <div style={{ position: 'relative', lineHeight: 1 }}>
            {item.icon}
            {item.badge !== undefined && item.badge > 0 && (
              <span
                role="status"
                aria-label={`${item.badge} pending`}
                style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-12px',
                  minWidth: '18px',
                  height: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                  background: 'var(--color-danger)',
                  color: 'var(--color-on-primary)',
                  fontSize: '10px',
                  fontWeight: 'var(--weight-bold)',
                  borderRadius: 'var(--radius-full)',
                  fontFamily: 'var(--font-sans)',
                  lineHeight: 1,
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </div>
          <span
            style={{
              fontSize: '11px',
              fontWeight: item.active ? 'var(--weight-semibold)' : 'var(--weight-medium)',
              fontFamily: 'var(--font-sans)',
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '64px',
            }}
          >
            {item.label}
          </span>
        </button>
      ))}
    </nav>
  )
}
