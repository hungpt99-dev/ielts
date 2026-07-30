import {
  IconHighlight, IconVocabulary, IconAdd, IconArticle,
  IconReading, IconSpeaking, IconWriting, IconTodayPlan,
  IconDashboard, IconLock, IconDownload, IconAITutor,
} from '@ielts/ui'

const featureCategories = [
  {
    label: 'Browser Extension',
    gradient: 'from-blue-500 to-blue-600',
    features: [
      { title: 'IELTS word highlighter', desc: 'Highlight IELTS words on any webpage', icon: <IconHighlight size={18} /> },
      { title: 'Click to see meaning', desc: 'Instant definitions and examples', icon: <IconVocabulary size={18} /> },
      { title: 'Save vocabulary', desc: 'Save from any website to your notebook', icon: <IconAdd size={18} /> },
      { title: 'Save articles', desc: 'Bookmark articles to study later', icon: <IconArticle size={18} /> },
    ],
  },
  {
    label: 'Practice',
    gradient: 'from-green-500 to-emerald-500',
    features: [
      { title: 'Reading questions', desc: 'AI-generated IELTS Reading tasks', icon: <IconReading size={18} /> },
      { title: 'Speaking practice', desc: 'Part 1, 2, 3 question bank', icon: <IconSpeaking size={18} /> },
      { title: 'Writing Task 2', desc: 'Extract and brainstorm essay ideas', icon: <IconWriting size={18} /> },
    ],
  },
  {
    label: 'Planning & Progress',
    gradient: 'from-purple-500 to-violet-500',
    features: [
      { title: 'Daily study plan', desc: 'AI builds your day-by-day roadmap', icon: <IconTodayPlan size={18} /> },
      { title: 'Progress dashboard', desc: 'Track band score improvement', icon: <IconDashboard size={18} /> },
      { title: 'AI Tutor', desc: 'Personal tutor with your API key', icon: <IconAITutor size={18} /> },
    ],
  },
  {
    label: 'Privacy & Freedom',
    gradient: 'from-amber-500 to-orange-500',
    features: [
      { title: 'Local-first storage', desc: 'Your data never leaves your device', icon: <IconLock size={18} /> },
      { title: 'Import & Export', desc: 'Take your data anywhere', icon: <IconDownload size={18} /> },
    ],
  },
]

export default function FeatureGrid() {
  return (
    <section className="relative px-4 py-20 sm:py-24" id="features">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{
        background: 'linear-gradient(180deg, var(--color-background) 0%, var(--color-surface) 40%, var(--color-surface) 60%, var(--color-background) 100%)',
      }} />

      <div className="relative mx-auto max-w-6xl">
        <div className="text-center">
          <span className="inline-flex items-center whitespace-nowrap rounded-full bg-[var(--color-primary-light)] px-3 py-1 text-xs font-semibold text-[var(--color-primary)] ring-1 ring-inset ring-[var(--color-primary)]/10">
            Everything You Need
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-[var(--color-text)] sm:text-4xl lg:text-5xl">
            All features.{' '}
            <span className="text-[var(--color-primary)]">100% free.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[var(--color-text-secondary)] sm:text-lg">
            Everything you need to master IELTS, completely free. No hidden limits, no premium tiers.
          </p>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
          {featureCategories.map((cat) => (
            <div key={cat.label}>
              <div className="mb-4 flex items-center gap-2.5">
                <div className={`h-1.5 w-1.5 rounded-full bg-gradient-to-br ${cat.gradient}`} />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{cat.label}</h3>
              </div>
              <div className="flex flex-col gap-3">
                {cat.features.map((f) => (
                  <div
                    key={f.title}
                    className="group flex items-start gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-primary-light)]"
                    style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.02)' }}
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary-light)] text-[var(--color-primary)] transition-colors group-hover:bg-[var(--color-primary)]/15">
                      {f.icon}
                    </div>
                    <div>
                      <span className="block truncate text-sm font-medium text-[var(--color-text)]">{f.title}</span>
                      <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
