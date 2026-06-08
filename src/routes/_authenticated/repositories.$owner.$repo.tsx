import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import {
  useGhRepo,
  useGhRepoTopics,
  useGhRepoAdvisories,
  useGhRepoPullRequests,
  useGhRepoGitTree,
} from '@api-hooks/gh'
import { useLanguage } from '../../hooks/useLanguage'
import { CounterCard, ErrorState, PanelCard } from '@gnome-ui/layout'
import { DashboardGrid } from '@gnome-ui/layout/components/DashboardGrid'
import { Box } from '@gnome-ui/react/components/Box'
import { Button } from '@gnome-ui/react/components/Button'
import { Icon } from '@gnome-ui/react/components/Icon'
import { Spinner } from '@gnome-ui/react/components/Spinner'
import { TabBar, TabItem } from '@gnome-ui/react/components/Tabs'
import { Drawer } from '@gnome-ui/react/components/Drawer'
import { Folder, Warning, Star, Share, GitIssueOpened, GitWorkflow, GitBranch, Lock, GitDiff } from '@gnome-ui/icons'
import { Npm } from '@gnome-ui/icons/third-party'
import { PackageXGeneric } from '@gnome-ui/icons'
import { PageHeader } from '../../components/PageHeader'
import { NpmPackageSummary } from '../../components/NpmPackageSummary'
import { DockerImageSummary } from '../../components/DockerImageSummary'
import { useRepoNpmPackages } from '../../hooks/useRepoNpmPackages'
import { useRepoDockerImage } from '../../hooks/useRepoDockerImage'
import { RepoHero } from '../../components/repo/RepoHero'
import { RepositoryOverview } from '../../components/repo/RepositoryOverview'
import { RepositoryCommitList } from '../../components/repo/RepositoryCommitList'
import { RepositoryPullRequestList } from '../../components/repo/RepositoryPullRequestList'
import { RepositoryReleaseList } from '../../components/repo/RepositoryReleaseList'
import { RepositoryWorkflowRunPanel } from '../../components/repo/RepositoryWorkflowRunPanel'
import { RepositoryAdvisoryList } from '../../components/repo/RepositoryAdvisoryList'
import { RepositoryBranchList } from '../../components/repo/RepositoryBranchList'
import { useAuth } from '../../auth/AuthProvider'
import { Badge, Skeleton } from '@gnome-ui/react'
import {
  GithubBranches,
  GithubCommits,
  GithubPullRequests,
  GithubReleases,
  GithubWorkflowRuns,
} from '../../blocks/github'
import type { GitHubWorkflowRun } from 'gh-api-client'

export const Route = createFileRoute('/_authenticated/repositories/$owner/$repo')({
  component: RepoDetail,
})

type TabId = 'overview' | 'commits' | 'pull-requests' | 'releases' | 'workflows' | 'security' | 'branches'
type BranchFilter = 'all' | 'merged' | 'unmerged'

type RepoDetailExtras = {
  homepage?: string | null
  is_template?: boolean
  license?: { name: string } | null
}

function RepoDetail() {
  const { owner, repo: repoName } = Route.useParams();
  const { user } = useAuth();
  const token = user?.githubToken ?? '';
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [branchFilter, setBranchFilter] = useState<BranchFilter>('all');
  const [npmDrawerOpen, setNpmDrawerOpen] = useState(false);
  const [dockerDrawerOpen, setDockerDrawerOpen] = useState(false);
  const [tabCounts, setTabCounts] = useState({
    commits: 0,
    pullRequests: 0,
    releases: 0,
    workflows: 0,
    branches: 0,
  })

  const enabled = !!owner && !!repoName && !!token;

  const { data: repo, isLoading: repoLoading, error: repoError } = useGhRepo(owner, repoName, { enabled });
  const { data: topics } = useGhRepoTopics(owner, repoName, { enabled });
  const { data: advisoriesData, isLoading: advisoriesLoading } = useGhRepoAdvisories(owner, repoName, {}, { enabled });
  const { data: mergedPrsData } = useGhRepoPullRequests(owner, repoName, { state: 'closed', per_page: 100 }, { enabled: enabled && activeTab === 'branches' });
  const { data: gitTreeData } = useGhRepoGitTree(owner, repoName, repo?.default_branch ?? 'main', { recursive: '1' }, { enabled: !repoLoading });
  const advisories = advisoriesData?.values ?? [];
  const mergedPrs = mergedPrsData?.values ?? [];
  const totalFiles = gitTreeData?.tree.length ?? 0;

  const npmInfo = useRepoNpmPackages(owner, repoName, repo?.default_branch ?? 'main');
  const dockerInfo = useRepoDockerImage(owner, repoName, repo?.default_branch ?? 'main');

  const mergedBranchNames = useMemo(
    () => new Set(mergedPrs.filter((pr) => pr.merged_at !== null).map((pr) => pr.head.ref)),
    [mergedPrs],
  )

  const langInfo = useLanguage(repo?.language)

  function setTabCount(key: keyof typeof tabCounts, count: number) {
    setTabCounts((current) => current[key] === count ? current : { ...current, [key]: count })
  }

  const breadcrumb = [
    { label: 'Repositories', path: '/repositories' },
    { label: `${owner}/${repoName}`, path: `/repositories/${owner}/${repoName}` },
  ]

  if (repoLoading) {
    return (
      <>
        <PageHeader title={`${owner}/${repoName}`} segments={breadcrumb} />
        <Box align="center" justify="center" padding={48}><Spinner /></Box>
      </>
    )
  }

  if (repoError || !repo) {
    return (
      <>
        <PageHeader title={`${owner}/${repoName}`} segments={breadcrumb} />
        <ErrorState type="network" description={repoError?.message ?? 'Repository not found.'} />
      </>
    )
  }

  const repoExtras = repo as typeof repo & RepoDetailExtras

  return (
    <>
      <PageHeader
        title={repo.name}
        segments={breadcrumb}
        actions={
          <Box orientation="horizontal" spacing={8}>
            {npmInfo.isPending && (<Skeleton width={100} height={32} />)}
            {(!npmInfo.isPending) && (
              <Button variant="flat" size="sm" leadingIcon={<Icon icon={Npm} />} onClick={() => setNpmDrawerOpen(true)}>
                View in NPM {npmInfo.packages.length > 1 && <Badge variant="neutral">{npmInfo.packages.length}</Badge>}
              </Button>
            )}
            {dockerInfo.isPending && <Skeleton width={120} height={32} />}
            {!dockerInfo.isPending && dockerInfo.hasDockerfile && (
              <Button variant="flat" size="sm" leadingIcon={<Icon icon={PackageXGeneric} />} onClick={() => setDockerDrawerOpen(true)}>
                View in Docker Hub {dockerInfo.dockerfilePaths.length > 1 && <Badge variant="neutral">{dockerInfo.dockerfilePaths.length}</Badge>}
              </Button>
            )}
            <Button
              variant="flat"
              size="sm"
              leadingIcon={<Icon icon={Share} />}
              onClick={() => window.open(repo.html_url, '_blank')}
            >
              Open on GitHub
            </Button>
          </Box>
        }
      />

      <Drawer open={npmDrawerOpen} title={repoName} size="wide" onClose={() => setNpmDrawerOpen(false)}>
        <Box orientation="vertical" spacing={12}>
          {npmInfo.packages.map((pkg) => (
            <PanelCard key={pkg.name} title={pkg.name}>
              <NpmPackageSummary key={pkg.name} packageName={pkg.name} />
            </PanelCard>
          ))}
        </Box>
      </Drawer>

      <Drawer open={dockerDrawerOpen} title={repoName} size="wide" onClose={() => setDockerDrawerOpen(false)}>
        <DockerImageSummary namespace="pilmee" name={repoName.toLowerCase()} />
      </Drawer>

      <Box orientation="vertical" spacing={16}>
        <RepoHero repo={repo} topics={topics ?? []} repoExtras={repoExtras} />

        <DashboardGrid columns={{ xs: 2, sm: 3, md: 5 }} gap="md">
          <CounterCard label="Stars" value={repo.stargazers_count} icon={Star} color="#e5a50a" />
          <CounterCard label="Forks" value={repo.forks_count} icon={Folder} />
          <CounterCard label="Watchers" value={repo.watchers_count} icon={Warning} />
          <CounterCard label="Open Issues" value={repo.open_issues_count} icon={GitIssueOpened} color={repo.open_issues_count > 0 ? '#e5a50a' : undefined} />
          <CounterCard label="Files" value={totalFiles} icon={GitDiff} color="#3ec4c2" />
        </DashboardGrid>

        <Box orientation="vertical" spacing={12}>
          <TabBar aria-label="Repository tabs" inline>
            <TabItem name="overview" label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
            <TabItem name="commits" count={tabCounts.commits} label="Commits" active={activeTab === 'commits'} onClick={() => setActiveTab('commits')} />
            <TabItem name="pull-requests" count={tabCounts.pullRequests} label="Pull Requests" active={activeTab === 'pull-requests'} onClick={() => setActiveTab('pull-requests')} />
            <TabItem name="releases" count={tabCounts.releases} label="Releases" active={activeTab === 'releases'} onClick={() => setActiveTab('releases')} />
            <TabItem name="workflows" count={tabCounts.workflows} label="Workflows" active={activeTab === 'workflows'} onClick={() => setActiveTab('workflows')} icon={GitWorkflow} />
            <TabItem name="security" count={advisories.length} label="Security" active={activeTab === 'security'} onClick={() => setActiveTab('security')} icon={Lock} />
            <TabItem name="branches" count={tabCounts.branches} label="Branches" active={activeTab === 'branches'} onClick={() => setActiveTab('branches')} icon={GitBranch} />
          </TabBar>

          {activeTab === 'overview' && (
            <RepositoryOverview repo={repo} langInfo={langInfo} repoExtras={repoExtras} />
          )}

          <GithubCommits owner={owner} repo={repoName} limit={10} enabled={enabled} onStateChange={({ count }) => setTabCount('commits', count)}>
            {(state) => activeTab === 'commits' ? <RepositoryCommitList commits={state.items} isLoading={state.isPending} /> : null}
          </GithubCommits>

          <GithubPullRequests owner={owner} repo={repoName} limit={20} state="open" enabled={enabled} onStateChange={({ count }) => setTabCount('pullRequests', count)}>
            {(state) => activeTab === 'pull-requests' ? <RepositoryPullRequestList prs={state.items} isLoading={state.isPending} /> : null}
          </GithubPullRequests>

          <GithubReleases owner={owner} repo={repoName} limit={20} enabled={enabled} onStateChange={({ count }) => setTabCount('releases', count)}>
            {(state) => activeTab === 'releases' ? <RepositoryReleaseList releases={state.items} isLoading={state.isPending} /> : null}
          </GithubReleases>

          <GithubWorkflowRuns owner={owner} repo={repoName} limit={15} enabled={enabled} onStateChange={({ count }) => setTabCount('workflows', count)}>
            {(state) => activeTab === 'workflows'
              ? <RepositoryWorkflowRunPanel runs={state.items} isLoading={state.isPending} chartData={getWorkflowChartData(state.items)} />
              : null}
          </GithubWorkflowRuns>

          {activeTab === 'security' && (
            <RepositoryAdvisoryList advisories={advisories} isLoading={advisoriesLoading} />
          )}

          <GithubBranches owner={owner} repo={repoName} limit={100} enabled={enabled && activeTab === 'branches'} onStateChange={({ count }) => setTabCount('branches', count)}>
            {(state) => activeTab === 'branches' ? (
              <RepositoryBranchList
                branches={state.items}
                isLoading={state.isPending}
                branchFilter={branchFilter}
                onBranchFilterChange={setBranchFilter}
                defaultBranch={repo.default_branch}
                mergedBranchNames={mergedBranchNames}
                repoHtmlUrl={repo.html_url}
              />
            ) : null}
          </GithubBranches>
        </Box>
      </Box>
    </>
  )
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
