export default function Footer() {
  return (
    <footer className="md:absolute bottom-0 w-full z-40 text-center bg-white dark:bg-black border-t-2 border-gray-200 dark:border-gray-800">
      <div className="mx-auto max-w-7xl p-2 sm:px-6 lg:px-8 text-sm text-gray-700 dark:text-gray-400">
        &copy; {new Date().getFullYear()} Copyright. All rights reserved.
      </div>
    </footer>
  )
}