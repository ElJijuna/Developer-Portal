import type { ReactNode } from 'react'

export type GithubBlockVariant = 'page' | 'infinity'

export type GithubBlockBaseProps = {
  enabled?: boolean
  variant?: GithubBlockVariant
}

export type GithubListState<T> = {
  items: T[]
  isPending: boolean
  isFetching: boolean
  isFetchingNextPage: boolean
  error: Error | null
  hasNextPage: boolean
  fetchNextPage: () => void
  refetch: () => void
}

export type GithubListChildren<T> = {
  children?: (state: GithubListState<T>) => ReactNode
}

export type GithubValueState<T> = {
  data: T | undefined
  isPending: boolean
  isFetching: boolean
  error: Error | null
  refetch: () => void
}

export type GithubValueChildren<T> = {
  children?: (state: GithubValueState<T>) => ReactNode
}
