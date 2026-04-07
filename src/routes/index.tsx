import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { SchoolsList } from '../components/SchoolsList'
import { SchoolsFilter } from '../components/SchoolsFilter'
import { useSchools } from '../hooks/useSchools'
import type { FilterOptions } from '../components/SchoolsFilter'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const { data, error, isLoading, isError, refetch } = useSchools<unknown>()
  const [filters, setFilters] = useState<FilterOptions>({})

  // Extract unique boards from data for filter dropdown
  const { boards } = useMemo(() => {
    if (!Array.isArray(data)) {
      return { boards: [] }
    }

    const boardsSet = new Set<string>()

    data.forEach((item: any) => {
      if (item.board && typeof item.board === 'string') {
        boardsSet.add(item.board)
      }
    })

    return {
      boards: Array.from(boardsSet).sort((a, b) => a.localeCompare(b)),
    }
  }, [data])

  return (
    <main className="w-full flex h-screen overflow-hidden">
      <SchoolsFilter boards={boards} onFilterChange={setFilters} />
      <div className="flex-1 overflow-y-auto">
        <section className="mx-auto w-full max-w-5xl p-8 pt-0">
          <SchoolsList
            data={data}
            isLoading={isLoading}
            isError={isError}
            error={error}
            onRetry={refetch}
            filters={filters}
          />
        </section>
      </div>
    </main>
  )
}