import { useState } from 'react'
import { Avatar } from '@gnome-ui/react/components/Avatar'
import { Button } from '@gnome-ui/react/components/Button'
import { Text } from '@gnome-ui/react/components/Text'
import { Box } from '@gnome-ui/react/components/Box'
import { Card } from '@gnome-ui/react/components/Card'
import { Chip } from '@gnome-ui/react/components/Chip'
import { Icon } from '@gnome-ui/react/components/Icon'
import { WrapBox } from '@gnome-ui/react/components/WrapBox'
import { Drawer } from '@gnome-ui/react/components/Drawer'
import { GitHub } from '@gnome-ui/icons/third-party'
import { useGhUserSocialAccounts } from '@api-hooks/gh'
import { NpmMaintanerSummary } from './NpmMaintainerSummary'

function extractNpmUsername(url: string): string | null {
  const match = url.match(/npmjs\.com\/~(.+)/)
  return match?.[1] ?? null
}

export type ProfileHeroProps = {
  login: string
  name?: string | null
  avatarUrl: string
  bio?: string | null
  location?: string | null
  company?: string | null
  htmlUrl: string
}

export function ProfileHero({ login, name, avatarUrl, bio, location, company, htmlUrl }: ProfileHeroProps) {
  const { data: socialAccounts } = useGhUserSocialAccounts(login, { enabled: !!login })
  const [npmMaintainer, setNpmMaintainer] = useState<string | null>(null)

  const metaChips = [
    location ? { label: location, href: undefined, npm: null } : null,
    company ? { label: company.replace(/^@/, ''), href: undefined, npm: null } : null,
    ...(socialAccounts?.map((a) => ({
      label: a.provider.charAt(0).toUpperCase() + a.provider.slice(1),
      href: a.provider === 'npm' ? undefined : a.url,
      npm: a.provider === 'npm' ? extractNpmUsername(a.url) : null,
    })) ?? []),
  ].filter(Boolean) as { label: string; href?: string; npm: string | null }[]

  return (
    <>
      <Card padding="lg">
        <Box orientation="vertical" spacing={16}>
          <Box spacing={16} align="start">
            <Avatar src={avatarUrl} name={login} size="xl" />
            <Box orientation="vertical" spacing={4} style={{ flex: 1 }}>
              <Text variant="title-2">{name || login}</Text>
              <Text color="dim">@{login}</Text>
              {bio && <Text style={{ marginTop: 4 }}>{bio}</Text>}
              {metaChips.length > 0 && (
                <WrapBox style={{ marginTop: 8 }}>
                  {metaChips.map((chip) => {
                    if (chip.npm) {
                      return <Chip key={chip.label} label={chip.label} onClick={() => setNpmMaintainer(chip.npm)} />
                    }
                    if (chip.href) {
                      return <Chip key={chip.label} label={chip.label} onClick={() => window.open(chip.href, '_blank', 'noopener,noreferrer')} />
                    }
                    return <Chip key={chip.label} label={chip.label} />
                  })}
                </WrapBox>
              )}
            </Box>
            <Button
              variant="flat"
              leadingIcon={<Icon icon={GitHub} />}
              onClick={() => window.open(htmlUrl, '_blank', 'noopener,noreferrer')}
            >
              View on GitHub
            </Button>
          </Box>
        </Box>
      </Card>

      <Drawer
        open={npmMaintainer !== null}
        title={npmMaintainer ?? 'npm'}
        size="wide"
        onClose={() => setNpmMaintainer(null)}
      >
        {npmMaintainer && <NpmMaintanerSummary username={npmMaintainer} />}
      </Drawer>
    </>
  )
}
