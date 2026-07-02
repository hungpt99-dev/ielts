import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

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

function makeProgressTopic(overrides: Record<string, unknown> = {}) {
  return {
    id: crypto.randomUUID(),
    topicId: crypto.randomUUID(),
    topic: 'Education',
    progressPercent: 50,
    vocabularyCount: 5,
    readingCount: 3,
    listeningCount: 2,
    writingCount: 1,
    speakingCount: 0,
    weakPoints: [],
    lastReviewedAt: '2025-06-01T00:00:00.000Z',
    updatedAt: '2025-06-01T00:00:00.000Z',
    ...overrides,
  }
}

const noDataMocks = () => {
  mockGetAll.mockImplementation((store: string) => {
    if (store === 'topicsProgress') return Promise.resolve([])
    return Promise.resolve([])
  })
}

const topicDataMocks = () => {
  mockGetAll.mockImplementation((store: string) => {
    if (store === 'topicsProgress') return Promise.resolve([
      makeProgressTopic({ topic: 'Education', progressPercent: 90 }),
      makeProgressTopic({ topic: 'Environment', progressPercent: 65 }),
      makeProgressTopic({ topic: 'Technology', progressPercent: 45 }),
      makeProgressTopic({ topic: 'Health', progressPercent: 25 }),
      makeProgressTopic({ topic: 'Travel', progressPercent: 10 }),
    ])
    return Promise.resolve([])
  })
}

describe('Progress page topics progress sections', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading state initially', () => {
    mockGetAll.mockResolvedValue([])
    render(<Progress />)
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('shows empty state for topic sections when no data', async () => {
    noDataMocks()
    render(<Progress />)

    await screen.findByText('Progress Analytics')

    expect(screen.getByText('No topic progress data yet.')).toBeInTheDocument()
    expect(screen.getByText('Study different topics to see progress.')).toBeInTheDocument()
    expect(screen.getByText('No topic trend data yet.')).toBeInTheDocument()
  })

  it('renders topic status distribution section with data', async () => {
    topicDataMocks()
    render(<Progress />)

    await screen.findByText('Topics Progress Overview')

    expect(screen.getByText('Topic Status Distribution')).toBeInTheDocument()
    expect(screen.getByText('Top Topics by Progress')).toBeInTheDocument()
    expect(screen.getByText('Topics Progress Trend')).toBeInTheDocument()
  })

  it('shows error state when database fails', async () => {
    mockGetAll.mockRejectedValue(new Error('Database error'))
    render(<Progress />)

    const errorText = await screen.findByText('Database error')
    expect(errorText).toBeInTheDocument()
  })

  it('handles large number of topics correctly', async () => {
    const manyTopics = Array.from({ length: 25 }, (_, i) =>
      makeProgressTopic({ topic: `Topic ${i + 1}`, progressPercent: Math.floor(Math.random() * 100) })
    )
    mockGetAll.mockImplementation((store: string) => {
      if (store === 'topicsProgress') return Promise.resolve(manyTopics)
      return Promise.resolve([])
    })
    render(<Progress />)

    await screen.findByText('Topics Progress Overview')
    expect(screen.getByText('Topics Progress Overview')).toBeInTheDocument()
  })

  it('handles topics at boundary progress values', async () => {
    mockGetAll.mockImplementation((store: string) => {
      if (store === 'topicsProgress') return Promise.resolve([
        makeProgressTopic({ topic: 'Mastered', progressPercent: 100 }),
        makeProgressTopic({ topic: 'Zero Progress', progressPercent: 0 }),
      ])
      return Promise.resolve([])
    })
    render(<Progress />)

    await screen.findByText('Topics Progress Overview')
    expect(screen.getByText('Topics Progress Overview')).toBeInTheDocument()
  })

  it('handles tasks with recent dates exercising getWeekLabel slice guard', async () => {
    const today = new Date().toISOString().slice(0, 10)
    mockGetAll.mockImplementation((store: string) => {
      if (store === 'tasks') return Promise.resolve([
        { id: '1', date: today, title: 'Task', isDone: true, timeMinutes: 30 },
      ])
      return Promise.resolve([])
    })
    render(<Progress />)
    await screen.findByText('Progress Analytics')
  })

  it('handles mistakes with null skill field', async () => {
    mockGetAll.mockImplementation((store: string) => {
      if (store === 'mistakes') return Promise.resolve([
        { id: '1', skill: null, count: 1 },
      ])
      return Promise.resolve([])
    })
    render(<Progress />)
    await screen.findByText('Progress Analytics')
  })

  it('handles topics with null or empty topic name', async () => {
    mockGetAll.mockImplementation((store: string) => {
      if (store === 'topicsProgress') return Promise.resolve([
        makeProgressTopic({ topic: null }),
        makeProgressTopic({ topic: '' }),
      ])
      return Promise.resolve([])
    })
    render(<Progress />)
    await screen.findByText('Progress Analytics')
  })

  it('handles vocabulary with missing createdAt date', async () => {
    mockGetAll.mockImplementation((store: string) => {
      if (store === 'vocabulary') return Promise.resolve([
        { id: '1', word: 'test', meaning: 'a test' },
      ])
      return Promise.resolve([])
    })
    render(<Progress />)
    await screen.findByText('Progress Analytics')
  })

  it('handles vocabulary reviews with missing lastReviewDate', async () => {
    mockGetAll.mockImplementation((store: string) => {
      if (store === 'vocabularyReviews') return Promise.resolve([
        { id: '1', word: 'test' },
      ])
      return Promise.resolve([])
    })
    render(<Progress />)
    await screen.findByText('Progress Analytics')
  })
})
