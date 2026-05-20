import { createFileRoute, useRouter } from '@tanstack/react-router'
import { PreferencesGroup } from '@gnome-ui/react/components/PreferencesGroup'
import { BoxedList } from '@gnome-ui/react/components/BoxedList'
import { ComboRow } from '@gnome-ui/react/components/ComboRow'
import { SwitchRow } from '@gnome-ui/react/components/SwitchRow'
import { ActionRow } from '@gnome-ui/react/components/ActionRow'
import { ColorPicker, GNOME_PALETTE } from '@gnome-ui/react/components/ColorPicker'
import { Button } from '@gnome-ui/react/components/Button'
import { Box } from '@gnome-ui/react/components/Box'
import { useSignOut } from '../../auth/hooks'
import { PageHeader } from '../../components/PageHeader'
import { useAppSettings } from '../../lib/appSettings'

export const Route = createFileRoute('/_authenticated/settings')({
  component: Settings,
})

function Settings() {
  const router = useRouter()
  const { mutate: signOut, isPending } = useSignOut()
  const { settings, updateSettings } = useAppSettings()

  function handleSignOut() {
    signOut(undefined, { onSuccess: () => router.navigate({ to: '/login' }) })
  }

  return (
    <>
      <PageHeader
        title="Settings"
        segments={[{ label: 'Settings', path: '/settings' }]}
      />
      <Box orientation="vertical" spacing={12}>

        <PreferencesGroup title="Appearance">
          <BoxedList>
            <ComboRow
              title="Theme"
              subtitle="Choose light, dark, or follow your system setting"
              options={[
                { value: 'system', label: 'System default' },
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
              ]}
              value={settings.theme}
              onValueChange={(theme) => updateSettings({ theme: theme as 'system' | 'light' | 'dark' })}
            />
            <ActionRow
              title="Accent color"
              subtitle="Highlight color used across the interface"
              trailing={
                <ColorPicker
                  value={settings.accentColor}
                  colors={GNOME_PALETTE}
                  allowCustom
                  onChange={(color) => updateSettings({ accentColor: color })}
                />
              }
            />
            <SwitchRow
              title="Glass effect"
              subtitle="Translucent sidebar and header"
              checked={settings.glass}
              onCheckedChange={(glass) => updateSettings({ glass })}
            />
          </BoxedList>
        </PreferencesGroup>

        <PreferencesGroup title="Language">
          <BoxedList>
            <ComboRow
              title="Language"
              options={[
                { value: 'en', label: 'English' },
                { value: 'es', label: 'Español' },
                { value: 'fr', label: 'Français' },
                { value: 'de', label: 'Deutsch' },
                { value: 'pt-BR', label: 'Português (Brasil)' },
                { value: 'zh-CN', label: '中文 (简体)' },
              ]}
              value="en"
              disabled
            />
          </BoxedList>
        </PreferencesGroup>

        <PreferencesGroup title="Account">
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
        </PreferencesGroup>

      </Box>
    </>
  )
}
