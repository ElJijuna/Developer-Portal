import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import {
  useGhRepo,
  useGhRepoTopics,
  useGhRepoCommits,
  useGhRepoAdvisories,
  useGhRepoPullRequests,
  useGhRepoReleases,
  useGhRepoWorkflowRuns,
  useGhRepoBranches,
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
import { PageHeader } from '../../components/PageHeader'
import { NpmPackageSummary } from '../../components/NpmPackageSummary'
import { useRepoNpmPackages } from '../../hooks/useRepoNpmPackages'
import { RepoHero } from '../../components/repo/RepoHero'
import { RepoOverviewTab } from '../../components/repo/RepoOverviewTab'
import { RepoCommitsTab } from '../../components/repo/RepoCommitsTab'
import { RepoPullRequestsTab } from '../../components/repo/RepoPullRequestsTab'
import { RepoReleasesTab } from '../../components/repo/RepoReleasesTab'
import { RepoWorkflowsTab } from '../../components/repo/RepoWorkflowsTab'
import { RepoSecurityTab } from '../../components/repo/RepoSecurityTab'
import { RepoBranchesTab } from '../../components/repo/RepoBranchesTab'
import { useAuth } from '../../auth/AuthProvider'
import { Badge, Skeleton } from '@gnome-ui/react'

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

  const enabled = !!owner && !!repoName && !!token;

  const { data: repo, isLoading: repoLoading, error: repoError } = useGhRepo(owner, repoName, { enabled });
  const { data: topics } = useGhRepoTopics(owner, repoName, { enabled });
  const { data: commitsData, isLoading: commitsLoading } = useGhRepoCommits(owner, repoName, { per_page: 10 }, { enabled });
  const { data: prsData, isLoading: prsLoading } = useGhRepoPullRequests(owner, repoName, { state: 'open', per_page: 20 }, { enabled });
  const { data: releasesData, isLoading: releasesLoading } = useGhRepoReleases(owner, repoName, { per_page: 20 }, { enabled });
  const { data: workflowsData, isLoading: workflowsLoading } = useGhRepoWorkflowRuns(owner, repoName, { per_page: 15 }, { enabled });
  const { data: advisoriesData, isLoading: advisoriesLoading } = useGhRepoAdvisories(owner, repoName, {}, { enabled });
  const { data: branchesData, isLoading: branchesLoading } = useGhRepoBranches(owner, repoName, { per_page: 100 }, { enabled: enabled && activeTab === 'branches' });
  const { data: mergedPrsData } = useGhRepoPullRequests(owner, repoName, { state: 'closed', per_page: 100 }, { enabled: enabled && activeTab === 'branches' });
  const { data: gitTreeData } = useGhRepoGitTree(owner, repoName, repo?.default_branch ?? 'main', { recursive: '1' }, { enabled: !repoLoading });
  const commits = commitsData?.values ?? [];
  const prs = prsData?.values ?? [];
  const releases = releasesData?.values ?? [];
  const runs = workflowsData?.workflow_runs ?? [];
  const advisories = advisoriesData?.values ?? [];
  const branches = branchesData?.values ?? [];
  const mergedPrs = mergedPrsData?.values ?? [];
  const totalFiles = gitTreeData?.tree.length ?? 0;

  const npmInfo = useRepoNpmPackages(owner, repoName, repo?.default_branch ?? 'main');

  const mergedBranchNames = useMemo(
    () => new Set(mergedPrs.filter((pr) => pr.merged_at !== null).map((pr) => pr.head.ref)),
    [mergedPrs],
  )

  const workflowChartData = useMemo(() => {
    const chronological = [...runs].reverse()
    const completed = chronological.filter((r) => r.run_started_at && r.conclusion !== null)
    const durations = completed.map((r) =>
      Math.max(1, Math.round((new Date(r.updated_at).getTime() - new Date(r.run_started_at!).getTime()) / 1000))
    )
    const outcomes = chronological.map((r) => r.conclusion === 'success' ? 1 : 0)
    const finishedRuns = runs.filter((r) => r.conclusion !== null)
    const successRate = finishedRuns.length > 0
      ? finishedRuns.filter((r) => r.conclusion === 'success').length / finishedRuns.length
      : 0
    const avgDuration = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0
    return { durations, outcomes, successRate, avgDuration }
  }, [runs])

  const langInfo = useLanguage(repo?.language)

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
            <TabItem name="commits" count={commits.length} label="Commits" active={activeTab === 'commits'} onClick={() => setActiveTab('commits')} />
            <TabItem name="pull-requests" count={prs.length} label="Pull Requests" active={activeTab === 'pull-requests'} onClick={() => setActiveTab('pull-requests')} />
            <TabItem name="releases" count={releases.length} label="Releases" active={activeTab === 'releases'} onClick={() => setActiveTab('releases')} />
            <TabItem name="workflows" count={runs.length} label="Workflows" active={activeTab === 'workflows'} onClick={() => setActiveTab('workflows')} icon={GitWorkflow} />
            <TabItem name="security" count={advisories.length} label="Security" active={activeTab === 'security'} onClick={() => setActiveTab('security')} icon={Lock} />
            <TabItem name="branches" count={branches.length} label="Branches" active={activeTab === 'branches'} onClick={() => setActiveTab('branches')} icon={GitBranch} />
          </TabBar>

          {activeTab === 'overview' && (
            <RepoOverviewTab repo={repo} langInfo={langInfo} repoExtras={repoExtras} />
          )}
          {activeTab === 'commits' && (
            <RepoCommitsTab commits={commits} isLoading={commitsLoading} />
          )}
          {activeTab === 'pull-requests' && (
            <RepoPullRequestsTab prs={prs} isLoading={prsLoading} />
          )}
          {activeTab === 'releases' && (
            <RepoReleasesTab releases={releases} isLoading={releasesLoading} />
          )}
          {activeTab === 'workflows' && (
            <RepoWorkflowsTab runs={runs} isLoading={workflowsLoading} chartData={workflowChartData} />
          )}
          {activeTab === 'security' && (
            <RepoSecurityTab advisories={advisories} isLoading={advisoriesLoading} />
          )}
          {activeTab === 'branches' && (
            <RepoBranchesTab
              branches={branches}
              isLoading={branchesLoading}
              branchFilter={branchFilter}
              onBranchFilterChange={setBranchFilter}
              defaultBranch={repo.default_branch}
              mergedBranchNames={mergedBranchNames}
              repoHtmlUrl={repo.html_url}
            />
          )}
        </Box>
      </Box>
    </>
  )
}
