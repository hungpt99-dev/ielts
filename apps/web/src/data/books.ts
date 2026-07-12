export interface Book {
  id: string
  title: string
  author: string
  description: string
  coverImage: string
  category: string
  level: string
  affiliateUrl: string
  retailer: string
}

export const CATEGORIES = [
  'All',
  'Listening',
  'Reading',
  'Writing',
  'Speaking',
  'Vocabulary',
  'Grammar',
  'Practice Tests',
] as const

export type BookCategory = (typeof CATEGORIES)[number]

export const books: Book[] = []
