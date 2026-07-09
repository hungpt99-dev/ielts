export function openAITutorChat(message?: string) {
  if (message) {
    try {
      sessionStorage.setItem('ai-tutor-pending-message', message)
    } catch {}
  }
  window.dispatchEvent(new CustomEvent('open-ai-tutor-chat'))
}
