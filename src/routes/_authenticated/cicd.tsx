import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useGhCurrentUser, useGhUserRepos } from '@api-hooks/gh'
import { DashboardGrid } from '@gnome-ui/layout/components/DashboardGrid'
import { CounterCard } from '@gnome-ui/layout/components/CounterCard'
import { EmptyState, ErrorState } from '@gnome-ui/layout'
import { Box } from '@gnome-ui/react/components/Box'
import { Icon } from '@gnome-ui/react/components/Icon'
import { Button } from '@gnome-ui/react/components/Button'
import { Spinner } from '@gnome-ui/react/components/Spinner'
import { Check, Settings } from '@gnome-ui/icons'
import { GitHub as GitHubIcon } from '@gnome-ui/icons/third-party'
import { PageHeader } from '../../components/PageHeader'
import { RepoDoraCard } from '../../components/dora/RepoDoraCard'
import { useAuth } from '../../auth/AuthProvider'

export const Route = createFileRoute('/_authenticated/cicd')({
  component: CICD,
})

const MAX_REPOS = 15

function CICD() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const token = user?.githubToken ?? ''

  const { data: me, isLoading: meLoading } = useGhCurrentUser({ enabled: !!token })
  const login = me?.login ?? ''

  const { data: reposData, isLoading: reposLoading, error } = useGhUserRepos(
    login,
    { per_page: 100, sort: 'pushed' },
    { enabled: !!login },
  )

  const topRepos = (reposData?.values ?? []).slice(0, MAX_REPOS)
  const isLoading = meLoading || reposLoading

  if (!token) {
    return (
      <>
        <PageHeader title="CI/CD" segments={[{ label: 'CI/CD', path: '/cicd' }]} />
        <Box padding={24}>
          <EmptyState
            icon={<Icon icon={GitHubIcon} size="lg" />}
            title="GitHub not connected"
            description="Add your GitHub token in Settings to see your CI/CD status."
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
      <PageHeader title="CI/CD" segments={[{ label: 'CI/CD', path: '/cicd' }]} />

      <Box orientation="vertical" spacing={12}>
        <DashboardGrid columns={{ xs: 1, sm: 3 }} gap="md">
          <CounterCard
            label="Repos monitored"
            value={topRepos.length}
            icon={Check}
            loading={isLoading}
            loadingType="skeleton"
          />
          <CounterCard
            label="With CI"
            value={topRepos.length}
            icon={Check}
            loading={isLoading}
            loadingType="skeleton"
            color="#26a269"
          />
        </DashboardGrid>

        {isLoading ? (
          <Box align="center" justify="center" padding={48}><Spinner /></Box>
        ) : error ? (
          <ErrorState type="network" description={error.message} />
        ) : topRepos.length === 0 ? (
          <EmptyState
            icon={<Icon icon={Check} size="lg" />}
            title="No repositories"
            description="No recently pushed repositories found."
          />
        ) : (
          <DashboardGrid columns={{ xs: 1, sm: 2, md: 3 }} gap="md">
            {topRepos.map((repo) => (
              <DashboardGrid.Item key={repo.id}>
                <RepoDoraCard repo={repo} />
              </DashboardGrid.Item>
            ))}
          </DashboardGrid>
        )}
      </Box>
    </>
  )
}
