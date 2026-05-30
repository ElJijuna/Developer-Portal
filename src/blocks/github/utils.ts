import { useEffect, useEffectEvent, useMemo } from 'react'
import type { GithubBlockVariant, GithubListSnapshot, GithubListState, GithubValueState } from './types'

export const DEFAULT_LIMIT = 100

type PageResult<T> = {
  data?: { values: T[]; totalCount?: number }
  isPending: boolean
  isFetching: boolean
  error: Error | null
  refetch: () => unknown
}

type InfiniteResult<T> = {
  data?: { pages: Array<{ values: T[]; totalCount?: number }> }
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
      totalCount: infinityResult.data?.pages[0]?.totalCount,
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
    totalCount: pageResult.data?.totalCount,
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

export function useListStateChange<T>(
  state: GithubListState<T>,
  onStateChange?: (state: GithubListSnapshot<T>) => void,
) {
  const emitStateChange = useEffectEvent((snapshot: GithubListSnapshot<T>) => {
    onStateChange?.(snapshot)
  })
  const snapshot = useMemo(
    () => ({
      items: state.items,
      count: state.items.length,
      totalCount: state.totalCount,
      isPending: state.isPending,
      isFetching: state.isFetching,
      isFetchingNextPage: state.isFetchingNextPage,
      error: state.error,
      hasNextPage: state.hasNextPage,
    }),
    [
      state.error,
      state.hasNextPage,
      state.isFetching,
      state.isFetchingNextPage,
      state.isPending,
      state.items,
      state.totalCount,
    ],
  )

  useEffect(() => {
    emitStateChange(snapshot)
  }, [emitStateChange, snapshot])
}

export function workflowRunsState<T extends { workflow_runs: R[]; total_count?: number }, R>(
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
      totalCount: infinityResult.data?.pages[0]?.total_count,
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
    totalCount: pageResult.data?.total_count,
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
