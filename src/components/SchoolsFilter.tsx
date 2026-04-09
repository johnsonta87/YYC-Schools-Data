import { useState } from 'react'
import type { FilterOptions } from '~/components/SchoolsList.tsx'

interface SchoolsFilterProps {
  readonly onFilterChange: (filters: FilterOptions) => void
  readonly boards?: Array<string>
}

const QUADRANTS = ['NE', 'NW', 'SE', 'SW'] as const
const GRADES = ['Elementary', 'Junior High', 'Senior High', 'University', 'College'] as const

export function SchoolsFilter({
  onFilterChange,
  boards = [],
}: SchoolsFilterProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    schoolName: '',
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
    const emptyFilters: FilterOptions = { schoolName: '', board: '', grades: [], quadrant: '' }
    setFilters(emptyFilters)
    onFilterChange(emptyFilters)
  }

  const hasActiveFilters =
    filters.schoolName || filters.board || (filters.grades && filters.grades.length > 0) || filters.quadrant

  return (
    <aside className="flex mb-4 md:mb-0 md:h-screen w-full md:w-72 flex-col gap-6 border border-slate-200 bg-gray-100 dark:bg-gray-900 p-4 md:p-8 dark:border-slate-800">
      <div>
        <h1 className="text-2xl font-semibold">Find Calgary Schools</h1>
      </div>

      <div className="flex flex-col gap-4 overflow-y-auto">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Filters</h2>
        {/* School Name Filter */}
        <div className="flex flex-col gap-2">
          <label htmlFor="school-name-filter" className="text-sm font-medium text-slate-700 dark:text-slate-200">
            School Name
          </label>
          <input
            id="school-name-filter"
            type="text"
            value={filters.schoolName || ''}
            onChange={(e) => handleFilterChange('schoolName', e.target.value)}
            placeholder="Search by school name"
            className="border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-50 dark:placeholder-slate-500"
          />
        </div>

        {/* Board Filter */}
        <div className="flex flex-col gap-2">
          <label htmlFor="board-filter" className="text-sm font-medium text-slate-700 dark:text-slate-200">
            School Board
          </label>
          <select
            id="board-filter"
            value={filters.board || ''}
            onChange={(e) => handleFilterChange('board', e.target.value)}
            className="border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-50 dark:placeholder-slate-500"
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
                  className="border border-slate-300 dark:border-slate-600"
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
            className="border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-50 dark:placeholder-slate-500"
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

      {hasActiveFilters && <button
        type="button"
        onClick={resetFilters}
        className="w-full bg-slate-200 px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed dark:bg-slate-700 dark:text-slate-50 dark:hover:bg-slate-600 dark:disabled:bg-slate-800 dark:disabled:text-slate-600"
      >
        Reset
      </button>}
    </aside>
  )
}

