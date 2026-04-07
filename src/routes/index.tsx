import { createFileRoute } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <main className="w-full relative">
      <section
        className="w-full h-screen bg-cover bg-center flex items-center justify-center"
        style={{
          backgroundImage: 'url(/images/classroom-hero.jpg)',
        }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Find a school
          </h1>
          <p className="text-white mb-6">
            Discover Calgary schools by location, program, and grade so you can
            quickly find the best fit for your family.
          </p>
          <Link
            to="/FindSchools"
            className="inline-block bg-blue-700 hover:bg-blue-600 text-white font-bold py-3 px-8 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </section>
    </main>
  )
}