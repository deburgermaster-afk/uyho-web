import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import VolunteerFooter from '../../components/VolunteerFooter';
import { ShimmerListItem } from '../../components/Shimmer';
import { useApp } from '../../context/AppContext';

export default function AlliesPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { getPreloaded } = useApp();
  
  const [allies, setAllies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [owner, setOwner] = useState(null);
  const [privacyStatus, setPrivacyStatus] = useState(null); // 'allowed', 'private', 'allies_only'
  
  const currentUserId = localStorage.getItem('volunteerId');
  const isOwnProfile = id === currentUserId;
  const ownerName = searchParams.get('name') || 'User';

  useEffect(() => {
    loadInitialData();
    fetchData();
  }, [id, currentUserId]);

  const loadInitialData = async () => {
    // Try to load from preloaded cache for instant display
    if (isOwnProfile) {
      const preloaded = await getPreloaded(`allies-${currentUserId}`);
      if (preloaded) {
        setAllies(preloaded);
        setPrivacyStatus('allowed');
      }
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // First check privacy settings
      const privacyRes = await fetch(`/api/privacy/${id}/allies-visibility`);
      if (privacyRes.ok) {
        const privacyData = await privacyRes.json();
        
        // If it's own profile, always show
        if (isOwnProfile) {
          setPrivacyStatus('allowed');
        } else {
          // Check based on privacy setting
          if (privacyData.visibility === 'public') {
            setPrivacyStatus('allowed');
          } else if (privacyData.visibility === 'allies') {
            // Check if current user is an ally
            const allyCheckRes = await fetch(`/api/allies/check/${id}/${currentUserId}`);
            if (allyCheckRes.ok) {
              const allyCheck = await allyCheckRes.json();
              setPrivacyStatus(allyCheck.isAlly ? 'allowed' : 'allies_only');
            } else {
              setPrivacyStatus('allies_only');
            }
          } else {
            setPrivacyStatus('private');
          }
        }
      } else {
        // Default to public if no privacy setting
        setPrivacyStatus('allowed');
      }

      // Fetch owner info
      const ownerRes = await fetch(`/api/volunteers/${id}`);
      if (ownerRes.ok) {
        const ownerData = await ownerRes.json();
        setOwner(ownerData);
      }

      // Only fetch allies if allowed
      if (privacyStatus === 'allowed' || isOwnProfile) {
        const alliesRes = await fetch(`/api/allies/${id}`);
        if (alliesRes.ok) {
          const alliesData = await alliesRes.json();
          setAllies(alliesData);
        }
      }
    } catch (error) {
      console.error('Error fetching allies:', error);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch allies when privacy status changes to allowed
  useEffect(() => {
    if (privacyStatus === 'allowed') {
      fetchAllies();
    }
  }, [privacyStatus]);

  const fetchAllies = async () => {
    try {
      const alliesRes = await fetch(`/api/allies/${id}`);
      if (alliesRes.ok) {
        const alliesData = await alliesRes.json();
        setAllies(alliesData);
      }
    } catch (error) {
      console.error('Error fetching allies:', error);
    }
  };

  const handleRemoveAlly = async (allyId) => {
    if (!isOwnProfile) return;
    
    try {
      const res = await fetch(`/api/allies/${currentUserId}/${allyId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setAllies(prev => prev.filter(a => a.id !== allyId));
      }
    } catch (error) {
      console.error('Error removing ally:', error);
    }
  };

  const filteredAllies = allies.filter(ally =>
    ally.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ally.wing?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && allies.length === 0) {
    return (
      <div className="min-h-screen bg-[#F5F7FB] dark:bg-background-dark">
        <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center gap-3">
          <div className="p-2">
            <span className="material-symbols-outlined">arrow_back</span>
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Allies</h1>
          </div>
        </div>
        <div className="p-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ShimmerListItem key={i} className="mb-2 bg-white dark:bg-slate-800 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FB] dark:bg-background-dark">
      <main className="max-w-md mx-auto pb-32">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">
              {isOwnProfile ? 'Your Allies' : `${owner?.full_name || ownerName}'s Allies`}
            </h1>
            {privacyStatus === 'allowed' && (
              <p className="text-xs text-slate-500">{allies.length} {allies.length === 1 ? 'ally' : 'allies'}</p>
            )}
          </div>
        </div>

        {/* Privacy Blocked View */}
        {privacyStatus === 'private' && (
          <div className="px-6 py-16 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-4xl text-slate-400">lock</span>
            </div>
            <h2 className="text-lg font-bold text-[#0B1B33] dark:text-white mb-2">
              Ally List is Private
            </h2>
            <p className="text-sm text-slate-500 max-w-xs">
              {owner?.full_name || ownerName} has chosen to keep their ally list private.
            </p>
          </div>
        )}

        {privacyStatus === 'allies_only' && (
          <div className="px-6 py-16 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-4xl text-slate-400">group_off</span>
            </div>
            <h2 className="text-lg font-bold text-[#0B1B33] dark:text-white mb-2">
              Allies Only
            </h2>
            <p className="text-sm text-slate-500 max-w-xs">
              Only {owner?.full_name || ownerName}'s allies can view their ally list.
            </p>
          </div>
        )}

        {/* Search Bar - Only show if allowed */}
        {privacyStatus === 'allowed' && (
          <>
            <div className="px-4 py-3">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search allies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Allies List */}
            <div className="px-4">
              {filteredAllies.length === 0 ? (
                <div className="py-12 text-center">
                  <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600 mb-3 block">
                    group
                  </span>
                  <p className="text-slate-500 text-sm">
                    {searchQuery ? 'No allies found matching your search' : 'No allies yet'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredAllies.map((ally) => (
                    <div
                      key={ally.id}
                      className="bg-white dark:bg-slate-900 rounded-xl p-3 flex items-center gap-3 border border-slate-100 dark:border-slate-800"
                    >
                      {/* Avatar */}
                      <div
                        onClick={() => navigate(`/volunteer/profile/${ally.id}`)}
                        className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0 cursor-pointer overflow-hidden"
                      >
                        {ally.avatar ? (
                          <img
                            src={ally.avatar}
                            alt={ally.full_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600">
                            <span className="text-white font-bold">
                              {ally.full_name?.charAt(0)?.toUpperCase() || 'A'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => navigate(`/volunteer/profile/${ally.id}`)}
                      >
                        <h3 className="font-semibold text-sm text-[#0B1B33] dark:text-white">
                          {ally.full_name}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {ally.wing} • {ally.position || 'Member'}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/volunteer/chat?with=${ally.id}`)}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                        >
                          <span className="material-symbols-outlined text-slate-500">chat</span>
                        </button>
                        {isOwnProfile && (
                          <button
                            onClick={() => handleRemoveAlly(ally.id)}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
                          >
                            <span className="material-symbols-outlined text-red-500">person_remove</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
      <VolunteerFooter />
    </div>
  );
}
