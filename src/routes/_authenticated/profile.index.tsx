import { createFileRoute } from '@tanstack/react-router'
import { Box } from '@gnome-ui/react/components/Box'
import { Spinner } from '@gnome-ui/react/components/Spinner'
import { useGhCurrentUser } from '@api-hooks/gh'
import { useAuth } from '@/auth/AuthProvider'
import { PageHeader } from '@/components/PageHeader'
import { ProfileContent } from '@/components/ProfilePage'

export const Route = createFileRoute('/_authenticated/profile/')({
  component: OwnProfile,
})

function OwnProfile() {
  const { user } = useAuth()
  const token = user?.githubToken || ''

  const { data: currentUser, isLoading } = useGhCurrentUser({
    enabled: !!token,
  })


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
