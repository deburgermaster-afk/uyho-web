import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import VolunteerFooter from '../../components/VolunteerFooter'
import { ShimmerCard, ShimmerListItem } from '../../components/Shimmer'

export default function CampaignsPage() {
  const [submenu, setSubmenu] = useState('projects')
  const [filter, setFilter] = useState('all')
  const [campaigns, setCampaigns] = useState([])
  const [joiningId, setJoiningId] = useState(null)
  const [showShareModal, setShowShareModal] = useState(null)
  const [allies, setAllies] = useState([])
  const [sharingTo, setSharingTo] = useState(null)
  const [allySearchQuery, setAllySearchQuery] = useState('')
  const [joinedSearchQuery, setJoinedSearchQuery] = useState('')
  const [courses, setCourses] = useState([])
  const [coursesLoading, setCoursesLoading] = useState(false)
  const [enrollingCourseId, setEnrollingCourseId] = useState(null)
  const [userBadges, setUserBadges] = useState([])
  const [allBadges, setAllBadges] = useState([])
  const navigate = useNavigate()
  const currentUserId = localStorage.getItem('volunteerId')

  const projectRoles = [
    'Project Manager',
    'Operations Lead',
    'Logistics Coordinator',
    'Field Lead',
    'Volunteer Coordinator'
  ]

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const res = await fetch(currentUserId ? `/api/campaigns?userId=${currentUserId}` : '/api/campaigns')
        if (res.ok) {
          const data = await res.json()
          const dbCampaigns = (data || []).map(c => ({
            id: c.id,
            title: c.title,
            category: c.wing,
            image: c.image || 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=60&crop=faces,center',
            location: c.location || 'TBD',
            volunteersJoined: c.joined_count ?? c.volunteers_joined ?? 0,
            volunteersNeeded: c.volunteers_needed || 10,
            raised: c.raised || 0,
            goal: c.goal || c.budget || 0,
            daysLeft: c.days_left ?? 30,
            urgency: c.urgency === 1,
            isHost: currentUserId ? c.host_id?.toString() === currentUserId : false,
            isJoined: c.is_joined === 1,
            userRole: c.user_role || null,
            status: c.status || 'Active',
            eventDate: c.event_date
          }))
          setCampaigns(dbCampaigns)
        }
      } catch (err) {
        console.error('Failed to fetch campaigns:', err)
      }
    }

    const loadCourses = async () => {
      setCoursesLoading(true)
      try {
        const res = await fetch(`/api/courses?status=approved${currentUserId ? `&userId=${currentUserId}` : ''}`)
        if (res.ok) {
          const data = await res.json()
          setCourses(data)
        }
      } catch (err) {
        console.error('Failed to fetch courses:', err)
      } finally {
        setCoursesLoading(false)
      }
    }

    const loadBadges = async () => {
      try {
        // Load all available badges
        const allRes = await fetch('/api/badges')
        if (allRes.ok) {
          const allData = await allRes.json()
          setAllBadges(allData)
        }
        
        // Load user's earned badges
        if (currentUserId) {
          const userRes = await fetch(`/api/volunteers/${currentUserId}/badges`)
          if (userRes.ok) {
            const userData = await userRes.json()
            setUserBadges(userData)
          }
        }
      } catch (err) {
        console.error('Failed to fetch badges:', err)
      }
    }

    loadCampaigns()
    loadCourses()
    loadBadges()
  }, [currentUserId])

  const handleCourseEnroll = async (courseId, e) => {
    e.stopPropagation()
    if (!currentUserId) {
      navigate('/volunteer/login')
      return
    }
    setEnrollingCourseId(courseId)
    try {
      const res = await fetch(`/api/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volunteerId: currentUserId })
      })
      if (res.ok) {
        // Update course in state
        setCourses(prev => prev.map(c =>
          c.id === courseId
            ? { ...c, is_enrolled: 1, enrolled_count: (c.enrolled_count || 0) + 1 }
            : c
        ))
      }
    } catch (err) {
      console.error('Failed to enroll in course:', err)
      alert('Failed to enroll in course')
    } finally {
      setEnrollingCourseId(null)
    }
  }

  const handleJoin = async (campaignId) => {
    if (!currentUserId) {
      navigate('/volunteer/login')
      return
    }
    setJoiningId(campaignId)
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volunteerId: currentUserId, role: 'Volunteer' })
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Join failed')
      }
      setCampaigns(prev => prev.map(c =>
        c.id === campaignId
          ? {
              ...c,
              isJoined: true,
              volunteersJoined: data.joinedCount ?? c.volunteersJoined + 1,
              userRole: c.userRole || 'Volunteer'
            }
          : c
      ))
    } catch (err) {
      console.error('Failed to join campaign', err)
      alert(err.message || 'Unable to join campaign right now.')
    } finally {
      setJoiningId(null)
    }
  }

  // Fetch allies for share modal
  const fetchAllies = async () => {
    if (!currentUserId) return
    try {
      const res = await fetch(`/api/allies/${currentUserId}`)
      if (res.ok) {
        const data = await res.json()
        setAllies(data)
      }
    } catch (err) {
      console.error('Failed to fetch allies', err)
    }
  }

  const handleShareClick = (campaign, e) => {
    e.stopPropagation()
    setShowShareModal(campaign)
    fetchAllies()
  }

  const handleShareToAlly = async (ally) => {
    if (!showShareModal || !currentUserId) return
    setSharingTo(ally.id)
    try {
      // Create or get conversation
      const convRes = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId1: currentUserId, userId2: ally.id })
      })
      if (!convRes.ok) throw new Error('Failed to create conversation')
      const conv = await convRes.json()
      
      // Send campaign message
      const msgRes = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conv.id,
          senderId: currentUserId,
          content: JSON.stringify({
            id: showShareModal.id,
            title: showShareModal.title,
            image: showShareModal.image,
            location: showShareModal.location,
            volunteersJoined: showShareModal.volunteersJoined,
            volunteersNeeded: showShareModal.volunteersNeeded,
            raised: showShareModal.raised,
            goal: showShareModal.goal,
            daysLeft: showShareModal.daysLeft,
            category: showShareModal.category
          }),
          messageType: 'campaign'
        })
      })
      if (msgRes.ok) {
        setShowShareModal(null)
        alert(`Campaign shared with ${ally.full_name}!`)
      }
    } catch (err) {
      console.error('Failed to share campaign', err)
      alert('Failed to share campaign')
    } finally {
      setSharingTo(null)
    }
  }

  const handleShareExternal = async () => {
    if (!showShareModal) return
    const shareUrl = `${window.location.origin}/volunteer/campaigns/${showShareModal.id}`
    const shareText = `Check out this campaign: ${showShareModal.title}\n\n📍 ${showShareModal.location}\n👥 ${showShareModal.volunteersJoined}/${showShareModal.volunteersNeeded} volunteers\n💰 ৳${showShareModal.raised}/${showShareModal.goal} raised\n⏰ ${showShareModal.daysLeft} days left\n\n`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: showShareModal.title,
          text: shareText,
          url: shareUrl
        })
      } catch (err) {
        console.log('Share cancelled')
      }
    } else {
      navigator.clipboard.writeText(shareText + shareUrl)
      alert('Link copied to clipboard!')
    }
  }

  const submenuTabs = [
    { key: 'projects', label: 'Campaigns' },
    { key: 'activity', label: 'Activity' },
    { key: 'joined', label: 'Joined' },
    { key: 'manage', label: 'Manage' }
  ]

  const filterTabs = [
    { key: 'all', label: 'All Programs' },
    { key: 'health', label: 'Health' },
    { key: 'education', label: 'Education' },
    { key: 'relief', label: 'Relief' }
  ]

  const filteredCampaigns = filter === 'all'
    ? campaigns
    : campaigns.filter(c => c.category?.toLowerCase() === filter)

  const goToApply = () => {
    navigate('/volunteer/campaigns/apply')
  }

  const openCampaign = (campaignId) => {
    navigate(`/volunteer/campaigns/${campaignId}`)
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col">
      <div className="max-w-md mx-auto w-full pb-24">
        <div className="flex mt-2">
          {submenuTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setSubmenu(tab.key)}
              className={`flex-1 py-3 text-sm font-bold ${submenu === tab.key ? 'text-primary border-b-2 border-primary' : 'text-gray-500 dark:text-gray-400 border-b-2 border-transparent'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {submenu === 'projects' && (
          <>
            <div className="flex gap-3 px-4 py-4 overflow-x-auto no-scrollbar">
              {filterTabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-xl px-5 shadow-sm font-bold leading-normal text-sm ${
                    filter === tab.key
                      ? 'bg-primary text-white shadow-primary/20'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="px-4 space-y-4 pb-12">
              {filteredCampaigns.length > 0 ? (
                filteredCampaigns.map(campaign => (
                  <div
                    key={campaign.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openCampaign(campaign.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        openCampaign(campaign.id)
                      }
                    }}
                    className="flex flex-col overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 dark:border-gray-700 cursor-pointer"
                  >
                    <div className="relative w-full aspect-[21/9] bg-center bg-no-repeat bg-cover" style={{ backgroundImage: `url('${campaign.image}')` }}>
                      {campaign.urgency && campaign.status !== 'Finished' && (
                        <div className="absolute top-3 left-3 bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider shadow-lg">Urgent</div>
                      )}
                      {campaign.status === 'Finished' && (
                        <div className="absolute top-3 left-3 bg-gray-500 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider shadow-lg">Finished</div>
                      )}
                      <div className="absolute bottom-3 right-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold shadow-sm">
                        {campaign.category}
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="mb-3">
                        <h4 className="text-base font-extrabold text-[#0f181a] dark:text-white leading-tight">
                          {campaign.title}
                        </h4>
                        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 mt-1">
                          <span className="material-symbols-outlined text-[14px]">location_on</span>
                          <p className="text-xs font-semibold">{campaign.location}</p>
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg py-2 px-3 flex items-center justify-start gap-4 mb-4 border border-gray-100 dark:border-gray-700/50">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-primary text-[16px]">groups</span>
                          <span className="text-[11px] font-extrabold text-gray-700 dark:text-gray-200 uppercase tracking-wide">{campaign.volunteersJoined}/{campaign.volunteersNeeded} Joined</span>
                        </div>
                        <div className="w-px h-3 bg-gray-200 dark:bg-gray-700"></div>
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-primary text-[16px]">payments</span>
                          <span className="text-[11px] font-extrabold text-gray-700 dark:text-gray-200 uppercase tracking-wide">৳{campaign.raised}/{campaign.goal} Raised</span>
                        </div>
                        <div className="w-px h-3 bg-gray-200 dark:bg-gray-700"></div>
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-primary text-[16px]">schedule</span>
                          <span className={`text-[11px] font-extrabold uppercase tracking-wide text-nowrap ${campaign.status === 'Finished' || campaign.daysLeft <= 0 ? 'text-red-500' : 'text-gray-700 dark:text-gray-200'}`}>
                            {campaign.status === 'Finished' ? 'Finished' : campaign.daysLeft <= 0 ? 'Event Passed' : `${campaign.daysLeft} Days Left`}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {campaign.isHost ? (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); navigate(`/volunteer/campaigns/${campaign.id}/edit`) }}
                              className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-2.5 rounded-lg transition-colors text-sm"
                            >
                              Edit
                            </button>
                            <button onClick={(e) => handleShareClick(campaign, e)} className="px-3 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800">
                              <span className="material-symbols-outlined text-gray-500 text-lg">share</span>
                            </button>
                          </>
                        ) : (() => {
                          const isProjectRole = projectRoles.some(role => (campaign.userRole || '').toLowerCase() === role.toLowerCase())
                          if (isProjectRole) {
                            return (
                              <>
                                <button
                                  onClick={(e) => { e.stopPropagation(); navigate(`/volunteer/campaign/${campaign.id}`) }}
                                  className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-2.5 rounded-lg transition-colors text-sm"
                                >
                                  Manage Tasks
                                </button>
                                <button onClick={(e) => handleShareClick(campaign, e)} className="px-3 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800">
                                  <span className="material-symbols-outlined text-gray-500 text-lg">share</span>
                                </button>
                              </>
                            )
                          }
                          if (campaign.isJoined) {
                            return (
                              <>
                                <button
                                  onClick={(e) => { e.stopPropagation(); openCampaign(campaign.id) }}
                                  className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-2.5 rounded-lg transition-colors text-sm"
                                >
                                  View Campaign
                                </button>
                                <button onClick={(e) => handleShareClick(campaign, e)} className="px-3 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800">
                                  <span className="material-symbols-outlined text-gray-500 text-lg">share</span>
                                </button>
                              </>
                            )
                          }
                          // Check if campaign is finished or days left is 0 or less
                          const isFinished = campaign.status === 'Finished' || campaign.daysLeft <= 0
                          if (isFinished) {
                            return (
                              <>
                                <button
                                  onClick={(e) => { e.stopPropagation(); openCampaign(campaign.id) }}
                                  className="flex-1 bg-gray-400 text-white font-bold py-2.5 rounded-lg text-sm cursor-not-allowed"
                                  disabled
                                >
                                  Campaign Ended
                                </button>
                                <button onClick={(e) => handleShareClick(campaign, e)} className="px-3 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800">
                                  <span className="material-symbols-outlined text-gray-500 text-lg">share</span>
                                </button>
                              </>
                            )
                          }
                          return (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleJoin(campaign.id) }}
                                className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-2.5 rounded-lg transition-colors text-sm disabled:opacity-60"
                                disabled={joiningId === campaign.id}
                              >
                                {joiningId === campaign.id ? 'Joining...' : 'Join Now'}
                              </button>
                              <button onClick={(e) => handleShareClick(campaign, e)} className="px-3 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800">
                                <span className="material-symbols-outlined text-gray-500 text-lg">share</span>
                              </button>
                            </>
                          )
                        })()}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-700 block mb-2">campaign</span>
                  <p className="text-slate-500 text-sm">No campaigns found</p>
                </div>
              )}
            </div>
          </>
        )}

        {submenu === 'activity' && (
          <main className="flex-1 max-w-md mx-auto w-full pb-24 overflow-x-hidden">

            {/* Digital Courses */}
            <div className="pt-6">
              <div className="px-4 mb-4 flex justify-between items-center">
                <h3 className="text-[#0f181a] dark:text-white text-lg font-extrabold tracking-tight">
                  Digital Courses
                </h3>
                <span 
                  onClick={() => navigate('/volunteer/courses')}
                  className="text-primary text-xs font-bold uppercase cursor-pointer hover:underline"
                >
                  View All
                </span>
              </div>

              {coursesLoading ? (
                <div className="flex gap-4 px-4 overflow-x-auto no-scrollbar">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="min-w-[280px]">
                      <ShimmerCard />
                    </div>
                  ))}
                </div>
              ) : courses.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">school</span>
                  <p className="text-sm text-gray-500">No courses available yet</p>
                </div>
              ) : (
                <div className="flex gap-4 px-4 overflow-x-auto no-scrollbar snap-x">
                  {courses.map((course) => (
                    <div 
                      key={course.id} 
                      className="min-w-[280px] snap-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow relative"
                    >
                      {/* Edit button for instructor */}
                      {currentUserId && course.instructor_id?.toString() === currentUserId && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/volunteer/courses/${course.id}/edit`);
                          }}
                          className="absolute top-2 right-2 z-10 w-8 h-8 bg-white dark:bg-gray-700 rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                        >
                          <span className="material-symbols-outlined text-base text-gray-600 dark:text-gray-300">edit</span>
                        </button>
                      )}
                      
                      {/* Course Image - Clickable */}
                      <div
                        onClick={() => navigate(`/volunteer/courses/${course.id}`)}
                        className="w-full h-32 rounded-xl mb-3 bg-center bg-cover bg-gray-200 dark:bg-gray-700 cursor-pointer"
                        style={{ backgroundImage: course.image ? `url("${course.image}")` : 'none' }}
                      >
                        {!course.image && (
                          <div className="w-full h-full rounded-xl flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/40">
                            <span className="material-symbols-outlined text-4xl text-primary/50">school</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Course Info - Clickable */}
                      <div 
                        onClick={() => navigate(`/volunteer/courses/${course.id}`)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                            {course.badge || course.category || 'Course'}
                          </span>
                          {course.slide_file_name && (
                            <span className="bg-orange-100 text-orange-600 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-[10px]">slideshow</span>
                              PPT
                            </span>
                          )}
                          {course.has_passed === 1 && (
                            <span className="bg-green-100 text-green-600 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-[10px]">verified</span>
                              Passed
                            </span>
                          )}
                        </div>
                        <h4 className="font-extrabold text-[#0f181a] dark:text-white text-base mb-1">
                          {course.title}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
                          {course.description || 'No description available'}
                        </p>
                      </div>

                      {/* Progress Bar for Enrolled Users */}
                      {course.is_enrolled === 1 && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 mb-1">
                            <span>Progress</span>
                            <span>{course.user_progress || 0}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all ${course.has_passed === 1 ? 'bg-green-500' : 'bg-primary'}`}
                              style={{ width: `${course.user_progress || 0}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 mb-3">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">schedule</span>
                          {course.duration_hours || 1} Hours
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">grade</span>
                          {(course.rating || 0).toFixed(1)}/5.0
                        </span>
                      </div>

                      {/* Enrolled Users and Action Button */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex -space-x-2">
                            {course.enrolled_users && course.enrolled_users.length > 0 ? (
                              <>
                                {course.enrolled_users.slice(0, 3).map((user, idx) => (
                                  <img 
                                    key={user.id || idx} 
                                    src={user.avatar || `/avatars/avatar_${(idx % 8) + 1}.svg`} 
                                    className="size-6 rounded-full border-2 border-white dark:border-gray-800 object-cover" 
                                    alt={user.full_name || 'Enrolled user'} 
                                  />
                                ))}
                                {course.enrolled_count > 3 && (
                                  <div className="size-6 rounded-full border-2 border-white dark:border-gray-800 bg-gray-100 dark:bg-gray-600 flex items-center justify-center">
                                    <span className="text-[9px] font-bold text-gray-500 dark:text-gray-300">+{course.enrolled_count - 3}</span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <span className="text-[10px] text-gray-400">{course.enrolled_count || 0} enrolled</span>
                            )}
                          </div>
                        </div>

                        {/* Action Button */}
                        {course.is_enrolled === 1 ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/volunteer/courses/${course.id}`);
                            }}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                              course.has_passed === 1 
                                ? 'bg-green-500 text-white hover:bg-green-600' 
                                : 'bg-primary text-white hover:bg-primary/90'
                            }`}
                          >
                            {course.has_passed === 1 ? 'Certificate' : 'Continue'}
                          </button>
                        ) : (
                          <button
                            onClick={(e) => handleCourseEnroll(course.id, e)}
                            disabled={enrollingCourseId === course.id}
                            className="bg-primary text-white px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-50 hover:bg-primary/90 transition-colors"
                          >
                            {enrollingCourseId === course.id ? (
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs animate-spin">progress_activity</span>
                                Enrolling
                              </span>
                            ) : 'Enroll'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* All Available Badges */}
            <div className="pt-8 px-4">
              <h3 className="text-[#0f181a] dark:text-white text-lg font-extrabold tracking-tight mb-4">
                All Available Badges
              </h3>

              <div className="space-y-3">
                {allBadges.map((badge, index) => {
                  const isEarned = userBadges.some(ub => ub.id === badge.id)
                  return (
                    <div 
                      key={badge.id || index} 
                      onClick={() => navigate(`/volunteer/badges/${badge.id}`)}
                      className={`flex items-start gap-3 bg-white dark:bg-gray-800 p-4 rounded-xl border cursor-pointer hover:shadow-md transition-shadow ${
                        isEarned ? 'border-primary/50 bg-primary/5' : 'border-gray-100 dark:border-gray-700'
                      }`}
                    >
                      <div 
                        className="size-12 rounded-xl flex items-center justify-center shrink-0"
                        style={{ 
                          backgroundColor: isEarned ? `${badge.color}20` : '#f3f4f6',
                          color: isEarned ? badge.color : '#9ca3af'
                        }}
                      >
                        <span className="material-symbols-outlined text-2xl">
                          {badge.icon || 'military_tech'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-bold ${isEarned ? 'text-[#0f181a] dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                            {badge.name}
                          </p>
                          {isEarned && (
                            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                              Earned
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {badge.description || 'Complete activities to earn this badge'}
                        </p>
                        {badge.criteria && (
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 italic">
                            Criteria: {badge.criteria}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
                {allBadges.length === 0 && (
                  <div className="text-center py-6 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl">
                    <span className="material-symbols-outlined text-4xl mb-2 block">workspace_premium</span>
                    <p className="text-sm">No badges available yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Volunteer Tips */}
            <div className="pt-8 px-4">
              <h3 className="text-[#0f181a] dark:text-white text-lg font-extrabold tracking-tight mb-4">
                Volunteer Tips
              </h3>

              <div className="space-y-3">
                {[
                  { icon: 'diversity_3', title: 'Cultural Sensitivity', description: 'Respect local traditions and languages during field visits.' },
                  { icon: 'water_drop', title: 'Stay Hydrated', description: 'Always carry a water bottle to maintain energy levels.' },
                  { icon: 'groups', title: 'Team Synergy', description: 'Effective communication is the key to field success.' },
                  { icon: 'health_and_safety', title: 'Safety First', description: 'Always wear proper gear and follow safety protocols.' },
                  { icon: 'schedule', title: 'Time Management', description: 'Arrive early and plan your tasks ahead of time.' },
                ].map((tip, index) => (
                  <div key={index} className="flex items-start gap-3 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-xl text-primary">{tip.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#0f181a] dark:text-white">{tip.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{tip.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating Create Course Button */}
            <button
              onClick={() => navigate('/volunteer/courses/create')}
              className="fixed bottom-24 right-4 z-40 bg-gradient-to-r from-primary to-primary/80 text-white p-4 rounded-full shadow-lg shadow-primary/30 flex items-center justify-center font-bold hover:shadow-primary/50"
              title="Create Course"
            >
              <span className="material-symbols-outlined text-2xl">add</span>
            </button>

          </main>
        )}

        {submenu === 'joined' && (
          <>
            {/* Search Bar */}
            <div className="px-4 py-3">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                <input
                  type="text"
                  placeholder="Search joined campaigns..."
                  value={joinedSearchQuery}
                  onChange={(e) => setJoinedSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
            
            <div className="px-4 space-y-4 pb-12">
              {campaigns.filter(c => c.isJoined).length === 0 ? (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-700 block mb-2">campaign</span>
                  <p className="text-slate-500 text-sm">No joined campaigns yet</p>
                  <button
                    onClick={() => setSubmenu('projects')}
                    className="mt-4 bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary/90"
                  >
                    Browse Campaigns
                  </button>
                </div>
              ) : (
                campaigns
                  .filter(c => c.isJoined)
                  .filter(c => !joinedSearchQuery || c.title.toLowerCase().includes(joinedSearchQuery.toLowerCase()) || c.location?.toLowerCase().includes(joinedSearchQuery.toLowerCase()) || c.category?.toLowerCase().includes(joinedSearchQuery.toLowerCase()))
                  .map(campaign => (
                    <div
                      key={campaign.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => openCampaign(campaign.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          openCampaign(campaign.id)
                        }
                      }}
                      className="flex flex-col overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 dark:border-gray-700 cursor-pointer"
                    >
                      <div className="relative w-full aspect-[21/9] bg-center bg-no-repeat bg-cover" style={{ backgroundImage: `url('${campaign.image}')` }}>
                        {campaign.urgency && (
                          <div className="absolute top-3 left-3 bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider shadow-lg">Urgent</div>
                        )}
                        <div className="absolute bottom-3 right-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold shadow-sm">
                          {campaign.category}
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="mb-3">
                          <h4 className="text-base font-extrabold text-[#0f181a] dark:text-white leading-tight">
                            {campaign.title}
                          </h4>
                          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 mt-1">
                            <span className="material-symbols-outlined text-[14px]">location_on</span>
                            <p className="text-xs font-semibold">{campaign.location}</p>
                          </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg py-2 px-3 flex items-center justify-start gap-4 mb-4 border border-gray-100 dark:border-gray-700/50">
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-primary text-[16px]">groups</span>
                            <span className="text-[11px] font-extrabold text-gray-700 dark:text-gray-200 uppercase tracking-wide">{campaign.volunteersJoined}/{campaign.volunteersNeeded} Joined</span>
                          </div>
                          <div className="w-px h-3 bg-gray-200 dark:bg-gray-700"></div>
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-primary text-[16px]">payments</span>
                            <span className="text-[11px] font-extrabold text-gray-700 dark:text-gray-200 uppercase tracking-wide">৳{campaign.raised}/{campaign.goal} Raised</span>
                          </div>
                          <div className="w-px h-3 bg-gray-200 dark:bg-gray-700"></div>
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-primary text-[16px]">schedule</span>
                            <span className="text-[11px] font-extrabold text-gray-700 dark:text-gray-200 uppercase tracking-wide text-nowrap">{campaign.daysLeft} Days Left</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); openCampaign(campaign.id) }}
                            className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-2.5 rounded-lg transition-colors text-sm"
                          >
                            View Campaign
                          </button>
                          <button onClick={(e) => handleShareClick(campaign, e)} className="px-3 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800">
                            <span className="material-symbols-outlined text-gray-500 text-lg">share</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
              )}
              {campaigns.filter(c => c.isJoined).length > 0 && campaigns.filter(c => c.isJoined).filter(c => !joinedSearchQuery || c.title.toLowerCase().includes(joinedSearchQuery.toLowerCase()) || c.location?.toLowerCase().includes(joinedSearchQuery.toLowerCase()) || c.category?.toLowerCase().includes(joinedSearchQuery.toLowerCase())).length === 0 && (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-700 block mb-2">search_off</span>
                  <p className="text-slate-500 text-sm">No campaigns match your search</p>
                </div>
              )}
            </div>
          </>
        )}

        {submenu === 'manage' && (
          <div className="px-4 py-10 text-sm text-gray-500 dark:text-gray-400">Manage campaigns coming soon.</div>
        )}
      </div>

      <VolunteerFooter />

      {submenu === 'projects' && (
        <button
          onClick={goToApply}
          className="fixed bottom-24 right-4 z-40 bg-gradient-to-r from-primary to-primary/80 text-white p-4 rounded-full shadow-lg shadow-primary/30 flex items-center justify-center font-bold hover:shadow-primary/50"
          title="Create Campaign"
        >
          <span className="material-symbols-outlined text-2xl">add</span>
        </button>
      )}

      {/* Share Modal - Full Page */}
      {showShareModal && (
        <div className="fixed inset-0 z-[200] bg-white dark:bg-slate-900 flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
            <button onClick={() => setShowShareModal(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h3 className="text-lg font-bold flex-1">Share Campaign</h3>
          </div>
          
          {/* Campaign Preview Card */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 flex gap-3">
              <div className="size-20 rounded-lg bg-cover bg-center shrink-0" style={{ backgroundImage: `url('${showShareModal.image}')` }} />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-base truncate">{showShareModal.title}</h4>
                <p className="text-sm text-gray-500 truncate mt-1">{showShareModal.location}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                  <span>👥 {showShareModal.volunteersJoined}/{showShareModal.volunteersNeeded}</span>
                  <span>💰 ৳{showShareModal.raised}</span>
                  <span>⏰ {showShareModal.daysLeft}d</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Share Options */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
            <button 
              onClick={handleShareExternal}
              className="w-full flex items-center gap-3 p-4 bg-primary/10 rounded-xl hover:bg-primary/20 transition"
            >
              <div className="size-12 bg-primary rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-xl">share</span>
              </div>
              <div className="text-left">
                <p className="font-bold">Share to Other Apps</p>
                <p className="text-sm text-gray-500">Copy link or share via other apps</p>
              </div>
            </button>
          </div>
          
          {/* Search Bar */}
          <div className="px-4 pt-4 shrink-0">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
              <input
                type="text"
                placeholder="Search allies..."
                value={allySearchQuery || ''}
                onChange={(e) => setAllySearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
          
          {/* Share with Allies */}
          <div className="flex-1 overflow-y-auto p-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Share with Allies</h4>
            {!currentUserId ? (
              <p className="text-sm text-gray-500 text-center py-8">Login to share with allies</p>
            ) : allies.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No allies yet</p>
            ) : (
              <div className="space-y-2">
                {allies
                  .filter(ally => !allySearchQuery || ally.full_name?.toLowerCase().includes(allySearchQuery.toLowerCase()))
                  .map(ally => (
                    <button
                      key={ally.id}
                      onClick={() => handleShareToAlly(ally)}
                      disabled={sharingTo === ally.id}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition disabled:opacity-50"
                    >
                      <img src={ally.avatar || '/avatars/avatar_1.svg'} alt="" className="size-12 rounded-full object-cover" />
                      <div className="flex-1 text-left">
                        <p className="font-bold">{ally.full_name}</p>
                        <p className="text-sm text-gray-500">{ally.wing}</p>
                      </div>
                      {sharingTo === ally.id ? (
                        <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                      ) : (
                        <span className="material-symbols-outlined text-gray-400">send</span>
                      )}
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
