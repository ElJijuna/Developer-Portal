import { Box } from '@gnome-ui/react/components/Box'
import { Icon } from '@gnome-ui/react/components/Icon'
import { Spinner } from '@gnome-ui/react/components/Spinner'
import { StatusBadge } from '@gnome-ui/react/components/StatusBadge'
import { TabBar, TabItem } from '@gnome-ui/react/components/Tabs'
import { EntityCard, EmptyState } from '@gnome-ui/layout'
import { GitBranch, GitMerge } from '@gnome-ui/icons'
import type { GitHubBranch } from 'gh-api-client'

type BranchFilter = 'all' | 'merged' | 'unmerged'

export type RepoBranchesTabProps = {
  branches: GitHubBranch[]
  isLoading: boolean
  branchFilter: BranchFilter
  onBranchFilterChange: (filter: BranchFilter) => void
  defaultBranch: string
  mergedBranchNames: Set<string>
  repoHtmlUrl: string
}

export function RepoBranchesTab({
  branches,
  isLoading,
  branchFilter,
  onBranchFilterChange,
  defaultBranch,
  mergedBranchNames,
  repoHtmlUrl,
}: RepoBranchesTabProps) {
  const filtered = branches.filter((branch) => {
    if (branch.name === defaultBranch) return branchFilter === 'all'
    const isMerged = mergedBranchNames.has(branch.name)
    if (branchFilter === 'merged') return isMerged
    if (branchFilter === 'unmerged') return !isMerged
    return true
  })

  return (
    <Box orientation="vertical" spacing={12}>
      <TabBar aria-label="Branch filter" inline>
        <TabItem name="all" label="All" active={branchFilter === 'all'} onClick={() => onBranchFilterChange('all')} />
        <TabItem name="merged" label="Integrated (merged)" active={branchFilter === 'merged'} onClick={() => onBranchFilterChange('merged')} />
        <TabItem name="unmerged" label="Not integrated" active={branchFilter === 'unmerged'} onClick={() => onBranchFilterChange('unmerged')} />
      </TabBar>

      {isLoading ? (
        <Box align="center" justify="center" padding={48}><Spinner /></Box>
      ) : branches.length === 0 ? (
        <EmptyState icon={<Icon icon={GitBranch} size="lg" />} title="No branches" description="No branches found for this repository." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Icon icon={GitBranch} size="lg" />}
          title="No branches in this category"
          description={branchFilter === 'merged' ? 'No branches with a merged pull request found.' : 'No unmerged branches found.'}
        />
      ) : (
        <Box orientation="vertical" spacing={8}>
          {filtered.map((branch) => {
            const isDefault = branch.name === defaultBranch
            const isMerged = !isDefault && mergedBranchNames.has(branch.name)
            return (
              <EntityCard
                key={branch.name}
                avatar={
                  <Box align="center" justify="center" style={{ width: 36, height: 36 }}>
                    <Icon icon={isMerged ? GitMerge : GitBranch} size="md" />
                  </Box>
                }
                title={branch.name}
                subtitle={branch.commit.sha.slice(0, 7)}
                description={
                  isDefault
                    ? <StatusBadge variant="success">Default</StatusBadge> as unknown as string
                    : isMerged
                      ? <StatusBadge variant="neutral">Merged · can be deleted</StatusBadge> as unknown as string
                      : undefined
                }
                meta={[branch.protected ? 'Protected' : 'Not protected']}
                interactive
                onClick={() => window.open(`${repoHtmlUrl}/tree/${encodeURIComponent(branch.name)}`, '_blank')}
              />
            )
          })}
        </Box>
      )}
    </Box>
  )
}
