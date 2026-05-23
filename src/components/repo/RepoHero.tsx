import { Avatar } from '@gnome-ui/react/components/Avatar'
import { Box } from '@gnome-ui/react/components/Box'
import { Button } from '@gnome-ui/react/components/Button'
import { Card } from '@gnome-ui/react/components/Card'
import { Chip } from '@gnome-ui/react/components/Chip'
import { Text } from '@gnome-ui/react/components/Text'
import { WrapBox } from '@gnome-ui/react/components/WrapBox'
import type { GitHubRepository } from 'gh-api-client'

type RepoHeroExtras = {
  homepage?: string | null
  is_template?: boolean
  license?: { name: string } | null
}

export type RepoHeroProps = {
  repo: GitHubRepository
  topics: string[]
  repoExtras: RepoHeroExtras
}

export function RepoHero({ repo, topics, repoExtras }: RepoHeroProps) {
  return (
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
          {topics.length > 0 && (
            <WrapBox childSpacing={4}>
              {topics.map((topic) => <Chip key={topic} label={topic} />)}
            </WrapBox>
          )}
        </Box>
      </Box>
    </Card>
  )
}
