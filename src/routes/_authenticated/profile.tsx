import { createFileRoute } from '@tanstack/react-router';
import { DashboardGrid } from '@gnome-ui/layout';
import { PageHeader } from '../../components/PageHeader';

export const Route = createFileRoute('/_authenticated/profile')({
  component: Profile,
})

function Profile() {
  return (
    <>
      <PageHeader
        title="Profile"
        segments={[{ label: 'Profile', path: '/profile' }]}
      />
      <DashboardGrid>
      </DashboardGrid>
    </>
  )
}
