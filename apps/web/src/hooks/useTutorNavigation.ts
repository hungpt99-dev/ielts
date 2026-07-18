import { STORAGE_KEYS } from '@ielts/config'

export interface TutorContext {
  prompt: string
  type?: string
  title?: string
}

export function useTutorNavigation() {
  return (context: TutorContext) => {
    const message = context.prompt + (context.title ? ` (${context.title})` : '')
    try {
      sessionStorage.setItem(STORAGE_KEYS.sessionStorage.aiTutorPendingMessage, message)
    } catch (error) {
    console.error('apps/web/src/hooks/useTutorNavigation.ts error:', error);
    }
    window.dispatchEvent(new CustomEvent('open-ai-tutor-chat'))
  }
}
