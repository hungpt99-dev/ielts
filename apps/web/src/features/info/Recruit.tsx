export default function Recruit() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 py-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
          Recruit
        </h1>
        <p className="text-lg leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          Interested in contributing to IELTS Journey or collaborating on a project?
          I am always open to working with talented individuals and teams.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text)' }}>
          How to Get Involved
        </h2>
        <ul className="list-inside list-disc space-y-2" style={{ color: 'var(--color-text-secondary)' }}>
          <li>Contribute to the project on GitHub — bug reports, feature requests, and pull requests are welcome</li>
          <li>Suggest improvements or new features through the Feedback tab</li>
          <li>Spread the word to fellow IELTS test-takers</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text)' }}>
          For Employers
        </h2>
        <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          If you are looking for a developer who ships real, user-facing products with clean
          architecture and attention to detail, let us talk. This project demonstrates my ability
          to design and build full-stack applications from the ground up.
        </p>
      </div>
    </div>
  )
}
