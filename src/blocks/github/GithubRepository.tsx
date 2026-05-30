import { useGhRepo } from '@api-hooks/gh'
import { ErrorState } from '@gnome-ui/layout'
import { Box } from '@gnome-ui/react/components/Box'
import { Spinner } from '@gnome-ui/react/components/Spinner'
import type { GitHubRepository } from 'gh-api-client'
import { RepoHero } from '../../components/repo/RepoHero'
import type { GithubBlockBaseProps, GithubValueChildren } from './types'
import { valueState } from './utils'

type RepoExtras = GitHubRepository & {
  homepage?: string | null
  is_template?: boolean
  license?: { name: string } | null
}

export type GithubRepositoryProps = GithubBlockBaseProps &
  GithubValueChildren<GitHubRepository> & {
    owner: string
    repo: string
  }

export function GithubRepository({ owner, repo, enabled = true, children }: GithubRepositoryProps) {
  const result = useGhRepo(owner, repo, { enabled })
  const state = valueState(result)

  if (children) return children(state)

  if (state.isPending) {
    return <Box align="center" justify="center" padding={48}><Spinner /></Box>
  }

  if (state.error || !state.data) {
    return <ErrorState type="network" description={state.error?.message ?? 'Repository not found.'} />
  }

  return <RepoHero repo={state.data} topics={state.data.topics ?? []} repoExtras={state.data as RepoExtras} />
}
