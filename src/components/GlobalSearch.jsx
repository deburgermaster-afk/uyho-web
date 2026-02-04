import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

export default function GlobalSearch({ isOpen, onClose }) {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [volunteers, setVolunteers] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [wings, setWings] = useState([])
  const [allyIds, setAllyIds] = useState([])
  const [joinedCampaignIds, setJoinedCampaignIds] = useState([])
  const [joinedWingIds, setJoinedWingIds] = useState([])
  const [loading, setLoading] = useState(true)
  const searchInputRef = useRef(null)
  
  // Get current user ID to exclude from search results
  const currentUserId = localStorage.getItem('volunteerId')

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          const [volRes, campRes, wingsRes, allyRes, joinedCampRes, joinedWingsRes] = await Promise.all([
            fetch('/api/volunteers/directory'),
            fetch('/api/campaigns'),
            fetch('/api/wings?status=approved'),
            currentUserId ? fetch(`/api/allies/${currentUserId}/ids`) : Promise.resolve({ ok: false }),
            currentUserId ? fetch(`/api/volunteers/${currentUserId}/campaigns`) : Promise.resolve({ ok: false }),
            currentUserId ? fetch(`/api/volunteers/${currentUserId}/wings`) : Promise.resolve({ ok: false })
          ])
          
          if (volRes.ok) {
            const volData = await volRes.json()
            setVolunteers(volData)
          }
          
          if (campRes.ok) {
            const campData = await campRes.json()
            setCampaigns(campData)
          }
          
          if (wingsRes.ok) {
            const wingsData = await wingsRes.json()
            setWings(wingsData)
          }
          
          if (allyRes.ok) {
            const allyData = await allyRes.json()
            setAllyIds(allyData)
          }
          
          if (joinedCampRes.ok) {
            const joinedData = await joinedCampRes.json()
            setJoinedCampaignIds(joinedData.map(c => c.campaign_id))
          }
          
          if (joinedWingsRes.ok) {
            const joinedData = await joinedWingsRes.json()
            setJoinedWingIds(joinedData.map(w => w.wing_id))
          }
        } catch (err) {
          console.error('Failed to load search data', err)
        } finally {
          setLoading(false)
        }
      }
      fetchData()
      
      // Focus input
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    }
  }, [isOpen, currentUserId])

  // Helper to check if a volunteer is an ally
  const isAlly = (volunteerId) => allyIds.includes(volunteerId)
  
  // Helper to check if user joined a campaign
  const isJoinedCampaign = (campaignId) => joinedCampaignIds.includes(campaignId)
  
  // Helper to check if user joined a wing
  const isJoinedWing = (wingId) => joinedWingIds.includes(wingId)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  // Filter data based on search (exclude current user from volunteers)
  // Sort: allies first, then others
  const filteredVolunteers = volunteers
    .filter(v => 
      String(v.id) !== String(currentUserId) && (
        v.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.wing?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    )
    .sort((a, b) => {
      const aIsAlly = isAlly(a.id)
      const bIsAlly = isAlly(b.id)
      if (aIsAlly && !bIsAlly) return -1
      if (!aIsAlly && bIsAlly) return 1
      return 0
    })
  
  // Sort: joined campaigns first, then others
  const filteredCampaigns = campaigns
    .filter(c => 
      c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.wing?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const aJoined = isJoinedCampaign(a.id)
      const bJoined = isJoinedCampaign(b.id)
      if (aJoined && !bJoined) return -1
      if (!aJoined && bJoined) return 1
      return 0
    })
  
  // Sort: joined wings first, then others
  const filteredWings = wings
    .filter(w => w.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const aJoined = isJoinedWing(a.id)
      const bJoined = isJoinedWing(b.id)
      if (aJoined && !bJoined) return -1
      if (!aJoined && bJoined) return 1
      return 0
    })

  // Best matched results (5 total) - prioritize allies, joined campaigns, joined wings
  const getBestMatches = () => {
    const results = []
    
    // Get ally volunteers first (up to 2)
    const allyVolunteers = filteredVolunteers.filter(v => isAlly(v.id))
    const nonAllyVolunteers = filteredVolunteers.filter(v => !isAlly(v.id))
    
    allyVolunteers.slice(0, 2).forEach(v => {
      results.push({ type: 'volunteer', data: v })
    })
    
    // Get joined campaigns first
    const joinedCamps = filteredCampaigns.filter(c => isJoinedCampaign(c.id))
    const nonJoinedCamps = filteredCampaigns.filter(c => !isJoinedCampaign(c.id))
    
    joinedCamps.slice(0, 2).forEach(c => {
      results.push({ type: 'campaign', data: c })
    })
    
    // Get joined wings first
    const joinedWings = filteredWings.filter(w => isJoinedWing(w.id))
    const nonJoinedWings = filteredWings.filter(w => !isJoinedWing(w.id))
    
    joinedWings.slice(0, 1).forEach(w => {
      results.push({ type: 'wing', data: w })
    })
    
    // Fill remaining slots with non-prioritized items
    if (results.length < 5) {
      nonAllyVolunteers.slice(0, 2 - allyVolunteers.length).forEach(v => {
        if (results.length < 5) results.push({ type: 'volunteer', data: v })
      })
    }
    
    if (results.length < 5) {
      nonJoinedCamps.slice(0, 2 - joinedCamps.length).forEach(c => {
        if (results.length < 5) results.push({ type: 'campaign', data: c })
      })
    }
    
    if (results.length < 5) {
      nonJoinedWings.slice(0, 1 - joinedWings.length).forEach(w => {
        if (results.length < 5) results.push({ type: 'wing', data: w })
      })
    }
    
    return results.slice(0, 5)
  }

  const handleItemClick = (type, item) => {
    onClose()
    setSearchQuery('')
    
    if (type === 'volunteer') {
      navigate(`/volunteer/profile/${item.id}`)
    } else if (type === 'campaign') {
      navigate(`/volunteer/campaigns/${item.id}`)
    } else if (type === 'wing') {
      navigate(`/volunteer/wing/${item.id}`)
    }
  }

  const handleClose = () => {
    onClose()
    setSearchQuery('')
  }

  return (
    <div className="fixed inset-0 bg-white z-[100]">
      {/* Search Header */}
      <div className="bg-white border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-3 max-w-md mx-auto">
          <button 
            onClick={handleClose}
            className="p-2 hover:bg-slate-100 rounded-full transition"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex-1 relative">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search volunteers, campaigns, wings..."
              className="w-full bg-slate-100 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full"
              >
                <span className="material-symbols-outlined text-slate-400 text-lg">close</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search Results */}
      <div className="overflow-y-auto h-[calc(100vh-70px)] max-w-md mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="material-symbols-outlined animate-spin text-3xl text-slate-300">progress_activity</span>
          </div>
        ) : searchQuery === '' ? (
          // Initial state - show categories
          <div className="p-4 space-y-6">
            <div>
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Volunteers</h3>
              <div className="space-y-1">
                {volunteers.filter(v => String(v.id) !== String(currentUserId)).sort((a, b) => isAlly(b.id) - isAlly(a.id)).slice(0, 3).map(v => (
                  <button
                    key={v.id}
                    onClick={() => handleItemClick('volunteer', v)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition"
                  >
                    <div className="relative">
                      <img 
                        src={v.avatar || '/avatars/avatar_1.svg'} 
                        alt={v.full_name}
                        className="size-10 rounded-full object-cover"
                      />
                      {isAlly(v.id) && (
                        <div className="absolute -bottom-0.5 -right-0.5 size-4 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white">
                          <span className="material-symbols-outlined text-white text-[10px] fill-icon">group</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-slate-900">{v.full_name}</p>
                        {isAlly(v.id) && (
                          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full">ALLY</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{v.wing} • {v.position}</p>
                    </div>
                    <span className="material-symbols-outlined text-slate-300">chevron_right</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Campaigns</h3>
              <div className="space-y-1">
                {campaigns.sort((a, b) => isJoinedCampaign(b.id) - isJoinedCampaign(a.id)).slice(0, 3).map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleItemClick('campaign', c)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition"
                  >
                    <div className="size-10 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                      {c.image ? (
                        <img src={c.image} alt={c.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                          <span className="material-symbols-outlined text-primary text-lg">campaign</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-slate-900">{c.title}</p>
                        {isJoinedCampaign(c.id) && (
                          <span className="text-[9px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full">JOINED</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{c.wing}</p>
                    </div>
                    <span className="material-symbols-outlined text-slate-300">chevron_right</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Wings</h3>
              <div className="space-y-1">
                {wings.length > 0 ? [...wings].sort((a, b) => isJoinedWing(b.id) - isJoinedWing(a.id)).map(w => (
                  <button
                    key={w.id}
                    onClick={() => handleItemClick('wing', w)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition"
                  >
                    <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden">
                      {w.image ? (
                        <img src={w.image} alt={w.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-primary">location_city</span>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-slate-900">{w.name}</p>
                        {isJoinedWing(w.id) && (
                          <span className="text-[9px] font-bold text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded-full">JOINED</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{w.member_count || 0} members</p>
                    </div>
                    <span className="material-symbols-outlined text-slate-300">chevron_right</span>
                  </button>
                )) : (
                  <p className="text-sm text-slate-400 px-3 py-2">No wings created yet</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Search results
          <div className="p-4 space-y-6">
            {/* Best Matches */}
            {getBestMatches().length > 0 && (
              <div>
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Best Matches</h3>
                <div className="space-y-1">
                  {getBestMatches().map((result, i) => (
                    <button
                      key={i}
                      onClick={() => handleItemClick(result.type, result.data)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition"
                    >
                      {result.type === 'volunteer' ? (
                        <div className="relative">
                          <img 
                            src={result.data.avatar || '/avatars/avatar_1.svg'} 
                            alt={result.data.full_name}
                            className="size-10 rounded-full object-cover"
                          />
                          {isAlly(result.data.id) && (
                            <div className="absolute -bottom-0.5 -right-0.5 size-4 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white">
                              <span className="material-symbols-outlined text-white text-[10px] fill-icon">group</span>
                            </div>
                          )}
                        </div>
                      ) : result.type === 'campaign' ? (
                        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <span className="material-symbols-outlined text-primary">campaign</span>
                        </div>
                      ) : (
                        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden">
                          {result.data.image ? (
                            <img src={result.data.image} alt={result.data.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-primary">location_city</span>
                          )}
                        </div>
                      )}
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-slate-900">
                            {result.type === 'volunteer' ? result.data.full_name : 
                             result.type === 'campaign' ? result.data.title : result.data.name}
                          </p>
                          {result.type === 'volunteer' && isAlly(result.data.id) && (
                            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full">ALLY</span>
                          )}
                          {result.type === 'campaign' && isJoinedCampaign(result.data.id) && (
                            <span className="text-[9px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full">JOINED</span>
                          )}
                          {result.type === 'wing' && isJoinedWing(result.data.id) && (
                            <span className="text-[9px] font-bold text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded-full">JOINED</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">
                          {result.type === 'volunteer' ? `${result.data.wing} • ${result.data.position}` :
                           result.type === 'campaign' ? result.data.wing : 'Wing'}
                        </p>
                      </div>
                      <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full capitalize">
                        {result.type}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Grouped Results - Volunteers */}
            {filteredVolunteers.length > 0 && (
              <div>
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Volunteers ({filteredVolunteers.length})</h3>
                <div className="space-y-1">
                  {filteredVolunteers.slice(0, 5).map(v => (
                    <button
                      key={v.id}
                      onClick={() => handleItemClick('volunteer', v)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition"
                    >
                      <div className="relative">
                        <img 
                          src={v.avatar || '/avatars/avatar_1.svg'} 
                          alt={v.full_name}
                          className="size-10 rounded-full object-cover"
                        />
                        {isAlly(v.id) && (
                          <div className="absolute -bottom-0.5 -right-0.5 size-4 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white">
                            <span className="material-symbols-outlined text-white text-[10px] fill-icon">group</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-slate-900">{v.full_name}</p>
                          {isAlly(v.id) && (
                            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full">ALLY</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{v.wing} • {v.position}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Grouped Results - Campaigns */}
            {filteredCampaigns.length > 0 && (
              <div>
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Campaigns ({filteredCampaigns.length})</h3>
                <div className="space-y-1">
                  {filteredCampaigns.slice(0, 5).map(c => (
                    <button
                      key={c.id}
                      onClick={() => handleItemClick('campaign', c)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition"
                    >
                      <div className="size-10 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                        {c.image ? (
                          <img src={c.image} alt={c.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-lg">campaign</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-slate-900">{c.title}</p>
                          {isJoinedCampaign(c.id) && (
                            <span className="text-[9px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full">JOINED</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{c.wing}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Grouped Results - Wings */}
            {filteredWings.length > 0 && (
              <div>
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Wings ({filteredWings.length})</h3>
                <div className="space-y-1">
                  {filteredWings.map(w => (
                    <button
                      key={w.id}
                      onClick={() => handleItemClick('wing', w)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition"
                    >
                      <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden">
                        {w.image ? (
                          <img src={w.image} alt={w.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-primary">location_city</span>
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-slate-900">{w.name}</p>
                          {isJoinedWing(w.id) && (
                            <span className="text-[9px] font-bold text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded-full">JOINED</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{w.member_count || 0} members</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {filteredVolunteers.length === 0 && filteredCampaigns.length === 0 && filteredWings.length === 0 && (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-5xl text-slate-200 mb-3">search_off</span>
                <p className="text-slate-500">No results found for "{searchQuery}"</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
