import { useGhRepoReleases, useGhRepoReleasesInfinite } from '@api-hooks/gh'
import { ErrorState } from '@gnome-ui/layout'
import type { GitHubRelease, ReleasesParams } from 'gh-api-client'
import { RepoReleasesTab } from '../../components/repo/RepoReleasesTab'
import type { GithubBlockBaseProps, GithubListCallbacks, GithubListChildren } from './types'
import { DEFAULT_LIMIT, pagedState, useListStateChange } from './utils'

export type GithubReleasesProps = GithubBlockBaseProps &
  GithubListCallbacks<GitHubRelease> &
  GithubListChildren<GitHubRelease> & {
    owner: string
    repo: string
    limit?: ReleasesParams['per_page']
    page?: ReleasesParams['page']
  }

export function GithubReleases({
  owner,
  repo,
  enabled = true,
  variant = 'page',
  limit = DEFAULT_LIMIT,
  page,
  onStateChange,
  children,
}: GithubReleasesProps) {
  const baseParams = { per_page: limit }
  const pageResult = useGhRepoReleases(owner, repo, { ...baseParams, page }, { enabled: enabled && variant === 'page' })
  const infinityResult = useGhRepoReleasesInfinite(owner, repo, baseParams, { enabled: enabled && variant === 'infinity' })
  const state = pagedState(variant, pageResult, infinityResult)
  useListStateChange(state, onStateChange)

  if (children) return children(state)
  if (state.error) return <ErrorState type="network" description={state.error.message} />

  return <RepoReleasesTab releases={state.items} isLoading={state.isPending} />
}
