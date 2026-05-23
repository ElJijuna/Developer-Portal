import { useEffect, useMemo } from 'react'
import { useGhRepoWorkflowRuns } from '@api-hooks/gh'
import type { GitHubRepository, GitHubWorkflowRun } from 'gh-api-client'
import { StatusIndicator } from '@gnome-ui/layout/components/StatusIndicator'
import { Box } from '@gnome-ui/react/components/Box'
import { Card } from '@gnome-ui/react/components/Card'
import { Spinner } from '@gnome-ui/react/components/Spinner'
import { Text } from '@gnome-ui/react/components/Text'
import { SparkBarChart } from '@gnome-ui/charts'
import {
  conclusionToStatus,
  computeDeploymentFrequency,
  computeLeadTime,
  computeChangeFailureRate,
  computeMTTR,
} from '../../lib/dora'
import { relativeTime } from '../../lib/formatting'
import { DoraMetricCard } from './DoraMetricCard'
import { PanelCard } from '@gnome-ui/layout'

function formatFreq(v: number) {
  return v >= 1 ? `${v.toFixed(1)}/wk` : `${(v * 4).toFixed(1)}/mo`
}

function formatHours(v: number) {
  if (v < 1) return `${Math.round(v * 60)}m`
  if (v < 24) return `${v.toFixed(1)}h`
  return `${(v / 24).toFixed(1)}d`
}

function formatPct(v: number) {
  return `${v.toFixed(1)}%`
}

export type RepoDoraCardProps = {
  repo: GitHubRepository
  onRunsLoaded?: (runs: GitHubWorkflowRun[]) => void
}

export function RepoDoraCard({ repo, onRunsLoaded }: RepoDoraCardProps) {
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
  const outcomes = useMemo(
    () => runs.map((r) => (r.conclusion === 'success' ? 1 : 0)),
    [runs],
  )

  useEffect(() => {
    if (runs.length > 0) onRunsLoaded?.(runs)
  }, [runs, onRunsLoaded])

  if (isLoading) {
    return (
      <Card padding="md">
        <Box align="center" justify="center" padding={24}><Spinner /></Box>
      </Card>
    )
  }

  if (runs.length === 0) return null

  return (
    <PanelCard icon={<StatusIndicator
      status={conclusionToStatus(lastRun?.conclusion)}
      label=''
    />} title={repo.name} footer={<Text variant="caption" color="dim">Last run {relativeTime(lastRun.created_at)}</Text>}>
      <Box orientation="vertical" spacing={12}>
        <Text variant="caption" color="dim" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          DORA · last 30 days
        </Text>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <DoraMetricCard label="Deploy freq" metric={deployFreq} format={formatFreq} />
          <DoraMetricCard label="Lead time" metric={leadTime} format={formatHours} />
          <DoraMetricCard label="Failure rate" metric={cfr} format={formatPct} />
          <DoraMetricCard label="MTTR" metric={mttr} format={formatHours} />
        </div>
        <SparkBarChart
          data={outcomes}
          height={28}
          color="#26a269"
          aria-label={`Build outcomes for ${repo.name}`}
        />
      </Box>
    </PanelCard>
  )
}
