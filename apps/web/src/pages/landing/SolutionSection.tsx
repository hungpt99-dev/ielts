const solutions = [
  {
    title: 'Structured IELTS Roadmap',
    description:
      'Follow a clear learning path designed around your target band, exam date, and current level — no more guessing what to study next.',
  },
  {
    title: 'Daily Study Tasks',
    description:
      'Every day, you see exactly what you need to learn and complete. Open the app and start studying right away.',
  },
  {
    title: 'Ready-Made Learning Content',
    description:
      'Click a task and immediately access the lesson, exercise, or practice activity you need. No searching across websites.',
  },
  {
    title: 'All Skills in One Place',
    description:
      'Vocabulary, grammar, reading, listening, writing, and speaking practice are organized so you can focus on what matters most.',
  },
  {
    title: 'Focus on Learning, Not Searching',
    description:
      'Stop wasting time looking for materials. IELTS Journey brings everything you need into one simple dashboard.',
  },
  {
    title: 'Simple and Clear Progress',
    description:
      'Track completed tasks, study streaks, and weak areas. See your progress and stay motivated every day.',
  },
]

export default function SolutionSection() {
  return (
    <section
      className="bg-[var(--color-surface)] px-4 py-16 sm:py-20 lg:py-24"
      id="solution"
    >
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-bold tracking-tight text-[var(--color-text)] sm:text-4xl">
          How IELTS Journey helps
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-lg leading-relaxed text-[var(--color-text-secondary)]">
          Instead of searching across dozens of websites, you get a clear daily
          plan with everything you need to study.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {solutions.map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-6"
            >
              <h3 className="text-lg font-semibold text-[var(--color-text)]">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
