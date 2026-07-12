import { useState, useEffect } from 'react'
import type { ExtensionSettings } from '@/background/settingsStorage'
import { SAVE_CATEGORIES, THEME_MODES } from '@/background/settingsStorage'
import { NATIVE_LANGUAGES } from '@ielts/settings'
import { Section, Field, ToggleField, inputStyle, selectStyle } from './ui'

interface GeneralSettingsProps {
  settings: ExtensionSettings
  onChange: (patch: Partial<ExtensionSettings>) => void
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

export default function GeneralSettings({ settings, onChange }: GeneralSettingsProps) {
  const [localTopic, setLocalTopic] = useState(settings.defaultTopic)

  useEffect(() => {
    setLocalTopic(settings.defaultTopic)
  }, [settings.defaultTopic])

  return (
    <>
      <Section title="Appearance">
        <Field label="Theme Mode">
          <select
            value={settings.themeMode}
            onChange={(e) =>
              onChange({ themeMode: e.target.value as 'light' | 'dark' | 'system' })
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
          onChange={(v) => onChange({ floatingToolbar: v })}
        />
        <ToggleField
          label="Auto-save Selected Text"
          description="Automatically save selected text without showing the save dialog"
          checked={settings.autoSaveSelected}
          onChange={(v) => onChange({ autoSaveSelected: v })}
        />
        <ToggleField
          label="Auto-highlight Saved Vocabulary"
          description="Automatically highlight your saved vocabulary words and phrases on every webpage you visit"
          checked={settings.autoHighlightSavedVocabulary}
          onChange={(v) => onChange({ autoHighlightSavedVocabulary: v })}
        />
        <ToggleField
          label="Auto AI Lookup"
          description="When the popup opens with a highlighted word, automatically look it up with AI"
          checked={settings.autoAiLookup}
          onChange={(v) => onChange({ autoAiLookup: v })}
        />
        <ToggleField
          label="Auto-translate YouTube Transcript"
          description="Automatically translate YouTube video transcripts to your native language"
          checked={settings.autoTranslateTranscript}
          onChange={(v) => onChange({ autoTranslateTranscript: v })}
        />
      </Section>

      <Section title="Defaults">
        <Field label="Default Save Category">
          <select
            value={settings.defaultCategory}
            onChange={(e) =>
              onChange({ defaultCategory: e.target.value as (typeof SAVE_CATEGORIES)[number] })
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
            onChange={(e) => {
              setLocalTopic(e.target.value)
              onChange({ defaultTopic: e.target.value })
            }}
            placeholder="general"
            style={inputStyle}
          />
        </Field>
        <Field label="Native Language" description="Used for AI translations and vocabulary explanations">
          <select
            value={settings.nativeLanguage}
            onChange={(e) => onChange({ nativeLanguage: e.target.value })}
            style={selectStyle}
          >
            {NATIVE_LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </Field>
      </Section>
    </>
  )
}
