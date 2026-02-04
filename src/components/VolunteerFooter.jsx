import { Link, useLocation } from 'react-router-dom'

export default function VolunteerFooter() {
  const location = useLocation()
  
  const isActive = (path) => {
    if (path === '/volunteer') {
      return location.pathname === '/volunteer'
    }
    return location.pathname.startsWith(path)
  }

  const navItems = [
    { path: '/volunteer', icon: 'home', label: 'Home' },
    { path: '/volunteer/campaigns', icon: 'campaign', label: 'Campaigns' },
    { path: '/volunteer/leaderboard', icon: 'emoji_events', label: 'Leaderboard' },
    { path: '/volunteer/donation', icon: 'volunteer_activism', label: 'Donation' },
    { path: '/volunteer/chat', icon: 'chat', label: 'Chat', badge: true },
    { path: '/volunteer/profile', icon: 'person', label: 'Profile' },
  ]

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white dark:bg-navy-900 border-t border-slate-200 dark:border-slate-700/50 shadow-lg dark:shadow-navy-950/50 z-40">
      <div className="max-w-md mx-auto px-2 py-2 flex items-center justify-around">
        {navItems.map((item) => {
          const active = isActive(item.path)
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                active
                  ? 'text-primary bg-primary/10 dark:bg-primary/20'
                  : 'text-slate-500 dark:text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800/50'
              }`}
            >
              <div className="relative">
                <span 
                  className="material-symbols-outlined text-xl"
                  style={{ fontVariationSettings: active ? '"FILL" 1' : '"FILL" 0' }}
                >
                  {item.icon}
                </span>
                {item.badge && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-navy-900"></span>
                )}
              </div>
              <span className={`text-[10px] ${active ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </footer>
  )
}
