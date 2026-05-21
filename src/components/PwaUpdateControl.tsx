import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { Button } from '@gnome-ui/react/components/Button'
import { Box } from '@gnome-ui/react/components/Box'
import { Icon } from '@gnome-ui/react/components/Icon'
import { Spinner } from '@gnome-ui/react/components/Spinner'
import { Refresh, SoftwareUpdateAvailable } from '@gnome-ui/icons'

type PwaUpdateControlProps = {
  collapsed?: boolean
}

export function PwaUpdateControl({ collapsed = false }: PwaUpdateControlProps) {
  const [checking, setChecking] = useState(false)
  const [upToDate, setUpToDate] = useState(false)
  const [unsupported, setUnsupported] = useState(false)
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  useEffect(() => {
    if (!upToDate) return
    const timeout = window.setTimeout(() => setUpToDate(false), 3000)
    return () => window.clearTimeout(timeout)
  }, [upToDate])

  async function handleUpdate() {
    if (needRefresh) {
      setNeedRefresh(false)
      await updateServiceWorker(true)
      return
    }

    if (!('serviceWorker' in navigator)) {
      setUnsupported(true)
      return
    }

    setChecking(true)
    setUpToDate(false)
    setUnsupported(false)

    try {
      const registration = await navigator.serviceWorker.getRegistration()
      await registration?.update()
      if (!needRefresh) setUpToDate(true)
    } finally {
      setChecking(false)
    }
  }

  const label = needRefresh
    ? 'Install update'
    : checking
      ? 'Checking...'
      : unsupported
        ? 'Updates unavailable'
        : upToDate
          ? 'App is up to date'
          : 'Check for updates'

  const icon = needRefresh ? SoftwareUpdateAvailable : Refresh

  return (
    <Box align="center" padding={collapsed ? 8 : 6}>
      <Button
        variant="flat"
        size="sm"
        disabled={checking || unsupported}
        onClick={handleUpdate}
        leadingIcon={collapsed ? undefined : checking ? <Spinner size="sm" /> : <Icon icon={icon} />}
        aria-label={collapsed ? label : undefined}
        title={collapsed ? label : undefined}
      >
        {collapsed ? (checking ? <Spinner size="sm" /> : <Icon icon={icon} />) : label}
      </Button>
    </Box>
  )
}
