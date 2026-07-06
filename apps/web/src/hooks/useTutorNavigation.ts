import { useNavigate } from 'react-router-dom'

export interface TutorContext {
  prompt: string
  type?: string
  title?: string
}

export function useTutorNavigation() {
  const navigate = useNavigate()

  return (context: TutorContext) => {
    const params = new URLSearchParams({
      q: context.prompt,
      ...(context.type && { type: context.type }),
      ...(context.title && { title: context.title }),
    })
    navigate(`/tutor?${params.toString()}`, { state: context })
  }
}
