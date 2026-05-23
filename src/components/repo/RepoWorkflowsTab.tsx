import { Box } from '@gnome-ui/react/components/Box'
import { Card } from '@gnome-ui/react/components/Card'
import { Icon } from '@gnome-ui/react/components/Icon'
import { Spinner } from '@gnome-ui/react/components/Spinner'
import { Text } from '@gnome-ui/react/components/Text'
import { CounterCard, EntityCard, EmptyState } from '@gnome-ui/layout'
import { SparkAreaChart, SparkBarChart } from '@gnome-ui/charts'
import { Check, GitWorkflow } from '@gnome-ui/icons'
import type { GitHubWorkflowRun } from 'gh-api-client'
import { conclusionColor, relativeTime } from '../../lib/formatting'

export type WorkflowChartData = {
  durations: number[]
  outcomes: number[]
  successRate: number
  avgDuration: number
}

export type RepoWorkflowsTabProps = {
  runs: GitHubWorkflowRun[]
  isLoading: boolean
  chartData: WorkflowChartData
}

export function RepoWorkflowsTab({ runs, isLoading, chartData }: RepoWorkflowsTabProps) {
  if (isLoading) {
    return <Box align="center" justify="center" padding={48}><Spinner /></Box>
  }

  if (runs.length === 0) {
    return (
      <EmptyState
        icon={<Icon icon={GitWorkflow} size="lg" />}
        title="No workflow runs"
        description="No workflow runs found for this repository."
      />
    )
  }

  return (
    <Box orientation="vertical" spacing={12}>
      <Box orientation="horizontal" spacing={12}>
        <CounterCard
          label="Success rate"
          value={Math.round(chartData.successRate * 100)}
          suffix="%"
          color={chartData.successRate >= 0.7 ? '#26a269' : chartData.successRate >= 0.4 ? '#e5a50a' : '#e01b24'}
          icon={GitWorkflow}
        />
        <CounterCard
          label="Avg duration"
          value={chartData.avgDuration}
          format={(v) => v < 60 ? `${Math.round(v)}s` : `${Math.round(v / 60)}m ${Math.round(v % 60)}s`}
          icon={Check}
        />
      </Box>

      <Card padding="md">
        <Box orientation="vertical" spacing={12}>
          <Box orientation="vertical" spacing={4}>
            <Text variant="caption" color="dim">Duración por run (segundos)</Text>
            <SparkAreaChart
              data={chartData.durations}
              height={48}
              aria-label="Duración de los últimos workflow runs"
            />
          </Box>
          <Box orientation="vertical" spacing={4}>
            <Text variant="caption" color="dim">Outcomes — success (1) vs otros (0)</Text>
            <SparkBarChart
              data={chartData.outcomes}
              height={32}
              color="#26a269"
              aria-label="Resultados de los últimos workflow runs"
            />
          </Box>
        </Box>
      </Card>

      <Box orientation="vertical" spacing={8}>
        {runs.map((run) => (
          <EntityCard
            key={run.id}
            avatar={
              <Box align="center" justify="center" style={{ width: 36, height: 36 }}>
                <div style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: run.status === 'in_progress'
                    ? '#3584e4'
                    : conclusionColor(run.conclusion),
                }} />
              </Box>
            }
            title={run.name ?? `Run #${run.run_number}`}
            subtitle={`#${run.run_number} · ${run.event} · ${run.head_branch ?? 'unknown branch'}`}
            meta={[
              run.status === 'in_progress' ? 'running' : (run.conclusion ?? run.status),
              relativeTime(run.created_at),
            ]}
            interactive
            onClick={() => window.open(run.html_url, '_blank')}
          />
        ))}
      </Box>
    </Box>
  )
}
