import { Box } from '@gnome-ui/react/components/Box'
import { Card } from '@gnome-ui/react/components/Card'
import { Chip } from '@gnome-ui/react/components/Chip'
import { Icon } from '@gnome-ui/react/components/Icon'
import { Text } from '@gnome-ui/react/components/Text'
import { WrapBox } from '@gnome-ui/react/components/WrapBox'
import { EmptyState, IconBadge } from '@gnome-ui/layout'
import { Folder, GitRepository } from '@gnome-ui/icons'
import type { GitHubRepository } from 'gh-api-client'
import type { LocalizedLanguage } from 'code-languages'
import { RepoContributionGraph } from './RepoContributionGraph'
import { GithubRepositoryLanguages } from '../../blocks/github'

type RepoOverviewExtras = {
  is_template?: boolean
  license?: { name: string } | null
}

export type RepositoryOverviewProps = {
  repo: GitHubRepository
  langInfo: LocalizedLanguage | null
  repoExtras: RepoOverviewExtras
}

export function RepositoryOverview({ repo, langInfo, repoExtras }: RepositoryOverviewProps) {
  return (
    <Box orientation="vertical" spacing={12}>
      <GithubRepositoryLanguages owner={repo.owner.login} repo={repo.name} />

      {repo.language ? (
        <Card padding="md">
          <Box orientation="vertical" spacing={12}>
            <Box orientation="horizontal" spacing={8} align="center">
              <IconBadge color={langInfo?.color ?? undefined}>{langInfo ? <img src={langInfo.logo} alt={langInfo.name} width={24} height={24} /> : <Icon icon={GitRepository} />}</IconBadge>
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

      <RepoContributionGraph owner={repo.owner.login} repoName={repo.name} />

      <WrapBox childSpacing={4}>
        {repo.fork && <Chip label="Fork" />}
        {repo.archived && <Chip label="Archived" />}
        {repo.disabled && <Chip label="Disabled" />}
        {repoExtras.is_template && <Chip label="Template" />}
        {repoExtras.license?.name && <Chip label={repoExtras.license.name} />}
      </WrapBox>
    </Box>
  )
}
