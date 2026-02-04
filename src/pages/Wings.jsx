import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Wings() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('leadership')
  const [volunteers, setVolunteers] = useState([])
  const [roles, setRoles] = useState([])
  const [wings, setWings] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedSection, setExpandedSection] = useState(null)

  // Get executive positions from roles
  const executiveRoles = roles.filter(r => r.category === 'executive').map(r => r.title.trim())
  
  // Filter volunteers by role type
  const centralCom = volunteers.filter(v => 
    v.position === 'Chief Coordinator ' || v.position === 'Chief Coordinator' || 
    v.position === 'Executive Director'
  )
  const executives = volunteers.filter(v => 
    executiveRoles.includes(v.position?.trim()) && 
    v.position !== 'Chief Coordinator ' && v.position !== 'Chief Coordinator' && 
    v.position !== 'Executive Director'
  )
  const wingLeads = volunteers.filter(v => 
    v.position?.includes('Director') || v.position?.includes('Coordinator') || v.position?.includes('Lead')
  ).filter(v => !centralCom.find(c => c.id === v.id) && !executives.find(e => e.id === v.id))
  const groundVolunteers = volunteers.filter(v => v.position === 'Volunteer')

  useEffect(() => {
    // Fetch data from volunteer portal APIs with proper error handling
    Promise.all([
      fetch('/api/volunteers/all').then(res => res.ok ? res.json() : []).catch(() => []),
      fetch('/api/roles').then(res => res.ok ? res.json() : []).catch(() => []),
      fetch('/api/wings').then(res => res.ok ? res.json() : []).catch(() => [])
    ])
      .then(([volunteerData, rolesData, wingData]) => {
        // Ensure all data is an array before setting state
        setVolunteers(Array.isArray(volunteerData) ? volunteerData : [])
        setRoles(Array.isArray(rolesData) ? rolesData : [])
        setWings(Array.isArray(wingData) ? wingData : [])
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch data:', err)
        setVolunteers([])
        setRoles([])
        setWings([])
        setLoading(false)
      })
  }, [])

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden pb-12">
      {/* Hero Section */}
      <section className="px-4 pt-6 pb-4">
        <h1 className="text-slate-900 dark:text-white text-3xl font-extrabold leading-tight tracking-tight">
          Organization Chain of Command
        </h1>
        <p className="text-primary dark:text-gray-400 mt-2 text-sm leading-relaxed max-w-[90%]">
          Leadership structure and operational hierarchy of UYHO
        </p>
      </section>

      {/* Tab Navigation */}
      <div className="px-4 sticky top-[61px] z-40 bg-white dark:bg-slate-900">
        <div className="flex bg-slate-50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
          <button 
            onClick={() => setActiveTab('leadership')}
            className={`flex-1 flex items-center justify-center py-2 px-3 rounded-lg transition-all ${
              activeTab === 'leadership' 
                ? 'bg-white dark:bg-slate-800 shadow-sm border border-black/5' 
                : ''
            }`}
          >
            <span className={`text-xs font-bold ${activeTab === 'leadership' ? 'text-slate-900 dark:text-white' : 'text-primary'}`}>
              Leadership
            </span>
          </button>
          <button 
            onClick={() => setActiveTab('wings')}
            className={`flex-1 flex items-center justify-center py-2 px-3 rounded-lg transition-all`}
          >
            <span className={`text-xs font-bold ${activeTab === 'wings' ? 'text-slate-900 dark:text-white' : 'text-primary'}`}>
              Wings
            </span>
          </button>
          <button 
            onClick={() => setActiveTab('impact')}
            className={`flex-1 flex items-center justify-center py-2 px-3 rounded-lg transition-all`}
          >
            <span className={`text-xs font-bold ${activeTab === 'impact' ? 'text-slate-900 dark:text-white' : 'text-primary'}`}>
              Mission
            </span>
          </button>
        </div>
      </div>

      {/* Leadership Section */}
      {activeTab === 'leadership' && (
        <>
          {/* Central Committee - Show First with Top 2 Positions */}
          <section className="px-4 mt-6">
            {loading ? (
              <div className="text-center py-12 text-slate-500">Loading data...</div>
            ) : volunteers.length === 0 ? (
              /* Empty state when no volunteers/committee members assigned */
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-4">
                  <span className="material-symbols-outlined text-4xl text-primary">group_off</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Committee Members Yet</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  Committee members will appear here once they are assigned by the organization administrators.
                </p>
              </div>
            ) : (
              <>
                <div className="text-center mb-4">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Central Committee</h2>
                  <p className="text-xs text-primary">Leadership Core</p>
                </div>
                {centralCom.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                    <span className="material-symbols-outlined text-3xl text-slate-300 mb-2">person_add</span>
                    <p className="text-sm text-slate-500">Central committee positions not filled yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {centralCom.map((member) => (
                      <div key={member.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-sm">
                        <div className="relative mb-3">
                          <div className="aspect-square w-full rounded-xl bg-cover bg-center bg-gray-300" style={{backgroundImage: `url("${member.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop'}")`}}></div>
                          <div className="absolute -bottom-2 -right-1 bg-primary text-white p-1 rounded-lg border-2 border-white dark:border-slate-900">
                            <span className="material-symbols-outlined text-xs">verified</span>
                          </div>
                        </div>
                        <p className="text-[10px] font-bold text-primary uppercase tracking-wider">{member.position}</p>
                        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight mt-0.5">{member.full_name}</h3>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {volunteers.length > 0 && (
              <div className="flex justify-center -mt-1">
                <div className="w-0.5 h-8 bg-gradient-to-b from-slate-300 to-primary dark:from-slate-700"></div>
              </div>
            )}
          </section>

          {/* Hierarchy Chart - Only show when there are volunteers */}
          {volunteers.length > 0 && (
          <section className="px-4">
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
              <div className="grid grid-cols-[32px_1fr] gap-x-4">
                {/* Board of Directors - Show Profile Images and Count */}
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => setExpandedSection(expandedSection === 'board' ? null : 'board')}
                    className="flex items-center justify-center bg-primary size-8 rounded-full shadow-lg shadow-primary/20 ring-4 ring-white dark:ring-slate-900 hover:scale-110 transition-transform"
                  >
                    <span className="material-symbols-outlined text-white text-sm">account_balance</span>
                  </button>
                  <div className="w-0.5 bg-gradient-to-b from-primary to-slate-300 dark:to-slate-700 h-12"></div>
                </div>
                <div className="pb-8">
                  <button
                    onClick={() => setExpandedSection(expandedSection === 'board' ? null : 'board')}
                    className="text-left hover:text-primary transition-colors group w-full"
                  >
                    <h4 className="text-slate-900 dark:text-white text-base font-bold group-hover:text-primary">Board of Directors</h4>
                    <p className="text-primary dark:text-gray-400 text-xs font-medium mt-0.5">{centralCom.length} members</p>
                  </button>
                  <div className="mt-3 flex -space-x-2">
                    {centralCom.slice(0, 3).map((member, index) => (
                      <div key={member.id} className="size-8 rounded-full border-2 border-white dark:border-slate-800 bg-cover bg-center" style={{backgroundImage: `url("${member.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop'}")`}}></div>
                    ))}
                    {centralCom.length > 3 && (
                      <div className="size-8 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center bg-primary/10 text-primary text-[10px] font-bold">+{centralCom.length - 3}</div>
                    )}
                  </div>
                  {expandedSection === 'board' && (
                    <div className="mt-4 bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-800">
                      <div className="space-y-2">
                        {centralCom.map(member => (
                          <div key={member.id} className="flex items-center gap-3">
                            <div className="size-8 rounded-full bg-cover bg-center" style={{backgroundImage: `url("${member.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop'}")`}}></div>
                            <div>
                              <p className="text-sm font-medium text-slate-900 dark:text-white">{member.full_name}</p>
                              <p className="text-xs text-primary">{member.position}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Executive Committee */}
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => setExpandedSection(expandedSection === 'executive' ? null : 'executive')}
                    className="flex items-center justify-center bg-white dark:bg-slate-800 size-8 rounded-full border-2 border-primary shadow-sm hover:scale-110 transition-transform"
                  >
                    <span className="material-symbols-outlined text-primary text-sm">groups</span>
                  </button>
                  <div className="w-0.5 bg-slate-300 dark:border-slate-700 h-12"></div>
                </div>
                <div className="pb-8">
                  <button
                    onClick={() => setExpandedSection(expandedSection === 'executive' ? null : 'executive')}
                    className="text-left hover:text-primary transition-colors group w-full"
                  >
                    <h4 className="text-slate-900 dark:text-white text-base font-bold group-hover:text-primary">Executive Committee</h4>
                    <p className="text-primary dark:text-gray-400 text-xs font-medium mt-0.5">{executives.length} members</p>
                  </button>
                  <div className="mt-3 flex -space-x-2">
                    {executives.slice(0, 3).map((member, index) => (
                      <div key={member.id} className="size-8 rounded-full border-2 border-white dark:border-slate-800 bg-cover bg-center" style={{backgroundImage: `url("${member.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop'}")`}}></div>
                    ))}
                    {executives.length > 3 && (
                      <div className="size-8 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center bg-primary/10 text-primary text-[10px] font-bold">+{executives.length - 3}</div>
                    )}
                  </div>
                  {expandedSection === 'executive' && (
                    <div className="mt-4 bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-800">
                      <div className="space-y-2">
                        {executives.map(member => (
                          <div key={member.id} className="flex items-center gap-3">
                            <div className="size-8 rounded-full bg-cover bg-center" style={{backgroundImage: `url("${member.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop'}")`}}></div>
                            <div>
                              <p className="text-sm font-medium text-slate-900 dark:text-white">{member.full_name}</p>
                              <p className="text-xs text-primary">{member.position}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Wing Leads - Show All Wings with Top Position Users */}
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => setExpandedSection(expandedSection === 'wings' ? null : 'wings')}
                    className="flex items-center justify-center bg-white dark:bg-slate-800 size-8 rounded-full border-2 border-slate-300 dark:border-slate-700 hover:scale-110 transition-transform"
                  >
                    <span className="material-symbols-outlined text-primary text-sm">tactic</span>
                  </button>
                  <div className="w-0.5 bg-slate-300 dark:border-slate-700 h-12"></div>
                </div>
                <div className="pb-8">
                  <button
                    onClick={() => setExpandedSection(expandedSection === 'wings' ? null : 'wings')}
                    className="text-left hover:text-primary transition-colors group w-full"
                  >
                    <h4 className="text-slate-900 dark:text-white text-base font-bold group-hover:text-primary">Wing Leads</h4>
                    <p className="text-primary dark:text-gray-400 text-xs font-medium mt-0.5">{wings.length} wings • {wingLeads.length} leaders</p>
                  </button>
                  <div className="mt-3 flex -space-x-2">
                    {wingLeads.slice(0, 4).map((leader, index) => (
                      <div key={leader.id} className="size-8 rounded-full border-2 border-white dark:border-slate-800 bg-cover bg-center" style={{backgroundImage: `url("${leader.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop'}")`}}></div>
                    ))}
                    {wingLeads.length > 4 && (
                      <div className="size-8 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center bg-primary/10 text-primary text-[10px] font-bold">+{wingLeads.length - 4}</div>
                    )}
                  </div>
                  {expandedSection === 'wings' && (
                    <div className="mt-4 bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-800">
                      <div className="space-y-3">
                        {wingLeads.map((leader, index) => (
                          <div key={leader.id} className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800 rounded">
                            <div className="size-8 rounded-full bg-cover bg-center" style={{backgroundImage: `url("${leader.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop'}")`}}></div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-900 dark:text-white">{leader.full_name}</p>
                              <p className="text-xs text-primary">{leader.position}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Ground Volunteers - All Other Volunteers */}
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => setExpandedSection(expandedSection === 'volunteers' ? null : 'volunteers')}
                    className="flex items-center justify-center bg-teal-600/10 size-8 rounded-full border-2 border-dashed border-teal-600 hover:scale-110 transition-transform"
                  >
                    <span className="material-symbols-outlined text-teal-600 text-sm">volunteer_activism</span>
                  </button>
                </div>
                <div>
                  <button
                    onClick={() => setExpandedSection(expandedSection === 'volunteers' ? null : 'volunteers')}
                    className="text-left hover:text-primary transition-colors group w-full"
                  >
                    <h4 className="text-slate-900 dark:text-white text-base font-bold group-hover:text-primary">Ground Volunteers</h4>
                    <p className="text-primary dark:text-gray-400 text-xs font-medium mt-0.5">{groundVolunteers.length} active volunteers</p>
                  </button>
                  <div className="mt-3 flex -space-x-2">
                    {groundVolunteers.slice(0, 4).map((member, index) => (
                      <div key={member.id} className="size-8 rounded-full border-2 border-white dark:border-slate-800 bg-cover bg-center" style={{backgroundImage: `url("${member.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop'}")`}}></div>
                    ))}
                    {groundVolunteers.length > 4 && (
                      <div className="size-8 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center bg-primary/10 text-primary text-[10px] font-bold">+{groundVolunteers.length - 4}</div>
                    )}
                  </div>
                  {expandedSection === 'volunteers' && (
                    <div className="mt-4 bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-800 max-h-60 overflow-y-auto">
                      <div className="space-y-2">
                        {groundVolunteers.map(volunteer => (
                          <div key={volunteer.id} className="flex items-center gap-3">
                            <div className="size-8 rounded-full bg-cover bg-center" style={{backgroundImage: `url("${volunteer.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop'}")`}}></div>
                            <div>
                              <p className="text-sm font-medium text-slate-900 dark:text-white">{volunteer.full_name}</p>
                              <p className="text-xs text-primary">{volunteer.position} • {volunteer.wing || 'General'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
          )}
        </>
      )}

      {/* Wings Section */}
      {activeTab === 'wings' && (
        <section className="px-4 mt-6">
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="text-slate-900 dark:text-white text-2xl font-extrabold leading-tight tracking-tight">
                Wings of Action
              </h2>
              <p className="text-primary dark:text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">
                {wings.length} Active Wings
              </p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-500">Loading wings...</div>
          ) : wings.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">folder_off</span>
              <p className="text-slate-500">No wings created yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {wings.map((wing, index) => (
                <button
                  key={wing.id}
                  onClick={() => navigate(`/wing/${wing.id}`)}
                  className={`w-full text-left rounded-2xl p-5 relative overflow-hidden group transition-all hover:scale-[1.02] ${
                    index === 0 
                      ? 'bg-primary text-white min-h-[160px] flex flex-col justify-between' 
                      : 'bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {index === 0 ? (
                    <>
                      <div className="relative z-10">
                        {wing.image ? (
                          <div className="size-12 rounded-xl bg-white/20 bg-cover bg-center" style={{backgroundImage: `url("${wing.image}")`}}></div>
                        ) : (
                          <span className="material-symbols-outlined text-3xl opacity-90">diversity_3</span>
                        )}
                        <h3 className="text-lg font-bold mt-4 leading-tight">{wing.name}</h3>
                        <p className="text-white/80 text-xs mt-2 leading-normal line-clamp-2">
                          {wing.bio || wing.description?.slice(0, 100) || 'Community wing for volunteer activities'}
                        </p>
                      </div>
                      <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                        <span className="material-symbols-outlined text-[120px]">diversity_3</span>
                      </div>
                      <div className="mt-4 flex items-center justify-between z-10">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">
                          {wing.member_count || 0} Members • {wing.location || 'Bangladesh'}
                        </span>
                        <span className="material-symbols-outlined text-xl">arrow_right_alt</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-start gap-4">
                      {wing.image ? (
                        <div className="size-12 rounded-xl bg-cover bg-center flex-shrink-0" style={{backgroundImage: `url("${wing.image}")`}}></div>
                      ) : (
                        <div className="bg-primary/10 size-12 shrink-0 rounded-xl flex items-center justify-center">
                          <span className="material-symbols-outlined text-primary text-2xl">diversity_3</span>
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{wing.name}</h3>
                        <p className="text-[10px] text-primary mt-1 leading-tight line-clamp-2">
                          {wing.bio || wing.location || 'Community wing'}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1">{wing.member_count || 0} members</p>
                      </div>
                      <span className="material-symbols-outlined text-primary/40">chevron_right</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Impact Section */}
      {activeTab === 'impact' && (
        <section className="px-4 mt-6">
          <div className="bg-gradient-to-r from-primary to-teal-600 rounded-2xl p-6 text-white mb-6">
            <h3 className="text-lg font-bold mb-4">Our Mission & Impact</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-extrabold">50k+</div>
                <div className="text-xs opacity-80 mt-1">Lives Touched</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-extrabold">200+</div>
                <div className="text-xs opacity-80 mt-1">Volunteers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-extrabold">25+</div>
                <div className="text-xs opacity-80 mt-1">Districts</div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
              <h4 className="font-bold text-slate-900 dark:text-white mb-2">Our Core Mission</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                To empower underprivileged communities in Bangladesh through sustainable education, healthcare, and development programs, creating lasting positive impact in people's lives.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
              <h4 className="font-bold text-slate-900 dark:text-white mb-2">Our Vision</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                A Bangladesh where every individual has access to quality education, healthcare, and opportunities to thrive, regardless of their socioeconomic background.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
              <h4 className="font-bold text-slate-900 dark:text-white mb-2">Our Values</h4>
              <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
                <li>• <strong>Transparency:</strong> Complete accountability in all operations</li>
                <li>• <strong>Empathy:</strong> Serving with dignity and heart</li>
                <li>• <strong>Action:</strong> Fast and efficient crisis response</li>
                <li>• <strong>Sustainability:</strong> Long-term impact over short-term gains</li>
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="px-4 mt-10 mb-8">
        <div className="bg-slate-900 dark:bg-primary/20 rounded-2xl p-6 text-center border border-white/10 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{backgroundImage: 'radial-gradient(circle at 20% 50%, #2ecc71 0%, transparent 50%)'}}></div>
          <h3 className="text-white text-xl font-bold mb-2">Ready to contribute?</h3>
          <p className="text-gray-400 text-xs mb-6 max-w-[240px] mx-auto">
            Join one of our specialized wings and start making a difference today.
          </p>
          <button onClick={() => navigate('/join')} className="bg-white text-slate-900 w-full py-3 rounded-xl text-sm font-bold tracking-wide transition-transform active:scale-95 hover:bg-gray-100">
            Apply to Join UYHO
          </button>
        </div>
      </section>
    </div>
  )
}
