import { useState } from 'react'
import PublicApiSearch from '../features/publicApiIntegration/components/PublicApiSearch'
import ImportedContentManager from '../features/publicApiIntegration/components/ImportedContentManager'
import Card, { CardContent } from '../components/ui/Card'
import PageHeader from '../components/layout/PageHeader'
import PageContent from '../components/layout/PageContent'
import { IconDownload } from '@ielts/ui'

type Tab = 'search' | 'imported'

export default function PublicApiImportPage() {
  const [activeTab, setActiveTab] = useState<Tab>('search')

  return (
    <PageContent className="space-y-6">
      <PageHeader
        icon={<IconDownload size={20} />}
        title="Public API Content"
        description="Search open educational resources, dictionaries, articles, and videos. Import content into your local database for IELTS practice."
      />

      <Card padding={false}>
        <div className="flex" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <button
            onClick={() => setActiveTab('search')}
            className="flex-1 px-4 py-3 text-sm font-medium transition-colors"
            style={{
              borderBottom: activeTab === 'search' ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: activeTab === 'search' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            }}
          >
            Search Public Content
          </button>
          <button
            onClick={() => setActiveTab('imported')}
            className="flex-1 px-4 py-3 text-sm font-medium transition-colors"
            style={{
              borderBottom: activeTab === 'imported' ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: activeTab === 'imported' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            }}
          >
            Imported Content
          </button>
        </div>
      </Card>

      {activeTab === 'search' ? (
        <PublicApiSearch />
      ) : (
        <ImportedContentManager />
      )}

      <Card>
        <CardContent className="space-y-2" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
          <p>
            <strong>About Public API Content</strong>
          </p>
          <p>
            All content is fetched from public, open APIs and stored locally in
            your browser using IndexedDB. No data is sent to any server beyond
            the API calls you explicitly trigger.
          </p>
          <p>
            Content licenses are verified before import. Attribution is stored
            and displayed for every item. Items with unclear or restrictive
            licenses cannot be imported.
          </p>
          <p>
            This feature is optional — the app works fully with built-in
            content, user-created content, and AI-generated content.
          </p>
        </CardContent>
      </Card>
    </PageContent>
  )
}
