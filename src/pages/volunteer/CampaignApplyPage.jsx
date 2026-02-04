import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import VolunteerFooter from '../../components/VolunteerFooter'

const projectRoles = [
  'Program Host',
  'Program Director',
  'Project Manager',
  'Operations Lead',
  'Logistics Coordinator',
  'Field Lead',
  'Medical Lead',
  'Media Coordinator',
  'Volunteer Coordinator',
  'Volunteer'
]

export default function CampaignApplyPage() {
  const navigate = useNavigate()
  const [volunteers, setVolunteers] = useState([])
  const [wings, setWings] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [saving, setSaving] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentUser, setCurrentUser] = useState(null)
  const [form, setForm] = useState({
    title: '',
    wing: '',
    wingId: '',
    description: '',
    location: '',
    date: '',
    budget: '',
    budgetItems: [],
    newItemName: '',
    newItemAmount: '',
    program_hours: '',
    program_respect: '',
    lives_impacted: '',
    search: '',
    selectedVolunteerId: '',
    selectedRole: projectRoles[0],
    taskNote: '',
    memberHours: '',
    memberRespect: '',
    assignees: []
  })

  const volunteerId = localStorage.getItem('volunteerId')

  // Fetch available wings on mount
  useEffect(() => {
    const fetchWings = async () => {
      try {
        const [wingsRes, userRes] = await Promise.all([
          fetch('/api/wings'),
          fetch(`/api/volunteers/${volunteerId}`)
        ])
        
        if (wingsRes.ok) {
          const wingsData = await wingsRes.json()
          setWings(wingsData)
        }
        
        if (userRes.ok) {
          const userData = await userRes.json()
          setCurrentUser(userData)
        }
      } catch (err) {
        console.error('Failed to fetch data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchWings()
  }, [])

  // Fetch wing members when wing is selected
  useEffect(() => {
    const fetchWingMembers = async () => {
      if (!form.wingId) {
        setVolunteers([])
        return
      }
      setLoadingMembers(true)
      try {
        const res = await fetch(`/api/wings/${form.wingId}`)
        if (res.ok) {
          const wingData = await res.json()
          const members = wingData.members || []
          setVolunteers(
            members.map(m => ({
              id: m.digital_id || `VOL-${m.volunteer_id}`,
              volid: m.volunteer_id,
              name: m.full_name,
              wing: wingData.name || 'Wing',
              position: m.role || m.central_position || 'Member',
              avatar: m.avatar || '/avatars/avatar_1.svg',
              hours_given: m.hours_given || 0
            }))
          )
        }
      } catch (err) {
        console.error('Failed to load wing members', err)
        setVolunteers([])
      } finally {
        setLoadingMembers(false)
      }
    }
    fetchWingMembers()
  }, [form.wingId])

  // Exclude current user from team assignment
  const filteredVolunteers = volunteers.filter(v =>
    v.id !== parseInt(volunteerId) && (
      v.name?.toLowerCase().includes(form.search.toLowerCase()) ||
      v.wing?.toLowerCase().includes(form.search.toLowerCase())
    )
  )

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleAddAssignee = () => {
    const volunteer = volunteers.find(v => v.id === form.selectedVolunteerId)
    if (!volunteer) return
    if (!form.taskNote.trim()) return
    const exists = form.assignees.find(a => a.id === volunteer.id)
    if (exists) return
    const memberHours = parseInt(form.memberHours) || parseInt(form.program_hours) || 0
    const memberRespect = parseInt(form.memberRespect) || parseInt(form.program_respect) || 0
    setForm(prev => ({
      ...prev,
      assignees: [...prev.assignees, { 
        ...volunteer, 
        role: form.selectedRole, 
        taskNote: form.taskNote.trim(),
        hours: memberHours,
        respect: memberRespect
      }],
      selectedVolunteerId: '',
      taskNote: '',
      memberHours: '',
      memberRespect: ''
    }))
  }

  const handleRemoveAssignee = (id) => {
    setForm(prev => ({ ...prev, assignees: prev.assignees.filter(a => a.id !== id) }))
  }

  const handleAddBudgetItem = () => {
    if (!form.newItemName.trim() || !form.newItemAmount) return
    setForm(prev => ({
      ...prev,
      budgetItems: [...prev.budgetItems, { name: form.newItemName.trim(), amount: parseFloat(form.newItemAmount) }],
      newItemName: '',
      newItemAmount: ''
    }))
  }

  const handleRemoveBudgetItem = (index) => {
    setForm(prev => ({ ...prev, budgetItems: prev.budgetItems.filter((_, i) => i !== index) }))
  }

  const totalAllocated = form.budgetItems.reduce((sum, item) => sum + item.amount, 0)
  const remainingBudget = (parseFloat(form.budget) || 0) - totalAllocated

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (saving) return
    if (!form.title.trim() || !form.wing || !form.description.trim() || !form.budget || form.assignees.length === 0) {
      alert('Please complete all required fields and add at least one team member.')
      return
    }

    setSaving(true)
    setProgress(10)
    const timer = setInterval(() => {
      setProgress(prev => (prev >= 90 ? prev : prev + 10))
    }, 200)

    try {
      const programHours = parseInt(form.program_hours) || 0
      const programRespect = parseInt(form.program_respect) || 0
      const livesImpacted = parseInt(form.lives_impacted) || 0
      // Use individual hours/respect if set, otherwise fall back to program defaults
      const teamPayload = form.assignees.map(a => ({ 
        volunteerId: a.volid, 
        role: a.role, 
        taskNote: a.taskNote,
        hours: a.hours || programHours,
        respect: a.respect || programRespect
      }))
      const hostId = localStorage.getItem('volunteerId')

      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          wing: form.wing,
          description: form.description,
          location: form.location,
          date: form.date,
          budget: parseFloat(form.budget) || 0,
          budgetBreakdown: JSON.stringify(form.budgetItems),
          image: `https://images.unsplash.com/photo-${Math.floor(Math.random() * 10000000000)}?auto=format&fit=crop&w=1200&h=720&q=70&fm=jpg&crop=entropy&cs=tinysrgb&sat=-20&blend=000000&blend-mode=normal&blend-alpha=5&fit=crop&orient=landscape&sig=${Math.floor(Math.random() * 100000)}`,
          volunteersNeeded: Math.max(form.assignees.length + 5, 10),
          goal: parseFloat(form.budget) || 0,
          daysLeft: 30,
          hostId,
          program_hours: programHours,
          program_respect: programRespect,
          lives_impacted: livesImpacted,
          team: teamPayload
        })
      })

      clearInterval(timer)
      setProgress(100)

      if (!res.ok) throw new Error('Create failed')

      setForm({
        title: '',
        wing: '',
        description: '',
        location: '',
        date: '',
        budget: '',
        budgetItems: [],
        newItemName: '',
        newItemAmount: '',
        program_hours: '',
        program_respect: '',
        lives_impacted: '',
        search: '',
        selectedVolunteerId: '',
        selectedRole: projectRoles[0],
        taskNote: '',
        assignees: []
      })
      alert('Campaign host request approved automatically!')
      navigate('/volunteer/campaigns')
    } catch (err) {
      clearInterval(timer)
      console.error('Failed to submit', err)
      alert('Failed to submit. Please try again.')
    } finally {
      setSaving(false)
      setProgress(0)
    }
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-[#0f181a] dark:text-white pb-24">
      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        <section className="space-y-4">
          <div>
            <p className="text-[10px] uppercase font-bold text-primary">Setup Campaign</p>
            <h1 className="text-2xl font-bold">Host a campaign</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Campaign Title *</label>
              <input
                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
                value={form.title}
                onChange={e => handleChange('title', e.target.value)}
                placeholder="e.g. Clean Water Initiative"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Wing *</label>
              <select
                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
                value={form.wingId}
                onChange={e => {
                  const selectedWing = wings.find(w => w.id.toString() === e.target.value)
                  handleChange('wingId', e.target.value)
                  handleChange('wing', selectedWing?.name || '')
                  // Clear selected volunteers when wing changes
                  handleChange('assignees', [])
                  handleChange('selectedVolunteerId', '')
                }}
                required
              >
                <option value="">Select Wing</option>
                {wings.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
              {form.wingId && (
                <p className="text-xs text-primary mt-1">Only members of this wing will be shown for team assignment</p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Description *</label>
              <textarea
                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
                rows={3}
                value={form.description}
                onChange={e => handleChange('description', e.target.value)}
                placeholder="Define the primary goals and impact"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Location *</label>
              <input
                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
                value={form.location}
                onChange={e => handleChange('location', e.target.value)}
                placeholder="e.g. Dhaka, Bangladesh"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Campaign Date *</label>
              <input
                type="date"
                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
                value={form.date}
                onChange={e => handleChange('date', e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Total Budget (৳) *</label>
              <input
                type="number"
                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
                value={form.budget}
                onChange={e => handleChange('budget', e.target.value)}
                placeholder="0.00"
                min="0"
                required
              />
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Budget Distribution</label>
                <p className="text-xs text-gray-500 mb-2">Add expense categories</p>
              </div>

              <div className="flex gap-2">
                <input
                  className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
                  value={form.newItemName}
                  onChange={e => handleChange('newItemName', e.target.value)}
                  placeholder="Category name (e.g., Logistics)"
                />
                <input
                  type="number"
                  className="w-24 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
                  value={form.newItemAmount}
                  onChange={e => handleChange('newItemAmount', e.target.value)}
                  placeholder="Amount"
                  min="0"
                />
                <button
                  type="button"
                  onClick={handleAddBudgetItem}
                  className="px-4 bg-primary text-white rounded-lg font-bold hover:bg-primary/90"
                >
                  <span className="material-symbols-outlined text-lg">add</span>
                </button>
              </div>

              <div className="space-y-2">
                {form.budgetItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                    <div>
                      <p className="text-sm font-bold">{item.name}</p>
                      <p className="text-xs text-gray-500">৳{item.amount.toFixed(2)}</p>
                    </div>
                    <button type="button" onClick={() => handleRemoveBudgetItem(index)} className="p-2 text-gray-400 hover:text-red-500">
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                ))}
                {form.budgetItems.length === 0 && (
                  <p className="text-xs text-gray-500">No budget items added yet.</p>
                )}
              </div>

              {form.budget && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-blue-900 dark:text-blue-300">Remaining Budget:</span>
                    <span className="text-lg font-extrabold text-blue-600 dark:text-blue-400">৳{remainingBudget.toFixed(2)}</span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Allocated: ৳{totalAllocated.toFixed(2)} of ৳{(parseFloat(form.budget) || 0).toFixed(2)}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Program Hours *</label>
                <input
                  type="number"
                  className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
                  value={form.program_hours}
                  onChange={e => handleChange('program_hours', e.target.value)}
                  placeholder="Hours"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Respect Points *</label>
                <input
                  type="number"
                  className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
                  value={form.program_respect}
                  onChange={e => handleChange('program_respect', e.target.value)}
                  placeholder="Points"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Lives Impacted</label>
                <input
                  type="number"
                  className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
                  value={form.lives_impacted}
                  onChange={e => handleChange('lives_impacted', e.target.value)}
                  placeholder="Est. impact"
                  min="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase text-gray-500">Team & Roles *</p>
                  <p className="text-xs text-gray-500">Search wing members, assign a role, set hours & respect</p>
                </div>
              </div>
              
              {/* Program Host Display */}
              {currentUser && (
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-[10px] font-bold uppercase text-gray-500 mb-2">Program Host (You)</p>
                  <div className="flex items-center gap-3">
                    <img src={currentUser.avatar} alt={currentUser.full_name} className="w-8 h-8 rounded-full object-cover" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-800 dark:text-white">{currentUser.full_name}</p>
                      <p className="text-[10px] text-gray-500">{currentUser.wing_role} • {currentUser.digital_id}</p>
                    </div>
                    <span className="text-[10px] bg-primary text-white px-2 py-1 rounded-full">Host</span>
                  </div>
                </div>
              )}
              
              {!form.wingId ? (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-center">
                  <span className="material-symbols-outlined text-amber-600 text-2xl mb-2">info</span>
                  <p className="text-sm text-amber-700 dark:text-amber-300">Please select a wing first to see available members</p>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                    <input
                      className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg pl-10 pr-3 py-2 text-sm"
                      value={form.search}
                      onChange={e => handleChange('search', e.target.value)}
                        placeholder="Search wing members by name... (you are automatically the host)"
                    />
                  </div>

                  <div className="h-60 overflow-y-auto border border-gray-100 dark:border-gray-800 rounded-lg divide-y divide-gray-100 dark:divide-gray-800">
                    {loadingMembers ? (
                      <div className="flex items-center justify-center py-8">
                        <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                        <span className="ml-2 text-sm text-gray-500">Loading wing members...</span>
                      </div>
                    ) : filteredVolunteers.length === 0 ? (
                      <div className="p-4 text-center">
                        <span className="material-symbols-outlined text-gray-300 text-3xl">person_off</span>
                        <p className="text-sm text-gray-500 mt-2">No members found in this wing</p>
                      </div>
                    ) : (
                      filteredVolunteers.map(v => (
                        <label key={v.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                          <input
                            type="radio"
                            name="volunteer"
                            value={v.id}
                            checked={form.selectedVolunteerId === v.id}
                            onChange={() => handleChange('selectedVolunteerId', v.id)}
                          />
                          <img src={v.avatar} alt={v.name} className="w-10 h-10 rounded-full object-cover" />
                          <div className="flex-1">
                            <p className="text-sm font-bold text-[#0f181a] dark:text-white">{v.name}</p>
                            <p className="text-[11px] text-gray-500">{v.wing} • {v.position}</p>
                            <p className="text-[10px] text-blue-600">Total Hours: {v.hours_given || 0}</p>
                          </div>
                          <span className="text-[11px] font-bold text-primary">{v.id}</span>
                        </label>
                      ))
                    )}
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Role</label>
                  <select
                    className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
                    value={form.selectedRole}
                    onChange={e => handleChange('selectedRole', e.target.value)}
                  >
                    {projectRoles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Task Note *</label>
                  <input
                    className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
                    value={form.taskNote}
                    onChange={e => handleChange('taskNote', e.target.value)}
                    placeholder="Describe responsibility"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Member Hours</label>
                  <input
                    type="number"
                    className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
                    value={form.memberHours}
                    onChange={e => handleChange('memberHours', e.target.value)}
                    placeholder={form.program_hours || '0'}
                    min="0"
                  />
                  <p className="text-[10px] text-gray-400 mt-0.5">Default: {form.program_hours || '0'}</p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Member Respect</label>
                  <input
                    type="number"
                    className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
                    value={form.memberRespect}
                    onChange={e => handleChange('memberRespect', e.target.value)}
                    placeholder={form.program_respect || '0'}
                    min="0"
                  />
                  <p className="text-[10px] text-gray-400 mt-0.5">Default: {form.program_respect || '0'}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddAssignee}
                className="w-full border border-dashed border-gray-300 dark:border-gray-700 rounded-lg py-2 text-sm font-bold text-primary flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">add</span>
                Add to Team
              </button>

              <div className="space-y-2">
                {form.assignees.map(member => (
                  <div key={member.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                    <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full object-cover" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-[#0f181a] dark:text-white">{member.name}</p>
                      <p className="text-[11px] text-gray-500">{member.wing} • {member.position} • {member.id}</p>
                      <p className="text-[11px] font-bold text-primary">{member.role}</p>
                      <p className="text-[11px] text-gray-600">{member.taskNote}</p>
                      <div className="flex gap-3 mt-1">
                        <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded">Hours: {member.hours}</span>
                        <span className="text-[10px] font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded">Respect: {member.respect}</span>
                      </div>
                    </div>
                    <button type="button" onClick={() => handleRemoveAssignee(member.id)} className="p-2 text-gray-400 hover:text-red-500">
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                ))}
                {form.assignees.length === 0 && (
                  <p className="text-xs text-gray-500">No team members added yet.</p>
                )}
              </div>
            </div>

            {saving && (
              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                <div className="h-2 bg-primary transition-all" style={{ width: `${progress}%` }}></div>
              </div>
            )}

            <div className="flex gap-3 pb-4">
              <button
                type="button"
                onClick={() => navigate('/volunteer/campaigns')}
                className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg py-3 font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-primary text-white rounded-lg py-3 font-bold hover:bg-primary/90 disabled:opacity-60"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Submit & Auto-Approve'}
              </button>
            </div>
          </form>
        </section>
      </main>
      <VolunteerFooter />
    </div>
  )
}
