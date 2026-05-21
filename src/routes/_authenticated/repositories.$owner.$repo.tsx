import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useGhRepo, useGhRepoTopics, useGhRepoCommits, useGhRepoAdvisories } from '@api-hooks/gh'
import type { GitHubCommit, GitHubRepositoryAdvisory } from 'gh-api-client'
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
import { Folder, Lock, Warning, Share, Star } from '@gnome-ui/icons'
import { PageHeader } from '../../components/PageHeader'
import { useAuth } from '../../auth/AuthProvider'

export const Route = createFileRoute('/_authenticated/repositories/$owner/$repo')({
  component: RepoDetail,
})

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
  const [activeTab, setActiveTab] = useState('overview')
  const [langInfo, setLangInfo] = useState<LocalizedLanguage | null>(null)

  const enabled = !!owner && !!repoName

  const { data: repo, isLoading: repoLoading, error: repoError } = useGhRepo(owner, repoName, { enabled })
  const { data: topics } = useGhRepoTopics(owner, repoName, { enabled })
  const { data: commitsData, isLoading: commitsLoading } = useGhRepoCommits(
    owner,
    repoName,
    { per_page: 10 },
    { enabled },
  )
  const { data: advisoriesData, isLoading: advisoriesLoading } = useGhRepoAdvisories(
    owner,
    repoName,
    {},
    { enabled: enabled && !!token },
  )

  const commits: GitHubCommit[] = commitsData?.values ?? []
  const advisories: GitHubRepositoryAdvisory[] = advisoriesData?.values ?? []

  useEffect(() => {
    if (!repo?.language) return
    const rawSlug = GH_LANG_TO_SLUG[repo.language] ?? repo.language.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    api.language(rawSlug as LanguageSlug).locale('en-US').load()
      .then(setLangInfo)
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

  return (
    <>
      <PageHeader
        title={repo.name}
        segments={[
          { label: 'Repositories', path: '/repositories' },
          { label: `${owner}/${repoName}`, path: `/repositories/${owner}/${repoName}` },
        ]}
        actions={actions}
      />

      <Box orientation="vertical" spacing={16}>
        {/* Hero */}
        <Card padding="lg">
          <Box orientation="horizontal" spacing={16} align="flex-start">
            <Avatar
              src={repo.owner.avatar_url}
              name={repo.owner.login}
              size="lg"
            />
            <Box orientation="vertical" spacing={8} style={{ flex: 1, minWidth: 0 }}>
              <Text variant="title-2" style={{ fontWeight: 700, wordBreak: 'break-word' }}>
                {repo.full_name}
              </Text>
              {repo.description && (
                <Text variant="body" color="dim">{repo.description}</Text>
              )}
              {repo.homepage && (
                <Button
                  variant="flat"
                  size="sm"
                  onClick={() => window.open(repo.homepage!, '_blank')}
                >
                  {repo.homepage}
                </Button>
              )}
              {topics && topics.length > 0 && (
                <WrapBox spacing={4}>
                  {topics.map((topic) => (
                    <Chip key={topic} label={topic} />
                  ))}
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
          <CounterCard label="Open Issues" value={repo.open_issues_count} icon={Warning} color={repo.open_issues_count > 0 ? '#e5a50a' : undefined} />
        </DashboardGrid>

        {/* Tabs */}
        <Box orientation="vertical" spacing={12}>
          <TabBar value={activeTab} onValueChange={setActiveTab}>
            <TabItem name="overview" label="Overview" />
            <TabItem name="commits" label="Commits" />
            <TabItem name="security" label={`Security${advisories.length > 0 ? ` (${advisories.length})` : ''}`} />
          </TabBar>

          {/* Overview tab */}
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
                            <WrapBox spacing={4}>
                              {langInfo.extensions.map((ext) => (
                                <Chip key={ext} label={ext} />
                              ))}
                            </WrapBox>
                          </Box>
                        )}

                        {langInfo.paradigms.length > 0 && (
                          <Box orientation="vertical" spacing={4}>
                            <Text variant="caption" color="dim">Paradigms</Text>
                            <WrapBox spacing={4}>
                              {langInfo.paradigms.map((p) => (
                                <Chip key={p} label={p} />
                              ))}
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

              <Box orientation="horizontal" spacing={8} style={{ flexWrap: 'wrap' }}>
                {repo.fork && <Chip label="Fork" />}
                {repo.archived && <Chip label="Archived" />}
                {repo.disabled && <Chip label="Disabled" />}
                {repo.is_template && <Chip label="Template" />}
                {repo.license?.name && <Chip label={repo.license.name} />}
              </Box>
            </Box>
          )}

          {/* Commits tab */}
          {activeTab === 'commits' && (
            <Box orientation="vertical" spacing={8}>
              {commitsLoading ? (
                <Box align="center" justify="center" padding={48}><Spinner /></Box>
              ) : commits.length === 0 ? (
                <EmptyState
                  icon={<Icon icon={Folder} size="lg" />}
                  title="No commits"
                  description="No commits found for this repository."
                />
              ) : (
                commits.map((commit) => (
                  <EntityCard
                    key={commit.sha}
                    avatar={
                      commit.author?.avatar_url
                        ? <Avatar src={commit.author.avatar_url} name={commit.author.login} size="sm" />
                        : <Icon icon={Folder} size="md" />
                    }
                    title={commit.commit.message.split('\n')[0]}
                    subtitle={commit.sha.slice(0, 7)}
                    meta={[
                      commit.commit.author.name,
                      relativeTime(commit.commit.author.date),
                    ]}
                    interactive
                    onClick={() => window.open(commit.html_url, '_blank')}
                  />
                ))
              )}
            </Box>
          )}

          {/* Security tab */}
          {activeTab === 'security' && (
            <Box orientation="vertical" spacing={8}>
              {advisoriesLoading ? (
                <Box align="center" justify="center" padding={48}><Spinner /></Box>
              ) : advisories.length === 0 ? (
                <EmptyState
                  icon={<Icon icon={Lock} size="lg" />}
                  title="No known vulnerabilities"
                  description="No security advisories have been published for this repository."
                />
              ) : (
                advisories.map((adv) => (
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
                ))
              )}
            </Box>
          )}
        </Box>
      </Box>
    </>
  )
}
