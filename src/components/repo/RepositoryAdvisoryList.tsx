import { Box } from '@gnome-ui/react/components/Box'
import { Icon } from '@gnome-ui/react/components/Icon'
import { Spinner } from '@gnome-ui/react/components/Spinner'
import { EntityCard, EmptyState } from '@gnome-ui/layout'
import { Lock } from '@gnome-ui/icons'
import type { GitHubRepositoryAdvisory } from 'gh-api-client'
import { SEVERITY_COLOR, relativeTime } from '../../lib/formatting'

export type RepositoryAdvisoryListProps = {
  advisories: GitHubRepositoryAdvisory[]
  isLoading: boolean
}

export function RepositoryAdvisoryList({ advisories, isLoading }: RepositoryAdvisoryListProps) {
  if (isLoading) {
    return <Box align="center" justify="center" padding={48}><Spinner /></Box>
  }

  if (advisories.length === 0) {
    return (
      <EmptyState
        icon={<Icon icon={Lock} size="lg" />}
        title="No known vulnerabilities"
        description="No security advisories have been published for this repository."
      />
    )
  }

  return (
    <Box orientation="vertical" spacing={8}>
      {advisories.map((adv) => (
        <EntityCard
          key={adv.ghsa_id}
          avatar={
            <Box align="center" justify="center" style={{ width: 36, height: 36 }}>
              <div style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: SEVERITY_COLOR[adv.severity] ?? SEVERITY_COLOR.unknown,
              }} />
            </Box>
          }
          title={adv.summary}
          subtitle={adv.cve_id ? `${adv.ghsa_id} · ${adv.cve_id}` : adv.ghsa_id}
          meta={[adv.severity, relativeTime(adv.published_at ?? adv.updated_at)]}
          interactive
          onClick={() => window.open(adv.html_url, '_blank')}
        />
      ))}
    </Box>
  )
}
