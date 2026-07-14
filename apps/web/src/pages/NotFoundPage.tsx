import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@ielts/config'
import PageContent from '../components/layout/PageContent'
import Button from '../components/ui/Button'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <PageContent style={{ minHeight: '60vh' }} className="flex items-center justify-center">
      <div style={{ maxWidth: '448px', textAlign: 'center' }}>
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl" style={{ backgroundColor: 'var(--color-surface-alt)' }}>
          <span className="text-3xl font-bold" style={{ color: 'var(--color-muted)' }}>404</span>
        </div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
          Page not found
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button variant="primary" onClick={() => navigate(ROUTES.dashboard)}>
            Go to Dashboard
          </Button>
          <Button variant="ghost" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </div>
      </div>
    </PageContent>
  )
}
