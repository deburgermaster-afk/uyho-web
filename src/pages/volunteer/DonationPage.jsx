import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import VolunteerFooter from '../../components/VolunteerFooter';

export default function DonationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('projects');
  const [campaigns, setCampaigns] = useState([]);
  const [directAids, setDirectAids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [selectedDirectAid, setSelectedDirectAid] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCampaigns, setFilteredCampaigns] = useState([]);
  const [filteredDirectAids, setFilteredDirectAids] = useState([]);
  const [donationStep, setDonationStep] = useState(1); // 1: select campaign, 2: donation form
  const [donationType, setDonationType] = useState('campaign'); // 'campaign' or 'directaid'
  const [donationForm, setDonationForm] = useState({
    donorName: '',
    isAnonymous: false,
    phoneNumber: '',
    amount: '',
    paymentMethod: '', // 'bkash' or 'nagad'
    transactionId: ''
  });

  // New states for My Donations and Refer features
  const [showReferPopup, setShowReferPopup] = useState(false);
  const [referSearchQuery, setReferSearchQuery] = useState('');
  const [referSelectedItem, setReferSelectedItem] = useState(null);
  const [referType, setReferType] = useState('campaign');
  const [donationStats, setDonationStats] = useState(null);
  const [myTransactions, setMyTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  const volunteerId = localStorage.getItem('volunteerId');
  const donationSuggestions = [500, 1000, 2000, 5000, 10000];

  useEffect(() => {
    fetchActiveCampaigns();
    fetchDirectAids();
  }, []);

  // Fetch My Donations data when tab changes
  useEffect(() => {
    if (activeTab === 'mydonations' && volunteerId) {
      fetchDonationStats();
      fetchMyTransactions();
    }
  }, [activeTab, volunteerId]);

  // Auto-select campaign from URL parameter
  useEffect(() => {
    const campaignId = searchParams.get('campaign');
    if (campaignId && campaigns.length > 0) {
      const campaign = campaigns.find(c => String(c.id) === campaignId);
      if (campaign) {
        setSelectedCampaign(campaign);
        setDonationType('campaign');
        setDonationStep(2);
      }
    }
  }, [searchParams, campaigns]);

  const fetchActiveCampaigns = async () => {
    try {
      const res = await fetch('/api/campaigns?status=active');
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data);
      }
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDirectAids = async () => {
    try {
      const res = await fetch('/api/direct-aids?status=active');
      if (res.ok) {
        const data = await res.json();
        setDirectAids(data);
      }
    } catch (err) {
      console.error('Failed to fetch direct aids:', err);
    }
  };

  const fetchDonationStats = async () => {
    try {
      const res = await fetch(`/api/volunteers/${volunteerId}/donation-stats`);
      if (res.ok) {
        const data = await res.json();
        setDonationStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch donation stats:', err);
    }
  };

  const fetchMyTransactions = async () => {
    setTransactionsLoading(true);
    try {
      const res = await fetch(`/api/volunteers/${volunteerId}/donations?type=all`);
      if (res.ok) {
        const data = await res.json();
        // Handle both array response and object with donations property
        setMyTransactions(Array.isArray(data) ? data : (data.donations || []));
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const handleCampaignSelect = (campaign) => {
    setSelectedCampaign(campaign);
    setSelectedDirectAid(null);
    setDonationType('campaign');
    setDonationStep(2);
  };

  const handleDirectAidSelect = (aid) => {
    setSelectedDirectAid(aid);
    setSelectedCampaign(null);
    setDonationType('directaid');
    setDonationStep(2);
  };

  const handleDonationSubmit = async () => {
    const target = donationType === 'campaign' ? selectedCampaign : selectedDirectAid;
    if (!target || !donationForm.amount || !donationForm.paymentMethod || !donationForm.transactionId) {
      alert('Please fill in all required fields');
      return;
    }

    if (!donationForm.isAnonymous && !donationForm.donorName.trim()) {
      alert('Please enter your name or choose anonymous donation');
      return;
    }

    try {
      let res;
      if (donationType === 'campaign') {
        res = await fetch('/api/donations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            campaignId: selectedCampaign.id,
            donorName: donationForm.isAnonymous ? 'Anonymous' : donationForm.donorName,
            phoneNumber: donationForm.phoneNumber,
            amount: parseFloat(donationForm.amount),
            paymentMethod: donationForm.paymentMethod,
            transactionId: donationForm.transactionId,
            isAnonymous: donationForm.isAnonymous,
            volunteerId: volunteerId ? parseInt(volunteerId) : null
          })
        });
      } else {
        res = await fetch(`/api/direct-aids/${selectedDirectAid.id}/donate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            donorName: donationForm.isAnonymous ? 'Anonymous' : donationForm.donorName,
            phoneNumber: donationForm.phoneNumber,
            amount: parseFloat(donationForm.amount),
            paymentMethod: donationForm.paymentMethod,
            transactionId: donationForm.transactionId,
            isAnonymous: donationForm.isAnonymous,
            volunteerId: volunteerId ? parseInt(volunteerId) : null
          })
        });
      }

      if (res.ok) {
        alert(`Thank you for your donation! It will be verified and added to the ${donationType === 'campaign' ? 'campaign' : 'direct aid fund'}.`);
        // Reset form
        setSelectedCampaign(null);
        setSelectedDirectAid(null);
        setDonationStep(1);
        setDonationForm({
          donorName: '',
          isAnonymous: false,
          phoneNumber: '',
          amount: '',
          paymentMethod: '',
          transactionId: ''
        });
        // Refresh direct aids to show updated data
        if (donationType === 'directaid') {
          fetchDirectAids();
        }
      } else {
        throw new Error('Failed to submit donation');
      }
    } catch (err) {
      console.error('Failed to submit donation:', err);
      alert('Failed to submit donation. Please try again.');
    }
  };

  // Generate referral link
  const generateReferralLink = (item, type) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/donate/${type}/${item.id}?ref=${volunteerId}`;
  };

  // Handle share
  const handleShare = async (item, type, platform) => {
    const link = generateReferralLink(item, type);
    const text = `Support "${item.title}" - ${type === 'campaign' ? 'Campaign' : 'Direct Aid'} by UYHO`;
    
    if (platform === 'copy') {
      await navigator.clipboard.writeText(link);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    } else if (platform === 'chat') {
      // Navigate to chat with the link
      navigate(`/volunteer/chat?share=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`);
      setShowReferPopup(false);
    } else if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + '\n' + link)}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`, '_blank');
    } else if (platform === 'native' && navigator.share) {
      try {
        await navigator.share({ title: text, url: link });
      } catch (err) {
        console.log('Share cancelled');
      }
    }
  };

  // Filter items for refer popup
  const filteredReferItems = referType === 'campaign' 
    ? campaigns.filter(c => c.title?.toLowerCase().includes(referSearchQuery.toLowerCase()))
    : directAids.filter(d => d.title?.toLowerCase().includes(referSearchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Sub Menu - Only show in step 1 */}
      {donationStep === 1 && (
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="flex overflow-x-auto no-scrollbar">
            {[
              { key: 'projects', label: 'Projects', icon: 'campaign' },
              { key: 'directaid', label: 'Direct Aid', icon: 'volunteer_activism' },
              { key: 'mydonations', label: 'My Donations', icon: 'receipt_long' },
              { key: 'distribution', label: 'Distribution', icon: 'local_shipping' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 min-w-fit py-3 px-3 text-xs font-semibold transition-all relative flex items-center justify-center gap-1 ${
                  activeTab === tab.key 
                    ? 'text-primary' 
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                {tab.label}
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-6 pb-24">
        {donationStep === 1 ? (
          // Step 1: Select Campaign/Project or View My Donations
          <div className="space-y-6">
            {/* My Donations Tab */}
            {activeTab === 'mydonations' && (
              <div className="space-y-4">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 text-white">
                    <p className="text-xs opacity-80 font-medium">This Month</p>
                    <p className="text-2xl font-bold mt-1">৳{(donationStats?.donatedThisMonth || 0).toLocaleString()}</p>
                    <p className="text-[10px] opacity-70 mt-1">Donated</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 text-white">
                    <p className="text-xs opacity-80 font-medium">All Time</p>
                    <p className="text-2xl font-bold mt-1">৳{(donationStats?.donatedAllTime || 0).toLocaleString()}</p>
                    <p className="text-[10px] opacity-70 mt-1">Donated</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-4 text-white">
                    <p className="text-xs opacity-80 font-medium">Collected This Month</p>
                    <p className="text-2xl font-bold mt-1">৳{(donationStats?.collectedThisMonth || 0).toLocaleString()}</p>
                    <p className="text-[10px] opacity-70 mt-1">Via Referrals</p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-4 text-white">
                    <p className="text-xs opacity-80 font-medium">Total Collected</p>
                    <p className="text-2xl font-bold mt-1">৳{(donationStats?.totalCollected || 0).toLocaleString()}</p>
                    <p className="text-[10px] opacity-70 mt-1">Via Referrals</p>
                  </div>
                </div>

                {/* Transactions List */}
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white mb-3">Transaction History</h3>
                  {transactionsLoading ? (
                    <div className="text-center py-8">
                      <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
                    </div>
                  ) : myTransactions.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <span className="material-symbols-outlined text-4xl text-slate-300">receipt_long</span>
                      <p className="text-sm text-slate-500 mt-2">No transactions yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {myTransactions.map((tx) => (
                        <div key={tx.id} className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-3">
                            <div className={`size-10 rounded-full flex items-center justify-center ${
                              tx.transactionType === 'donated' 
                                ? 'bg-green-100 dark:bg-green-900/30' 
                                : 'bg-purple-100 dark:bg-purple-900/30'
                            }`}>
                              <span className={`material-symbols-outlined text-lg ${
                                tx.transactionType === 'donated' ? 'text-green-600' : 'text-purple-600'
                              }`}>
                                {tx.transactionType === 'donated' ? 'arrow_upward' : 'arrow_downward'}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate">
                                {tx.campaign_title || tx.direct_aid_title || 'Donation'}
                              </p>
                              <p className="text-xs text-slate-500">
                                {tx.transactionType === 'donated' ? 'You donated' : `Collected from ${tx.donor_name}`}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className={`font-bold ${
                                tx.transactionType === 'donated' ? 'text-green-600' : 'text-purple-600'
                              }`}>
                                {tx.transactionType === 'donated' ? '-' : '+'}৳{tx.amount?.toLocaleString()}
                              </p>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                tx.status === 'verified' || tx.status === 'approved'
                                  ? 'bg-green-100 text-green-700'
                                  : tx.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {tx.status?.toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-2">
                            {new Date(tx.created_at).toLocaleDateString('en-US', { 
                              day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'projects' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-bold">Active Campaigns</h2>
                  <button
                    onClick={() => setShowReferPopup(true)}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">share</span>
                    Refer & Earn
                  </button>
                </div>
                <p className="text-sm text-gray-500 mb-4">Choose one project to support</p>
                
                {/* Search Bar */}
                <div className="relative mb-4">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      const filtered = campaigns.filter(campaign => 
                        campaign.title.toLowerCase().includes(e.target.value.toLowerCase()) ||
                        campaign.location?.toLowerCase().includes(e.target.value.toLowerCase())
                      );
                      setFilteredCampaigns(filtered);
                    }}
                    placeholder="Search campaigns..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                
                {loading ? (
                  <div className="text-center py-8">
                    <span className="material-symbols-outlined animate-spin text-3xl text-gray-400">progress_activity</span>
                    <p className="text-gray-500 mt-2">Loading campaigns...</p>
                  </div>
                ) : (searchQuery ? filteredCampaigns : campaigns).length === 0 ? (
                  <div className="text-center py-8">
                    <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-600">campaign</span>
                    <p className="text-gray-500 mt-2">{searchQuery ? 'No campaigns found matching your search' : 'No active campaigns at the moment'}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(searchQuery ? filteredCampaigns : campaigns).map(campaign => (
                      <button
                        key={campaign.id}
                        onClick={() => handleCampaignSelect(campaign)}
                        className="w-full text-left bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-primary hover:bg-primary/5 transition-all"
                      >
                        <div className="flex gap-3">
                          <div className="size-16 rounded-lg bg-gray-200 dark:bg-gray-700 overflow-hidden shrink-0">
                            {campaign.image ? (
                              <img src={campaign.image} alt={campaign.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-gray-400">campaign</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-base mb-1 line-clamp-2">{campaign.title}</h3>
                            <p className="text-xs text-gray-500 mb-2">{campaign.location}</p>
                            <div className="flex items-center gap-3 text-[11px]">
                              <span className="text-green-600 font-bold">৳{campaign.raised || 0}</span>
                              <span className="text-gray-400">of ৳{campaign.budget || campaign.goal}</span>
                              <span className="text-gray-400">• {campaign.days_left || 30}d left</span>
                            </div>
                            <div className="mt-2 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                              <div 
                                className="bg-primary h-1.5 rounded-full transition-all"
                                style={{ width: `${Math.min(((campaign.raised || 0) / (campaign.budget || campaign.goal || 1)) * 100, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'directaid' && (
              <div>
                <h2 className="text-lg font-bold mb-2">Direct Aid</h2>
                <p className="text-sm text-gray-500 mb-4">Help individuals in need directly</p>
                
                {/* Search Bar */}
                <div className="relative mb-4">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      const filtered = directAids.filter(aid => 
                        aid.title.toLowerCase().includes(e.target.value.toLowerCase()) ||
                        aid.beneficiary_name?.toLowerCase().includes(e.target.value.toLowerCase())
                      );
                      setFilteredDirectAids(filtered);
                    }}
                    placeholder="Search direct aids..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                
                {loading ? (
                  <div className="text-center py-8">
                    <span className="material-symbols-outlined animate-spin text-3xl text-gray-400">progress_activity</span>
                    <p className="text-gray-500 mt-2">Loading direct aids...</p>
                  </div>
                ) : (searchQuery ? filteredDirectAids : directAids).length === 0 ? (
                  <div className="text-center py-8">
                    <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-600">volunteer_activism</span>
                    <p className="text-gray-500 mt-2">{searchQuery ? 'No direct aids found matching your search' : 'No active direct aids at the moment'}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(searchQuery ? filteredDirectAids : directAids).map(aid => {
                      const progress = Math.min(((aid.raised_amount || 0) / (aid.goal_amount || 1)) * 100, 100);
                      return (
                        <div
                          key={aid.id}
                          className="w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-primary transition-all"
                        >
                          <div className="flex gap-3">
                            {/* Profile Image */}
                            <div className="size-14 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden shrink-0 border-2 border-primary/30">
                              <img 
                                src={aid.image || aid.beneficiary_avatar || '/avatars/avatar_1.svg'} 
                                alt={aid.title} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-base mb-1 line-clamp-1">{aid.title}</h3>
                              <p className="text-xs text-gray-500 mb-2 line-clamp-2">{aid.description}</p>
                              
                              {/* Progress info */}
                              <div className="flex items-center justify-between text-[11px] mb-1">
                                <span className="text-green-600 font-bold">৳{(aid.raised_amount || 0).toLocaleString()}</span>
                                <span className="text-gray-400">of ৳{(aid.goal_amount || 0).toLocaleString()}</span>
                              </div>
                              
                              {/* Progress bar */}
                              <div className="bg-gray-100 dark:bg-gray-700 rounded-full h-2 mb-3">
                                <div 
                                  className="bg-gradient-to-r from-primary to-green-500 h-2 rounded-full transition-all"
                                  style={{ width: `${progress}%` }}
                                ></div>
                              </div>
                              
                              {/* Action Buttons */}
                              <div className="flex gap-2">
                                <button
                                  onClick={() => navigate(`/volunteer/direct-aid/${aid.id}`)}
                                  className="flex-1 py-2 text-xs font-medium text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                >
                                  View Details
                                </button>
                                <button
                                  onClick={() => handleDirectAidSelect(aid)}
                                  className="flex-1 py-2 text-xs font-bold text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-1"
                                >
                                  <span className="material-symbols-outlined text-sm">volunteer_activism</span>
                                  Donate
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'distribution' && (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-600">local_shipping</span>
                <p className="text-gray-500 mt-2">Distribution feature coming soon...</p>
              </div>
            )}
          </div>
        ) : (
          // Step 2: Donation Form
          <div className="space-y-6">
            {/* Back Button */}
            <button
              onClick={() => {
                setDonationStep(1);
                setSelectedCampaign(null);
                setSelectedDirectAid(null);
              }}
              className="flex items-center gap-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              <span className="text-sm font-medium">Back</span>
            </button>

            {/* Target Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="font-bold text-sm mb-2">Donating to:</h3>
              {donationType === 'campaign' ? (
                <div className="flex gap-3">
                  <div className="size-12 rounded-lg bg-gray-200 dark:bg-gray-700 overflow-hidden shrink-0">
                    {selectedCampaign?.image ? (
                      <img src={selectedCampaign.image} alt={selectedCampaign.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-gray-400">campaign</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm line-clamp-1">{selectedCampaign?.title}</p>
                    <p className="text-xs text-gray-500">{selectedCampaign?.location}</p>
                    <p className="text-xs text-green-600 font-bold mt-1">৳{selectedCampaign?.raised || 0} raised</p>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <div className="size-12 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden shrink-0 border-2 border-primary/30">
                    <img 
                      src={selectedDirectAid?.image || selectedDirectAid?.beneficiary_avatar || '/avatars/avatar_1.svg'} 
                      alt={selectedDirectAid?.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-white bg-purple-500 px-2 py-0.5 rounded-full">Direct Aid</span>
                    </div>
                    <p className="font-bold text-sm line-clamp-1 mt-1">{selectedDirectAid?.title}</p>
                    <p className="text-xs text-green-600 font-bold mt-1">৳{(selectedDirectAid?.raised_amount || 0).toLocaleString()} of ৳{(selectedDirectAid?.goal_amount || 0).toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Donor Information */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="font-bold text-sm mb-4">Donor Information</h3>
              
              {/* Anonymous Toggle */}
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => setDonationForm(prev => ({ ...prev, isAnonymous: !prev.isAnonymous }))}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                    donationForm.isAnonymous 
                      ? 'border-primary bg-primary/10 text-primary' 
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">
                    {donationForm.isAnonymous ? 'check_box' : 'check_box_outline_blank'}
                  </span>
                  <span className="text-sm font-medium">Anonymous Donation</span>
                </button>
              </div>

              {/* Donor Name */}
              {!donationForm.isAnonymous && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <input
                    type="text"
                    value={donationForm.donorName}
                    onChange={(e) => setDonationForm(prev => ({ ...prev, donorName: e.target.value }))}
                    placeholder="Enter your full name"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              )}

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={donationForm.phoneNumber}
                  onChange={(e) => setDonationForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  placeholder="01XXXXXXXXX"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            {/* Donation Amount */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="font-bold text-sm mb-4">Donation Amount</h3>
              
              {/* Amount Input */}
              <div className="mb-4">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">৳</span>
                  <input
                    type="number"
                    value={donationForm.amount}
                    onChange={(e) => setDonationForm(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0"
                    className="w-full pl-8 pr-3 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50 text-lg font-bold"
                  />
                </div>
              </div>

              {/* Suggestions */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Quick Amounts:</p>
                <div className="flex flex-wrap gap-2">
                  {donationSuggestions.map(amount => (
                    <button
                      key={amount}
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
            </div>

            {/* Payment Method */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="font-bold text-sm mb-4">Payment Method</h3>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { key: 'bkash', label: 'bKash', color: 'bg-pink-500', icon: '💳' },
                  { key: 'nagad', label: 'Nagad', color: 'bg-orange-500', icon: '📱' }
                ].map(method => (
                  <button
                    key={method.key}
                    onClick={() => setDonationForm(prev => ({ ...prev, paymentMethod: method.key }))}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      donationForm.paymentMethod === method.key
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                    }`}
                  >
                    <div className={`w-8 h-8 ${method.color} rounded-lg mx-auto mb-2 flex items-center justify-center text-white`}>
                      <span className="text-lg">{method.icon}</span>
                    </div>
                    <p className="text-sm font-medium">{method.label}</p>
                  </button>
                ))}
              </div>

              {/* Payment Number and Instructions */}
              {donationForm.paymentMethod && (
                <div className="mb-4">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        {donationForm.paymentMethod === 'bkash' ? 'bKash' : 'Nagad'} Number:
                      </span>
                      <button
                        onClick={() => {
                          const number = donationForm.paymentMethod === 'bkash' ? '01XXXXXXXXX' : '01YYYYYYYYY';
                          navigator.clipboard.writeText(number);
                          alert('Number copied to clipboard!');
                        }}
                        className="px-3 py-1 bg-primary text-white text-xs font-medium rounded-md hover:bg-primary/90 transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="text-lg font-bold text-primary">
                      {donationForm.paymentMethod === 'bkash' ? '01XXXXXXXXX' : '01YYYYYYYYY'}
                    </p>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                    <h4 className="font-bold text-sm text-blue-800 dark:text-blue-200 mb-2">Payment Instructions:</h4>
                    <ol className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                      <li>1. Copy the {donationForm.paymentMethod === 'bkash' ? 'bKash' : 'Nagad'} number above</li>
                      <li>2. Pay via {donationForm.paymentMethod === 'bkash' ? 'bKash personal transfer' : 'Nagad personal transfer'}</li>
                      <li>3. Copy the transaction ID from your payment (must)</li>
                      <li>4. Enter the transaction ID below and click donate</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* Transaction ID */}
              {donationForm.paymentMethod && (
                <div>
                  <label className="block text-sm font-medium mb-2">Transaction ID *</label>
                  <input
                    type="text"
                    value={donationForm.transactionId}
                    onChange={(e) => setDonationForm(prev => ({ ...prev, transactionId: e.target.value }))}
                    placeholder="Enter transaction ID from your payment"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <p className="text-xs text-red-500 mt-1">
                    * Transaction ID is required to verify your donation
                  </p>
                </div>
              )}
            </div>

            {/* Donate Button */}
            <button
              onClick={handleDonationSubmit}
              disabled={!donationForm.amount || !donationForm.paymentMethod || !donationForm.transactionId}
              className="w-full bg-primary hover:bg-primary/90 disabled:bg-gray-300 disabled:text-gray-500 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">volunteer_activism</span>
              Donate ৳{donationForm.amount || 0} Now
            </button>
          </div>
        )}
      </main>

      {/* Floating Create Button - Only on Direct Aid tab in step 1 */}
      {donationStep === 1 && activeTab === 'directaid' && (
        <button
          onClick={() => navigate('/volunteer/direct-aid/create')}
          className="fixed bottom-24 right-4 z-30 size-14 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
        >
          <span className="material-symbols-outlined text-2xl">add</span>
        </button>
      )}

      {/* Refer Popup */}
      {showReferPopup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl max-h-[85vh] flex flex-col animate-slide-up">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Refer Donation</h2>
                <button 
                  onClick={() => {
                    setShowReferPopup(false);
                    setReferSelectedItem(null);
                    setReferSearchQuery('');
                  }}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Share donation links and earn points when someone donates via your referral
              </p>
            </div>

            {!referSelectedItem ? (
              <>
                {/* Type Tabs */}
                <div className="flex border-b border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => setReferType('campaign')}
                    className={`flex-1 py-3 text-sm font-semibold ${
                      referType === 'campaign' ? 'text-primary border-b-2 border-primary' : 'text-slate-500'
                    }`}
                  >
                    Campaigns
                  </button>
                  <button
                    onClick={() => setReferType('directaid')}
                    className={`flex-1 py-3 text-sm font-semibold ${
                      referType === 'directaid' ? 'text-primary border-b-2 border-primary' : 'text-slate-500'
                    }`}
                  >
                    Direct Aid
                  </button>
                </div>

                {/* Search */}
                <div className="p-4">
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                    <input
                      type="text"
                      value={referSearchQuery}
                      onChange={(e) => setReferSearchQuery(e.target.value)}
                      placeholder={`Search ${referType === 'campaign' ? 'campaigns' : 'direct aids'}...`}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>

                {/* Items List */}
                <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
                  {filteredReferItems.length === 0 ? (
                    <div className="text-center py-8">
                      <span className="material-symbols-outlined text-4xl text-slate-300">search_off</span>
                      <p className="text-sm text-slate-500 mt-2">No {referType === 'campaign' ? 'campaigns' : 'direct aids'} found</p>
                    </div>
                  ) : (
                    filteredReferItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setReferSelectedItem(item)}
                        className="w-full flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left"
                      >
                        <div className="size-12 rounded-lg bg-cover bg-center flex-shrink-0" style={{
                          backgroundImage: item.image ? `url('${item.image}')` : 'none',
                          backgroundColor: item.image ? 'transparent' : '#e2e8f0'
                        }}>
                          {!item.image && (
                            <div className="size-full flex items-center justify-center">
                              <span className="material-symbols-outlined text-slate-400">
                                {referType === 'campaign' ? 'campaign' : 'volunteer_activism'}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{item.title}</p>
                          <p className="text-xs text-slate-500">
                            {referType === 'campaign' ? (item.hosted_by_name || item.wing || 'Campaign') : 'Direct Aid'}
                          </p>
                        </div>
                        <span className="material-symbols-outlined text-slate-400">chevron_right</span>
                      </button>
                    ))
                  )}
                </div>
              </>
            ) : (
              /* Share Options */
              <div className="flex-1 overflow-y-auto p-4">
                {/* Selected Item Preview */}
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="size-14 rounded-lg bg-cover bg-center flex-shrink-0" style={{
                      backgroundImage: referSelectedItem.image ? `url('${referSelectedItem.image}')` : 'none',
                      backgroundColor: referSelectedItem.image ? 'transparent' : '#e2e8f0'
                    }}>
                      {!referSelectedItem.image && (
                        <div className="size-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-slate-400">
                            {referType === 'campaign' ? 'campaign' : 'volunteer_activism'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold">{referSelectedItem.title}</p>
                      <p className="text-xs text-slate-500">{referType === 'campaign' ? 'Campaign' : 'Direct Aid'}</p>
                    </div>
                  </div>
                </div>

                {/* Referral Link */}
                <div className="mb-4">
                  <label className="text-xs font-medium text-slate-500 mb-2 block">Your Referral Link</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generateReferralLink(referSelectedItem, referType)}
                      className="flex-1 px-3 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-mono truncate"
                    />
                    <button
                      onClick={() => handleShare(referSelectedItem, referType, 'copy')}
                      className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                        shareSuccess 
                          ? 'bg-green-500 text-white' 
                          : 'bg-primary text-white hover:bg-primary/90'
                      }`}
                    >
                      {shareSuccess ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                {/* Share Options */}
                <div className="space-y-3">
                  <p className="text-xs font-medium text-slate-500">Share via</p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleShare(referSelectedItem, referType, 'chat')}
                      className="flex items-center gap-3 p-3 bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors"
                    >
                      <div className="size-10 bg-primary rounded-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-white">chat</span>
                      </div>
                      <span className="font-medium text-sm">UYHO Chat</span>
                    </button>

                    <button
                      onClick={() => handleShare(referSelectedItem, referType, 'whatsapp')}
                      className="flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-xl transition-colors"
                    >
                      <div className="size-10 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-lg">📱</span>
                      </div>
                      <span className="font-medium text-sm">WhatsApp</span>
                    </button>

                    <button
                      onClick={() => handleShare(referSelectedItem, referType, 'facebook')}
                      className="flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                    >
                      <div className="size-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-lg">f</span>
                      </div>
                      <span className="font-medium text-sm">Facebook</span>
                    </button>

                    {navigator.share && (
                      <button
                        onClick={() => handleShare(referSelectedItem, referType, 'native')}
                        className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
                      >
                        <div className="size-10 bg-slate-600 rounded-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-white">share</span>
                        </div>
                        <span className="font-medium text-sm">More Apps</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="mt-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                  <div className="flex gap-3">
                    <span className="material-symbols-outlined text-amber-600">info</span>
                    <div>
                      <p className="font-medium text-sm text-amber-800 dark:text-amber-200">Earn Points!</p>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                        You'll earn 1 point for every ৳100 donated through your referral link. Points count towards leaderboard ranking!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Back Button */}
                <button
                  onClick={() => setReferSelectedItem(null)}
                  className="w-full mt-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  ← Select Different Item
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <VolunteerFooter />
    </div>
  );
}