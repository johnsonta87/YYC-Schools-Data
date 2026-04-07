import { useState } from 'react'

export interface FilterOptions {
  board?: string
  grades?: Array<string>
  quadrant?: string
}

interface SchoolsFilterProps {
  readonly onFilterChange: (filters: FilterOptions) => void
  readonly boards?: Array<string>
}

const QUADRANTS = ['NE', 'NW', 'SE', 'SW'] as const
const GRADES = ['Elementary', 'Junior High', 'Senior High'] as const

export function SchoolsFilter({
  onFilterChange,
  boards = [],
}: SchoolsFilterProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    board: '',
    grades: [],
    quadrant: '',
  })

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    const updatedFilters = { ...filters, [key]: value }
    setFilters(updatedFilters)
    onFilterChange(updatedFilters)
  }

  const handleGradesChange = (grade: string) => {
    const currentGrades = filters.grades || []
    const updatedGrades = currentGrades.includes(grade)
      ? currentGrades.filter((g) => g !== grade)
      : [...currentGrades, grade]
    const updatedFilters = { ...filters, grades: updatedGrades }
    setFilters(updatedFilters)
    onFilterChange(updatedFilters)
  }

  const resetFilters = () => {
    const emptyFilters: FilterOptions = { board: '', grades: [], quadrant: '' }
    setFilters(emptyFilters)
    onFilterChange(emptyFilters)
  }

  return (
    <aside className="flex h-screen w-72 flex-col gap-6 border border-slate-200 bg-gray-100 dark:bg-gray-900 p-6 dark:border-slate-800">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Filters</h2>
      </div>

      <div className="flex flex-col gap-4 overflow-y-auto">
        {/* Board Filter */}
        <div className="flex flex-col gap-2">
          <label htmlFor="board-filter" className="text-sm font-medium text-slate-700 dark:text-slate-200">
            School Board
          </label>
          <select
            id="board-filter"
            value={filters.board || ''}
            onChange={(e) => handleFilterChange('board', e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-50 dark:placeholder-slate-500"
          >
            <option value="">All</option>
            {boards.map((board) => (
              <option key={board} value={board}>
                {board}
              </option>
            ))}
          </select>
        </div>

        {/* Grades Filter */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Grades Served
          </label>
          <div className="flex flex-col gap-2">
            {GRADES.map((grade) => (
              <label key={grade} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.grades?.includes(grade) || false}
                  onChange={() => handleGradesChange(grade)}
                  className="rounded border border-slate-300 dark:border-slate-600"
                />
                <span className="text-sm text-slate-700 dark:text-slate-200">{grade}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Quadrant Filter */}
        <div className="flex flex-col gap-2">
          <label htmlFor="quadrant-filter" className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Quadrant
          </label>
          <select
            id="quadrant-filter"
            value={filters.quadrant || ''}
            onChange={(e) => handleFilterChange('quadrant', e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-50 dark:placeholder-slate-500"
          >
            <option value="">All</option>
            {QUADRANTS.map((quadrant) => (
              <option key={quadrant} value={quadrant}>
                {quadrant}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reset Button */}
      <div className="mt-auto">
        <button
          type="button"
          onClick={resetFilters}
          className="w-full rounded-md bg-slate-200 px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-50 dark:hover:bg-slate-600"
        >
          Reset Filters
        </button>
      </div>
    </aside>
  )
}

