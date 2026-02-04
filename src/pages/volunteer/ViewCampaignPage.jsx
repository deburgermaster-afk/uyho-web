import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import VolunteerFooter from '../../components/VolunteerFooter'

export default function ViewCampaignPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [campaign, setCampaign] = useState(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [approvingId, setApprovingId] = useState(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [allies, setAllies] = useState([])
  const [sharingTo, setSharingTo] = useState(null)
  const [allySearchQuery, setAllySearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('team')
  const [donationSubTab, setDonationSubTab] = useState('campaign')
  const [donations, setDonations] = useState([])
  const [userDonations, setUserDonations] = useState([])
  const [totalUserDonations, setTotalUserDonations] = useState(0)
  const [donationsLoading, setDonationsLoading] = useState(false)
  const currentUserId = localStorage.getItem('volunteerId')

  const projectRoles = [
    'Program Host',
    'Program Director',
    'Project Manager',
    'Operations Lead',
    'Logistics Coordinator',
    'Field Lead',
    'Medical Lead',
    'Media Coordinator',
    'Volunteer Coordinator'
  ]

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const res = await fetch(currentUserId ? `/api/campaigns/${id}?userId=${currentUserId}` : `/api/campaigns/${id}`)
        if (res.ok) {
          const data = await res.json()
          setCampaign(data)
          
          // Sync pending approvals with campaign rewards if they exist
          if (data.program_hours > 0 || data.program_respect > 0) {
            fetch(`/api/campaigns/${id}/sync-rewards`, { method: 'POST' })
              .then(syncRes => syncRes.json())
              .then(syncData => {
                if (syncData.updated > 0) {
                  // Re-fetch to show updated values
                  return fetch(currentUserId ? `/api/campaigns/${id}?userId=${currentUserId}` : `/api/campaigns/${id}`)
                }
              })
              .then(refetchRes => {
                if (refetchRes && refetchRes.ok) {
                  return refetchRes.json()
                }
              })
              .then(refetchData => {
                if (refetchData) {
                  setCampaign(refetchData)
                }
              })
              .catch(err => console.warn('Sync rewards failed:', err))
          }
        }
      } catch (err) {
        console.error('Failed to fetch campaign', err)
      } finally {
        setLoading(false)
      }
    }
    
    const fetchDonations = async () => {
      setDonationsLoading(true)
      try {
        const res = await fetch(`/api/campaigns/${id}/donations/all`)
        if (res.ok) {
          const data = await res.json()
          setDonations(data)
        }
      } catch (err) {
        console.error('Failed to fetch donations:', err)
      } finally {
        setDonationsLoading(false)
      }
    }
    
    const fetchUserDonations = async () => {
      if (!currentUserId) return
      try {
        const res = await fetch(`/api/volunteers/${currentUserId}/donations`)
        if (res.ok) {
          const data = await res.json()
          setUserDonations(data.donations)
          setTotalUserDonations(data.total)
        }
      } catch (err) {
        console.error('Failed to fetch user donations:', err)
      }
    }
    
    fetchCampaign()
    fetchDonations()
    fetchUserDonations()
  }, [id, currentUserId])

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <p className="text-gray-500">Loading campaign...</p>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <p className="text-gray-500">Campaign not found</p>
      </div>
    )
  }

  const isHost = campaign.host_id?.toString() === currentUserId
  const joinedCount = campaign.joined_count ?? campaign.volunteers_joined
  const budgetBreakdown = campaign.budget_breakdown ? JSON.parse(campaign.budget_breakdown) : []
  const isJoined = campaign.is_joined === 1 || campaign.team?.some(member => member.volunteer_id?.toString() === currentUserId)
  const isProjectRole = (campaign.user_role || '').trim() !== '' || (campaign.team || []).some(m => m.volunteer_id?.toString() === currentUserId && (m.role || '').trim() !== '')

  const managementTeam = (campaign.team || []).filter(member => 
    projectRoles.some(role => role.toLowerCase() === (member.role || '').toLowerCase())
  )
  const otherVolunteers = (campaign.team || []).filter(member => 
    !projectRoles.some(role => role.toLowerCase() === (member.role || '').toLowerCase())
  )
  const pendingApprovals = (campaign.team || []).filter(member => member.approval_status === 'pending')
  // Program rewards per campaign (fallback to current member or first pending if not set)
  const currentMember = (campaign.team || []).find(m => m.volunteer_id?.toString() === currentUserId)
  const programHours = (campaign.program_hours ?? 0) > 0
    ? (campaign.program_hours || 0)
    : (currentMember ? (currentMember.hours || 0) : ((pendingApprovals[0]?.hours) || 0))
  const programRespect = (campaign.program_respect ?? 0) > 0
    ? (campaign.program_respect || 0)
    : (currentMember ? (currentMember.respect || 0) : ((pendingApprovals[0]?.respect) || 0))
  const heroImage = (campaign.image || '').trim() || 'https://images.unsplash.com/flagged/photo-1570731478378-25bc282e0f62?auto=format&fit=crop&w=1200&h=720&q=70&fm=jpg&crop=entropy&cs=tinysrgb&sat=-20&blend=000000&blend-mode=normal&blend-alpha=5&fit=crop&orient=landscape'

  const handleApprove = async (memberId) => {
    setApprovingId(memberId)
    try {
      const res = await fetch(`/api/campaigns/${id}/team/${memberId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      if (!res.ok) throw new Error('Approve failed')
      const data = await res.json()
      alert(`Approved! Added ${data.hoursAdded} hours and ${data.respectAdded} respect points to volunteer profile.`)
      
      // Refresh campaign data
      const refreshRes = await fetch(currentUserId ? `/api/campaigns/${id}?userId=${currentUserId}` : `/api/campaigns/${id}`)
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json()
        setCampaign(refreshData)
      }
    } catch (err) {
      console.error('Failed to approve member', err)
      alert('Unable to approve member right now.')
    } finally {
      setApprovingId(null)
    }
  }

  const handleJoin = async () => {
    if (!currentUserId) {
      navigate('/volunteer/login')
      return
    }
    setJoining(true)
    try {
      const res = await fetch(`/api/campaigns/${id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volunteerId: currentUserId, role: 'Volunteer' })
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Join failed')
      }
      setCampaign(prev => prev ? {
        ...prev,
        is_joined: 1,
        joined_count: data.joinedCount ?? (prev.joined_count || prev.volunteers_joined + 1),
        user_role: prev.user_role || 'Volunteer'
      } : prev)
    } catch (err) {
      console.error('Failed to join campaign', err)
      alert(err.message || 'Unable to join campaign right now.')
    } finally {
      setJoining(false)
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

  const handleShareClick = () => {
    setShowShareModal(true)
    fetchAllies()
  }

  const handleShareToAlly = async (ally) => {
    if (!campaign || !currentUserId) return
    setSharingTo(ally.id)
    try {
      const convRes = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId1: currentUserId, userId2: ally.id })
      })
      if (!convRes.ok) throw new Error('Failed to create conversation')
      const conv = await convRes.json()
      
      const msgRes = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conv.id,
          senderId: currentUserId,
          content: JSON.stringify({
            id: campaign.id,
            title: campaign.title,
            image: campaign.image || heroImage,
            location: campaign.location,
            volunteersJoined: joinedCount,
            volunteersNeeded: campaign.volunteers_needed,
            raised: campaign.raised || 0,
            goal: campaign.budget || campaign.goal,
            daysLeft: campaign.days_left || 30,
            category: campaign.wing
          }),
          messageType: 'campaign'
        })
      })
      if (msgRes.ok) {
        setShowShareModal(false)
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
    if (!campaign) return
    const shareUrl = `${window.location.origin}/volunteer/campaigns/${campaign.id}`
    const shareText = `Check out this campaign: ${campaign.title}\n\n📍 ${campaign.location}\n👥 ${joinedCount}/${campaign.volunteers_needed} volunteers\n💰 ৳${campaign.raised || 0}/${campaign.budget || campaign.goal} raised\n⏰ ${campaign.days_left || 30} days left\n\n`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: campaign.title,
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

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark pb-24">
      <main className="max-w-md mx-auto px-4 py-4 space-y-6">
        <div className="flex items-center justify-between gap-3 mt-2">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
          </button>
          <div className="flex-1">
            <p className="text-[10px] uppercase font-bold text-primary">Campaign</p>
            <h1 className="text-xl font-bold">Details</h1>
          </div>
          <div className="flex items-center gap-3">
            {isHost && pendingApprovals.length > 0 && (
              <button
                onClick={() => setShowApprovalModal(true)}
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary text-white hover:bg-primary/90"
                title="Approve volunteers"
              >
                <span className="material-symbols-outlined text-sm">check_circle</span>
                <span className="text-[11px] font-bold">Approve ({pendingApprovals.length})</span>
              </button>
            )}
            {(isHost || isProjectRole) && (
              <button
                onClick={() => navigate(`/volunteer/campaigns/${id}/manage`)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary/90"
                title="Manage campaign"
              >
                <span className="material-symbols-outlined text-sm">settings</span>
                <span className="text-xs font-bold">Manage</span>
              </button>
            )}
          </div>
        </div>
        <div className="relative w-full aspect-[21/9] bg-center bg-no-repeat bg-cover rounded-2xl overflow-hidden bg-gray-200 dark:bg-gray-700" style={heroImage ? { backgroundImage: `url('${heroImage}')` } : {}}>
          {!heroImage && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-800">
              <span className="material-symbols-outlined text-6xl text-gray-500 dark:text-gray-400">image</span>
            </div>
          )}
          {campaign.urgency === 1 && (
            <div className="absolute top-3 left-3 bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider shadow-lg">Urgent</div>
          )}
          {/* Share Button on Image */}
          <button 
            onClick={handleShareClick}
            className="absolute top-3 right-3 size-9 bg-white/90 dark:bg-gray-900/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg hover:bg-white dark:hover:bg-gray-800 transition"
            title="Share campaign"
          >
            <span className="material-symbols-outlined text-lg text-gray-700 dark:text-gray-200">share</span>
          </button>
          <div className="absolute bottom-3 right-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold shadow-sm">
            {campaign.wing}
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-extrabold text-[#0f181a] dark:text-white mb-2">{campaign.title}</h1>
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-4">
            <span className="material-symbols-outlined text-base">location_on</span>
            <p className="text-sm font-semibold">{campaign.location || 'TBD'}</p>
          </div>
          {campaign.event_date && (
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
              <span className="material-symbols-outlined text-base">event</span>
              <p className="text-sm font-semibold">{campaign.event_date}</p>
            </div>
          )}
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">{campaign.description}</p>
          <p className="text-sm text-primary font-semibold">
            <span className="text-green-600 dark:text-green-400">+{programHours} Hours</span>
            <span className="text-gray-400 mx-1">and</span>
            <span className="text-purple-600 dark:text-purple-400">+{programRespect} Respect</span>
            <span className="text-gray-500 dark:text-gray-400 font-normal"> by participating this campaign</span>
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-2 border border-gray-100 dark:border-gray-700 text-center">
            <span className="material-symbols-outlined text-primary text-lg block mb-0.5">groups</span>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Volunteers</p>
            <p className="text-sm font-bold text-[#0f181a] dark:text-white">{joinedCount}/{campaign.volunteers_needed}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-2 border border-gray-100 dark:border-gray-700 text-center">
            <span className="material-symbols-outlined text-primary text-lg block mb-0.5">payments</span>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Budget</p>
            <p className="text-sm font-bold text-[#0f181a] dark:text-white">৳{campaign.budget || campaign.goal}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-2 border border-gray-100 dark:border-gray-700 text-center">
            <span className="material-symbols-outlined text-primary text-lg block mb-0.5">schedule</span>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Days Left</p>
            <p className="text-sm font-bold text-[#0f181a] dark:text-white">{campaign.days_left || 30}</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {[
              { key: 'team', label: 'Team' },
              { key: 'budget', label: 'Budget' },
              { key: 'donation', label: 'Donation' },
              { key: 'updates', label: 'Updates' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-3 px-4 text-sm font-semibold transition-all relative ${
                  activeTab === tab.key 
                    ? 'text-primary' 
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-4">
            {/* Team Tab */}
            {activeTab === 'team' && (
              <div className="space-y-4">
                {managementTeam.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-[#0f181a] dark:text-white mb-3 uppercase tracking-wide">Management Team</h3>
                    <div className="space-y-3">
                      {managementTeam.map(member => (
                        <div key={member.id} className="p-3 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
                          <div className="flex items-center gap-3">
                            <img src={member.avatar || '/avatars/avatar_1.svg'} alt={member.full_name} className="w-10 h-10 rounded-full object-cover" />
                            <div className="flex-1">
                              <p className="text-sm font-bold text-[#0f181a] dark:text-white">{member.full_name}</p>
                              <p className="text-[11px] text-gray-500">{member.wing} • {member.digital_id}</p>
                              <div className="flex flex-wrap gap-2 mt-1">
                                <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{member.role}</span>
                                {member.task_note && (
                                  <span className="text-[11px] text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{member.task_note}</span>
                                )}
                              </div>
                              <div className="flex gap-3 mt-2 text-[11px]">
                                <span className="font-bold text-blue-600 dark:text-blue-400">Hours: {member.hours || 0}</span>
                                <span className="font-bold text-purple-600 dark:text-purple-400">Respect: {member.respect || 0}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {otherVolunteers.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-[#0f181a] dark:text-white mb-3 uppercase tracking-wide">Joined Volunteers</h3>
                    <div className="space-y-3">
                      {otherVolunteers.map(member => (
                        <div key={member.id} className="p-3 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
                          <div className="flex items-center gap-3">
                            <img src={member.avatar || '/avatars/avatar_1.svg'} alt={member.full_name} className="w-10 h-10 rounded-full object-cover" />
                            <div className="flex-1">
                              <p className="text-sm font-bold text-[#0f181a] dark:text-white">{member.full_name}</p>
                              <p className="text-[11px] text-gray-500">{member.wing} • {member.digital_id}</p>
                              <div className="flex flex-wrap gap-2 mt-1">
                                <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Volunteer</span>
                                {member.task_note && (
                                  <span className="text-[11px] text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{member.task_note}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {campaign.team?.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-8">No team members yet.</p>
                )}
              </div>
            )}

            {/* Budget Tab */}
            {activeTab === 'budget' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[#0f181a] dark:text-white mb-3 uppercase tracking-wide">Budget Breakdown</h3>
                {budgetBreakdown.length > 0 ? (
                  <div className="space-y-2">
                    {budgetBreakdown.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-900/40 rounded-lg">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{item.name}</span>
                        <span className="text-sm font-bold text-primary">৳{item.amount.toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center p-2 bg-primary/10 rounded-lg border-t border-primary/20">
                      <span className="text-sm font-bold text-primary">Total Budget</span>
                      <span className="text-sm font-bold text-primary">৳{budgetBreakdown.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-8">No budget breakdown available.</p>
                )}
              </div>
            )}

            {/* Donation Tab */}
            {activeTab === 'donation' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[#0f181a] dark:text-white mb-3 uppercase tracking-wide">Donation & Funding</h3>
                
                {/* Donation Sub-tabs */}
                <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                  <button
                    onClick={() => setDonationSubTab('campaign')}
                    className={`flex-1 py-2 px-3 text-sm font-semibold rounded-md transition-all ${
                      donationSubTab === 'campaign'
                        ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                  >
                    Campaign
                  </button>
                  <button
                    onClick={() => setDonationSubTab('donations')}
                    className={`flex-1 py-2 px-3 text-sm font-semibold rounded-md transition-all ${
                      donationSubTab === 'donations'
                        ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                  >
                    My Donations
                  </button>
                </div>

                {/* Campaign Sub-tab Content */}
                {donationSubTab === 'campaign' && (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 p-4 rounded-lg border border-primary/20">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-bold text-primary">Raised</span>
                        <span className="text-lg font-bold text-primary">৳{campaign.raised || 0}</span>
                      </div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Goal</span>
                        <span className="text-sm font-bold text-gray-800 dark:text-white">৳{campaign.budget || campaign.goal}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all" 
                          style={{ width: `${Math.min(((campaign.raised || 0) / (campaign.budget || campaign.goal || 1)) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {Math.round(((campaign.raised || 0) / (campaign.budget || campaign.goal || 1)) * 100)}% of goal reached
                      </p>
                    </div>

                    <div className="text-center">
                      <button 
                        onClick={() => navigate('/volunteer/donation')}
                        className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined">volunteer_activism</span>
                        Donate Now
                      </button>
                      <p className="text-xs text-gray-500 mt-2">Support this campaign to make a difference</p>
                    </div>

                    {/* Campaign Donations List */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-gray-800 dark:text-white">Recent Donations</h4>
                      
                      {donationsLoading ? (
                        <div className="text-center py-4">
                          <span className="material-symbols-outlined animate-spin text-gray-400">progress_activity</span>
                        </div>
                      ) : donations.length === 0 ? (
                        <div className="text-center py-6">
                          <span className="material-symbols-outlined text-3xl text-gray-300 dark:text-gray-600">volunteer_activism</span>
                          <p className="text-sm text-gray-500 mt-2">No donations yet. Be the first to support!</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {donations.map(donation => (
                            <div key={donation.id} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="material-symbols-outlined text-sm text-primary">volunteer_activism</span>
                                  <span className="text-sm font-bold text-gray-800 dark:text-white">
                                    {donation.donor_name === 'Anonymous' ? 'Anonymous Donor' : donation.donor_name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-primary">৳{donation.amount}</span>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    donation.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                                    donation.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                                    'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                  }`}>
                                    {donation.status === 'approved' ? 'Approved' : 
                                     donation.status === 'pending' ? 'Pending' : 'Declined'}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="text-xs text-gray-500 space-y-1">
                                <div className="flex items-center justify-between">
                                  <span>Payment: {donation.payment_method === 'bkash' ? 'bKash' : 'Nagad'}</span>
                                  <span>{new Date(donation.created_at).toLocaleDateString()}</span>
                                </div>
                                {donation.transaction_id && (
                                  <div className="flex items-center gap-2">
                                    <span>TRX ID:</span>
                                    <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs">
                                      {donation.transaction_id}
                                    </code>
                                  </div>
                                )}
                                {donation.phone_number && (
                                  <div>Phone: {donation.phone_number}</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* My Donations Sub-tab Content */}
                {donationSubTab === 'donations' && (
                  <div className="space-y-4">
                    {/* Total Donations Summary */}
                    <div className="bg-gradient-to-r from-green-500/10 to-teal-500/10 p-4 rounded-lg border border-green-500/20">
                      <div className="text-center">
                        <span className="text-sm font-bold text-green-600 dark:text-green-400">Total Donations Collected</span>
                        <div className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">৳{totalUserDonations}</div>
                        <p className="text-xs text-green-600/80 dark:text-green-400/80 mt-1">
                          Across all campaigns you've supported
                        </p>
                      </div>
                    </div>

                    {/* User Donations List */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-gray-800 dark:text-white">Your Donation History</h4>
                      
                      {userDonations.length === 0 ? (
                        <div className="text-center py-8">
                          <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600">volunteer_activism</span>
                          <p className="text-sm text-gray-500 mt-2">You haven't made any donations yet</p>
                          <button 
                            onClick={() => navigate('/volunteer/donation')}
                            className="mt-3 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                          >
                            Make Your First Donation
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {userDonations.map(donation => (
                            <div key={donation.id} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                              <div className="flex items-start gap-3">
                                <div className="size-12 rounded-lg bg-gray-200 dark:bg-gray-700 overflow-hidden shrink-0">
                                  {donation.campaign_image ? (
                                    <img src={donation.campaign_image} alt={donation.campaign_title} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <span className="material-symbols-outlined text-gray-400">campaign</span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-1">
                                    <h5 className="text-sm font-bold text-gray-800 dark:text-white line-clamp-1">
                                      {donation.campaign_title}
                                    </h5>
                                    <span className="text-sm font-bold text-primary">৳{donation.amount}</span>
                                  </div>
                                  
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      donation.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                                      donation.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                                      'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                    }`}>
                                      {donation.status === 'approved' ? 'Approved' : 
                                       donation.status === 'pending' ? 'Pending' : 'Declined'}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {donation.payment_method === 'bkash' ? 'bKash' : 'Nagad'}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {new Date(donation.created_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                  
                                  {donation.transaction_id && (
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                      <span>TRX ID:</span>
                                      <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">
                                        {donation.transaction_id}
                                      </code>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Updates Tab */}
            {activeTab === 'updates' && (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">campaign</span>
                <p className="text-sm text-gray-500">Updates feature coming soon...</p>
              </div>
            )}
          </div>
        </div>

      </main>
      
      <VolunteerFooter />

          {/* Approval Modal */}
          {showApprovalModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowApprovalModal(false)}>
              <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
                  <h3 className="text-lg font-bold">Pending Approvals</h3>
                  <button onClick={() => setShowApprovalModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                    <span className="material-symbols-outlined text-gray-500">close</span>
                  </button>
                </div>
                <div className="space-y-3">
                  {pendingApprovals.map(member => (
                    <div key={member.id} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-start gap-3">
                        <img src={member.avatar || '/avatars/avatar_1.svg'} alt={member.full_name} className="w-12 h-12 rounded-full object-cover" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-[#0f181a] dark:text-white truncate">{member.full_name}</p>
                          <p className="text-[11px] text-gray-500">{member.wing} • {member.position}</p>
                          <p className="text-[11px] text-gray-500">{member.digital_id}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{member.role}</span>
                            {member.task_note && (
                              <span className="text-[11px] text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">{member.task_note}</span>
                            )}
                          </div>
                          <div className="flex gap-3 mt-2 text-[11px]">
                            <span className="font-bold text-blue-600 dark:text-blue-400">Hours: {member.hours || 0}</span>
                            <span className="font-bold text-purple-600 dark:text-purple-400">Respect: {member.respect || 0}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleApprove(member.id)}
                        disabled={approvingId === member.id}
                        className="w-full mt-3 bg-primary hover:bg-primary/90 text-white font-bold py-2 rounded-lg disabled:opacity-60 flex items-center justify-center gap-1"
                      >
                        {approvingId === member.id ? (
                          <>
                            <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                            Approving...
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-sm">check_circle</span>
                            Approve
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

      {/* Share Modal - Full Page */}
      {showShareModal && campaign && (
        <div className="fixed inset-0 z-[200] bg-white dark:bg-slate-900 flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
            <button onClick={() => setShowShareModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h3 className="text-lg font-bold flex-1">Share Campaign</h3>
          </div>
          
          {/* Campaign Preview Card */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 flex gap-3">
              <div className="size-20 rounded-lg bg-cover bg-center shrink-0" style={{ backgroundImage: `url('${heroImage}')` }} />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-base truncate">{campaign.title}</h4>
                <p className="text-sm text-gray-500 truncate mt-1">{campaign.location || 'TBD'}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                  <span>👥 {joinedCount}/{campaign.volunteers_needed}</span>
                  <span>💰 ৳{campaign.raised || 0}</span>
                  <span>⏰ {campaign.days_left || 30}d</span>
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
                value={allySearchQuery}
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
