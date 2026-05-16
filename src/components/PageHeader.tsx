import { ReactNode } from 'react';
import { Text } from '@gnome-ui/react/components/Text';
import { Toolbar, Spacer } from '@gnome-ui/react/components/Toolbar';
import { PathBar, PathBarSegment } from '@gnome-ui/react/components/PathBar';
import { useBreakpoint } from '@gnome-ui/hooks/useBreakpoint';

interface PageHeaderProps {
  title: string
  segments: PathBarSegment[]
  actions?: ReactNode
}

export function PageHeader({ title, segments, actions }: PageHeaderProps) {
  const { isMobile } = useBreakpoint()

  return (
    <>
      <Toolbar>
        <Text variant="title-1">{title}</Text>
        <Spacer />
        {!isMobile && actions}
      </Toolbar>
      <PathBar segments={segments} />
    </>
  )
}
