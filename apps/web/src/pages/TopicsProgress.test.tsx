import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { TopicProgress } from '../models'

const mockGetAll = vi.fn()

vi.mock('../services/storage/Database', () => ({
  DatabaseService: {
    getAll: (...args: unknown[]) => mockGetAll(...args),
  },
}))

import TopicsProgress from './TopicsProgress'

function makeTopic(id: string, overrides: Partial<TopicProgress> = {}): TopicProgress {
  return {
    id,
    topicId: id,
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

const sampleTopics: TopicProgress[] = [
  makeTopic('t1', { topic: 'Education', progressPercent: 90, vocabularyCount: 20, readingCount: 10, listeningCount: 8, writingCount: 5, speakingCount: 3, weakPoints: [], lastReviewedAt: '2025-06-15T00:00:00.000Z' }),
  makeTopic('t2', { topic: 'Environment', progressPercent: 65, vocabularyCount: 15, readingCount: 5, listeningCount: 10, writingCount: 2, speakingCount: 1, weakPoints: ['Vocabulary', 'Grammar'] }),
  makeTopic('t3', { topic: 'Technology', progressPercent: 45, vocabularyCount: 10, readingCount: 3, listeningCount: 2, writingCount: 1, speakingCount: 0, weakPoints: [] }),
  makeTopic('t4', { topic: 'Health', progressPercent: 25, vocabularyCount: 5, readingCount: 1, listeningCount: 0, writingCount: 0, speakingCount: 0, weakPoints: ['Reading'] }),
  makeTopic('t5', { topic: 'Travel', progressPercent: 10, vocabularyCount: 2, readingCount: 0, listeningCount: 0, writingCount: 0, speakingCount: 0, weakPoints: ['Vocabulary', 'Listening', 'Speaking'] }),
]

describe('TopicsProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading spinner initially', () => {
    mockGetAll.mockResolvedValue([])
    render(<TopicsProgress />)
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('shows empty state when no topics', async () => {
    mockGetAll.mockResolvedValue([])
    render(<TopicsProgress />)
    const text = await screen.findByText('No topics progress data yet.')
    expect(text).toBeInTheDocument()
  })

  it('shows error state with retry button', async () => {
    mockGetAll.mockRejectedValue(new Error('Network error'))
    render(<TopicsProgress />)
    const errorText = await screen.findByText('Network error')
    expect(errorText).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })

  it('renders summary stats correctly', async () => {
    mockGetAll.mockResolvedValue(sampleTopics)
    render(<TopicsProgress />)

    await screen.findByText('Topics Progress')

    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('47%')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('renders all topic rows', async () => {
    mockGetAll.mockResolvedValue(sampleTopics)
    render(<TopicsProgress />)

    await screen.findByText('Topics Progress')

    expect(screen.getByText('Education')).toBeInTheDocument()
    expect(screen.getByText('Environment')).toBeInTheDocument()
    expect(screen.getByText('Technology')).toBeInTheDocument()
    expect(screen.getByText('Health')).toBeInTheDocument()
    expect(screen.getByText('Travel')).toBeInTheDocument()
  })

  it('shows progress labels correctly', async () => {
    mockGetAll.mockResolvedValue(sampleTopics)
    render(<TopicsProgress />)

    await screen.findByText('Topics Progress')

    expect(screen.getAllByText('Mastered')).toHaveLength(2)
    expect(screen.getByText('Good')).toBeInTheDocument()
    expect(screen.getByText('Fair')).toBeInTheDocument()
    expect(screen.getAllByText('Needs Review')).toHaveLength(3)
  })

  it('shows skill counts per topic', async () => {
    mockGetAll.mockResolvedValue(sampleTopics)
    render(<TopicsProgress />)

    await screen.findByText('Topics Progress')

    expect(screen.getByText('Vocab: 20')).toBeInTheDocument()
    expect(screen.getByText('Reading: 10')).toBeInTheDocument()
    expect(screen.getByText('Listening: 8')).toBeInTheDocument()
  })

  it('shows weak points when present', async () => {
    mockGetAll.mockResolvedValue(sampleTopics)
    render(<TopicsProgress />)

    await screen.findByText('Topics Progress')

    const weakPointsHeader = screen.getAllByText('Weak points:')
    expect(weakPointsHeader.length).toBeGreaterThan(0)

    const envSection = screen.getByText('Environment').closest('.rounded-lg') as HTMLElement
    expect(within(envSection).getByText('Vocabulary')).toBeInTheDocument()
    expect(within(envSection).getByText('Grammar')).toBeInTheDocument()
  })

  it('filters topics by search query', async () => {
    mockGetAll.mockResolvedValue(sampleTopics)
    render(<TopicsProgress />)

    await screen.findByText('Topics Progress')

    const searchInput = screen.getByLabelText('Search topics')
    await userEvent.type(searchInput, 'Environment')

    expect(screen.getByText('Environment')).toBeInTheDocument()
    expect(screen.queryByText('Education')).not.toBeInTheDocument()
    expect(screen.queryByText('Technology')).not.toBeInTheDocument()
  })

  it('shows no results message when search matches nothing', async () => {
    mockGetAll.mockResolvedValue(sampleTopics)
    render(<TopicsProgress />)

    await screen.findByText('Topics Progress')

    const searchInput = screen.getByLabelText('Search topics')
    await userEvent.type(searchInput, 'NonExistentTopic')

    expect(screen.getByText('No topics match your search.')).toBeInTheDocument()
  })

  it('sorts by topic name ascending', async () => {
    mockGetAll.mockResolvedValue(sampleTopics)
    render(<TopicsProgress />)

    await screen.findByText('Topics Progress')

    const sortSelect = screen.getByLabelText('Sort by')
    await userEvent.selectOptions(sortSelect, 'topic')

    const toggleBtn = screen.getByLabelText('Toggle sort direction')
    await userEvent.click(toggleBtn)

    const topicCards = screen.getAllByText(/^(Education|Environment|Technology|Health|Travel)$/)
    expect(topicCards[0]).toHaveTextContent('Education')
  })

  it('sorts by last updated', async () => {
    mockGetAll.mockResolvedValue(sampleTopics)
    render(<TopicsProgress />)

    await screen.findByText('Topics Progress')

    const sortSelect = screen.getByLabelText('Sort by')
    await userEvent.selectOptions(sortSelect, 'updated')

    const updatedButton = screen.getByLabelText('Toggle sort direction')
    await userEvent.click(updatedButton)

    expect(screen.getByLabelText('Sort by')).toHaveValue('updated')
  })

  it('toggles sort direction', async () => {
    mockGetAll.mockResolvedValue(sampleTopics)
    render(<TopicsProgress />)

    await screen.findByText('Topics Progress')

    const toggleBtn = screen.getByLabelText('Toggle sort direction')
    expect(toggleBtn).toHaveTextContent('↓ Desc')

    await userEvent.click(toggleBtn)
    expect(toggleBtn).toHaveTextContent('↑ Asc')

    await userEvent.click(toggleBtn)
    expect(toggleBtn).toHaveTextContent('↓ Desc')
  })

  it('shows progress bars with correct widths', async () => {
    mockGetAll.mockResolvedValue([makeTopic('t1', { topic: 'Education', progressPercent: 75 })])
    render(<TopicsProgress />)

    await screen.findByText('Topics Progress')

    const bars = document.querySelectorAll('.rounded-full.bg-blue-500')
    expect(bars.length).toBeGreaterThan(0)
    const firstBar = bars[0] as HTMLDivElement
    expect(firstBar.style.width).toBe('75%')
  })

  it('shows formatted last reviewed date', async () => {
    mockGetAll.mockResolvedValue([makeTopic('t1', { topic: 'Education', lastReviewedAt: '2025-06-15T00:00:00.000Z' })])
    render(<TopicsProgress />)

    await screen.findByText('Topics Progress')

    expect(screen.getByText(/Last reviewed:/)).toBeInTheDocument()
  })

  it('handles case-insensitive search', async () => {
    mockGetAll.mockResolvedValue(sampleTopics)
    render(<TopicsProgress />)

    await screen.findByText('Topics Progress')

    const searchInput = screen.getByLabelText('Search topics')
    await userEvent.type(searchInput, 'environment')

    expect(screen.getByText('Environment')).toBeInTheDocument()
    expect(screen.queryByText('Education')).not.toBeInTheDocument()
  })
})
