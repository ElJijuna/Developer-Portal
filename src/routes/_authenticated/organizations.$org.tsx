import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useGhOrg, useGhOrgRepos, useGhOrgMembers } from '@api-hooks/gh'
import { MasonryGrid, EmptyState, ErrorState } from '@gnome-ui/layout'
import { TabBar, TabItem } from '@gnome-ui/react/components/Tabs'
import { Spinner } from '@gnome-ui/react/components/Spinner'
import { Box } from '@gnome-ui/react/components/Box'
import { Text } from '@gnome-ui/react/components/Text'
import { Avatar } from '@gnome-ui/react/components/Avatar'
import { Icon } from '@gnome-ui/react/components/Icon'
import { Card } from '@gnome-ui/react/components/Card'
import { GitRepository, SystemUsers, Folder } from '@gnome-ui/icons'
import { useAuth } from '@/auth/AuthProvider'
import { PageHeader } from '@/components/PageHeader'
import { RepositoryCard } from '@/components/RepositoryCard'
import { UserProfileSummaryCard } from '@/components/UserProfileSummaryCard'

export const Route = createFileRoute('/_authenticated/organizations/$org')({
  component: OrgDetail,
})

type OrgTab = 'repositories' | 'members'

function OrgDetail() {
  const { org: orgName } = Route.useParams()
  const { user } = useAuth()
  const token = user?.githubToken ?? ''
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<OrgTab>('repositories')

  const enabled = !!token && !!orgName

  const { data: org, isLoading: orgLoading, error: orgError } = useGhOrg(orgName, { enabled })
  const { data: reposData, isLoading: reposLoading } = useGhOrgRepos(
    orgName,
    { per_page: 30, sort: 'pushed' },
    { enabled },
  )
  const { data: membersData, isLoading: membersLoading } = useGhOrgMembers(
    orgName,
    { per_page: 30 },
    { enabled },
  )

  const repos = reposData?.values ?? []
  const members = membersData?.values ?? []

  if (orgLoading) {
    return <Box align="center" justify="center" padding={48}><Spinner /></Box>
  }

  if (orgError || !org) {
    return <ErrorState type="network" description={orgError?.message ?? 'Organization not found.'} />
  }

  return (
    <>
      <PageHeader
        title={org.name ?? org.login}
        segments={[
          { label: 'Organizations', path: '/organizations' },
          { label: org.login, path: `/organizations/${org.login}` },
        ]}
      />

      <Box orientation="vertical" spacing={16}>
        <Card padding="md">
          <Box orientation="horizontal" spacing={16} align="center">
            <Avatar src={org.avatar_url} name={org.login} size="xl" />
            <Box orientation="vertical" spacing={4} style={{ flex: 1 }}>
              <Text variant="heading" style={{ fontWeight: 700 }}>{org.name ?? org.login}</Text>
              <Text variant="caption" color="dim">@{org.login}</Text>
              {org.description && <Text variant="body" color="dim">{org.description}</Text>}
              <Box orientation="horizontal" spacing={16} style={{ marginTop: 8 }}>
                <Box orientation="horizontal" spacing={4} align="center">
                  <Icon icon={Folder} size="sm" />
                  <Text variant="caption">{org.public_repos} repos</Text>
                </Box>
                <Box orientation="horizontal" spacing={4} align="center">
                  <Icon icon={SystemUsers} size="sm" />
                  <Text variant="caption">{members.length} members</Text>
                </Box>
              </Box>
            </Box>
          </Box>
        </Card>

        <TabBar aria-label="Organization tabs" inline>
          <TabItem
            label={`Repositories${repos.length ? ` (${repos.length})` : ''}`}
            active={activeTab === 'repositories'}
            onClick={() => setActiveTab('repositories')}
          />
          <TabItem
            label={`Members${members.length ? ` (${members.length})` : ''}`}
            active={activeTab === 'members'}
            onClick={() => setActiveTab('members')}
          />
        </TabBar>

        {activeTab === 'repositories' && (
          reposLoading ? (
            <Box align="center" justify="center" padding={48}><Spinner /></Box>
          ) : repos.length === 0 ? (
            <EmptyState
              icon={<Icon icon={GitRepository} size="lg" />}
              title="No repositories"
              description="This organization has no public repositories."
            />
          ) : (
            <MasonryGrid columns={{ xs: 1, sm: 2, md: 3 }} gap="md">
              {repos.map((repo) => (
                <RepositoryCard
                  key={repo.id}
                  name={repo.name}
                  description={repo.description ?? ''}
                  language={repo.language ?? ''}
                  stars={repo.stargazers_count}
                  forks={repo.forks_count}
                  openIssues={repo.open_issues_count}
                  pushedAt={repo.pushed_at ?? repo.updated_at}
                  isPrivate={repo.private}
                  onClick={() => navigate({ to: '/repositories/$owner/$repo', params: { owner: org.login, repo: repo.name } })}
                />
              ))}
            </MasonryGrid>
          )
        )}

        {activeTab === 'members' && (
          membersLoading ? (
            <Box align="center" justify="center" padding={48}><Spinner /></Box>
          ) : members.length === 0 ? (
            <EmptyState
              icon={<Icon icon={SystemUsers} size="lg" />}
              title="No public members"
              description="This organization has no public members."
            />
          ) : (
            <MasonryGrid columns={{ xs: 1, sm: 2, md: 3 }} gap="md">
              {members.map((member) => (
                <UserProfileSummaryCard
                  key={member.id}
                  name={member.login}
                  username={member.login}
                  avatarSrc={member.avatar_url}
                  onClick={(username) => navigate({ to: '/profile/$login', params: { login: username } })}
                />
              ))}
            </MasonryGrid>
          )
        )}
      </Box>
    </>
  )
}
