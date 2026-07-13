export interface ExerciseScore {
  score: number
  maximumScore: number
  accuracy: number
}

export function calculateAccuracy(score: number, maximum: number): number {
  if (maximum <= 0) return 0
  return Math.round((score / maximum) * 100)
}
