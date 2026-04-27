import { createFileRoute, redirect, Outlet, Link } from '@tanstack/react-router'
import { auth } from '../auth/proxy/firebase'

export const Route = createFileRoute('/_authenticated')({
  async beforeLoad({ location }) {
    if (auth) await auth.authStateReady()
    const currentUser = auth?.currentUser ?? null
    if (!currentUser) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  return (
    <>
      <nav style={{ display: 'flex', gap: '1rem', padding: '1rem' }}>
        <Link to="/" activeOptions={{ exact: true }} activeProps={{ style: { fontWeight: 'bold' } }}>
          Home
        </Link>
        <Link to="/following" activeProps={{ style: { fontWeight: 'bold' } }}>
          Following
        </Link>
        <Link to="/my-apps" activeProps={{ style: { fontWeight: 'bold' } }}>
          My Apps
        </Link>
        <Link to="/settings" activeProps={{ style: { fontWeight: 'bold' } }}>
          Settings
        </Link>
      </nav>
      <hr />
      <Outlet />
    </>
  )
}
