import { useState, useCallback, type ReactNode } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import Button from '../../components/ui/Button'
import ErrorDisplay from '../../components/ui/ErrorDisplay'
import Card from '../../components/ui/Card'
import { EmptyState } from '@ielts/ui/components/EmptyState'
import { LoadingSkeleton } from '@ielts/ui/components/LoadingSkeleton'
import { ProgressRing } from '@ielts/ui/components/ProgressRing'
import { ProgressBar } from '@ielts/ui/components/ProgressBar'
import { ProgressSummaryCard } from '@ielts/ui/components/ProgressSummaryCard'
import {
  IconClock, IconTarget, IconStreak, IconVocabularyBook, IconCalendar,
  IconProgress, IconCheckCircle, IconRefresh,
  IconReading, IconListening, IconWriting, IconSpeaking, IconVocabulary, IconGrammar,
  IconAITutor, IconStar, IconPlay,
} from '@ielts/ui'
import type { ProgressSnapshot, WeeklyProgressSummary, SkillProgressSummary } from './progressService'
import AIReviewSection from '../progressReview/components/AIReviewSection'

interface ProgressTrackerProps {
  snapshot: ProgressSnapshot | null
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  onNavigate?: (path: string) => void
}

type TimePeriod = '7d' | '30d' | '90d' | 'all'

const PIE_COLORS = [
  'var(--color-primary)', 'var(--color-success)', 'var(--color-warning)',
  'var(--color-danger)', '#8b5cf6', '#ec4899',
]

const SKILL_COLORS: Record<string, string> = {
  reading: 'var(--color-skill-reading)',
  listening: 'var(--color-skill-listening)',
  writing: 'var(--color-skill-writing)',
  speaking: 'var(--color-skill-speaking)',
  vocabulary: 'var(--color-info)',
  grammar: 'var(--color-success)',
}

const SKILL_LABELS: Record<string, string> = {
  reading: 'Reading',
  listening: 'Listening',
  writing: 'Writing',
  speaking: 'Speaking',
  vocabulary: 'Vocabulary',
  grammar: 'Grammar',
}

const PERIOD_OPTIONS: { value: TimePeriod; label: string }[] = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: 'all', label: 'All time' },
]

function TrendBadge({ trend }: { trend: string }) {
  const colors: Record<string, string> = {
    improving: 'var(--color-success)',
    declining: 'var(--color-danger)',
    stable: 'var(--color-muted)',
  }
  const labels: Record<string, string> = {
    improving: '↑ Improving',
    declining: '↓ Declining',
    stable: '→ Stable',
  }
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: 'var(--text-xs)',
        fontWeight: 'var(--weight-medium)',
        color: colors[trend] ?? colors.stable,
      }}
      aria-label={`Trend: ${trend}`}
    >
      {labels[trend] ?? trend}
    </span>
  )
}

function StatCard({
  label, value, sublabel, icon, trend, trendValue: _tv, color,
}: {
  label: string
  value: string | number
  sublabel?: string
  icon?: ReactNode
  trend?: 'up' | 'down' | 'stable'
  trendValue?: string
  color?: string
}) {
  return (
    <ProgressSummaryCard
      label={label}
      value={value}
      subtitle={sublabel}
      icon={icon}
      trend={trend}
      color={color}
    />
  )
}

function SkillBreakdownCard({
  skill, sessions, totalMinutes, accuracy, trend,
}: SkillProgressSummary) {
  const skillKey = skill.toLowerCase()
  const color = SKILL_COLORS[skillKey] ?? 'var(--color-primary)'
  const statusLabel = trend === 'improving' ? 'Improving' : trend === 'declining' ? 'Needs work' : 'Developing'
  const statusColor = trend === 'improving' ? 'var(--color-success)' : trend === 'declining' ? 'var(--color-danger)' : 'var(--color-warning)'
  const iconMap: Record<string, ReactNode> = {
    reading: <IconReading size={18} />,
    listening: <IconListening size={18} />,
    writing: <IconWriting size={18} />,
    speaking: <IconSpeaking size={18} />,
    vocabulary: <IconVocabulary size={18} />,
    grammar: <IconGrammar size={18} />,
  }

  if (sessions === 0 && accuracy === 0) {
    return (
      <Card padding="md">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          <span style={{ display: 'inline-flex', color }} aria-hidden="true">
            {iconMap[skillKey] ?? <IconStar size={18} />}
          </span>
          <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>
            {SKILL_LABELS[skillKey] ?? skill}
          </span>
        </div>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>
          No sessions yet
        </span>
      </Card>
    )
  }

  return (
    <Card padding="md" hoverable>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          <span style={{ display: 'inline-flex', color }} aria-hidden="true">
            {iconMap[skillKey] ?? <IconStar size={18} />}
          </span>
          <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>
            {SKILL_LABELS[skillKey] ?? skill}
          </span>
        </div>
        <span
          style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--weight-medium)',
            padding: '2px 8px',
            borderRadius: 'var(--radius-full)',
            background: statusColor,
            color: 'var(--color-on-primary)',
          }}
        >
          {statusLabel}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-xs)' }}>
        <ProgressRing value={accuracy} size={40} strokeWidth={3} variant={skillKey as never} showLabel={false} />
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--spacing-2xs)' }}>
            <span style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)' }}>
              {accuracy}%
            </span>
            <TrendBadge trend={trend} />
          </div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>
            {sessions} sessions · {Math.round(totalMinutes)}min
          </span>
        </div>
      </div>
    </Card>
  )
}

function SectionHeader({
  title, action, aiAction,
}: {
  title: string
  action?: { label: string; onClick: () => void }
  aiAction?: { label: string; onClick: () => void }
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
      <h2 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)' }}>
        {title}
      </h2>
      <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
        {aiAction && (
          <button
            type="button"
            onClick={aiAction.onClick}
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--weight-medium)',
              color: 'var(--color-tutor-accent)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: 'var(--radius-md)',
            }}
            aria-label={`Ask AI: ${aiAction.label}`}
          >
            <IconAITutor size={12} /> {aiAction.label}
          </button>
        )}
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--weight-medium)',
              color: 'var(--color-primary)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: 'var(--radius-md)',
            }}
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  )
}

export function SummaryCards({ snapshot }: { snapshot: ProgressSnapshot }) {
  const totalHours = Math.round(snapshot.totalStudyMinutes / 60 * 10) / 10
  return (
    <div style={{
      display: 'grid',
      gap: 'var(--spacing-sm)',
      gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    }}>
      <StatCard label="Study Hours" value={`${totalHours.toFixed(1)}h`} icon={<IconClock size={18} />} color="var(--color-primary)" />
      <StatCard
        label="Band Progress"
        value="6.5 / 7.5"
        sublabel="Target: 7.5"
        icon={<IconTarget size={18} />}
        color="var(--color-skill-reading)"
        trend="up"
        trendValue="+0.5"
      />
      <StatCard label="Study Streak" value={`${snapshot.currentStreak}d`} sublabel={`Longest: ${snapshot.longestStreak}d`} icon={<IconStreak size={18} />} color="var(--color-warning)" />
      <StatCard label="Vocab Words" value={`${snapshot.vocabLearned} words`} sublabel={`${snapshot.vocabReviewed} mastered`} icon={<IconVocabularyBook size={18} />} color="var(--color-info)" />
      <StatCard label="Exam Countdown" value="67 days" icon={<IconCalendar size={18} />} color="var(--color-skill-speaking)" />
    </div>
  )
}

export function WeeklyProgressChart({ weeklyProgress }: { weeklyProgress: WeeklyProgressSummary[] }) {
  const hasData = weeklyProgress.some(w => w.daysActive > 0 || w.totalMinutes > 0)
  if (!hasData) {
    return (
      <div style={{
        padding: 'var(--spacing-lg)',
        borderRadius: 'var(--radius-xl)',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border-light)',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)', margin: 0 }}>
          No weekly data yet. Start studying to see your activity.
        </p>
      </div>
    )
  }
  return (
    <div style={{
      padding: 'var(--spacing-md)',
      borderRadius: 'var(--radius-xl)',
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border-light)',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ height: '200px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={weeklyProgress} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="weekLabel" tick={{ fontSize: 11 }} stroke="var(--color-muted)" />
            <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="var(--color-muted)" allowDecimals={false} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} stroke="var(--color-muted)" allowDecimals={false} />
            <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 13 }} />
            <Bar yAxisId="left" dataKey="daysActive" fill="var(--color-primary)" radius={[4, 4, 0, 0]} name="Days Active" />
            <Bar yAxisId="right" dataKey="totalMinutes" fill="var(--color-success)" radius={[4, 4, 0, 0]} name="Minutes"
              shape={(props: Record<string, unknown>) => {
                const { x, y, width, height, fill } = props as { x: number; y: number; width: number; height: number; fill: string }
                return <rect x={x} y={y} width={width} height={height} fill={fill} rx={4} ry={4} opacity={0.7} />
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export function SkillProgressGrid({ skillProgress }: { skillProgress: SkillProgressSummary[] }) {
  const withActivity = skillProgress.filter(s => s.sessions > 0 || s.accuracy > 0)
  if (withActivity.length === 0) {
    return (
      <div style={{
        padding: 'var(--spacing-lg)',
        borderRadius: 'var(--radius-xl)',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border-light)',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)', margin: 0 }}>
          No skill data yet. Complete exercises to see progress.
        </p>
      </div>
    )
  }
  return (
    <div style={{
      display: 'grid',
      gap: 'var(--spacing-sm)',
      gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    }}>
      {skillProgress.map((skill) => (
        <SkillBreakdownCard key={skill.skill} {...skill} />
      ))}
    </div>
  )
}

export function SkillBalanceChart({ skillProgress }: { skillProgress: SkillProgressSummary[] }) {
  const pieData = skillProgress
    .filter(s => s.sessions > 0)
    .map((s, i) => ({ name: s.skill, value: s.sessions, color: PIE_COLORS[i % PIE_COLORS.length] }))
  if (pieData.length === 0) {
    return (
      <div style={{
        padding: 'var(--spacing-lg)',
        borderRadius: 'var(--radius-xl)',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border-light)',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)', margin: 0 }}>
          Complete sessions across skills to see balance.
        </p>
      </div>
    )
  }
  return (
    <div style={{
      padding: 'var(--spacing-md)',
      borderRadius: 'var(--radius-xl)',
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border-light)',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ height: '180px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%" cy="50%"
              innerRadius={45} outerRadius={70}
              paddingAngle={3}
              dataKey="value"
            >
              {pieData.map((_, i) => (
                <Cell key={i} fill={pieData[i].color} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 13 }} formatter={(v: number) => [v, 'Sessions']} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-sm)' }}>
        {pieData.map(d => (
          <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: d.color, display: 'inline-block' }} />
            {d.name}
          </div>
        ))}
      </div>
    </div>
  )
}

export function MonthlySummaryChart({ monthlySummary }: { monthlySummary: ProgressSnapshot['monthlySummary'] }) {
  if (monthlySummary.length === 0) {
    return (
      <div style={{
        padding: 'var(--spacing-lg)',
        borderRadius: 'var(--radius-xl)',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border-light)',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)', margin: 0 }}>
          No monthly data yet. Start practicing!
        </p>
      </div>
    )
  }
  return (
    <div style={{
      padding: 'var(--spacing-md)',
      borderRadius: 'var(--radius-xl)',
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border-light)',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div className="space-y-3">
        {[...monthlySummary].reverse().slice(0, 6).map(month => (
          <div
            key={month.month}
            style={{
              padding: 'var(--spacing-sm) var(--spacing-md)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border-light)',
              background: 'var(--color-surface-alt)',
            }}
          >
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-muted)' }}>
              {month.month}
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 12px', marginTop: '4px', fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>
              <span>{month.totalHours.toFixed(1)}h study</span>
              <span>{month.sessions} sessions</span>
              <span>+{month.vocabLearned} words</span>
              <span>{month.mockTests} mock tests</span>
              {month.avgBand > 0 && (
                <span style={{ gridColumn: 'span 2', fontWeight: 'var(--weight-medium)', color: 'var(--color-primary)' }}>
                  Avg band: {month.avgBand.toFixed(1)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function WeakSkillsCard({ weakSkills }: { weakSkills: { skill: string; count: number }[] }) {
  if (weakSkills.length === 0) {
    return (
      <div style={{
        padding: 'var(--spacing-lg)',
        borderRadius: 'var(--radius-xl)',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border-light)',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)', margin: 0 }}>
          No mistakes logged yet — that means you're practicing well!
        </p>
      </div>
    )
  }
  const maxCount = Math.max(...weakSkills.map(w => w.count), 1)
  return (
    <div style={{
      padding: 'var(--spacing-md)',
      borderRadius: 'var(--radius-xl)',
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border-light)',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }} role="list" aria-label="Weak skills ranking">
        {weakSkills.map((item, i) => (
          <li key={item.skill} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            <span style={{
              display: 'flex',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--color-surface-alt)',
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--weight-bold)',
              color: 'var(--color-muted)',
              flexShrink: 0,
            }}>
              {i + 1}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text)' }}>{item.skill}</span>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)' }}>{item.count}</span>
              </div>
              <div style={{
                height: '6px',
                width: '100%',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-border)',
                marginTop: '4px',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--color-danger)',
                  transition: 'width var(--transition-slow)',
                  width: `${Math.min(100, (item.count / maxCount) * 100)}%`,
                }} />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function RecentActivity({ activities }: { activities: ProgressSnapshot['recentActivity'] }) {
  const typeIcons: Record<string, ReactNode> = {
    task: <IconCheckCircle size={12} />,
    vocab: <IconVocabulary size={12} />,
    session: <IconPlay size={12} />,
    review: <IconRefresh size={12} />,
  }

  if (activities.length === 0) {
    return (
      <div style={{
        padding: 'var(--spacing-lg)',
        borderRadius: 'var(--radius-xl)',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border-light)',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)', margin: 0 }}>
          No recent activity. Start studying to track your progress.
        </p>
      </div>
    )
  }

  return (
    <div style={{
      padding: 'var(--spacing-md)',
      borderRadius: 'var(--radius-xl)',
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border-light)',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
        {activities.slice(0, 10).map((a, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 'var(--spacing-sm)',
              padding: 'var(--spacing-xs) var(--spacing-sm)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <span style={{
              display: 'flex',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              background: a.type === 'task' ? 'var(--color-success-light)' : a.type === 'vocab' ? 'var(--color-info-light)' : 'var(--color-surface-alt)',
              color: a.type === 'task' ? 'var(--color-success)' : a.type === 'vocab' ? 'var(--color-info)' : 'var(--color-muted)',
            }}>
              {typeIcons[a.type] ?? '•'}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {a.description}
              </p>
              <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>{a.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function RoadmapProgressBar({ progress }: { progress: number }) {
  const color = progress >= 80 ? 'var(--color-success)' : progress >= 50 ? 'var(--color-primary)' : progress >= 25 ? 'var(--color-warning)' : 'var(--color-danger)'
  return (
    <Card padding="md">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
          <IconProgress size={16} style={{ color: 'var(--color-muted)' }} />
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)' }}>Roadmap Progress</span>
        </div>
        <span style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color }}>{progress}%</span>
      </div>
      <ProgressBar value={progress} variant={progress >= 80 ? 'success' : progress >= 50 ? 'primary' : progress >= 25 ? 'warning' : 'danger'} size="md" animated />
      <p style={{ margin: 'var(--spacing-xs) 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>
        {progress < 100
          ? `${100 - progress}% remaining to complete your IELTS roadmap`
          : 'All roadmap phases completed!'}
      </p>
    </Card>
  )
}

function ProgressSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
      <div>
        <LoadingSkeleton variant="text" width="200px" height="24px" />
        <div style={{ marginTop: 'var(--spacing-xs)' }}>
          <LoadingSkeleton variant="text" width="300px" height="14px" />
        </div>
      </div>
      <div style={{ display: 'grid', gap: 'var(--spacing-sm)', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <LoadingSkeleton key={i} variant="card" height="80px" />
        ))}
      </div>
      <div style={{ display: 'grid', gap: 'var(--spacing-md)', gridTemplateColumns: '1fr 1fr' }}>
        <LoadingSkeleton variant="chart" height="200px" />
        <LoadingSkeleton variant="chart" height="200px" />
      </div>
      <LoadingSkeleton variant="chart" height="180px" />
    </div>
  )
}

export default function ProgressTracker({ snapshot, loading, error, onRetry, onNavigate: navigateProp }: ProgressTrackerProps) {
  const [period, setPeriod] = useState<TimePeriod>('30d')
  const navigate = navigateProp ?? ((_: string) => {})

  const handlePeriodChange = useCallback((p: TimePeriod) => {
    setPeriod(p)
  }, [])

  if (loading) {
    return <ProgressSkeleton />
  }

  if (error) {
    return (
      <ErrorDisplay
        variant="card"
        title="Couldn't Load Progress Data"
        message={error}
        onRetry={onRetry}
      />
    )
  }

  if (!snapshot) {
    return (
        <EmptyState
          icon={<IconProgress size={48} />}
          title="Your Progress Story Starts Here"
          description="Every lesson, every practice session, every saved word builds your IELTS journey. Start studying to see your progress charts come to life."
          action={
            <Button variant="primary" onClick={() => navigate('/today')}>
              Start Your First Lesson
            </Button>
          }
          tip="Already studying? Make sure your study data is being saved."
        />
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
      {/* Period Selector */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }} role="radiogroup" aria-label="Select time period">
          {PERIOD_OPTIONS.map(opt => (
            <button
              key={opt.value}
              role="radio"
              aria-checked={period === opt.value}
              onClick={() => handlePeriodChange(opt.value)}
              style={{
                  padding: '10px 16px',
                borderRadius: 'var(--radius-lg)',
                border: `1px solid ${period === opt.value ? 'var(--color-primary)' : 'var(--color-border)'}`,
                background: period === opt.value ? 'var(--color-primary-light)' : 'var(--color-surface)',
                color: period === opt.value ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--weight-medium)',
                cursor: 'pointer',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* AI Progress Review Section */}
      <AIReviewSection />

      {/* Zone 1: Quick Stats */}
      <SummaryCards snapshot={snapshot} />

      {/* Zone 2: Band & Skill Progression + Skill Breakdown */}
      <div style={{ display: 'grid', gap: 'var(--spacing-md)', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <div>
          <SectionHeader title="Band & Skill Progression" aiAction={{ label: 'Ask AI', onClick: () => navigate('/tutor') }} />
          <div style={{ marginTop: 'var(--spacing-sm)' }}>
            <div style={{
              padding: 'var(--spacing-md)',
              borderRadius: 'var(--radius-xl)',
              background: 'linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-surface) 100%)',
              border: '1px solid var(--color-border-light)',
            }}>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)', textAlign: 'center', margin: 0 }}>
                {snapshot.weeklyProgress.length > 0
                  ? 'IELTS band progression will appear here. Complete mock tests to see your band trajectory.'
                  : 'No band progress data yet. Take a mock test to see your band progression.'}
              </p>
            </div>
          </div>
        </div>
        <div>
          <SectionHeader title="Skill Breakdown" />
          <div style={{ marginTop: 'var(--spacing-sm)' }}>
            <SkillProgressGrid skillProgress={snapshot.skillProgress} />
          </div>
        </div>
      </div>

      {/* Zone 3: Study Activity */}
      <div>
        <SectionHeader title="Study Activity" />
        <div style={{ marginTop: 'var(--spacing-sm)' }}>
          <WeeklyProgressChart weeklyProgress={snapshot.weeklyProgress} />
        </div>
      </div>

      {/* Zone 4: Vocabulary + Mistakes */}
      <div style={{ display: 'grid', gap: 'var(--spacing-md)', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <div>
          <SectionHeader title="Vocabulary" action={{ label: 'View all words', onClick: () => navigate('/vocabulary') }} />
          <div style={{ marginTop: 'var(--spacing-sm)' }}>
            <div style={{
              padding: 'var(--spacing-md)',
              borderRadius: 'var(--radius-xl)',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border-light)',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-lg)', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto' }}>
                    <svg width="80" height="80" viewBox="0 0 80 80" role="progressbar" aria-valuenow={snapshot.vocabReviewed > 0 ? Math.round((snapshot.vocabReviewed / snapshot.vocabLearned) * 100) : 0} aria-valuemin={0} aria-valuemax={100} aria-label="Vocabulary mastery">
                      <circle cx="40" cy="40" r="34" fill="none" stroke="var(--color-surface-alt)" strokeWidth="6" />
                      <circle cx="40" cy="40" r="34" fill="none" stroke="var(--color-primary)" strokeWidth="6" strokeLinecap="round" strokeDasharray={213.6} strokeDashoffset={213.6 - (snapshot.vocabLearned > 0 ? (snapshot.vocabReviewed / snapshot.vocabLearned) * 213.6 : 0)} transform="rotate(-90 40 40)" style={{ transition: 'stroke-dashoffset var(--transition-slow)' }} />
                    </svg>
                    <span style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      fontSize: 'var(--text-sm)',
                      fontWeight: 'var(--weight-bold)',
                      color: 'var(--color-text)',
                    }}>
                      {snapshot.vocabLearned > 0 ? Math.round((snapshot.vocabReviewed / snapshot.vocabLearned) * 100) : 0}%
                    </span>
                  </div>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', marginTop: '4px', display: 'block' }}>Mastery</span>
                </div>
                <div style={{ flex: 1, minWidth: '120px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-xs)' }}>
                    <div>
                      <span style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)', display: 'block' }}>{snapshot.vocabLearned}</span>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>Total saved</span>
                    </div>
                    <div>
                      <span style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: 'var(--color-success)', display: 'block' }}>{snapshot.vocabReviewed}</span>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>Mastered</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div>
          <SectionHeader title="Mistakes" action={{ label: 'View details', onClick: () => navigate('/mistakes') }} />
          <div style={{ marginTop: 'var(--spacing-sm)' }}>
            <WeakSkillsCard weakSkills={snapshot.weakSkills} />
          </div>
        </div>
      </div>

      {/* Zone 5: Plan Adherence + Recent Activity */}
      <div style={{ display: 'grid', gap: 'var(--spacing-md)', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <div>
          <SectionHeader title="Study Plan" action={{ label: 'Adjust plan', onClick: () => navigate('/roadmap') }} />
          <div style={{ marginTop: 'var(--spacing-sm)' }}>
            <RoadmapProgressBar progress={snapshot.roadmapProgress} />
          </div>
        </div>
        <div>
          <SectionHeader title="Recent Activity" />
          <div style={{ marginTop: 'var(--spacing-sm)' }}>
            <RecentActivity activities={snapshot.recentActivity} />
          </div>
        </div>
      </div>
    </div>
  )
}
