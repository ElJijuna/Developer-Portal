import { createFileRoute } from '@tanstack/react-router'
import { EmptyState } from '@gnome-ui/layout'
import { Box } from '@gnome-ui/react/components/Box'
import { Button } from '@gnome-ui/react/components/Button'
import { Spinner } from '@gnome-ui/react/components/Spinner'
import { Icon } from '@gnome-ui/react/components/Icon'
import { Settings } from '@gnome-ui/icons'
import { GitHub } from '@gnome-ui/icons/third-party'
import { useGhCurrentUser } from '@api-hooks/gh'
import { useAuth } from '../../auth/AuthProvider'
import { PageHeader } from '../../components/PageHeader'
import { ProfileContent } from '../../components/ProfilePage'

export const Route = createFileRoute('/_authenticated/profile/')({
  component: OwnProfile,
})

function OwnProfile() {
  const { user } = useAuth()
  const token = user?.githubToken || ''

  const { data: currentUser, isLoading } = useGhCurrentUser({
    enabled: !!token,
  })

  if (!token) {
    return (
      <>
        <PageHeader
          title="Profile"
          segments={[{ label: 'Profile', path: '/profile' }]}
        />
        <Box padding={24}>
          <EmptyState
            icon={<Icon icon={GitHub} size="lg" />}
            title="GitHub not connected"
            description="Sign in with GitHub or add your GitHub token in Settings to view your profile."
            action={
              <Button variant="suggested" leadingIcon={<Icon icon={Settings} />}>
                Go to Settings
              </Button>
            }
          />
        </Box>
      </>
    )
  }

  if (isLoading || !currentUser?.login) {
    return (
      <>
        <PageHeader
          title="Profile"
          segments={[{ label: 'Profile', path: '/profile' }]}
        />
        <Box align="center" justify="center" padding={48}>
          <Spinner />
        </Box>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title={currentUser.name || currentUser.login}
        segments={[{ label: 'Profile', path: '/profile' }]}
      />
      <ProfileContent login={currentUser.login} token={token} />
    </>
  )
}
