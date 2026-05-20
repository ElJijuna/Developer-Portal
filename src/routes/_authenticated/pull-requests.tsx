import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { useGhCurrentUser, useGhSearchIssues } from '@api-hooks/gh'
import type { GitHubIssue } from 'gh-api-client'
import { DashboardGrid } from '@gnome-ui/layout/components/DashboardGrid'
import { CounterCard } from '@gnome-ui/layout/components/CounterCard'
import { EntityCard, EmptyState, ErrorState } from '@gnome-ui/layout'
import { TabBar, TabItem } from '@gnome-ui/react/components/Tabs'
import { Box } from '@gnome-ui/react/components/Box'
import { Spinner } from '@gnome-ui/react/components/Spinner'
import { Text } from '@gnome-ui/react/components/Text'
import { Icon } from '@gnome-ui/react/components/Icon'
import { Button } from '@gnome-ui/react/components/Button'
import { StatusBadge } from '@gnome-ui/react/components/StatusBadge'
import { Document, Settings, Person } from '@gnome-ui/icons'
import { GitHub as GitHubIcon } from '@gnome-ui/icons/third-party'
import { PageHeader } from '../../components/PageHeader'
import { useAuth } from '../../auth/AuthProvider'

export const Route = createFileRoute('/_authenticated/pull-requests')({
  component: PullRequests,
})

type PRPreset = 'all' | 'ready' | 'draft' | 'awaiting-review'

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  return `${days}d ago`
}

function repoFromUrl(url: string) {
  const match = url.match(/github\.com\/([^/]+\/[^/]+)\/pull/)
  return match?.[1] ?? url
}

function filterByPreset(prs: GitHubIssue[], preset: PRPreset): GitHubIssue[] {
  switch (preset) {
    case 'draft':
      return prs.filter((pr) => (pr as GitHubIssue & { draft?: boolean }).draft)
    case 'ready':
      return prs.filter((pr) => !(pr as GitHubIssue & { draft?: boolean }).draft)
    case 'awaiting-review':
      return prs.filter((pr) => {
        const p = pr as GitHubIssue & { requested_reviewers?: unknown[] }
        return Array.isArray(p.requested_reviewers) && p.requested_reviewers.length > 0
      })
    default:
      return prs
  }
}

function PullRequests() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const token = user?.githubToken ?? ''
  const [activePreset, setActivePreset] = useState<PRPreset>('all')

  const { data: me, isLoading: meLoading } = useGhCurrentUser({ enabled: !!token })
  const login = me?.login ?? ''

  const { data, isLoading: prsLoading, error } = useGhSearchIssues(
    { q: `is:pr author:${login} is:open`, per_page: 50 },
    { enabled: !!login },
  )

  const allPRs: GitHubIssue[] = data?.values ?? []
  const draftCount = allPRs.filter((pr) => (pr as GitHubIssue & { draft?: boolean }).draft).length
  const awaitingCount = allPRs.filter((pr) => {
    const p = pr as GitHubIssue & { requested_reviewers?: unknown[] }
    return Array.isArray(p.requested_reviewers) && p.requested_reviewers.length > 0
  }).length

  const filtered = useMemo(() => filterByPreset(allPRs, activePreset), [allPRs, activePreset])

  const isLoading = meLoading || prsLoading

  if (!token) {
    return (
      <>
        <PageHeader title="Pull Requests" segments={[{ label: 'Pull Requests', path: '/pull-requests' }]} />
        <Box padding={24}>
          <EmptyState
            icon={<Icon icon={GitHubIcon} size="lg" />}
            title="GitHub not connected"
            description="Add your GitHub token in Settings to see your pull requests."
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

  return (
    <>
      <PageHeader
        title="Pull Requests"
        segments={[{ label: 'Pull Requests', path: '/pull-requests' }]}
      />

      <Box orientation="vertical" spacing={12}>
        <DashboardGrid columns={{ xs: 1, sm: 3 }} gap="md">
          <CounterCard label="Open PRs" value={allPRs.length} icon={Document} loading={isLoading} loadingType="skeleton" color="#3584e4" />
          <CounterCard label="Draft" value={draftCount} icon={Document} loading={isLoading} loadingType="skeleton" color="#77767b" />
          <CounterCard label="Awaiting review" value={awaitingCount} icon={Person} loading={isLoading} loadingType="skeleton" color="#e5a50a" />
        </DashboardGrid>

        <TabBar aria-label="PR filter tabs" inline>
          {([
            { id: 'all', label: 'All' },
            { id: 'ready', label: 'Ready' },
            { id: 'draft', label: 'Draft' },
            { id: 'awaiting-review', label: 'Awaiting review' },
          ] as { id: PRPreset; label: string }[]).map((t) => (
            <TabItem
              key={t.id}
              label={t.label}
              active={activePreset === t.id}
              onClick={() => setActivePreset(t.id)}
            />
          ))}
        </TabBar>

        {isLoading ? (
          <Box align="center" justify="center" padding={48}><Spinner /></Box>
        ) : error ? (
          <ErrorState type="network" description={error.message} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Icon icon={Document} size="lg" />}
            title="No pull requests"
            description={`No ${activePreset === 'all' ? 'open' : activePreset} pull requests found.`}
          />
        ) : (
          <Box orientation="vertical" spacing={8}>
            <Text variant="caption" color="dim">{filtered.length} pull request{filtered.length !== 1 ? 's' : ''}</Text>
            {filtered.map((pr) => {
              const isDraft = (pr as GitHubIssue & { draft?: boolean }).draft
              return (
                <EntityCard
                  key={pr.id}
                  avatar={<Icon icon={Document} size="md" />}
                  title={pr.title}
                  subtitle={repoFromUrl(pr.html_url)}
                  meta={[`#${pr.number}`, relativeTime(pr.updated_at)]}
                  trailing={
                    <StatusBadge variant={isDraft ? 'neutral' : 'success'}>
                      {isDraft ? 'Draft' : 'Ready'}
                    </StatusBadge>
                  }
                  interactive
                  onClick={() => window.open(pr.html_url, '_blank')}
                />
              )
            })}
          </Box>
        )}
      </Box>
    </>
  )
}
