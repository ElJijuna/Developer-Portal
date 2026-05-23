import { useMemo } from 'react'
import { useGhRepoRaw, useGhRepoContents, useGhRepoMultipleRaw } from '@api-hooks/gh'
import { useAuth } from '../auth/AuthProvider'

export type NpmPackagesInfo =
  | { status: 'loading' }
  | { status: 'none' }
  | { status: 'single'; packageName: string }
  | { status: 'monorepo'; packages: string[] }

type RootPackageJson = {
  name?: string
  private?: boolean
  workspaces?: string[] | { packages?: string[] }
}

type PackageJson = {
  name?: string
  private?: boolean
}

export function useRepoNpmPackages(owner: string, repo: string): NpmPackagesInfo {
  const { user } = useAuth()
  const token = user?.githubToken ?? ''
  const enabled = !!owner && !!repo && !!token

  const { data: rawPkg, isLoading: pkgLoading } = useGhRepoRaw(owner, repo, 'package.json', undefined, { enabled })

  const rootPkg = useMemo<RootPackageJson | null>(() => {
    if (!rawPkg) return null
    try { return JSON.parse(rawPkg) } catch { return null }
  }, [rawPkg])

  const workspacePatterns = useMemo<string[]>(() => {
    const ws = rootPkg?.workspaces
    if (!ws) return []
    return Array.isArray(ws) ? ws : (ws.packages ?? [])
  }, [rootPkg])

  const isMonorepo = workspacePatterns.length > 0

  const workspaceDirs = useMemo(
    () => [...new Set(workspacePatterns.map((p) => p.split('/')[0]))],
    [workspacePatterns],
  )
  const workspaceRoot = workspaceDirs[0] ?? ''

  const { data: workspaceEntries, isLoading: workspaceEntriesLoading } = useGhRepoContents(
    owner, repo, workspaceRoot, undefined,
    { enabled: enabled && isMonorepo && !!workspaceRoot },
  )

  const packagePaths = useMemo(
    () => Array.isArray(workspaceEntries)
      ? workspaceEntries.filter((c) => c.type === 'dir').map((c) => `${workspaceRoot}/${c.name}/package.json`)
      : [],
    [workspaceEntries, workspaceRoot],
  )

  const { data: packagesJsons, isLoading: packagesLoading } = useGhRepoMultipleRaw(
    owner,
    repo,
    packagePaths,
    undefined,
    { enabled: enabled && isMonorepo && packagePaths.length > 0 },
  )

  const resolvedPackages = useMemo(
    () => Object.values(packagesJsons ?? {}).flatMap((rawPkg) => {
      try {
        const pkg = JSON.parse(rawPkg) as PackageJson
        return pkg.name && pkg.private !== true ? [pkg.name] : []
      } catch {
        return []
      }
    }),
    [packagesJsons],
  )

  if (pkgLoading || (isMonorepo && (workspaceEntriesLoading || packagesLoading))) return { status: 'loading' }
  if (!rootPkg) return { status: 'none' }

  if (isMonorepo) {
    return resolvedPackages.length > 0
      ? { status: 'monorepo', packages: resolvedPackages }
      : { status: 'none' }
  }

  if (rootPkg.private === true) return { status: 'none' }
  if (rootPkg.name) return { status: 'single', packageName: rootPkg.name }

  return { status: 'none' }
}
