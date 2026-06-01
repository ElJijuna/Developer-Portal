import { Box } from '@gnome-ui/react/components/Box'
import { Avatar } from '@gnome-ui/react/components/Avatar'
import { Icon } from '@gnome-ui/react/components/Icon'
import { Spinner } from '@gnome-ui/react/components/Spinner'
import { StatusBadge } from '@gnome-ui/react/components/StatusBadge'
import { EntityCard, EmptyState } from '@gnome-ui/layout'
import { GitPullRequest } from '@gnome-ui/icons'
import type { GitHubPullRequest } from 'gh-api-client'
import { relativeTime } from '@/lib/formatting'

export type RepositoryPullRequestListProps = {
  prs: GitHubPullRequest[]
  isLoading: boolean
}

export function RepositoryPullRequestList({ prs, isLoading }: RepositoryPullRequestListProps) {
  if (isLoading) {
    return <Box align="center" justify="center" padding={48}><Spinner /></Box>
  }

  if (prs.length === 0) {
    return (
      <EmptyState
        icon={<Icon icon={GitPullRequest} size="lg" />}
        title="No open pull requests"
        description="There are no open pull requests in this repository."
      />
    )
  }

  return (
    <Box orientation="vertical" spacing={8}>
      {prs.map((pr) => (
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
  )
}
