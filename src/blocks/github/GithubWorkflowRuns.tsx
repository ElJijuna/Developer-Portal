import { useMemo } from 'react'
import { useGhRepoWorkflowRuns, useGhRepoWorkflowRunsInfinite } from '@api-hooks/gh'
import { ErrorState } from '@gnome-ui/layout'
import type { GitHubWorkflowRun, GitHubWorkflowRunsResponse, WorkflowRunsParams } from 'gh-api-client'
import { RepoWorkflowsTab } from '../../components/repo/RepoWorkflowsTab'
import type { GithubBlockBaseProps, GithubListChildren } from './types'
import { DEFAULT_LIMIT, workflowRunsState } from './utils'

export type GithubWorkflowRunsProps = GithubBlockBaseProps &
  GithubListChildren<GitHubWorkflowRun> & {
    owner: string
    repo: string
    limit?: WorkflowRunsParams['per_page']
    page?: WorkflowRunsParams['page']
    branch?: WorkflowRunsParams['branch']
    event?: WorkflowRunsParams['event']
    status?: WorkflowRunsParams['status']
    created?: WorkflowRunsParams['created']
    actor?: WorkflowRunsParams['actor']
  }

export function GithubWorkflowRuns({
  owner,
  repo,
  enabled = true,
  variant = 'page',
  limit = DEFAULT_LIMIT,
  page,
  branch,
  event,
  status,
  created,
  actor,
  children,
}: GithubWorkflowRunsProps) {
  const baseParams = { per_page: limit, branch, event, status, created, actor }
  const pageResult = useGhRepoWorkflowRuns(owner, repo, { ...baseParams, page }, { enabled: enabled && variant === 'page' })
  const infinityResult = useGhRepoWorkflowRunsInfinite(owner, repo, baseParams, { enabled: enabled && variant === 'infinity' })
  const state = workflowRunsState<GitHubWorkflowRunsResponse, GitHubWorkflowRun>(variant, pageResult, infinityResult)
  const chartData = useMemo(() => getWorkflowChartData(state.items), [state.items])

  if (children) return children(state)
  if (state.error) return <ErrorState type="network" description={state.error.message} />

  return <RepoWorkflowsTab runs={state.items} isLoading={state.isPending} chartData={chartData} />
}

function getWorkflowChartData(runs: GitHubWorkflowRun[]) {
  const chronological = [...runs].reverse()
  const completed = chronological.filter((run) => run.run_started_at && run.conclusion !== null)
  const durations = completed.map((run) =>
    Math.max(1, Math.round((new Date(run.updated_at).getTime() - new Date(run.run_started_at!).getTime()) / 1000)),
  )
  const outcomes = chronological.map((run) => (run.conclusion === 'success' ? 1 : 0))
  const finishedRuns = runs.filter((run) => run.conclusion !== null)
  const successRate = finishedRuns.length > 0
    ? finishedRuns.filter((run) => run.conclusion === 'success').length / finishedRuns.length
    : 0
  const avgDuration = durations.length > 0
    ? durations.reduce((total, duration) => total + duration, 0) / durations.length
    : 0

  return { durations, outcomes, successRate, avgDuration }
}
