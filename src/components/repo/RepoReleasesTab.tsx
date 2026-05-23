import { Box } from '@gnome-ui/react/components/Box'
import { Avatar } from '@gnome-ui/react/components/Avatar'
import { Icon } from '@gnome-ui/react/components/Icon'
import { Spinner } from '@gnome-ui/react/components/Spinner'
import { StatusBadge } from '@gnome-ui/react/components/StatusBadge'
import { EntityCard, EmptyState } from '@gnome-ui/layout'
import { GitTag } from '@gnome-ui/icons'
import type { GitHubRelease } from 'gh-api-client'
import { relativeTime } from '../../lib/formatting'

export type RepoReleasesTabProps = {
  releases: GitHubRelease[]
  isLoading: boolean
}

export function RepoReleasesTab({ releases, isLoading }: RepoReleasesTabProps) {
  if (isLoading) {
    return <Box align="center" justify="center" padding={48}><Spinner /></Box>
  }

  if (releases.length === 0) {
    return (
      <EmptyState
        icon={<Icon icon={GitTag} size="lg" />}
        title="No releases"
        description="No releases have been published for this repository."
      />
    )
  }

  return (
    <Box orientation="vertical" spacing={8}>
      {releases.map((release) => (
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
  )
}
