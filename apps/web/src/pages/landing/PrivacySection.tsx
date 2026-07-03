const points = [
  { title: '100% free', desc: 'All features are free. No premium tiers, no paywalls.' },
  { title: 'No account needed', desc: 'Start learning immediately. No registration, no email required.' },
  { title: 'No backend required', desc: 'Everything runs in your browser. We do not have servers storing your data.' },
  { title: 'Your data stays local', desc: 'Vocabulary, progress, and study plans are stored locally in your browser.' },
  { title: 'AI features are optional', desc: 'AI-powered generation is entirely optional. Use it only if you want to.' },
  { title: 'Your own API key', desc: 'If you use AI features, you provide your own API key. We never see it.' },
  { title: 'Transparent AI usage', desc: 'Before sending any content to AI, we show you exactly what will be sent.' },
]

export default function PrivacySection() {
  return (
    <section
      className="bg-[var(--color-surface)] text-[var(--color-text)] px-4 py-16 sm:py-20 lg:py-24"
      id="privacy"
    >
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
          Free, private, and transparent
        </h2>
        <p className="mt-4 text-center text-lg text-[var(--color-text-secondary)]">
          No catches. No hidden data collection. Just a tool that works for you.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {points.map((p) => (
            <div
              key={p.title}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-6"
            >
              <h3 className="text-base font-semibold">{p.title}</h3>
              <p className="mt-1 text-[var(--color-text-secondary)] text-sm leading-relaxed">
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
