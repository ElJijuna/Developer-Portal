import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { useGhIssues } from '@api-hooks/gh'
import type { GitHubIssue } from 'gh-api-client'
import { DashboardGrid } from '@gnome-ui/layout/components/DashboardGrid'
import { CounterCard } from '@gnome-ui/layout/components/CounterCard'
import { EntityCard, EmptyState, ErrorState } from '@gnome-ui/layout'
import { Box } from '@gnome-ui/react/components/Box'
import { Spinner } from '@gnome-ui/react/components/Spinner'
import { Text } from '@gnome-ui/react/components/Text'
import { Icon } from '@gnome-ui/react/components/Icon'
import { Button } from '@gnome-ui/react/components/Button'
import { Chip } from '@gnome-ui/react/components/Chip'
import { SearchBar } from '@gnome-ui/react/components/SearchBar'
import { IconButton } from '@gnome-ui/react/components/IconButton'
import { GitIssueOpened, GitRepository, Search, Settings } from '@gnome-ui/icons'
import { GitHub as GitHubIcon } from '@gnome-ui/icons/third-party'
import { PageHeader } from '../../components/PageHeader'
import { useAuth } from '../../auth/AuthProvider'

export const Route = createFileRoute('/_authenticated/issues')({
  component: Issues,
})

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

function repoFromUrl(url: string) {
  const match = url.match(/github\.com\/([^/]+\/[^/]+)\/issues/)
  return match?.[1] ?? url
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  return `${days}d ago`
}

function Issues() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const token = user?.githubToken ?? ''
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)

  const { data, isLoading, error } = useGhIssues(
    { filter: 'all', state: 'open', per_page: 100 },
    { enabled: !!token },
  )

  const allIssues: GitHubIssue[] = useMemo(
    () => (data?.values ?? []).filter((i) => !i.pull_request),
    [data],
  )

  const staleIssues = useMemo(
    () => allIssues.filter((i) => Date.now() - new Date(i.updated_at).getTime() > THIRTY_DAYS_MS),
    [allIssues],
  )

  const affectedRepos = useMemo(
    () => new Set(allIssues.map((i) => repoFromUrl(i.html_url))).size,
    [allIssues],
  )

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return allIssues
    const q = searchQuery.toLowerCase()
    return allIssues.filter(
      (i) => i.title.toLowerCase().includes(q) || repoFromUrl(i.html_url).toLowerCase().includes(q),
    )
  }, [allIssues, searchQuery])

  if (!token) {
    return (
      <>
        <PageHeader title="Issues" segments={[{ label: 'Issues', path: '/issues' }]} />
        <Box padding={24}>
          <EmptyState
            icon={<Icon icon={GitHubIcon} size="lg" />}
            title="GitHub not connected"
            description="Add your GitHub token in Settings to see your issues."
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

  const searchAction = (
    <IconButton
      icon={Search}
      label="Search"
      variant="flat"
      onClick={() => setSearchOpen((v) => !v)}
    />
  )

  return (
    <>
      <PageHeader
        title="Issues"
        segments={[{ label: 'Issues', path: '/issues' }]}
        actions={searchAction}
      />

      <Box orientation="vertical" spacing={12}>
        <DashboardGrid columns={{ xs: 1, sm: 3 }} gap="md">
          <CounterCard label="Open issues" value={allIssues.length} icon={GitIssueOpened} loading={isLoading} loadingType="skeleton" color="#e01b24" />
          <CounterCard label="Stale (>30d)" value={staleIssues.length} icon={GitIssueOpened} loading={isLoading} loadingType="skeleton" color="#e5a50a" />
          <CounterCard label="Repos affected" value={affectedRepos} icon={GitRepository} loading={isLoading} loadingType="skeleton" />
        </DashboardGrid>

        <SearchBar
          open={searchOpen}
          inline
          placeholder="Search issues…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClose={() => { setSearchOpen(false); setSearchQuery('') }}
          onClear={() => setSearchQuery('')}
        />

        {isLoading ? (
          <Box align="center" justify="center" padding={48}><Spinner /></Box>
        ) : error ? (
          <ErrorState type="network" description={error.message} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Icon icon={GitIssueOpened} size="lg" />}
            title={searchQuery.trim() ? 'No results' : 'No open issues'}
            description={searchQuery.trim() ? `No issues matching "${searchQuery}"` : 'All clear across your repositories.'}
          />
        ) : (
          <Box orientation="vertical" spacing={8}>
            <Text variant="caption" color="dim">{filtered.length} issue{filtered.length !== 1 ? 's' : ''}</Text>
            {filtered.map((issue) => (
              <EntityCard
                key={issue.id}
                avatar={<Icon icon={GitIssueOpened} size="md" />}
                title={issue.title}
                subtitle={repoFromUrl(issue.html_url)}
                description={
                  issue.labels.length > 0
                    ? issue.labels.map((l) => (
                        <Chip key={l.id} label={l.name} style={{ marginRight: 4 }} />
                      )) as unknown as string
                    : undefined
                }
                meta={[`#${issue.number}`, relativeTime(issue.updated_at)]}
                interactive
                onClick={() => window.open(issue.html_url, '_blank')}
              />
            ))}
          </Box>
        )}
      </Box>
    </>
  )
}
