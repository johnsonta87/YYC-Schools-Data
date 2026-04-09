import { useEffect, useMemo, useState } from 'react'
import SchoolItem from './SchoolItem'

export interface FilterOptions {
  schoolName?: string
  board?: string
  grades?: Array<string>
  city?: string
  quadrant?: string
}

interface SchoolsListProps {
  data: unknown
  isLoading: boolean
  isError: boolean
  error: Error | null
  onRetry: () => void
  filters?: FilterOptions
  onAskAi?: (school: SchoolItem) => void
  onViewMap?: (school: SchoolItem) => void
}

interface ColumnDefinition {
  fieldName?: string
  name?: string
}

export interface SchoolItem {
  id: string
  name: string
  board: string
  grades: string
  address: string
  city: string
  quadrant: string
  province: string
  postalCode: string
  phone: string
  email: string
  location: string
  mapUrl: string | null
}

type UnknownRecord = Record<string, unknown>

const FIELD_ALIASES = {
  name: ['name', 'school_name', 'school', 'schoolname', 'school_name_1'],
  board: ['board', 'school_board', 'district', 'authority'],
  grades: ['grades', 'grade_range', 'grade', 'grades_served'],
  address: ['address_ab', 'address', 'full_address', 'location_address', 'street_address'],
  city: ['city'],
  province: ['province'],
  postalCode: ['postal_cod', 'postal_code', 'postal'],
  phone: ['phone_no', 'phone', 'phone_number', 'telephone', 'contact_phone'],
  email: ['email', 'email_address', 'contact_email'],
  point: ['point'],
} as const

function normalizeKey(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
}

function toRecord(row: unknown, columns: Array<ColumnDefinition>): UnknownRecord | null {
  if (Array.isArray(row)) {
    const nextRecord: UnknownRecord = {}
    row.forEach((cell, index) => {
      const columnName = columns[index]?.fieldName ?? columns[index]?.name ?? `col_${index}`
      nextRecord[columnName] = cell
    })
    return nextRecord
  }

  if (typeof row === 'object' && row !== null) {
    return row as UnknownRecord
  }

  return null
}

function extractRows(rawData: unknown): Array<UnknownRecord> {
  if (Array.isArray(rawData)) {
    return rawData
      .map((row) => toRecord(row, []))
      .filter((row): row is UnknownRecord => row !== null)
  }

  if (typeof rawData !== 'object' || rawData === null) {
    return []
  }

  const payload = rawData as {
    data?: Array<unknown>
    rows?: Array<unknown>
    results?: Array<unknown>
    columns?: Array<ColumnDefinition>
  }

  const columns = Array.isArray(payload.columns) ? payload.columns : []
  const candidateRows = payload.data ?? payload.rows ?? payload.results ?? []

  if (!Array.isArray(candidateRows)) {
    return []
  }

  return candidateRows
    .map((row) => toRecord(row, columns))
    .filter((row): row is UnknownRecord => row !== null)
}

function asText(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim()
  }

  if (typeof value === 'number') {
    return String(value)
  }

  return ''
}

function formatPostalCode(value: string): string {
  const compact = value.replace(/\s+/g, '')
  if (compact.length <= 3) {
    return compact
  }

  return `${compact.slice(0, 3)} ${compact.slice(3)}`
}

function pickValue(record: UnknownRecord, aliases: ReadonlyArray<string>): string {
  const entryMap = new Map<string, unknown>()
  Object.entries(record).forEach(([key, value]) => {
    entryMap.set(normalizeKey(key), value)
  })

  for (const alias of aliases) {
    const matchedValue = entryMap.get(normalizeKey(alias))
    const textValue = asText(matchedValue)
    if (textValue) {
      return textValue
    }
  }

  return ''
}

function pickRawValue(record: UnknownRecord, aliases: ReadonlyArray<string>): unknown {
  const entryMap = new Map<string, unknown>()
  Object.entries(record).forEach(([key, value]) => {
    entryMap.set(normalizeKey(key), value)
  })

  for (const alias of aliases) {
    if (entryMap.has(normalizeKey(alias))) {
      return entryMap.get(normalizeKey(alias))
    }
  }

  return null
}

function formatLocation(pointValue: unknown): string {
  if (typeof pointValue !== 'object' || pointValue === null) {
    return 'Location not available'
  }

  const point = pointValue as { coordinates?: unknown }
  if (!Array.isArray(point.coordinates) || point.coordinates.length < 2) {
    return 'Location not available'
  }

  const [lng, lat] = point.coordinates
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return 'Location not available'
  }

  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
}

function toGoogleMapsUrl(pointValue: unknown): string | null {
  if (typeof pointValue !== 'object' || pointValue === null) {
    return null
  }

  const point = pointValue as { coordinates?: unknown }
  if (!Array.isArray(point.coordinates) || point.coordinates.length < 2) {
    return null
  }

  const [lng, lat] = point.coordinates
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return null
  }

  return `https://www.google.com/maps?q=${lat},${lng}`
}

function normalizeQuadrant(value: string): string {
  const compact = value.toUpperCase().replaceAll(/[^A-Z]/g, '')
  return compact === 'NE' || compact === 'NW' || compact === 'SE' || compact === 'SW' ? compact : ''
}

function getQuadrantFromAddress(address: string): string {
  // Accept NE/NW/SE/SW and punctuated variants like N.E. / S.W.
  const match = address.match(/(?:^|[^A-Za-z])([NS]\.?[\s-]*[EW]\.?)(?=[^A-Za-z]|$)/i)
  return match ? normalizeQuadrant(match[1]) : ''
}

const NAME_MATCH_GRADES = new Set(['university', 'college'])
const ITEMS_PER_PAGE = 6

function mapSchools(rawData: unknown): Array<SchoolItem> {
  const rows = extractRows(rawData)

  return rows.map((record, index) => {
    const name = pickValue(record, FIELD_ALIASES.name) || `School ${index + 1}`
    const board = pickValue(record, FIELD_ALIASES.board)
    const grades = pickValue(record, FIELD_ALIASES.grades)
    const address = pickValue(record, FIELD_ALIASES.address)
    const quadrant = getQuadrantFromAddress(address)
    const city = pickValue(record, FIELD_ALIASES.city)
    const province = pickValue(record, FIELD_ALIASES.province)
    const postalCode = formatPostalCode(pickValue(record, FIELD_ALIASES.postalCode))
    const phone = pickValue(record, FIELD_ALIASES.phone)
    const email = pickValue(record, FIELD_ALIASES.email)
    const point = pickRawValue(record, FIELD_ALIASES.point)
    const location = formatLocation(point)
    const mapUrl = toGoogleMapsUrl(point)

    return {
      id: `${name}-${index}`,
      name,
      board: board || 'Board not listed',
      grades: grades || '-',
      address: address || '',
      city: city || '',
      quadrant,
      province: province || '',
      postalCode: postalCode || '',
      phone: phone || 'Not listed',
      email: email || 'Not listed',
      location,
      mapUrl,
    }
  })
}

function LoadingCards() {
  return (
    <ul className="flex flex-col gap-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <li
          key={`loading-${index}`}
          className="w-full animate-pulse border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-start gap-4">
            <div className="h-24 w-24 bg-slate-200 dark:bg-slate-700" />
            <div className="flex-1 space-y-3">
              <div className="h-5 w-2/3 bg-slate-200 dark:bg-slate-700" />
              <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-700" />
              <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}

export function SchoolsList({
  data,
  isLoading,
  isError,
  error,
  onRetry,
  filters = {},
  onAskAi,
  onViewMap,
}: SchoolsListProps) {
  const [currentPage, setCurrentPage] = useState(1)

  const schools = useMemo(() => {
    const allSchools = mapSchools(data)

    return allSchools.filter((school) => {
      if (filters.schoolName) {
        const schoolNameQuery = filters.schoolName.trim().toLowerCase()
        if (schoolNameQuery && !school.name.toLowerCase().includes(schoolNameQuery)) {
          return false
        }
      }
      if (filters.board && school.board !== filters.board) {
        return false
      }
      if (filters.grades && filters.grades.length > 0) {
        const schoolGradesLower = school.grades.toLowerCase()
        const schoolNameLower = school.name.toLowerCase()
        const matchesGrade = filters.grades.some((grade) =>
          NAME_MATCH_GRADES.has(grade.toLowerCase())
            ? schoolNameLower.includes(grade.toLowerCase())
            : schoolGradesLower.includes(grade.toLowerCase())
        )
        if (!matchesGrade) {
          return false
        }
      }
      if (filters.quadrant && normalizeQuadrant(school.quadrant) !== normalizeQuadrant(filters.quadrant)) {
        return false
      }
      return true
    })
  }, [data, filters])

  useEffect(() => {
    setCurrentPage(1)
  }, [data, filters])

  const totalPages = Math.max(1, Math.ceil(schools.length / ITEMS_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE
  const paginatedSchools = schools.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  if (isLoading) {
    return <LoadingCards />
  }

  if (isError) {
    return (
      <div className="border border-red-200 bg-red-50 p-4 text-red-900 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
        <p>Failed to load schools data: {error?.message ?? 'Unknown error'}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 bg-red-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-600"
        >
          Retry
        </button>
      </div>
    )
  }

  if (schools.length === 0) {
    return (
      <div className="text-center my-6">
        No schools available for this filter.
      </div>
    )
  }

  return (
    <div className="mt-8 space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Showing {startIndex + 1}-
        {Math.min(startIndex + ITEMS_PER_PAGE, schools.length)} of{' '}
        {schools.length} schools
      </p>

      <ul className="grid gap-4 lg:grid-cols-2">
        {paginatedSchools.map((school) => (
          <SchoolItem
            key={school.id}
            {...school}
            onAskAi={onAskAi}
            onViewMap={onViewMap}
          />
        ))}
      </ul>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mb-8">
          <button
            type="button"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={safePage === 1}
            className="border border-slate-300 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-blue-700"
          >
            Previous
          </button>

          <span className="text-sm text-slate-700 dark:text-slate-200">
            Page {safePage} of {totalPages}
          </span>

          <button
            type="button"
            onClick={() =>
              setCurrentPage((page) => Math.min(totalPages, page + 1))
            }
            disabled={safePage === totalPages}
            className="border border-slate-300 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-blue-700"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

