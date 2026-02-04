import { useOrg } from '../context/OrgContext'

export default function Downloads() {
  const { orgData, loading } = useOrg()

  const hasGooglePlay = orgData?.google_play_url && orgData.google_play_url.trim() !== ''
  const hasAppStore = orgData?.app_store_url && orgData.app_store_url.trim() !== ''
  const hasAnyApp = hasGooglePlay || hasAppStore
  const releaseDate = orgData?.app_release_date

  // Format release date
  const formatReleaseDate = (date) => {
    if (!date) return null
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden pb-12">
      {/* Hero Section */}
      <section className="px-4 py-12 text-center bg-gradient-to-br from-primary/5 via-white to-teal-50 dark:from-primary/10 dark:via-slate-900 dark:to-slate-900">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-2xl mb-6">
            <span className="material-symbols-outlined text-4xl text-primary">smartphone</span>
          </div>
          <h1 className="text-slate-900 dark:text-white text-3xl md:text-4xl font-extrabold leading-tight tracking-tight mb-4">
            Download Our App
          </h1>
          <p className="text-primary/80 dark:text-gray-400 text-base md:text-lg leading-relaxed">
            Stay connected with {orgData?.org_name || 'UYHO'} on the go. Get instant notifications, join campaigns, and make a difference right from your phone.
          </p>
        </div>
      </section>

      {/* App Download Section */}
      <section className="px-4 py-12 max-w-3xl mx-auto w-full">
        {hasAnyApp ? (
          <>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 text-center">
              Available Now
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Google Play Store */}
              <a
                href={hasGooglePlay ? orgData.google_play_url : '#'}
                target={hasGooglePlay ? '_blank' : undefined}
                rel="noopener noreferrer"
                className={`flex items-center gap-4 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all ${
                  hasGooglePlay 
                    ? 'hover:shadow-lg hover:border-green-300 dark:hover:border-green-700 hover:-translate-y-1 cursor-pointer' 
                    : 'opacity-50 cursor-not-allowed'
                }`}
                onClick={!hasGooglePlay ? (e) => e.preventDefault() : undefined}
              >
                <div className="w-14 h-14 bg-green-100 dark:bg-green-900/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-7 h-7 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Get it on</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">Google Play</p>
                  {!hasGooglePlay && (
                    <span className="text-xs text-orange-500 font-medium">Coming Soon</span>
                  )}
                </div>
                {hasGooglePlay && (
                  <span className="material-symbols-outlined text-slate-400">arrow_forward</span>
                )}
              </a>

              {/* Apple App Store */}
              <a
                href={hasAppStore ? orgData.app_store_url : '#'}
                target={hasAppStore ? '_blank' : undefined}
                rel="noopener noreferrer"
                className={`flex items-center gap-4 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all ${
                  hasAppStore 
                    ? 'hover:shadow-lg hover:border-slate-400 dark:hover:border-slate-600 hover:-translate-y-1 cursor-pointer' 
                    : 'opacity-50 cursor-not-allowed'
                }`}
                onClick={!hasAppStore ? (e) => e.preventDefault() : undefined}
              >
                <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-7 h-7 text-slate-800 dark:text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Download on the</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">App Store</p>
                  {!hasAppStore && (
                    <span className="text-xs text-orange-500 font-medium">Coming Soon</span>
                  )}
                </div>
                {hasAppStore && (
                  <span className="material-symbols-outlined text-slate-400">arrow_forward</span>
                )}
              </a>
            </div>
          </>
        ) : (
          /* Coming Soon State */
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-primary/20 to-teal-100 dark:from-primary/30 dark:to-teal-900/30 rounded-3xl mb-6 animate-pulse">
              <span className="material-symbols-outlined text-5xl text-primary">rocket_launch</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
              Coming Soon!
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
              We're working hard to bring you an amazing mobile experience. Stay tuned for our app launch!
            </p>
            
            {releaseDate && (
              <div className="inline-flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 px-4 py-2 rounded-full text-sm font-medium">
                <span className="material-symbols-outlined text-lg">event</span>
                Expected Release: {formatReleaseDate(releaseDate)}
              </div>
            )}

            {/* Preview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-10 max-w-xl mx-auto">
              <div className="flex items-center gap-4 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Google Play</p>
                  <p className="text-xs text-slate-500">Coming Soon</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-slate-600 dark:text-slate-300" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z"/>
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">App Store</p>
                  <p className="text-xs text-slate-500">Coming Soon</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className="px-4 py-12 bg-slate-50 dark:bg-slate-800/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-8 text-center">
            What You'll Get
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 rounded-2xl mb-4">
                <span className="material-symbols-outlined text-2xl text-primary">notifications_active</span>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">Instant Updates</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Get notified about new campaigns, events, and opportunities.</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 rounded-2xl mb-4">
                <span className="material-symbols-outlined text-2xl text-primary">volunteer_activism</span>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">Easy Donations</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Donate securely and track your contribution impact.</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 rounded-2xl mb-4">
                <span className="material-symbols-outlined text-2xl text-primary">group</span>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">Join Campaigns</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Participate in campaigns and connect with volunteers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="px-4 py-12">
        <div className="max-w-xl mx-auto text-center">
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            Don't have a smartphone? You can still access all features through our web portal.
          </p>
          <a 
            href="/volunteer/login"
            className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
          >
            <span className="material-symbols-outlined text-lg">login</span>
            Access Volunteer Portal
          </a>
        </div>
      </section>
    </div>
  )
}
