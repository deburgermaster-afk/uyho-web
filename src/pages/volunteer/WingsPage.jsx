import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import VolunteerFooter from '../../components/VolunteerFooter';
import { ShimmerWing } from '../../components/Shimmer';
import { useApp } from '../../context/AppContext';

export default function WingsPage() {
  const navigate = useNavigate();
  const { getPreloaded } = useApp();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general'); // 'general' or 'requests'
  const [canViewRequests, setCanViewRequests] = useState(false);
  const [wings, setWings] = useState([]);
  const [pendingWings, setPendingWings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [processing, setProcessing] = useState(null);
  
  // Decline modal
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [selectedWing, setSelectedWing] = useState(null);
  const [declineReason, setDeclineReason] = useState('');

  const volunteerId = localStorage.getItem('volunteerId');

  useEffect(() => {
    // Check permissions for requests tab
    const checkPermissions = async () => {
      try {
        const res = await fetch(`/api/access-settings/user/${volunteerId}`);
        if (res.ok) {
          const data = await res.json();
          const permissions = data.permissions || [];
          const canApprove = permissions.includes('wing_approve') ||
                           permissions.includes('wing_manage') ||
                           permissions.includes('org_settings') ||
                           data.role === 'Admin';
          setCanViewRequests(canApprove);
        }
      } catch (err) {
        console.error('Failed to check permissions:', err);
      }
    };
    checkPermissions();
    fetchData();
  }, [volunteerId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Try preloaded data first for instant load
      const preloaded = await getPreloaded('wings');
      if (preloaded) {
        setWings(preloaded.filter(w => w.status === 'approved'));
        setPendingWings(preloaded.filter(w => w.status === 'pending'));
      }

      const [wingsRes, pendingRes] = await Promise.all([
        fetch('/api/wings?status=approved'),
        fetch('/api/wings/pending')
      ]);
      
      if (wingsRes.ok) {
        const data = await wingsRes.json();
        setWings(data);
      }
      
      if (pendingRes.ok) {
        const data = await pendingRes.json();
        setPendingWings(data);
      }
    } catch (err) {
      console.error('Failed to fetch wings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (wingId) => {
    setProcessing(wingId);
    try {
      const volunteerId = localStorage.getItem('volunteerId');
      const res = await fetch(`/api/wings/${wingId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewerId: volunteerId })
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to approve wing:', err);
    } finally {
      setProcessing(null);
    }
  };

  const handleDecline = async () => {
    if (!selectedWing || !declineReason.trim()) return;
    setProcessing(selectedWing.id);
    try {
      const volunteerId = localStorage.getItem('volunteerId');
      const res = await fetch(`/api/wings/${selectedWing.id}/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewerId: volunteerId, reason: declineReason })
      });
      if (res.ok) {
        await fetchData();
        setShowDeclineModal(false);
        setSelectedWing(null);
        setDeclineReason('');
      }
    } catch (err) {
      console.error('Failed to decline wing:', err);
    } finally {
      setProcessing(null);
    }
  };

  const filteredWings = wings.filter(w =>
    w.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPendingWings = pendingWings.filter(w =>
    w.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7FB] dark:bg-background-dark">
        <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center gap-3">
          <div className="p-2">
            <span className="material-symbols-outlined">arrow_back</span>
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Wings</h1>
            <p className="text-xs text-slate-500">Organizational branches & chapters</p>
          </div>
        </div>
        <ShimmerWing count={6} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FB] dark:bg-background-dark">
      <main className="max-w-md mx-auto pb-32">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Wings</h1>
            <p className="text-xs text-slate-500">Organizational branches & chapters</p>
          </div>
          <button 
            onClick={() => navigate('/volunteer/wings/create')}
            className="p-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors"
          >
            <span className="material-symbols-outlined">add</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-4 py-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
            <input
              type="text"
              placeholder="Search wings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('general')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'general'
                  ? 'bg-primary text-white'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <span className="material-symbols-outlined text-sm">list</span>
              General
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === 'general' ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'}`}>
                {wings.length}
              </span>
            </button>
            {canViewRequests && (
              <button
                onClick={() => setActiveTab('requests')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeTab === 'requests'
                    ? 'bg-primary text-white'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <span className="material-symbols-outlined text-sm">pending_actions</span>
                Requests
                {pendingWings.length > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {pendingWings.length}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-4">
          {activeTab === 'general' ? (
            // General - Approved Wings List
            <div className="space-y-3">
              {filteredWings.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-xl p-8 text-center border border-slate-200 dark:border-slate-800">
                  <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 block">location_city</span>
                  <p className="text-slate-500 font-medium">No wings found</p>
                  <p className="text-xs text-slate-400 mt-1">Create a new wing to get started</p>
                  <button
                    onClick={() => navigate('/volunteer/wings/create')}
                    className="mt-4 px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Create Wing
                  </button>
                </div>
              ) : (
                filteredWings.map((wing) => (
                  <div
                    key={wing.id}
                    onClick={() => navigate(`/volunteer/wing/${wing.id}`)}
                    className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  >
                    <div className="flex gap-4 p-4">
                      {/* Wing Image */}
                      <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 flex-shrink-0 overflow-hidden">
                        {wing.image ? (
                          <img src={wing.image} alt={wing.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-2xl text-slate-400">location_city</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Wing Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base truncate">{wing.name}</h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          <span className="material-symbols-outlined text-xs">location_on</span>
                          {wing.location || 'Location TBD'}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                            <span className="material-symbols-outlined text-xs">group</span>
                            {wing.member_count || 0} members
                          </span>
                          <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
                            <span className="material-symbols-outlined text-xs">verified</span>
                            Active
                          </span>
                        </div>
                      </div>
                      
                      <span className="material-symbols-outlined text-slate-400">chevron_right</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : canViewRequests ? (
            // Requests - Pending Wings (only if authorized)
            <div className="space-y-3">
              {filteredPendingWings.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-xl p-8 text-center border border-slate-200 dark:border-slate-800">
                  <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 block">inbox</span>
                  <p className="text-slate-500 font-medium">No pending requests</p>
                  <p className="text-xs text-slate-400 mt-1">All wing requests have been processed</p>
                </div>
              ) : (
                filteredPendingWings.map((wing) => (
                  <div
                    key={wing.id}
                    className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
                  >
                    {/* Wing Header */}
                    <div className="p-4">
                      <div className="flex gap-3">
                        <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 flex-shrink-0 overflow-hidden">
                          {wing.image ? (
                            <img src={wing.image} alt={wing.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="material-symbols-outlined text-xl text-slate-400">location_city</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-bold text-sm">{wing.name}</h3>
                            <span className="text-[10px] font-bold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded whitespace-nowrap">
                              Pending
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                            <span className="material-symbols-outlined text-xs">location_on</span>
                            {wing.location || 'Location TBD'}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            Requested by: {wing.created_by_name || 'Unknown'}
                          </p>
                        </div>
                      </div>
                      
                      {wing.description && (
                        <p className="text-xs text-slate-500 mt-3 line-clamp-2">{wing.description}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 p-4 pt-0">
                      <button
                        onClick={() => navigate(`/volunteer/wing/${wing.id}`)}
                        className="flex-1 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleApprove(wing.id)}
                        disabled={processing === wing.id}
                        className="flex-1 py-2 text-xs font-bold text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        {processing === wing.id ? (
                          <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-sm">check</span>
                            Approve
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedWing(wing);
                          setShowDeclineModal(true);
                        }}
                        disabled={processing === wing.id}
                        className="flex-1 py-2 text-xs font-bold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                        Decline
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            // Fallback for unauthorized users trying to view requests tab
            <div className="bg-white dark:bg-slate-900 rounded-xl p-8 text-center border border-slate-200 dark:border-slate-800">
              <span className="material-symbols-outlined text-5xl text-red-300 mb-3 block">lock</span>
              <p className="text-slate-500 font-medium">Access Denied</p>
              <p className="text-xs text-slate-400 mt-1">You don't have permission to view requests</p>
            </div>
          )}
        </div>
      </main>

      {/* Decline Modal */}
      {showDeclineModal && selectedWing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-red-600">warning</span>
                </div>
                <div>
                  <h3 className="font-bold">Decline Wing</h3>
                  <p className="text-xs text-slate-500">This action cannot be undone</p>
                </div>
              </div>
            </div>
            
            <div className="p-4">
              <p className="text-sm mb-3">
                You are about to decline: <strong>{selectedWing.name}</strong>
              </p>
              
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                Reason for Decline *
              </label>
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Enter the reason for declining this wing request..."
                rows={4}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none"
              />
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex gap-2">
              <button
                onClick={() => {
                  setShowDeclineModal(false);
                  setSelectedWing(null);
                  setDeclineReason('');
                }}
                className="flex-1 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDecline}
                disabled={!declineReason.trim() || processing}
                className="flex-1 py-2.5 text-sm font-bold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
              >
                {processing ? (
                  <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">close</span>
                    Decline
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <VolunteerFooter />
    </div>
  );
}
