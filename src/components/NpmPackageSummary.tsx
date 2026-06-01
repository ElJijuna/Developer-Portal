import { useState, type ReactElement } from 'react';
import {
  useNpmPackage,
  useNpmPackageLatest,
  useNpmPackageDownloads,
  useNpmPackageDownloadRange,
  useNpmPackageScore,
  useNpmPackageSize,
} from '@api-hooks/npm';
import { Box } from '@gnome-ui/react/components/Box';
import { Text } from '@gnome-ui/react/components/Text';
import { Badge } from '@gnome-ui/react/components/Badge';
import { Chip } from '@gnome-ui/react/components/Chip';
import { WrapBox } from '@gnome-ui/react/components/WrapBox';
import { Separator } from '@gnome-ui/react/components/Separator';
import { Skeleton } from '@gnome-ui/react/components/Skeleton';
import { ProgressBar } from '@gnome-ui/react/components/ProgressBar';
import { Drawer } from '@gnome-ui/react/components/Drawer';
import { useNumberFormatter } from '@gnome-ui/react/components/GnomeProvider/GnomeContext';
import { CounterCard } from '@gnome-ui/layout/components/CounterCard';
import { DashboardGrid } from '@gnome-ui/layout/components/DashboardGrid';
import { SparkAreaChart } from '@gnome-ui/charts';
import { FolderDownload, PackageXGeneric, GitTag } from '@gnome-ui/icons';
import { NpmMaintanerSummary } from '@/components/NpmMaintainerSummary';

export type NpmPackageSummaryProps = {
  packageName: string
}

function scoreVariant(v: number): 'success' | 'warning' | 'error' {
  if (v >= 0.7) return 'success';
  if (v >= 0.4) return 'warning';
  return 'error';
}

function maintainerId(maintainer: { name?: string; username?: string; email?: string }): string {
  return maintainer.username ?? maintainer.name ?? maintainer.email ?? '';
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

export function NpmPackageSummary({ packageName }: NpmPackageSummaryProps): ReactElement {
  const [selectedMaintainer, setSelectedMaintainer] = useState<string | null>(null)
  const downloadsFormatter = useNumberFormatter({
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  })
  const { data: pkg, isLoading: pkgLoading } = useNpmPackage(packageName)
  const { data: latest } = useNpmPackageLatest(packageName)
  const { data: weekDl } = useNpmPackageDownloads(packageName, { period: 'last-week' })
  const { data: monthDl } = useNpmPackageDownloads(packageName, { period: 'last-month' })
  const { data: dlRange } = useNpmPackageDownloadRange(packageName, { period: 'last-month' })
  const { data: score } = useNpmPackageScore(packageName)
  const { data: size } = useNpmPackageSize(packageName)

  const chartData = dlRange?.downloads.map((d) => d.downloads) ?? []
  const versionCount = Object.keys(pkg?.versions ?? {}).length
  const depCount = Object.keys(latest?.dependencies ?? {}).length

  return (
    <Box orientation="vertical" spacing={0}>

      {/* Header */}
      <Box orientation="vertical" spacing={8} padding={16}>
        {pkgLoading ? (
          <Skeleton height={24} />
        ) : (
          <Box orientation="horizontal" spacing={6} align="center" style={{ flexWrap: 'wrap' }}>
            <Badge>{pkg?.['dist-tags']?.latest ?? '—'}</Badge>
            {pkg?.license && <Badge>{pkg.license}</Badge>}
          </Box>
        )}
        {pkgLoading ? (
          <Skeleton height={16} />
        ) : (
          <Text variant="body" color="dim">{pkg?.description ?? 'No description.'}</Text>
        )}
        {pkg?.keywords && pkg.keywords.length > 0 && (
          <WrapBox childSpacing={4}>
            {pkg.keywords.slice(0, 8).map((k) => <Chip key={k} label={k} />)}
          </WrapBox>
        )}
      </Box>

      <Separator />

      {/* Stats */}
      <Box orientation="vertical" spacing={12} padding={16}>
        <DashboardGrid columns={{ sm: 2 }} gap="sm">
          <CounterCard
            label="Last week"
            value={weekDl?.downloads ?? 0}
            format={downloadsFormatter.format}
            icon={FolderDownload}
            loading={!weekDl}
            loadingType="skeleton"
          />
          <CounterCard
            label="Last month"
            value={monthDl?.downloads ?? 0}
            format={downloadsFormatter.format}
            icon={FolderDownload}
            loading={!monthDl}
            loadingType="skeleton"
          />
          <CounterCard
            label="Versions"
            value={versionCount}
            icon={GitTag}
            loading={pkgLoading}
            loadingType="skeleton"
          />
          <CounterCard
            label="Dependencies"
            value={depCount}
            icon={PackageXGeneric}
            loading={!latest}
            loadingType="skeleton"
          />
        </DashboardGrid>

        {chartData.length > 0 && (
          <Box orientation="vertical" spacing={4}>
            <Text variant="caption" color="dim">Downloads — last 30 days</Text>
            <SparkAreaChart data={chartData} height={52} gradient aria-label="Downloads over the last 30 days" />
          </Box>
        )}
      </Box>

      <Separator />

      {/* Bundle size */}
      <Box orientation="vertical" spacing={8} padding={16}>
        <Text variant="heading">Bundle size</Text>
        <Box orientation="horizontal" spacing={24}>
          <Box orientation="vertical" spacing={2}>
            <Text variant="caption" color="dim">Publish</Text>
            <Text variant="body">{size?.publish.pretty ?? '—'}</Text>
          </Box>
          <Box orientation="vertical" spacing={2}>
            <Text variant="caption" color="dim">Install</Text>
            <Text variant="body">{size?.install.pretty ?? '—'}</Text>
          </Box>
        </Box>
      </Box>

      <Separator />

      {/* Scores */}
      <Box orientation="vertical" spacing={10} padding={16}>
        <Text variant="heading">Score</Text>
        <ScoreRow label="Quality" value={score?.score.detail.quality} />
        <ScoreRow label="Maintenance" value={score?.score.detail.maintenance} />
        <ScoreRow label="Popularity" value={score?.score.detail.popularity} />
      </Box>

      {/* Maintainers */}
      {pkg?.maintainers && pkg.maintainers.length > 0 && (
        <>
          <Separator />
          <Box orientation="vertical" spacing={6} padding={16}>
            <Text variant="heading">Maintainers</Text>
            <WrapBox childSpacing={4}>
              {pkg.maintainers.map((m) => {
                const id = maintainerId(m)

                return (
                  <Chip
                    key={id || m.name || m.email}
                    label={m.name ?? m.email ?? '?'}
                    selectable
                    selected={selectedMaintainer === id}
                    disabled={!id}
                    onClick={() => id && setSelectedMaintainer(id)}
                  />
                )
              })}
            </WrapBox>
          </Box>
        </>
      )}

      <Drawer
        open={selectedMaintainer !== null}
        title={selectedMaintainer ?? 'Maintainer'}
        size="wide"
        onClose={() => setSelectedMaintainer(null)}
      >
        {selectedMaintainer && <NpmMaintanerSummary username={selectedMaintainer} />}
      </Drawer>
    </Box>
  )
}
