import { IconHighlight, IconVocabulary, IconAdd, IconArticle, IconReading, IconSpeaking, IconWriting, IconTodayPlan, IconDashboard, IconLock, IconDownload, IconAITutor } from '@ielts/ui'

const features = [
  { title: 'IELTS word highlighter', icon: <IconHighlight size={20} /> },
  { title: 'Click to see meaning and examples', icon: <IconVocabulary size={20} /> },
  { title: 'Save vocabulary from any webpage', icon: <IconAdd size={20} /> },
  { title: 'Save articles to study later', icon: <IconArticle size={20} /> },
  { title: 'Generate IELTS Reading questions', icon: <IconReading size={20} /> },
  { title: 'Speaking Part 1, 2, 3 questions', icon: <IconSpeaking size={20} /> },
  { title: 'Extract Writing Task 2 ideas', icon: <IconWriting size={20} /> },
  { title: 'Daily study plan', icon: <IconTodayPlan size={20} /> },
  { title: 'Progress dashboard', icon: <IconDashboard size={20} /> },
  { title: 'Local-first data storage', icon: <IconLock size={20} /> },
  { title: 'Import and export data', icon: <IconDownload size={20} /> },
  { title: 'AI tutor with your own API key', icon: <IconAITutor size={20} /> },
]

export default function FeatureGrid() {
  return (
    <section
      className="bg-[var(--color-surface)] text-[var(--color-text)] px-4 py-16 sm:py-20 lg:py-24"
      id="features"
    >
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
          Everything you need to master IELTS
        </h2>
        <p className="mt-4 text-center text-lg text-[var(--color-text-secondary)]">
          All features are free. No hidden limits.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="flex items-start gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4 transition-colors hover:brightness-95"
            >
              <span className="mt-0.5 shrink-0 text-[var(--color-primary)]">
                {f.icon}
              </span>
              <span className="text-sm font-medium">{f.title}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
