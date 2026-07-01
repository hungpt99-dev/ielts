import { useDashboard } from '../hooks/useDashboard'
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function bandColor(band: number): string {
  if (band >= 7) return 'text-green-600 dark:text-green-400'
  if (band >= 6) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}

const PIE_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444']

export default function Dashboard() {
  const { data, weeklyChart, loading, error } = useDashboard()

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="max-w-md text-center">
          <CardContent>
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) return null

  const {
    todayTasks, studyStreak, weeklyProgress, totalStudyHours,
    targetBand, currentBand, weakSkills, dueReviews, todayFocus, recentSessions,
  } = data

  const todayUnfinished = todayTasks.filter(t => !t.isDone)
  const todayDone = todayTasks.filter(t => t.isDone)
  const progressPercent = weeklyProgress.total > 0
    ? Math.round((weeklyProgress.done / weeklyProgress.total) * 100)
    : 0
  const bandGap = targetBand - currentBand
  const chartData = weeklyChart.map((d, i) => ({
    day: DAY_LABELS[i] || '',
    minutes: d.minutes,
  }))

  const skillData = [
    { name: 'Reading', value: recentSessions.reading },
    { name: 'Listening', value: recentSessions.listening },
    { name: 'Writing', value: recentSessions.writing },
    { name: 'Speaking', value: recentSessions.speaking },
  ].filter(s => s.value > 0)

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {getGreeting()}, IELTS Learner
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {formatDate(new Date())}
        </p>
      </div>

      {/* Summary cards row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Streak */}
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Study Streak
            </p>
            <p className="mt-2 text-3xl font-bold text-orange-500">
              {studyStreak}
              <span className="ml-1 text-sm font-normal text-slate-400">days</span>
            </p>
          </CardContent>
        </Card>
        {/* Weekly Progress */}
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Weekly Progress
            </p>
            <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">
              {progressPercent}%
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {weeklyProgress.done} / {weeklyProgress.total} tasks
            </p>
          </CardContent>
        </Card>
        {/* Study Hours */}
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Study Hours
            </p>
            <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
              {totalStudyHours}
              <span className="ml-1 text-sm font-normal text-slate-400">hrs</span>
            </p>
          </CardContent>
        </Card>
        {/* Band */}
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Target Band
            </p>
            <p className="mt-2 text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              {targetBand}
            </p>
            <p className={`text-xs font-medium ${bandColor(currentBand)}`}>
              Current: {currentBand}
              {bandGap > 0 && ` (${bandGap.toFixed(1)} to go)`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Middle section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today's Plan */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Today's Plan</CardTitle>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {todayDone.length}/{todayTasks.length} done
            </span>
          </CardHeader>
          <CardContent>
            {todayTasks.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                No tasks planned for today. Add some in the Daily Plan.
              </p>
            ) : (
              <ul className="space-y-2">
                {todayTasks.map(task => (
                  <li
                    key={task.id}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm ${
                      task.isDone
                        ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                        : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                        task.isDone
                          ? 'border-green-500 bg-green-500 text-white'
                          : 'border-slate-300 text-slate-400 dark:border-slate-600'
                      }`}
                    >
                      {task.isDone ? '✓' : task.category.slice(0, 2)}
                    </span>
                    <span
                      className={`flex-1 ${
                        task.isDone
                          ? 'text-slate-400 line-through dark:text-slate-500'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {task.title}
                    </span>
                    {task.timeMinutes > 0 && (
                      <span className="shrink-0 text-xs text-slate-400">
                        {task.timeMinutes}m
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="space-y-4">
          {/* Due Reviews */}
          <Card>
            <CardHeader>
              <CardTitle>Reviews Due</CardTitle>
            </CardHeader>
            <CardContent>
              {dueReviews > 0 ? (
                <div className="text-center">
                  <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                    {dueReviews}
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    items need review
                  </p>
                </div>
              ) : (
                <p className="py-4 text-center text-sm text-slate-400 dark:text-slate-500">
                  All caught up! No reviews due.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Weak Skills */}
          {weakSkills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Weak Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {weakSkills.map(skill => (
                    <span
                      key={skill}
                      className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Weekly study time */}
        <Card>
          <CardHeader>
            <CardTitle>This Week</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.some(d => d.minutes > 0) ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: '1px solid #e2e8f0',
                        fontSize: 13,
                      }}
                      formatter={(value: number) => [`${value}m`, 'Study time']}
                    />
                    <Bar dataKey="minutes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                No study data this week yet. Start your practice!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Skill balance */}
        <Card>
          <CardHeader>
            <CardTitle>Skill Balance (7 days)</CardTitle>
          </CardHeader>
          <CardContent>
            {skillData.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={skillData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {skillData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: '1px solid #e2e8f0',
                        fontSize: 13,
                      }}
                      formatter={(value: number) => [value, 'sessions']}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 12 }}
                      iconType="circle"
                      iconSize={8}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                Complete sessions across skills to see balance.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom: focus recommendation + summary */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Today's Focus
            </p>
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
              {todayFocus}
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider text-green-600 dark:text-green-400">
              Progress Summary
            </p>
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
              {todayUnfinished.length > 0
                ? `${todayUnfinished.length} task${todayUnfinished.length > 1 ? 's' : ''} remaining today. Keep going!`
                : todayTasks.length > 0
                  ? 'All tasks completed! Great work today.'
                  : 'Plan your study session to get started.'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
