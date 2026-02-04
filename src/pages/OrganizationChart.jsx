import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function OrganizationChart() {
  const navigate = useNavigate()
  const [teamMembers, setTeamMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch team members from API
    fetch('/api/team-members')
      .then(res => res.json())
      .then(data => {
        setTeamMembers(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch team members:', err)
        setLoading(false)
      })
  }, [])

  const hierarchyOrder = ['Leadership', 'Executive', 'Wing Lead']
  
  return (
    <main className="min-h-screen bg-white dark:bg-slate-900 px-6 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <button 
            onClick={() => navigate('/wings')}
            className="text-primary hover:text-primary/80 font-bold text-sm mb-4 flex items-center gap-1"
          >
            <span className="material-symbols-outlined">arrow_back</span> Back
          </button>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-3">
            Organization Chain of Command
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Complete organizational hierarchy from president to all team members
          </p>
        </div>

        {/* Full Organization Chart */}
        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading organization structure...</div>
        ) : (
          <div className="space-y-8">
            {hierarchyOrder.map((category) => {
              const members = teamMembers.filter(m => m.category === category)
              if (members.length === 0) return null

              return (
                <section key={category} className="border-l-4 border-primary pl-6">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 capitalize">
                    {category === 'Wing Lead' ? 'Wing Leadership' : category}
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {members.map((member) => (
                      <div 
                        key={member.id}
                        className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 rounded-full bg-gray-300 flex-shrink-0 overflow-hidden">
                            <img 
                              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop"
                              alt={member.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                              {member.name}
                            </h3>
                            <p className="text-primary font-semibold text-sm mt-1">
                              {member.position}
                            </p>
                            {member.specialty && (
                              <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">
                                {member.specialty}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        )}

        {/* Wings Breakdown Section */}
        <div className="mt-16 pt-12 border-t border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Team by Wings</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Education Wing */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-800 dark:to-slate-700 rounded-xl p-6 border border-blue-200 dark:border-slate-600">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-600 text-white rounded-lg">
                  <span className="material-symbols-outlined">school</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Education Wing</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Providing educational support and resources
              </p>
            </div>

            {/* Healthcare Wing */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-slate-800 dark:to-slate-700 rounded-xl p-6 border border-green-200 dark:border-slate-600">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-600 text-white rounded-lg">
                  <span className="material-symbols-outlined">health_and_safety</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Healthcare Wing</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Medical services and health initiatives
              </p>
            </div>

            {/* Disaster Relief */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-slate-800 dark:to-slate-700 rounded-xl p-6 border border-orange-200 dark:border-slate-600">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-600 text-white rounded-lg">
                  <span className="material-symbols-outlined">emergency</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Disaster Relief</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Emergency response and relief operations
              </p>
            </div>

            {/* IT & Media */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-slate-800 dark:to-slate-700 rounded-xl p-6 border border-purple-200 dark:border-slate-600">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-600 text-white rounded-lg">
                  <span className="material-symbols-outlined">campaign</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">IT & Media</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Technology and communications
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
