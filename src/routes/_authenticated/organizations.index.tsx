import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { useGhCurrentUser, useGhUserOrganizations } from '@api-hooks/gh'
import { DashboardGrid, CounterCard, MasonryGrid, EmptyState, ErrorState } from '@gnome-ui/layout'
import { SearchBar } from '@gnome-ui/react/components/SearchBar'
import { Spinner } from '@gnome-ui/react/components/Spinner'
import { Box } from '@gnome-ui/react/components/Box'
import { Icon } from '@gnome-ui/react/components/Icon'
import { IconButton } from '@gnome-ui/react/components/IconButton'
import { Avatar } from '@gnome-ui/react/components/Avatar'
import { EntityCard } from '@gnome-ui/layout'
import { SystemUsers, Search } from '@gnome-ui/icons'
import { useAuth } from '@/auth/AuthProvider'
import { PageHeader } from '@/components/PageHeader'

export const Route = createFileRoute('/_authenticated/organizations/')({
  component: Organizations,
})

function Organizations() {
  const { user } = useAuth()
  const token = user?.githubToken ?? ''
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)

  const { data: me, isLoading: meLoading } = useGhCurrentUser({ enabled: !!token })
  const login = me?.login ?? ''

  const { data: orgsData, isLoading: orgsLoading, error } = useGhUserOrganizations(
    login,
    { per_page: 100 },
    { enabled: !!login },
  )

  const allOrgs = orgsData?.values ?? []
  const isLoading = meLoading || orgsLoading

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return allOrgs
    const q = searchQuery.toLowerCase()
    return allOrgs.filter(
      (o) => o.login.toLowerCase().includes(q) || (o.description?.toLowerCase().includes(q) ?? false),
    )
  }, [allOrgs, searchQuery])

  const searchAction = (
    <IconButton
      icon={Search}
      label="Search"
      variant="flat"
      onClick={() => setSearchOpen((v) => !v)}
    />
  )

  return (
    <>
      <PageHeader
        title="Organizations"
        segments={[{ label: 'Organizations', path: '/organizations' }]}
        actions={searchAction}
      />

      <Box orientation="vertical" spacing={12}>
        {searchOpen && (
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search organizations…"
            autoFocus
          />
        )}

        <DashboardGrid columns={{ xs: 1, sm: 2 }} gap="md">
          <CounterCard
            label="Organizations"
            value={allOrgs.length}
            icon={SystemUsers}
            loading={isLoading}
            loadingType="skeleton"
            accent
          />
        </DashboardGrid>

        {isLoading ? (
          <Box align="center" justify="center" padding={48}><Spinner /></Box>
        ) : error ? (
          <ErrorState type="network" description={error.message} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Icon icon={SystemUsers} size="lg" />}
            title={searchQuery ? 'No results' : 'No organizations'}
            description={searchQuery ? 'Try a different search term.' : 'You are not a member of any public organization.'}
          />
        ) : (
          <MasonryGrid columns={{ xs: 1, sm: 2, md: 3 }} gap="md">
            {filtered.map((org) => (
              <EntityCard
                key={org.id}
                avatar={<Avatar src={org.avatar_url} name={org.login} size="md" />}
                title={org.name ?? org.login}
                subtitle={`@${org.login}`}
                description={org.description ?? undefined}
                interactive
                onClick={() => navigate({ to: '/organizations/$org', params: { org: org.login } })}
              />
            ))}
          </MasonryGrid>
        )}
      </Box>
    </>
  )
}
