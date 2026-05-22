import { use, useMemo, type ReactElement } from 'react';
import { api } from 'code-languages';
import { IconBadge } from '@gnome-ui/layout/components/IconBadge';
import { GitRepository, GitFork, Lock, Star, ViewReveal } from '@gnome-ui/icons';
import { Badge, Icon, Text, WrapBox, useLocale } from '@gnome-ui/react';
import { EntityCard } from '@gnome-ui/layout/components/EntityCard';

export type RepositoryCardProps = {
  name: string
  description?: string
  language?: string
  stars: number
  forks: number
  openIssues: number
  pushedAt: string
  isPrivate: boolean
  isLoading?: boolean
  onClick?: () => void
}

function relativeTime(dateStr: string, rtf: Intl.RelativeTimeFormat): string {
  const diff = new Date(dateStr).getTime() - Date.now();
  const days = Math.round(diff / 86400000);
  if (Math.abs(days) < 30) return rtf.format(days, 'day');
  const months = Math.round(diff / (86400000 * 30));
  if (Math.abs(months) < 12) return rtf.format(months, 'month');
  return rtf.format(Math.round(diff / (86400000 * 365)), 'year');
}

export function RepositoryCard({ name, description, language, stars, forks, openIssues, pushedAt, isPrivate, isLoading, onClick }: RepositoryCardProps): ReactElement {
  const locale = useLocale();
  const rtf = useMemo(() => new Intl.RelativeTimeFormat(locale ?? 'en', { numeric: 'auto' }), [locale]);

  const langPromise = useMemo(
    () => language ? api.language(language.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')).locale('en-US').load() : null,
    [language],
  );
  const lang = langPromise ? use(langPromise) : null;

  return (
    <EntityCard
      avatar={<IconBadge>{lang ? <img src={lang.logo} alt={lang.name} width={24} height={24} /> : <Icon icon={GitRepository} />}</IconBadge>}
      title={name}
      description={description}
      badge={
        <span style={{ display: 'flex', gap: 4 }}>
          {(lang?.name ?? language) && <Badge>{lang?.name ?? language}</Badge>}
          {isPrivate && <Badge><WrapBox><Icon icon={Lock} size="sm" /> Private</WrapBox></Badge>}
          {!isPrivate && <Badge><WrapBox><Icon icon={ViewReveal} size="sm" /> Public</WrapBox></Badge>}
        </span>
      }
      trailing={
        <WrapBox childSpacing={12}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon icon={Star} color="gold" />
            <Text variant="caption">{stars}</Text>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon icon={GitFork} />
            <Text variant="caption">{forks}</Text>
          </span>
        </WrapBox>
      }
      meta={[
        openIssues > 0 ? `${openIssues} issues` : undefined,
        `las update: ${relativeTime(pushedAt, rtf)}`,
      ]}
      onClick={onClick}
      loading={isLoading}
      loadingType="skeleton"
    />
  )
};
