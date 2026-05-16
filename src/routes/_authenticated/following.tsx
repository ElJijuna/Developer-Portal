import { createFileRoute } from '@tanstack/react-router'
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
import { SearchBar } from '@gnome-ui/react/components/SearchBar'
import { Button } from '@gnome-ui/react/components/Button'
import { Spinner } from '@gnome-ui/react/components/Spinner'
import { Text } from '@gnome-ui/react/components/Text'
import { Box } from '@gnome-ui/react/components/Box'
import { Icon } from '@gnome-ui/react/components/Icon'
import { IconButton } from '@gnome-ui/react/components/IconButton'
import { Heart, Person, Search, Settings } from '@gnome-ui/icons'
import { GitHub } from '@gnome-ui/icons/third-party'
import {
  useGhCurrentUser,
  useGhUserFollowersInfinite,
  useGhUserFollowingInfinite,
} from '@api-hooks/gh'
import { useAuth } from '../../auth/AuthProvider'
import { PageHeader } from '../../components/PageHeader'

export const Route = createFileRoute('/_authenticated/following')({
  component: Following,
})

type TabType = 'followers' | 'following'

function Following() {
  const { user } = useAuth()
  const token = user?.githubToken || ''
  const [activeTab, setActiveTab] = useState<TabType>('followers')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)

  const { data: currentUser, isLoading: profileLoading } = useGhCurrentUser({
    token,
    enabled: !!token,
  })

  const login = currentUser?.login ?? ''

  const {
    data: followersData,
    isLoading: followersLoading,
    isFetchingNextPage: followersFetchingNext,
    fetchNextPage: fetchMoreFollowers,
    hasNextPage: hasMoreFollowers,
    error: followersError,
  } = useGhUserFollowersInfinite(
    login,
    { per_page: 30 },
    { token: token || undefined, enabled: !!login },
  )

  const {
    data: followingData,
    isLoading: followingLoading,
    isFetchingNextPage: followingFetchingNext,
    fetchNextPage: fetchMoreFollowing,
    hasNextPage: hasMoreFollowing,
    error: followingError,
  } = useGhUserFollowingInfinite(
    login,
    { per_page: 30 },
    { token: token || undefined, enabled: !!login },
  )

  const followers = useMemo(
    () => followersData?.pages.flatMap((p) => p.values) ?? [],
    [followersData],
  )
  const following = useMemo(
    () => followingData?.pages.flatMap((p) => p.values) ?? [],
    [followingData],
  )

  const isFollowers = activeTab === 'followers'
  const activeUsers = isFollowers ? followers : following
  const isLoading = profileLoading || (isFollowers ? followersLoading : followingLoading)
  const isFetchingNext = isFollowers ? followersFetchingNext : followingFetchingNext
  const hasMore = isFollowers ? hasMoreFollowers : hasMoreFollowing
  const fetchMore = isFollowers ? fetchMoreFollowers : fetchMoreFollowing
  const error = isFollowers ? followersError : followingError

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return activeUsers
    const q = searchQuery.toLowerCase()
    return activeUsers.filter(
      (u) => u.login.toLowerCase().includes(q) || u.name?.toLowerCase().includes(q),
    )
  }, [activeUsers, searchQuery])

  const searchAction = (
    <IconButton
      icon={Search}
      label="Search"
      variant="flat"
      onClick={() => setSearchOpen((v) => !v)}
    />
  )

  if (!token) {
    return (
      <>
        <PageHeader
          title="Following"
          segments={[{ label: 'Following', path: '/following' }]}
        />
        <Box padding={24}>
          <EmptyState
            icon={<Icon icon={GitHub} size="lg" />}
            title="GitHub not connected"
            description="Sign in with GitHub or add your GitHub token in Settings to view your followers and following."
            action={
              <Button variant="suggested" leadingIcon={<Icon icon={Settings} />}>
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
        title="Following"
        segments={[{ label: 'Following', path: '/following' }]}
        actions={searchAction}
      />

      <Box orientation="vertical" spacing={12}>
        <DashboardGrid columns={{ xs: 1, sm: 2 }} gap="md">
          <CounterCard
            label="Followers"
            value={currentUser?.followers ?? 0}
            icon={Heart}
            loading={profileLoading}
            color="#e01b24"
          />
          <CounterCard
            label="Following"
            value={currentUser?.following ?? 0}
            icon={Person}
            loading={profileLoading}
            color="#3584e4"
          />
        </DashboardGrid>

        <SearchBar
          open={searchOpen}
          inline
          placeholder="Search by name or username…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClose={() => {
            setSearchOpen(false)
            setSearchQuery('')
          }}
          onClear={() => setSearchQuery('')}
        />

        <TabBar aria-label="Network tabs" inline>
          <TabItem
            label={`Followers${currentUser?.followers != null ? ` · ${currentUser.followers}` : ''}`}
            icon={Heart}
            active={activeTab === 'followers'}
            onClick={() => setActiveTab('followers')}
          />
          <TabItem
            label={`Following${currentUser?.following != null ? ` · ${currentUser.following}` : ''}`}
            icon={Person}
            active={activeTab === 'following'}
            onClick={() => setActiveTab('following')}
          />
        </TabBar>

        {isLoading ? (
          <Box align="center" justify="center" padding={48}>
            <Spinner />
          </Box>
        ) : error ? (
          <ErrorState
            type="network"
            description={error.message}
          />
        ) : filteredUsers.length === 0 ? (
          <EmptyState
            icon={<Icon icon={Person} size="lg" />}
            title={
              searchQuery.trim()
                ? 'No results found'
                : isFollowers
                  ? 'No followers yet'
                  : 'Not following anyone yet'
            }
            description={
              searchQuery.trim()
                ? `No users matching "${searchQuery}"`
                : isFollowers
                  ? 'Share your profile to gain followers.'
                  : 'Find interesting developers to follow on GitHub.'
            }
          />
        ) : (
          <Box orientation="vertical" spacing={12}>
            <Text variant="caption" color="dim">
              {filteredUsers.length}{' '}
              {searchQuery.trim() ? 'result' : isFollowers ? 'follower' : 'following'}
              {filteredUsers.length !== 1 ? 's' : ''}
            </Text>

            <MasonryGrid columns={{ xs: 1, sm: 2, md: 3 }} gap="md" fresh>
              {filteredUsers.map((ghUser) => (
                <EntityCard
                  key={ghUser.id}
                  avatar={
                    <Avatar
                      src={ghUser.avatar_url}
                      name={ghUser.login}
                      size="lg"
                    />
                  }
                  title={ghUser.name || ghUser.login}
                  subtitle={`@${ghUser.login}`}
                  description={ghUser.bio ?? undefined}
                  meta={[ghUser.location ?? undefined]}
                  interactive
                  onClick={() =>
                    window.open(ghUser.html_url, '_blank', 'noopener,noreferrer')
                  }
                />
              ))}
            </MasonryGrid>

            {hasMore && (
              <Box align="center" padding={12}>
                <Button
                  variant="flat"
                  onClick={() => fetchMore()}
                  disabled={isFetchingNext}
                  leadingIcon={isFetchingNext ? <Spinner /> : undefined}
                >
                  {isFetchingNext ? 'Loading…' : 'Load more'}
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </>
  )
}
