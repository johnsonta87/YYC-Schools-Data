import ThemeSwitcher from './ThemeSwitcher'

export default function Header() {
  return (
    <div className="flex flex-col gap-10 p-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">List of Calgary schools</h2>
        <ThemeSwitcher />
      </div>
    </div>
  )
}