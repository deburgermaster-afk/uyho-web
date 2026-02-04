import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import VolunteerFooter from '../../components/VolunteerFooter'
import VolunteerHeader from '../../components/VolunteerHeader'

export default function UmmahFundPage() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [centralFund, setCentralFund] = useState(null)
  const [allFunds, setAllFunds] = useState([])
  const [transactions, setTransactions] = useState([])
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [transferForm, setTransferForm] = useState({ toType: '', toId: '', amount: '', note: '' })
  const [transferTargets, setTransferTargets] = useState({ wings: [], campaigns: [], directAids: [] })
  
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')

  useEffect(() => {
    fetchData()
    fetchTransferTargets()
  }, [])

  const fetchData = async () => {
    try {
      const [centralRes, fundsRes, transRes] = await Promise.all([
        fetch('/api/ummah-funds/central'),
        fetch('/api/ummah-funds'),
        fetch('/api/ummah-funds/central/0/transactions')
      ])
      
      if (centralRes.ok) setCentralFund(await centralRes.json())
      if (fundsRes.ok) setAllFunds(await fundsRes.json())
      if (transRes.ok) setTransactions(await transRes.json())
    } catch (err) {
      console.error('Failed to fetch fund data:', err)
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
        campaigns: campaigns.filter(c => c.id),
        directAids: directAids.filter(d => d.id)
      })
    } catch (err) {
      console.error('Failed to fetch transfer targets:', err)
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
          fromType: 'central',
          fromId: 0,
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
        fetchData()
        alert('Transfer completed!')
      } else {
        const err = await res.json()
        alert(err.error || 'Transfer failed')
      }
    } catch (err) {
      alert('Transfer failed')
    }
  }

  // Calculate totals
  const wingFunds = allFunds.filter(f => f.entity_type === 'wing')
  const campaignFunds = allFunds.filter(f => f.entity_type === 'campaign')
  const directAidFunds = allFunds.filter(f => f.entity_type === 'direct_aid')
  
  const totalWingBalance = wingFunds.reduce((acc, f) => acc + (f.balance || 0), 0)
  const totalCampaignBalance = campaignFunds.reduce((acc, f) => acc + (f.balance || 0), 0)
  const totalDirectAidBalance = directAidFunds.reduce((acc, f) => acc + (f.balance || 0), 0)
  const totalBalance = (centralFund?.balance || 0) + totalWingBalance + totalCampaignBalance + totalDirectAidBalance

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <VolunteerHeader />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
        <VolunteerFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <VolunteerHeader />
      
      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl p-8 text-white mb-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
              </pattern>
              <rect width="100" height="100" fill="url(#grid)" />
            </svg>
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <span className="text-3xl">🏦</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold">Ummah Fund</h1>
                <p className="text-emerald-100 text-sm">UYHO Central Treasury</p>
              </div>
            </div>
            
            <div className="mt-6">
              <p className="text-emerald-100 text-sm mb-1">Total Organization Balance</p>
              <p className="text-5xl font-bold">৳{totalBalance.toLocaleString()}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-emerald-100 text-xs">Central Fund</p>
                <p className="text-xl font-bold">৳{(centralFund?.balance || 0).toLocaleString()}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-emerald-100 text-xs">Entity Funds</p>
                <p className="text-xl font-bold">৳{(totalWingBalance + totalCampaignBalance + totalDirectAidBalance).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setShowTransferModal(true)}
            className="flex items-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl text-sm font-medium whitespace-nowrap"
          >
            <span>💸</span> Transfer from Central
          </button>
          <Link
            to="/volunteer/donation-requests"
            className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium whitespace-nowrap"
          >
            <span>📋</span> Donation Requests
          </Link>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-6 overflow-x-auto">
          <div className="flex border-b min-w-max">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'wings', label: 'Wings', icon: '🪶', count: wingFunds.length },
              { id: 'campaigns', label: 'Campaigns', icon: '🎯', count: campaignFunds.length },
              { id: 'direct-aids', label: 'Direct Aids', icon: '🤲', count: directAidFunds.length },
              { id: 'transactions', label: 'Transactions', icon: '📜' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
                {tab.count !== undefined && (
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{tab.count}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-4 text-white">
                  <p className="text-emerald-100 text-xs mb-1">Central Fund</p>
                  <p className="text-2xl font-bold">৳{(centralFund?.balance || 0).toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-4 text-white">
                  <p className="text-blue-100 text-xs mb-1">Wings Total</p>
                  <p className="text-2xl font-bold">৳{totalWingBalance.toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-4 text-white">
                  <p className="text-purple-100 text-xs mb-1">Campaigns Total</p>
                  <p className="text-2xl font-bold">৳{totalCampaignBalance.toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-4 text-white">
                  <p className="text-amber-100 text-xs mb-1">Direct Aids Total</p>
                  <p className="text-2xl font-bold">৳{totalDirectAidBalance.toLocaleString()}</p>
                </div>
              </div>

              {/* About Section */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-bold text-lg mb-3">About Ummah Fund</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  The Ummah Fund serves as UYHO's central treasury system, managing donations and expenses 
                  across all wings, campaigns, and direct aid initiatives. Funds can be transferred between 
                  entities to support where they're needed most.
                </p>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="text-center p-3 bg-white rounded-lg">
                    <p className="text-2xl font-bold text-emerald-600">{wingFunds.length}</p>
                    <p className="text-xs text-gray-500">Wing Funds</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">{campaignFunds.length}</p>
                    <p className="text-xs text-gray-500">Campaign Funds</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <p className="text-2xl font-bold text-amber-600">{directAidFunds.length}</p>
                    <p className="text-xs text-gray-500">Direct Aid Funds</p>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h3 className="font-bold text-lg mb-4">Recent Central Fund Activity</h3>
                {transactions.slice(0, 5).map(t => (
                  <div key={t.id} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <span className={`text-xl ${
                        t.transaction_type === 'deposit' ? 'text-emerald-500' : 'text-red-500'
                      }`}>
                        {t.transaction_type === 'deposit' ? '📥' : '📤'}
                      </span>
                      <div>
                        <p className="font-medium text-sm">{t.note || t.transaction_type}</p>
                        <p className="text-xs text-gray-500">
                          {t.from_name || 'External'} → {t.to_name || 'Central Fund'}
                        </p>
                      </div>
                    </div>
                    <span className={`font-bold ${
                      t.to_type === 'central' ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {t.to_type === 'central' ? '+' : '-'}৳{t.amount?.toLocaleString()}
                    </span>
                  </div>
                ))}
                {transactions.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No transactions yet</p>
                )}
              </div>
            </div>
          )}

          {/* Wings Tab */}
          {activeTab === 'wings' && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg">Wing Ummah Funds</h3>
              {wingFunds.map(fund => (
                <Link 
                  key={fund.id} 
                  to={`/volunteer/wing/${fund.entity_id}/edit`}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <img 
                      src={fund.entity_image || '/default-wing.png'} 
                      alt={fund.entity_name}
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                    <div>
                      <h4 className="font-medium">{fund.entity_name}</h4>
                      <p className="text-sm text-gray-500">Wing Fund</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-emerald-600">৳{fund.balance?.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">In: ৳{fund.total_in?.toLocaleString()}</p>
                  </div>
                </Link>
              ))}
              {wingFunds.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <span className="text-4xl mb-4 block">🪶</span>
                  <p>No wing funds yet</p>
                </div>
              )}
            </div>
          )}

          {/* Campaigns Tab */}
          {activeTab === 'campaigns' && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg">Campaign Ummah Funds</h3>
              {campaignFunds.map(fund => (
                <Link 
                  key={fund.id} 
                  to={`/volunteer/campaigns/${fund.entity_id}/manage`}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <img 
                      src={fund.entity_image || '/placeholder.jpg'} 
                      alt={fund.entity_name}
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                    <div>
                      <h4 className="font-medium">{fund.entity_name}</h4>
                      <p className="text-sm text-gray-500">Campaign Fund</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-purple-600">৳{fund.balance?.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">In: ৳{fund.total_in?.toLocaleString()}</p>
                  </div>
                </Link>
              ))}
              {campaignFunds.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <span className="text-4xl mb-4 block">🎯</span>
                  <p>No campaign funds yet</p>
                </div>
              )}
            </div>
          )}

          {/* Direct Aids Tab */}
          {activeTab === 'direct-aids' && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg">Direct Aid Ummah Funds</h3>
              {directAidFunds.map(fund => (
                <Link 
                  key={fund.id} 
                  to={`/volunteer/direct-aid/${fund.entity_id}`}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <img 
                      src={fund.entity_image || '/placeholder.jpg'} 
                      alt={fund.entity_name}
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                    <div>
                      <h4 className="font-medium">{fund.entity_name}</h4>
                      <p className="text-sm text-gray-500">Direct Aid Fund</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-amber-600">৳{fund.balance?.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">In: ৳{fund.total_in?.toLocaleString()}</p>
                  </div>
                </Link>
              ))}
              {directAidFunds.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <span className="text-4xl mb-4 block">🤲</span>
                  <p>No direct aid funds yet</p>
                </div>
              )}
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg">All Transactions</h3>
              {transactions.map(t => (
                <div key={t.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
                      t.transaction_type === 'deposit' ? 'bg-emerald-100' :
                      t.transaction_type === 'expense' ? 'bg-red-100' : 'bg-blue-100'
                    }`}>
                      {t.transaction_type === 'deposit' ? '📥' : t.transaction_type === 'expense' ? '📤' : '🔄'}
                    </div>
                    <div>
                      <p className="font-medium">{t.note || t.transaction_type}</p>
                      <p className="text-sm text-gray-500">
                        {t.from_name || 'External'} → {t.to_name || 'Central Fund'}
                      </p>
                      <p className="text-xs text-gray-400">{new Date(t.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <span className={`text-lg font-bold ${
                    t.to_type === 'central' ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {t.to_type === 'central' ? '+' : '-'}৳{t.amount?.toLocaleString()}
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
        </div>
      </main>

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Transfer from Central Fund</h3>
                <button onClick={() => setShowTransferModal(false)} className="text-gray-400 hover:text-gray-600">
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                  <div className="p-3 bg-gray-100 rounded-lg text-gray-700">UYHO Central Fund</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Type</label>
                  <select
                    value={transferForm.toType}
                    onChange={(e) => setTransferForm(prev => ({ ...prev, toType: e.target.value, toId: '' }))}
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select destination type</option>
                    <option value="wing">Wing</option>
                    <option value="campaign">Campaign</option>
                    <option value="direct_aid">Direct Aid</option>
                  </select>
                </div>

                {transferForm.toType && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select {transferForm.toType}</label>
                    <select
                      value={transferForm.toId}
                      onChange={(e) => setTransferForm(prev => ({ ...prev, toId: e.target.value }))}
                      className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500"
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
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500"
                    placeholder="Enter amount"
                  />
                  <p className="text-sm text-gray-500 mt-1">Available: ৳{(centralFund?.balance || 0).toLocaleString()}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
                  <textarea
                    value={transferForm.note}
                    onChange={(e) => setTransferForm(prev => ({ ...prev, note: e.target.value }))}
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500"
                    rows={2}
                    placeholder="Reason for transfer..."
                  />
                </div>

                <button
                  onClick={handleTransfer}
                  disabled={!transferForm.toType || !transferForm.toId || !transferForm.amount}
                  className="w-full py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Transfer ৳{transferForm.amount || 0}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <VolunteerFooter />
    </div>
  )
}
