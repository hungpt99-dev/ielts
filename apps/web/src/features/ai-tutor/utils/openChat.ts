import { STORAGE_KEYS } from '@ielts/config'

export function openAITutorChat(message?: string) {
  if (message) {
    try {
      sessionStorage.setItem(STORAGE_KEYS.sessionStorage.aiTutorPendingMessage, message)
    } catch (error) {
  console.error('apps/web/src/features/ai-tutor/utils/openChat.ts error:', error);
    }
  }
  window.dispatchEvent(new CustomEvent('open-ai-tutor-chat'))
}
