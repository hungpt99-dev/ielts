import { Badge } from '@ielts/ui'

interface StepData {
  step: number
  title: string
  description: string
  icon: JSX.Element
  gradient: string
}

const steps: StepData[] = [
  {
    step: 1,
    title: 'Set Your Goal',
    description: 'Select your current level, target band, and exam date. Tell us your weak areas and study preferences.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    step: 2,
    title: 'AI Builds Your Plan',
    description: 'Our AI generates a complete study roadmap from today to exam day with personalized daily tasks.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
    gradient: 'from-blue-500 to-indigo-500',
  },
  {
    step: 3,
    title: 'Study Daily',
    description: "Open the app, see today's mission, complete tasks. Reading, listening, writing, speaking — all in one place.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    step: 4,
    title: 'Track & Improve',
    description: 'Watch your progress, review mistakes, and adjust your plan as you get closer to the exam.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    gradient: 'from-purple-500 to-violet-500',
  },
]

export default function HowItWorksSection() {
  return (
    <section className="bg-[var(--color-background)] px-4 py-20 sm:py-28 lg:py-32" id="how-it-works">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <span className="inline-flex rounded-full bg-[var(--color-primary-light)] px-3 py-1 text-xs font-semibold text-[var(--color-primary)] ring-1 ring-inset ring-[var(--color-primary)]/10">
            How It Works
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-[var(--color-text)] sm:text-4xl lg:text-5xl">
            Start learning in{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">4 simple steps.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[var(--color-text-secondary)] sm:text-lg">
            From setting your goal to tracking progress — here's how IELTS Journey works.
          </p>
        </div>

        <div className="relative mx-auto mt-16 max-w-3xl">
          <div
            aria-hidden="true"
            className="absolute left-[27px] top-4 bottom-4 hidden w-0.5 rounded-full sm:block"
            style={{ background: 'linear-gradient(to bottom, #f59e0b, var(--color-primary), #16a34a, #7c3aed)' }}
          />

          <div className="space-y-12">
            {steps.map((s) => (
              <div key={s.step} className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-8">
                <div className="relative z-10 flex shrink-0 flex-col items-center">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${s.gradient} text-white shadow-lg`}>
                    {s.icon}
                  </div>
                  <span className="mt-2 text-xs font-bold text-[var(--color-muted)]">
                    0{s.step}
                  </span>
                </div>

                <div
                  className="flex-1 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-all duration-300 sm:ml-2"
                  style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.02)' }}
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="primary" size="sm">Step {s.step}</Badge>
                    <h3 className="text-lg font-semibold text-[var(--color-text)]">{s.title}</h3>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
