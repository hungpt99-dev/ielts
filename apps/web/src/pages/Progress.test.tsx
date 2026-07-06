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
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Cell: () => <div>Cell</div>,
  XAxis: () => <div>XAxis</div>,
  YAxis: () => <div>YAxis</div>,
  CartesianGrid: () => <div>CartesianGrid</div>,
  Tooltip: () => <div>Tooltip</div>,
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
    const skeleton = document.querySelector('[role="status"]')
    expect(skeleton).toBeInTheDocument()
  })

  it('renders content after data loads', async () => {
    emptyStoreMock()
    render(<Progress />)

    await screen.findByText('Learning Progress')
    expect(screen.getByText('Learning Progress')).toBeInTheDocument()
    expect(screen.getByText('Study Hours')).toBeInTheDocument()
    expect(screen.getByText('Band Progress')).toBeInTheDocument()
    expect(screen.getByText('Study Streak')).toBeInTheDocument()
    expect(screen.getByText('Vocabulary')).toBeInTheDocument()
  })

  it('shows roadmap progress section', async () => {
    emptyStoreMock()
    render(<Progress />)

    await screen.findByText('Roadmap Progress')
    expect(screen.getByText('Roadmap Progress')).toBeInTheDocument()
  })

  it('shows weak skills section', async () => {
    emptyStoreMock()
    render(<Progress />)

    await screen.findByText('Mistakes')
    expect(screen.getByText('Mistakes')).toBeInTheDocument()
  })

  it('shows recent activity section', async () => {
    emptyStoreMock()
    render(<Progress />)

    await screen.findByText('Recent Activity')
    expect(screen.getByText('Recent Activity')).toBeInTheDocument()
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

    await screen.findByText('Study Hours')
    expect(screen.getByText('Study Hours')).toBeInTheDocument()
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

    await screen.findByText('Study Hours')
    expect(screen.getByText('Vocab Words')).toBeInTheDocument()
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

    await screen.findByText('Study Hours')
    expect(screen.getByText('10.0h')).toBeInTheDocument()
  })

  it('handles mistakes with null skill', async () => {
    mockGetAll.mockImplementation((store: string) => {
      if (store === 'mistakes') return Promise.resolve([
        { id: '1', skill: null, count: 1 },
      ])
      return Promise.resolve([])
    })
    render(<Progress />)

    await screen.findByText('Mistakes')
    expect(screen.getByText('Mistakes')).toBeInTheDocument()
  })

  it('handles vocabulary with missing createdAt', async () => {
    mockGetAll.mockImplementation((store: string) => {
      if (store === 'vocabulary') return Promise.resolve([
        { id: '1', word: 'test', meaning: 'a test' },
      ])
      return Promise.resolve([])
    })
    render(<Progress />)

    await screen.findByText('Study Hours')
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

    await screen.findByText('Mistakes')
    expect(screen.getByText('No mistakes logged yet — that means you\'re practicing well!')).toBeInTheDocument()
  })
})
