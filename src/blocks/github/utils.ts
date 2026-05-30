import type { GithubBlockVariant, GithubListState, GithubValueState } from './types'

export const DEFAULT_LIMIT = 100

type PageResult<T> = {
  data?: { values: T[] }
  isPending: boolean
  isFetching: boolean
  error: Error | null
  refetch: () => unknown
}

type InfiniteResult<T> = {
  data?: { pages: Array<{ values: T[] }> }
  isPending: boolean
  isFetching: boolean
  isFetchingNextPage: boolean
  error: Error | null
  hasNextPage: boolean
  fetchNextPage: () => unknown
  refetch: () => unknown
}

export function pagedState<T>(
  variant: GithubBlockVariant,
  pageResult: PageResult<T>,
  infinityResult: InfiniteResult<T>,
): GithubListState<T> {
  if (variant === 'infinity') {
    return {
      items: infinityResult.data?.pages.flatMap((page) => page.values) ?? [],
      isPending: infinityResult.isPending,
      isFetching: infinityResult.isFetching,
      isFetchingNextPage: infinityResult.isFetchingNextPage,
      error: infinityResult.error,
      hasNextPage: infinityResult.hasNextPage,
      fetchNextPage: () => {
        void infinityResult.fetchNextPage()
      },
      refetch: () => {
        void infinityResult.refetch()
      },
    }
  }

  return {
    items: pageResult.data?.values ?? [],
    isPending: pageResult.isPending,
    isFetching: pageResult.isFetching,
    isFetchingNextPage: false,
    error: pageResult.error,
    hasNextPage: false,
    fetchNextPage: () => {},
    refetch: () => {
      void pageResult.refetch()
    },
  }
}

type ValueResult<T> = {
  data?: T
  isPending: boolean
  isFetching: boolean
  error: Error | null
  refetch: () => unknown
}

export function valueState<T>(result: ValueResult<T>): GithubValueState<T> {
  return {
    data: result.data,
    isPending: result.isPending,
    isFetching: result.isFetching,
    error: result.error,
    refetch: () => {
      void result.refetch()
    },
  }
}

export function workflowRunsState<T extends { workflow_runs: R[] }, R>(
  variant: GithubBlockVariant,
  pageResult: {
    data?: T
    isPending: boolean
    isFetching: boolean
    error: Error | null
    refetch: () => unknown
  },
  infinityResult: {
    data?: { pages: T[] }
    isPending: boolean
    isFetching: boolean
    isFetchingNextPage: boolean
    error: Error | null
    hasNextPage: boolean
    fetchNextPage: () => unknown
    refetch: () => unknown
  },
): GithubListState<R> {
  if (variant === 'infinity') {
    return {
      items: infinityResult.data?.pages.flatMap((page) => page.workflow_runs) ?? [],
      isPending: infinityResult.isPending,
      isFetching: infinityResult.isFetching,
      isFetchingNextPage: infinityResult.isFetchingNextPage,
      error: infinityResult.error,
      hasNextPage: infinityResult.hasNextPage,
      fetchNextPage: () => {
        void infinityResult.fetchNextPage()
      },
      refetch: () => {
        void infinityResult.refetch()
      },
    }
  }

  return {
    items: pageResult.data?.workflow_runs ?? [],
    isPending: pageResult.isPending,
    isFetching: pageResult.isFetching,
    isFetchingNextPage: false,
    error: pageResult.error,
    hasNextPage: false,
    fetchNextPage: () => {},
    refetch: () => {
      void pageResult.refetch()
    },
  }
}
