import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import VolunteerFooter from '../../components/VolunteerFooter'

export default function ViewProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [volunteer, setVolunteer] = useState(null)
  const [activities, setActivities] = useState([])
  const [badges, setBadges] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('info')
  const [isAlly, setIsAlly] = useState(false)
  const [allyCount, setAllyCount] = useState(0)
  const [addingAlly, setAddingAlly] = useState(false)
  
  const currentUserId = localStorage.getItem('volunteerId')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [volRes, actRes, allyCountRes, badgesRes] = await Promise.all([
          fetch(`/api/volunteers/${id}`),
          fetch(`/api/volunteers/${id}/activities`),
          fetch(`/api/allies/${id}/count`),
          fetch(`https://uyho.org/uyho-backend/api/volunteers/${id}/badges`)
        ])
        if (volRes.ok) {
          const volData = await volRes.json()
          setVolunteer(volData)
        }
        if (actRes.ok) {
          const actData = await actRes.json()
          setActivities(actData)
        }
        if (allyCountRes.ok) {
          const countData = await allyCountRes.json()
          setAllyCount(countData.count)
        }
        if (badgesRes.ok) {
          const badgesData = await badgesRes.json()
          setBadges(badgesData)
        }
        
        // Check if this person is already an ally
        if (currentUserId) {
          const checkRes = await fetch(`/api/allies/check/${currentUserId}/${id}`)
          if (checkRes.ok) {
            const checkData = await checkRes.json()
            setIsAlly(checkData.isAlly)
          }
        }
      } catch (err) {
        console.error('Failed to load profile', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id, currentUserId])

  const handleAddAlly = async () => {
    if (!currentUserId || addingAlly) return
    
    setAddingAlly(true)
    try {
      const res = await fetch('/api/allies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volunteerId: currentUserId, allyId: id })
      })
      if (res.ok) {
        setIsAlly(true)
        setAllyCount(prev => prev + 1)
      }
    } catch (err) {
      console.error('Failed to add ally', err)
    } finally {
      setAddingAlly(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-2xl text-slate-500">progress_activity</span>
      </div>
    )
  }

  if (!volunteer) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-red-600 font-bold mb-2">Volunteer not found</p>
          <button onClick={() => navigate(-1)} className="px-4 py-2 bg-primary text-white rounded-lg">Go Back</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <main className="max-w-md mx-auto pb-24">

        {/* Back Button */}
        <div className="px-6 pt-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
          </button>
        </div>

        {/* Profile Top */}
        <div className="px-6 pt-8 pb-4 flex items-start gap-5">
          <div className="relative flex-shrink-0">
            <div className="size-24 rounded-full border-[2px] border-primary p-1">
              <div
                className="size-full rounded-full bg-center bg-cover"
                style={{
                  backgroundImage: volunteer.avatar 
                    ? `url("${volunteer.avatar}")` 
                    : 'url("/avatars/avatar_1.svg")',
                }}
              />
            </div>
            <div className="absolute bottom-0 right-0 bg-primary text-white p-0.5 rounded-full border-2 border-white dark:border-slate-900">
              <span className="material-symbols-outlined text-[10px] fill-icon">
                verified
              </span>
            </div>
          </div>

          <div className="flex-grow pt-1">
            <h2 className="text-2xl font-heading font-bold tracking-tight mb-0.5">
              {volunteer.full_name}
            </h2>
            <p className="text-primary/60 dark:text-slate-400 font-medium text-xs mb-1">
              {volunteer.central_role || volunteer.position || 'Volunteer'}
              {volunteer.parent_wing && (
                <> • <button onClick={() => navigate(`/volunteer/wing/${volunteer.parent_wing.wing_id}`)} className="hover:text-primary transition-colors">{volunteer.parent_wing.wing_name}</button></>
              )}
            </p>
            
            {/* Active Volunteer + Ally Count */}
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                <span className="size-1.5 bg-emerald-500 rounded-full"></span>
                Active Volunteer
              </span>
              <button 
                onClick={() => navigate(`/volunteer/allies/${id}?name=${encodeURIComponent(volunteer.full_name)}`)}
                className="text-[10px] text-slate-400 font-medium hover:text-primary transition-colors"
              >
                • {allyCount} {allyCount === 1 ? 'Ally' : 'Allies'}
              </button>
            </div>

            <div className="flex gap-2">
              {isAlly ? (
                <div className="flex-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider py-2.5 rounded-lg flex items-center justify-center gap-1.5">
                  <span className="material-symbols-outlined text-sm fill-icon">check_circle</span>
                  Your Ally
                </div>
              ) : (
                <button 
                  onClick={handleAddAlly}
                  disabled={addingAlly}
                  className="flex-1 bg-primary text-white text-[10px] font-bold uppercase tracking-wider py-2.5 rounded-lg disabled:opacity-50"
                >
                  {addingAlly ? 'Adding...' : 'Add as Ally'}
                </button>
              )}
              <button 
                onClick={() => navigate(`/volunteer/chat?with=${id}`)}
                className="flex-1 bg-slate-100 dark:bg-slate-800 text-primary dark:text-white text-[10px] font-bold uppercase tracking-wider py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">chat</span>
                Message
              </button>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="px-6 mb-4">
          {badges.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto no-scrollbar py-2">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex-shrink-0 flex flex-col items-center"
                  title={badge.name}
                >
                  <div
                    className="size-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${badge.color}20` }}
                  >
                    <span
                      className="material-symbols-outlined !text-2xl"
                      style={{ color: badge.color }}
                    >
                      {badge.icon_url || 'military_tech'}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1 max-w-[60px] truncate">
                    {badge.name}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto no-scrollbar py-2">
              {[
                ["military_tech", "#9ca3af"],
              ].map(([icon, color], i) => (
                <div
                  key={i}
                  className="size-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0"
                >
                  <span
                    className="material-symbols-outlined !text-xl"
                    style={{ color }}
                  >
                    {icon}
                  </span>
                </div>
              ))}
              <span className="text-xs text-gray-400 self-center ml-2">No badges yet</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="px-6 mb-6">
          <div className="bg-slate-100 dark:bg-slate-900 p-1 rounded-xl flex">
            <button 
              onClick={() => setActiveTab('info')}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg ${
                activeTab === 'info' 
                  ? 'bg-white dark:bg-slate-800 shadow-sm' 
                  : 'text-slate-400'
              }`}
            >
              General Info
            </button>
            <button 
              onClick={() => setActiveTab('activity')}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg ${
                activeTab === 'activity' 
                  ? 'bg-white dark:bg-slate-800 shadow-sm' 
                  : 'text-slate-400'
              }`}
            >
              Recent Activity
            </button>
          </div>
        </div>

        {activeTab === 'info' && (
          <>
            {/* Stats */}
            <section className="px-6 mb-8">
              <div className="grid grid-cols-3 gap-3">
                {[
                  [volunteer.lives_impacted || 0, "Impacted"],
                  [volunteer.teams_led || 0, "Teams"],
                  [volunteer.hours_given || 0, "Hours"],
                ].map(([value, label]) => (
                  <div
                    key={label}
                    className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex flex-col items-center text-center"
                  >
                    <span className="text-xl font-heading font-bold">{value}</span>
                    <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 mt-1">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Respect Points */}
            <section className="px-6 mb-8">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex flex-col items-center text-center">
                  <span className="material-symbols-outlined fill-icon text-2xl text-primary mb-1">military_tech</span>
                  <span className="text-xl font-heading font-bold">{volunteer.respect_points || 0}</span>
                  <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 mt-1">
                    Respect
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex flex-col items-center text-center">
                  <span className="material-symbols-outlined fill-icon text-2xl text-primary mb-1">badge</span>
                  <span className="text-sm font-heading font-bold">{volunteer.digital_id}</span>
                  <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 mt-1">
                    Volunteer ID
                  </span>
                </div>
              </div>
            </section>

            {/* Contact Info */}
            <section className="px-6 mb-8">
              <h3 className="font-heading font-bold text-lg mb-4">
                Contact Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
                  <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">mail</span>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Email</p>
                    <p className="text-sm font-medium">{volunteer.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
                  <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">phone</span>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Phone</p>
                    <p className="text-sm font-medium">{volunteer.phone || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
                  <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">location_on</span>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Address</p>
                    <p className="text-sm font-medium">{volunteer.address || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {activeTab === 'activity' && (
          <section className="mb-8 px-6">
            <h3 className="font-heading font-bold text-lg mb-4">
              Activity Timeline
            </h3>

            {activities.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No activities yet</p>
            ) : (
              <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-slate-100 dark:before:bg-slate-800">
                {activities.map((activity, index) => {
                  const getTimeAgo = (dateStr) => {
                    const date = new Date(dateStr);
                    const now = new Date();
                    const diffMs = now - date;
                    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                    const diffWeeks = Math.floor(diffDays / 7);
                    const diffMonths = Math.floor(diffDays / 30);
                    
                    if (diffDays === 0) return 'Today';
                    if (diffDays === 1) return '1d ago';
                    if (diffDays < 7) return `${diffDays}d ago`;
                    if (diffWeeks === 1) return '1w ago';
                    if (diffWeeks < 4) return `${diffWeeks}w ago`;
                    if (diffMonths === 1) return '1m ago';
                    return `${diffMonths}m ago`;
                  };
                  
                  return (
                    <div key={activity.id} className="relative pl-10">
                      <div className={`absolute left-0 top-1 size-6 rounded-full bg-white border-2 ${
                        index === 0 ? 'border-primary' : 'border-slate-200'
                      } flex items-center justify-center`}>
                        <span className={`size-2 rounded-full ${index === 0 ? 'bg-primary' : 'bg-slate-300'}`} />
                      </div>

                      <div className="flex justify-between items-start">
                        <p className="text-sm font-bold">{activity.description}</p>
                        <span className="text-[10px] text-slate-400 ml-2 flex-shrink-0">
                          {getTimeAgo(activity.created_at)}
                        </span>
                      </div>
                      {activity.activity_type === 'joined_campaign' && activity.campaign_title && (
                        <p className="text-xs italic text-slate-500 bg-slate-50 p-3 rounded-xl border-l-2 border-primary/20 mt-2">
                          Campaign: {activity.campaign_title}
                          {activity.role && ` • Role: ${activity.role}`}
                        </p>
                      )}
                      {activity.activity_type === 'joined_wing' && activity.role && (
                        <p className="text-xs text-slate-500 mt-1">
                          Role: {activity.role}
                        </p>
                      )}
                      {activity.activity_type === 'position_change' && activity.role && (
                        <p className="text-xs text-slate-500 mt-1">
                          New Position: {activity.role}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

      </main>
      <VolunteerFooter />
    </div>
  )
}
