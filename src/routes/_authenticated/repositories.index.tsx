import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Suspense, useState, useMemo } from 'react'
import { useGhCurrentUser, useGhUserReposInfinite } from '@api-hooks/gh'
import { MasonryGrid, CounterCard, EmptyState, ErrorState } from '@gnome-ui/layout'
import { DashboardGrid } from '@gnome-ui/layout/components/DashboardGrid'
import { Box } from '@gnome-ui/react/components/Box'
import { Text } from '@gnome-ui/react/components/Text'
import { Icon } from '@gnome-ui/react/components/Icon'
import { Button } from '@gnome-ui/react/components/Button'
import { Spinner } from '@gnome-ui/react/components/Spinner'
import { SearchBar } from '@gnome-ui/react/components/SearchBar'
import { IconButton } from '@gnome-ui/react/components/IconButton'
import { ToggleGroup, ToggleGroupItem } from '@gnome-ui/react/components/ToggleGroup'
import { Folder, Search, Settings, Star } from '@gnome-ui/icons'
import { GitHub as GitHubIcon } from '@gnome-ui/icons/third-party'
import { PageHeader } from '../../components/PageHeader'
import { RepositoryCard } from '../../components/RepositoryCard'
import { useAuth } from '../../auth/AuthProvider'

export const Route = createFileRoute('/_authenticated/repositories/')({
  component: Repositories,
})

type SortKey = 'updated' | 'pushed' | 'full_name'

function Repositories() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const token = user?.githubToken ?? ''
  const [sort, setSort] = useState<SortKey>('updated')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const { data: me, isLoading: meLoading } = useGhCurrentUser({ enabled: !!token })
  const login = me?.login ?? ''

  const {
    data,
    isLoading: reposLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGhUserReposInfinite(login, { sort, per_page: 30 }, { enabled: !!login })

  const allRepos = useMemo(() => data?.pages.flatMap((p) => p.values) ?? [], [data])

  const filtered = useMemo(() => {
    const repos = sort === 'full_name'
      ? [...allRepos].sort((a, b) => a.name.localeCompare(b.name))
      : allRepos

    if (!searchQuery.trim()) return repos
    const q = searchQuery.toLowerCase()
    return repos.filter(
      (r) => r.name.toLowerCase().includes(q) || (r.description?.toLowerCase().includes(q) ?? false),
    )
  }, [allRepos, sort, searchQuery])

  const isLoading = meLoading || reposLoading

  if (!token) {
    return (
      <>
        <PageHeader title="Repositories" segments={[{ label: 'Repositories', path: '/repositories' }]} />
        <Box padding={24}>
          <EmptyState
            icon={<Icon icon={GitHubIcon} size="lg" />}
            title="GitHub not connected"
            description="Add your GitHub token in Settings to see your repositories."
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

  const actions = (
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
        title="Repositories"
        segments={[{ label: 'Repositories', path: '/repositories' }]}
        actions={actions}
      />

      <Box orientation="vertical" spacing={12}>
        <DashboardGrid columns={{ xs: 1, sm: 1 }} gap="md">
          <CounterCard label="Repositories" value={allRepos.length} icon={Folder} loading={isLoading} loadingType="skeleton" />
        </DashboardGrid>

        <Box orientation="horizontal" spacing={8} align="center" style={{ flexWrap: 'wrap' }}>
          <ToggleGroup value={sort} onValueChange={(v) => { if (v) setSort(v as SortKey) }}>
            <ToggleGroupItem name="updated" label="Updated" aria-label="Sort by updated" />
            <ToggleGroupItem name="pushed" label="Pushed" aria-label="Sort by pushed" />
            <ToggleGroupItem name="full_name" label="Name" aria-label="Sort by name" />
          </ToggleGroup>
        </Box>

        <SearchBar
          open={searchOpen}
          inline
          placeholder="Search repositories…"
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
            icon={<Icon icon={Star} size="lg" />}
            title={searchQuery.trim() ? 'No results' : 'No repositories'}
            description={searchQuery.trim() ? `No repositories matching "${searchQuery}"` : 'No repositories found.'}
          />
        ) : (
          <Box orientation="vertical" spacing={8}>
            <Text variant="caption" color="dim">{filtered.length} repositor{filtered.length !== 1 ? 'ies' : 'y'}</Text>
            <MasonryGrid columns={{ xs: 1, sm: 2, md: 3 }} gap="md">
              {filtered.map((repo) => (
                <Suspense key={repo.id} fallback={<RepositoryCard name={repo.name} stars={0} forks={0} openIssues={0} pushedAt={repo.updated_at} isPrivate={repo.private} isLoading />}>
                  <RepositoryCard
                    name={repo.name}
                    description={repo.description ?? undefined}
                    language={repo.language ?? undefined}
                    stars={repo.stargazers_count}
                    forks={repo.forks_count}
                    openIssues={repo.open_issues_count}
                    pushedAt={repo.pushed_at ?? repo.updated_at}
                    isPrivate={repo.private}
                    onClick={() => navigate({ to: '/repositories/$owner/$repo', params: { owner: repo.owner.login, repo: repo.name } })}
                  />
                </Suspense>
              ))}
            </MasonryGrid>

            {hasNextPage && (
              <Box align="center" padding={8}>
                <Button
                  variant="flat"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? <Spinner /> : 'Load more'}
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </>
  )
}
