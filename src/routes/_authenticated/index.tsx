import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useAuth } from '../../auth/AuthProvider'
import { useGhCurrentUser, useGhUserRepos, useGhUserContributionMap } from '@api-hooks/gh'
import { DashboardGrid } from '@gnome-ui/layout/components/DashboardGrid'
import { CounterCard } from '@gnome-ui/layout/components/CounterCard'
import { ContributionGraph } from '@gnome-ui/react/components/ContributionGraph'
import { Card } from '@gnome-ui/react/components/Card'
import { Box } from '@gnome-ui/react/components/Box'
import { Text } from '@gnome-ui/react/components/Text'
import { WrapBox } from '@gnome-ui/react/components/WrapBox'
import { StatusPage } from '@gnome-ui/react/components/StatusPage'
import { Skeleton } from '@gnome-ui/react/components/Skeleton'
import { Button } from '@gnome-ui/react/components/Button'
import { GitRepository, Person, Heart, Star, GitHub } from '@gnome-ui/icons'
import { SparkAreaChart } from '@gnome-ui/charts'
import { Separator } from '@gnome-ui/react'
import { PanelCard } from '@gnome-ui/layout'

export const Route = createFileRoute('/_authenticated/')({
  component: Dashboard,
})

function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
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

  if (!token) {
    return (
      <StatusPage
        icon={GitHub}
        title="Configura tu token"
        description="Añade un token de GitHub en Settings para ver tus estadísticas."
      >
        <Button variant="suggested" onClick={() => navigate({ to: '/settings' })}>
          Ir a Settings
        </Button>
      </StatusPage>
    )
  }

  const totalStars = repos?.values.reduce((s, r) => s + r.stargazers_count, 0) ?? 0
  const topRepos = [...(repos?.values ?? [])]
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 6)
  const contributionDays = contributionData?.weeks.flatMap((w) =>
    w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount })),
  ) ?? []

  return (
    <DashboardGrid columns={{ sm: 1, md: 2, lg: 4 }} gap="md">
      <DashboardGrid.Item>
        <CounterCard
          label="Repositorios"
          value={ghUser?.public_repos ?? 0}
          icon={GitRepository}
          accent
          animated
        />
      </DashboardGrid.Item>
      <DashboardGrid.Item>
        <CounterCard
          label="Seguidores"
          value={ghUser?.followers ?? 0}
          icon={Person}
          color="#3584e4"
          animated
        />
      </DashboardGrid.Item>
      <DashboardGrid.Item>
        <CounterCard
          label="Siguiendo"
          value={ghUser?.following ?? 0}
          icon={Heart}
          color="#e01b24"
          animated
        />
      </DashboardGrid.Item>
      <DashboardGrid.Item>
        <CounterCard
          label="Stars recibidas"
          value={totalStars}
          icon={Star}
          color="#e5a50a"
          animated
        />
      </DashboardGrid.Item>

      <DashboardGrid.Item span={4}>
        <PanelCard title="Contributions">
          <Box orientation="vertical" spacing={24}>
            <Box justify="space-between" align="center">
              {!contribLoading && contributionDays.length > 0 && (
                <SparkAreaChart
                  data={contributionDays.slice(-84).map((d) => d.count)}
                  height={32}
                  aria-label="Trend de contribuciones"
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
        <DashboardGrid.Item key={repo.id} span={2}>
          <a href={repo.html_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block' }}>
            <Card padding="md" interactive>
              <Box orientation="vertical" spacing={6}>
                <Text variant="heading">{repo.name}</Text>
                {repo.description && (
                  <Text color="dim" variant="body">{repo.description}</Text>
                )}
                <WrapBox childSpacing={8}>
                  {repo.language && (
                    <Text variant="caption" color="dim">{repo.language}</Text>
                  )}
                  <Text variant="caption" color="dim">⭐ {repo.stargazers_count}</Text>
                </WrapBox>
              </Box>
            </Card>
          </a>
        </DashboardGrid.Item>
      ))}
    </DashboardGrid>
  )
}
