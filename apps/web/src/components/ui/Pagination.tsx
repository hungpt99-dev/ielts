interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  function getPageNumbers(): (number | '...')[] {
    const pages: (number | '...')[] = []
    const delta = 2
    const start = Math.max(2, page - delta)
    const end = Math.min(totalPages - 1, page + delta)

    pages.push(1)
    if (start > 2) pages.push('...')
    for (let i = start; i <= end; i++) pages.push(i)
    if (end < totalPages - 1) pages.push('...')
    if (totalPages > 1) pages.push(totalPages)

    return pages
  }

  const baseButtonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 'var(--spacing-xl)',
    height: 'var(--spacing-xl)',
    padding: '0 var(--spacing-xs)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--weight-medium)',
    fontFamily: 'var(--font-sans)',
    borderRadius: 'var(--radius-lg)',
    border: 'none',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
    lineHeight: 'var(--leading-normal)',
  } as Record<string, string>

  return (
    <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-2xs)' }} aria-label="Pagination">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        style={{
          ...baseButtonStyle,
          color: 'var(--color-text-secondary)',
          background: 'transparent',
          opacity: page <= 1 ? '0.4' : '1',
          cursor: page <= 1 ? 'not-allowed' : 'pointer',
        }}
        aria-label="Previous page"
      >
        <svg style={{ width: 'var(--text-base)', height: 'var(--text-base)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {getPageNumbers().map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} style={{ padding: '0 var(--spacing-2xs)', fontSize: 'var(--text-sm)', color: 'var(--color-muted)' }}>
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            style={{
              ...baseButtonStyle,
              color: p === page ? 'var(--color-on-primary)' : 'var(--color-text-secondary)',
              background: p === page ? 'var(--color-primary)' : 'transparent',
              fontWeight: p === page ? 'var(--weight-semibold)' : 'var(--weight-medium)',
            }}
            onMouseEnter={(e) => {
              if (p !== page) {
                e.currentTarget.style.background = 'var(--color-surface-alt)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = p === page ? 'var(--color-primary)' : 'transparent'
            }}
            aria-current={p === page ? 'page' : undefined}
            aria-label={`Page ${p}`}
          >
            {p}
          </button>
        ),
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        style={{
          ...baseButtonStyle,
          color: 'var(--color-text-secondary)',
          background: 'transparent',
          opacity: page >= totalPages ? '0.4' : '1',
          cursor: page >= totalPages ? 'not-allowed' : 'pointer',
        }}
        aria-label="Next page"
      >
        <svg style={{ width: 'var(--text-base)', height: 'var(--text-base)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </nav>
  )
}
