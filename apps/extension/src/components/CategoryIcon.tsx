import type { ReactNode } from 'react'
import type { SaveCategory } from '../types'
import {
  IconVocabulary,
  IconMessageSquare,
  IconFileText,
  IconGrammar,
  IconBookText,
  IconEdit,
  IconSpeaking,
  IconMistakes,
} from '@ielts/ui'

export function CategoryIcon({ category, size = 14 }: { category: SaveCategory; size?: number }): ReactNode {
  const icons: Record<SaveCategory, ReactNode> = {
    vocabulary: <IconVocabulary size={size} />,
    phrase: <IconMessageSquare size={size} />,
    sentence: <IconFileText size={size} />,
    grammar: <IconGrammar size={size} />,
    reading: <IconBookText size={size} />,
    writing: <IconEdit size={size} />,
    speaking: <IconSpeaking size={size} />,
    mistake: <IconMistakes size={size} />,
  }
  return icons[category] || null
}
