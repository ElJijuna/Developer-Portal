import { createFileRoute } from '@tanstack/react-router';
import { DashboardGrid } from '@gnome-ui/layout';
import { PageHeader } from '../../components/PageHeader';

export const Route = createFileRoute('/_authenticated/my-apps')({
  component: MyApps,
})

function MyApps() {
  return (
    <>
      <PageHeader
        title="My Apps"
        segments={[{ label: 'My Apps', path: '/my-apps' }]}
      />
      <DashboardGrid>
      </DashboardGrid>
    </>
  )
}
