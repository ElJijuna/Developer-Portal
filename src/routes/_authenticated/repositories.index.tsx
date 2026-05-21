import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { useGhCurrentUser, useGhUserReposInfinite } from '@api-hooks/gh'
import type { GitHubRepository } from 'gh-api-client'
import { MasonryGrid, CounterCard, EmptyState, ErrorState } from '@gnome-ui/layout'
import { DashboardGrid } from '@gnome-ui/layout/components/DashboardGrid'
import { Box } from '@gnome-ui/react/components/Box'
import { Text } from '@gnome-ui/react/components/Text'
import { Card } from '@gnome-ui/react/components/Card'
import { Icon } from '@gnome-ui/react/components/Icon'
import { Button } from '@gnome-ui/react/components/Button'
import { Spinner } from '@gnome-ui/react/components/Spinner'
import { SearchBar } from '@gnome-ui/react/components/SearchBar'
import { IconButton } from '@gnome-ui/react/components/IconButton'
import { ToggleGroup, ToggleGroupItem } from '@gnome-ui/react/components/ToggleGroup'
import { Chip } from '@gnome-ui/react/components/Chip'
import { Folder, Search, Settings, Star } from '@gnome-ui/icons'
import { GitHub as GitHubIcon } from '@gnome-ui/icons/third-party'
import { PageHeader } from '../../components/PageHeader'
import { useAuth } from '../../auth/AuthProvider'

export const Route = createFileRoute('/_authenticated/repositories/')({
  component: Repositories,
})

type SortKey = 'updated' | 'pushed' | 'full_name'

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f7df1e',
  Python: '#3572a5',
  Rust: '#dea584',
  Go: '#00add8',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  Ruby: '#701516',
  Swift: '#fa7343',
  Kotlin: '#a97bff',
  Dart: '#00b4ab',
  PHP: '#4f5d95',
  Shell: '#89e051',
  HTML: '#e34c26',
  CSS: '#563d7c',
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

function LanguageBadge({ language }: { language: string }) {
  const color = LANGUAGE_COLORS[language] ?? '#77767b'
  return (
    <Box orientation="horizontal" spacing={4} align="center">
      <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
      <Text variant="caption" color="dim">{language}</Text>
    </Box>
  )
}

function RepoCard({ repo, onClick }: { repo: GitHubRepository; onClick: () => void }) {
  const isForked = repo.fork
  const visibility = isForked ? 'fork' : repo.private ? 'private' : 'public'

  return (
    <Card padding="md" interactive onClick={onClick} style={{ cursor: 'pointer', height: '100%' }}>
      <Box orientation="vertical" spacing={8}>
        <Box orientation="horizontal" justify="space-between" align="center">
          <Text variant="heading" style={{ fontWeight: 600, wordBreak: 'break-word' }}>{repo.name}</Text>
          <Chip label={visibility} style={{ flexShrink: 0, marginLeft: 8 }} />
        </Box>

        {repo.description && (
          <Text variant="caption" color="dim" style={{ lineHeight: 1.4 }}>{repo.description}</Text>
        )}

        <Box orientation="horizontal" spacing={12} align="center" style={{ flexWrap: 'wrap', gap: 8 }}>
          {repo.language && <LanguageBadge language={repo.language} />}
          <Text variant="caption" color="dim">★ {repo.stargazers_count.toLocaleString()}</Text>
          <Text variant="caption" color="dim">⑂ {repo.forks_count.toLocaleString()}</Text>
        </Box>

        <Text variant="caption" color="dim">Updated {relativeTime(repo.pushed_at ?? repo.updated_at)}</Text>
      </Box>
    </Card>
  )
}

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
                <RepoCard
                  key={repo.id}
                  repo={repo}
                  onClick={() => navigate({ to: '/repositories/$owner/$repo', params: { owner: repo.owner.login, repo: repo.name } })}
                />
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
