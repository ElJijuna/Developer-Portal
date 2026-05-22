import type { ReactElement } from 'react';
import { Box } from '@gnome-ui/react/components/Box';
import { Text } from '@gnome-ui/react/components/Text';
import { Spinner } from '@gnome-ui/react/components/Spinner';
import { useNpmPackage } from '@api-hooks/npm';

export type NpmPackageSummaryProps = {
  packageName: string
}

export function NpmPackageSummary({ packageName }: NpmPackageSummaryProps): ReactElement {
  const { data, isLoading } = useNpmPackage(packageName)

  if (isLoading) {
    return <Box align="center" justify="center" padding={48}><Spinner /></Box>
  }

  return (
    <Box orientation="vertical" spacing={12} padding={16}>
      <Text variant="title-2">{data?.name}</Text>
      <Text variant="body" color="dim">{data?.description}</Text>
    </Box>
  )
}
