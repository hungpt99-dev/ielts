import type { UpdateTutorMemoryRequest, UpdateTutorMemoryResult } from '../../domain/entities/tutor-memory'
import type { TutorMemoryCandidate } from '../../domain/entities/tutor-message'
import type { TutorMemoryManager } from '../../memory/tutor-memory-manager'

export async function updateTutorMemory(
  request: UpdateTutorMemoryRequest,
  memoryManager: TutorMemoryManager,
): Promise<UpdateTutorMemoryResult> {
  return memoryManager.updateMemory(request)
}

export function extractMemoryFromChat(
  _message: string,
  _response: string,
): TutorMemoryCandidate[] {
  const candidates: TutorMemoryCandidate[] = []

  const weakSkillMatch = _response.match(/your (\w+) (needs improvement|could improve|is weak)/i)
  if (weakSkillMatch) {
    candidates.push({
      type: 'weak-point',
      content: `${weakSkillMatch[1]} needs improvement`,
      skill: weakSkillMatch[1].toLowerCase(),
      confidence: 0.5,
    })
  }

  const mistakeMatch = _response.match(/common mistake (is|with) (.+?)(\.|,)/i)
  if (mistakeMatch) {
    candidates.push({
      type: 'mistake-pattern',
      content: mistakeMatch[2],
      skill: 'writing',
      confidence: 0.6,
    })
  }

  return candidates
}
