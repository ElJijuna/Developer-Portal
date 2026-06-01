import { useGhRepoReleases, useGhRepoReleasesInfinite } from '@api-hooks/gh'
import { ErrorState } from '@gnome-ui/layout'
import type { GitHubRelease, ReleasesParams } from 'gh-api-client'
import { RepositoryReleaseList } from '@/components/repo/RepositoryReleaseList'
import type { GithubBlockBaseProps, GithubListCallbacks, GithubListChildren } from '@/blocks/github/types'
import { DEFAULT_LIMIT, pagedState, useListStateChange } from '@/blocks/github/utils'

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

  return <RepositoryReleaseList releases={state.items} isLoading={state.isPending} />
}
