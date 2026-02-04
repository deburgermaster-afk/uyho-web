import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function VolunteerHeader({ title = 'Volunteer Portal', showBack = false, onSearchClick }) {
  const navigate = useNavigate()
  const [notificationCount, setNotificationCount] = useState(0)
  const volunteerId = localStorage.getItem('volunteerId')

  useEffect(() => {
    const fetchNotificationCount = async () => {
      if (!volunteerId) return
      try {
        const res = await fetch(`/api/notifications/${volunteerId}/count`)
        if (res.ok) {
          const data = await res.json()
          setNotificationCount(data.count || 0)
        }
      } catch (err) {
        console.error('Failed to fetch notification count:', err)
      }
    }

    fetchNotificationCount()
    // Refresh count every 30 seconds
    const interval = setInterval(fetchNotificationCount, 30000)
    return () => clearInterval(interval)
  }, [volunteerId])

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-navy-900/95 backdrop-blur-md px-4 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50 shadow-sm dark:shadow-navy-950/50">
      <div className="flex items-center gap-3">
        {showBack ? (
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-lg transition"
          >
            <span className="material-symbols-outlined text-slate-700 dark:text-slate-200">arrow_back</span>
          </button>
        ) : (
          <img src="/logo.png" alt="UYHO Logo" className="h-10 w-auto" />
        )}
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={onSearchClick}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-lg transition relative"
        >
          <span className="material-symbols-outlined text-slate-700 dark:text-slate-200">search</span>
        </button>
        <button 
          onClick={() => navigate('/volunteer/notifications')}
          className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-lg transition"
        >
          <span className="material-symbols-outlined text-slate-700 dark:text-slate-200">notifications</span>
          {notificationCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
              {notificationCount > 99 ? '99+' : notificationCount}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}
