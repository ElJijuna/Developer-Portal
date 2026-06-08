import type { ReactElement } from 'react';
import { useDockerHubRepository, useDockerHubRepositoryTags } from '@api-hooks/dh';
import { Box } from '@gnome-ui/react/components/Box';
import { Text } from '@gnome-ui/react/components/Text';
import { Badge } from '@gnome-ui/react/components/Badge';
import { Chip } from '@gnome-ui/react/components/Chip';
import { WrapBox } from '@gnome-ui/react/components/WrapBox';
import { Separator } from '@gnome-ui/react/components/Separator';
import { Skeleton } from '@gnome-ui/react/components/Skeleton';
import { CounterCard } from '@gnome-ui/layout/components/CounterCard';
import { DashboardGrid } from '@gnome-ui/layout/components/DashboardGrid';
import { useNumberFormatter } from '@gnome-ui/react/components/GnomeProvider/GnomeContext';
import { FolderDownload, Star, GitTag } from '@gnome-ui/icons';

export type DockerImageSummaryProps = {
  namespace: string
  name: string
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function DockerImageSummary({ namespace, name }: DockerImageSummaryProps): ReactElement {
  const pullsFormatter = useNumberFormatter({
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  })
  const { data: repo, isLoading: repoLoading } = useDockerHubRepository(namespace, name)
  const { data: tagsData, isLoading: tagsLoading } = useDockerHubRepositoryTags(namespace, name, { page_size: 10 })
  const tags = tagsData?.results ?? []

  return (
    <Box orientation="vertical" spacing={0}>

      {/* Header */}
      <Box orientation="vertical" spacing={8} padding={16}>
        {repoLoading ? (
          <Skeleton height={24} />
        ) : (
          <Box orientation="horizontal" spacing={6} align="center" style={{ flexWrap: 'wrap' }}>
            <Badge>{`${namespace}/${name}`}</Badge>
            {repo?.is_private && <Badge variant="warning">Private</Badge>}
            {repo?.last_updated && (
              <Text variant="caption" color="dim">Updated {formatDate(repo.last_updated)}</Text>
            )}
          </Box>
        )}
        {repoLoading ? (
          <Skeleton height={16} />
        ) : (
          <Text variant="body" color="dim">{repo?.description || 'No description.'}</Text>
        )}
      </Box>

      <Separator />

      {/* Stats */}
      <Box orientation="vertical" spacing={12} padding={16}>
        <DashboardGrid columns={{ sm: 2 }} gap="sm">
          <CounterCard
            label="Pulls"
            value={repo?.pull_count ?? 0}
            format={pullsFormatter.format}
            icon={FolderDownload}
            loading={repoLoading}
            loadingType="skeleton"
          />
          <CounterCard
            label="Stars"
            value={repo?.star_count ?? 0}
            icon={Star}
            loading={repoLoading}
            loadingType="skeleton"
          />
          <CounterCard
            label="Tags"
            value={tagsData?.count ?? 0}
            icon={GitTag}
            loading={tagsLoading}
            loadingType="skeleton"
          />
          <CounterCard
            label="Collaborators"
            value={repo?.collaborator_count ?? 0}
            icon={GitTag}
            loading={repoLoading}
            loadingType="skeleton"
          />
        </DashboardGrid>
      </Box>

      {/* Tags */}
      {(tagsLoading || tags.length > 0) && (
        <>
          <Separator />
          <Box orientation="vertical" spacing={8} padding={16}>
            <Text variant="heading">Tags</Text>
            {tagsLoading ? (
              <Skeleton height={32} />
            ) : (
              <WrapBox childSpacing={4}>
                {tags.map((tag) => (
                  <Chip
                    key={tag.id}
                    label={tag.tag_last_pushed
                      ? `${tag.name} · ${formatDate(tag.tag_last_pushed)}`
                      : tag.name}
                  />
                ))}
              </WrapBox>
            )}
          </Box>
        </>
      )}
    </Box>
  )
}
