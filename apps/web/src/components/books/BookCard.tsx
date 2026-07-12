import { useState } from 'react'
import type { Book } from '../../data/books'
import { IconBookText } from '@ielts/ui'

interface BookCardProps {
  book: Book
}

export default function BookCard({ book }: BookCardProps) {
  const [imgError, setImgError] = useState(false)
  const initials = book.title
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <div
      className="flex flex-col overflow-hidden rounded-2xl border transition-shadow hover:shadow-md"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border-light)',
      }}
    >
      <div
        className="relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden bg-gradient-to-br"
        style={{
          backgroundColor: 'var(--color-surface-alt)',
        }}
      >
        {book.coverImage && !imgError ? (
          <img
            src={book.coverImage}
            alt={`Cover of ${book.title}`}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 p-4 text-center">
            <span
              className="flex h-14 w-14 items-center justify-center rounded-xl text-lg font-bold"
              style={{
                backgroundColor: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
              }}
            >
              {initials}
            </span>
            <IconBookText size={20} style={{ color: 'var(--color-muted)' }} aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium"
            style={{
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
            }}
          >
            {book.category}
          </span>
        </div>

        <h3
          className="text-sm font-semibold leading-snug"
          style={{ color: 'var(--color-text)' }}
        >
          {book.title}
        </h3>

        <p
          className="text-xs"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          by {book.author}
        </p>

        <p
          className="line-clamp-2 text-xs leading-relaxed"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {book.description}
        </p>

        <div className="mt-auto flex flex-col gap-2 pt-2">
          <span
            className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium w-fit"
            style={{
              backgroundColor: 'var(--color-surface-alt)',
              color: 'var(--color-muted)',
            }}
          >
            {book.level}
          </span>

          {book.affiliateUrl ? (
            <a
              href={book.affiliateUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'white',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-primary)'
              }}
            >
              View on {book.retailer}
            </a>
          ) : (
            <button
              disabled
              className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-xs font-semibold opacity-50 cursor-not-allowed"
              style={{
                backgroundColor: 'var(--color-surface-alt)',
                color: 'var(--color-muted)',
              }}
            >
              Unavailable
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
