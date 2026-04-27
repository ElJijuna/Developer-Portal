import { createFileRoute } from '@tanstack/react-router'
import { Text } from '@gnome-ui/react/components/Text'
import { Box } from '@gnome-ui/react/components/Box';
import { BoxedList } from '@gnome-ui/react/components/BoxedList';
import { ActionRow } from '@gnome-ui/react/components/ActionRow';
import { Button } from '@gnome-ui/react/components/Button';
import { useRouter } from '@tanstack/react-router';
import { useSignOut } from '../../auth/hooks'


export const Route = createFileRoute('/_authenticated/settings')({
  component: Settings,
})

function Settings() {
  const router = useRouter()
  const { mutate: signOut, isPending } = useSignOut()

  function handleSignOut() {
    signOut(undefined, { onSuccess: () => router.navigate({ to: '/login' }) })
  }

  return <Box>
    <Text variant="body" color="dim">En construcción</Text>

    <Box spacing={16} style={{ padding: '1rem' }}>
      <Text variant="large-title">Settings</Text>
      <BoxedList>
        <ActionRow
          title="Sign out"
          subtitle="You will be redirected to the login page"
          trailing={
            <Button variant="flat" disabled={isPending} onClick={handleSignOut}>
              {isPending ? 'Signing out…' : 'Sign out'}
            </Button>
          }
        />
      </BoxedList>
    </Box>
  </Box>
}
