import { createFileRoute, useRouter } from '@tanstack/react-router';
import { DashboardGrid } from '@gnome-ui/layout';
import { BoxedList } from '@gnome-ui/react/components/BoxedList';
import { ActionRow } from '@gnome-ui/react/components/ActionRow';
import { Button } from '@gnome-ui/react/components/Button';
import { useSignOut } from '../../auth/hooks';
import { PageHeader } from '../../components/PageHeader';

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
    <>
      <PageHeader
        title="Settings"
        segments={[{ label: 'Settings', path: '/settings' }]}
      />
      <DashboardGrid>
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
      </DashboardGrid>
    </>
  )
}
