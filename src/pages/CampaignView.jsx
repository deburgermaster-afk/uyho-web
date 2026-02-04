import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'

export default function CampaignView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const shouldShowDonation = searchParams.get('donate') === 'true'
  
  const [campaign, setCampaign] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showShareModal, setShowShareModal] = useState(false)
  const [activeTab, setActiveTab] = useState('team')
  const [donationSubTab, setDonationSubTab] = useState('campaign')
  const [donations, setDonations] = useState([])
  const [donationsLoading, setDonationsLoading] = useState(false)
  const [showDonationPopup, setShowDonationPopup] = useState(shouldShowDonation)
  const [donationForm, setDonationForm] = useState({
    donorName: '',
    isAnonymous: false,
    phoneNumber: '',
    amount: '',
    paymentMethod: '',
    transactionId: ''
  })
  const [submitting, setSubmitting] = useState(false)

  const donationSuggestions = [500, 1000, 2000, 5000, 10000]

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
        const res = await fetch(`/api/campaigns/${id}`)
        if (res.ok) {
          const data = await res.json()
          setCampaign(data)
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
    
    fetchCampaign()
    fetchDonations()
  }, [id])

  const handleDonationSubmit = async (e) => {
    e.preventDefault()
    if (!donationForm.amount || !donationForm.paymentMethod || !donationForm.transactionId) {
      alert('Please fill in all required fields')
      return
    }
    
    setSubmitting(true)
    try {
      const res = await fetch(`/api/campaigns/${id}/donations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...donationForm,
          campaign_id: id
        })
      })
      if (res.ok) {
        alert('Thank you for your donation! It will be verified shortly.')
        setShowDonationPopup(false)
        setDonationForm({
          donorName: '',
          isAnonymous: false,
          phoneNumber: '',
          amount: '',
          paymentMethod: '',
          transactionId: ''
        })
        // Refresh donations
        const donRes = await fetch(`/api/campaigns/${id}/donations/all`)
        if (donRes.ok) {
          const data = await donRes.json()
          setDonations(data)
        }
      } else {
        alert('Failed to submit donation. Please try again.')
      }
    } catch (err) {
      console.error('Failed to submit donation:', err)
      alert('Failed to submit donation. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleShareExternal = async () => {
    if (!campaign) return
    const shareUrl = `${window.location.origin}/campaigns/${campaign.id}`
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-500">Loading campaign...</p>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-500">Campaign not found</p>
      </div>
    )
  }

  const joinedCount = campaign.joined_count ?? campaign.volunteers_joined
  const budgetBreakdown = campaign.budget_breakdown ? JSON.parse(campaign.budget_breakdown) : []
  
  const managementTeam = (campaign.team || []).filter(member => 
    projectRoles.some(role => role.toLowerCase() === (member.role || '').toLowerCase())
  )
  const otherVolunteers = (campaign.team || []).filter(member => 
    !projectRoles.some(role => role.toLowerCase() === (member.role || '').toLowerCase())
  )
  
  const programHours = campaign.program_hours || 0
  const programRespect = campaign.program_respect || 0
  const heroImage = (campaign.image || '').trim() || 'https://images.unsplash.com/flagged/photo-1570731478378-25bc282e0f62?auto=format&fit=crop&w=1200&h=720&q=70&fm=jpg&crop=entropy&cs=tinysrgb&sat=-20&blend=000000&blend-mode=normal&blend-alpha=5&fit=crop&orient=landscape'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      <main className="max-w-md mx-auto px-4 py-4 space-y-6">
        <div className="flex items-center justify-between gap-3 mt-2">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <p className="text-[10px] uppercase font-bold text-primary">Campaign</p>
            <h1 className="text-xl font-bold">Details</h1>
          </div>
        </div>
        
        <div className="relative w-full aspect-[21/9] bg-center bg-no-repeat bg-cover rounded-2xl overflow-hidden bg-gray-200 dark:bg-gray-700" style={heroImage ? { backgroundImage: `url('${heroImage}')` } : {}}>
          {!heroImage && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-800">
              <svg className="w-16 h-16 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          {campaign.urgency === 1 && (
            <div className="absolute top-3 left-3 bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider shadow-lg">Urgent</div>
          )}
          {/* Share Button on Image */}
          <button 
            onClick={() => setShowShareModal(true)}
            className="absolute top-3 right-3 size-9 bg-white/90 dark:bg-gray-900/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg hover:bg-white dark:hover:bg-gray-800 transition"
            title="Share campaign"
          >
            <svg className="w-5 h-5 text-gray-700 dark:text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
          <div className="absolute bottom-3 right-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold shadow-sm">
            {campaign.wing}
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">{campaign.title}</h1>
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-4">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-sm font-semibold">{campaign.location || 'TBD'}</p>
          </div>
          {campaign.event_date && (
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
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
            <svg className="w-5 h-5 text-primary mx-auto mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Volunteers</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{joinedCount}/{campaign.volunteers_needed}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-2 border border-gray-100 dark:border-gray-700 text-center">
            <svg className="w-5 h-5 text-primary mx-auto mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Budget</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">৳{campaign.budget || campaign.goal}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-2 border border-gray-100 dark:border-gray-700 text-center">
            <svg className="w-5 h-5 text-primary mx-auto mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Days Left</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{campaign.days_left || 30}</p>
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
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 uppercase tracking-wide">Management Team</h3>
                    <div className="space-y-3">
                      {managementTeam.map(member => (
                        <div key={member.id} className="p-3 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
                          <div className="flex items-center gap-3">
                            <img src={member.avatar || '/avatars/avatar_1.svg'} alt={member.full_name} className="w-10 h-10 rounded-full object-cover" />
                            <div className="flex-1">
                              <p className="text-sm font-bold text-gray-900 dark:text-white">{member.full_name}</p>
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
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 uppercase tracking-wide">Joined Volunteers</h3>
                    <div className="space-y-3">
                      {otherVolunteers.map(member => (
                        <div key={member.id} className="p-3 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
                          <div className="flex items-center gap-3">
                            <img src={member.avatar || '/avatars/avatar_1.svg'} alt={member.full_name} className="w-10 h-10 rounded-full object-cover" />
                            <div className="flex-1">
                              <p className="text-sm font-bold text-gray-900 dark:text-white">{member.full_name}</p>
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
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 uppercase tracking-wide">Budget Breakdown</h3>
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
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 uppercase tracking-wide">Donation & Funding</h3>
                
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
                    onClick={() => setShowDonationPopup(true)}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    Donate Now
                  </button>
                  <p className="text-xs text-gray-500 mt-2">Support this campaign to make a difference</p>
                </div>

                {/* Campaign Donations List */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-gray-800 dark:text-white">Recent Donations</h4>
                  
                  {donationsLoading ? (
                    <div className="text-center py-4">
                      <svg className="animate-spin h-6 w-6 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </div>
                  ) : donations.length === 0 ? (
                    <div className="text-center py-6">
                      <svg className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <p className="text-sm text-gray-500 mt-2">No donations yet. Be the first to support!</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {donations.map(donation => (
                        <div key={donation.id} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
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
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Updates Tab */}
            {activeTab === 'updates' && (
              <div className="text-center py-8">
                <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                <p className="text-sm text-gray-500">Updates feature coming soon...</p>
              </div>
            )}
          </div>
        </div>

      </main>

      {/* Share Modal */}
      {showShareModal && campaign && (
        <div className="fixed inset-0 z-[200] bg-white dark:bg-gray-900 flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
            <button onClick={() => setShowShareModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
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
          <div className="p-4">
            <button 
              onClick={handleShareExternal}
              className="w-full flex items-center gap-3 p-4 bg-primary/10 rounded-xl hover:bg-primary/20 transition"
            >
              <div className="size-12 bg-primary rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-bold">Share to Other Apps</p>
                <p className="text-sm text-gray-500">Copy link or share via other apps</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Donation Popup */}
      {showDonationPopup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Donate to Campaign</h3>
              <button
                onClick={() => setShowDonationPopup(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Campaign Info */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex gap-3">
                <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700 overflow-hidden shrink-0">
                  {campaign.image ? (
                    <img src={campaign.image} alt={campaign.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1">{campaign.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{campaign.location}</p>
                  <p className="text-xs text-primary font-bold mt-1">৳{campaign.raised || 0} raised</p>
                </div>
              </div>
            </div>

            {/* Donation Form */}
            <form onSubmit={handleDonationSubmit} className="p-6 space-y-6">
              {/* Anonymous Toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setDonationForm(prev => ({ ...prev, isAnonymous: !prev.isAnonymous }))}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                    donationForm.isAnonymous 
                      ? 'border-primary bg-primary/10 text-primary' 
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={donationForm.isAnonymous ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" : "M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"} />
                  </svg>
                  <span className="text-sm font-medium">Anonymous Donation</span>
                </button>
              </div>

              {/* Donor Name */}
              {!donationForm.isAnonymous && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={donationForm.donorName}
                    onChange={(e) => setDonationForm(prev => ({ ...prev, donorName: e.target.value }))}
                    placeholder="Enter your full name"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                    required={!donationForm.isAnonymous}
                  />
                </div>
              )}

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone Number (Optional)</label>
                <input
                  type="tel"
                  value={donationForm.phoneNumber}
                  onChange={(e) => setDonationForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  placeholder="01XXXXXXXXX"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Donation Amount</label>
                <div className="relative mb-3">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">৳</span>
                  <input
                    type="number"
                    value={donationForm.amount}
                    onChange={(e) => setDonationForm(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0"
                    className="w-full pl-8 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-lg font-bold"
                    required
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {donationSuggestions.map(amount => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setDonationForm(prev => ({ ...prev, amount: amount.toString() }))}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        donationForm.amount === amount.toString()
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-gray-200 dark:border-gray-700 hover:border-primary hover:text-primary'
                      }`}
                    >
                      ৳{amount}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Payment Method</label>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { key: 'bkash', label: 'bKash', color: 'bg-pink-500' },
                    { key: 'nagad', label: 'Nagad', color: 'bg-orange-500' }
                  ].map(method => (
                    <button
                      key={method.key}
                      type="button"
                      onClick={() => setDonationForm(prev => ({ ...prev, paymentMethod: method.key }))}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        donationForm.paymentMethod === method.key
                          ? 'border-primary bg-primary/10'
                          : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                      }`}
                    >
                      <div className={`w-8 h-8 ${method.color} rounded-lg mx-auto mb-2 flex items-center justify-center text-white`}>
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium">{method.label}</p>
                    </button>
                  ))}
                </div>

                {/* Payment Instructions */}
                {donationForm.paymentMethod && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                    <h4 className="font-bold text-sm text-blue-800 dark:text-blue-200 mb-2">Payment Instructions:</h4>
                    <ol className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                      <li>1. Send ৳{donationForm.amount || 0} to our {donationForm.paymentMethod === 'bkash' ? 'bKash' : 'Nagad'}: <strong>01XXXXXXXXX</strong></li>
                      <li>2. Use personal transfer method</li>
                      <li>3. Copy the transaction ID from your payment</li>
                      <li>4. Enter the transaction ID below</li>
                    </ol>
                  </div>
                )}

                {/* Transaction ID */}
                {donationForm.paymentMethod && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Transaction ID *</label>
                    <input
                      type="text"
                      value={donationForm.transactionId}
                      onChange={(e) => setDonationForm(prev => ({ ...prev, transactionId: e.target.value }))}
                      placeholder="Enter transaction ID from your payment"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                      required
                    />
                    <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                      * Transaction ID is required to verify your donation
                    </p>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || !donationForm.amount || !donationForm.paymentMethod || !donationForm.transactionId}
                className="w-full bg-primary hover:bg-primary/90 disabled:bg-gray-300 disabled:text-gray-500 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                )}
                {submitting ? 'Processing...' : `Donate ৳${donationForm.amount || 0} Now`}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
