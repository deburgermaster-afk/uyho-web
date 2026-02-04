import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import VolunteerFooter from '../../components/VolunteerFooter';

export default function BadgeDetailPage() {
  const navigate = useNavigate();
  const { badgeId } = useParams();
  const [badge, setBadge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [badgeVolunteers, setBadgeVolunteers] = useState([]);
  const [showAwardModal, setShowAwardModal] = useState(false);
  const [volunteerSearch, setVolunteerSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedVolunteers, setSelectedVolunteers] = useState([]);
  const [awardNote, setAwardNote] = useState('');
  const [awarding, setAwarding] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editBadge, setEditBadge] = useState({ name: '', description: '', icon_url: '', color: '', criteria: '' });

  const BADGE_ICONS = [
    'military_tech', 'workspace_premium', 'star', 'emoji_events', 'trophy',
    'verified', 'thumb_up', 'favorite', 'lightbulb', 'groups',
    'volunteer_activism', 'school', 'trending_up', 'diamond', 'eco',
    'local_fire_department', 'bolt', 'crown', 'shield', 'rocket_launch'
  ];

  const BADGE_COLORS = [
    '#fbbf24', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6',
    '#3b82f6', '#06b6d4', '#10b981', '#84cc16', '#f97316'
  ];

  const currentUser = JSON.parse(localStorage.getItem('volunteer') || '{}');

  useEffect(() => {
    fetchBadge();
    fetchBadgeVolunteers();
  }, [badgeId]);

  // Search volunteers
  useEffect(() => {
    const searchVolunteers = async () => {
      if (volunteerSearch.length < 2) {
        setSearchResults([]);
        return;
      }
      try {
        const res = await fetch(`https://uyho.org/uyho-backend/api/badges/search-volunteers?q=${encodeURIComponent(volunteerSearch)}`);
        const data = await res.json();
        // Filter out already selected and already awarded
        const awardedIds = badgeVolunteers.map(v => v.id);
        const selectedIds = selectedVolunteers.map(v => v.id);
        const filtered = data.filter(v => !awardedIds.includes(v.id) && !selectedIds.includes(v.id));
        setSearchResults(filtered);
      } catch (error) {
        console.error('Error searching volunteers:', error);
      }
    };
    
    const debounce = setTimeout(searchVolunteers, 300);
    return () => clearTimeout(debounce);
  }, [volunteerSearch, badgeVolunteers, selectedVolunteers]);

  const fetchBadge = async () => {
    try {
      const res = await fetch(`https://uyho.org/uyho-backend/api/badges/${badgeId}`);
      const data = await res.json();
      setBadge(data);
      setEditBadge({
        name: data.name || '',
        description: data.description || '',
        icon_url: data.icon_url || 'military_tech',
        color: data.color || '#3b82f6',
        criteria: data.criteria || ''
      });
    } catch (error) {
      console.error('Error fetching badge:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBadgeVolunteers = async () => {
    try {
      const res = await fetch(`https://uyho.org/uyho-backend/api/badges/${badgeId}/volunteers`);
      const data = await res.json();
      setBadgeVolunteers(data);
    } catch (error) {
      console.error('Error fetching badge volunteers:', error);
    }
  };

  const addVolunteer = (vol) => {
    setSelectedVolunteers([...selectedVolunteers, vol]);
    setVolunteerSearch('');
    setSearchResults([]);
  };

  const removeVolunteer = (volId) => {
    setSelectedVolunteers(selectedVolunteers.filter(v => v.id !== volId));
  };

  const handleAwardBadge = async () => {
    if (selectedVolunteers.length === 0) return;
    
    setAwarding(true);
    try {
      const res = await fetch(`https://uyho.org/uyho-backend/api/badges/${badgeId}/award`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          volunteer_ids: selectedVolunteers.map(v => v.id),
          awarded_by: currentUser.id,
          note: awardNote
        })
      });
      
      const result = await res.json();
      if (res.ok) {
        alert(result.message);
        setShowAwardModal(false);
        setSelectedVolunteers([]);
        setAwardNote('');
        fetchBadgeVolunteers();
      } else {
        alert(result.error || 'Failed to award badge');
      }
    } catch (error) {
      console.error('Error awarding badge:', error);
    } finally {
      setAwarding(false);
    }
  };

  const handleUpdateBadge = async () => {
    try {
      const res = await fetch(`https://uyho.org/uyho-backend/api/badges/${badgeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editBadge)
      });
      
      if (res.ok) {
        fetchBadge();
        setShowEditModal(false);
      }
    } catch (error) {
      console.error('Error updating badge:', error);
    }
  };

  const handleDeleteBadge = async () => {
    if (!confirm('Are you sure you want to delete this badge?')) return;
    
    try {
      const res = await fetch(`https://uyho.org/uyho-backend/api/badges/${badgeId}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        navigate('/volunteer/badges');
      }
    } catch (error) {
      console.error('Error deleting badge:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f7fb] dark:bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!badge) {
    return (
      <div className="min-h-screen bg-[#f5f7fb] dark:bg-gray-900">
        <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between px-4 py-3">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2">
              <span className="material-symbols-outlined text-gray-600 dark:text-gray-300">arrow_back</span>
            </button>
            <h1 className="text-lg font-bold dark:text-white">Badge Not Found</h1>
            <div className="w-10" />
          </div>
        </header>
        <div className="p-4 text-center text-gray-500">Badge not found</div>
        <VolunteerFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <span className="material-symbols-outlined text-gray-600 dark:text-gray-300">arrow_back</span>
          </button>
          <h1 className="text-lg font-bold dark:text-white">Badge Details</h1>
          <button onClick={() => setShowEditModal(true)} className="p-2 -mr-2">
            <span className="material-symbols-outlined text-gray-600 dark:text-gray-300">edit</span>
          </button>
        </div>
      </header>

      <div className="p-4 pb-32">
        {/* Badge Display */}
        <div className="text-center mb-6 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <div 
            className="w-28 h-28 rounded-3xl flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: `${badge.color}20` }}
          >
            <span 
              className="material-symbols-outlined text-6xl"
              style={{ color: badge.color }}
            >
              {badge.icon_url || 'military_tech'}
            </span>
          </div>
          <h2 className="text-2xl font-bold dark:text-white mb-2">{badge.name}</h2>
          <p className="text-gray-600 dark:text-gray-400">{badge.description}</p>
          
          {badge.criteria && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl text-left">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold mb-1">How to earn</p>
              <p className="text-sm font-medium dark:text-white">{badge.criteria}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setShowAwardModal(true)}
            className="flex-1 py-3 bg-primary text-white font-bold rounded-xl flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">card_giftcard</span>
            Award Badge
          </button>
          <button
            onClick={handleDeleteBadge}
            className="py-3 px-4 bg-red-100 text-red-600 font-bold rounded-xl"
          >
            <span className="material-symbols-outlined">delete</span>
          </button>
        </div>

        {/* Awarded Volunteers */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
          <h3 className="font-bold dark:text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">group</span>
            Awarded to ({badgeVolunteers.length})
          </h3>
          
          {badgeVolunteers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <span className="material-symbols-outlined text-4xl text-gray-300 block mb-2">person_off</span>
              No volunteers have this badge yet
            </div>
          ) : (
            <div className="space-y-2">
              {badgeVolunteers.map(vol => (
                <div 
                  key={vol.id}
                  onClick={() => navigate(`/volunteer/profile/${vol.id}`)}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <img 
                    src={vol.avatar || '/avatars/avatar_1.svg'} 
                    alt={vol.full_name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-medium dark:text-white">{vol.full_name}</p>
                    <p className="text-xs text-gray-500">{vol.position || 'Volunteer'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">
                      {new Date(vol.awarded_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Award Modal */}
      {showAwardModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
          <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-900 z-10">
              <h3 className="text-lg font-bold dark:text-white">Award Badge</h3>
              <button onClick={() => { setShowAwardModal(false); setSelectedVolunteers([]); setVolunteerSearch(''); }} className="p-2">
                <span className="material-symbols-outlined text-gray-500">close</span>
              </button>
            </div>
            
            <div className="p-4">
              {/* Badge Preview */}
              <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${badge.color}20` }}
                >
                  <span className="material-symbols-outlined text-2xl" style={{ color: badge.color }}>
                    {badge.icon_url || 'military_tech'}
                  </span>
                </div>
                <div>
                  <p className="font-bold dark:text-white">{badge.name}</p>
                  <p className="text-xs text-gray-500">Awarding to {selectedVolunteers.length} volunteer(s)</p>
                </div>
              </div>

              {/* Search Volunteers */}
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Search Volunteers
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                  <input
                    type="text"
                    value={volunteerSearch}
                    onChange={(e) => setVolunteerSearch(e.target.value)}
                    placeholder="Type name or email..."
                    className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl border-0 dark:text-white"
                  />
                </div>
                
                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-lg max-h-48 overflow-y-auto">
                    {searchResults.map(vol => (
                      <button
                        key={vol.id}
                        onClick={() => addVolunteer(vol)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-left border-b border-gray-100 dark:border-gray-700 last:border-0"
                      >
                        <img 
                          src={vol.avatar || '/avatars/avatar_1.svg'} 
                          alt={vol.full_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <p className="font-medium dark:text-white">{vol.full_name}</p>
                          <p className="text-xs text-gray-500">{vol.email}</p>
                        </div>
                        <span className="material-symbols-outlined text-primary">add_circle</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Volunteers */}
              {selectedVolunteers.length > 0 && (
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Selected ({selectedVolunteers.length})
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {selectedVolunteers.map(vol => (
                      <div 
                        key={vol.id}
                        className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-full"
                      >
                        <img 
                          src={vol.avatar || '/avatars/avatar_1.svg'} 
                          alt={vol.full_name}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <span className="text-sm font-medium text-primary">{vol.full_name}</span>
                        <button 
                          onClick={() => removeVolunteer(vol.id)}
                          className="text-primary hover:text-red-500"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Note */}
              <div className="mb-6">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Note (Optional)
                </label>
                <textarea
                  value={awardNote}
                  onChange={(e) => setAwardNote(e.target.value)}
                  placeholder="Why are you awarding this badge?"
                  rows={2}
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl border-0 dark:text-white resize-none"
                />
              </div>
              
              {/* Award Button */}
              <button
                onClick={handleAwardBadge}
                disabled={selectedVolunteers.length === 0 || awarding}
                className="w-full py-4 bg-primary text-white font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {awarding ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    Awarding...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">card_giftcard</span>
                    Award to {selectedVolunteers.length} Volunteer{selectedVolunteers.length !== 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
          <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-900 z-10">
              <h3 className="text-lg font-bold dark:text-white">Edit Badge</h3>
              <button onClick={() => setShowEditModal(false)} className="p-2">
                <span className="material-symbols-outlined text-gray-500">close</span>
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Name */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Badge Name</label>
                <input
                  type="text"
                  value={editBadge.name}
                  onChange={(e) => setEditBadge({...editBadge, name: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl border-0 dark:text-white"
                />
              </div>
              
              {/* Description */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Description</label>
                <textarea
                  value={editBadge.description}
                  onChange={(e) => setEditBadge({...editBadge, description: e.target.value})}
                  rows={2}
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl border-0 dark:text-white resize-none"
                />
              </div>
              
              {/* Criteria */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Criteria</label>
                <input
                  type="text"
                  value={editBadge.criteria}
                  onChange={(e) => setEditBadge({...editBadge, criteria: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl border-0 dark:text-white"
                />
              </div>
              
              {/* Icon */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Icon</label>
                <div className="grid grid-cols-10 gap-2">
                  {BADGE_ICONS.map(icon => (
                    <button
                      key={icon}
                      onClick={() => setEditBadge({...editBadge, icon_url: icon})}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        editBadge.icon_url === icon 
                          ? 'bg-primary text-white' 
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <span className="material-symbols-outlined text-xl">{icon}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Color */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {BADGE_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setEditBadge({...editBadge, color})}
                      className={`w-9 h-9 rounded-full ${
                        editBadge.color === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              
              {/* Save Button */}
              <button
                onClick={handleUpdateBadge}
                className="w-full py-3 bg-primary text-white font-bold rounded-xl"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      <VolunteerFooter />
    </div>
  );
}
