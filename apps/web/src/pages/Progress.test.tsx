import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockGetAll = vi.fn()

vi.mock('../services/storage/Database', () => ({
  DatabaseService: {
    getAll: (...args: unknown[]) => mockGetAll(...args),
  },
}))

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => <div>Bar</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: () => <div>Line</div>,
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Cell: () => <div>Cell</div>,
  XAxis: () => <div>XAxis</div>,
  YAxis: () => <div>YAxis</div>,
  CartesianGrid: () => <div>CartesianGrid</div>,
  Tooltip: () => <div>Tooltip</div>,
  Legend: () => <div>Legend</div>,
}))

import Progress from './Progress'

const emptyStoreMock = () => {
  mockGetAll.mockImplementation((_store: string) => {
    return Promise.resolve([])
  })
}

const today = new Date().toISOString().slice(0, 10)

describe('Progress page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('shows loading state initially', () => {
    mockGetAll.mockResolvedValue([])
    render(<Progress />)
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('renders content after data loads', async () => {
    emptyStoreMock()
    render(<Progress />)

    await screen.findByText('Total Study Hours')
    expect(screen.getByText('Total Study Hours')).toBeInTheDocument()
    expect(screen.getByText('Tasks Completed')).toBeInTheDocument()
    expect(screen.getByText('Study Streak')).toBeInTheDocument()
    expect(screen.getByText('Vocabulary')).toBeInTheDocument()
  })

  it('shows roadmap progress section', async () => {
    emptyStoreMock()
    render(<Progress />)

    await screen.findByText('Roadmap Progress')
    expect(screen.getByText('Roadmap Progress')).toBeInTheDocument()
  })

  it('shows weekly activity section', async () => {
    emptyStoreMock()
    render(<Progress />)

    await screen.findByText('Weekly Activity')
    expect(screen.getByText('Weekly Activity')).toBeInTheDocument()
  })

  it('shows skill progress section', async () => {
    emptyStoreMock()
    render(<Progress />)

    await screen.findByText('Skill Progress')
    expect(screen.getByText('Skill Progress')).toBeInTheDocument()
  })

  it('shows skill balance section', async () => {
    emptyStoreMock()
    render(<Progress />)

    await screen.findByText('Skill Balance')
    expect(screen.getByText('Skill Balance')).toBeInTheDocument()
  })

  it('shows weak skills section', async () => {
    emptyStoreMock()
    render(<Progress />)

    await screen.findByText('Weak Skills')
    expect(screen.getByText('Weak Skills')).toBeInTheDocument()
  })

  it('shows recent activity section', async () => {
    emptyStoreMock()
    render(<Progress />)

    await screen.findByText('Recent Activity')
    expect(screen.getByText('Recent Activity')).toBeInTheDocument()
  })

  it('shows monthly summary section', async () => {
    emptyStoreMock()
    render(<Progress />)

    await screen.findByText('Monthly Summary')
    expect(screen.getByText('Monthly Summary')).toBeInTheDocument()
  })

  it('shows error state when database fails', async () => {
    mockGetAll.mockRejectedValue(new Error('Database error'))
    render(<Progress />)

    const errorText = await screen.findByText('Database error')
    expect(errorText).toBeInTheDocument()
  })

  it('renders with sample task data', async () => {
    mockGetAll.mockImplementation((store: string) => {
      if (store === 'tasks') return Promise.resolve([
        { id: '1', date: today, title: 'Task 1', isDone: true, timeMinutes: 30, completedAt: new Date().toISOString() },
        { id: '2', date: today, title: 'Task 2', isDone: false, timeMinutes: 20, completedAt: null },
      ])
      return Promise.resolve([])
    })
    render(<Progress />)

    await screen.findByText('Total Study Hours')
    expect(screen.getByText('Total Study Hours')).toBeInTheDocument()
  })

  it('handles vocabulary data', async () => {
    mockGetAll.mockImplementation((store: string) => {
      if (store === 'vocabulary') return Promise.resolve([
        { id: '1', word: 'test', meaning: 'a test', createdAt: new Date().toISOString() },
        { id: '2', word: 'example', meaning: 'an example', createdAt: new Date().toISOString() },
      ])
      return Promise.resolve([])
    })
    render(<Progress />)

    await screen.findByText('Total Study Hours')
    expect(screen.getByText('Vocabulary')).toBeInTheDocument()
  })

  it('renders from cached snapshot without database calls', async () => {
    const snapshot = {
      version: 2,
      totalTasksCompleted: 10,
      totalStudyMinutes: 600,
      currentStreak: 3,
      longestStreak: 5,
      weeklyProgress: [],
      skillProgress: [],
      vocabLearned: 25,
      vocabReviewed: 5,
      monthlySummary: [],
      roadmapProgress: 50,
      weakSkills: [],
      recentActivity: [],
      generatedAt: new Date().toISOString(),
    }
    localStorage.setItem('ielts-progress-snapshot-v2', JSON.stringify(snapshot))
    mockGetAll.mockRejectedValue(new Error('should not be called'))
    render(<Progress />)

    await screen.findByText('Total Study Hours')
    expect(screen.getByText('10.0')).toBeInTheDocument()
  })

  it('handles mistakes with null skill', async () => {
    mockGetAll.mockImplementation((store: string) => {
      if (store === 'mistakes') return Promise.resolve([
        { id: '1', skill: null, count: 1 },
      ])
      return Promise.resolve([])
    })
    render(<Progress />)

    await screen.findByText('Weak Skills')
    expect(screen.getByText('Weak Skills')).toBeInTheDocument()
  })

  it('handles vocabulary with missing createdAt', async () => {
    mockGetAll.mockImplementation((store: string) => {
      if (store === 'vocabulary') return Promise.resolve([
        { id: '1', word: 'test', meaning: 'a test' },
      ])
      return Promise.resolve([])
    })
    render(<Progress />)

    await screen.findByText('Total Study Hours')
  })

  it('handles empty recent activity', async () => {
    emptyStoreMock()
    render(<Progress />)

    await screen.findByText('Recent Activity')
    expect(screen.getByText('No recent activity. Start studying to track your progress.')).toBeInTheDocument()
  })

  it('handles empty weak skills', async () => {
    emptyStoreMock()
    render(<Progress />)

    await screen.findByText('Weak Skills')
    expect(screen.getByText('No mistakes logged yet. Keep practicing!')).toBeInTheDocument()
  })
})
