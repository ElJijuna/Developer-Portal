import { createFileRoute, redirect, Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import { auth } from '../auth/proxy/firebase';
import { useAuth } from '../auth/AuthProvider';
import { AdaptiveLayout, type AdaptiveNavItem } from '@gnome-ui/layout/components/AdaptiveLayout';
import { UserCard } from '@gnome-ui/layout/components/UserCard';
import { HeaderBar } from '@gnome-ui/react/components/HeaderBar';
import { Avatar } from '@gnome-ui/react/components/Avatar';
import { GoHome, Heart, Applications, Settings, Person } from '@gnome-ui/icons';
import { DeveloperPortalLogo } from '../components/DeveloperPortalLogo';
import { FC } from 'react';
import { Box } from '@gnome-ui/react/components/Box';
import { Text } from '@gnome-ui/react/components/Text';
import { WrapBox } from '@gnome-ui/react/components/WrapBox';
import { Button } from '@gnome-ui/react/components/Button';

export const Route = createFileRoute('/_authenticated')({
  async beforeLoad({ location }) {
    if (auth) await auth.authStateReady()
    const currentUser = auth?.currentUser ?? null
    if (!currentUser) {
      throw redirect({ to: '/login', search: { redirect: location.pathname } })
    }
  },
  component: AuthenticatedLayout,
})

const NAV_ITEMS: AdaptiveNavItem[] = [
  { id: '/', label: 'Dashboard', icon: GoHome },
  { id: '/my-apps', label: 'My Apps', icon: Applications, group: 'Develop' },
  { id: '/following', label: 'Following', icon: Heart },
  { id: '/settings', label: 'Settings', icon: Settings },
  { id: '/profile', label: 'Profile', icon: Person },
]

function AuthenticatedLayout() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  const topBar = (
    <HeaderBar
      title="Developer Portal"
      end={
        <Avatar
          name={user?.displayName ?? ''}
          src={user?.photoURL ?? undefined}
          size="sm"
        />
      }
    />
  )

  const User = (
    <UserCard
      avatarSrc={user?.photoURL ?? undefined}
      name={user?.displayName ?? ''}
      email={user?.email ?? ''}
      orientation="horizontal"
      avatarSize="sm"
    />
  )

  const UserCollapsed = (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 8 }}>
      <Avatar
        name={user?.displayName ?? ''}
        src={user?.photoURL ?? undefined}
        size="sm"
      />
    </div>
  )

  const AppLogo: FC<{ size?: number }> = ({ size }) => <Box align="center" padding={6}><DeveloperPortalLogo size={size} /></Box>;

  return (
    <AdaptiveLayout
      items={NAV_ITEMS}
      value={pathname}
      onValueChange={(id) => navigate({ to: id })}
      sidebarHeader={<AppLogo />}
      sidebarHeaderCollapsed={<AppLogo size={32} />}
      sidebarFooter={User}
      sidebarFooterCollapsed={UserCollapsed}
      sidebarPlacement="full"
      showHeaderSeparator={false}
      showFooterSeparator={false}
      showCollapseButtonSeparator={true}
      topBar={topBar}
      bgColor="white"
      bgOpacity={3}
      bgShade={3}
      footer={
        <WrapBox justify="space-between">
          <Text color="dim" variant="caption">© {new Date().getFullYear()} Developer Portal</Text>
          <WrapBox>
            <Button variant="flat" size="sm" disabled>Privacy</Button>
            <Button variant="flat" size="sm" disabled>Terms</Button>
          </WrapBox>
        </WrapBox>
      }
    >
      <Box padding={16}>
        <Outlet />
      </Box>
    </AdaptiveLayout>
  )
}
