import type { GitHubWorkflowRun, WorkflowRunConclusion } from 'gh-api-client'
import type { StatusIndicatorStatus } from '@gnome-ui/layout/components/StatusIndicator'

export type DoraLevel = 'elite' | 'high' | 'medium' | 'low'

export type DoraMetric = {
  value: number | null
  level: DoraLevel | null
  label: string
}

export const DORA_LEVEL_COLOR: Record<DoraLevel, string> = {
  elite: '#26a269',
  high: '#3584e4',
  medium: '#e5a50a',
  low: '#e01b24',
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000
const HOUR_MS = 60 * 60 * 1000

function freqLevel(perWeek: number): DoraLevel {
  if (perWeek >= 7) return 'elite'
  if (perWeek >= 1) return 'high'
  if (perWeek >= 0.25) return 'medium'
  return 'low'
}

function hoursLevel(hours: number): DoraLevel {
  if (hours < 1) return 'elite'
  if (hours < 24) return 'high'
  if (hours < 168) return 'medium'
  return 'low'
}

function cfrLevel(pct: number): DoraLevel {
  if (pct < 5) return 'elite'
  if (pct < 10) return 'high'
  if (pct < 15) return 'medium'
  return 'low'
}

function mainRuns(runs: GitHubWorkflowRun[], defaultBranch: string) {
  return runs.filter((r) => r.head_branch === defaultBranch)
}

export function computeDeploymentFrequency(
  runs: GitHubWorkflowRun[],
  defaultBranch: string,
): DoraMetric {
  const cutoff = Date.now() - 4 * WEEK_MS
  const recent = mainRuns(runs, defaultBranch).filter(
    (r) => r.conclusion === 'success' && new Date(r.created_at).getTime() > cutoff,
  )
  if (recent.length === 0) return { value: null, level: null, label: 'No data' }
  const perWeek = recent.length / 4
  const level = freqLevel(perWeek)
  return { value: perWeek, level, label: level }
}

export function computeLeadTime(runs: GitHubWorkflowRun[]): DoraMetric {
  const completed = runs.filter(
    (r) => r.conclusion === 'success' && r.run_started_at,
  )
  if (completed.length === 0) return { value: null, level: null, label: 'No data' }
  const durations = completed.map(
    (r) => (new Date(r.updated_at).getTime() - new Date(r.run_started_at!).getTime()) / HOUR_MS,
  )
  const avg = durations.reduce((a, b) => a + b, 0) / durations.length
  return { value: avg, level: hoursLevel(avg), label: hoursLevel(avg) }
}

export function computeChangeFailureRate(
  runs: GitHubWorkflowRun[],
  defaultBranch: string,
): DoraMetric {
  const completed = mainRuns(runs, defaultBranch).filter((r) => r.conclusion !== null)
  if (completed.length === 0) return { value: null, level: null, label: 'No data' }
  const failed = completed.filter(
    (r) => r.conclusion === 'failure' || r.conclusion === 'timed_out',
  )
  const pct = (failed.length / completed.length) * 100
  return { value: pct, level: cfrLevel(pct), label: cfrLevel(pct) }
}

export function computeMTTR(
  runs: GitHubWorkflowRun[],
  defaultBranch: string,
): DoraMetric {
  const sorted = mainRuns(runs, defaultBranch)
    .filter((r) => r.conclusion !== null)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  const recoveryTimes: number[] = []
  for (let i = 0; i < sorted.length; i++) {
    const run = sorted[i]
    if (run.conclusion !== 'failure' && run.conclusion !== 'timed_out') continue
    const nextSuccess = sorted.slice(i + 1).find((r) => r.conclusion === 'success')
    if (!nextSuccess) continue
    recoveryTimes.push(
      (new Date(nextSuccess.created_at).getTime() - new Date(run.created_at).getTime()) / HOUR_MS,
    )
  }

  if (recoveryTimes.length === 0) return { value: null, level: null, label: 'No data' }
  const avg = recoveryTimes.reduce((a, b) => a + b, 0) / recoveryTimes.length
  return { value: avg, level: hoursLevel(avg), label: hoursLevel(avg) }
}

const DAY_MS = 24 * 60 * 60 * 1000

export function computeDeploymentsByDay(
  runs: GitHubWorkflowRun[],
  days = 30,
): number[] {
  const now = Date.now()
  const buckets = new Array<number>(days).fill(0)
  for (const run of runs) {
    if (run.conclusion !== 'success') continue
    const age = Math.floor((now - new Date(run.created_at).getTime()) / DAY_MS)
    if (age >= 0 && age < days) buckets[days - 1 - age]++
  }
  return buckets
}

export function conclusionToStatus(conclusion: WorkflowRunConclusion): StatusIndicatorStatus {
  if (!conclusion) return 'loading'
  if (conclusion === 'success') return 'online'
  if (conclusion === 'failure' || conclusion === 'timed_out') return 'error'
  if (conclusion === 'cancelled' || conclusion === 'action_required') return 'warning'
  return 'offline'
}
