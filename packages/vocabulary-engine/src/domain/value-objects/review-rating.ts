export const reviewRatingValues = ['again', 'hard', 'good', 'easy'] as const

export type ReviewRating = typeof reviewRatingValues[number]

export interface ReviewHistoryEntry {
  date: string
  rating: ReviewRating
}

export function isReviewRating(value: string): value is ReviewRating {
  return (reviewRatingValues as readonly string[]).includes(value)
}
