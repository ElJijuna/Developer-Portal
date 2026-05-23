import { CounterCard } from '@gnome-ui/layout/components/CounterCard'
import type { DoraMetric } from '../../lib/dora'
import { DORA_LEVEL_COLOR } from '../../lib/dora'

export type DoraMetricCardProps = {
  label: string
  metric: DoraMetric
  format?: (value: number) => string
}

export function DoraMetricCard({ label, metric, format }: DoraMetricCardProps) {
  if (metric.value === null || metric.level === null) {
    return (
      <CounterCard
        label={label}
        value={0}
        format={() => '—'}
        color="#77767b"
      />
    )
  }

  return (
    <CounterCard
      label={label}
      value={metric.value}
      format={format ?? ((v) => v.toFixed(1))}
      color={DORA_LEVEL_COLOR[metric.level]}
      suffix={metric.level}
    />
  )
}
