import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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

export default function CampaignDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const currentUserId = localStorage.getItem('volunteerId')
  const [campaign, setCampaign] = useState(null)
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)

  const fetchCampaign = async () => {
    try {
      const res = await fetch(currentUserId ? `/api/campaigns/${id}?userId=${currentUserId}` : `/api/campaigns/${id}`)
      if (res.ok) {
        const data = await res.json()
        setCampaign(data)
      }
    } catch (err) {
      console.error('Failed to load campaign', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCampaign()
  }, [id, currentUserId])

  const managementTeam = (campaign?.team || []).filter(member => projectRoles.some(role => role.toLowerCase() === (member.role || '').toLowerCase()))
  const otherVolunteers = (campaign?.team || []).filter(member => !projectRoles.some(role => role.toLowerCase() === (member.role || '').toLowerCase()))

  const updateMember = async (memberId, role, taskNote) => {
    setSavingId(memberId)
    try {
      const res = await fetch(`/api/campaigns/${id}/team/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, taskNote })
      })
      if (!res.ok) throw new Error('Update failed')
      await fetchCampaign()
    } catch (err) {
      console.error('Failed to update member', err)
      alert('Could not update role/task note')
    } finally {
      setSavingId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <p className="text-slate-500">Loading...</p>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <p className="text-slate-500">Campaign not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark pb-24">
      <main className="max-w-md mx-auto px-4 py-5 space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
          </button>
          <div>
            <p className="text-[10px] uppercase font-bold text-primary">Manage Tasks</p>
            <h1 className="text-xl font-bold">Project Team</h1>
          </div>
        </div>

        <div className="relative w-full aspect-[21/9] bg-center bg-no-repeat bg-cover rounded-2xl overflow-hidden" style={{ backgroundImage: `url('${campaign.image}')` }}></div>

        <div>
          <h2 className="text-lg font-extrabold text-[#0f181a] dark:text-white leading-tight">{campaign.title}</h2>
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">location_on</span>{campaign.location || 'TBD'}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">Management Team</h3>
            <span className="text-[11px] text-gray-500">{managementTeam.length} members</span>
          </div>
          <div className="space-y-3">
            {managementTeam.length === 0 && <p className="text-xs text-gray-500">No management roles assigned.</p>}
            {managementTeam.map(member => (
              <div key={member.id} className="p-3 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
                <div className="flex items-center gap-3">
                  <img src={member.avatar || '/avatars/avatar_1.svg'} alt={member.full_name} className="w-10 h-10 rounded-full object-cover" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[#0f181a] dark:text-white">{member.full_name}</p>
                    <p className="text-[11px] text-gray-500">{member.wing} • {member.position} • {member.digital_id}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-500">Role</label>
                    <select
                      defaultValue={member.role}
                      onChange={e => updateMember(member.id, e.target.value, member.task_note)}
                      className="w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
                      disabled={savingId === member.id}
                    >
                      {projectRoles.map(role => <option key={role} value={role}>{role}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-500">Task Note</label>
                    <input
                      defaultValue={member.task_note || ''}
                      onBlur={e => updateMember(member.id, member.role, e.target.value)}
                      className="w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
                      placeholder="Describe task"
                      disabled={savingId === member.id}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">Other Volunteers</h3>
            <span className="text-[11px] text-gray-500">{otherVolunteers.length} members</span>
          </div>
          <div className="space-y-3">
            {otherVolunteers.length === 0 && <p className="text-xs text-gray-500">No additional volunteers yet.</p>}
            {otherVolunteers.map(member => (
              <div key={member.id} className="p-3 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
                <div className="flex items-center gap-3">
                  <img src={member.avatar || '/avatars/avatar_1.svg'} alt={member.full_name} className="w-10 h-10 rounded-full object-cover" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[#0f181a] dark:text-white">{member.full_name}</p>
                    <p className="text-[11px] text-gray-500">{member.wing} • {member.position} • {member.digital_id}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-500">Assign Role</label>
                    <select
                      value={member.role || 'Volunteer'}
                      onChange={e => updateMember(member.id, e.target.value, member.task_note)}
                      className="w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
                      disabled={savingId === member.id}
                    >
                      <option value="Volunteer">Volunteer</option>
                      {projectRoles.map(role => <option key={role} value={role}>{role}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-500">Task Note</label>
                    <input
                      defaultValue={member.task_note || ''}
                      onBlur={e => updateMember(member.id, member.role || 'Volunteer', e.target.value)}
                      className="w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
                      placeholder="Describe task"
                      disabled={savingId === member.id}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <VolunteerFooter />
    </div>
  )
}
