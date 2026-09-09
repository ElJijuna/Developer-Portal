import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/auth/AuthProvider'
import { useGhCurrentUser, useGhUserRepos, useGhUserContributionMap } from '@api-hooks/gh'
import { DashboardGrid } from '@gnome-ui/layout/components/DashboardGrid'
import { CounterCard, type CounterCardProps } from '@gnome-ui/layout/components/CounterCard'
import { ContributionGraph } from '@gnome-ui/react/components/ContributionGraph'
import { Box } from '@gnome-ui/react/components/Box'
import { Skeleton } from '@gnome-ui/react/components/Skeleton'
import { GitRepository, Person, Heart, Star } from '@gnome-ui/icons'
import { SparkAreaChart } from '@gnome-ui/charts'
import { Icon, Separator, Carousel } from '@gnome-ui/react'
import { IconBadge, PanelCard } from '@gnome-ui/layout'
import { useBreakpoint } from '@gnome-ui/hooks/useBreakpoint'
import { RepositoryCard } from '@/components/RepositoryCard'
import { PageHeader } from '@/components/PageHeader'
import { GoaPanel } from '@gnome-ui/icons';

export const Route = createFileRoute('/_authenticated/')({
  component: Dashboard,
})

function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { isMobile } = useBreakpoint()
  const token = user?.githubToken ?? ''

  const { data: ghUser } = useGhCurrentUser({ enabled: !!token })
  const login = ghUser?.login ?? ''

  const { data: repos } = useGhUserRepos(
    login,
    { per_page: 100, sort: 'pushed' },
    { enabled: !!login },
  )

  const { data: contributionData, isLoading: contribLoading } = useGhUserContributionMap(
    login,
    {},
    { enabled: !!login && !!token },
  )

  const totalStars = repos?.values.reduce((s, r) => s + r.stargazers_count, 0) ?? 0
  const topRepos = [...(repos?.values ?? [])]
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 6)
  const contributionDays = contributionData?.weeks.flatMap((w) =>
    w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount })),
  ) ?? []

  const statCards: (CounterCardProps & { key: string })[] = [
    { key: 'repos', label: 'Repositorios', value: ghUser?.public_repos ?? 0, icon: GitRepository, accent: true, animated: true },
    { key: 'followers', label: 'Seguidores', value: ghUser?.followers ?? 0, icon: Person, color: '#3584e4', animated: true },
    { key: 'following', label: 'Siguiendo', value: ghUser?.following ?? 0, icon: Heart, color: '#e01b24', animated: true },
    { key: 'stars', label: 'Stars recibidas', value: totalStars, icon: Star, color: '#e5a50a', animated: true },
  ]

  return (
    <>
      <PageHeader title="Dashboard" segments={[{ label: 'Dashboard', path: '/' }]} />
      <DashboardGrid columns={{ sm: 1, md: 2, lg: 4 }} gap="md">
        {isMobile ? (
          <DashboardGrid.Item>
            <Carousel label="Estadísticas" indicator="dots" peek={24} spacing={18} infinite autoPlay autoPlayControl={false}>
              {statCards.map(({ key, ...card }) => (
                <CounterCard key={key} {...card} />
              ))}
            </Carousel>
          </DashboardGrid.Item>
        ) : (
          statCards.map(({ key, ...card }) => (
            <DashboardGrid.Item key={key}>
              <CounterCard {...card} />
            </DashboardGrid.Item>
          ))
        )}

        <DashboardGrid.Item span={{ sm: 1, md: 2, lg: 4 }}>
          <PanelCard title="Contributions" icon={<IconBadge><Icon icon={GoaPanel} /></IconBadge>}>
            <Box orientation="vertical" spacing={24}>
              <Box justify="space-between" align="center">
                {!contribLoading && contributionDays.length > 0 && (
                  <SparkAreaChart
                    data={contributionDays.slice(-84).map((d) => d.count)}
                    height={32}
                    aria-label="Trend de contribuciones"
                    gradient
                  />
                )}
              </Box>
              <Separator />
              {contribLoading ? (
                <Skeleton height={130} />
              ) : (
                <ContributionGraph
                  cellSize={20}
                  data={contributionDays}
                  weekStartDay={1}
                  tooltipContent={(day) => `${day.count} contribuciones el ${day.date}`}
                />
              )}
            </Box>
          </PanelCard>
        </DashboardGrid.Item>

        {topRepos.map((repo) => (
          <DashboardGrid.Item key={repo.id} span={{ sm: 1, md: 2 }}>
            <RepositoryCard
              name={repo.name}
              description={repo.description ?? ''}
              language={repo.language ?? ''}
              stars={repo.stargazers_count}
              forks={repo.forks_count}
              openIssues={repo.open_issues_count}
              pushedAt={repo.pushed_at ?? repo.updated_at}
              isPrivate={repo.private}
              isLoading={false}
              onClick={() => navigate({ to: '/repositories/$owner/$repo', params: { owner: repo.owner.login, repo: repo.name } })}
            />
          </DashboardGrid.Item>
        ))}
      </DashboardGrid>
    </>
  )
}
