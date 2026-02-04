import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'

export default function ManageCampaignPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [campaign, setCampaign] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [fundSummary, setFundSummary] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [expenses, setExpenses] = useState([])
  const [pendingDonations, setPendingDonations] = useState([])
  const [volunteers, setVolunteers] = useState([])
  
  // Modal states
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  
  // Form states
  const [transferForm, setTransferForm] = useState({ toType: '', toId: '', amount: '', note: '' })
  const [expenseForm, setExpenseForm] = useState({ title: '', description: '', amount: '', category: 'General', invoiceImage: '' })
  const [uploadingInvoice, setUploadingInvoice] = useState(false)
  
  // Edit form states
  const [editForm, setEditForm] = useState({
    title: '', wing: '', description: '', location: '', date: '', 
    budget: '', volunteersNeeded: '', image: '', programHours: '', programRespect: ''
  })
  const [saving, setSaving] = useState(false)
  const [generatingImage, setGeneratingImage] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  
  // Available targets for transfer
  const [transferTargets, setTransferTargets] = useState({ wings: [], campaigns: [], directAids: [] })
  
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')

  useEffect(() => {
    fetchCampaignData()
    fetchTransferTargets()
  }, [id])

  const fetchCampaignData = async () => {
    try {
      const [campaignRes, fundRes, transRes, expenseRes, donationsRes, volunteersRes] = await Promise.all([
        fetch(`/api/campaigns/${id}`),
        fetch(`/api/campaigns/${id}/fund-summary`),
        fetch(`/api/ummah-funds/campaign/${id}/transactions`),
        fetch(`/api/expenses/campaign/${id}`),
        fetch(`/api/donations/campaign/${id}?status=pending`),
        fetch(`/api/campaigns/${id}/volunteers`)
      ])
      
      if (campaignRes.ok) {
        const data = await campaignRes.json()
        setCampaign(data)
        setEditForm({
          title: data.title || '',
          wing: data.wing || '',
          description: data.description || '',
          location: data.location || '',
          date: data.event_date || data.date || '',
          budget: data.budget || '',
          volunteersNeeded: data.volunteers_needed || '',
          image: data.image || '',
          programHours: data.program_hours ?? '',
          programRespect: data.program_respect ?? ''
        })
      }
      if (fundRes.ok) setFundSummary(await fundRes.json())
      if (transRes.ok) setTransactions(await transRes.json())
      if (expenseRes.ok) setExpenses(await expenseRes.json())
      if (donationsRes.ok) setPendingDonations(await donationsRes.json())
      if (volunteersRes.ok) setVolunteers(await volunteersRes.json())
    } catch (err) {
      console.error('Failed to fetch campaign data', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchTransferTargets = async () => {
    try {
      const [wingsRes, campaignsRes, directAidsRes] = await Promise.all([
        fetch('/api/wings?approval_status=approved'),
        fetch('/api/campaigns?approval_status=approved'),
        fetch('/api/direct-aids')
      ])
      
      const wings = wingsRes.ok ? await wingsRes.json() : []
      const campaigns = campaignsRes.ok ? await campaignsRes.json() : []
      const directAids = directAidsRes.ok ? await directAidsRes.json() : []
      
      setTransferTargets({
        wings: wings.filter(w => w.id),
        campaigns: campaigns.filter(c => c.id !== parseInt(id)),
        directAids: directAids.filter(d => d.id)
      })
    } catch (err) {
      console.error('Failed to fetch transfer targets', err)
    }
  }

  const handleTransfer = async () => {
    if (!transferForm.toType || !transferForm.toId || !transferForm.amount) {
      alert('Please fill all required fields')
      return
    }
    
    try {
      const res = await fetch('/api/ummah-funds/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromType: 'campaign',
          fromId: parseInt(id),
          toType: transferForm.toType,
          toId: parseInt(transferForm.toId),
          amount: parseFloat(transferForm.amount),
          note: transferForm.note,
          createdBy: currentUser.id
        })
      })
      
      if (res.ok) {
        setShowTransferModal(false)
        setTransferForm({ toType: '', toId: '', amount: '', note: '' })
        fetchCampaignData()
      } else {
        const err = await res.json()
        alert(err.error || 'Transfer failed')
      }
    } catch (err) {
      alert('Transfer failed')
    }
  }

  const handleInvoiceUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    setUploadingInvoice(true)
    const formData = new FormData()
    formData.append('invoice', file)
    
    try {
      const res = await fetch('/api/expenses/upload-invoice', {
        method: 'POST',
        body: formData
      })
      if (res.ok) {
        const data = await res.json()
        setExpenseForm(prev => ({ ...prev, invoiceImage: data.invoiceUrl }))
      }
    } catch (err) {
      console.error('Failed to upload invoice', err)
    } finally {
      setUploadingInvoice(false)
    }
  }

  const handleAddExpense = async () => {
    if (!expenseForm.title || !expenseForm.amount) {
      alert('Please fill title and amount')
      return
    }
    
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: 'campaign',
          entityId: parseInt(id),
          title: expenseForm.title,
          description: expenseForm.description,
          amount: parseFloat(expenseForm.amount),
          category: expenseForm.category,
          invoiceImage: expenseForm.invoiceImage,
          createdBy: currentUser.id
        })
      })
      
      if (res.ok) {
        setShowExpenseModal(false)
        setExpenseForm({ title: '', description: '', amount: '', category: 'General', invoiceImage: '' })
        fetchCampaignData()
      }
    } catch (err) {
      alert('Failed to add expense')
    }
  }

  const handleExpenseAction = async (expenseId, status) => {
    try {
      const res = await fetch(`/api/expenses/${expenseId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, approvedBy: currentUser.id })
      })
      if (res.ok) fetchCampaignData()
    } catch (err) {
      alert('Action failed')
    }
  }

  const handleDonationAction = async (donationId, status) => {
    try {
      const res = await fetch(`/api/donations/${donationId}/verify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reviewedBy: currentUser.id })
      })
      if (res.ok) fetchCampaignData()
    } catch (err) {
      alert('Action failed')
    }
  }

  // Edit form handlers
  const handleEditChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }))
  }

  const generateNewImage = async () => {
    setGeneratingImage(true)
    setGenerationProgress(10)
    
    try {
      const prompt = `Create a professional, artistic digital illustration for a volunteer campaign. 
      Campaign: ${editForm.title}
      Wing: ${editForm.wing}
      Location: ${editForm.location}
      Description: ${editForm.description}
      
      Style: Digital art, illustration, cartoon style, warm and inspiring, showing diverse humans working together without showing faces, nature elements, collaboration theme. Professional, clean, colorful, modern design. No people faces, focus on human silhouettes or hands working together.`

      setGenerationProgress(20)

      const response = await fetch('/api/openrouter/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      })

      setGenerationProgress(50)

      if (!response.ok) {
        const error = await response.json()
        alert(`Failed to generate image: ${error.error || 'Unknown error'}`)
        setGeneratingImage(false)
        return
      }

      const data = await response.json()
      setGenerationProgress(80)

      if (data.imageUrl) {
        setEditForm(prev => ({ ...prev, image: data.imageUrl }))
        setGenerationProgress(100)
        setTimeout(() => {
          setGeneratingImage(false)
          setGenerationProgress(0)
        }, 500)
      } else {
        alert('Failed to generate image')
        setGeneratingImage(false)
      }
    } catch (err) {
      alert(`Error: ${err.message}`)
      setGeneratingImage(false)
    }
  }

  const handleSaveCampaign = async () => {
    if (saving) return
    setSaving(true)
    try {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editForm.title,
          wing: editForm.wing,
          description: editForm.description,
          location: editForm.location,
          date: editForm.date,
          budget: parseFloat(editForm.budget) || 0,
          volunteersNeeded: parseInt(editForm.volunteersNeeded) || 10,
          image: editForm.image,
          programHours: parseInt(editForm.programHours) || 0,
          programRespect: parseInt(editForm.programRespect) || 0
        })
      })
      if (!res.ok) throw new Error('Update failed')
      alert('Campaign updated successfully!')
      fetchCampaignData()
    } catch (err) {
      alert('Failed to update campaign. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCampaign = async () => {
    if (!confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) return
    try {
      const res = await fetch(`/api/campaigns/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      alert('Campaign deleted successfully')
      navigate('/volunteer/campaigns')
    } catch (err) {
      alert('Failed to delete campaign')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Campaign not found</h2>
          <Link to="/volunteer/campaigns" className="mt-4 text-indigo-600 hover:underline">Back to campaigns</Link>
        </div>
      </div>
    )
  }

  // Calculate available balance: total raised - total expenses
  const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)
  const amountLeft = (campaign?.raised || 0) - totalExpenses
  const progress = campaign.goal > 0 ? Math.min((campaign.raised / campaign.goal) * 100, 100) : 0

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'edit', label: 'Edit', icon: '✏️' },
    { id: 'funds', label: 'Funds', icon: '💰' },
    { id: 'transactions', label: 'Transactions', icon: '📜' },
    { id: 'expenses', label: 'Expenses', icon: '🧾' },
    { id: 'donations', label: 'Donations', icon: '🤲', badge: pendingDonations.length },
    { id: 'volunteers', label: 'Volunteers', icon: '👥' }
  ]

  return (
    <div className="pb-20">
      <main className="max-w-4xl mx-auto px-4 py-4">
        {/* Horizontal Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-4 overflow-x-auto">
          <div className="flex border-b">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
                {tab.badge > 0 && (
                  <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{tab.badge}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-xl shadow-sm p-5">
              
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900 border-b pb-3">Campaign Overview</h2>
                  
                  {/* Stats Grid - Plain Style */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="border rounded-lg p-4">
                      <p className="text-sm text-gray-500">Goal</p>
                      <p className="text-xl font-bold text-gray-900">৳{campaign.goal?.toLocaleString()}</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <p className="text-sm text-gray-500">Raised</p>
                      <p className="text-xl font-bold text-green-600">৳{campaign.raised?.toLocaleString()}</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <p className="text-sm text-gray-500">Available</p>
                      <p className="text-xl font-bold text-indigo-600">৳{amountLeft?.toLocaleString()}</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <p className="text-sm text-gray-500">Spent</p>
                      <p className="text-xl font-bold text-red-600">৳{(fundSummary?.total_expenses || 0).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Fundraising Progress</span>
                      <span className="font-medium">{progress.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 transition-all"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Campaign Info */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Campaign Details</h4>
                      <dl className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Location</dt>
                          <dd className="text-gray-900">{campaign.location || 'Not specified'}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Date</dt>
                          <dd className="text-gray-900">{campaign.event_date || campaign.date || 'Not specified'}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Budget</dt>
                          <dd className="text-gray-900">৳{campaign.budget?.toLocaleString()}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Volunteers</dt>
                          <dd className="text-gray-900">{volunteers.length} / {campaign.volunteers_needed}</dd>
                        </div>
                      </dl>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Fund Summary</h4>
                      <dl className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Total Inflow</dt>
                          <dd className="text-green-600">+৳{(fundSummary?.total_in || 0).toLocaleString()}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Total Outflow</dt>
                          <dd className="text-red-600">-৳{(fundSummary?.total_out || 0).toLocaleString()}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Pending Expenses</dt>
                          <dd className="text-amber-600">৳{(fundSummary?.pending_expenses || 0).toLocaleString()}</dd>
                        </div>
                        <div className="flex justify-between font-medium border-t pt-2 mt-2">
                          <dt className="text-gray-700">Current Balance</dt>
                          <dd className="text-indigo-600">৳{amountLeft?.toLocaleString()}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>
              )}

              {/* Edit Tab */}
              {activeTab === 'edit' && (
                <div className="space-y-5">
                  {/* Campaign Image */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-2">Campaign Image</label>
                    <div className="relative w-full aspect-[21/9] bg-center bg-no-repeat bg-cover rounded-xl overflow-hidden bg-gray-100 mb-3" 
                      style={editForm.image ? { backgroundImage: `url('${editForm.image}')` } : {}}>
                      {!editForm.image && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                          <span className="text-4xl text-gray-400">🖼️</span>
                        </div>
                      )}
                    </div>
                    {generatingImage && (
                      <div className="mb-3 space-y-2">
                        <p className="text-xs text-indigo-600 font-semibold">Generating image with AI...</p>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div className="bg-indigo-600 h-full transition-all" style={{ width: `${generationProgress}%` }}></div>
                        </div>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={generateNewImage}
                      disabled={generatingImage}
                      className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm font-medium text-indigo-600 hover:bg-gray-50 disabled:opacity-50"
                    >
                      {generatingImage ? 'Generating...' : '🔄 Regenerate Image'}
                    </button>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Campaign Title *</label>
                    <input
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      value={editForm.title}
                      onChange={e => handleEditChange('title', e.target.value)}
                      required
                    />
                  </div>

                  {/* Wing */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Wing *</label>
                    <select
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      value={editForm.wing}
                      onChange={e => handleEditChange('wing', e.target.value)}
                    >
                      <option value="">Select Wing</option>
                      <option value="Health">Health</option>
                      <option value="Education">Education</option>
                      <option value="Relief">Relief</option>
                      <option value="Operations">Operations</option>
                      <option value="Media">Media</option>
                    </select>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Description *</label>
                    <textarea
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      rows={4}
                      value={editForm.description}
                      onChange={e => handleEditChange('description', e.target.value)}
                    />
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Location *</label>
                    <input
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      value={editForm.location}
                      onChange={e => handleEditChange('location', e.target.value)}
                    />
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Campaign Date</label>
                    <input
                      type="date"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      value={editForm.date}
                      onChange={e => handleEditChange('date', e.target.value)}
                    />
                  </div>

                  {/* Budget & Volunteers */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Budget (৳)</label>
                      <input
                        type="number"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        value={editForm.budget}
                        onChange={e => handleEditChange('budget', e.target.value)}
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Volunteers Needed</label>
                      <input
                        type="number"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        value={editForm.volunteersNeeded}
                        onChange={e => handleEditChange('volunteersNeeded', e.target.value)}
                        min="1"
                      />
                    </div>
                  </div>

                  {/* Hours & Respect */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Hours (per volunteer)</label>
                      <input
                        type="number"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        value={editForm.programHours}
                        onChange={e => handleEditChange('programHours', e.target.value)}
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Respect (per volunteer)</label>
                      <input
                        type="number"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        value={editForm.programRespect}
                        onChange={e => handleEditChange('programRespect', e.target.value)}
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={handleSaveCampaign}
                    disabled={saving}
                    className="w-full bg-indigo-600 text-white rounded-lg py-3 font-medium hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>

                  {/* Delete */}
                  <div className="border-t pt-5">
                    <p className="text-xs text-gray-500 mb-3">Danger Zone</p>
                    <button
                      onClick={handleDeleteCampaign}
                      className="w-full border-2 border-red-500 text-red-500 rounded-lg py-2.5 font-medium hover:bg-red-50"
                    >
                      🗑️ Delete Campaign
                    </button>
                  </div>
                </div>
              )}

              {/* Funds Tab */}
              {activeTab === 'funds' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900 border-b pb-3">Campaign Fund</h2>
                  
                  {/* Balance Display - Plain */}
                  <div className="text-center py-8 border rounded-lg bg-gray-50">
                    <p className="text-sm text-gray-500 mb-1">Available Balance</p>
                    <p className="text-4xl font-bold text-gray-900">৳{amountLeft?.toLocaleString()}</p>
                    <p className="text-xs text-gray-400 mt-2">Raised: ৳{(campaign?.raised || 0).toLocaleString()} − Expenses: ৳{totalExpenses.toLocaleString()}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setShowTransferModal(true)}
                      className="flex flex-col items-center gap-2 p-6 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-2xl">💸</span>
                      <span className="font-medium text-gray-700">Transfer Out</span>
                      <span className="text-sm text-gray-500">Move funds to other entities</span>
                    </button>
                    <button
                      onClick={() => setShowExpenseModal(true)}
                      className="flex flex-col items-center gap-2 p-6 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-2xl">🧾</span>
                      <span className="font-medium text-gray-700">Record Expense</span>
                      <span className="text-sm text-gray-500">Add expense with invoice</span>
                    </button>
                  </div>

                  {/* Recent Activity */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Recent Activity</h4>
                    <div className="border rounded-lg divide-y">
                      {transactions.slice(0, 5).map(t => (
                        <div key={t.id} className="flex items-center justify-between p-3">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">
                              {t.transaction_type === 'deposit' ? '📥' : t.transaction_type === 'expense' ? '📤' : '🔄'}
                            </span>
                            <div>
                              <p className="font-medium text-sm">{t.note || t.transaction_type}</p>
                              <p className="text-xs text-gray-500">
                                {t.from_name && t.to_name ? `${t.from_name} → ${t.to_name}` : new Date(t.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <span className={`font-medium ${
                            (t.to_type === 'campaign' && t.to_id === parseInt(id)) ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {(t.to_type === 'campaign' && t.to_id === parseInt(id)) ? '+' : '-'}৳{t.amount?.toLocaleString()}
                          </span>
                        </div>
                      ))}
                      {transactions.length === 0 && (
                        <p className="text-center text-gray-500 py-8">No transactions yet</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Transactions Tab */}
              {activeTab === 'transactions' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900 border-b pb-3">All Transactions</h2>
                  {transactions.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                          t.transaction_type === 'deposit' ? 'bg-green-100' :
                          t.transaction_type === 'expense' ? 'bg-red-100' : 'bg-blue-100'
                        }`}>
                          {t.transaction_type === 'deposit' ? '📥' : t.transaction_type === 'expense' ? '📤' : '🔄'}
                        </div>
                        <div>
                          <p className="font-medium">{t.note || t.transaction_type}</p>
                          <p className="text-sm text-gray-500">
                            {t.from_name || 'External'} → {t.to_name || 'Expense'}
                          </p>
                          <p className="text-xs text-gray-400">{new Date(t.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                      <span className={`text-lg font-bold ${
                        (t.to_type === 'campaign' && t.to_id === parseInt(id)) ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {(t.to_type === 'campaign' && t.to_id === parseInt(id)) ? '+' : '-'}৳{t.amount?.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  {transactions.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <span className="text-4xl mb-4 block">📜</span>
                      <p>No transactions recorded yet</p>
                    </div>
                  )}
                </div>
              )}

              {/* Expenses Tab */}
              {activeTab === 'expenses' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b pb-3">
                    <h2 className="text-lg font-semibold text-gray-900">Campaign Expenses</h2>
                    <button
                      onClick={() => setShowExpenseModal(true)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                    >
                      + Add Expense
                    </button>
                  </div>
                  
                  {expenses.map(exp => (
                    <div key={exp.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex gap-4">
                          {exp.invoice_image && (
                            <img 
                              src={exp.invoice_image} 
                              alt="Invoice"
                              className="w-16 h-16 object-cover rounded-lg cursor-pointer border"
                              onClick={() => window.open(exp.invoice_image, '_blank')}
                            />
                          )}
                          <div>
                            <h4 className="font-medium">{exp.title}</h4>
                            <p className="text-sm text-gray-600">{exp.description}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {exp.category} • {new Date(exp.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <p className="text-lg font-bold text-red-600">-৳{exp.amount?.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                  {expenses.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <span className="text-4xl mb-4 block">🧾</span>
                      <p>No expenses recorded yet</p>
                    </div>
                  )}
                </div>
              )}

              {/* Donations Tab */}
              {activeTab === 'donations' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900 border-b pb-3">Pending Donation Approvals</h2>
                  
                  {pendingDonations.map(d => (
                    <div key={d.id} className="border border-amber-200 bg-amber-50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium">{d.is_anonymous ? 'Anonymous Donor' : d.donor_name}</h4>
                          <p className="text-sm text-gray-600">{d.phone_number}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {d.payment_method} • TxID: {d.transaction_id}
                          </p>
                        </div>
                        <p className="text-xl font-bold text-green-600">৳{d.amount?.toLocaleString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDonationAction(d.id, 'approved')}
                          className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => handleDonationAction(d.id, 'rejected')}
                          className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium"
                        >
                          ✕ Reject
                        </button>
                      </div>
                    </div>
                  ))}
                  {pendingDonations.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <span className="text-4xl mb-4 block">✓</span>
                      <p>No pending donations</p>
                    </div>
                  )}
                </div>
              )}

              {/* Volunteers Tab */}
              {activeTab === 'volunteers' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900 border-b pb-3">Campaign Volunteers ({volunteers.length})</h2>
                  <div className="space-y-2">
                    {volunteers.map(v => (
                      <div key={v.id} className="flex items-center gap-4 p-3 border rounded-lg">
                        <img 
                          src={v.avatar || '/default-avatar.png'} 
                          alt={v.full_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium">{v.full_name}</h4>
                          <p className="text-sm text-gray-500">{v.role || 'Volunteer'}</p>
                        </div>
                        <Link 
                          to={`/volunteer/profile/${v.id}`}
                          className="px-3 py-1 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg"
                        >
                          View
                        </Link>
                      </div>
                    ))}
                    {volunteers.length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <span className="text-4xl mb-4 block">👥</span>
                        <p>No volunteers assigned yet</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
      </main>

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold">Transfer Funds</h3>
                <button onClick={() => setShowTransferModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                  <div className="p-3 bg-gray-100 rounded-lg text-gray-700">{campaign.title}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Type</label>
                  <select
                    value={transferForm.toType}
                    onChange={(e) => setTransferForm(prev => ({ ...prev, toType: e.target.value, toId: '' }))}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select destination type</option>
                    <option value="central">UYHO Central Fund</option>
                    <option value="wing">Wing</option>
                    <option value="campaign">Campaign</option>
                    <option value="direct_aid">Direct Aid</option>
                  </select>
                </div>

                {transferForm.toType && transferForm.toType !== 'central' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select {transferForm.toType}</label>
                    <select
                      value={transferForm.toId}
                      onChange={(e) => setTransferForm(prev => ({ ...prev, toId: e.target.value }))}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Select...</option>
                      {transferForm.toType === 'wing' && transferTargets.wings.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                      {transferForm.toType === 'campaign' && transferTargets.campaigns.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                      {transferForm.toType === 'direct_aid' && transferTargets.directAids.map(d => (
                        <option key={d.id} value={d.id}>{d.title}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (৳)</label>
                  <input
                    type="number"
                    value={transferForm.amount}
                    onChange={(e) => setTransferForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter amount"
                  />
                  <p className="text-sm text-gray-500 mt-1">Available: ৳{amountLeft?.toLocaleString()}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
                  <textarea
                    value={transferForm.note}
                    onChange={(e) => setTransferForm(prev => ({ ...prev, note: e.target.value }))}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    rows={2}
                    placeholder="Reason for transfer..."
                  />
                </div>

                <button
                  onClick={handleTransfer}
                  disabled={!transferForm.amount || (!transferForm.toId && transferForm.toType !== 'central')}
                  className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Transfer ৳{transferForm.amount || 0}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold">Add Expense</h3>
                <button onClick={() => setShowExpenseModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={expenseForm.title}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="What was this expense for?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    rows={2}
                    placeholder="Details about this expense..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (৳) *</label>
                  <input
                    type="number"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter amount"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="General">General</option>
                    <option value="Food">Food & Refreshments</option>
                    <option value="Transport">Transportation</option>
                    <option value="Supplies">Supplies & Materials</option>
                    <option value="Venue">Venue & Rent</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Marketing">Marketing & Promotion</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Image</label>
                  {expenseForm.invoiceImage ? (
                    <div className="relative">
                      <img 
                        src={expenseForm.invoiceImage} 
                        alt="Invoice"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => setExpenseForm(prev => ({ ...prev, invoiceImage: '' }))}
                        className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <label className="block w-full p-6 border-2 border-dashed rounded-lg cursor-pointer hover:border-indigo-400 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleInvoiceUpload}
                        className="hidden"
                      />
                      {uploadingInvoice ? (
                        <span className="text-gray-500">Uploading...</span>
                      ) : (
                        <span className="text-gray-500">📷 Upload invoice/receipt image</span>
                      )}
                    </label>
                  )}
                </div>

                <button
                  onClick={handleAddExpense}
                  disabled={!expenseForm.title || !expenseForm.amount}
                  className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Expense
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
