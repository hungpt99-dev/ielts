import { type HTMLAttributes } from 'react'
import { ExtensionActionMenu, type ExtensionActionMenuItem } from './ExtensionActionMenu'
import {
  IconHelpCircle,
  IconSimplify,
  IconBookText,
  IconSave,
  IconMessageSquare,
} from '../icons/IconMap'

export interface ExtensionSelectedTextMenuProps extends HTMLAttributes<HTMLDivElement> {
  selectedText: string
  position: { x: number; y: number }
  onClose: () => void
  onExplain: (text: string) => void
  onSimplify: (text: string) => void
  onSaveVocabulary: (text: string) => void
  onSaveText: (text: string) => void
  onAskAI: (text: string) => void
  allow?: ('explain' | 'simplify' | 'saveVocabulary' | 'saveText' | 'askAI')[]
  extraActions?: ExtensionActionMenuItem[]
}

const DEFAULT_ALLOW = ['explain', 'simplify', 'saveVocabulary', 'saveText', 'askAI'] as const

export function ExtensionSelectedTextMenu({
  selectedText,
  position,
  onClose,
  onExplain,
  onSimplify,
  onSaveVocabulary,
  onSaveText,
  onAskAI,
  allow,
  extraActions,
  style,
  ...props
}: ExtensionSelectedTextMenuProps) {
  const allowed = allow ?? (DEFAULT_ALLOW as unknown as string[])

  const items: ExtensionActionMenuItem[] = []

  if (allowed.includes('explain')) {
    items.push({
      id: 'explain',
      label: 'Explain',
      icon: <IconHelpCircle size={16} />,
      onClick: () => onExplain(selectedText),
    })
  }

  if (allowed.includes('simplify')) {
    items.push({
      id: 'simplify',
      label: 'Simplify',
      icon: <IconSimplify size={16} />,
      onClick: () => onSimplify(selectedText),
    })
  }

  if (allowed.includes('saveVocabulary')) {
    items.push({
      id: 'saveVocabulary',
      label: 'Save Vocabulary',
      icon: <IconBookText size={16} />,
      onClick: () => onSaveVocabulary(selectedText),
    })
  }

  if (allowed.includes('saveText')) {
    items.push({
      id: 'saveText',
      label: 'Save Selected Text',
      icon: <IconSave size={16} />,
      onClick: () => onSaveText(selectedText),
    })
  }

  if (allowed.includes('askAI')) {
    items.push({
      id: 'askAI',
      label: 'Ask AI Tutor',
      icon: <IconMessageSquare size={16} />,
      onClick: () => onAskAI(selectedText),
    })
  }

  const allItems = [...items, ...(extraActions || [])]

  return (
    <ExtensionActionMenu
      items={allItems}
      position={position}
      onClose={onClose}
      origin="content"
      style={style as Record<string, string>}
      {...props}
    />
  )
}
