import PageHeader from '../components/layout/PageHeader'
import PageContent from '../components/layout/PageContent'
import { IconInfo } from '@ielts/ui'

export default function PrivacyPage() {
  return (
    <PageContent className="space-y-8">
      <PageHeader icon={<IconInfo size={22} />} title="Privacy Policy" />

      <section className="space-y-4 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>Information We Collect</h2>
        <p>IELTS Learning Journey is a local-first application. Your study data — vocabulary, mistakes, articles, videos, and progress — is stored entirely on your device in IndexedDB and localStorage. We do not collect, transmit, or store any of your personal data on external servers.</p>
        <p>The only external service used is the AI provider you configure (e.g., OpenAI). When you use AI features, the text you submit is sent to your chosen AI provider for processing. Your API key is stored locally on your device.</p>
      </section>

      <section className="space-y-4 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>Data Storage</h2>
        <p>All data is stored locally in your browser's IndexedDB database. You can export, import, or delete your data at any time from the Settings &gt; Data Management page. Uninstalling the browser extension will remove all locally stored data.</p>
      </section>

      <section className="space-y-4 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>Browser Extension</h2>
        <p>The Chrome extension requires the following permissions:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>storage:</strong> To save your study data locally on your device.</li>
          <li><strong>activeTab + &lt;all_urls&gt;:</strong> To allow you to save text, vocabulary, and articles from any webpage you visit. This permission is only used when you actively trigger a save action.</li>
          <li><strong>contextMenus:</strong> To add right-click menu options for saving selected text.</li>
        </ul>
      </section>

      <section className="space-y-4 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>Third-Party Services</h2>
        <p>When you use AI features (explain, simplify, generate questions, etc.), your content is processed by the AI provider you selected (OpenAI or a custom endpoint). Please refer to their privacy policy for information about how they handle your data.</p>
      </section>

      <section className="space-y-4 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>Contact</h2>
        <p>If you have questions about this privacy policy, contact us at <a href="mailto:hello@ieltsjourney.dev" style={{ color: 'var(--color-primary)' }}>hello@ieltsjourney.dev</a>.</p>
      </section>

      <p className="pt-4 text-xs" style={{ color: 'var(--color-muted)' }}>Last updated: July 2026</p>
    </PageContent>
  )
}
