export default function WebsiteInfo() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 py-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
          About IELTS Journey
        </h1>
        <p className="text-lg leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          IELTS Journey is a free, all-in-one platform designed to help you prepare for the IELTS exam.
          From vocabulary building and reading practice to writing feedback and speaking exercises,
          everything you need is right here — no subscriptions, no hidden fees.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text)' }}>
          Features
        </h2>
        <ul className="list-inside list-disc space-y-2" style={{ color: 'var(--color-text-secondary)' }}>
          <li>IELTS word highlighter with instant meanings and examples</li>
          <li>Save vocabulary from any webpage</li>
          <li>Save articles to study later</li>
          <li>Generate IELTS Reading questions from saved articles</li>
          <li>Speaking Part 1, 2, and 3 practice questions</li>
          <li>Extract Writing Task 2 ideas</li>
          <li>Daily study plan with progress tracking</li>
          <li>Progress dashboard with skill analytics</li>
          <li>Local-first data storage — your data stays on your device</li>
          <li>Import and export your data freely</li>
          <li>AI tutor powered by your own API key</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text)' }}>
          Privacy
        </h2>
        <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          Your data is stored locally in your browser. Nothing is sent to any server unless you
          explicitly configure an AI API key, in which case only the minimal data needed for
          that feature is transmitted to your chosen provider. We do not track, sell, or share
          your personal information.
        </p>
      </div>
    </div>
  )
}
