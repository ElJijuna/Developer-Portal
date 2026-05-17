import { useState, useMemo } from 'react'
import {
  DashboardGrid,
  CounterCard,
  EntityCard,
  MasonryGrid,
  EmptyState,
  ErrorState,
} from '@gnome-ui/layout'
import { TabBar, TabItem } from '@gnome-ui/react/components/Tabs'
import { Avatar } from '@gnome-ui/react/components/Avatar'
import { Button } from '@gnome-ui/react/components/Button'
import { Spinner } from '@gnome-ui/react/components/Spinner'
import { Text } from '@gnome-ui/react/components/Text'
import { Box } from '@gnome-ui/react/components/Box'
import { Card } from '@gnome-ui/react/components/Card'
import { Chip } from '@gnome-ui/react/components/Chip'
import { Icon } from '@gnome-ui/react/components/Icon'
import { WrapBox } from '@gnome-ui/react/components/WrapBox'
import { Heart, Person, Star, Document, Share, Information } from '@gnome-ui/icons'
import { GitHub } from '@gnome-ui/icons/third-party'
import {
  useGhUser,
  useGhUserReposInfinite,
  useGhUserPublicEvents,
} from '@api-hooks/gh'

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
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

function eventDescription(type: string, repoName: string): string {
  switch (type) {
    case 'PushEvent': return `Pushed to ${repoName}`
    case 'PullRequestEvent': return `Pull request in ${repoName}`
    case 'IssueCommentEvent': return `Commented on issue in ${repoName}`
    case 'IssuesEvent': return `Issue in ${repoName}`
    case 'CreateEvent': return `Created branch/tag in ${repoName}`
    case 'DeleteEvent': return `Deleted branch in ${repoName}`
    case 'WatchEvent': return `Starred ${repoName}`
    case 'ForkEvent': return `Forked ${repoName}`
    case 'ReleaseEvent': return `Released in ${repoName}`
    case 'PullRequestReviewEvent': return `Reviewed PR in ${repoName}`
    default: return `Activity in ${repoName}`
  }
}

interface ProfileContentProps {
  login: string
  token: string
}

export function ProfileContent({ login, token }: ProfileContentProps) {
  const [activeTab, setActiveTab] = useState<'repos' | 'activity'>('repos')

  const { data: ghUser, isLoading: userLoading, error: userError } = useGhUser(login, {
    enabled: !!login,
  })

  const {
    data: reposData,
    isLoading: reposLoading,
    isFetchingNextPage: reposFetchingNext,
    fetchNextPage: fetchMoreRepos,
    hasNextPage: hasMoreRepos,
    error: reposError,
  } = useGhUserReposInfinite(
    login,
    { sort: 'updated', per_page: 30 },
    { token: token || undefined, enabled: !!login },
  )

  const { data: eventsData, isLoading: eventsLoading } = useGhUserPublicEvents(
    login,
    { per_page: 30 },
    { token: token || undefined, enabled: !!login },
  )

  const repos = useMemo(() => reposData?.pages.flatMap((p) => p.values) ?? [], [reposData])
  const events = useMemo(() => eventsData?.values ?? [], [eventsData])

  if (userLoading) {
    return (
      <Box align="center" justify="center" padding={48}>
        <Spinner />
      </Box>
    )
  }

  if (userError) {
    return <ErrorState type="network" description={userError.message} />
  }

  if (!ghUser) {
    return (
      <EmptyState
        icon={<Icon icon={Person} size="lg" />}
        title="User not found"
        description={`No GitHub user found for "${login}".`}
      />
    )
  }

  const metaChips = [
    ghUser.location ? { label: ghUser.location } : null,
    ghUser.company ? { label: ghUser.company.replace(/^@/, '') } : null,
  ].filter(Boolean) as { label: string }[]

  return (
    <Box orientation="vertical" spacing={16}>
      {/* Hero */}
      <Card padding="lg">
        <Box orientation="vertical" spacing={16}>
          <Box spacing={16} align="start">
            <Avatar src={ghUser.avatar_url} name={ghUser.login} size="xl" />
            <Box orientation="vertical" spacing={4} style={{ flex: 1 }}>
              <Text variant="title-2">
                {ghUser.name || ghUser.login}
              </Text>
              <Text color="dim">@{ghUser.login}</Text>
              {ghUser.bio && (
                <Text style={{ marginTop: 4 }}>{ghUser.bio}</Text>
              )}
              {metaChips.length > 0 && (
                <WrapBox style={{ marginTop: 8 }}>
                  {metaChips.map((chip) => (
                    <Chip key={chip.label} label={chip.label} />
                  ))}
                </WrapBox>
              )}
            </Box>
            <Button
              variant="flat"
              leadingIcon={<Icon icon={GitHub} />}
              onClick={() => window.open(ghUser.html_url, '_blank', 'noopener,noreferrer')}
            >
              View on GitHub
            </Button>
          </Box>
        </Box>
      </Card>

      {/* Stats */}
      <DashboardGrid columns={{ xs: 2, sm: 4 }} gap="md">
        <CounterCard
          label="Followers"
          value={ghUser.followers ?? 0}
          icon={Heart}
          color="#e01b24"
        />
        <CounterCard
          label="Following"
          value={ghUser.following ?? 0}
          icon={Person}
          color="#3584e4"
        />
        <CounterCard
          label="Repositories"
          value={ghUser.public_repos ?? 0}
          icon={Document}
          color="#9141ac"
        />
        <CounterCard
          label="Gists"
          value={ghUser.public_gists ?? 0}
          icon={Star}
          color="#e5a50a"
        />
      </DashboardGrid>

      {/* Tabs */}
      <TabBar aria-label="Profile tabs" inline>
        <TabItem
          label="Repositories"
          icon={Document}
          active={activeTab === 'repos'}
          onClick={() => setActiveTab('repos')}
        />
        <TabItem
          label="Activity"
          icon={Information}
          active={activeTab === 'activity'}
          onClick={() => setActiveTab('activity')}
        />
      </TabBar>

      {/* Repos tab */}
      {activeTab === 'repos' && (
        <>
          {reposLoading ? (
            <Box align="center" justify="center" padding={48}>
              <Spinner />
            </Box>
          ) : reposError ? (
            <ErrorState type="network" description={reposError.message} />
          ) : repos.length === 0 ? (
            <EmptyState
              icon={<Icon icon={Document} size="lg" />}
              title="No repositories"
              description={`${ghUser.name || ghUser.login} has no public repositories yet.`}
            />
          ) : (
            <Box orientation="vertical" spacing={12}>
              <Text variant="caption" color="dim">
                {repos.length} repositor{repos.length !== 1 ? 'ies' : 'y'}
              </Text>
              <MasonryGrid columns={{ xs: 1, sm: 2, md: 3 }} gap="md" fresh>
                {repos.map((repo) => {
                  const langColor = repo.language ? LANGUAGE_COLORS[repo.language] : undefined
                  const meta: (string | undefined)[] = []
                  if (repo.language) meta.push(repo.language)
                  meta.push(`★ ${repo.stargazers_count}`)
                  meta.push(`⑂ ${repo.forks_count}`)
                  if (repo.updated_at) meta.push(`Updated ${relativeTime(repo.updated_at)}`)

                  return (
                    <EntityCard
                      key={repo.id}
                      avatar={
                        langColor ? (
                          <span
                            style={{
                              display: 'inline-block',
                              width: 16,
                              height: 16,
                              borderRadius: '50%',
                              background: langColor,
                              flexShrink: 0,
                              marginTop: 4,
                            }}
                          />
                        ) : undefined
                      }
                      title={repo.name}
                      subtitle={repo.fork ? `forked from ${repo.full_name}` : undefined}
                      description={repo.description ?? undefined}
                      meta={meta}
                      interactive
                      onClick={() => window.open(repo.html_url, '_blank', 'noopener,noreferrer')}
                    />
                  )
                })}
              </MasonryGrid>

              {hasMoreRepos && (
                <Box align="center" padding={12}>
                  <Button
                    variant="flat"
                    onClick={() => fetchMoreRepos()}
                    disabled={reposFetchingNext}
                    leadingIcon={reposFetchingNext ? <Spinner /> : undefined}
                  >
                    {reposFetchingNext ? 'Loading…' : 'Load more'}
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </>
      )}

      {/* Activity tab */}
      {activeTab === 'activity' && (
        <>
          {eventsLoading ? (
            <Box align="center" justify="center" padding={48}>
              <Spinner />
            </Box>
          ) : events.length === 0 ? (
            <EmptyState
              icon={<Icon icon={Share} size="lg" />}
              title="No recent activity"
              description={`${ghUser.name || ghUser.login} has no public activity.`}
            />
          ) : (
            <Box orientation="vertical" spacing={8}>
              {events.map((event) => (
                <Card key={event.id} padding="sm">
                  <Box spacing={12} align="center">
                    <Icon icon={Information} />
                    <Box orientation="vertical" spacing={2} style={{ flex: 1 }}>
                      <Text>{eventDescription(event.type, event.repo.name)}</Text>
                      {event.created_at && (
                        <Text variant="caption" color="dim">
                          {relativeTime(event.created_at)}
                        </Text>
                      )}
                    </Box>
                  </Box>
                </Card>
              ))}
            </Box>
          )}
        </>
      )}
    </Box>
  )
}
