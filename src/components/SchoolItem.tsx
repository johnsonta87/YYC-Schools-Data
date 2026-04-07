import { Map, MessageCircleQuestion } from 'lucide-react';
import type {SchoolItem} from './SchoolsList';

interface SchoolItemProps extends SchoolItem {
  onAskAi?: (school: SchoolItem) => void
  onViewMap?: (school: SchoolItem) => void
}

export default function SchoolItem(school: Readonly<SchoolItemProps>) {
  const handleAskAiClick = () => {
    const { onAskAi, onViewMap, ...schoolData } = school
    onAskAi?.(schoolData)
  }

  const handleViewMapClick = () => {
    const { onAskAi, onViewMap, ...schoolData } = school
    onViewMap?.(schoolData)
  }

  return (
    <li
      key={school.id}
      className="border-b border-slate-200 py-4 dark:border-slate-800 last:border-0"
    >
      <article className="relative flex items-start gap-4">
        <div className="min-w-0 flex-1 pr-16">
          <h3 className="text-md font-semibold">{school.name}</h3>
          <p className="mb-3 text-sm text-gray-700 dark:text-gray-200">
            {school.board}
          </p>

          <div className="text-sm sm:grid-cols-2">
            <p>Grades: {school.grades}</p>
            <p>Phone: {school.phone}</p>
            <p>
              Address: {school.address ? `${school.address},` : ''}{' '}
              {school.city}, {school.province} {school.postalCode}
            </p>
            <p>
              Email:{' '}
              {school.email.includes('@') ? (
                <a
                  href={`mailto:${school.email}`}
                  className="text-blue-700 hover:underline dark:text-blue-400"
                >
                  {school.email}
                </a>
              ) : (
                school.email
              )}
            </p>
            {school.mapUrl && (
              <>
                <button
                  type="button"
                  onClick={handleViewMapClick}
                  className="mt-2 inline-flex py-2 px-4 bg-blue-700 text-white hover:bg-blue-600"
                  title="View on google map"
                >
                  <Map size={20} className="mr-2" /> View map
                </button>
                <button
                  type="button"
                  onClick={handleAskAiClick}
                  className="mt-2 inline-flex py-2 px-4 bg-violet-600 text-white hover:bg-violet-500"
                  title="Ask AI about this school"
                >
                  <MessageCircleQuestion size={20} className="mr-2" /> Ask AI
                </button>
              </>
            )}
          </div>
        </div>
      </article>
    </li>
  )
}