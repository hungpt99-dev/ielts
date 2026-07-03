import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import Card, { CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import type { ProgressSnapshot, WeeklyProgressSummary, SkillProgressSummary } from './progressService'

interface ProgressTrackerProps {
  snapshot: ProgressSnapshot
  loading?: boolean
  error?: string | null
}

const PIE_COLORS = [
  'var(--color-primary)', 'var(--color-success)', 'var(--color-warning)',
  'var(--color-danger)', '#8b5cf6', '#ec4899',
]

function TrendBadge({ trend }: { trend: string }) {
  const colors: Record<string, string> = {
    improving: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
    declining: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30',
    stable: 'text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-slate-800',
  }
  const labels: Record<string, string> = {
    improving: '↑ Improving',
    declining: '↓ Declining',
    stable: '→ Stable',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors[trend] ?? colors.stable}`}>
      {labels[trend] ?? trend}
    </span>
  )
}

function StatCard({ label, value, unit, color }: { label: string; value: string | number; unit?: string; color?: string }) {
  return (
    <Card>
      <CardContent>
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
          {label}
        </p>
        <p className={`mt-2 text-3xl font-bold ${color ? `text-${color}` : 'text-[var(--color-text)]'}`}
           style={color ? { color } : undefined}>
          {value}
          {unit && <span className="ml-1 text-sm font-normal text-[var(--color-muted)]">{unit}</span>}
        </p>
      </CardContent>
    </Card>
  )
}

export function SummaryCards({ snapshot }: { snapshot: ProgressSnapshot }) {
  const totalHours = Math.round(snapshot.totalStudyMinutes / 60 * 10) / 10
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Total Study Hours" value={totalHours.toFixed(1)} unit="hrs" color="#3b82f6" />
      <StatCard label="Tasks Completed" value={snapshot.totalTasksCompleted} color="#22c55e" />
      <StatCard label="Study Streak" value={snapshot.currentStreak} unit="days" color="#a855f7" />
      <StatCard label="Vocabulary" value={snapshot.vocabLearned} unit="words" color="#f59e0b" />
    </div>
  )
}

export function WeeklyProgressChart({ weeklyProgress }: { weeklyProgress: WeeklyProgressSummary[] }) {
  const hasData = weeklyProgress.some(w => w.daysActive > 0 || w.totalMinutes > 0)
  if (!hasData) {
    return (
      <Card>
        <CardHeader><CardTitle>Weekly Activity</CardTitle></CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-[var(--color-muted)]">No weekly data yet. Start studying to see your progress.</p>
        </CardContent>
      </Card>
    )
  }
  return (
    <Card>
      <CardHeader><CardTitle>Weekly Activity</CardTitle></CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyProgress} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="weekLabel" tick={{ fontSize: 11 }} stroke="var(--color-muted)" />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--color-muted)" allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 13 }} />
                <Bar dataKey="daysActive" fill="var(--color-primary)" radius={[4, 4, 0, 0]} name="Days Active" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyProgress} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="weekLabel" tick={{ fontSize: 11 }} stroke="var(--color-muted)" />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--color-muted)" />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 13 }} formatter={(v: number) => [`${Math.round(v / 60 * 10) / 10}h`, 'Hours']} />
                <Bar dataKey="totalMinutes" fill="var(--color-success)" radius={[4, 4, 0, 0]} name="Hours"
                     shape={(props: Record<string, unknown>) => {
                       const { x, y, width, height, fill } = props as { x: number; y: number; width: number; height: number; fill: string }
                       return <rect x={x} y={y} width={width} height={height} fill={fill} rx={4} ry={4} />
                     }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function SkillProgressChart({ skillProgress }: { skillProgress: SkillProgressSummary[] }) {
  const withActivity = skillProgress.filter(s => s.sessions > 0 || s.accuracy > 0)
  if (withActivity.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>Skill Progress</CardTitle></CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-[var(--color-muted)]">No skill data yet. Complete exercises to see progress.</p>
        </CardContent>
      </Card>
    )
  }
  return (
    <Card>
      <CardHeader><CardTitle>Skill Progress</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-4">
          {withActivity.map((skill, i) => (
            <div key={skill.skill}>
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[var(--color-text)]">{skill.skill}</span>
                  <TrendBadge trend={skill.trend} />
                </div>
                <span className="text-xs text-[var(--color-muted)]">
                  {skill.sessions} sessions · {Math.round(skill.totalMinutes)}min
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, skill.accuracy)}%`,
                    backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                  }}
                />
              </div>
              <p className="mt-0.5 text-right text-xs text-[var(--color-muted)]">
                {skill.accuracy}% accuracy
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function SkillBalanceChart({ skillProgress }: { skillProgress: SkillProgressSummary[] }) {
  const pieData = skillProgress
    .filter(s => s.sessions > 0)
    .map((s, i) => ({ name: s.skill, value: s.sessions, color: PIE_COLORS[i % PIE_COLORS.length] }))
  if (pieData.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>Skill Balance</CardTitle></CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-[var(--color-muted)]">Complete sessions across skills to see balance.</p>
        </CardContent>
      </Card>
    )
  }
  return (
    <Card>
      <CardHeader><CardTitle>Skill Balance</CardTitle></CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%" cy="50%"
                innerRadius={50} outerRadius={80}
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
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          {pieData.map(d => (
            <div key={d.name} className="flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
              {d.name}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function MonthlySummaryChart({ monthlySummary }: { monthlySummary: ProgressSnapshot['monthlySummary'] }) {
  if (monthlySummary.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>Monthly Summary</CardTitle></CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-[var(--color-muted)]">No monthly data yet. Start practicing!</p>
        </CardContent>
      </Card>
    )
  }
  return (
    <Card>
      <CardHeader><CardTitle>Monthly Summary</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[...monthlySummary].reverse().map(month => (
            <div
              key={month.month}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3"
              style={{ backgroundColor: 'var(--color-surface-alt, rgba(0,0,0,0.02))' }}
            >
              <p className="text-xs font-semibold text-[var(--color-muted)]">{month.month}</p>
              <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs text-[var(--color-muted)]">
                <span>{month.totalHours.toFixed(1)}h study</span>
                <span>{month.sessions} sessions</span>
                <span>+{month.vocabLearned} words</span>
                <span>{month.mockTests} mock tests</span>
                {month.avgBand > 0 && (
                  <span className="col-span-2 font-medium text-[var(--color-primary)]">
                    Avg band: {month.avgBand.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function WeakSkillsCard({ weakSkills }: { weakSkills: { skill: string; count: number }[] }) {
  if (weakSkills.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>Weak Skills</CardTitle></CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-[var(--color-muted)]">No mistakes logged yet. Keep practicing!</p>
        </CardContent>
      </Card>
    )
  }
  const maxCount = Math.max(...weakSkills.map(w => w.count), 1)
  return (
    <Card>
      <CardHeader><CardTitle>Weak Skills</CardTitle></CardHeader>
      <CardContent>
        <ul className="space-y-2" role="list" aria-label="Weak skills ranking">
          {weakSkills.map((item, i) => (
            <li key={item.skill} className="flex items-center gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-alt)] text-xs font-bold text-[var(--color-muted)]">
                {i + 1}
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--color-text)]">{item.skill}</span>
                  <span className="text-sm text-[var(--color-muted)]">{item.count}</span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
                  <div
                    className="h-full rounded-full bg-red-500 transition-all"
                    style={{ width: `${Math.min(100, (item.count / maxCount) * 100)}%` }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

export function RecentActivity({ activities }: { activities: ProgressSnapshot['recentActivity'] }) {
  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-[var(--color-muted)]">No recent activity. Start studying to track your progress.</p>
        </CardContent>
      </Card>
    )
  }
  const typeIcons: Record<string, string> = {
    task: '✓',
    vocab: 'W',
    session: '▶',
    review: '↻',
  }
  const typeColors: Record<string, string> = {
    task: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
    vocab: 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30',
    session: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
    review: 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30',
  }
  return (
    <Card>
      <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-2">
          {activities.slice(0, 10).map((a, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-[var(--color-surface-alt)]">
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${typeColors[a.type] ?? 'text-slate-600 bg-slate-100'}`}>
                {typeIcons[a.type] ?? '•'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--color-text)] truncate">{a.description}</p>
                <p className="text-xs text-[var(--color-muted)]">{a.date}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function RoadmapProgressBar({ progress }: { progress: number }) {
  const color = progress >= 80 ? 'var(--color-success)' : progress >= 50 ? 'var(--color-primary)' : progress >= 25 ? 'var(--color-warning)' : 'var(--color-danger)'
  return (
    <Card>
      <CardHeader>
        <CardTitle>Roadmap Progress</CardTitle>
        <span className="text-2xl font-bold" style={{ color }}>{progress}%</span>
      </CardHeader>
      <CardContent>
        <div className="h-3 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%`, backgroundColor: color }}
          />
        </div>
        <p className="mt-2 text-xs text-[var(--color-muted)]">
          {progress < 100
            ? `${100 - progress}% remaining to complete your IELTS roadmap`
            : '🎉 All roadmap phases completed!'}
        </p>
      </CardContent>
    </Card>
  )
}

export default function ProgressTracker({ snapshot, loading, error }: ProgressTrackerProps) {
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
      </div>
    )
  }
  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Card className="max-w-md text-center">
          <CardContent>
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }
  if (!snapshot) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-[var(--color-muted)]">No progress data available.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <SummaryCards snapshot={snapshot} />
      <RoadmapProgressBar progress={snapshot.roadmapProgress} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WeeklyProgressChart weeklyProgress={snapshot.weeklyProgress} />
        </div>
        <SkillBalanceChart skillProgress={snapshot.skillProgress} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <SkillProgressChart skillProgress={snapshot.skillProgress} />
        <MonthlySummaryChart monthlySummary={snapshot.monthlySummary} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <WeakSkillsCard weakSkills={snapshot.weakSkills} />
        <RecentActivity activities={snapshot.recentActivity} />
      </div>
    </div>
  )
}
