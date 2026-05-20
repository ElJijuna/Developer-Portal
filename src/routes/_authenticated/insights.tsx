import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useMemo, useEffect } from 'react'
import { useGhCurrentUser, useGhUserRepos } from '@api-hooks/gh'
import type { GitHubRepository } from 'gh-api-client'
import { DashboardGrid } from '@gnome-ui/layout/components/DashboardGrid'
import { StatCard } from '@gnome-ui/layout/components/StatCard'
import { EmptyState, ErrorState } from '@gnome-ui/layout'
import { TabBar, TabItem } from '@gnome-ui/react/components/Tabs'
import { ToggleGroup, ToggleGroupItem } from '@gnome-ui/react/components/ToggleGroup'
import { Box } from '@gnome-ui/react/components/Box'
import { Card } from '@gnome-ui/react/components/Card'
import { Text } from '@gnome-ui/react/components/Text'
import { Spinner } from '@gnome-ui/react/components/Spinner'
import { Icon } from '@gnome-ui/react/components/Icon'
import { Button } from '@gnome-ui/react/components/Button'
import { Information, Star, Settings } from '@gnome-ui/icons'
import { GitHub as GitHubIcon } from '@gnome-ui/icons/third-party'
import { PageHeader } from '../../components/PageHeader'
import { useAuth } from '../../auth/AuthProvider'
import { getItem, setItem } from '../../lib/localStorage'

export const Route = createFileRoute('/_authenticated/insights')({
  component: Insights,
})

type InsightsTab = 'insights' | 'digest'
type DigestPeriod = 'day' | 'week' | 'month'

interface RepoSnapshot {
  date: string
  repoId: number
  stars: number
  forks: number
  openIssues: number
}

function snapshotKey(login: string, period: DigestPeriod) {
  return `dp:snapshot:${login}:${period}`
}

function saveSnapshot(login: string, period: DigestPeriod, repos: GitHubRepository[]) {
  const snapshots: RepoSnapshot[] = repos.map((r) => ({
    date: new Date().toISOString(),
    repoId: r.id,
    stars: r.stargazers_count,
    forks: r.forks_count,
    openIssues: r.open_issues_count,
  }))
  setItem(snapshotKey(login, period), snapshots)
}

function computeHealthScore(repo: GitHubRepository): number {
  const daysSincePush = repo.pushed_at
    ? Math.floor((Date.now() - new Date(repo.pushed_at).getTime()) / 86_400_000)
    : 365
  const issueRatio = repo.stargazers_count > 0
    ? repo.open_issues_count / repo.stargazers_count
    : repo.open_issues_count * 0.1
  let score = 100
  score -= Math.min(40, daysSincePush * 0.5)
  score -= Math.min(40, issueRatio * 20)
  return Math.max(0, Math.round(score))
}

function healthColor(score: number): string {
  if (score >= 70) return '#26a269'
  if (score >= 40) return '#e5a50a'
  return '#e01b24'
}

function Insights() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const token = user?.githubToken ?? ''
  const [activeTab, setActiveTab] = useState<InsightsTab>('insights')
  const [period, setPeriod] = useState<DigestPeriod>('week')

  const { data: me, isLoading: meLoading } = useGhCurrentUser({ enabled: !!token })
  const login = me?.login ?? ''

  const { data: reposData, isLoading: reposLoading, error } = useGhUserRepos(
    login,
    { per_page: 100, sort: 'pushed' },
    { enabled: !!login },
  )

  const repos = reposData?.values ?? []
  const isLoading = meLoading || reposLoading

  useEffect(() => {
    if (login && repos.length > 0) {
      saveSnapshot(login, period, repos)
    }
  }, [login, period, repos])

  const snapshot = useMemo(
    () => login ? getItem<RepoSnapshot[]>(snapshotKey(login, period)) : null,
    [login, period],
  )

  const deltas = useMemo(() => {
    if (!snapshot || repos.length === 0) return []
    return repos
      .map((r) => {
        const snap = snapshot.find((s) => s.repoId === r.id)
        if (!snap) return null
        return {
          repo: r,
          starsDelta: r.stargazers_count - snap.stars,
          forksDelta: r.forks_count - snap.forks,
          issuesDelta: r.open_issues_count - snap.openIssues,
        }
      })
      .filter(Boolean)
      .sort((a, b) => Math.abs(b!.starsDelta) - Math.abs(a!.starsDelta))
      .slice(0, 10)
  }, [repos, snapshot])

  const topByHealth = useMemo(
    () =>
      repos
        .map((r) => ({ repo: r, score: computeHealthScore(r) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 12),
    [repos],
  )

  if (!token) {
    return (
      <>
        <PageHeader title="Insights" segments={[{ label: 'Insights', path: '/insights' }]} />
        <Box padding={24}>
          <EmptyState
            icon={<Icon icon={GitHubIcon} size="lg" />}
            title="GitHub not connected"
            description="Add your GitHub token in Settings to see insights."
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
      <PageHeader title="Insights" segments={[{ label: 'Insights', path: '/insights' }]} />

      <Box orientation="vertical" spacing={12}>
        <TabBar aria-label="Insights tabs" inline>
          <TabItem label="Insights" active={activeTab === 'insights'} onClick={() => setActiveTab('insights')} />
          <TabItem label="Daily Digest" active={activeTab === 'digest'} onClick={() => setActiveTab('digest')} />
        </TabBar>

        {isLoading ? (
          <Box align="center" justify="center" padding={48}><Spinner /></Box>
        ) : error ? (
          <ErrorState type="network" description={error.message} />
        ) : activeTab === 'insights' ? (
          topByHealth.length === 0 ? (
            <EmptyState
              icon={<Icon icon={Information} size="lg" />}
              title="No repositories"
              description="Push some code to see repo health insights."
            />
          ) : (
            <DashboardGrid columns={{ xs: 1, sm: 2, md: 3 }} gap="md">
              {topByHealth.map(({ repo, score }) => (
                <DashboardGrid.Item key={repo.id}>
                  <StatCard
                    label={repo.name}
                    value={score}
                    unit="/100"
                    icon={<span style={{ color: healthColor(score), fontWeight: 700, fontSize: 18 }}>●</span>}
                    trend={
                      repo.pushed_at
                        ? {
                            direction: score >= 70 ? 'up' : score >= 40 ? 'neutral' : 'down',
                            value: score,
                            period: repo.pushed_at.slice(0, 10),
                          }
                        : undefined
                    }
                  />
                </DashboardGrid.Item>
              ))}
            </DashboardGrid>
          )
        ) : (
          <Box orientation="vertical" spacing={12}>
            <ToggleGroup
              value={period}
              onValueChange={(v) => v && setPeriod(v as DigestPeriod)}
              aria-label="Period"
            >
              <ToggleGroupItem name="day" label="Day" aria-label="Day" />
              <ToggleGroupItem name="week" label="Week" aria-label="Week" />
              <ToggleGroupItem name="month" label="Month" aria-label="Month" />
            </ToggleGroup>

            {deltas.length === 0 ? (
              <EmptyState
                icon={<Icon icon={Star} size="lg" />}
                title="No snapshot yet"
                description="Come back after some activity to see deltas."
              />
            ) : (
              <DashboardGrid columns={{ xs: 1, sm: 2 }} gap="md">
                {deltas.map((d) => {
                  if (!d) return null
                  return (
                    <DashboardGrid.Item key={d.repo.id}>
                      <Card padding="md">
                        <Box orientation="vertical" spacing={6}>
                          <Text variant="heading">{d.repo.name}</Text>
                          <Box spacing={16}>
                            <Text variant="caption" color={d.starsDelta >= 0 ? 'success' : 'error'}>
                              ⭐ {d.starsDelta >= 0 ? '+' : ''}{d.starsDelta}
                            </Text>
                            <Text variant="caption" color={d.forksDelta >= 0 ? 'success' : 'error'}>
                              🍴 {d.forksDelta >= 0 ? '+' : ''}{d.forksDelta}
                            </Text>
                            <Text variant="caption" color={d.issuesDelta <= 0 ? 'success' : 'error'}>
                              🐛 {d.issuesDelta >= 0 ? '+' : ''}{d.issuesDelta}
                            </Text>
                          </Box>
                        </Box>
                      </Card>
                    </DashboardGrid.Item>
                  )
                })}
              </DashboardGrid>
            )}
          </Box>
        )}
      </Box>
    </>
  )
}
