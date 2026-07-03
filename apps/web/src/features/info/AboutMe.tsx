export default function AboutMe() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 py-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
          About the Developer
        </h1>
        <p className="text-lg leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          I am a full-stack developer passionate about building tools that make education accessible
          to everyone. IELTS Journey was born from the belief that high-quality test preparation
          should not come with a high price tag.
        </p>
        <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          I enjoy working with modern web technologies — React, TypeScript, Node.js, and browser
          extension APIs — and I am always looking for new challenges and opportunities to grow.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text)' }}>
          Skills & Experience
        </h2>
        <ul className="list-inside list-disc space-y-2" style={{ color: 'var(--color-text-secondary)' }}>
          <li>React / TypeScript / Next.js</li>
          <li>Node.js / Express / APIs</li>
          <li>Browser Extension Development</li>
          <li>Database Design (SQLite, localStorage, IndexedDB)</li>
          <li>UI/UX Design with Tailwind CSS</li>
          <li>Monorepo management with Turborepo</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text)' }}>
          Open to Work
        </h2>
        <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          I am currently open to full-time, contract, or freelance opportunities. If you think
          I would be a good fit for your team, please reach out.
        </p>
      </div>
    </div>
  )
}
