export function openAITutorChat(message?: string) {
  if (message) {
    try {
      sessionStorage.setItem('ai-tutor-pending-message', message)
    } catch (error) {
  console.error('apps/web/src/features/ai-tutor/utils/openChat.ts error:', error);
    }
  }
  window.dispatchEvent(new CustomEvent('open-ai-tutor-chat'))
}
