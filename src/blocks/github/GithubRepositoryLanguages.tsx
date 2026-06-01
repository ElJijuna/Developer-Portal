import { useGhRepoLanguages } from '@api-hooks/gh'
import { EmptyState, ErrorState } from '@gnome-ui/layout'
import { GitCodeReview } from '@gnome-ui/icons'
import { Box } from '@gnome-ui/react/components/Box'
import { Icon } from '@gnome-ui/react/components/Icon'
import { Popover } from '@gnome-ui/react/components/Popover'
import { SegmentedBar } from '@gnome-ui/react/components/SegmentedBar'
import { Spinner } from '@gnome-ui/react/components/Spinner'
import { Text } from '@gnome-ui/react/components/Text'
import { api } from 'code-languages'
import { useMemo } from 'react'
import type { GithubBlockBaseProps } from '@/blocks/github/types'
import { valueState } from '@/blocks/github/utils'
import { Card } from '@gnome-ui/react'

export type GithubRepositoryLanguagesProps = GithubBlockBaseProps & {
  owner: string
  repo: string
}

export function GithubRepositoryLanguages({ owner, repo, enabled = true }: GithubRepositoryLanguagesProps) {
  const result = useGhRepoLanguages(owner, repo, { enabled })
  const state = valueState(result)

  const entries = useMemo(() => {
    if (!state.data) return []
    const total = Object.values(state.data).reduce((sum, bytes) => sum + bytes, 0)
    return Object.entries(state.data)
      .sort(([, a], [, b]) => b - a)
      .map(([lang, bytes]) => {
        const info = api.language(lang).locale('en-US').get()
        return { lang, bytes, percent: (bytes / total) * 100, color: info?.color, info: info ?? null }
      })
  }, [state.data])

  if (state.isPending) {
    return <Box align="center" justify="center" padding={48}><Spinner /></Box>
  }

  if (state.error || !state.data) {
    return <ErrorState type="network" description={state.error?.message ?? 'Could not load languages.'} />
  }

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={<Icon icon={GitCodeReview} size="lg" />}
        title="No languages detected"
        description="GitHub has not detected any programming languages for this repository."
      />
    )
  }

  const segments = entries.map(({ lang, percent, color }) => ({
    label: lang,
    value: percent,
    color,
  }))

  return (
    <Card>
      <Box orientation="vertical" spacing={12}>
        <SegmentedBar values={segments} />
        <Box orientation="vertical" spacing={4}>
          {entries.map(({ lang, percent, color, info }) => (
            <Box key={lang} orientation="horizontal" spacing={12} align="center">
              <Box
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: color ?? 'var(--color-accent)',
                  flexShrink: 0,
                }}
              />
              {info ? (
                <div style={{ flex: 1, cursor: 'pointer' }}>
                  <Popover
                    placement="top"
                    content={
                      <Box orientation="vertical" spacing={8} style={{ maxWidth: 260, padding: 4 }}>
                        <Box orientation="horizontal" spacing={8} align="center">
                          <img src={info.logo} alt={info.name} width={20} height={20} />
                          <Text variant="heading" style={{ fontWeight: 600 }}>{info.name}</Text>
                        </Box>
                        <Text variant="caption" color="dim">{info.description}</Text>
                        {info.paradigms.length > 0 && (
                          <Text variant="caption" color="dim">{info.paradigms.join(', ')}</Text>
                        )}
                        {info.author && (
                          <Text variant="caption" color="dim">by {info.author}</Text>
                        )}
                      </Box>
                    }
                  >
                    <Text variant="caption">{lang}</Text>
                  </Popover>
                </div>
              ) : (
                <Text variant="caption" style={{ flex: 1 }}>{lang}</Text>
              )}
              <Text variant="caption" color="dim">{percent.toFixed(1)}%</Text>
            </Box>
          ))}
        </Box>
      </Box>
    </Card>
  )
}
