import { useGhRepoGitTree } from '@api-hooks/gh'

export type DockerImageInfo = {
  hasDockerfile: boolean
  dockerfilePaths: string[]
  isPending: boolean
}

export function useRepoDockerImage(owner: string, repoName: string, branch = 'main'): DockerImageInfo {
  const { data: gitTreeData, isLoading } = useGhRepoGitTree(owner, repoName, branch, { recursive: '1' }, { enabled: true })
  const files = gitTreeData?.tree.map(t => t.path ?? '').filter(Boolean) ?? []
  const dockerfilePaths = files.filter(p => /(?:^|\/)Dockerfile(\.[^/]*)?$/.test(p))
  return { hasDockerfile: dockerfilePaths.length > 0, dockerfilePaths, isPending: isLoading }
}
