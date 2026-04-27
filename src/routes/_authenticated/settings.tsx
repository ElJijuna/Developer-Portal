import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useSignOut } from '../../auth/hooks'
import { ActionRow, Box, BoxedList, Text } from '@gnome-ui/react'
import { Button } from '@gnome-ui/react/components/Button'

export const Route = createFileRoute('/_authenticated/settings')({
  component: Settings,
})

function Settings() {
  const router = useRouter()
  const { mutate: signOut, isPending } = useSignOut()

  function handleSignOut() {
    signOut(undefined, { onSuccess: () => router.navigate({ to: '/login' }) })
  }

  return (
    <main>
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
    </main>
  )
}
