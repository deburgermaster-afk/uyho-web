import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import VolunteerFooter from '../../components/VolunteerFooter'
import { demoCampaigns, demoPrograms } from './demoData'
import { ShimmerStats, ShimmerCard, ShimmerListItem } from '../../components/Shimmer'

export default function VolunteerPortalHome() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard') // 'dashboard', 'campaigns', or 'programs'
  const [pendingCount, setPendingCount] = useState(0)
  const [recentCampaign, setRecentCampaign] = useState(null)
  const [joinedCampaigns, setJoinedCampaigns] = useState([])
  const [campaignsLoading, setCampaignsLoading] = useState(false)
  const [userPermissions, setUserPermissions] = useState({})
  const [userButtonAccess, setUserButtonAccess] = useState([]) // Simple button access from General tab

  // Define which buttons require which permissions (Advanced system)
  const buttonPermissions = {
    general: ['org_settings'],
    committee: ['committee_view'],
    roles: ['role_assign'],
    requests: ['campaign_approve'],
    donReqs: ['donation_requests_view', 'donation_requests_approve'],
    wings: ['wing_manage', 'wing_approve'],
    courses: ['course_create', 'course_manage'],
    badges: ['badge_award'],
    fund: ['ummah_fund_manage'],
    announce: ['announcement_create'],
    access: ['access_manage'],
  }

  // Check if user has access to a button (checks both General and Advanced systems)
  const canSeeButton = (buttonKey) => {
    // Admin email has full access to all buttons
    const userEmail = localStorage.getItem('volunteerEmail') || '';
    if (userEmail.toLowerCase() === 'istiak.ahmed.tj@gmail.com') {
      return true;
    }
    
    // Check General tab access first (simple button assignment)
    if (userButtonAccess.includes(buttonKey)) return true
    
    // Then check Advanced permissions
    const requiredPerms = buttonPermissions[buttonKey] || []
    if (requiredPerms.length === 0) return true  // No permissions required (e.g., committee)
    return requiredPerms.some(perm => userPermissions[perm] === true)
  }

  // Check if user can see any dashboard buttons
  const canSeeDashboard = () => {
    // Admin email has full access
    const userEmail = localStorage.getItem('volunteerEmail') || '';
    if (userEmail.toLowerCase() === 'istiak.ahmed.tj@gmail.com') {
      return true;
    }
    return Object.keys(buttonPermissions).some(key => canSeeButton(key))
  }

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const volunteerId = localStorage.getItem('volunteerId')
        
        if (!volunteerId) {
          // User not logged in, redirect to login
          navigate('/volunteer/login')
          return
        }

        // Fetch user profile
        const response = await fetch(`/api/volunteers/${volunteerId}`)
        if (response.ok) {
          const data = await response.json()
          setUser(data)
        } else {
          // Use fallback from localStorage
          setUser({
            full_name: localStorage.getItem('volunteerName') || 'Volunteer',
            total_hours: 0,
            projects: 0,
            points: 0,
            respect_points: 0
          })
        }
        
        // Fetch user permissions (Advanced system)
        const permRes = await fetch(`/api/access-settings/user/${volunteerId}`)
        if (permRes.ok) {
          const permData = await permRes.json()
          setUserPermissions(permData.permissions || {})
        }
        
        // Fetch button access (General/simple system)
        const buttonAccessRes = await fetch(`/api/button-access/user/${volunteerId}`)
        if (buttonAccessRes.ok) {
          const buttonData = await buttonAccessRes.json()
          setUserButtonAccess(buttonData.buttons || [])
        }
        
        // Fetch pending campaigns count
        const campaignsRes = await fetch('/api/campaigns/pending')
        if (campaignsRes.ok) {
          const campaignsData = await campaignsRes.json()
          setPendingCount(campaignsData.length)
        }

        // Fetch user's most recent joined campaign
        const recentRes = await fetch(`/api/volunteers/${volunteerId}/recent-campaign`)
        if (recentRes.ok) {
          const recentData = await recentRes.json()
          setRecentCampaign(recentData)
        }
        
        // Fetch all joined campaigns
        setCampaignsLoading(true)
        const joinedRes = await fetch(`/api/campaigns?userId=${volunteerId}`)
        if (joinedRes.ok) {
          const allCampaigns = await joinedRes.json()
          const joined = allCampaigns.filter(c => c.is_joined === 1)
          setJoinedCampaigns(joined)
        }
        setCampaignsLoading(false)
      } catch (err) {
        console.error('Failed to fetch user:', err)
        setUser({
          full_name: localStorage.getItem('volunteerName') || 'Volunteer',
          total_hours: 0,
          projects: 0,
          points: 0,
          respect_points: 0
        })
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [navigate])

  // Set default tab based on permissions
  useEffect(() => {
    if (!loading && Object.keys(userPermissions).length === 0 && userButtonAccess.length === 0 && !canSeeDashboard()) {
      setActiveTab('programs')
    }
  }, [loading, userPermissions, userButtonAccess])

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-navy-950 flex flex-col">
        <main className="flex-1 overflow-y-auto w-full max-w-2xl mx-auto pb-[72px]" style={{ minHeight: 0 }}>
          {/* Shimmer Stats Grid */}
          <section className="pt-2 px-4 space-y-3">
            <ShimmerStats />
          </section>
          
          {/* Shimmer Current Campaign */}
          <section className="px-4 py-4">
            <div className="h-4 w-32 skeleton rounded mb-3"></div>
            <ShimmerCard className="aspect-video" />
          </section>
          
          {/* Shimmer Tabs */}
          <section className="px-4 py-2">
            <div className="bg-slate-100 dark:bg-navy-900 p-1 rounded-xl flex gap-1">
              <div className="flex-1 h-10 skeleton rounded-lg"></div>
              <div className="flex-1 h-10 skeleton rounded-lg"></div>
              <div className="flex-1 h-10 skeleton rounded-lg"></div>
            </div>
          </section>
          
          {/* Shimmer List Items */}
          <section className="px-4 py-2 space-y-3">
            <ShimmerListItem />
            <ShimmerListItem />
            <ShimmerListItem />
          </section>
        </main>
        <VolunteerFooter />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <button
          onClick={() => navigate('/volunteer/login')}
          className="bg-primary text-white px-6 py-3 rounded-lg font-bold hover:bg-primary/90"
        >
          Please Login
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col">
      {/* VolunteerHeader removed as requested */}
      <main className="flex-1 overflow-y-auto w-full max-w-2xl mx-auto pb-[72px]" style={{ minHeight: 0 }}>
        {/* Stats Grid - Start of page */}
        <section className="pt-2 px-4 space-y-3">
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col gap-1">
              <span className="material-symbols-outlined text-primary text-base">schedule</span>
              <p className="text-xl font-extrabold">{user.total_hours || user.hours_given || 0}h</p>
              <p className="text-[10px] text-slate-500 font-medium uppercase">Hours</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col gap-1">
              <span className="material-symbols-outlined text-primary text-base">account_tree</span>
              <p className="text-xl font-extrabold">{user.projects || 0}</p>
              <p className="text-[10px] text-slate-500 font-medium uppercase">Projects</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col gap-1">
              <span className="material-symbols-outlined text-purple-500 text-base">military_tech</span>
              <p className="text-xl font-extrabold text-purple-600">{user.respect_points || user.points || 0}</p>
              <p className="text-[10px] text-slate-500 font-medium uppercase">Respect</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col gap-1">
              <span className="material-symbols-outlined text-green-500 text-base">favorite</span>
              <p className="text-xl font-extrabold text-green-600">{user.lives_impacted || 0}</p>
              <p className="text-[10px] text-slate-500 font-medium uppercase">Impact</p>
            </div>
          </div>
        </section>

              {/* Current Campaign */}
              <section className="px-4 py-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Current Campaign</h3>
                </div>
                {recentCampaign ? (
                  <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 group hover:shadow-lg transition-shadow">
                    {/* Hours & Respect badges on top */}
                    <div className="absolute top-3 left-3 z-10 flex gap-2">
                      <span className="text-xs font-bold bg-blue-500/90 text-white px-2 py-1 rounded-full flex items-center gap-1 backdrop-blur">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        {recentCampaign.hours || recentCampaign.program_hours || 0}h
                      </span>
                      <span className="text-xs font-bold bg-purple-500/90 text-white px-2 py-1 rounded-full flex items-center gap-1 backdrop-blur">
                        <span className="material-symbols-outlined text-sm">military_tech</span>
                        +{recentCampaign.respect || recentCampaign.program_respect || 0}
                      </span>
                    </div>
                    <Link to={`/volunteer/campaigns/${recentCampaign.id}`}>
                      <div
                        className="aspect-video bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                        style={{
                          backgroundImage: `url('${recentCampaign.image || demoCampaigns[0].image}')`,
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h4 className="text-lg font-bold text-white">{recentCampaign.title}</h4>
                        <p className="text-xs text-white/80 line-clamp-1">{recentCampaign.description}</p>
                        {/* Organizer info */}
                        <div className="flex items-center gap-2 mt-2">
                          <img 
                            src={recentCampaign.host_avatar || '/avatars/avatar_1.svg'} 
                            alt="Organizer" 
                            className="w-6 h-6 rounded-full border-2 border-white/50"
                          />
                          <span className="text-xs text-white/90 font-medium">
                            Organized by {recentCampaign.host_name || 'UYHO'}
                          </span>
                        </div>
                      </div>
                    </Link>
                    {/* Collect Donation button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        navigate(`/volunteer/donation?campaign=${recentCampaign.id}`)
                      }}
                      className="absolute bottom-3 right-3 bg-primary hover:bg-primary/90 text-white text-xs font-bold px-3 py-2 rounded-full flex items-center gap-1 shadow-lg transition-all hover:scale-105"
                    >
                      <span className="material-symbols-outlined text-sm">volunteer_activism</span>
                      Collect Donation
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/volunteer/campaigns"
                    className="block relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 group hover:shadow-lg transition-shadow"
                  >
                    <div className="absolute top-3 left-3 z-10 flex gap-2">
                      <span className="text-xs font-bold bg-primary/90 text-white px-2 py-1 rounded-full backdrop-blur">+50 Respects</span>
                    </div>
                    <div
                      className="aspect-video bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                      style={{
                        backgroundImage: `url('${demoCampaigns[0].image}')`,
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h4 className="text-lg font-bold text-white">{demoCampaigns[0].title}</h4>
                      <p className="text-xs text-white/80">{demoCampaigns[0].description}</p>
                    </div>
                  </Link>
                )}
              </section>

              {/* Dashboard / Campaigns / Programs Tabs */}
              <section className="px-4 py-2">
                <div className="bg-slate-100 dark:bg-slate-900 p-1 rounded-xl flex">
                  {canSeeDashboard() && (
                    <button
                      onClick={() => setActiveTab('dashboard')}
                      className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                        activeTab === 'dashboard'
                          ? 'bg-white dark:bg-slate-800 shadow-sm text-primary'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Dashboard
                    </button>
                  )}
                  <button
                    onClick={() => setActiveTab('campaigns')}
                    className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                      activeTab === 'campaigns'
                        ? 'bg-white dark:bg-slate-800 shadow-sm text-primary'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Campaigns
                  </button>
                  <button
                    onClick={() => setActiveTab('programs')}
                    className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                      activeTab === 'programs'
                        ? 'bg-white dark:bg-slate-800 shadow-sm text-primary'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Programs
                  </button>
                </div>
              </section>

              {/* Dashboard Content */}
              {activeTab === 'dashboard' && canSeeDashboard() && (
                <section className="px-4 py-4">
                  {/* Dashboard Quick Actions */}
                  <div className="grid grid-cols-4 gap-3 mb-6">
                    {canSeeButton('general') && (
                      <button
                        onClick={() => navigate('/volunteer/org/general')}
                        className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 hover:shadow-lg hover:border-primary/30 transition-all group"
                      >
                        <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                          <span className="material-symbols-outlined text-blue-600">settings</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">General</span>
                      </button>
                    )}

                    {canSeeButton('committee') && (
                      <button
                        onClick={() => navigate('/volunteer/org/committee')}
                        className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 hover:shadow-lg hover:border-primary/30 transition-all group"
                      >
                        <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                          <span className="material-symbols-outlined text-green-600">group</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Committee</span>
                      </button>
                    )}

                    {canSeeButton('roles') && (
                      <button
                        onClick={() => navigate('/volunteer/org/roles')}
                        className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 hover:shadow-lg hover:border-primary/30 transition-all group"
                      >
                        <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                          <span className="material-symbols-outlined text-purple-600">badge</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Roles</span>
                      </button>
                    )}

                    {canSeeButton('requests') && (
                      <button
                        onClick={() => navigate('/volunteer/campaign-requests')}
                        className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 hover:shadow-lg hover:border-primary/30 transition-all group relative"
                      >
                        {pendingCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                            {pendingCount}
                          </span>
                        )}
                        <div className="w-12 h-12 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                          <span className="material-symbols-outlined text-orange-600">campaign</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Requests</span>
                      </button>
                    )}

                    {canSeeButton('donReqs') && (
                      <button
                        onClick={() => navigate('/volunteer/donation-requests')}
                        className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 hover:shadow-lg hover:border-primary/30 transition-all group"
                      >
                        <div className="w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center group-hover:bg-teal-100 transition-colors">
                          <span className="material-symbols-outlined text-teal-600">volunteer_activism</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Don Reqs</span>
                      </button>
                    )}

                    {canSeeButton('wings') && (
                      <button
                        onClick={() => navigate('/volunteer/wings')}
                        className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 hover:shadow-lg hover:border-primary/30 transition-all group"
                      >
                        <div className="w-12 h-12 rounded-full bg-cyan-50 dark:bg-cyan-900/20 flex items-center justify-center group-hover:bg-cyan-100 transition-colors">
                          <span className="material-symbols-outlined text-cyan-600">location_city</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Wings</span>
                      </button>
                    )}

                    {canSeeButton('courses') && (
                      <button
                        onClick={() => navigate('/volunteer/courses')}
                        className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 hover:shadow-lg hover:border-primary/30 transition-all group"
                      >
                        <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                          <span className="material-symbols-outlined text-purple-600">school</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Courses</span>
                      </button>
                    )}

                    {canSeeButton('badges') && (
                      <button
                        onClick={() => navigate('/volunteer/badges')}
                        className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 hover:shadow-lg hover:border-primary/30 transition-all group"
                      >
                        <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                          <span className="material-symbols-outlined text-amber-600">military_tech</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Badges</span>
                      </button>
                    )}

                    {canSeeButton('fund') && (
                      <button
                        onClick={() => navigate('/volunteer/ummah-fund')}
                        className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 hover:shadow-lg hover:border-primary/30 transition-all group"
                      >
                        <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                          <span className="material-symbols-outlined text-emerald-600">account_balance</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Fund</span>
                      </button>
                    )}

                    {canSeeButton('announce') && (
                      <button
                        onClick={() => navigate('/volunteer/announcements')}
                        className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 hover:shadow-lg hover:border-primary/30 transition-all group"
                      >
                        <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                          <span className="material-symbols-outlined text-red-600">campaign</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Announce</span>
                      </button>
                    )}

                    {canSeeButton('access') && (
                      <button
                        onClick={() => navigate('/volunteer/access')}
                        className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 hover:shadow-lg hover:border-primary/30 transition-all group"
                      >
                        <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                          <span className="material-symbols-outlined text-indigo-600">admin_panel_settings</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Access</span>
                      </button>
                    )}
                  </div>
                </section>
              )}

              {/* Programs Content */}
              {activeTab === 'programs' && (
                <section className="px-4 py-4">
                  <div className="text-center py-8">
                    <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-700 block mb-2">event</span>
                    <p className="text-slate-500 text-sm mb-4">Browse programs and events</p>
                    <Link 
                      to="/volunteer/programs" 
                      className="inline-block bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary/90"
                    >
                      View All Programs
                    </Link>
                  </div>
                </section>
              )}

              {/* Campaigns Content */}
              {activeTab === 'campaigns' && (
                <section className="px-4 py-4">
                  {campaignsLoading ? (
                    <div className="text-center py-12">
                      <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
                      <p className="text-slate-500 text-sm mt-2">Loading campaigns...</p>
                    </div>
                  ) : joinedCampaigns.length === 0 ? (
                    <div className="text-center py-12">
                      <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-700 block mb-2">campaign</span>
                      <p className="text-slate-500 text-sm">No joined campaigns yet</p>
                      <Link to="/volunteer/campaigns" className="inline-block mt-4 bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary/90">
                        Browse Campaigns
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {joinedCampaigns.map((campaign) => (
                        <Link
                          key={campaign.id}
                          to={`/volunteer/campaigns/${campaign.id}`}
                          className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-slate-800 hover:shadow-md transition-shadow"
                        >
                          <div className="relative w-14 h-14 rounded-lg bg-cover bg-center flex-shrink-0" style={{ backgroundImage: `url('${campaign.image || demoCampaigns[0].image}')` }}>
                            {campaign.urgency === 1 && (
                              <div className="absolute -top-1 -left-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-bold text-sm truncate">{campaign.title}</h4>
                              <span className="text-[9px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded whitespace-nowrap flex-shrink-0">
                                {campaign.wing}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                              <span className="flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-[10px] text-primary">groups</span>
                                {campaign.joined_count ?? campaign.volunteers_joined ?? 0}/{campaign.volunteers_needed}
                              </span>
                              <span className="flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-[10px] text-primary">schedule</span>
                                {campaign.days_left || 30}d
                              </span>
                              <span className="flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-[10px]">location_on</span>
                                <span className="truncate max-w-[60px]">{campaign.location || 'TBD'}</span>
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </section>
              )}
      </main>
      <VolunteerFooter />
    </div>
  )
}
