import { createFileRoute } from '@tanstack/react-router'
import { useAction } from 'convex/react'
import { useMemo, useState } from 'react'
import type { Message } from '~/components/AiDrawer.tsx'
import { api } from '../../convex/_generated/api'
import type {FilterOptions, SchoolItem} from '~/components/SchoolsList.tsx';
import { SchoolsList } from '~/components/SchoolsList.tsx'
import { useSchools } from '~/hooks/useSchools.ts'
import { SchoolsFilter } from '~/components/SchoolsFilter.tsx'
import AiDrawer from '~/components/AiDrawer.tsx'
import MapDrawer from '~/components/Map.tsx'

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
    const [aiMessages, setAiMessages] = useState<Array<Message>>([])
    const [aiError, setAiError] = useState<string | null>(null)
    const [isAiLoading, setIsAiLoading] = useState(false)

    const handleOpenAiDrawer = (school: SchoolItem) => {
      setActiveSchool(school)
      setIsAiDrawerOpen(true)
      setAiError(null)
      setIsAiLoading(false)
      setAiMessages([])
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

      // Add user message to conversation
      setAiMessages((prev) => [...prev, { role: 'user', content: prompt }])

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

        // Add assistant message to conversation
        setAiMessages((prev) => [...prev, { role: 'assistant', content: result.answer }])
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
          <section className="w-full p-4 md:p-8 md:pt-0">
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
          messages={aiMessages}
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
