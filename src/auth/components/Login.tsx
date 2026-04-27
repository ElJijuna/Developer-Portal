import { useRouter } from '@tanstack/react-router';
import { Spinner } from '@gnome-ui/react/components/Spinner';
import { Icon } from '@gnome-ui/react/components/Icon';
import { GitHub } from '@gnome-ui/icons/third-party';
import { useAuth } from '../AuthProvider';
import { useSignIn } from '../hooks';
import { Button } from '@gnome-ui/react/components/Button';
import { ActionRow } from '@gnome-ui/react/components/ActionRow';
import { Card } from '@gnome-ui/react/components/Card';
import { Box } from '@gnome-ui/react/components/Box';
import { Text } from '@gnome-ui/react/components/Text';
import { WrapBox } from '@gnome-ui/react/components/WrapBox';
import { BoxedList } from '@gnome-ui/react/components/BoxedList';
import { IconBadge } from '@gnome-ui/layout';
import { DeveloperPortalLogo } from '../../components/DeveloperPortalLogo';

export function Login() {
  const router = useRouter()
  const { authLoading } = useAuth()
  const { mutate: signIn, isPending, isError } = useSignIn()

  function handleSignIn() {
    signIn(undefined, {
      onSuccess: () => router.navigate({ to: '/' }),
    })
  }

  if (authLoading) return null

  return (
    <WrapBox justify="center" align="center" style={{ height: '100vh', overflow: 'hidden' }}>
      <Card>
        <Box spacing={16}>
          <Box align="center" spacing={8}>
            <DeveloperPortalLogo size={64} />
            <Text variant="large-title">
              Developer Portal
            </Text>
            <Text variant="body" color="dim">
              Track packages, maintainers and vulnerabilities across ecosystems
            </Text>
          </Box>
          <BoxedList title="Providers">
            <ActionRow title="Sign in with GitHub" subtitle={isError ? 'Sign in failed — try again' : 'Connect your GitHub account to get started'} leading={<IconBadge><Icon icon={GitHub} size="md" /></IconBadge>} trailing={
              <Button
                onClick={handleSignIn}
                disabled={isPending}
                variant="flat"
              >
                {isPending ? <Spinner size="sm" label="Loading" /> : 'Connect'}
              </Button>
            } />
          </BoxedList>

          <Text variant="caption" color="dim">
            You can connect more accounts later in Settings
          </Text>
        </Box>
      </Card>
    </WrapBox>
  )
}
