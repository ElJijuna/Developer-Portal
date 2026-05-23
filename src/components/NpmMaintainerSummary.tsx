import { useMemo, type ReactElement } from 'react';
import {
  useNpmMaintainer,
  useNpmMaintainerAvatar,
  useNpmMaintainerPackages,
  useNpmBulkDownloads,
} from '@api-hooks/npm';
import { Box } from '@gnome-ui/react/components/Box';
import { Text } from '@gnome-ui/react/components/Text';
import { Badge } from '@gnome-ui/react/components/Badge';
import { Separator } from '@gnome-ui/react/components/Separator';
import { Skeleton } from '@gnome-ui/react/components/Skeleton';
import { ProgressBar } from '@gnome-ui/react/components/ProgressBar';
import { Avatar } from '@gnome-ui/react/components/Avatar';
import { useNumberFormatter } from '@gnome-ui/react/components/GnomeProvider/GnomeContext';
import { CounterCard } from '@gnome-ui/layout/components/CounterCard';
import { DashboardGrid } from '@gnome-ui/layout/components/DashboardGrid';
import { SparkAreaChart } from '@gnome-ui/charts';
import { FolderDownload, PackageXGeneric, Star, UserInfo } from '@gnome-ui/icons';
import { PanelCard } from '@gnome-ui/layout';

export type NpmMaintanerSummaryProps = {
  username: string
}

function scoreVariant(v: number): 'success' | 'warning' | 'error' {
  if (v >= 0.7) return 'success';
  if (v >= 0.4) return 'warning';
  return 'error';
}

function formatPercent(n: number): string {
  return `${Math.round(n * 100)}%`;
}

function ScoreRow({ label, value }: { label: string; value?: number }): ReactElement {
  return (
    <Box orientation="vertical" spacing={4}>
      <Box justify="space-between">
        <Text variant="caption" color="dim">{label}</Text>
        <Text variant="caption">{value !== undefined ? `${Math.round(value * 100)}%` : '—'}</Text>
      </Box>
      <ProgressBar value={value} variant={value !== undefined ? scoreVariant(value) : 'accent'} aria-label={label} />
    </Box>
  );
}

export function NpmMaintanerSummary({ username }: NpmMaintanerSummaryProps): ReactElement {
  const enabled = username.length > 0
  const downloadsFormatter = useNumberFormatter({
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  })
  const { data: maintainer, isLoading: maintainerLoading } = useNpmMaintainer(username, { enabled })
  const { data: avatarUrl } = useNpmMaintainerAvatar(username, { enabled })
  const { data: packagesData, isLoading: packagesLoading } = useNpmMaintainerPackages(username, {
    size: 25,
    from: 0,
    enabled,
  })

  const packages = useMemo(() => packagesData?.objects ?? [], [packagesData])
  const packageNames = useMemo(() => packages.slice(0, 20).map((p) => p.package.name), [packages])
  const { data: downloads, isLoading: downloadsLoading } = useNpmBulkDownloads(packageNames, {
    period: 'last-month',
    enabled: enabled && packageNames.length > 0,
  })

  const summary = useMemo(() => {
    let downloadsTotal = 0
    let qualityTotal = 0
    let popularityTotal = 0
    let maintenanceTotal = 0

    for (const item of packages) {
      const packageName = item.package.name
      downloadsTotal += downloads?.[packageName]?.downloads ?? 0
      qualityTotal += item.score.detail.quality
      popularityTotal += item.score.detail.popularity
      maintenanceTotal += item.score.detail.maintenance
    }

    const count = packages.length || 1
    const newest = packages.reduce<(typeof packages)[number] | undefined>((latest, item) => {
      if (!item.package.date) return latest
      if (!latest?.package.date) return item
      return new Date(item.package.date) > new Date(latest.package.date) ? item : latest
    }, undefined)

    return {
      downloadsTotal,
      averageQuality: qualityTotal / count,
      averagePopularity: popularityTotal / count,
      averageMaintenance: maintenanceTotal / count,
      newest,
    }
  }, [downloads, packages])

  const chartData = useMemo(
    () => packageNames.map((name) => downloads?.[name]?.downloads ?? 0),
    [downloads, packageNames],
  )

  const topPackages = useMemo(
    () => [...packages]
      .sort((a, b) => (downloads?.[b.package.name]?.downloads ?? 0) - (downloads?.[a.package.name]?.downloads ?? 0))
      .slice(0, 8),
    [downloads, packages],
  )

  return (
    <Box orientation="vertical" spacing={12}>
      <Box orientation="horizontal" spacing={12} align="center" padding={16}>
        <Avatar name={maintainer?.name ?? username} src={avatarUrl} size="lg" />
        <Box orientation="vertical" spacing={4}>
          {maintainerLoading ? (
            <Skeleton height={24} />
          ) : (
            <Text variant="heading">{maintainer?.name ?? username}</Text>
          )}
          <Box orientation="horizontal" spacing={6} align="center" style={{ flexWrap: 'wrap' }}>
            <Badge>npm maintainer</Badge>
            {maintainer?.email && <Badge>{maintainer.email}</Badge>}
          </Box>
        </Box>
      </Box>

      <Separator />

      <Box orientation="vertical" spacing={12} padding={16}>
        <DashboardGrid columns={{ sm: 2 }} gap="sm">
          <CounterCard
            label="Published packages"
            value={packagesData?.total ?? 0}
            icon={PackageXGeneric}
            loading={packagesLoading}
            loadingType="skeleton"
          />
          <CounterCard
            label="Tracked downloads"
            value={summary.downloadsTotal}
            format={downloadsFormatter.format}
            icon={FolderDownload}
            loading={downloadsLoading && packageNames.length > 0}
            loadingType="skeleton"
          />
          <CounterCard
            label="Avg quality"
            value={summary.averageQuality}
            format={formatPercent}
            icon={Star}
            loading={packagesLoading}
            loadingType="skeleton"
          />
          <CounterCard
            label="Avg maintenance"
            value={summary.averageMaintenance}
            format={formatPercent}
            icon={UserInfo}
            loading={packagesLoading}
            loadingType="skeleton"
          />
        </DashboardGrid>

        {chartData.length > 0 && (
          <Box orientation="vertical" spacing={4}>
            <Text variant="caption" color="dim">Downloads by published package — last month</Text>
            <SparkAreaChart data={chartData} height={56} aria-label="Maintainer package downloads over the last month" />
          </Box>
        )}
      </Box>

      <PanelCard title="Package score profile">
        <ScoreRow label="Quality" value={summary.averageQuality} />
        <ScoreRow label="Maintenance" value={summary.averageMaintenance} />
        <ScoreRow label="Popularity" value={summary.averagePopularity} />
      </PanelCard>

      <PanelCard title="Top packages">
        {packagesLoading ? (
          <Box orientation="vertical" spacing={8}>
            <Skeleton height={44} />
            <Skeleton height={44} />
            <Skeleton height={44} />
          </Box>
        ) : (
          <Box orientation="vertical" spacing={8}>
            <Box orientation="horizontal" justify="space-between" align="center" spacing={12}>
              <Text variant="heading">Top packages</Text>
              {summary.newest?.package.date && (
                <Text variant="caption" color="dim">
                  Newest: {summary.newest.package.name}
                </Text>
              )}
            </Box>
            {topPackages.map((item) => (
              <Box
                key={item.package.name}
                orientation="horizontal"
                justify="space-between"
                align="center"
                spacing={12}
                padding={10}
                style={{ border: '1px solid var(--border-color, rgba(127, 127, 127, 0.22))', borderRadius: 8 }}
              >
                <Box orientation="vertical" spacing={2} style={{ minWidth: 0 }}>
                  <Text variant="body">{item.package.name}</Text>
                  <Text variant="caption" color="dim">{item.package.version}</Text>
                </Box>
                <Box orientation="horizontal" spacing={6} align="center">
                  <Badge>{downloadsFormatter.format(downloads?.[item.package.name]?.downloads ?? 0)}</Badge>
                  <Badge>{formatPercent(item.score.final)}</Badge>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </PanelCard>
    </Box>
  )
}
