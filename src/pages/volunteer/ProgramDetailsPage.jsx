import { useParams } from 'react-router-dom'
import VolunteerFooter from '../../components/VolunteerFooter'
import VolunteerHeader from '../../components/VolunteerHeader'
import { demoPrograms } from './demoData'

export default function ProgramDetailsPage() {
  const { id } = useParams()
  const program = demoPrograms.find(p => p.id === parseInt(id))

  if (!program) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <VolunteerHeader title="Program Details" showBack={true} />
        <main className="max-w-2xl mx-auto pb-32 flex items-center justify-center h-96">
          <p className="text-slate-500">Program not found</p>
        </main>
        <VolunteerFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <VolunteerHeader title={program.title} showBack={true} />

      <main className="max-w-2xl mx-auto pb-32">
        {/* Hero Image */}
        <div className="relative h-80 bg-cover bg-center" style={{ backgroundImage: `url('${program.image}')` }}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute top-4 right-4 bg-slate-900/50 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full">
            {program.status}
          </div>
        </div>

        {/* Program Info */}
        <section className="p-4 space-y-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">{program.title}</h1>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{program.description}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="material-symbols-outlined text-primary text-lg block mb-2">groups</span>
              <p className="text-xl font-bold">{program.participants}</p>
              <p className="text-xs text-slate-500 uppercase font-medium">Participants</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="material-symbols-outlined text-primary text-lg block mb-2">calendar_today</span>
              <p className="text-sm font-bold">{new Date(program.startDate).toLocaleDateString()}</p>
              <p className="text-xs text-slate-500 uppercase font-medium">Start Date</p>
            </div>
          </div>

          {/* Progress */}
          <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <p className="font-bold">Progress</p>
              <p className="text-lg font-bold text-primary">{program.progress}%</p>
            </div>
            <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${program.progress}%` }} />
            </div>
          </div>

          {/* Curriculum */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl">
            <h3 className="font-bold mb-4">Course Curriculum</h3>
            <div className="space-y-2">
              {['Module 1: Foundations', 'Module 2: Practical Skills', 'Module 3: Advanced Topics', 'Module 4: Project Work'].map((module, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                    program.progress > idx * 25 ? 'bg-primary' : 'bg-slate-300'
                  }`}>
                    ✓
                  </span>
                  <span className="text-sm font-medium">{module}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button className="flex-1 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-bold transition-colors">
              Enroll in Program
            </button>
            <button className="flex-1 py-3 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg font-bold transition-colors">
              Share
            </button>
          </div>
        </section>
      </main>

      <VolunteerFooter />
    </div>
  )
}
