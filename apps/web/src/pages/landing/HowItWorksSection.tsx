import { Badge } from '@ielts/ui'

const steps: Array<{ step: number; title: string; description: string; icon: JSX.Element }> = [
  {
    step: 1,
    title: 'Set Your Goal',
    description: 'Select your current level, target band, and exam date. Tell us your weak areas and study preferences.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
  },
  {
    step: 2,
    title: 'AI Builds Your Plan',
    description: 'Our AI generates a complete study roadmap from today to exam day with personalized daily tasks.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
  },
  {
    step: 3,
    title: 'Study Daily',
    description: 'Open the app, see today\'s mission, complete tasks. Reading, listening, writing, speaking — all in one place.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    step: 4,
    title: 'Track & Improve',
    description: 'Watch your progress, review mistakes, and adjust your plan as you get closer to the exam.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
]

export default function HowItWorksSection() {
  return (
    <section className="px-4 py-16 sm:py-20 lg:py-24" id="how-it-works"
      style={{ background: 'var(--color-background)' }}
    >
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl"
          style={{ color: 'var(--color-text)' }}>
          Start learning in 4 simple steps.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-lg leading-relaxed"
          style={{ color: 'var(--color-text-secondary)' }}>
          From setting your goal to tracking progress — here&apos;s how IELTS Journey works.
        </p>

        <div className="relative mt-12">
          <div aria-hidden="true" className="absolute left-8 top-0 hidden h-full w-px sm:block"
            style={{ background: 'var(--color-border)' }}
          />

          <div className="space-y-10">
            {steps.map((s) => (
              <div key={s.step} className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
                <div className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl sm:h-14 sm:w-14"
                  style={{
                    background: s.step === 2 ? 'var(--color-tutor-accent-light)' : 'var(--color-primary-light)',
                    color: s.step === 2 ? 'var(--color-tutor-accent)' : 'var(--color-primary)',
                  }}>
                  {s.icon}
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-3">
                    <Badge variant={s.step === 2 ? 'info' : 'primary'} size="sm">
                      Step {s.step}
                    </Badge>
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                      {s.title}
                    </h3>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    {s.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
