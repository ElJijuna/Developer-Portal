import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useGhCurrentUser, useGhUserRepos, useGhRepoWorkflowRuns } from '@api-hooks/gh'
import type { GitHubRepository, GitHubWorkflowRun, WorkflowRunConclusion } from 'gh-api-client'
import { DashboardGrid } from '@gnome-ui/layout/components/DashboardGrid'
import { CounterCard } from '@gnome-ui/layout/components/CounterCard'
import { StatusIndicator } from '@gnome-ui/layout/components/StatusIndicator'
import type { StatusIndicatorStatus } from '@gnome-ui/layout/components/StatusIndicator'
import { EmptyState, ErrorState } from '@gnome-ui/layout'
import { Box } from '@gnome-ui/react/components/Box'
import { Card } from '@gnome-ui/react/components/Card'
import { Text } from '@gnome-ui/react/components/Text'
import { Spinner } from '@gnome-ui/react/components/Spinner'
import { Icon } from '@gnome-ui/react/components/Icon'
import { Button } from '@gnome-ui/react/components/Button'
import { Check, Settings } from '@gnome-ui/icons'
import { GitHub as GitHubIcon } from '@gnome-ui/icons/third-party'
import { PageHeader } from '../../components/PageHeader'
import { useAuth } from '../../auth/AuthProvider'

export const Route = createFileRoute('/_authenticated/cicd')({
  component: CICD,
})

const MAX_REPOS = 15
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

function conclusionToStatus(conclusion: WorkflowRunConclusion): StatusIndicatorStatus {
  if (!conclusion) return 'loading'
  if (conclusion === 'success') return 'online'
  if (conclusion === 'failure' || conclusion === 'timed_out') return 'error'
  if (conclusion === 'cancelled' || conclusion === 'action_required') return 'warning'
  return 'offline'
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) {
    const hrs = Math.floor(diff / 3_600_000)
    return hrs === 0 ? 'just now' : `${hrs}h ago`
  }
  return `${days}d ago`
}

function RepoWorkflowCard({ repo }: { repo: GitHubRepository }) {
  const owner = repo.owner.login
  const { data, isLoading } = useGhRepoWorkflowRuns(
    owner,
    repo.name,
    { per_page: 5 },
    { enabled: true },
  )

  const runs: GitHubWorkflowRun[] = data?.workflow_runs ?? []
  const lastRun = runs[0]

  const recentRuns = runs.filter(
    (r) => Date.now() - new Date(r.created_at).getTime() < SEVEN_DAYS_MS,
  )
  const successRate =
    recentRuns.length > 0
      ? Math.round((recentRuns.filter((r) => r.conclusion === 'success').length / recentRuns.length) * 100)
      : null

  if (isLoading) {
    return (
      <Card padding="md">
        <Box align="center" justify="center" padding={24}><Spinner /></Box>
      </Card>
    )
  }

  if (runs.length === 0) return null

  return (
    <Card padding="md">
      <Box orientation="vertical" spacing={8}>
        <StatusIndicator
          status={conclusionToStatus(lastRun?.conclusion)}
          label={repo.name}
          description={
            lastRun
              ? `${lastRun.name ?? 'Workflow'} · ${relativeTime(lastRun.created_at)}`
              : 'No runs'
          }
        />
        {successRate !== null && (
          <Text variant="caption" color="dim">{successRate}% success rate (last 7d)</Text>
        )}
      </Box>
    </Card>
  )
}

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
                <RepoWorkflowCard repo={repo} />
              </DashboardGrid.Item>
            ))}
          </DashboardGrid>
        )}
      </Box>
    </>
  )
}
