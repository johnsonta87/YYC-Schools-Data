import { Moon, Sun } from 'lucide-react'
import { useTheme } from '~/hooks/useTheme'

export default function ThemeSwitcher() {
  const { theme, toggleTheme, mounted } = useTheme()

  if (!mounted) {
    return <div className="w-10 h-10" />
  }

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="w-5 h-5" />
      case 'dark':
        return <Moon className="w-5 h-5" />
    }
  }

  return (
    <div className="absolute top-0 right-0 flex justify-end items-center gap-4">
      <button
        onClick={toggleTheme}
        className="p-1 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
        aria-label={`Switch to next theme (current: ${theme})`}
        title={`Current theme: ${theme}`}
      >
        {getIcon()}
      </button>
    </div>
  )
}

