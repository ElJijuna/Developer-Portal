import { useGhRepoCommits } from "@api-hooks/gh"
import { SparkAreaChart } from "@gnome-ui/charts"
import { GoaPanel } from "@gnome-ui/icons"
import { ErrorState, IconBadge, PanelCard } from "@gnome-ui/layout"
import { Box, ContributionGraph, Icon, Separator, Skeleton } from "@gnome-ui/react"

export type RepoContributionGraphProps = {
  owner: string
  repoName: string
  enabled?: boolean
  limit?: number
}

export function RepoContributionGraph({ owner, repoName, enabled, limit = 100 }: RepoContributionGraphProps) {
  const { data: commitsData, isLoading, error } = useGhRepoCommits(owner, repoName, { per_page: limit }, { enabled });
  const contributionDays = commitsData?.values.reduce((acc, commit) => {
    const date = new Date(commit.commit.author.date).toISOString().split('T')[0]
    const existing = acc.find(d => d.date === date)
    if (existing) {
      existing.count += 1
    } else {
      acc.push({ date, count: 1 })
    }
    return acc
  }, [] as { date: string, count: number }[]) ?? [];

  if (error) {
    return (
      <ErrorState type="generic" title="Failed to load contribution graph" description={error.message} />
    )
  }

  return (
    <PanelCard title="Contributions" icon={<IconBadge><Icon icon={GoaPanel} /></IconBadge>}>
      <Box orientation="vertical" spacing={24}>
        <Box justify="space-between" align="center">
          {!isLoading && contributionDays.length > 0 && (
            <SparkAreaChart
              data={contributionDays.slice(-84).map((d) => d.count)}
              height={32}
              aria-label="Trend de contribuciones"
            />
          )}
        </Box>
        <Separator />
        {isLoading ? (
          <Skeleton height={130} />
        ) : (
          <ContributionGraph
            cellSize={20}
            data={contributionDays}
            weekStartDay={1}
            tooltipContent={(day) => `${day.count} contribuciones el ${day.date}`}
          />
        )}
      </Box>
    </PanelCard>
  )
};