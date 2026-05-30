import type { Monitor } from 'monitor-api'
import { Dashboard, MonitorInspector } from 'monitor-ui'
import { useFloaty } from 'floaty-widget'
import { PowerProfilePerformance } from '@gnome-ui/icons'
import { Box } from '@gnome-ui/react/components/Box'
import { Button } from '@gnome-ui/react/components/Button'
import { Icon } from '@gnome-ui/react/components/Icon'

type AppMonitorControlProps = {
  monitor: Monitor
  collapsed?: boolean
}

const INSPECTOR_ID = 'developer-portal-monitor-inspector'
const DASHBOARD_ID = 'developer-portal-monitor-dashboard'

export function AppMonitorControl({ monitor, collapsed = false }: AppMonitorControlProps) {
  const floaty = useFloaty()

  function openInspector() {
    floaty.open({
      id: INSPECTOR_ID,
      title: 'App Monitor',
      component: MonitorInspector,
      props: {
        monitor,
        title: 'App Monitor',
        onClose: () => floaty.close(INSPECTOR_ID),
        onOpenDashboard: openDashboard,
      },
      size: { width: 520, height: 640 },
      position: { x: 96, y: 72 },
    }, { duplicateStrategy: 'focus' })
  }

  function openDashboard() {
    floaty.open({
      id: DASHBOARD_ID,
      title: 'Performance Dashboard',
      component: Dashboard,
      props: {
        monitor,
        title: 'Performance Dashboard',
        onBack: openInspector,
      },
      size: { width: 'min(1120px, calc(100vw - 48px))', height: 'min(760px, calc(100vh - 48px))' },
      position: { x: 72, y: 48 },
    }, { duplicateStrategy: 'focus' })
  }

  return (
    <Box align="center" padding={collapsed ? 8 : 6}>
      <Button
        variant="flat"
        size="sm"
        aria-label={collapsed ? 'Open app monitor' : undefined}
        title={collapsed ? 'Open app monitor' : undefined}
        leadingIcon={collapsed ? undefined : <Icon icon={PowerProfilePerformance} />}
        onClick={openInspector}
      >
        {collapsed ? <Icon icon={PowerProfilePerformance} /> : 'Open monitor'}
      </Button>
    </Box>
  )
}
