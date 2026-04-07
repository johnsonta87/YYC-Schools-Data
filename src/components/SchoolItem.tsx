import { Map } from 'lucide-react';
import type {SchoolItem} from './SchoolsList';

export default function SchoolItem(school: SchoolItem) {
  return (
    <li
      key={school.id}
      className="border-b border-slate-200 py-4 first:pt-0 dark:border-slate-800 last:border-0"
    >
      <article className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {school.name}
          </h2>
          <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">
            {school.board}
          </p>

          <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2 dark:text-slate-200">
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
            <p className="sm:col-span-2">
              {school.mapUrl ? (
                <a
                  href={school.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block text-blue-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                  title="View on google map"
                >
                  <Map size={20} />
                </a>
              ) : ''}
            </p>
          </div>
        </div>
      </article>
    </li>
  )
}