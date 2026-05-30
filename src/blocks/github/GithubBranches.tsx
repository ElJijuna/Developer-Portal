import { useGhRepoBranches, useGhRepoBranchesInfinite } from '@api-hooks/gh'
import { EntityCard, EmptyState, ErrorState } from '@gnome-ui/layout'
import { GitBranch } from '@gnome-ui/icons'
import { Box } from '@gnome-ui/react/components/Box'
import { Icon } from '@gnome-ui/react/components/Icon'
import { Spinner } from '@gnome-ui/react/components/Spinner'
import { StatusBadge } from '@gnome-ui/react/components/StatusBadge'
import type { BranchesParams, GitHubBranch } from 'gh-api-client'
import type { GithubBlockBaseProps, GithubListCallbacks, GithubListChildren } from './types'
import { DEFAULT_LIMIT, pagedState, useListStateChange } from './utils'

export type GithubBranchesProps = GithubBlockBaseProps &
  GithubListCallbacks<GitHubBranch> &
  GithubListChildren<GitHubBranch> & {
    owner: string
    repo: string
    limit?: BranchesParams['per_page']
    page?: BranchesParams['page']
    protected?: BranchesParams['protected']
  }

export function GithubBranches({
  owner,
  repo,
  enabled = true,
  variant = 'page',
  limit = DEFAULT_LIMIT,
  page,
  protected: protectedBranch,
  onStateChange,
  children,
}: GithubBranchesProps) {
  const baseParams = { per_page: limit, protected: protectedBranch }
  const pageResult = useGhRepoBranches(owner, repo, { ...baseParams, page }, { enabled: enabled && variant === 'page' })
  const infinityResult = useGhRepoBranchesInfinite(owner, repo, baseParams, { enabled: enabled && variant === 'infinity' })
  const state = pagedState(variant, pageResult, infinityResult)
  useListStateChange(state, onStateChange)

  if (children) return children(state)
  if (state.error) return <ErrorState type="network" description={state.error.message} />
  if (state.isPending) return <Box align="center" justify="center" padding={48}><Spinner /></Box>
  if (state.items.length === 0) {
    return <EmptyState icon={<Icon icon={GitBranch} size="lg" />} title="No branches" description="No branches found for this repository." />
  }

  return (
    <Box orientation="vertical" spacing={8}>
      {state.items.map((branch) => (
        <EntityCard
          key={branch.name}
          avatar={<Icon icon={GitBranch} size="md" />}
          title={branch.name}
          subtitle={branch.commit.sha.slice(0, 7)}
          description={branch.protected ? <StatusBadge variant="success">Protected</StatusBadge> as unknown as string : undefined}
          interactive
          onClick={() => window.open(`https://github.com/${owner}/${repo}/tree/${encodeURIComponent(branch.name)}`, '_blank')}
        />
      ))}
    </Box>
  )
}
