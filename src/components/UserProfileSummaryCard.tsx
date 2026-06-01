import { SparkAreaChart } from "@gnome-ui/charts";
import { ProfileCard } from "@gnome-ui/layout/components/ProfileCard";
import { ReactElement } from "react";
import { useGhUser, useGhUserRepos, useGhUserContributionMap } from "@api-hooks/gh";
import { useFloaty } from "floaty-widget";
import { Button, Icon } from "@gnome-ui/react";
import { FocusWindows } from "@gnome-ui/icons";

export type UserProfileSummaryCardProps = {
  name: string;
  username: string;
  avatarSrc?: string;
  avatarColor?: string;
  onClick?: (username: string) => void;
}

export function UserProfileSummaryCard({ name, username, avatarSrc, avatarColor, onClick }: UserProfileSummaryCardProps): ReactElement {
  const floaty = useFloaty();
  const { data: user } = useGhUser(username, { enabled: !!username });
  const { data: repos } = useGhUserRepos(username, { per_page: 100 }, { enabled: !!username });
  const { data: contributionData } = useGhUserContributionMap(username, {}, { enabled: !!username });

  const totalStars = repos?.values.reduce((s, r) => s + r.stargazers_count, 0) ?? 0;
  const activityData = contributionData?.weeks
    .flatMap((w) => w.contributionDays.map((d) => d.contributionCount))
    .slice(-84) ?? [];

  return (
    <div>
      <ProfileCard
        username={username}
        avatarSrc={avatarSrc || avatarColor}
        name={name}
        stats={[
          { label: 'Repos', value: user?.public_repos ?? 0 },
          { label: 'Followers', value: user?.followers ?? 0 },
          { label: 'Stars', value: totalStars },
        ]}
        onClick={() => onClick?.(username)}
        backgroundChart={<SparkAreaChart data={activityData} height={80} gradient strokeWidth={2.5} />}
        interactive
        children={123}
      />
      <Button size="sm" variant="flat" onClick={() => {
        floaty.open({
          id: `ProfileCard-${username}`,
          title: username,
          component: ProfileCard,
          props: {
            username, avatarSrc, name, stats: [
              { label: 'Repos', value: user?.public_repos ?? 0 },
              { label: 'Followers', value: user?.followers ?? 0 },
              { label: 'Stars', value: totalStars },
            ]
          },
        })
      }} style={{ position: 'absolute', top: 8, right: 8 }}>
        <Icon icon={FocusWindows} />
      </Button>
    </div>
  );
}
