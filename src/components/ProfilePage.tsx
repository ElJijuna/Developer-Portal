import { useState, useMemo, Suspense } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  DashboardGrid,
  CounterCard,
  EntityCard,
  MasonryGrid,
  EmptyState,
  ErrorState,
} from '@gnome-ui/layout'
import { TabBar, TabItem } from '@gnome-ui/react/components/Tabs'
import { Button } from '@gnome-ui/react/components/Button'
import { Spinner } from '@gnome-ui/react/components/Spinner'
import { Text } from '@gnome-ui/react/components/Text'
import { Box } from '@gnome-ui/react/components/Box'
import { Card } from '@gnome-ui/react/components/Card'
import { Icon } from '@gnome-ui/react/components/Icon'
import { Heart, Person, Star, Document, Share, Information, GitRepository } from '@gnome-ui/icons'
import { ProfileHero } from './ProfileHero'
import { RepositoryCard } from './RepositoryCard'
import {
  useGhUser,
  useGhUserReposInfinite,
  useGhUserPublicEvents,
} from '@api-hooks/gh'
import { relativeTime } from '../lib/formatting'

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
  token?: string
}

export function ProfileContent({ login }: ProfileContentProps) {
  const [activeTab, setActiveTab] = useState<'repos' | 'activity'>('repos')
  const navigate = useNavigate()

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
    { enabled: !!login },
  )

  const { data: eventsData, isLoading: eventsLoading } = useGhUserPublicEvents(
    login,
    { per_page: 30 },
    { enabled: !!login },
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

  return (
    <Box orientation="vertical" spacing={16} style={{ marginTop: 18 }}>
      <ProfileHero
        login={ghUser.login}
        name={ghUser.name}
        avatarUrl={ghUser.avatar_url}
        bio={ghUser.bio}
        location={ghUser.location}
        company={ghUser.company}
        htmlUrl={ghUser.html_url}
      />

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
          icon={GitRepository}
          active={activeTab === 'repos'}
          onClick={() => setActiveTab('repos')}
          count={repos.length}
        />
        <TabItem
          label="Activity"
          icon={Information}
          active={activeTab === 'activity'}
          onClick={() => setActiveTab('activity')}
          count={events.length}
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
                {repos.map((repo) => (
                  <Suspense key={repo.id} fallback={<EntityCard title={repo.name} loading loadingType="skeleton" />}>
                    <RepositoryCard
                      name={repo.name}
                      description={repo.description ?? undefined}
                      language={repo.language ?? undefined}
                      stars={repo.stargazers_count}
                      forks={repo.forks_count}
                      openIssues={repo.open_issues_count}
                      pushedAt={repo.pushed_at ?? repo.updated_at}
                      isPrivate={repo.private}
                      forkedFrom={repo.fork ? repo.full_name : undefined}
                      onClick={() => navigate({ to: '/repositories/$owner/$repo', params: { owner: repo.owner.login, repo: repo.name } })}
                    />
                  </Suspense>
                ))}
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
