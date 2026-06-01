import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  useGhNotifications,
  useGhMarkNotificationRead,
  useGhMarkAllNotificationsRead,
} from '@api-hooks/gh'
import { useLiveQuery } from '@tanstack/react-db'
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
import { Notifications, Check, Warning, Document } from '@gnome-ui/icons'
import { GitHub as GitHubIcon } from '@gnome-ui/icons/third-party'
import { PageHeader } from '../../components/PageHeader'
import { useAuth } from '../../auth/AuthProvider'
import { useNavigate } from '@tanstack/react-router'
import { notificationsCollection } from '../../db/collections'
import type { NotificationRecord } from '../../db/schema'
import type { GitHubNotification } from 'gh-api-client'

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

function mapNotification(n: GitHubNotification): NotificationRecord {
  return {
    id: n.id,
    unread: n.unread,
    reason: n.reason,
    subject_title: n.subject.title,
    subject_type: n.subject.type,
    subject_url: n.subject.url,
    repo_name: n.repository.name,
    repo_full_name: n.repository.full_name,
    updated_at: n.updated_at,
  }
}

function Inbox() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const token = user?.githubToken ?? ''
  const [activeTab, setActiveTab] = useState<InboxTab>('unread')

  const { data: ghData, isLoading, error } = useGhNotifications(
    { all: true, per_page: 50 },
    { enabled: !!token },
  )

  const { mutate: markReadMutate } = useGhMarkNotificationRead()
  const { mutate: markAllReadMutate, isPending: markingAll } = useGhMarkAllNotificationsRead()

  // Sync GitHub API data into local collection (insert new, update existing)
  useEffect(() => {
    if (!ghData) return
    const incoming = ghData.values ?? []
    const existingState = notificationsCollection.state

    const toInsert = incoming.filter((n) => !existingState.has(n.id)).map(mapNotification)
    const toUpdate = incoming.filter((n) => existingState.has(n.id))

    if (toInsert.length > 0) notificationsCollection.insert(toInsert)
    toUpdate.forEach((n) => {
      notificationsCollection.update(n.id, (draft) => { Object.assign(draft, mapNotification(n)) })
    })
  }, [ghData])

  // Reactive read from collection — updates instantly on optimistic mutations
  const { data: notifications = [] } = useLiveQuery(notificationsCollection)

  const filtered = useMemo(() => {
    switch (activeTab) {
      case 'unread': return notifications.filter((n) => n.unread)
      case 'participating': return notifications.filter((n) => ['mention', 'comment', 'author'].includes(n.reason))
      case 'mentioned': return notifications.filter((n) => ['mention', 'team_mention'].includes(n.reason))
      case 'review_requested': return notifications.filter((n) => n.reason === 'review_requested')
      default: return notifications
    }
  }, [notifications, activeTab])

  const unreadCount = notifications.filter((n) => n.unread).length

  // Optimistic mark-as-read: updates collection immediately, syncs API in background
  const handleMarkRead = useCallback((id: string) => {
    notificationsCollection.update(id, (draft) => { draft.unread = false })
    markReadMutate(id)
  }, [markReadMutate])

  const handleMarkAllRead = useCallback(() => {
    notifications.filter((n) => n.unread).forEach((n) => {
      notificationsCollection.update(n.id, (draft) => { draft.unread = false })
    })
    markAllReadMutate(undefined)
  }, [notifications, markAllReadMutate])


  const markAllAction = (
    <Button
      variant="flat"
      size="sm"
      disabled={markingAll || unreadCount === 0}
      leadingIcon={markingAll ? <Spinner /> : <Icon icon={Check} />}
      onClick={handleMarkAllRead}
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
            loading={isLoading && notifications.length === 0}
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

        {isLoading && notifications.length === 0 ? (
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
                avatar={<Icon icon={subjectTypeIcon(n.subject_type)} size="md" />}
                title={n.subject_title}
                subtitle={n.repo_full_name}
                meta={[n.reason.replace(/_/g, ' '), relativeTime(n.updated_at)]}
                trailing={
                  n.unread ? (
                    <IconButton
                      icon={Check}
                      label="Mark as read"
                      variant="flat"
                      size="sm"
                      onClick={() => handleMarkRead(n.id)}
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
