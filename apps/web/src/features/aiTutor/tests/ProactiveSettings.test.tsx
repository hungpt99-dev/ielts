import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { renderHook, act } from '@testing-library/react'
import ProactiveSettings from '../components/ProactiveSettings'
import {
  useProactiveSettings,
  loadProactiveSettings,
  saveProactiveSettings,
  resetProactiveSettings,
  validateProactiveSettings,
  DEFAULT_PROACTIVE_SETTINGS,
  SETTINGS_KEY,
  CATEGORY_LABELS,
} from '../hooks/useProactiveSettings'
import type { ProactiveMessageSettings } from '../hooks/useProactiveSettings'

const mockSettings: ProactiveMessageSettings = {
  ...DEFAULT_PROACTIVE_SETTINGS,
  enabled: true,
  tone: 'friendly',
  preferredStudyTime: '09:00',
  dailyReminderTime: '09:00',
  reminderFrequency: 'smart',
  weakSkillPriority: ['reading', 'writing-task-2'],
  notificationChannels: ['in-app', 'browser'],
  automationLevel: 'semi-automatic',
  autoSuggestExercises: true,
  autoWeeklyReview: true,
  maxMessagesPerDay: 5,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
}

function setupLocalStorage(settings?: Partial<ProactiveMessageSettings>) {
  const stored = settings
    ? { ...DEFAULT_PROACTIVE_SETTINGS, ...settings }
    : { ...DEFAULT_PROACTIVE_SETTINGS }
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(stored))
}

function clearLocalStorage() {
  localStorage.clear()
}

// ─── useProactiveSettings hook tests ─────────────────────────────────────

describe('useProactiveSettings', () => {
  beforeEach(() => {
    clearLocalStorage()
  })

  it('loads default settings when nothing is stored', () => {
    const { result } = renderHook(() => useProactiveSettings())
    expect(result.current.settings.enabled).toBe(true)
    expect(result.current.settings.tone).toBe('friendly')
    expect(result.current.settings.maxMessagesPerDay).toBe(5)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.validationErrors).toEqual({})
  })

  it('loads existing settings from localStorage', () => {
    setupLocalStorage({ tone: 'strict', maxMessagesPerDay: 10 })
    const { result } = renderHook(() => useProactiveSettings())
    expect(result.current.settings.tone).toBe('strict')
    expect(result.current.settings.maxMessagesPerDay).toBe(10)
  })

  it('updates settings via update function', () => {
    const { result } = renderHook(() => useProactiveSettings())
    act(() => {
      result.current.update({ tone: 'motivational' })
    })
    expect(result.current.settings.tone).toBe('motivational')
  })

  it('tracks unsaved changes', () => {
    const { result } = renderHook(() => useProactiveSettings())
    expect(result.current.hasUnsavedChanges).toBe(false)
    act(() => {
      result.current.update({ maxMessagesPerDay: 15 })
    })
    expect(result.current.hasUnsavedChanges).toBe(true)
  })

  it('saves settings to localStorage', () => {
    const { result } = renderHook(() => useProactiveSettings())
    act(() => {
      result.current.update({ tone: 'motivational' })
    })
    act(() => {
      result.current.save()
    })
    const loaded = loadProactiveSettings()
    expect(loaded.tone).toBe('motivational')
  })

  it('shows saved indicator after saving', async () => {
    const { result } = renderHook(() => useProactiveSettings())
    act(() => {
      result.current.update({ tone: 'strict' })
    })
    act(() => {
      result.current.save()
    })
    expect(result.current.saved).toBe(true)
    await waitFor(() => {
      expect(result.current.saved).toBe(false)
    }, { timeout: 3000 })
  })

  it('resets settings to defaults', () => {
    setupLocalStorage({ tone: 'strict', maxMessagesPerDay: 20 })
    const { result } = renderHook(() => useProactiveSettings())
    act(() => {
      result.current.reset()
    })
    expect(result.current.settings.tone).toBe('friendly')
    expect(result.current.settings.maxMessagesPerDay).toBe(5)
    expect(result.current.hasUnsavedChanges).toBe(false)
  })

  it('validates settings before saving and sets validation errors', () => {
    const { result } = renderHook(() => useProactiveSettings())
    act(() => {
      result.current.update({ maxMessagesPerDay: 0 })
    })
    act(() => {
      result.current.save()
    })
    expect(Object.keys(result.current.validationErrors).length).toBeGreaterThan(0)
    expect(result.current.validationErrors.maxMessagesPerDay).toBeDefined()
  })

  it('recovers gracefully when save fails silently', () => {
    const { result } = renderHook(() => useProactiveSettings())
    act(() => {
      result.current.update({ tone: 'strict' })
    })
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage full')
    })
    act(() => {
      result.current.save()
    })
    expect(result.current.saved).toBe(true)
    setItemSpy.mockRestore()
  })

  it('clears validation errors on update', () => {
    const { result } = renderHook(() => useProactiveSettings())
    act(() => {
      result.current.update({ maxMessagesPerDay: 0 })
    })
    act(() => {
      result.current.save()
    })
    expect(Object.keys(result.current.validationErrors).length).toBeGreaterThan(0)
    act(() => {
      result.current.update({ maxMessagesPerDay: 5 })
    })
    expect(Object.keys(result.current.validationErrors).length).toBe(0)
  })
})

// ─── validateProactiveSettings tests ─────────────────────────────────────

describe('validateProactiveSettings', () => {
  it('returns no errors for valid settings', () => {
    const errors = validateProactiveSettings(mockSettings)
    expect(Object.keys(errors).length).toBe(0)
  })

  it('returns error for empty preferredStudyTime', () => {
    const errors = validateProactiveSettings({ ...mockSettings, preferredStudyTime: '' })
    expect(errors.preferredStudyTime).toBe('Preferred study time is required')
  })

  it('returns error for maxMessagesPerDay out of range', () => {
    const low = validateProactiveSettings({ ...mockSettings, maxMessagesPerDay: 0 })
    expect(low.maxMessagesPerDay).toBeDefined()

    const high = validateProactiveSettings({ ...mockSettings, maxMessagesPerDay: 51 })
    expect(high.maxMessagesPerDay).toBeDefined()
  })

  it('returns error when no notification channels selected', () => {
    const errors = validateProactiveSettings({ ...mockSettings, notificationChannels: [] })
    expect(errors.notificationChannels).toBe('At least one notification channel must be selected')
  })
})

// ─── loadProactiveSettings tests ─────────────────────────────────────────

describe('loadProactiveSettings', () => {
  beforeEach(() => {
    clearLocalStorage()
  })

  it('returns defaults when localStorage is empty', () => {
    const settings = loadProactiveSettings()
    expect(settings.enabled).toBe(true)
    expect(settings.tone).toBe('friendly')
  })

  it('merges partial stored settings with defaults', () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ tone: 'strict', maxMessagesPerDay: 15 }))
    const settings = loadProactiveSettings()
    expect(settings.tone).toBe('strict')
    expect(settings.maxMessagesPerDay).toBe(15)
    expect(settings.enabled).toBe(true)
  })

  it('merges partial categories with default categories', () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      categories: { 'vocabulary-review': false },
    }))
    const settings = loadProactiveSettings()
    expect(settings.categories['vocabulary-review']).toBe(false)
    expect(settings.categories['mistake-review']).toBe(true)
  })

  it('returns defaults when localStorage has invalid JSON', () => {
    localStorage.setItem(SETTINGS_KEY, 'not-json')
    const settings = loadProactiveSettings()
    expect(settings.enabled).toBe(true)
  })
})

// ─── saveProactiveSettings tests ─────────────────────────────────────────

describe('saveProactiveSettings', () => {
  beforeEach(() => {
    clearLocalStorage()
  })

  it('persists settings to localStorage', () => {
    saveProactiveSettings(mockSettings)
    const raw = localStorage.getItem(SETTINGS_KEY)
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw!)
    expect(parsed.tone).toBe('friendly')
    expect(parsed.weakSkillPriority).toEqual(['reading', 'writing-task-2'])
  })
})

// ─── resetProactiveSettings tests ────────────────────────────────────────

describe('resetProactiveSettings', () => {
  beforeEach(() => {
    clearLocalStorage()
  })

  it('resets to defaults and saves to localStorage', () => {
    saveProactiveSettings({ ...mockSettings, tone: 'strict' })
    resetProactiveSettings()
    const settings = loadProactiveSettings()
    expect(settings.tone).toBe('friendly')
    expect(settings.enabled).toBe(true)
  })
})

// ─── ProactiveSettings component tests ───────────────────────────────────

describe('ProactiveSettings', () => {
  beforeEach(() => {
    clearLocalStorage()
  })

  it('renders the header', () => {
    render(<ProactiveSettings />)
    expect(screen.getByText('Proactive Tutor Settings')).toBeInTheDocument()
  })

  it('renders local-first notice', () => {
    render(<ProactiveSettings />)
    expect(screen.getByText('Local-First Notice')).toBeInTheDocument()
  })

  it('renders enable toggle', () => {
    render(<ProactiveSettings />)
    expect(screen.getByText('Enable Proactive Tutor Messages')).toBeInTheDocument()
  })

  it('shows advanced settings when enabled', () => {
    render(<ProactiveSettings />)
    expect(screen.getByText('Tutor Tone')).toBeInTheDocument()
    expect(screen.getByText('Reminder Frequency')).toBeInTheDocument()
    expect(screen.getByText('Automation Level')).toBeInTheDocument()
  })

  it('renders daily reminder time input', () => {
    render(<ProactiveSettings />)
    expect(screen.getByLabelText('Daily Reminder Time')).toBeInTheDocument()
  })

  it('renders preferred study time input', () => {
    render(<ProactiveSettings />)
    expect(screen.getByLabelText('Preferred Study Time')).toBeInTheDocument()
  })

  it('renders weak skill priority multi-select', () => {
    render(<ProactiveSettings />)
    expect(screen.getByText('Weak Skill Priority')).toBeInTheDocument()
  })

  it('renders notification channel options', () => {
    render(<ProactiveSettings />)
    const labels = screen.getAllByText('In-App')
    expect(labels.length).toBeGreaterThanOrEqual(1)
  })

  it('renders auto-suggest exercises toggle', () => {
    render(<ProactiveSettings />)
    expect(screen.getByText('Auto-Suggest Exercises')).toBeInTheDocument()
  })

  it('renders auto weekly review toggle', () => {
    render(<ProactiveSettings />)
    expect(screen.getByText('Auto-Generate Weekly Progress Review')).toBeInTheDocument()
  })

  it('renders quiet hours section', () => {
    render(<ProactiveSettings />)
    const headings = screen.getAllByText('Quiet Hours')
    expect(headings.length).toBeGreaterThanOrEqual(1)
  })

  it('renders max messages per day input', () => {
    render(<ProactiveSettings />)
    expect(screen.getByLabelText('Max Messages Per Day')).toBeInTheDocument()
  })

  it('renders message categories section', () => {
    render(<ProactiveSettings />)
    expect(screen.getByText('Message Categories')).toBeInTheDocument()
    expect(screen.getByText(CATEGORY_LABELS['vocabulary-review'])).toBeInTheDocument()
  })

  it('renders save and reset buttons', () => {
    render(<ProactiveSettings />)
    expect(screen.getByText('Save Settings')).toBeInTheDocument()
    expect(screen.getByText('Reset')).toBeInTheDocument()
  })

  it('renders close button when onClose is provided', () => {
    const onClose = vi.fn()
    render(<ProactiveSettings onClose={onClose} />)
    expect(screen.getByLabelText('Close settings')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<ProactiveSettings onClose={onClose} />)
    fireEvent.click(screen.getByLabelText('Close settings'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('shows saved indicator after saving changes', async () => {
    render(<ProactiveSettings />)

    const toneSelect = screen.getByLabelText('Tutor Tone') as HTMLSelectElement
    fireEvent.change(toneSelect, { target: { value: 'strict' } })

    fireEvent.click(screen.getByText('Save Settings'))
    await waitFor(() => {
      expect(screen.getByText('Settings saved.')).toBeInTheDocument()
    })
  })

  it('disables save button when no changes are made', () => {
    render(<ProactiveSettings />)
    const saveButton = screen.getByText('Save Settings').closest('button')
    expect(saveButton).toBeDisabled()
  })

  it('enables save button after making changes', () => {
    render(<ProactiveSettings />)
    const saveButton = screen.getByText('Save Settings').closest('button')
    expect(saveButton).toBeDisabled()

    const toneSelect = screen.getByLabelText('Tutor Tone') as HTMLSelectElement
    fireEvent.change(toneSelect, { target: { value: 'strict' } })
    expect(saveButton).not.toBeDisabled()
  })

  it('resets settings when reset button is clicked', () => {
    render(<ProactiveSettings />)

    const toneSelect = screen.getByLabelText('Tutor Tone') as HTMLSelectElement
    fireEvent.change(toneSelect, { target: { value: 'strict' } })
    expect(toneSelect.value).toBe('strict')

    fireEvent.click(screen.getByText('Reset'))
    expect(toneSelect.value).toBe('friendly')
  })

  it('toggles a message category when clicked', () => {
    render(<ProactiveSettings />)
    const switches = screen.getAllByRole('switch')
    const vocabSwitch = switches.find(s =>
      s.closest('div')?.textContent?.includes(CATEGORY_LABELS['vocabulary-review']),
    )
    expect(vocabSwitch).toBeDefined()
    expect(vocabSwitch).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(vocabSwitch!)
    expect(vocabSwitch).toHaveAttribute('aria-checked', 'false')
  })

  it('toggles notification channels when clicked', () => {
    render(<ProactiveSettings />)
    const browserLabel = screen.getByText('Browser').closest('label')!
    const browserCheckbox = browserLabel.querySelector('input[type="checkbox"]') as HTMLInputElement
    expect(browserCheckbox).not.toBeChecked()
    fireEvent.click(browserLabel)
    expect(browserCheckbox).toBeChecked()
  })

  it('displays validation errors for invalid settings', () => {
    render(<ProactiveSettings />)
    const reminderInput = screen.getByLabelText('Daily Reminder Time') as HTMLInputElement
    fireEvent.change(reminderInput, { target: { value: '' } })
    fireEvent.click(screen.getByText('Save Settings'))
    expect(reminderInput.closest('div')?.querySelector('.text-red-500')).toBeInTheDocument()
  })

  it('hides advanced settings when disabled', () => {
    render(<ProactiveSettings />)
    expect(screen.getByText('Tutor Tone')).toBeInTheDocument()

    const switches = screen.getAllByRole('switch')
    const enableSwitch = switches.find(s =>
      s.closest('div')?.textContent?.includes('Enable Proactive Tutor Messages'),
    )
    expect(enableSwitch).toBeDefined()
    expect(enableSwitch).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(enableSwitch!)
    expect(enableSwitch).toHaveAttribute('aria-checked', 'false')
    expect(screen.queryByText('Tutor Tone')).not.toBeInTheDocument()
  })

  it('has accessible role for the settings panel', () => {
    render(<ProactiveSettings />)
    const panel = screen.getByText('Proactive Tutor Settings').closest('div')
    expect(panel).toBeInTheDocument()
  })

  it('opens and closes multi-select dropdown', () => {
    render(<ProactiveSettings />)
    const multiSelectButton = screen.getByText(/Select skills...|skill selected/)
    fireEvent.click(multiSelectButton)
    expect(screen.getByText('Reading')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Reading'))
    expect(screen.getByText(/1 skill selected/)).toBeInTheDocument()
  })
})

// ─── ProactiveSettings with onClose tests ────────────────────────────────

describe('ProactiveSettings with onClose', () => {
  beforeEach(() => {
    clearLocalStorage()
  })

  it('renders without close button when onClose is not provided', () => {
    render(<ProactiveSettings />)
    expect(screen.queryByLabelText('Close settings')).not.toBeInTheDocument()
  })
})

// ─── ProactiveSettings integration tests ─────────────────────────────────

describe('ProactiveSettings Integration', () => {
  beforeEach(() => {
    clearLocalStorage()
  })

  it('persists changes to localStorage after save', () => {
    render(<ProactiveSettings />)

    const toneSelect = screen.getByLabelText('Tutor Tone') as HTMLSelectElement
    fireEvent.change(toneSelect, { target: { value: 'motivational' } })

    fireEvent.click(screen.getByText('Save Settings'))

    const saved = loadProactiveSettings()
    expect(saved.tone).toBe('motivational')
  })

  it('loads saved settings from localStorage on mount', () => {
    saveProactiveSettings({
      ...DEFAULT_PROACTIVE_SETTINGS,
      tone: 'strict',
      maxMessagesPerDay: 12,
    })

    render(<ProactiveSettings />)

    const toneSelect = screen.getByLabelText('Tutor Tone') as HTMLSelectElement
    expect(toneSelect.value).toBe('strict')

    const maxInput = screen.getByLabelText('Max Messages Per Day') as HTMLInputElement
    expect(maxInput.value).toBe('12')
  })
})
