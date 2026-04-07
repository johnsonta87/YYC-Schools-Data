import { useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

export const DATA_URL =
  'https://data.calgary.ca/api/v3/views/fd9t-tdn2/query.json'
const DEFAULT_QUERY = 'SELECT *'
const DEFAULT_PAGE_NUMBER = 1
const DEFAULT_PAGE_SIZE = 100
const appToken = import.meta.env.VITE_CALGARY_APP_TOKEN

type SchoolsStatus = 'idle' | 'loading' | 'success' | 'error'

interface UseSchoolsOptions {
  enabled?: boolean
  init?: Omit<RequestInit, 'body' | 'method' | 'signal'>
  query?: string
  pageNumber?: number
  pageSize?: number
  includeSynthetic?: boolean
}


interface SchoolsDataRequest {
  query: string
  page: {
    pageNumber: number
    pageSize: number
  }
  includeSynthetic: boolean
}

export function useSchools<TData = unknown, TError = Error>(
  options: UseSchoolsOptions = {},
) {
  const {
    enabled = true,
    init,
    query: sqlQuery = DEFAULT_QUERY,
    pageNumber = DEFAULT_PAGE_NUMBER,
    pageSize = DEFAULT_PAGE_SIZE,
    includeSynthetic = false,
  } = options

  const requestBody = useMemo<SchoolsDataRequest>(
    () => ({
      query: sqlQuery,
      page: {
        pageNumber,
        pageSize,
      },
      includeSynthetic,
    }),
    [sqlQuery, pageNumber, pageSize, includeSynthetic],
  )

  const requestInit = useMemo<Omit<RequestInit, 'signal'>>(() => {
    const headers = new Headers(init?.headers)
    headers.set('Content-Type', 'application/json')
    if (appToken) {
      headers.set('X-App-Token', appToken)
    }

    return {
      ...init,
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    }
  }, [appToken, init, requestBody])

  const initKey = useMemo(
    () =>
      JSON.stringify({
        cache: init?.cache ?? null,
        credentials: init?.credentials ?? null,
        integrity: init?.integrity ?? null,
        keepalive: init?.keepalive ?? null,
        mode: init?.mode ?? null,
        redirect: init?.redirect ?? null,
        referrer: init?.referrer ?? null,
        referrerPolicy: init?.referrerPolicy ?? null,
        headers: Array.from(new Headers(init?.headers).entries()).sort(
          ([keyA, valueA], [keyB, valueB]) =>
            keyA.localeCompare(keyB) || valueA.localeCompare(valueB),
        ),
      }),
    [init],
  )

  const query = useQuery<TData, TError>({
    queryKey: [
      'schools-data',
      requestBody.query,
      requestBody.page.pageNumber,
      requestBody.page.pageSize,
      requestBody.includeSynthetic,
      appToken ?? null,
      initKey,
    ],
    enabled,
    retry: false,
    queryFn: async () => {
      const response = await fetch(DATA_URL, requestInit)

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }

      const responseText = await response.text()

      if (!responseText.trim()) {
        throw new Error('Received an empty response body from road data API')
      }

      try {
        return JSON.parse(responseText) as TData
      } catch {
        throw new Error('Failed to parse data API response as JSON')
      }
    },
  })

  const data = (query.data ?? null) as TData | null
  let status: SchoolsStatus = 'idle'
  if (enabled) {
    status = 'loading'
    if (query.isError) {
      status = 'error'
    } else if (query.isSuccess) {
      status = 'success'
    }
  }
  const error = query.isError ? ((query.error ?? null) as TError | null) : null

  const refetch = useCallback(() => {
    if (enabled) {
      void query.refetch()
    }
  }, [enabled, query])

  return useMemo(
    () => ({
      data,
      error,
      status,
      isIdle: status === 'idle',
      isLoading: status === 'loading',
      isSuccess: status === 'success',
      isError: status === 'error',
      refetch,
    }),
    [data, error, refetch, status],
  )
}
