import { useState } from 'react'
import { Link } from 'react-router-dom'
import VolunteerFooter from '../../components/VolunteerFooter'
import VolunteerHeader from '../../components/VolunteerHeader'
import { demoPrograms } from './demoData'

export default function ProgramsPage() {
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredPrograms = demoPrograms.filter(p => {
    const matchesFilter = filter === 'all' || p.status.toLowerCase() === filter.toLowerCase()
    const matchesSearch = !searchQuery ||
      p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <VolunteerHeader title="Programs & Courses" showBack={true} />

      <main className="max-w-2xl mx-auto pb-32">
        {/* Search Bar */}
        <section className="px-4 pt-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
            <input
              type="text"
              placeholder="Search programs by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-xs text-slate-500 mt-2 px-1">
              {filteredPrograms.length} result{filteredPrograms.length !== 1 ? 's' : ''} found
            </p>
          )}
        </section>

        {/* Filter Tabs */}
        <section className="sticky top-16 z-40 bg-background-light dark:bg-background-dark border-b border-slate-100 dark:border-slate-800 px-4 py-3">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {['All', 'Ongoing', 'Planning', 'Completed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status.toLowerCase())}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  filter === status.toLowerCase()
                    ? 'bg-primary text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </section>

        {/* Program Cards */}
        <section className="px-4 py-4 space-y-3">
          {filteredPrograms.length > 0 ? (
            filteredPrograms.map((program) => (
              <Link
                key={program.id}
                to={`/volunteer/program/${program.id}`}
                className="block bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-video bg-cover bg-center" style={{ backgroundImage: `url('${program.image}')` }} />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-bold text-sm">{program.title}</h3>
                      <p className="text-xs text-slate-500 mt-1">{program.participants} participants</p>
                    </div>
                    <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-1 rounded whitespace-nowrap">
                      {program.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                    {program.description}
                  </p>
                  
                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {program.progress}% Complete
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(program.startDate).toLocaleDateString()} - {new Date(program.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${program.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-bold transition-colors">
                      View Program
                    </button>
                    <button className="flex-1 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-bold transition-colors">
                      Enroll
                    </button>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-700 block mb-2">school</span>
              <p className="text-slate-500 text-sm">No programs found</p>
            </div>
          )}
        </section>
      </main>

      <VolunteerFooter />
    </div>
  )
}
