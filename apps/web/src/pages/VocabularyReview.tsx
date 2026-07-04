import ReviewSession from '../features/vocabulary-review/ReviewSession'

export default function VocabularyReview() {
  return (
    <ReviewSession onBack={() => window.history.back()} />
  )
}
