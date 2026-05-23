import { Box } from '@gnome-ui/react/components/Box'
import { Card } from '@gnome-ui/react/components/Card'
import { Text } from '@gnome-ui/react/components/Text'
import { Badge } from '@gnome-ui/react'
import type { DoraMetric } from '../../lib/dora'
import { DORA_LEVEL_COLOR } from '../../lib/dora'

export type DoraMetricCardProps = {
  label: string
  metric: DoraMetric
  format?: (value: number) => string
}

export function DoraMetricCard({ label, metric, format }: DoraMetricCardProps) {
  const hasData = metric.value !== null && metric.level !== null

  return (
    <Card padding="sm">
      <Box orientation="vertical" spacing={4}>
        <Text variant="caption" color="dim">{label}</Text>
        <Text
          variant="title-3"
          style={{ fontWeight: 700, color: hasData ? DORA_LEVEL_COLOR[metric.level!] : '#77767b', lineHeight: 1 }}
        >
          {hasData ? (format ? format(metric.value!) : metric.value!.toFixed(1)) : '—'}
        </Text>
        {hasData && (
          <Badge>{metric.level!}</Badge>
        )}
      </Box>
    </Card>
  )
}
