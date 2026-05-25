import { useGhRepoMultipleRaw, useGhRepoGitTree } from '@api-hooks/gh'
import { detectMonoRepo } from '@baphy/npm';

export type NpmPackagesInfo =
  | { status: 'single'; packages: PackageJson[], isPending: boolean }
  | { status: 'monorepo'; packages: PackageJson[], isPending: boolean }

type PackageJson = {
  name: string
  private?: boolean
}

export function useRepoNpmPackages(owner: string, repoName: string, branch = 'main'): NpmPackagesInfo {
  const { data: gitTreeData } = useGhRepoGitTree(owner, repoName, branch, { recursive: '1' }, { enabled: true });
  const files = gitTreeData?.tree.map(t => t.path) ?? []; console.log(files);
  const { isMonoRepo, packages } = detectMonoRepo(files); console.log(isMonoRepo, packages);
  const packagesList = packages.map(({ packageJsonPath }) => packageJsonPath); console.log(11, packagesList); // eslint-disable-line no-console
  const { data: rawPackages = {}, isLoading: multiplePkgLoading } = useGhRepoMultipleRaw(owner, repoName, packagesList, { ref: branch }, { enabled: packages.length > 0 });
  const packagesEntries = Object.entries(rawPackages).map(([path, content]) => {
    try {
      const pkg = JSON.parse(content) as PackageJson;

      return pkg;
    } catch (e) {
      console.error(`Failed to parse ${path} as JSON`, e);
      return null;
    }
  }).filter((pkg): pkg is PackageJson => pkg !== null);

  return { status: isMonoRepo ? 'monorepo' : 'single', packages: packagesEntries, isPending: multiplePkgLoading };
}
