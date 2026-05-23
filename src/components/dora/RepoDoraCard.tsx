import { useMemo } from 'react'
import { useGhRepoWorkflowRuns } from '@api-hooks/gh'
import type { GitHubRepository, GitHubWorkflowRun } from 'gh-api-client'
import { DashboardGrid } from '@gnome-ui/layout/components/DashboardGrid'
import { StatusIndicator } from '@gnome-ui/layout/components/StatusIndicator'
import { Box } from '@gnome-ui/react/components/Box'
import { Card } from '@gnome-ui/react/components/Card'
import { Spinner } from '@gnome-ui/react/components/Spinner'
import { Text } from '@gnome-ui/react/components/Text'
import {
  conclusionToStatus,
  computeDeploymentFrequency,
  computeLeadTime,
  computeChangeFailureRate,
  computeMTTR,
} from '../../lib/dora'
import { relativeTime } from '../../lib/formatting'
import { DoraMetricCard } from './DoraMetricCard'

function formatFreq(v: number) {
  if (v >= 1) return `${v.toFixed(1)}/wk`
  return `${(v * 4).toFixed(1)}/mo`
}

function formatHours(v: number) {
  if (v < 1) return `${Math.round(v * 60)}m`
  if (v < 24) return `${v.toFixed(1)}h`
  return `${(v / 24).toFixed(1)}d`
}

function formatPct(v: number) {
  return `${v.toFixed(1)}%`
}

export function RepoDoraCard({ repo }: { repo: GitHubRepository }) {
  const owner = repo.owner.login
  const { data, isLoading } = useGhRepoWorkflowRuns(
    owner,
    repo.name,
    { per_page: 30 },
    { enabled: true },
  )

  const runs: GitHubWorkflowRun[] = useMemo(() => data?.workflow_runs ?? [], [data])
  const lastRun = runs[0]
  const defaultBranch = repo.default_branch ?? 'main'

  const deployFreq = useMemo(() => computeDeploymentFrequency(runs, defaultBranch), [runs, defaultBranch])
  const leadTime = useMemo(() => computeLeadTime(runs), [runs])
  const cfr = useMemo(() => computeChangeFailureRate(runs, defaultBranch), [runs, defaultBranch])
  const mttr = useMemo(() => computeMTTR(runs, defaultBranch), [runs, defaultBranch])

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
      <Box orientation="vertical" spacing={12}>
        <StatusIndicator
          status={conclusionToStatus(lastRun?.conclusion)}
          label={repo.name}
          description={
            lastRun
              ? `${lastRun.name ?? 'Workflow'} · ${relativeTime(lastRun.created_at)}`
              : 'No runs'
          }
        />
        <Text variant="caption" color="dim" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          DORA metrics · last 30 days
        </Text>
        <DashboardGrid columns={{ xs: 2 }} gap="sm">
          <DoraMetricCard label="Deploy freq" metric={deployFreq} format={formatFreq} />
          <DoraMetricCard label="Lead time" metric={leadTime} format={formatHours} />
          <DoraMetricCard label="Failure rate" metric={cfr} format={formatPct} />
          <DoraMetricCard label="MTTR" metric={mttr} format={formatHours} />
        </DashboardGrid>
      </Box>
    </Card>
  )
}
