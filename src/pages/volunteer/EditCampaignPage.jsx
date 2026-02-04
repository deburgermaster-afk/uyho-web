import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import VolunteerFooter from '../../components/VolunteerFooter'
import VolunteerHeader from '../../components/VolunteerHeader'

export default function EditCampaignPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [checkingAccess, setCheckingAccess] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [generatingImage, setGeneratingImage] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [campaignData, setCampaignData] = useState(null)
  const [form, setForm] = useState({
    title: '',
    wing: '',
    description: '',
    location: '',
    date: '',
    budget: '',
    volunteersNeeded: '',
    image: '',
    programHours: '',
    programRespect: ''
  })

  const volunteerId = localStorage.getItem('volunteerId')

  // Check access on mount
  useEffect(() => {
    const checkAccess = async () => {
      try {
        // Check if user is campaign creator or has campaign_manage permission
        const [campaignRes, accessRes] = await Promise.all([
          fetch(`/api/campaigns/${id}`),
          fetch(`/api/access-settings/user/${volunteerId}`)
        ])
        
        if (campaignRes.ok && accessRes.ok) {
          const campaign = await campaignRes.json()
          const accessData = await accessRes.json()
          const permissions = accessData.permissions || []
          
          // Allow access if user is creator, has campaign_manage, or is admin
          const isCreator = campaign.created_by?.toString() === volunteerId?.toString()
          const canManage = permissions.includes('campaign_manage') || 
                          permissions.includes('org_settings') ||
                          accessData.role === 'Admin'
          
          if (isCreator || canManage) {
            setCampaignData(campaign)
            setForm({
              title: campaign.title || '',
              wing: campaign.wing || '',
              description: campaign.description || '',
              location: campaign.location || '',
              date: campaign.event_date || campaign.date || '',
              budget: campaign.budget || '',
              volunteersNeeded: campaign.volunteers_needed || '',
              image: campaign.image || '',
              programHours: campaign.program_hours ?? '',
              programRespect: campaign.program_respect ?? ''
            })
            setHasAccess(true)
            setLoading(false)
          } else {
            navigate('/volunteer/campaigns', { replace: true })
          }
        } else {
          navigate('/volunteer/campaigns', { replace: true })
        }
      } catch (err) {
        console.error('Access check failed:', err)
        navigate('/volunteer/campaigns', { replace: true })
      } finally {
        setCheckingAccess(false)
      }
    }
    checkAccess()
  }, [id, volunteerId, navigate])

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const generateNewImage = async () => {
    setGeneratingImage(true)
    setGenerationProgress(10)
    
    try {
      // Build a descriptive prompt from campaign data
      const prompt = `Create a professional, artistic digital illustration for a volunteer campaign. 
      Campaign: ${form.title}
      Wing: ${form.wing}
      Location: ${form.location}
      Description: ${form.description}
      
      Style: Digital art, illustration, cartoon style, warm and inspiring, showing diverse humans working together without showing faces, nature elements, collaboration theme. Professional, clean, colorful, modern design. No people faces, focus on human silhouettes or hands working together.`

      setGenerationProgress(20)

      // Call backend endpoint which will call OpenRouter API
      const response = await fetch('/api/openrouter/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt })
      })

      setGenerationProgress(50)

      if (!response.ok) {
        const error = await response.json()
        console.error('Image generation error:', error)
        alert(`Failed to generate image: ${error.error || 'Unknown error'}`)
        setGeneratingImage(false)
        return
      }

      const data = await response.json()
      setGenerationProgress(80)

      if (data.imageUrl) {
        console.log('Image URL received:', data.imageUrl)
        setForm(prev => { 
          const updated = { ...prev, image: data.imageUrl }
          console.log('Form state updated with image:', updated.image)
          return updated
        })
        console.log('Image generated:', data.imageUrl)
        setGenerationProgress(100)
        
        setTimeout(() => {
          setGeneratingImage(false)
          setGenerationProgress(0)
          if (!response.ok) {
            alert('Using placeholder image. Try again or contact support for image generation.')
          }
        }, 500)
      } else {
        console.error('No imageUrl in response:', data)
        alert('Failed to generate image')
        setGeneratingImage(false)
      }
    } catch (err) {
      console.error('Failed to generate image:', err)
      alert(`Error: ${err.message}`)
      setGeneratingImage(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (saving) return

    setSaving(true)
    try {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          wing: form.wing,
          description: form.description,
          location: form.location,
          date: form.date,
          budget: parseFloat(form.budget) || 0,
          volunteersNeeded: parseInt(form.volunteersNeeded) || 10,
          image: form.image,
          programHours: parseInt(form.programHours) || 0,
          programRespect: parseInt(form.programRespect) || 0
        })
      })

      if (!res.ok) throw new Error('Update failed')

      alert('Campaign updated successfully!')
      navigate(`/volunteer/campaigns/${id}`)
    } catch (err) {
      console.error('Failed to update', err)
      alert('Failed to update campaign. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (checkingAccess || loading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-4">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-red-500 mb-4">lock</span>
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">You don't have permission to edit this campaign.</p>
          <button onClick={() => navigate('/volunteer/campaigns')} className="px-4 py-2 bg-green-600 text-white rounded-lg">
            Back to Campaigns
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-[#0f181a] dark:text-white pb-24">
      <VolunteerHeader title="Edit Campaign" showBack />

      <main className="max-w-md mx-auto px-4 py-4">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-2">Campaign Image</label>
            <div className="relative w-full aspect-[21/9] bg-center bg-no-repeat bg-cover rounded-2xl overflow-hidden bg-gray-200 dark:bg-gray-700 mb-3" style={form.image ? { backgroundImage: `url('${form.image}')` } : {}}>
              {!form.image && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-800">
                  <span className="material-symbols-outlined text-6xl text-gray-500 dark:text-gray-400">image</span>
                </div>
              )}
            </div>
            
            {generatingImage && (
              <div className="mb-3 space-y-2">
                <p className="text-xs text-primary font-semibold">Generating image with AI...</p>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-primary h-full transition-all duration-300"
                    style={{ width: `${generationProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500">{generationProgress}% Complete</p>
              </div>
            )}

            {generatingImage && generationProgress === 100 && (
              <p className="text-xs text-green-600 dark:text-green-400 font-semibold mb-3">✓ Image saved successfully</p>
            )}
            
            <button
              type="button"
              onClick={generateNewImage}
              disabled={generatingImage}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-lg py-2 px-3 text-sm font-bold text-primary hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-base">refresh</span>
              {generatingImage ? 'Generating...' : 'Regenerate Image'}
            </button>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Campaign Title *</label>
            <input
              className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
              value={form.title}
              onChange={e => handleChange('title', e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Wing *</label>
            <select
              className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
              value={form.wing}
              onChange={e => handleChange('wing', e.target.value)}
              required
            >
              <option value="">Select Wing</option>
              <option value="Health">Health</option>
              <option value="Education">Education</option>
              <option value="Relief">Relief</option>
              <option value="Operations">Operations</option>
              <option value="Media">Media</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Description *</label>
            <textarea
              className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
              rows={4}
              value={form.description}
              onChange={e => handleChange('description', e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Location *</label>
            <input
              className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
              value={form.location}
              onChange={e => handleChange('location', e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Campaign Date</label>
            <input
              type="date"
              className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
              value={form.date}
              onChange={e => handleChange('date', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Budget (৳)</label>
            <input
              type="number"
              className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
              value={form.budget}
              onChange={e => handleChange('budget', e.target.value)}
              min="0"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Volunteers Needed</label>
            <input
              type="number"
              className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
              value={form.volunteersNeeded}
              onChange={e => handleChange('volunteersNeeded', e.target.value)}
              min="1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Hours (per volunteer)</label>
              <input
                type="number"
                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
                value={form.programHours}
                onChange={e => handleChange('programHours', e.target.value)}
                min="0"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Respect (per volunteer)</label>
              <input
                type="number"
                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
                value={form.programRespect}
                onChange={e => handleChange('programRespect', e.target.value)}
                min="0"
              />
            </div>
          </div>

          <div className="flex gap-3 pb-4">
            <button
              type="button"
              onClick={() => navigate(`/volunteer/campaigns/${id}`)}
              className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg py-3 font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
              disabled={saving || deleting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-primary text-white rounded-lg py-3 font-bold hover:bg-primary/90 disabled:opacity-60"
              disabled={saving || deleting}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {/* Delete Campaign */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6 pb-4">
            <p className="text-xs text-gray-500 mb-3">Danger Zone</p>
            <button
              type="button"
              onClick={async () => {
                if (!confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) return
                setDeleting(true)
                try {
                  const res = await fetch(`/api/campaigns/${id}`, { method: 'DELETE' })
                  if (!res.ok) throw new Error('Delete failed')
                  alert('Campaign deleted successfully')
                  navigate('/volunteer/campaigns')
                } catch (err) {
                  console.error('Delete error:', err)
                  alert('Failed to delete campaign')
                } finally {
                  setDeleting(false)
                }
              }}
              className="w-full border-2 border-red-500 text-red-500 rounded-lg py-3 font-bold hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-60 flex items-center justify-center gap-2"
              disabled={saving || deleting}
            >
              <span className="material-symbols-outlined text-lg">delete</span>
              {deleting ? 'Deleting...' : 'Delete Campaign'}
            </button>
          </div>
        </form>
      </main>

      <VolunteerFooter />
    </div>
  )
}
