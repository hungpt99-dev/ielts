import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import BasicSettingsForm from '../../src/features/configuration/components/BasicSettingsForm'
import AdvancedSettingsForm from '../../src/features/configuration/components/AdvancedSettingsForm'
import { createDefaultConfiguration } from '../../src/features/configuration/storage'

const mockConfig = createDefaultConfiguration()
const mockActions = {
  updateBasic: vi.fn(),
  updateBasicField: vi.fn(),
  updateAdvanced: vi.fn(),
  updateAdvancedField: vi.fn(),
  updateTutorConfig: vi.fn(),
  addProvider: vi.fn(),
  updateProvider: vi.fn(),
  removeProvider: vi.fn(),
  setActiveProvider: vi.fn(),
  resetConfig: vi.fn(),
}

vi.mock('../../src/features/configuration/configSlice', () => ({
  useConfiguration: () => ({
    config: mockConfig as ReturnType<typeof createDefaultConfiguration>,
    actions: mockActions,
  }),
}))

beforeEach(() => {
  Object.assign(mockConfig, createDefaultConfiguration())
  vi.clearAllMocks()
})

describe('BasicSettingsForm', () => {
  it('renders form elements', () => {
    render(<BasicSettingsForm />)
    expect(screen.getByLabelText('Target IELTS Band')).toBeInTheDocument()
    expect(screen.getByLabelText('Exam Date')).toBeInTheDocument()
    expect(screen.getByLabelText('AI Response Language')).toBeInTheDocument()
    expect(screen.getByLabelText('Daily Study Time (minutes)')).toBeInTheDocument()
  })

  it('renders all tutor mode buttons', () => {
    render(<BasicSettingsForm />)
    expect(screen.getByText('Friendly Tutor')).toBeInTheDocument()
    expect(screen.getByText('Strict IELTS Examiner')).toBeInTheDocument()
    expect(screen.getByText('Simple English Teacher')).toBeInTheDocument()
    expect(screen.getByText('Vietnamese Explanation Tutor')).toBeInTheDocument()
    expect(screen.getByText('Motivation Coach')).toBeInTheDocument()
    expect(screen.getByText('Grammar-Focused Tutor')).toBeInTheDocument()
    expect(screen.getByText('Vocabulary-Focused Tutor')).toBeInTheDocument()
    expect(screen.getByText('Writing Correction Tutor')).toBeInTheDocument()
    expect(screen.getByText('Speaking Practice Tutor')).toBeInTheDocument()
  })

  it('shows the currently selected tutor mode', () => {
    mockConfig.basic.tutorMode = 'strict-examiner'
    render(<BasicSettingsForm />)
    expect(screen.getByText(/Current:/)).toBeInTheDocument()
    const found = screen.getAllByText('Strict IELTS Examiner')
    expect(found.length).toBeGreaterThanOrEqual(1)
  })

  it('renders Save Settings and Discard Changes buttons', () => {
    render(<BasicSettingsForm />)
    expect(screen.getByText('Save Settings')).toBeInTheDocument()
    expect(screen.getByText('Discard Changes')).toBeInTheDocument()
  })

  it('calls updateBasicField when band is changed', () => {
    render(<BasicSettingsForm />)
    fireEvent.change(screen.getByLabelText('Target IELTS Band'), { target: { value: '8' } })
    expect(mockActions.updateBasicField).toHaveBeenCalledWith('targetBand', 8)
  })

  it('calls updateBasicField when exam date is changed', () => {
    render(<BasicSettingsForm />)
    fireEvent.change(screen.getByLabelText('Exam Date'), { target: { value: '2026-12-15' } })
    expect(mockActions.updateBasicField).toHaveBeenCalledWith('examDate', '2026-12-15')
  })

  it('calls updateBasicField when language is changed', () => {
    render(<BasicSettingsForm />)
    fireEvent.change(screen.getByLabelText('AI Response Language'), { target: { value: 'vietnamese' } })
    expect(mockActions.updateBasicField).toHaveBeenCalledWith('responseLanguage', 'vietnamese')
  })

  it('calls updateBasicField when tutor mode is clicked', () => {
    render(<BasicSettingsForm />)
    fireEvent.click(screen.getByText('Strict IELTS Examiner'))
    expect(mockActions.updateBasicField).toHaveBeenCalledWith('tutorMode', 'strict-examiner')
  })

  it('calls updateBasicField when study time is changed', () => {
    render(<BasicSettingsForm />)
    fireEvent.change(screen.getByLabelText('Daily Study Time (minutes)'), { target: { value: '90' } })
    expect(mockActions.updateBasicField).toHaveBeenCalledWith('dailyStudyMinutes', 90)
  })

  it('clamps study time to minimum of 1', () => {
    render(<BasicSettingsForm />)
    fireEvent.change(screen.getByLabelText('Daily Study Time (minutes)'), { target: { value: '0' } })
    expect(mockActions.updateBasicField).toHaveBeenCalledWith('dailyStudyMinutes', 1)
  })

  it('calls updateBasic on Save Settings with valid data', () => {
    render(<BasicSettingsForm />)
    fireEvent.click(screen.getByText('Save Settings'))
    expect(mockActions.updateBasic).toHaveBeenCalled()
  })

  it('does not call updateBasic on Save Settings with invalid data', () => {
    mockConfig.basic.targetBand = 0
    render(<BasicSettingsForm />)
    fireEvent.click(screen.getByText('Save Settings'))
    expect(mockActions.updateBasic).not.toHaveBeenCalled()
  })

  it('shows validation error for invalid study time', () => {
    render(<BasicSettingsForm />)
    fireEvent.change(screen.getByLabelText('Daily Study Time (minutes)'), { target: { value: '1441' } })
    expect(screen.getByText('Study time must be between 1 and 1440 minutes')).toBeInTheDocument()
  })

  it('shows recommended study time helper text', () => {
    render(<BasicSettingsForm />)
    expect(screen.getByText('Recommended: 30–120 minutes')).toBeInTheDocument()
  })
})

describe('AdvancedSettingsForm rendering', () => {
  it('renders all configuration sections', () => {
    render(<AdvancedSettingsForm />)
    expect(screen.getByText('AI Provider')).toBeInTheDocument()
    expect(screen.getByText('AI Tutor Behavior')).toBeInTheDocument()
    expect(screen.getByText('Vocabulary Review')).toBeInTheDocument()
    expect(screen.getByText('Speaking Feedback')).toBeInTheDocument()
    expect(screen.getByText('Writing Correction')).toBeInTheDocument()
    expect(screen.getByText('Privacy & Data Usage')).toBeInTheDocument()
  })

  it('renders provider type options', () => {
    render(<AdvancedSettingsForm />)
    expect(screen.getByText('OpenAI')).toBeInTheDocument()
    expect(screen.getByText('Claude (Anthropic)')).toBeInTheDocument()
    expect(screen.getByText('Google Gemini')).toBeInTheDocument()
    expect(screen.getByText('DeepSeek')).toBeInTheDocument()
    expect(screen.getByText('OpenRouter')).toBeInTheDocument()
    expect(screen.getByText('Groq')).toBeInTheDocument()
    expect(screen.getByText('Local AI')).toBeInTheDocument()
    expect(screen.getByText('Custom API Compatible')).toBeInTheDocument()
  })

  it('renders provider form fields', () => {
    render(<AdvancedSettingsForm />)
    expect(screen.getByLabelText('Provider Type')).toBeInTheDocument()
    expect(screen.getByLabelText('Model')).toBeInTheDocument()
    expect(screen.getByLabelText('API Key')).toBeInTheDocument()
    expect(screen.getByLabelText('Base URL')).toBeInTheDocument()
    expect(screen.getByLabelText('Temperature')).toBeInTheDocument()
    expect(screen.getByLabelText('Max Tokens')).toBeInTheDocument()
    expect(screen.getByLabelText('Cost Limit ($)')).toBeInTheDocument()
    expect(screen.getByLabelText('Usage Limit (requests)')).toBeInTheDocument()
    expect(screen.getByText('Fallback Provider')).toBeInTheDocument()
    expect(screen.getByText('System Prompt (Optional)')).toBeInTheDocument()
  })

  it('renders Add Provider and action buttons', () => {
    render(<AdvancedSettingsForm />)
    expect(screen.getByText('+ Add Provider')).toBeInTheDocument()
    expect(screen.getByText('Save Settings')).toBeInTheDocument()
    expect(screen.getByText('Discard Changes')).toBeInTheDocument()
  })

  it('renders tutor behavior selects', () => {
    render(<AdvancedSettingsForm />)
    expect(screen.getByLabelText('Explanation Style')).toBeInTheDocument()
    expect(screen.getByLabelText('Correction Strictness')).toBeInTheDocument()
    expect(screen.getByLabelText('Exercise Difficulty')).toBeInTheDocument()
    expect(screen.getByLabelText('Feedback Depth')).toBeInTheDocument()
    expect(screen.getByLabelText('Automation Level')).toBeInTheDocument()
    expect(screen.getByLabelText('Study Reminder Frequency')).toBeInTheDocument()
    expect(screen.getByText('Custom System Prompt (Optional)')).toBeInTheDocument()
  })

  it('renders vocab review toggles', () => {
    render(<AdvancedSettingsForm />)
    expect(screen.getByText('Spaced Repetition')).toBeInTheDocument()
    expect(screen.getByText('Context Sentences')).toBeInTheDocument()
    expect(screen.getByText('Example Sentences')).toBeInTheDocument()
    expect(screen.getByText('Synonyms')).toBeInTheDocument()
  })

  it('renders speaking feedback toggles', () => {
    render(<AdvancedSettingsForm />)
    expect(screen.getByText('Pronunciation Feedback')).toBeInTheDocument()
    expect(screen.getByText('Fluency Feedback')).toBeInTheDocument()
    expect(screen.getByText('Vocabulary Feedback')).toBeInTheDocument()
    expect(screen.getByText('Grammar Feedback')).toBeInTheDocument()
  })

  it('renders writing correction toggles', () => {
    render(<AdvancedSettingsForm />)
    expect(screen.getByText('Grammar Correction')).toBeInTheDocument()
    expect(screen.getByText('Vocabulary Suggestions')).toBeInTheDocument()
    expect(screen.getByText('Structure Feedback')).toBeInTheDocument()
    expect(screen.getByText('Coherence Feedback')).toBeInTheDocument()
    expect(screen.getByText('Show Improved Version')).toBeInTheDocument()
  })

  it('renders privacy toggles and select', () => {
    render(<AdvancedSettingsForm />)
    expect(screen.getByLabelText('Privacy Level')).toBeInTheDocument()
    expect(screen.getByText('Anonymous Analytics')).toBeInTheDocument()
    expect(screen.getByText('Crash Reporting')).toBeInTheDocument()
    expect(screen.getByText('Store Conversation History')).toBeInTheDocument()
    expect(screen.getByText('Store Usage Statistics')).toBeInTheDocument()
  })
})
