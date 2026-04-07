import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { useAction } from 'convex/react'
import { api } from '../../convex/_generated/api'
import AiDrawer from '../components/AiDrawer'
import MapDrawer from '../components/Map'
import { SchoolsList } from '../components/SchoolsList'
import { SchoolsFilter } from '../components/SchoolsFilter'
import { useSchools } from '../hooks/useSchools'
import type { FilterOptions } from '../components/SchoolsFilter'
import type { SchoolItem } from '../components/SchoolsList'

function getInitialAiOutput() {
  return `I can only answer questions related to this school.`
}

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const askSchool = useAction(api.askSchool.askSchool)
  const { data, error, isLoading, isError, refetch } = useSchools<unknown>()
  const [filters, setFilters] = useState<FilterOptions>({})
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false)
  const [isMapDrawerOpen, setIsMapDrawerOpen] = useState(false)
  const [activeSchool, setActiveSchool] = useState<SchoolItem | null>(null)
  const [aiOutputText, setAiOutputText] = useState('Select a school to ask school-specific questions.')
  const [aiError, setAiError] = useState<string | null>(null)
  const [isAiLoading, setIsAiLoading] = useState(false)

  const handleOpenAiDrawer = (school: SchoolItem) => {
    setActiveSchool(school)
    setIsAiDrawerOpen(true)
    setAiError(null)
    setIsAiLoading(false)
    setAiOutputText(getInitialAiOutput())
  }

  const handleCloseAiDrawer = () => {
    setIsAiDrawerOpen(false)
    setIsAiLoading(false)
  }

  const handleOpenMapDrawer = (school: SchoolItem) => {
    setActiveSchool(school)
    setIsMapDrawerOpen(true)
  }

  const handleCloseMapDrawer = () => {
    setIsMapDrawerOpen(false)
  }

  const handleSubmitPrompt = async (prompt: string) => {
    if (!activeSchool) {
      setAiError('Choose a school before asking a question.')
      return
    }

    setAiError(null)
    setIsAiLoading(true)

    const schoolPayload = {
      id: activeSchool.id,
      name: activeSchool.name,
      board: activeSchool.board,
      grades: activeSchool.grades,
      address: activeSchool.address,
      city: activeSchool.city,
      quadrant: activeSchool.quadrant,
      province: activeSchool.province,
      postalCode: activeSchool.postalCode,
      phone: activeSchool.phone,
      email: activeSchool.email,
      location: activeSchool.location,
      mapUrl: activeSchool.mapUrl,
    }

    try {
      const result = await askSchool({
        prompt,
        school: schoolPayload,
      })

      setAiOutputText(result.answer)
    } catch (submissionError) {
      setAiError(
        submissionError instanceof Error
          ? submissionError.message
          : 'Unable to get an AI response right now.',
      )
    } finally {
      setIsAiLoading(false)
    }
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
    <main className="w-full md:flex md:h-full md:overflow-hidden">
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
            onViewMap={handleOpenMapDrawer}
          />
        </section>
      </div>
      <AiDrawer
        isOpen={isAiDrawerOpen}
        schoolName={activeSchool?.name}
        outputText={aiOutputText}
        errorText={aiError}
        isSubmitting={isAiLoading}
        onSubmitPrompt={handleSubmitPrompt}
        onClose={handleCloseAiDrawer}
      />
      <MapDrawer
        isOpen={isMapDrawerOpen}
        school={activeSchool}
        onClose={handleCloseMapDrawer}
      />
    </main>
  )
}