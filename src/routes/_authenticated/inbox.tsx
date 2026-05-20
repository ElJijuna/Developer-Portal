import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import {
  useGhNotifications,
  useGhMarkNotificationRead,
  useGhMarkAllNotificationsRead,
} from '@api-hooks/gh'
import type { GitHubNotification } from 'gh-api-client'
import { DashboardGrid } from '@gnome-ui/layout/components/DashboardGrid'
import { CounterCard } from '@gnome-ui/layout/components/CounterCard'
import { EntityCard } from '@gnome-ui/layout'
import { EmptyState, ErrorState } from '@gnome-ui/layout'
import { TabBar, TabItem } from '@gnome-ui/react/components/Tabs'
import { Box } from '@gnome-ui/react/components/Box'
import { Button } from '@gnome-ui/react/components/Button'
import { IconButton } from '@gnome-ui/react/components/IconButton'
import { Spinner } from '@gnome-ui/react/components/Spinner'
import { Icon } from '@gnome-ui/react/components/Icon'
import { Text } from '@gnome-ui/react/components/Text'
import { Notifications, Check, Warning, Document, Settings } from '@gnome-ui/icons'
import { GitHub as GitHubIcon } from '@gnome-ui/icons/third-party'
import { PageHeader } from '../../components/PageHeader'
import { useAuth } from '../../auth/AuthProvider'
import { useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/inbox')({
  component: Inbox,
})

type InboxTab = 'all' | 'unread' | 'participating' | 'mentioned' | 'review_requested'

function subjectTypeIcon(type: string) {
  if (type === 'PullRequest') return Document
  if (type === 'Issue') return Warning
  if (type === 'CheckSuite') return Check
  return Notifications
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function Inbox() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const token = user?.githubToken ?? ''
  const [activeTab, setActiveTab] = useState<InboxTab>('unread')

  const { data, isLoading, error, refetch } = useGhNotifications(
    { all: true, per_page: 50 },
    { enabled: !!token },
  )

  const { mutate: markRead } = useGhMarkNotificationRead()
  const { mutate: markAllRead, isPending: markingAll } = useGhMarkAllNotificationsRead()

  const notifications: GitHubNotification[] = data?.values ?? []

  const filtered = useMemo(() => {
    switch (activeTab) {
      case 'unread':
        return notifications.filter((n) => n.unread)
      case 'participating':
        return notifications.filter((n) => n.reason === 'mention' || n.reason === 'comment' || n.reason === 'author')
      case 'mentioned':
        return notifications.filter((n) => n.reason === 'mention' || n.reason === 'team_mention')
      case 'review_requested':
        return notifications.filter((n) => n.reason === 'review_requested')
      default:
        return notifications
    }
  }, [notifications, activeTab])

  const unreadCount = notifications.filter((n) => n.unread).length

  if (!token) {
    return (
      <>
        <PageHeader title="Inbox" segments={[{ label: 'Inbox', path: '/inbox' }]} />
        <Box padding={24}>
          <EmptyState
            icon={<Icon icon={GitHubIcon} size="lg" />}
            title="GitHub not connected"
            description="Add your GitHub token in Settings to see your notifications."
            action={
              <Button variant="suggested" leadingIcon={<Icon icon={Settings} />} onClick={() => navigate({ to: '/settings' })}>
                Go to Settings
              </Button>
            }
          />
        </Box>
      </>
    )
  }

  const markAllAction = (
    <Button
      variant="flat"
      size="sm"
      disabled={markingAll || unreadCount === 0}
      leadingIcon={markingAll ? <Spinner /> : <Icon icon={Check} />}
      onClick={() => markAllRead(undefined, { onSuccess: () => refetch() })}
    >
      Mark all as read
    </Button>
  )

  return (
    <>
      <PageHeader
        title="Inbox"
        segments={[{ label: 'Inbox', path: '/inbox' }]}
        actions={markAllAction}
      />

      <Box orientation="vertical" spacing={12}>
        <DashboardGrid columns={{ xs: 1, sm: 1 }} gap="md">
          <CounterCard
            label="Unread notifications"
            value={unreadCount}
            icon={Notifications}
            loading={isLoading}
            loadingType="skeleton"
            color="#3584e4"
          />
        </DashboardGrid>

        <TabBar aria-label="Inbox tabs" inline>
          {(['all', 'unread', 'participating', 'mentioned', 'review_requested'] as InboxTab[]).map((tab) => (
            <TabItem
              key={tab}
              label={tab === 'review_requested' ? 'Review requested' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              active={activeTab === tab}
              onClick={() => setActiveTab(tab)}
            />
          ))}
        </TabBar>

        {isLoading ? (
          <Box align="center" justify="center" padding={48}><Spinner /></Box>
        ) : error ? (
          <ErrorState type="network" description={error.message} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Icon icon={Notifications} size="lg" />}
            title="All caught up"
            description="No notifications in this category."
          />
        ) : (
          <Box orientation="vertical" spacing={8}>
            <Text variant="caption" color="dim">{filtered.length} notification{filtered.length !== 1 ? 's' : ''}</Text>
            {filtered.map((n) => (
              <EntityCard
                key={n.id}
                avatar={<Icon icon={subjectTypeIcon(n.subject.type)} size="md" />}
                title={n.subject.title}
                subtitle={n.repository.full_name}
                meta={[n.reason.replace(/_/g, ' '), relativeTime(n.updated_at)]}
                trailing={
                  n.unread ? (
                    <IconButton
                      icon={Check}
                      label="Mark as read"
                      variant="flat"
                      size="sm"
                      onClick={() => markRead(n.id, { onSuccess: () => refetch() })}
                    />
                  ) : undefined
                }
              />
            ))}
          </Box>
        )}
      </Box>
    </>
  )
}
