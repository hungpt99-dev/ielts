import { useState, useRef, useCallback, useEffect } from 'react'
import { useToast } from '../../../../../packages/ui/src/components/Toast'
import type { ExtensionSettings } from '@/background/settingsStorage'
import { SAVE_CATEGORIES, THEME_MODES } from '@/background/settingsStorage'
import { Section, Field, ToggleField, inputStyle, selectStyle } from './ui'

interface GeneralSettingsProps {
  settings: ExtensionSettings
  onSave: (patch: Partial<ExtensionSettings>) => Promise<void>
}

const CATEGORY_LABELS: Record<string, string> = {
  vocabulary: 'Vocabulary',
  phrase: 'Useful Phrase',
  sentence: 'Example Sentence',
  grammar: 'Grammar Note',
  reading: 'Reading Material',
  writing: 'Writing Idea',
  speaking: 'Speaking Idea',
  mistake: 'Mistake Note',
}

const THEME_LABELS: Record<string, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System (follow device)',
}

export default function GeneralSettings({ settings, onSave }: GeneralSettingsProps) {
  const { showToast } = useToast()
  const [localTopic, setLocalTopic] = useState(settings.defaultTopic)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestTopicRef = useRef(localTopic)
  latestTopicRef.current = localTopic

  useEffect(() => {
    setLocalTopic(settings.defaultTopic)
  }, [settings.defaultTopic])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const doSave = useCallback(
    async (patch: Partial<ExtensionSettings>) => {
      try {
        await onSave(patch)
      } catch {
        showToast('error', 'Failed to save settings')
      }
    },
    [onSave, showToast],
  )

  const handleTopicChange = useCallback(
    (value: string) => {
      setLocalTopic(value)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        doSave({ defaultTopic: latestTopicRef.current })
      }, 400)
    },
    [doSave],
  )

  return (
    <>
      <Section title="Appearance">
        <Field label="Theme Mode">
          <select
            value={settings.themeMode}
            onChange={(e) =>
              doSave({ themeMode: e.target.value as 'light' | 'dark' | 'system' })
            }
            style={selectStyle}
          >
            {THEME_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {THEME_LABELS[mode] || mode}
              </option>
            ))}
          </select>
        </Field>
      </Section>

      <Section title="Behavior">
        <ToggleField
          label="Floating Toolbar"
          description="Show a floating toolbar when selecting text on webpages"
          checked={settings.floatingToolbar}
          onChange={(v) => doSave({ floatingToolbar: v })}
        />
        <ToggleField
          label="Auto-save Selected Text"
          description="Automatically save selected text without showing the save dialog"
          checked={settings.autoSaveSelected}
          onChange={(v) => doSave({ autoSaveSelected: v })}
        />
        <ToggleField
          label="Auto-highlight Saved Vocabulary"
          description="Automatically highlight your saved vocabulary words and phrases on every webpage you visit"
          checked={settings.autoHighlightSavedVocabulary}
          onChange={(v) => doSave({ autoHighlightSavedVocabulary: v })}
        />
        <ToggleField
          label="Auto AI Lookup"
          description="When the popup opens with a highlighted word, automatically look it up with AI"
          checked={settings.autoAiLookup}
          onChange={(v) => doSave({ autoAiLookup: v })}
        />
      </Section>

      <Section title="Defaults">
        <Field label="Default Save Category">
          <select
            value={settings.defaultCategory}
            onChange={(e) =>
              doSave({ defaultCategory: e.target.value as (typeof SAVE_CATEGORIES)[number] })
            }
            style={selectStyle}
          >
            {SAVE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat] || cat}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Default IELTS Topic">
          <input
            type="text"
            value={localTopic}
            onChange={(e) => handleTopicChange(e.target.value)}
            placeholder="general"
            style={inputStyle}
          />
        </Field>
      </Section>
    </>
  )
}
