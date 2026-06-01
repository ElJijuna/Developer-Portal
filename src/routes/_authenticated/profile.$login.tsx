import { createFileRoute } from '@tanstack/react-router'
import { useAuth } from '@/auth/AuthProvider'
import { PageHeader } from '@/components/PageHeader'
import { ProfileContent } from '@/components/ProfilePage'

export const Route = createFileRoute('/_authenticated/profile/$login')({
  component: UserProfile,
})

function UserProfile() {
  const { login } = Route.useParams()
  const { user } = useAuth()
  const token = user?.githubToken || ''

  return (
    <>
      <PageHeader
        title={login}
        segments={[
          { label: 'Profile', path: '/profile' },
          { label: login, path: `/profile/${login}` },
        ]}
      />
      <ProfileContent login={login} token={token} />
    </>
  )
}
