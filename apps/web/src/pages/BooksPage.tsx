import { useState, useMemo } from 'react'
import PageHeader from '../components/layout/PageHeader'
import PageContent from '../components/layout/PageContent'
import BookCard from '../components/books/BookCard'
import BookCategoryFilter from '../components/books/BookCategoryFilter'
import AffiliateDisclosure from '../components/books/AffiliateDisclosure'
import { books } from '../data/books'
import type { BookCategory } from '../data/books'
import { IconBookText } from '@ielts/ui'

export default function BooksPage() {
  const [activeCategory, setActiveCategory] = useState<BookCategory>('All')

  const filteredBooks = useMemo(() => {
    if (activeCategory === 'All') return books
    return books.filter((book) => book.category === activeCategory)
  }, [activeCategory])

  return (
    <PageContent className="space-y-6">
      <PageHeader
        icon={<IconBookText size={20} />}
        title="Recommended IELTS Books"
        description="A curated collection of useful books for improving your IELTS skills."
      />

      <AffiliateDisclosure />

      <BookCategoryFilter selected={activeCategory} onChange={setActiveCategory} />

      {filteredBooks.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-2xl border py-16"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border-light)',
          }}
        >
          <IconBookText size={40} style={{ color: 'var(--color-muted)' }} aria-hidden="true" />
          <p
            className="mt-3 text-sm font-medium"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            No books found
          </p>
          <p
            className="mt-1 text-xs"
            style={{ color: 'var(--color-muted)' }}
          >
            No books are available for the "{activeCategory}" category yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </PageContent>
  )
}
