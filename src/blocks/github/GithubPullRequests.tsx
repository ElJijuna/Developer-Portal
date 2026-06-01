import { useGhRepoPullRequests, useGhRepoPullRequestsInfinite } from '@api-hooks/gh'
import { ErrorState } from '@gnome-ui/layout'
import type { GitHubPullRequest, PullRequestsParams } from 'gh-api-client'
import { RepositoryPullRequestList } from '@/components/repo/RepositoryPullRequestList'
import type { GithubBlockBaseProps, GithubListCallbacks, GithubListChildren } from '@/blocks/github/types'
import { DEFAULT_LIMIT, pagedState, useListStateChange } from '@/blocks/github/utils'

export type GithubPullRequestsProps = GithubBlockBaseProps &
  GithubListCallbacks<GitHubPullRequest> &
  GithubListChildren<GitHubPullRequest> & {
    owner: string
    repo: string
    limit?: PullRequestsParams['per_page']
    page?: PullRequestsParams['page']
    state?: PullRequestsParams['state']
    head?: PullRequestsParams['head']
    base?: PullRequestsParams['base']
    sort?: PullRequestsParams['sort']
    direction?: PullRequestsParams['direction']
  }

export function GithubPullRequests({
  owner,
  repo,
  enabled = true,
  variant = 'page',
  limit = DEFAULT_LIMIT,
  page,
  state: pullRequestState,
  head,
  base,
  sort,
  direction,
  onStateChange,
  children,
}: GithubPullRequestsProps) {
  const baseParams = { per_page: limit, state: pullRequestState, head, base, sort, direction }
  const pageResult = useGhRepoPullRequests(owner, repo, { ...baseParams, page }, { enabled: enabled && variant === 'page' })
  const infinityResult = useGhRepoPullRequestsInfinite(owner, repo, baseParams, { enabled: enabled && variant === 'infinity' })
  const state = pagedState(variant, pageResult, infinityResult)
  useListStateChange(state, onStateChange)

  if (children) return children(state)
  if (state.error) return <ErrorState type="network" description={state.error.message} />

  return <RepositoryPullRequestList prs={state.items} isLoading={state.isPending} />
}
