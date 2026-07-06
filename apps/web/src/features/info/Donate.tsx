import PageHeader from '../../components/layout/PageHeader'
import { IconHeart } from '@ielts/ui'

export default function Donate() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 py-8">
      <PageHeader
        icon={<IconHeart size={22} />}
        title="Support IELTS Journey"
        description="IELTS Journey is and will always be free. If you find the app useful and would like to support its development, you can make a donation. Your contribution helps cover hosting costs, domain fees, and development time."
      />

      <div className="rounded-xl border p-6" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-alt)' }}>
        <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text)' }}>
          Donation Methods
        </h2>
        <p className="mt-2 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          Donation links will be added here in the future. For now, you can support the project by
          sharing it with others and submitting feedback to help make it better.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text)' }}>
          Other Ways to Help
        </h2>
        <ul className="list-inside list-disc space-y-2" style={{ color: 'var(--color-text-secondary)' }}>
          <li>Star the project on GitHub</li>
          <li>Report bugs and suggest features</li>
          <li>Share IELTS Journey with friends</li>
          <li>Submit a pull request</li>
        </ul>
      </div>
    </div>
  )
}
