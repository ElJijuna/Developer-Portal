import { Box } from '@gnome-ui/react/components/Box'
import { Avatar } from '@gnome-ui/react/components/Avatar'
import { Icon } from '@gnome-ui/react/components/Icon'
import { Spinner } from '@gnome-ui/react/components/Spinner'
import { EntityCard, EmptyState } from '@gnome-ui/layout'
import { Folder } from '@gnome-ui/icons'
import type { GitHubCommit } from 'gh-api-client'
import { relativeTime } from '../../lib/formatting'

export type RepositoryCommitListProps = {
  commits: GitHubCommit[]
  isLoading: boolean
}

export function RepositoryCommitList({ commits, isLoading }: RepositoryCommitListProps) {
  if (isLoading) {
    return <Box align="center" justify="center" padding={48}><Spinner /></Box>
  }

  if (commits.length === 0) {
    return <EmptyState icon={<Icon icon={Folder} size="lg" />} title="No commits" description="No commits found." />
  }

  return (
    <Box orientation="vertical" spacing={8}>
      {commits.map((commit) => (
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
  )
}
