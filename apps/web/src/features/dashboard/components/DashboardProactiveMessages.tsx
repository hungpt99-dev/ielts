import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Card, { CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import ProactiveMessageCard from '../../../features/aiTutor/components/ProactiveMessageCard'
import { proactiveMessageEngine } from '../../../services/ProactiveMessageEngine'
import type { ProactiveMessage } from '../../../services/ProactiveMessageEngine'

const MAX_VISIBLE = 3

export default function DashboardProactiveMessages() {
  const [allMessages, setAllMessages] = useState<ProactiveMessage[]>([])
  const navigate = useNavigate()

  const refresh = useCallback(() => {
    setAllMessages(proactiveMessageEngine.getAllMessages())
  }, [])

  useEffect(() => {
    refresh()
    const unsub = proactiveMessageEngine.onMessage(() => {
      refresh()
    })
    return () => unsub()
  }, [refresh])

  const visibleMessages = useMemo(() => {
    return allMessages
      .filter(m => !m.isDismissed)
      .sort((a, b) => {
        const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
        const pa = priorityOrder[a.priority] ?? 2
        const pb = priorityOrder[b.priority] ?? 2
        if (pa !== pb) return pa - pb
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
      .slice(0, MAX_VISIBLE)
  }, [allMessages])

  const unreadCount = useMemo(
    () => allMessages.filter(m => !m.isRead && !m.isDismissed && !m.isSnoozed).length,
    [allMessages],
  )

  const handleMarkRead = useCallback((id: string) => {
    proactiveMessageEngine.markAsRead(id)
    refresh()
  }, [refresh])

  const handleDismiss = useCallback((id: string) => {
    proactiveMessageEngine.dismissMessage(id)
    refresh()
  }, [refresh])

  const handleSnooze = useCallback((id: string) => {
    proactiveMessageEngine.snoozeMessage(id)
    refresh()
  }, [refresh])

  const handleAction = useCallback((msg: ProactiveMessage) => {
    proactiveMessageEngine.markAsRead(msg.id)
    if (msg.action?.type === 'navigate' && msg.action.payload?.path) {
      navigate(msg.action.payload.path as string)
    }
  }, [navigate])

  if (visibleMessages.length === 0) return null

  return (
    <Card role="region" aria-label="AI Tutor proactive messages" className="border-l-4" style={{ borderLeftColor: 'var(--color-primary)' }}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>AI Tutor Suggestions</CardTitle>
            {unreadCount > 0 && (
              <span
                className="flex min-w-[18px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold leading-tight"
                style={{
                  backgroundColor: 'var(--color-danger)',
                  color: 'var(--color-on-danger, #fff)',
                }}
              >
                {unreadCount}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/tutor')}
          >
            View all
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="-mx-4">
          {visibleMessages.map(msg => (
            <ProactiveMessageCard
              key={msg.id}
              message={msg}
              onMarkRead={handleMarkRead}
              onDismiss={handleDismiss}
              onSnooze={handleSnooze}
              onAction={handleAction}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
