const problems = [
  'They do not know where to start.',
  'They do not know the correct learning path.',
  'They waste time searching across too many websites.',
  'They study randomly without a clear plan.',
  'They do not know what to focus on each day.',
  'They feel overwhelmed by too many resources.',
  'They lose motivation because progress is not clear.',
]

export default function ProblemSection() {
  return (
    <section
      className="bg-[var(--color-surface)] px-4 py-16 sm:py-20 lg:py-24"
      id="problems"
    >
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center text-3xl font-bold tracking-tight text-[var(--color-text)] sm:text-4xl">
          The struggle is real
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-[var(--color-text-secondary)] text-lg leading-relaxed">
          Every day, IELTS learners face the same problem — not knowing what to
          study or where to begin.
        </p>
        <ul className="mt-10 space-y-4">
          {problems.map((problem) => (
            <li
              key={problem}
              className="flex items-start gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-5 py-4"
            >
              <span
                className="mt-0.5 shrink-0 text-lg"
                aria-hidden="true"
              >
                ✕
              </span>
              <span className="text-[var(--color-text)] text-base leading-relaxed">
                {problem}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
