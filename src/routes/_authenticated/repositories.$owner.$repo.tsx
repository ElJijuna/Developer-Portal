import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useMemo } from 'react'
import {
  useGhRepo,
  useGhRepoTopics,
  useGhRepoCommits,
  useGhRepoAdvisories,
  useGhRepoPullRequests,
  useGhRepoReleases,
  useGhRepoWorkflowRuns,
  useGhRepoBranches,
} from '@api-hooks/gh'
import type { GitHubCommit, GitHubRepositoryAdvisory, GitHubPullRequest, GitHubRelease, GitHubWorkflowRun, WorkflowRunConclusion, GitHubBranch } from 'gh-api-client'
import { api } from 'code-languages'
import type { LocalizedLanguage, LanguageSlug } from 'code-languages'
import { CounterCard, EntityCard, EmptyState, ErrorState } from '@gnome-ui/layout'
import { DashboardGrid } from '@gnome-ui/layout/components/DashboardGrid'
import { Box } from '@gnome-ui/react/components/Box'
import { Text } from '@gnome-ui/react/components/Text'
import { Card } from '@gnome-ui/react/components/Card'
import { Avatar } from '@gnome-ui/react/components/Avatar'
import { Icon } from '@gnome-ui/react/components/Icon'
import { Button } from '@gnome-ui/react/components/Button'
import { Spinner } from '@gnome-ui/react/components/Spinner'
import { Chip } from '@gnome-ui/react/components/Chip'
import { WrapBox } from '@gnome-ui/react/components/WrapBox'
import { TabBar, TabItem } from '@gnome-ui/react/components/Tabs'
import { StatusBadge } from '@gnome-ui/react/components/StatusBadge'
import { Folder, Lock, Warning, Share, Star, Check, GitPullRequest, GitIssueOpened, GitWorkflow, GitTag, GitBranch, GitMerge } from '@gnome-ui/icons'
import { SparkAreaChart, SparkBarChart } from '@gnome-ui/charts'
import { Drawer } from '@gnome-ui/react/components/Drawer'
import { Npm } from '@gnome-ui/icons/third-party'
import { useNpmPackage } from '@api-hooks/npm'
import { PageHeader } from '../../components/PageHeader'
import { NpmPackageSummary } from '../../components/NpmPackageSummary'
import { useAuth } from '../../auth/AuthProvider'

export const Route = createFileRoute('/_authenticated/repositories/$owner/$repo')({
  component: RepoDetail,
})

type TabId = 'overview' | 'commits' | 'pull-requests' | 'releases' | 'workflows' | 'security' | 'branches'
type BranchFilter = 'all' | 'merged' | 'unmerged'

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f7df1e',
  Python: '#3572a5',
  Rust: '#dea584',
  Go: '#00add8',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  Ruby: '#701516',
  Swift: '#fa7343',
  Kotlin: '#a97bff',
  Dart: '#00b4ab',
  PHP: '#4f5d95',
  Shell: '#89e051',
  HTML: '#e34c26',
  CSS: '#563d7c',
}

const SEVERITY_COLOR: Record<string, string> = {
  critical: '#e01b24',
  high: '#e66100',
  medium: '#e5a50a',
  low: '#3584e4',
  unknown: '#77767b',
}

const GH_LANG_TO_SLUG: Record<string, string> = {
  'C++': 'cpp',
  'C#': 'csharp',
  'Shell': 'bash',
  'Objective-C': 'objective-c',
  'Jupyter Notebook': 'jupyter',
  'Visual Basic .NET': 'visual-basic',
}

type RepoDetailExtras = {
  homepage?: string | null
  is_template?: boolean
  license?: { name: string } | null
}

function conclusionColor(conclusion: WorkflowRunConclusion): string {
  switch (conclusion) {
    case 'success': return '#26a269'
    case 'failure': return '#e01b24'
    case 'cancelled': return '#77767b'
    case 'timed_out': return '#e66100'
    case 'action_required': return '#e5a50a'
    default: return '#77767b'
  }
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

function RepoDetail() {
  const { owner, repo: repoName } = Route.useParams()
  const { user } = useAuth()
  const token = user?.githubToken ?? ''
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [branchFilter, setBranchFilter] = useState<BranchFilter>('all')
  const [langInfo, setLangInfo] = useState<LocalizedLanguage | null>(null)
  const [npmDrawerOpen, setNpmDrawerOpen] = useState(false)

  const enabled = !!owner && !!repoName && !!token

  const { data: repo, isLoading: repoLoading, error: repoError } = useGhRepo(owner, repoName, { enabled })
  const { data: topics } = useGhRepoTopics(owner, repoName, { enabled })
  const { data: commitsData, isLoading: commitsLoading } = useGhRepoCommits(
    owner, repoName, { per_page: 10 }, { enabled },
  )
  const { data: prsData, isLoading: prsLoading } = useGhRepoPullRequests(
    owner, repoName, { state: 'open', per_page: 20 }, { enabled },
  )
  const { data: releasesData, isLoading: releasesLoading } = useGhRepoReleases(
    owner, repoName, { per_page: 20 }, { enabled },
  )
  const { data: workflowsData, isLoading: workflowsLoading } = useGhRepoWorkflowRuns(
    owner, repoName, { per_page: 15 }, { enabled },
  )
  const { data: advisoriesData, isLoading: advisoriesLoading } = useGhRepoAdvisories(
    owner, repoName, {}, { enabled },
  )
  const { data: branchesData, isLoading: branchesLoading } = useGhRepoBranches(
    owner, repoName, { per_page: 100 }, { enabled: enabled && activeTab === 'branches' },
  )
  const { data: mergedPrsData } = useGhRepoPullRequests(
    owner, repoName, { state: 'closed', per_page: 100 }, { enabled: enabled && activeTab === 'branches' },
  )
  const { data: npmPackage } = useNpmPackage(repoName, { enabled: !!repo })

  const commits: GitHubCommit[] = commitsData?.values ?? []
  const prs: GitHubPullRequest[] = prsData?.values ?? []
  const releases: GitHubRelease[] = releasesData?.values ?? []
  const runs: GitHubWorkflowRun[] = workflowsData?.workflow_runs ?? []
  const advisories: GitHubRepositoryAdvisory[] = advisoriesData?.values ?? []
  const branches: GitHubBranch[] = branchesData?.values ?? []
  const mergedPrs: GitHubPullRequest[] = mergedPrsData?.values ?? []

  const mergedBranchNames = useMemo(
    () => new Set(mergedPrs.filter(pr => pr.merged_at !== null).map(pr => pr.head.ref)),
    [mergedPrs],
  )

  const workflowChartData = useMemo(() => {
    const chronological = [...runs].reverse()
    const completed = chronological.filter(r => r.run_started_at && r.conclusion !== null)
    const durations = completed.map(r =>
      Math.max(1, Math.round((new Date(r.updated_at).getTime() - new Date(r.run_started_at!).getTime()) / 1000))
    )
    const outcomes = chronological.map(r => r.conclusion === 'success' ? 1 : 0)
    const finishedRuns = runs.filter(r => r.conclusion !== null)
    const successRate = finishedRuns.length > 0
      ? finishedRuns.filter(r => r.conclusion === 'success').length / finishedRuns.length
      : 0
    const avgDuration = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0
    return { durations, outcomes, successRate, avgDuration }
  }, [runs])

  useEffect(() => {
    if (!repo?.language) return
    const rawSlug = GH_LANG_TO_SLUG[repo.language] ?? repo.language;
    api.language(rawSlug as LanguageSlug).locale('en-US').load()
      .then((language) => setLangInfo(language ?? null))
      .catch(() => setLangInfo(null))
  }, [repo?.language])

  const actions = (
    <Button
      variant="flat"
      size="sm"
      leadingIcon={<Icon icon={Share} />}
      onClick={() => repo && window.open(repo.html_url, '_blank')}
      disabled={!repo}
    >
      Open on GitHub
    </Button>
  )

  if (repoLoading) {
    return (
      <>
        <PageHeader
          title={`${owner}/${repoName}`}
          segments={[
            { label: 'Repositories', path: '/repositories' },
            { label: `${owner}/${repoName}`, path: `/repositories/${owner}/${repoName}` },
          ]}
          actions={actions}
        />
        <Box align="center" justify="center" padding={48}><Spinner /></Box>
      </>
    )
  }

  if (repoError || !repo) {
    return (
      <>
        <PageHeader
          title={`${owner}/${repoName}`}
          segments={[
            { label: 'Repositories', path: '/repositories' },
            { label: `${owner}/${repoName}`, path: `/repositories/${owner}/${repoName}` },
          ]}
        />
        <ErrorState type="network" description={repoError?.message ?? 'Repository not found.'} />
      </>
    )
  }

  const langColor = repo.language ? (LANGUAGE_COLORS[repo.language] ?? '#77767b') : null
  const repoExtras = repo as typeof repo & RepoDetailExtras

  return (
    <>
      <PageHeader
        title={repo.name}
        segments={[
          { label: 'Repositories', path: '/repositories' },
          { label: `${owner}/${repoName}`, path: `/repositories/${owner}/${repoName}` },
        ]}
        actions={
          <Box orientation="horizontal" spacing={8}>
            {npmPackage && (
              <Button variant="flat" size="sm" leadingIcon={<Icon icon={Npm} />} onClick={() => setNpmDrawerOpen(true)}>
                View in NPM
              </Button>
            )}
            {actions}
          </Box>
        }
      />

      <Drawer open={npmDrawerOpen} title={repoName} size="wide" onClose={() => setNpmDrawerOpen(false)}>
        <NpmPackageSummary packageName={repoName} />
      </Drawer>

      <Box orientation="vertical" spacing={16}>
        {/* Hero */}
        <Card padding="lg">
          <Box orientation="horizontal" spacing={16} align="start">
            <Avatar src={repo.owner.avatar_url} name={repo.owner.login} size="lg" />
            <Box orientation="vertical" spacing={8} style={{ flex: 1, minWidth: 0 }}>
              <Text variant="title-2" style={{ fontWeight: 700, wordBreak: 'break-word' }}>
                {repo.full_name}
              </Text>
              {repo.description && (
                <Text variant="body" color="dim">{repo.description}</Text>
              )}
              {repoExtras.homepage && (
                <Button variant="flat" size="sm" onClick={() => window.open(repoExtras.homepage!, '_blank')}>
                  {repoExtras.homepage}
                </Button>
              )}
              {topics && topics.length > 0 && (
                <WrapBox childSpacing={4}>
                  {topics.map((topic) => <Chip key={topic} label={topic} />)}
                </WrapBox>
              )}
            </Box>
          </Box>
        </Card>

        {/* Stats */}
        <DashboardGrid columns={{ xs: 2, sm: 4 }} gap="md">
          <CounterCard label="Stars" value={repo.stargazers_count} icon={Star} color="#e5a50a" />
          <CounterCard label="Forks" value={repo.forks_count} icon={Folder} />
          <CounterCard label="Watchers" value={repo.watchers_count} icon={Warning} />
          <CounterCard label="Open Issues" value={repo.open_issues_count} icon={GitIssueOpened} color={repo.open_issues_count > 0 ? '#e5a50a' : undefined} />
        </DashboardGrid>

        {/* Tabs */}
        <Box orientation="vertical" spacing={12}>
          <TabBar aria-label="Repository tabs" inline>
            <TabItem name="overview" label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
            <TabItem name="commits" label="Commits" active={activeTab === 'commits'} onClick={() => setActiveTab('commits')} />
            <TabItem name="pull-requests" label={`Pull Requests${prs.length > 0 ? ` (${prs.length})` : ''}`} active={activeTab === 'pull-requests'} onClick={() => setActiveTab('pull-requests')} />
            <TabItem name="releases" label={`Releases${releases.length > 0 ? ` (${releases.length})` : ''}`} active={activeTab === 'releases'} onClick={() => setActiveTab('releases')} />
            <TabItem name="workflows" label="Workflows" active={activeTab === 'workflows'} onClick={() => setActiveTab('workflows')} />
            <TabItem name="security" label={`Security${advisories.length > 0 ? ` (${advisories.length})` : ''}`} active={activeTab === 'security'} onClick={() => setActiveTab('security')} />
            <TabItem name="branches" label="Branches" active={activeTab === 'branches'} onClick={() => setActiveTab('branches')} />
          </TabBar>

          {/* Overview */}
          {activeTab === 'overview' && (
            <Box orientation="vertical" spacing={12}>
              {repo.language ? (
                <Card padding="md">
                  <Box orientation="vertical" spacing={12}>
                    <Box orientation="horizontal" spacing={8} align="center">
                      {langColor && (
                        <div style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: langColor, flexShrink: 0 }} />
                      )}
                      <Text variant="heading" style={{ fontWeight: 600 }}>
                        {langInfo?.name ?? repo.language}
                      </Text>
                    </Box>
                    {langInfo ? (
                      <Box orientation="vertical" spacing={8}>
                        <Text variant="body" color="dim">{langInfo.description}</Text>
                        {langInfo.extensions.length > 0 && (
                          <Box orientation="vertical" spacing={4}>
                            <Text variant="caption" color="dim">File extensions</Text>
                            <WrapBox childSpacing={4}>
                              {langInfo.extensions.map((ext) => <Chip key={ext} label={ext} />)}
                            </WrapBox>
                          </Box>
                        )}
                        {langInfo.paradigms.length > 0 && (
                          <Box orientation="vertical" spacing={4}>
                            <Text variant="caption" color="dim">Paradigms</Text>
                            <WrapBox childSpacing={4}>
                              {langInfo.paradigms.map((p) => <Chip key={p} label={p} />)}
                            </WrapBox>
                          </Box>
                        )}
                        {langInfo.author && (
                          <Text variant="caption" color="dim">Created by {langInfo.author}</Text>
                        )}
                      </Box>
                    ) : (
                      <Text variant="caption" color="dim">Primary language used in this repository.</Text>
                    )}
                  </Box>
                </Card>
              ) : (
                <EmptyState
                  icon={<Icon icon={Folder} size="lg" />}
                  title="No primary language"
                  description="GitHub has not detected a primary language for this repository."
                />
              )}
              <WrapBox childSpacing={4}>
                {repo.fork && <Chip label="Fork" />}
                {repo.archived && <Chip label="Archived" />}
                {repo.disabled && <Chip label="Disabled" />}
                {repoExtras.is_template && <Chip label="Template" />}
                {repoExtras.license?.name && <Chip label={repoExtras.license.name} />}
              </WrapBox>
            </Box>
          )}

          {/* Commits */}
          {activeTab === 'commits' && (
            <Box orientation="vertical" spacing={8}>
              {commitsLoading ? (
                <Box align="center" justify="center" padding={48}><Spinner /></Box>
              ) : commits.length === 0 ? (
                <EmptyState icon={<Icon icon={Folder} size="lg" />} title="No commits" description="No commits found." />
              ) : commits.map((commit) => (
                <EntityCard
                  key={commit.sha}
                  avatar={
                    commit.author?.avatar_url
                      ? <Avatar src={commit.author.avatar_url} name={commit.author.login} size="sm" />
                      : <Icon icon={Folder} size="md" />
                  }
                  title={commit.commit.message.split('\n')[0]}
                  subtitle={commit.sha.slice(0, 7)}
                  meta={[commit.commit.author.name, relativeTime(commit.commit.author.date)]}
                  interactive
                  onClick={() => window.open(commit.html_url, '_blank')}
                />
              ))}
            </Box>
          )}

          {/* Pull Requests */}
          {activeTab === 'pull-requests' && (
            <Box orientation="vertical" spacing={8}>
              {prsLoading ? (
                <Box align="center" justify="center" padding={48}><Spinner /></Box>
              ) : prs.length === 0 ? (
                <EmptyState icon={<Icon icon={GitPullRequest} size="lg" />} title="No open pull requests" description="There are no open pull requests in this repository." />
              ) : prs.map((pr) => (
                <EntityCard
                  key={pr.id}
                  avatar={
                    pr.user?.avatar_url
                      ? <Avatar src={pr.user.avatar_url} name={pr.user.login} size="sm" />
                      : <Icon icon={GitPullRequest} size="md" />
                  }
                  title={pr.title}
                  subtitle={`#${pr.number} · ${pr.user?.login ?? 'unknown'}`}
                  description={
                    pr.draft
                      ? <StatusBadge variant="neutral">Draft</StatusBadge> as unknown as string
                      : undefined
                  }
                  meta={[`${pr.state}`, relativeTime(pr.updated_at)]}
                  interactive
                  onClick={() => window.open(pr.html_url, '_blank')}
                />
              ))}
            </Box>
          )}

          {/* Releases */}
          {activeTab === 'releases' && (
            <Box orientation="vertical" spacing={8}>
              {releasesLoading ? (
                <Box align="center" justify="center" padding={48}><Spinner /></Box>
              ) : releases.length === 0 ? (
                <EmptyState icon={<Icon icon={GitTag} size="lg" />} title="No releases" description="No releases have been published for this repository." />
              ) : releases.map((release) => (
                <EntityCard
                  key={release.id}
                  avatar={
                    release.author?.avatar_url
                      ? <Avatar src={release.author.avatar_url} name={release.author.login} size="sm" />
                      : <Icon icon={GitTag} size="md" />
                  }
                  title={release.name ?? release.tag_name}
                  subtitle={`${release.tag_name} · ${release.author?.login ?? 'unknown'}`}
                  description={
                    release.draft
                      ? <StatusBadge variant="neutral">Draft</StatusBadge> as unknown as string
                      : release.prerelease
                        ? <StatusBadge variant="warning">Pre-release</StatusBadge> as unknown as string
                        : undefined
                  }
                  meta={[
                    `${release.assets.length} asset${release.assets.length === 1 ? '' : 's'}`,
                    relativeTime(release.published_at ?? release.created_at),
                  ]}
                  interactive
                  onClick={() => window.open(release.html_url, '_blank')}
                />
              ))}
            </Box>
          )}

          {/* Workflows */}
          {activeTab === 'workflows' && (
            <Box orientation="vertical" spacing={12}>
              {workflowsLoading ? (
                <Box align="center" justify="center" padding={48}><Spinner /></Box>
              ) : runs.length === 0 ? (
                <EmptyState icon={<Icon icon={GitWorkflow} size="lg" />} title="No workflow runs" description="No workflow runs found for this repository." />
              ) : (
                <>
                  <DashboardGrid columns={{ xs: 2, sm: 2 }} gap="md">
                    <CounterCard
                      label="Success rate"
                      value={Math.round(workflowChartData.successRate * 100)}
                      suffix="%"
                      color={workflowChartData.successRate >= 0.7 ? '#26a269' : workflowChartData.successRate >= 0.4 ? '#e5a50a' : '#e01b24'}
                      icon={GitWorkflow}
                    />
                    <CounterCard
                      label="Avg duration"
                      value={workflowChartData.avgDuration}
                      format={(v) => v < 60 ? `${Math.round(v)}s` : `${Math.round(v / 60)}m ${Math.round(v % 60)}s`}
                      icon={Check}
                    />
                  </DashboardGrid>

                  <Card padding="md">
                    <Box orientation="vertical" spacing={12}>
                      <Box orientation="vertical" spacing={4}>
                        <Text variant="caption" color="dim">Duración por run (segundos)</Text>
                        <SparkAreaChart
                          data={workflowChartData.durations}
                          height={48}
                          aria-label="Duración de los últimos workflow runs"
                        />
                      </Box>
                      <Box orientation="vertical" spacing={4}>
                        <Text variant="caption" color="dim">Outcomes — success (1) vs otros (0)</Text>
                        <SparkBarChart
                          data={workflowChartData.outcomes}
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
                </>
              )}
            </Box>
          )}

          {/* Security */}
          {activeTab === 'security' && (
            <Box orientation="vertical" spacing={8}>
              {advisoriesLoading ? (
                <Box align="center" justify="center" padding={48}><Spinner /></Box>
              ) : advisories.length === 0 ? (
                <EmptyState icon={<Icon icon={Lock} size="lg" />} title="No known vulnerabilities" description="No security advisories have been published for this repository." />
              ) : advisories.map((adv) => (
                <EntityCard
                  key={adv.ghsa_id}
                  avatar={
                    <Box align="center" justify="center" style={{ width: 36, height: 36 }}>
                      <div style={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: SEVERITY_COLOR[adv.severity] ?? SEVERITY_COLOR.unknown,
                      }} />
                    </Box>
                  }
                  title={adv.summary}
                  subtitle={adv.cve_id ? `${adv.ghsa_id} · ${adv.cve_id}` : adv.ghsa_id}
                  meta={[adv.severity, relativeTime(adv.published_at ?? adv.updated_at)]}
                  interactive
                  onClick={() => window.open(adv.html_url, '_blank')}
                />
              ))}
            </Box>
          )}
          {/* Branches */}
          {activeTab === 'branches' && (
            <Box orientation="vertical" spacing={12}>
              <TabBar aria-label="Branch filter" inline>
                <TabItem name="all" label="All" active={branchFilter === 'all'} onClick={() => setBranchFilter('all')} />
                <TabItem name="merged" label="Integrated (merged)" active={branchFilter === 'merged'} onClick={() => setBranchFilter('merged')} />
                <TabItem name="unmerged" label="Not integrated" active={branchFilter === 'unmerged'} onClick={() => setBranchFilter('unmerged')} />
              </TabBar>
              {branchesLoading ? (
                <Box align="center" justify="center" padding={48}><Spinner /></Box>
              ) : branches.length === 0 ? (
                <EmptyState icon={<Icon icon={GitBranch} size="lg" />} title="No branches" description="No branches found for this repository." />
              ) : (() => {
                const defaultBranch = repo.default_branch
                const filtered = branches.filter(branch => {
                  if (branch.name === defaultBranch) return branchFilter === 'all'
                  const isMerged = mergedBranchNames.has(branch.name)
                  if (branchFilter === 'merged') return isMerged
                  if (branchFilter === 'unmerged') return !isMerged
                  return true
                })
                if (filtered.length === 0) {
                  return (
                    <EmptyState
                      icon={<Icon icon={GitBranch} size="lg" />}
                      title="No branches in this category"
                      description={branchFilter === 'merged' ? 'No branches with a merged pull request found.' : 'No unmerged branches found.'}
                    />
                  )
                }
                return (
                  <Box orientation="vertical" spacing={8}>
                    {filtered.map(branch => {
                      const isDefault = branch.name === defaultBranch
                      const isMerged = !isDefault && mergedBranchNames.has(branch.name)
                      return (
                        <EntityCard
                          key={branch.name}
                          avatar={
                            <Box align="center" justify="center" style={{ width: 36, height: 36 }}>
                              <Icon icon={isMerged ? GitMerge : GitBranch} size="md" />
                            </Box>
                          }
                          title={branch.name}
                          subtitle={branch.commit.sha.slice(0, 7)}
                          description={
                            isDefault
                              ? <StatusBadge variant="success">Default</StatusBadge> as unknown as string
                              : isMerged
                                ? <StatusBadge variant="neutral">Merged · can be deleted</StatusBadge> as unknown as string
                                : undefined
                          }
                          meta={[
                            branch.protected ? 'Protected' : 'Not protected',
                          ]}
                          interactive
                          onClick={() => window.open(`${repo.html_url}/tree/${encodeURIComponent(branch.name)}`, '_blank')}
                        />
                      )
                    })}
                  </Box>
                )
              })()}
            </Box>
          )}
        </Box>
      </Box>
    </>
  )
}
