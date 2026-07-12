import type { BookCategory } from '../../data/books'
import { CATEGORIES } from '../../data/books'

interface BookCategoryFilterProps {
  selected: BookCategory
  onChange: (category: BookCategory) => void
}

export default function BookCategoryFilter({ selected, onChange }: BookCategoryFilterProps) {
  return (
    <div
      className="flex flex-wrap gap-2"
      role="group"
      aria-label="Filter books by category"
    >
      {CATEGORIES.map((category) => (
        <button
          key={category}
          onClick={() => onChange(category)}
          className="inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            backgroundColor: selected === category ? 'var(--color-primary)' : 'var(--color-surface-alt)',
            color: selected === category ? 'white' : 'var(--color-text-secondary)',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
          }}
          aria-pressed={selected === category}
        >
          {category}
        </button>
      ))}
    </div>
  )
}
