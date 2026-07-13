import type { TutorMemoryCandidate } from '../domain/entities/tutor-message'

export class MemoryExtractor {
  extractFromChat(
    _message: string,
    _response: string,
  ): TutorMemoryCandidate[] {
    const candidates: TutorMemoryCandidate[] = []

    const weakPointMatch = _response.match(/your (writing|speaking|reading|listening|grammar|vocabulary) (needs|needs improvement|could improve)/i)
    if (weakPointMatch) {
      candidates.push({
        type: 'weak-point',
        content: `${weakPointMatch[1]} needs improvement`,
        skill: weakPointMatch[1],
        confidence: 0.6,
      })
    }

    return candidates
  }
}
