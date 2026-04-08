import { Link, createFileRoute } from '@tanstack/react-router'
import { AlertCircle } from 'lucide-react'

export const Route = createFileRoute('/404')({
  component: NotFoundPage,
})

function NotFoundPage() {
  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 px-4 sm:px-6 lg:px-8">
      <div className="w-full">
        {/* Main Content Container */}
        <div className="text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl animate-pulse" />
              <AlertCircle className="w-20 h-20 text-red-500 relative" />
            </div>
          </div>

          {/* 404 Text */}
          <h1 className="text-6xl sm:text-7xl font-bold text-transparent bg-clip-text bg-linear-to-r from-red-500 via-red-400 to-pink-500 mb-4">
            404
          </h1>

          {/* Title */}
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            Page Not Found
          </h2>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg mb-8 leading-relaxed">
            Oops! The page you're looking for seems to have wandered off. It might have been moved or no longer exists.
          </p>

          {/* Quick Links */}
          <div className="space-y-3 sm:flex sm:gap-3 sm:justify-center sm:space-y-0 mb-8">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              <span>Go back to Home</span>
            </Link>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="mt-12 relative h-32">
          <div className="absolute inset-0 bg-linear-to-t from-transparent to-transparent opacity-10" />
          <svg
            className="w-full h-full opacity-20 dark:opacity-10"
            viewBox="0 0 400 100"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0,50 Q100,0 200,50 T400,50"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              className="text-gray-400"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}

export default NotFoundPage
