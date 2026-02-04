import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

export default function WingView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [wing, setWing] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/wings/${id}`)
      .then(res => res.json())
      .then(data => {
        setWing(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch wing:', err)
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!wing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">folder_off</span>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Wing Not Found</h2>
        <p className="text-slate-500 mb-4">This wing doesn't exist or has been removed.</p>
        <button 
          onClick={() => navigate('/wings')}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          Back to Wings
        </button>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden pb-12">
      {/* Cover Image */}
      <div className="relative h-48 bg-gradient-to-br from-primary to-teal-600">
        {wing.cover_image && (
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url("${wing.cover_image}")` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Back Button */}
        <button 
          onClick={() => navigate('/wings')}
          className="absolute top-4 left-4 bg-white/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-white/30 transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
      </div>

      {/* Wing Info Card */}
      <div className="px-4 -mt-16 relative z-10">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-5 border border-slate-200 dark:border-slate-800">
          <div className="flex items-start gap-4">
            {/* Wing Logo */}
            <div className="size-16 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {wing.image ? (
                <img src={wing.image} alt={wing.name} className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-primary text-3xl">diversity_3</span>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{wing.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="material-symbols-outlined text-primary text-sm">location_on</span>
                <span className="text-xs text-primary">{wing.location || 'Bangladesh'}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-slate-200 dark:border-slate-800">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{wing.member_count || 0}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Members</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{wing.projects_count || 0}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Projects</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {wing.approval_status === 'approved' ? '✓' : '⏳'}
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                {wing.approval_status === 'approved' ? 'Verified' : 'Pending'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bio Section */}
      {wing.bio && (
        <section className="px-4 mt-6">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3">About</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {wing.bio}
          </p>
        </section>
      )}

      {/* Description Section */}
      {wing.description && (
        <section className="px-4 mt-6">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Description</h2>
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
              {wing.description}
            </p>
          </div>
        </section>
      )}

      {/* Created By */}
      {wing.created_by_name && (
        <section className="px-4 mt-6">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Created By</h2>
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">person</span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{wing.created_by_name}</p>
              <p className="text-xs text-slate-500">Wing Creator</p>
            </div>
          </div>
        </section>
      )}

      {/* Join CTA */}
      <section className="px-4 mt-8">
        <div className="bg-gradient-to-r from-primary to-teal-600 rounded-2xl p-6 text-white text-center">
          <h3 className="text-lg font-bold mb-2">Want to Join This Wing?</h3>
          <p className="text-sm opacity-80 mb-4">Become a volunteer and make a difference in your community.</p>
          <button 
            onClick={() => navigate('/join-us')}
            className="bg-white text-primary font-bold px-6 py-3 rounded-xl hover:bg-slate-100 transition-colors"
          >
            Join UYHO
          </button>
        </div>
      </section>
    </div>
  )
}
