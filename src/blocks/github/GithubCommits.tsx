import { useGhRepoCommits, useGhRepoCommitsInfinite } from '@api-hooks/gh'
import { ErrorState } from '@gnome-ui/layout'
import type { CommitsParams, GitHubCommit } from 'gh-api-client'
import { RepoCommitsTab } from '../../components/repo/RepoCommitsTab'
import type { GithubBlockBaseProps, GithubListCallbacks, GithubListChildren } from './types'
import { DEFAULT_LIMIT, pagedState, useListStateChange } from './utils'

export type GithubCommitsProps = GithubBlockBaseProps &
  GithubListCallbacks<GitHubCommit> &
  GithubListChildren<GitHubCommit> & {
    owner: string
    repo: string
    limit?: CommitsParams['per_page']
    page?: CommitsParams['page']
    author?: CommitsParams['author']
    sha?: CommitsParams['sha']
    path?: CommitsParams['path']
    committer?: CommitsParams['committer']
    since?: CommitsParams['since']
    until?: CommitsParams['until']
  }

export function GithubCommits({
  owner,
  repo,
  enabled = true,
  variant = 'page',
  limit = DEFAULT_LIMIT,
  page,
  author,
  sha,
  path,
  committer,
  since,
  until,
  onStateChange,
  children,
}: GithubCommitsProps) {
  const baseParams = { per_page: limit, author, sha, path, committer, since, until }
  const pageResult = useGhRepoCommits(owner, repo, { ...baseParams, page }, { enabled: enabled && variant === 'page' })
  const infinityResult = useGhRepoCommitsInfinite(owner, repo, baseParams, { enabled: enabled && variant === 'infinity' })
  const state = pagedState(variant, pageResult, infinityResult)
  useListStateChange(state, onStateChange)

  if (children) return children(state)
  if (state.error) return <ErrorState type="network" description={state.error.message} />

  return <RepoCommitsTab commits={state.items} isLoading={state.isPending} />
}
