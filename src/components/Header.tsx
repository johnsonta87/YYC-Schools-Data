import ThemeSwitcher from './ThemeSwitcher'

export default function Header() {
  return (
    <div className="flex flex-col gap-10 py-2 px-8 border-b-2 border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">List of Calgary schools</h2>
        <ThemeSwitcher />
      </div>
    </div>
  )
}