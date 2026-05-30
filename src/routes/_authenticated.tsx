import { createFileRoute, redirect, Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import { auth } from '../auth/proxy/firebase';
import { useAuth } from '../auth/AuthProvider';
import { AdaptiveLayout, type AdaptiveNavItem } from '@gnome-ui/layout/components/AdaptiveLayout';
import { UserCard } from '@gnome-ui/layout/components/UserCard';
import { HeaderBar } from '@gnome-ui/react/components/HeaderBar';
import { Avatar } from '@gnome-ui/react/components/Avatar';
import { Popover } from '@gnome-ui/react/components/Popover';
import { GoHome, Heart, Applications, Notifications, GitIssueOpened, GitPullRequest, Check, Information, Folder, Lock } from '@gnome-ui/icons';
import { GnomeProvider } from '@gnome-ui/react';
import { DeveloperPortalLogo } from '../components/DeveloperPortalLogo';
import { FC, useEffect, useMemo, useState } from 'react';
import { Box } from '@gnome-ui/react/components/Box';
import { Button } from '@gnome-ui/react/components/Button';
import { GhClientProvider } from '@api-hooks/gh';
import { GitHubClient } from 'gh-api-client';
import { createMonitor } from 'monitor-api';
import { AppSettingsContext, useAppSettingsState } from '../lib/appSettings';
import { PwaUpdateControl } from '../components/PwaUpdateControl';
import { useSignOut } from '../auth/hooks';
import { ApplicationFooter } from '../components/ApplicationFooter';
import { AppMonitorControl } from '../components/AppMonitorControl';

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
]

function AuthenticatedLayout() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const token = user?.githubToken ?? ''
  const ghClient = useMemo(() => new GitHubClient({ token: token || undefined }), [token])
  const monitor = useMemo(() => createMonitor({
    maxHistory: 120,
    env: import.meta.env.PROD ? 'production' : 'development',
    collectors: {
      performance: true,
      network: true,
      react: false,
      events: true,
      webVitals: true,
    },
    networkFilter: (url) =>
      !url.includes('/manifest.webmanifest') &&
      !url.includes('/sw.js') &&
      !url.includes('/workbox-'),
  }), [])
  const appSettings = useAppSettingsState()
  const { settings } = appSettings
  const { mutate: signOut, isPending: signOutPending } = useSignOut()

  useEffect(() => {
    monitor.start()
    return () => monitor.destroy()
  }, [monitor])

  function go(to: '/profile' | '/settings') {
    setUserMenuOpen(false)
    void navigate({ to })
  }

  function handleSignOut() {
    setUserMenuOpen(false)
    signOut(undefined, { onSuccess: () => void navigate({ to: '/login' }) })
  }

  const topBar = (
    <HeaderBar
      title="Developer Portal"
      end={
        <Popover
          placement="bottom"
          open={userMenuOpen}
          onClose={() => setUserMenuOpen(false)}
          onOpenChange={setUserMenuOpen}
          content={
            <UserCard
              avatarSrc={user?.photoURL ?? undefined}
              name={user?.displayName ?? user?.email ?? 'Profile'}
              email={user?.email ?? undefined}
              avatarSize="md"
              actions={[
                { label: 'Profile', onClick: () => go('/profile') },
                { label: 'Settings', onClick: () => go('/settings') },
                {
                  label: signOutPending ? 'Signing out...' : 'Sign out',
                  variant: 'destructive',
                  onClick: handleSignOut,
                },
              ]}
            />
          }
        >
          <Button
            variant="flat"
            size="sm"
            aria-label="User menu"
            style={{ minWidth: 0, padding: 4 }}
          >
            <Avatar
              name={user?.displayName ?? user?.email ?? ''}
              src={user?.photoURL ?? undefined}
              size="sm"
            />
          </Button>
        </Popover>
      }
    />
  )

  const AppLogo: FC<{ size?: number }> = ({ size }) => <Box align="center" padding={6}><DeveloperPortalLogo size={size} /></Box>;
  const sidebarFooter = (
    <Box orientation="vertical" spacing={2}>
      <AppMonitorControl monitor={monitor} />
      <PwaUpdateControl />
    </Box>
  )
  const sidebarFooterCollapsed = (
    <Box orientation="vertical" spacing={2}>
      <AppMonitorControl monitor={monitor} collapsed />
      <PwaUpdateControl collapsed />
    </Box>
  )

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
              sidebarFooter={sidebarFooter}
              sidebarFooterCollapsed={sidebarFooterCollapsed}
              sidebarPlacement="full"
              showHeaderSeparator={false}
              showFooterSeparator={false}
              showCollapseButtonSeparator={true}
              topBar={topBar}
              glass={settings.glass}
              footer={<ApplicationFooter />}
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
