export interface TutorContext {
  prompt: string
  type?: string
  title?: string
}

export function useTutorNavigation() {
  return (context: TutorContext) => {
    const message = context.prompt + (context.title ? ` (${context.title})` : '')
    try {
      sessionStorage.setItem('ai-tutor-pending-message', message)
    } catch {}
    window.dispatchEvent(new CustomEvent('open-ai-tutor-chat'))
  }
}
