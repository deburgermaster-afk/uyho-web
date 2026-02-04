import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import VolunteerFooter from '../../components/VolunteerFooter';

export default function DonationRequestsPage() {
  const navigate = useNavigate();
  const [donations, setDonations] = useState([]);
  const [directAidDonations, setDirectAidDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [activeTab, setActiveTab] = useState('campaigns');

  useEffect(() => {
    fetchPendingDonations();
    fetchPendingDirectAidDonations();
  }, []);

  const fetchPendingDonations = async () => {
    try {
      const res = await fetch('/api/donations/pending');
      if (res.ok) {
        const data = await res.json();
        setDonations(data);
      }
    } catch (err) {
      console.error('Failed to fetch pending donations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingDirectAidDonations = async () => {
    try {
      const res = await fetch('/api/direct-aid-donations/pending');
      if (res.ok) {
        const data = await res.json();
        setDirectAidDonations(data);
      }
    } catch (err) {
      console.error('Failed to fetch pending direct aid donations:', err);
    }
  };

  const handleApprove = async (donationId) => {
    setProcessing(donationId);
    try {
      const res = await fetch(`/api/donations/${donationId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.ok) {
        alert('Donation approved successfully!');
        setDonations(donations.filter(d => d.id !== donationId));
      } else {
        throw new Error('Failed to approve donation');
      }
    } catch (err) {
      console.error('Failed to approve donation:', err);
      alert('Failed to approve donation. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (donationId) => {
    if (!confirm('Are you sure you want to reject this donation?')) return;
    
    setProcessing(donationId);
    try {
      const res = await fetch(`/api/donations/${donationId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.ok) {
        alert('Donation rejected.');
        setDonations(donations.filter(d => d.id !== donationId));
      } else {
        throw new Error('Failed to reject donation');
      }
    } catch (err) {
      console.error('Failed to reject donation:', err);
      alert('Failed to reject donation. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const handleApproveDirectAid = async (donationId) => {
    setProcessing(`da-${donationId}`);
    try {
      const res = await fetch(`/api/direct-aid-donations/${donationId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.ok) {
        alert('Direct aid donation approved successfully!');
        setDirectAidDonations(directAidDonations.filter(d => d.id !== donationId));
      } else {
        throw new Error('Failed to approve donation');
      }
    } catch (err) {
      console.error('Failed to approve direct aid donation:', err);
      alert('Failed to approve donation. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectDirectAid = async (donationId) => {
    if (!confirm('Are you sure you want to reject this donation?')) return;
    
    setProcessing(`da-${donationId}`);
    try {
      const res = await fetch(`/api/direct-aid-donations/${donationId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.ok) {
        alert('Direct aid donation rejected.');
        setDirectAidDonations(directAidDonations.filter(d => d.id !== donationId));
      } else {
        throw new Error('Failed to reject donation');
      }
    } catch (err) {
      console.error('Failed to reject direct aid donation:', err);
      alert('Failed to reject donation. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
          </button>
          <div className="flex-1">
            <p className="text-[10px] uppercase font-bold text-primary">Admin Panel</p>
            <h1 className="text-xl font-bold">Donation Requests</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'campaigns'
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
            }`}
          >
            <span className="material-symbols-outlined text-lg">campaign</span>
            Campaigns
            {donations.length > 0 && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'campaigns' ? 'bg-white/20' : 'bg-red-500 text-white'}`}>
                {donations.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('directaid')}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'directaid'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
            }`}
          >
            <span className="material-symbols-outlined text-lg">volunteer_activism</span>
            Direct Aid
            {directAidDonations.length > 0 && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'directaid' ? 'bg-white/20' : 'bg-red-500 text-white'}`}>
                {directAidDonations.length}
              </span>
            )}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined animate-spin text-4xl text-gray-400">progress_activity</span>
            <p className="text-gray-500 mt-4">Loading donation requests...</p>
          </div>
        ) : activeTab === 'campaigns' ? (
          // Campaign Donations
          donations.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600">campaign</span>
              <h3 className="text-xl font-bold text-gray-500 mt-4">No pending campaign donations</h3>
              <p className="text-gray-400 mt-2">All campaign donations have been processed</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Pending Campaign Donations ({donations.length})</h2>
                <button
                  onClick={fetchPendingDonations}
                  className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">refresh</span>
                  Refresh
                </button>
              </div>

              {donations.map(donation => (
              <div key={donation.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-start gap-4">
                  {/* Campaign Image */}
                  <div className="size-16 rounded-lg bg-gray-200 dark:bg-gray-700 overflow-hidden shrink-0">
                    {donation.campaign_image ? (
                      <img src={donation.campaign_image} alt={donation.campaign_title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-gray-400">campaign</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Campaign Info */}
                    <div className="mb-3">
                      <h3 className="font-bold text-base mb-1">{donation.campaign_title}</h3>
                      <p className="text-sm text-gray-500">Campaign ID: #{donation.campaign_id}</p>
                    </div>

                    {/* Donation Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-gray-500">person</span>
                          <span className="text-sm">
                            <strong>Donor:</strong> {donation.donor_name}
                            {donation.is_anonymous && <span className="text-xs text-gray-500 ml-1">(Anonymous)</span>}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-gray-500">phone</span>
                          <span className="text-sm"><strong>Phone:</strong> {donation.phone_number || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-gray-500">payments</span>
                          <span className="text-sm"><strong>Amount:</strong> ৳{donation.amount}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-gray-500">credit_card</span>
                          <span className="text-sm">
                            <strong>Method:</strong> {donation.payment_method === 'bkash' ? 'bKash' : 'Nagad'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-gray-500">receipt</span>
                          <span className="text-sm"><strong>TRX ID:</strong> {donation.transaction_id}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-gray-500">schedule</span>
                          <span className="text-sm"><strong>Time:</strong> {formatDate(donation.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                      <button
                        onClick={() => handleApprove(donation.id)}
                        disabled={processing === donation.id}
                        className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        {processing === donation.id ? (
                          <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                        ) : (
                          <span className="material-symbols-outlined text-sm">check_circle</span>
                        )}
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(donation.id)}
                        disabled={processing === donation.id}
                        className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        {processing === donation.id ? (
                          <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                        ) : (
                          <span className="material-symbols-outlined text-sm">cancel</span>
                        )}
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )) : (
          // Direct Aid Donations
          directAidDonations.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600">volunteer_activism</span>
              <h3 className="text-xl font-bold text-gray-500 mt-4">No pending direct aid donations</h3>
              <p className="text-gray-400 mt-2">All direct aid donations have been processed</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Pending Direct Aid Donations ({directAidDonations.length})</h2>
                <button
                  onClick={fetchPendingDirectAidDonations}
                  className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">refresh</span>
                  Refresh
                </button>
              </div>

              {directAidDonations.map(donation => (
                <div key={donation.id} className="bg-white dark:bg-gray-800 rounded-xl border border-purple-200 dark:border-purple-700 p-4">
                  <div className="flex items-start gap-4">
                    {/* Aid Image */}
                    <div className="size-16 rounded-full bg-purple-100 dark:bg-purple-900/30 overflow-hidden shrink-0 border-2 border-purple-300">
                      {donation.aid_image ? (
                        <img src={donation.aid_image} alt={donation.aid_title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-purple-400">volunteer_activism</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Aid Info */}
                      <div className="mb-3">
                        <span className="text-[10px] font-bold text-white bg-purple-500 px-2 py-0.5 rounded-full">Direct Aid</span>
                        <h3 className="font-bold text-base mb-1 mt-1">{donation.aid_title}</h3>
                        <p className="text-sm text-gray-500">For: {donation.beneficiary_name}</p>
                      </div>

                      {/* Donation Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-gray-500">person</span>
                            <span className="text-sm">
                              <strong>Donor:</strong> {donation.donor_name}
                              {donation.is_anonymous && <span className="text-xs text-gray-500 ml-1">(Anonymous)</span>}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-gray-500">phone</span>
                            <span className="text-sm"><strong>Phone:</strong> {donation.phone_number || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-gray-500">payments</span>
                            <span className="text-sm"><strong>Amount:</strong> ৳{donation.amount}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-gray-500">credit_card</span>
                            <span className="text-sm">
                              <strong>Method:</strong> {donation.payment_method === 'bkash' ? 'bKash' : 'Nagad'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-gray-500">receipt</span>
                            <span className="text-sm"><strong>TRX ID:</strong> {donation.transaction_id}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-gray-500">schedule</span>
                            <span className="text-sm"><strong>Time:</strong> {formatDate(donation.created_at)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                        <button
                          onClick={() => handleApproveDirectAid(donation.id)}
                          disabled={processing === `da-${donation.id}`}
                          className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          {processing === `da-${donation.id}` ? (
                            <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                          ) : (
                            <span className="material-symbols-outlined text-sm">check_circle</span>
                          )}
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectDirectAid(donation.id)}
                          disabled={processing === `da-${donation.id}`}
                          className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          {processing === `da-${donation.id}` ? (
                            <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                          ) : (
                            <span className="material-symbols-outlined text-sm">cancel</span>
                          )}
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </main>

      <VolunteerFooter />
    </div>
  );
}