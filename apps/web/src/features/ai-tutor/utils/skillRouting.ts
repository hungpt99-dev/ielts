const SKILL_ROUTES: Record<string, string> = {
  reading: '/reading',
  listening: '/listening',
  writing: '/writing',
  speaking: '/speaking',
  grammar: '/grammar',
  vocabulary: '/vocabulary',
  mistakes: '/mistakes',
  'mock-test': '/mock-tests',
  'study-plan': '/roadmap',
  'Getting Started': '/dashboard',
}

export function getRouteForSkill(skill: string): string {
  return SKILL_ROUTES[skill] ?? '/dashboard'
}
