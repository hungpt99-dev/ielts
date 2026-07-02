import { useState } from 'react'
import PublicApiSearch from '../features/publicApiIntegration/components/PublicApiSearch'
import ImportedContentManager from '../features/publicApiIntegration/components/ImportedContentManager'
import Card, { CardContent } from '../components/ui/Card'

type Tab = 'search' | 'imported'

export default function PublicApiImportPage() {
  const [activeTab, setActiveTab] = useState<Tab>('search')

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Public API Content
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Search open educational resources, dictionaries, articles, and videos.
          Import content into your local database for IELTS practice.
        </p>
      </div>

      <Card padding={false}>
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'search'
                ? 'border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            Search Public Content
          </button>
          <button
            onClick={() => setActiveTab('imported')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'imported'
                ? 'border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
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
        <CardContent className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
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
    </div>
  )
}
