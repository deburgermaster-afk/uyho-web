import { useNavigate } from 'react-router-dom'
import { useOrg } from '../context/OrgContext'

export default function About() {
  const navigate = useNavigate()
  const { orgData } = useOrg()
  
  return (
    <div className="@container">
      {/* Hero Image */}
      <div className="px-4 py-4">
        <div 
          className="bg-cover bg-center flex flex-col justify-end overflow-hidden bg-slate-200 dark:bg-slate-800 rounded-xl min-h-[340px] relative group" 
          style={{backgroundImage: 'linear-gradient(180deg, rgba(46, 204, 113, 0.1) 0%, rgba(0, 0, 0, 0.8) 100%), url("https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=1200&h=600&fit=crop")'}}
        >
          <div className="flex flex-col p-6 space-y-2">
            <span className="bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full w-fit uppercase tracking-widest">
              EST. 2019
            </span>
            <p className="text-white tracking-tight text-3xl font-extrabold leading-tight">
              Serving Humanity<br/>Since 2019
            </p>
            <p className="text-slate-300 text-sm font-medium bn">২০১৯ থেকে মানবতার সেবায় নিয়োজিত</p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="px-4 pb-6">
        <div className="flex flex-wrap gap-3">
          <div className="flex min-w-[100px] flex-1 flex-col gap-1 rounded-xl p-4 bg-primary/10 dark:bg-primary/20 border border-primary/20">
            <p className="text-primary dark:text-primary/90 text-xs font-bold uppercase tracking-wider">Service</p>
            <p className="text-slate-900 dark:text-white tracking-tight text-2xl font-extrabold">5+ Yrs</p>
          </div>
          <div className="flex min-w-[100px] flex-1 flex-col gap-1 rounded-xl p-4 bg-primary/10 dark:bg-primary/20 border border-primary/20">
            <p className="text-primary dark:text-primary/90 text-xs font-bold uppercase tracking-wider">Impacted</p>
            <p className="text-slate-900 dark:text-white tracking-tight text-2xl font-extrabold">50k+</p>
          </div>
          <div className="flex min-w-[100px] flex-1 flex-col gap-1 rounded-xl p-4 bg-primary text-white">
            <p className="text-white/80 text-xs font-bold uppercase tracking-wider">Volunteers</p>
            <p className="text-white tracking-tight text-2xl font-extrabold">200+</p>
          </div>
        </div>
      </div>

      {/* Who We Are Section */}
      <div className="px-4 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-[2px] w-8 bg-primary"></div>
          <h2 className="text-slate-900 dark:text-white tracking-tight text-xl font-extrabold uppercase font-display">
            Who We Are | <span className="bn">আমরা কারা</span>
          </h2>
        </div>
        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
          {orgData.org_description || `${orgData.org_full_name} (${orgData.org_name}) is a youth-led volunteer organization established in 2019 with a mission to create sustainable positive change in Bangladesh. We believe in the power of collective action and community-driven solutions.`}
        </p>
        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
          Our team consists of passionate young volunteers from diverse backgrounds who are committed to serving humanity. We operate across multiple wings including education, healthcare, disaster relief, and community development.
        </p>
      </div>

      {/* Mission & Vision */}
      <div className="px-4 py-8">
        <div className="grid gap-4">
          <div className="bg-primary/5 dark:bg-primary/10 rounded-xl p-6 border-l-4 border-primary">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Our Mission</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              To empower underprivileged communities in Bangladesh through sustainable education, healthcare, and development programs, creating lasting positive impact in people's lives.
            </p>
          </div>
          <div className="bg-primary/5 dark:bg-primary/10 rounded-xl p-6 border-l-4 border-primary">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Our Vision</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              A Bangladesh where every individual has access to quality education, healthcare, and opportunities to thrive, regardless of their socioeconomic background.
            </p>
          </div>
        </div>
      </div>

      {/* Our Values */}
      <div className="px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-[2px] w-8 bg-primary"></div>
          <h2 className="text-slate-900 dark:text-white tracking-tight text-xl font-extrabold uppercase font-display">Our Values</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
            <div className="size-10 flex items-center justify-center rounded-lg bg-primary/10 text-primary">
              <span className="material-symbols-outlined">visibility</span>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wide">Transparency</h4>
              <p className="text-slate-500 text-xs bn">স্বচ্ছতা - We believe in complete accountability.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
            <div className="size-10 flex items-center justify-center rounded-lg bg-primary/10 text-primary">
              <span className="material-symbols-outlined">favorite</span>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wide">Empathy</h4>
              <p className="text-slate-500 text-xs bn">সহমর্মিতা - Serving with dignity and heart.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
            <div className="size-10 flex items-center justify-center rounded-lg bg-primary/10 text-primary">
              <span className="material-symbols-outlined">bolt</span>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wide">Action</h4>
              <p className="text-slate-500 text-xs bn">কর্মতৎপরতা - Fast and efficient crisis response.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 pb-12 pt-4">
        <button onClick={() => navigate('/donate')} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-95">
          <span>Support Our Mission</span>
          <span className="material-symbols-outlined text-sm">favorite</span>
        </button>
      </div>
    </div>
  )
}
