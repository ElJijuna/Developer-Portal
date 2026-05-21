import { createFileRoute, redirect, Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import { auth } from '../auth/proxy/firebase';
import { useAuth } from '../auth/AuthProvider';
import { AdaptiveLayout, type AdaptiveNavItem } from '@gnome-ui/layout/components/AdaptiveLayout';
import { UserCard } from '@gnome-ui/layout/components/UserCard';
import { HeaderBar } from '@gnome-ui/react/components/HeaderBar';
import { Avatar } from '@gnome-ui/react/components/Avatar';
import { GoHome, Heart, Applications, Settings, Person, Notifications, GitIssueOpened, GitPullRequest, Check, Information, Folder, Lock } from '@gnome-ui/icons';
import { GnomeProvider } from '@gnome-ui/react';
import { DeveloperPortalLogo } from '../components/DeveloperPortalLogo';
import { FC, useMemo } from 'react';
import { Box } from '@gnome-ui/react/components/Box';
import { Text } from '@gnome-ui/react/components/Text';
import { WrapBox } from '@gnome-ui/react/components/WrapBox';
import { Button } from '@gnome-ui/react/components/Button';
import { GhClientProvider } from '@api-hooks/gh';
import { GitHubClient } from 'gh-api-client';
import { AppSettingsContext, useAppSettingsState } from '../lib/appSettings';

export const Route = createFileRoute('/_authenticated')({
  async beforeLoad() {
    if (auth) await auth.authStateReady()
    const currentUser = auth?.currentUser ?? null
    if (!currentUser) {
      throw redirect({ to: '/login' })
    }
  },
  component: AuthenticatedLayout,
})

const NAV_ITEMS: AdaptiveNavItem[] = [
  { id: '/', label: 'Dashboard', icon: GoHome },
  { id: '/my-apps', label: 'My Apps', icon: Applications, group: 'Develop' },
  { id: '/cicd', label: 'CI/CD', icon: Check, group: 'Develop' },
  { id: '/repositories', label: 'Repositories', icon: Folder, group: 'Develop' },
  { id: '/advisory', label: 'Advisory', icon: Lock, group: 'Security' },
  { id: '/inbox', label: 'Inbox', icon: Notifications, group: 'Activity' },
  { id: '/issues', label: 'Issues', icon: GitIssueOpened, group: 'Activity' },
  { id: '/pull-requests', label: 'Pull Requests', icon: GitPullRequest, group: 'Activity' },
  { id: '/following', label: 'Following', icon: Heart },
  { id: '/insights', label: 'Insights', icon: Information },
  { id: '/settings', label: 'Settings', icon: Settings },
  { id: '/profile', label: 'Profile', icon: Person },
]

function AuthenticatedLayout() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const token = user?.githubToken ?? ''
  const ghClient = useMemo(() => new GitHubClient({ token: token || undefined }), [token])
  const appSettings = useAppSettingsState()
  const { settings } = appSettings

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
    <GnomeProvider colorScheme={settings.theme} accentColor={settings.accentColor}>
    <AppSettingsContext.Provider value={appSettings}>
      <GhClientProvider client={ghClient}>
        <div className="main">
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
            glass={settings.glass}
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
        </div>
      </GhClientProvider>
    </AppSettingsContext.Provider>
    </GnomeProvider>
  )
}
