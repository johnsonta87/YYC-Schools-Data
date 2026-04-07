import { Link } from '@tanstack/react-router'
import ThemeSwitcher from './ThemeSwitcher'

export default function Header() {
  return (
    <div className="flex flex-col gap-10 py-2 px-8 border-b-2 border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center">
        <div className="flex gap-4 items-center">
          <Link to="/" className="font-bold hover:opacity-80 transition-opacity">Home</Link>
          <Link
            to="/FindSchools"
            className="font-bold hover:opacity-80 transition-opacity"
          >
            Find Calgary Schools
          </Link>
        </div>
        <ThemeSwitcher />
      </div>
    </div>
  )
}