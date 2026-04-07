import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import AiDrawer from '../components/AiDrawer'
import { SchoolsList } from '../components/SchoolsList'
import { SchoolsFilter } from '../components/SchoolsFilter'
import { useSchools } from '../hooks/useSchools'
import type { FilterOptions } from '../components/SchoolsFilter'
import type { SchoolItem } from '../components/SchoolsList'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const { data, error, isLoading, isError, refetch } = useSchools<unknown>()
  const [filters, setFilters] = useState<FilterOptions>({})
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false)
  const [activeSchool, setActiveSchool] = useState<SchoolItem | null>(null)

  const handleOpenAiDrawer = (school: SchoolItem) => {
    setActiveSchool(school)
    setIsAiDrawerOpen(true)
  }

  const handleCloseAiDrawer = () => {
    setIsAiDrawerOpen(false)
  }

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
    <main className="w-full md:flex md:h-screen md:overflow-hidden">
      <SchoolsFilter boards={boards} onFilterChange={setFilters} />
      <div className="flex-1 md:overflow-y-auto">
        <section className="w-full p-4 md:p-8 pt-0">
          <SchoolsList
            data={data}
            isLoading={isLoading}
            isError={isError}
            error={error}
            onRetry={refetch}
            filters={filters}
            onAskAi={handleOpenAiDrawer}
          />
        </section>
      </div>
      <AiDrawer
        isOpen={isAiDrawerOpen}
        schoolName={activeSchool?.name}
        onClose={handleCloseAiDrawer}
      />
    </main>
  )
}