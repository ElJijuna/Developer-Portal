import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { useGhAdvisoriesInfinite } from '@api-hooks/gh'
import type { GitHubAdvisory } from 'gh-api-client'
import { DashboardGrid, CounterCard, EntityCard, EmptyState, ErrorState } from '@gnome-ui/layout'
import { Box } from '@gnome-ui/react/components/Box'
import { Text } from '@gnome-ui/react/components/Text'
import { Icon } from '@gnome-ui/react/components/Icon'
import { Button } from '@gnome-ui/react/components/Button'
import { Spinner } from '@gnome-ui/react/components/Spinner'
import { SearchBar } from '@gnome-ui/react/components/SearchBar'
import { IconButton } from '@gnome-ui/react/components/IconButton'
import { ToggleGroup, ToggleGroupItem } from '@gnome-ui/react/components/ToggleGroup'
import { Chip } from '@gnome-ui/react/components/Chip'
import { Lock, Search } from '@gnome-ui/icons'
import { PageHeader } from '../../components/PageHeader'

export const Route = createFileRoute('/_authenticated/advisory')({
  component: Advisory,
})

const SEVERITY_COLOR: Record<string, string> = {
  critical: '#e01b24',
  high: '#e66100',
  medium: '#e5a50a',
  low: '#3584e4',
  unknown: '#77767b',
}

const ECOSYSTEMS = ['npm', 'pip', 'go', 'maven', 'rubygems', 'nuget', 'composer', 'rust']

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

function SeverityDot({ severity }: { severity: string }) {
  return (
    <div style={{
      width: 12,
      height: 12,
      borderRadius: '50%',
      backgroundColor: SEVERITY_COLOR[severity] ?? SEVERITY_COLOR.unknown,
      flexShrink: 0,
    }} />
  )
}

function Advisory() {
  const [severity, setSeverity] = useState('all')
  const [ecosystem, setEcosystem] = useState('all')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const params = useMemo(() => ({
    per_page: 30,
    ...(severity !== 'all' ? { severity: severity as GitHubAdvisory['severity'] } : {}),
    ...(ecosystem !== 'all' ? { ecosystem } : {}),
  }), [severity, ecosystem])

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGhAdvisoriesInfinite(params)

  const allAdvisories = useMemo(
    () => data?.pages.flatMap((p) => p.values) ?? [],
    [data],
  )

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return allAdvisories
    const q = searchQuery.toLowerCase()
    return allAdvisories.filter(
      (a) =>
        a.summary.toLowerCase().includes(q) ||
        a.ghsa_id.toLowerCase().includes(q) ||
        (a.cve_id?.toLowerCase().includes(q) ?? false),
    )
  }, [allAdvisories, searchQuery])

  const bySeverity = useMemo(() => ({
    critical: allAdvisories.filter((a) => a.severity === 'critical').length,
    high: allAdvisories.filter((a) => a.severity === 'high').length,
    medium: allAdvisories.filter((a) => a.severity === 'medium').length,
    low: allAdvisories.filter((a) => a.severity === 'low').length,
  }), [allAdvisories])

  const searchAction = (
    <>
      <ToggleGroup value={severity} onValueChange={(v) => { setSeverity(v ?? 'all'); }}>
        <ToggleGroupItem name="all" label="All" aria-label="All severities" />
        <ToggleGroupItem name="critical" label="Critical" aria-label="Critical" />
        <ToggleGroupItem name="high" label="High" aria-label="High" />
        <ToggleGroupItem name="medium" label="Medium" aria-label="Medium" />
        <ToggleGroupItem name="low" label="Low" aria-label="Low" />
      </ToggleGroup>
      <IconButton
        icon={Search}
        label="Search"
        variant="flat"
        onClick={() => setSearchOpen((v) => !v)}
      />
    </>
  )

  return (
    <>
      <PageHeader
        title="Advisory"
        segments={[{ label: 'Advisory', path: '/advisory' }]}
        actions={searchAction}
      />

      <Box orientation="vertical" spacing={18}>
        <Box orientation="horizontal" spacing={4} style={{ flexWrap: 'wrap' }}>
          {['all', ...ECOSYSTEMS].map((eco) => (
            <Chip
              key={eco}
              label={eco === 'all' ? 'All ecosystems' : eco}
              onClick={() => setEcosystem(eco)}
              style={{
                cursor: 'pointer',
                opacity: ecosystem === eco ? 1 : 0.6,
                outline: ecosystem === eco ? '2px solid var(--gnome-accent-color)' : undefined,
                borderRadius: 6,
              }}
            />
          ))}
        </Box>

        <DashboardGrid columns={{ xs: 2, sm: 2, md: 4 }} gap="md">
          <CounterCard label="Critical" value={bySeverity.critical} icon={Lock} loading={isLoading} loadingType="skeleton" color={SEVERITY_COLOR.critical} />
          <CounterCard label="High" value={bySeverity.high} icon={Lock} loading={isLoading} loadingType="skeleton" color={SEVERITY_COLOR.high} />
          <CounterCard label="Medium" value={bySeverity.medium} icon={Lock} loading={isLoading} loadingType="skeleton" color={SEVERITY_COLOR.medium} />
          <CounterCard label="Low" value={bySeverity.low} icon={Lock} loading={isLoading} loadingType="skeleton" color={SEVERITY_COLOR.low} />
        </DashboardGrid>

        <SearchBar
          open={searchOpen}
          inline
          placeholder="Search by summary, GHSA ID, or CVE ID…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClose={() => { setSearchOpen(false); setSearchQuery('') }}
          onClear={() => setSearchQuery('')}
        />

        {isLoading ? (
          <Box align="center" justify="center" padding={48}><Spinner /></Box>
        ) : error ? (
          <ErrorState type="network" description={error.message} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Icon icon={Lock} size="lg" />}
            title={searchQuery.trim() ? 'No results' : 'No advisories found'}
            description={searchQuery.trim() ? `No advisories matching "${searchQuery}"` : 'No advisories match the current filters.'}
          />
        ) : (
          <Box orientation="vertical" spacing={8}>
            <Text variant="caption" color="dim">{filtered.length} advisor{filtered.length !== 1 ? 'ies' : 'y'} loaded</Text>
            {filtered.map((advisory) => {
              const ecosystems = advisory.vulnerabilities
                .map((v) => v.package?.ecosystem)
                .filter(Boolean)
                .filter((v, i, arr) => arr.indexOf(v) === i)
                .slice(0, 3)

              const packages = advisory.vulnerabilities
                .map((v) => v.package?.name)
                .filter(Boolean)
                .filter((v, i, arr) => arr.indexOf(v) === i)
                .slice(0, 2)

              return (
                <EntityCard
                  key={advisory.ghsa_id}
                  avatar={
                    <Box align="center" justify="center" style={{ width: 36, height: 36 }}>
                      <SeverityDot severity={advisory.severity} />
                    </Box>
                  }
                  title={advisory.summary}
                  subtitle={advisory.cve_id ? `${advisory.ghsa_id} · ${advisory.cve_id}` : advisory.ghsa_id}
                  description={
                    packages.length > 0
                      ? packages.map((pkg, i) => (
                        <Chip key={i} label={pkg!} style={{ marginRight: 4 }} />
                      )) as unknown as string
                      : undefined
                  }
                  meta={[
                    ecosystems.join(', ') || 'unknown ecosystem',
                    `${advisory.cvss?.score != null ? `CVSS ${advisory.cvss.score.toFixed(1)}` : advisory.severity} · ${relativeTime(advisory.published_at)}`,
                  ]}
                  interactive
                  onClick={() => window.open(advisory.html_url, '_blank')}
                />
              )
            })}

            {hasNextPage && (
              <Box align="center" padding={8}>
                <Button
                  variant="flat"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? <Spinner /> : 'Load more'}
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </>
  )
}
