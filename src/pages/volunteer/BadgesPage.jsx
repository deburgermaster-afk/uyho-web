import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import VolunteerFooter from '../../components/VolunteerFooter';

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

export default function BadgesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAwardModal, setShowAwardModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [volunteerSearch, setVolunteerSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [awardNote, setAwardNote] = useState('');
  const [badgeVolunteers, setBadgeVolunteers] = useState([]);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [editingBadgeId, setEditingBadgeId] = useState(null);
  const [activeTab, setActiveTab] = useState('badges');
  
  // Assign tab state
  const [allVolunteers, setAllVolunteers] = useState([]);
  const [assignSearch, setAssignSearch] = useState('');
  const [selectedUserForAssign, setSelectedUserForAssign] = useState(null);
  const [selectedBadgeForAssign, setSelectedBadgeForAssign] = useState(null);
  const [assigning, setAssigning] = useState(false);
  
  // Create badge form
  const [newBadge, setNewBadge] = useState({
    name: '',
    description: '',
    icon_url: 'military_tech',
    color: '#3b82f6',
    criteria: ''
  });

  const currentUser = JSON.parse(localStorage.getItem('volunteer') || '{}');

  useEffect(() => {
    fetchBadges();
    fetchAllVolunteers();
  }, []);

  const fetchAllVolunteers = async () => {
    try {
      const res = await fetch('https://uyho.org/uyho-backend/api/volunteers/all');
      const data = await res.json();
      setAllVolunteers(data);
    } catch (error) {
      console.error('Error fetching volunteers:', error);
    }
  };

  // Handle URL parameter to open badge detail
  useEffect(() => {
    const viewBadgeId = searchParams.get('view');
    if (viewBadgeId && badges.length > 0) {
      const badge = badges.find(b => b.id.toString() === viewBadgeId);
      if (badge) {
        openBadgeDetail(badge);
      }
    }
  }, [searchParams, badges]);

  const fetchBadges = async () => {
    try {
      const res = await fetch('https://uyho.org/uyho-backend/api/badges');
      const data = await res.json();
      setBadges(data);
    } catch (error) {
      console.error('Error fetching badges:', error);
    } finally {
      setLoading(false);
    }
  };

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
        setSearchResults(data);
      } catch (error) {
        console.error('Error searching volunteers:', error);
      }
    };
    
    const debounce = setTimeout(searchVolunteers, 300);
    return () => clearTimeout(debounce);
  }, [volunteerSearch]);

  const handleCreateBadge = async () => {
    if (!newBadge.name) return;
    
    try {
      const url = editingBadgeId 
        ? `https://uyho.org/uyho-backend/api/badges/${editingBadgeId}`
        : 'https://uyho.org/uyho-backend/api/badges';
      
      const res = await fetch(url, {
        method: editingBadgeId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBadge)
      });
      
      if (res.ok) {
        fetchBadges();
        setShowCreateModal(false);
        setEditingBadgeId(null);
        setNewBadge({
          name: '',
          description: '',
          icon_url: 'military_tech',
          color: '#3b82f6',
          criteria: ''
        });
      }
    } catch (error) {
      console.error('Error saving badge:', error);
    }
  };

  const handleAIGenerate = async () => {
    if (!newBadge.name) {
      alert('Please enter a badge name first');
      return;
    }
    
    setAiGenerating(true);
    try {
      const res = await fetch('https://uyho.org/uyho-backend/api/ai/generate-badge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newBadge.name })
      });
      
      const data = await res.json();
      setNewBadge(prev => ({
        ...prev,
        description: data.description,
        icon_url: data.icon_url,
        color: data.color,
        criteria: data.criteria
      }));
    } catch (error) {
      console.error('Error generating badge:', error);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleAwardBadge = async () => {
    if (!selectedBadge || !selectedVolunteer) return;
    
    try {
      const res = await fetch(`https://uyho.org/uyho-backend/api/badges/${selectedBadge.id}/award`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          volunteer_id: selectedVolunteer.id,
          awarded_by: currentUser.id,
          note: awardNote
        })
      });
      
      if (res.ok) {
        alert('Badge awarded successfully!');
        setShowAwardModal(false);
        setSelectedVolunteer(null);
        setAwardNote('');
        setVolunteerSearch('');
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to award badge');
      }
    } catch (error) {
      console.error('Error awarding badge:', error);
    }
  };

  // Assign badge from Assign tab
  const handleAssignBadgeFromTab = async () => {
    if (!selectedUserForAssign || !selectedBadgeForAssign) return;
    
    setAssigning(true);
    try {
      const res = await fetch(`https://uyho.org/uyho-backend/api/badges/${selectedBadgeForAssign.id}/award`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          volunteer_id: selectedUserForAssign.id,
          awarded_by: currentUser.id,
          note: `Assigned via Badge Management`
        })
      });
      
      if (res.ok) {
        alert(`Badge "${selectedBadgeForAssign.name}" assigned to ${selectedUserForAssign.full_name}!`);
        setSelectedUserForAssign(null);
        setSelectedBadgeForAssign(null);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to assign badge');
      }
    } catch (error) {
      console.error('Error assigning badge:', error);
      alert('Error assigning badge');
    } finally {
      setAssigning(false);
    }
  };

  const openBadgeDetail = (badge) => {
    // Navigate to full badge detail page
    navigate(`/volunteer/badges/${badge.id}`);
  };

  const handleDeleteBadge = async (badgeId) => {
    if (!confirm('Are you sure you want to delete this badge?')) return;
    
    try {
      const res = await fetch(`https://uyho.org/uyho-backend/api/badges/${badgeId}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        fetchBadges();
        setShowDetailModal(false);
      }
    } catch (error) {
      console.error('Error deleting badge:', error);
    }
  };

  const filteredBadges = badges.filter(badge =>
    badge.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    badge.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter volunteers for assign tab
  const filteredVolunteersForAssign = allVolunteers.filter(vol =>
    vol.full_name?.toLowerCase().includes(assignSearch.toLowerCase()) ||
    vol.email?.toLowerCase().includes(assignSearch.toLowerCase()) ||
    vol.phone?.includes(assignSearch)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f7fb] dark:bg-gray-900">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between px-4 py-3">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2">
              <span className="material-symbols-outlined text-gray-600 dark:text-gray-300">arrow_back</span>
            </button>
            <h1 className="text-lg font-bold dark:text-white">Badges</h1>
            <div className="w-10" />
          </div>
        </header>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
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
          <h1 className="text-lg font-bold dark:text-white">Badges</h1>
          <div className="w-10" />
        </div>
        
        {/* Tabs */}
        <div className="flex border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('badges')}
            className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'badges'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-400'
            }`}
          >
            <span className="material-symbols-outlined text-lg">military_tech</span>
            Badges
          </button>
          <button
            onClick={() => setActiveTab('assign')}
            className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'assign'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-400'
            }`}
          >
            <span className="material-symbols-outlined text-lg">assignment_ind</span>
            Assign
          </button>
        </div>
      </header>

      <div className="p-4 pb-24">
        {/* Badges Tab */}
        {activeTab === 'badges' && (
          <>
            {/* Header with Search */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-2xl">military_tech</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold dark:text-white">Badges</h1>
                  <p className="text-sm text-gray-500">{badges.length} badges available</p>
                </div>
              </div>
              
              {/* Search Bar */}
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                <input
                  type="text"
                  placeholder="Search badges..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl border-0 focus:ring-2 focus:ring-primary dark:text-white"
                />
              </div>
            </div>

            {/* Badges Grid */}
            <div className="grid grid-cols-2 gap-4">
              {filteredBadges.map(badge => (
                <div
                  key={badge.id}
                  onClick={() => openBadgeDetail(badge)}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 mx-auto"
                    style={{ backgroundColor: `${badge.color}20` }}
                  >
                    <span 
                      className="material-symbols-outlined text-3xl"
                      style={{ color: badge.color }}
                    >
                      {badge.icon_url || 'military_tech'}
                    </span>
                  </div>
                  <h3 className="font-bold text-center dark:text-white text-sm mb-1">{badge.name}</h3>
                  <p className="text-xs text-gray-500 text-center line-clamp-2">{badge.description}</p>
                </div>
              ))}
            </div>

            {filteredBadges.length === 0 && (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">military_tech</span>
                <p className="text-gray-500">No badges found</p>
              </div>
            )}

            {/* Floating Create Button */}
            <button
              onClick={() => { setEditingBadgeId(null); setNewBadge({ name: '', description: '', icon_url: 'military_tech', color: '#3b82f6', criteria: '' }); setShowCreateModal(true); }}
              className="fixed bottom-24 right-4 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center z-40"
            >
              <span className="material-symbols-outlined text-2xl">add</span>
            </button>
          </>
        )}

        {/* Assign Tab */}
        {activeTab === 'assign' && (
          <div>
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-2xl">assignment_ind</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold dark:text-white">Assign Badge</h1>
                  <p className="text-sm text-gray-500">Select a user and badge to assign</p>
                </div>
              </div>
            </div>

            {/* Selected User & Badge Summary */}
            {(selectedUserForAssign || selectedBadgeForAssign) && (
              <div className="mb-4 p-4 bg-gradient-to-br from-primary/5 to-purple-50 dark:from-primary/10 dark:to-purple-900/10 rounded-2xl border border-primary/20">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Assignment Preview</p>
                  {selectedUserForAssign && selectedBadgeForAssign && (
                    <button
                      onClick={handleAssignBadgeFromTab}
                      disabled={assigning}
                      className="px-4 py-2 bg-primary text-white font-bold rounded-xl text-sm flex items-center gap-2 disabled:opacity-50"
                    >
                      {assigning ? (
                        <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                      ) : (
                        <span className="material-symbols-outlined text-sm">check</span>
                      )}
                      Assign Now
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  {/* User */}
                  <div className="flex-1">
                    {selectedUserForAssign ? (
                      <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-xl">
                        <img 
                          src={selectedUserForAssign.avatar || '/avatars/avatar_1.svg'} 
                          alt=""
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold dark:text-white truncate">{selectedUserForAssign.full_name}</p>
                          <p className="text-xs text-gray-500 truncate">{selectedUserForAssign.position || 'Volunteer'}</p>
                        </div>
                        <button onClick={() => setSelectedUserForAssign(null)} className="p-1 text-gray-400 hover:text-red-500">
                          <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-center">
                        <span className="material-symbols-outlined text-gray-400 text-2xl">person_add</span>
                        <p className="text-xs text-gray-400 mt-1">Select user</p>
                      </div>
                    )}
                  </div>
                  
                  <span className="material-symbols-outlined text-gray-400">arrow_forward</span>
                  
                  {/* Badge */}
                  <div className="flex-1">
                    {selectedBadgeForAssign ? (
                      <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-xl">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${selectedBadgeForAssign.color}20` }}
                        >
                          <span 
                            className="material-symbols-outlined text-xl"
                            style={{ color: selectedBadgeForAssign.color }}
                          >
                            {selectedBadgeForAssign.icon_url || 'military_tech'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold dark:text-white truncate">{selectedBadgeForAssign.name}</p>
                        </div>
                        <button onClick={() => setSelectedBadgeForAssign(null)} className="p-1 text-gray-400 hover:text-red-500">
                          <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-center">
                        <span className="material-symbols-outlined text-gray-400 text-2xl">military_tech</span>
                        <p className="text-xs text-gray-400 mt-1">Select badge</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Search Users */}
            <div className="mb-4">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">Search Users</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                <input
                  type="text"
                  placeholder="Search by name, email or phone..."
                  value={assignSearch}
                  onChange={(e) => setAssignSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl border-0 focus:ring-2 focus:ring-primary dark:text-white"
                />
              </div>
            </div>

            {/* Users List */}
            <div className="mb-6">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Users ({filteredVolunteersForAssign.length})
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {filteredVolunteersForAssign.slice(0, 20).map(vol => (
                  <button
                    key={vol.id}
                    onClick={() => setSelectedUserForAssign(vol)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                      selectedUserForAssign?.id === vol.id
                        ? 'bg-primary/10 border-2 border-primary'
                        : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-primary'
                    }`}
                  >
                    <img 
                      src={vol.avatar || '/avatars/avatar_1.svg'} 
                      alt={vol.full_name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-bold text-sm dark:text-white truncate">{vol.full_name}</p>
                      <p className="text-xs text-gray-500 truncate">{vol.position || vol.email || 'Volunteer'}</p>
                    </div>
                    {selectedUserForAssign?.id === vol.id && (
                      <span className="material-symbols-outlined text-primary">check_circle</span>
                    )}
                  </button>
                ))}
                {filteredVolunteersForAssign.length === 0 && (
                  <div className="text-center py-8">
                    <span className="material-symbols-outlined text-4xl text-gray-300">person_search</span>
                    <p className="text-gray-500 text-sm mt-2">No users found</p>
                  </div>
                )}
              </div>
            </div>

            {/* Select Badge */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Select Badge ({badges.length})
              </p>
              <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                {badges.map(badge => (
                  <button
                    key={badge.id}
                    onClick={() => setSelectedBadgeForAssign(badge)}
                    className={`p-3 rounded-xl text-center transition-colors ${
                      selectedBadgeForAssign?.id === badge.id
                        ? 'bg-primary/10 border-2 border-primary'
                        : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-primary'
                    }`}
                  >
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2"
                      style={{ backgroundColor: `${badge.color}20` }}
                    >
                      <span 
                        className="material-symbols-outlined text-xl"
                        style={{ color: badge.color }}
                      >
                        {badge.icon_url || 'military_tech'}
                      </span>
                    </div>
                    <p className="text-xs font-bold dark:text-white truncate">{badge.name}</p>
                    {selectedBadgeForAssign?.id === badge.id && (
                      <span className="material-symbols-outlined text-primary text-sm mt-1">check_circle</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Badge Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
          <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-900">
              <h3 className="text-lg font-bold dark:text-white">{editingBadgeId ? 'Edit Badge' : 'Create Badge'}</h3>
              <button onClick={() => { setShowCreateModal(false); setEditingBadgeId(null); setNewBadge({ name: '', description: '', icon_url: 'military_tech', color: '#3b82f6', criteria: '' }); }} className="p-2">
                <span className="material-symbols-outlined text-gray-500">close</span>
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* AI Generate Button */}
              <button
                onClick={handleAIGenerate}
                disabled={aiGenerating}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl flex items-center justify-center gap-2"
              >
                {aiGenerating ? (
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined">auto_awesome</span>
                )}
                {aiGenerating ? 'Generating...' : 'AI Generate Badge'}
              </button>
              
              <div className="text-center text-sm text-gray-500">or fill manually</div>
              
              {/* Badge Preview */}
              <div className="flex justify-center">
                <div 
                  className="w-20 h-20 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: `${newBadge.color}20` }}
                >
                  <span 
                    className="material-symbols-outlined text-4xl"
                    style={{ color: newBadge.color }}
                  >
                    {newBadge.icon_url}
                  </span>
                </div>
              </div>
              
              {/* Name with AI Generate */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Badge Name *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newBadge.name}
                    onChange={(e) => setNewBadge({...newBadge, name: e.target.value})}
                    placeholder="e.g. Rising Star, Team Leader, Community Hero"
                    className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl border-0 dark:text-white"
                  />
                  <button
                    onClick={handleAIGenerate}
                    disabled={!newBadge.name || aiGenerating}
                    className="px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
                  >
                    {aiGenerating ? (
                      <>
                        <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                        <span className="hidden sm:inline">Generating...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-lg">auto_awesome</span>
                        <span className="hidden sm:inline">AI Generate</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Enter a name and click AI Generate to auto-fill description & criteria</p>
              </div>
              
              {/* Description */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Description</label>
                <textarea
                  value={newBadge.description}
                  onChange={(e) => setNewBadge({...newBadge, description: e.target.value})}
                  placeholder="What is this badge for?"
                  rows={2}
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl border-0 dark:text-white resize-none"
                />
              </div>
              
              {/* Criteria */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Award Criteria</label>
                <input
                  type="text"
                  value={newBadge.criteria}
                  onChange={(e) => setNewBadge({...newBadge, criteria: e.target.value})}
                  placeholder="How to earn this badge"
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl border-0 dark:text-white"
                />
              </div>
              
              {/* Icon Selection */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Icon</label>
                <div className="grid grid-cols-10 gap-2">
                  {BADGE_ICONS.map(icon => (
                    <button
                      key={icon}
                      onClick={() => setNewBadge({...newBadge, icon_url: icon})}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        newBadge.icon_url === icon 
                          ? 'bg-primary text-white' 
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <span className="material-symbols-outlined text-xl">{icon}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Color Selection */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {BADGE_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setNewBadge({...newBadge, color})}
                      className={`w-9 h-9 rounded-full ${
                        newBadge.color === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              
              {/* Create/Update Button */}
              <button
                onClick={handleCreateBadge}
                disabled={!newBadge.name}
                className="w-full py-3 bg-primary text-white font-bold rounded-xl disabled:opacity-50"
              >
                {editingBadgeId ? 'Save Changes' : 'Create Badge'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Badge Detail Modal */}
      {showDetailModal && selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
          <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-900">
              <h3 className="text-lg font-bold dark:text-white">Badge Details</h3>
              <button onClick={() => setShowDetailModal(false)} className="p-2">
                <span className="material-symbols-outlined text-gray-500">close</span>
              </button>
            </div>
            
            <div className="p-4">
              {/* Badge Display */}
              <div className="text-center mb-6">
                <div 
                  className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: `${selectedBadge.color}20` }}
                >
                  <span 
                    className="material-symbols-outlined text-5xl"
                    style={{ color: selectedBadge.color }}
                  >
                    {selectedBadge.icon_url || 'military_tech'}
                  </span>
                </div>
                <h2 className="text-xl font-bold dark:text-white mb-2">{selectedBadge.name}</h2>
                <p className="text-gray-600 dark:text-gray-400">{selectedBadge.description}</p>
                
                {selectedBadge.criteria && (
                  <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">How to earn:</p>
                    <p className="text-sm font-medium dark:text-white">{selectedBadge.criteria}</p>
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setShowAwardModal(true);
                  }}
                  className="flex-1 py-3 bg-primary text-white font-bold rounded-xl flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">card_giftcard</span>
                  Award
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setEditingBadgeId(selectedBadge.id);
                    setShowCreateModal(true);
                    setNewBadge({
                      name: selectedBadge.name,
                      description: selectedBadge.description || '',
                      icon_url: selectedBadge.icon_url || 'military_tech',
                      color: selectedBadge.color || '#3b82f6',
                      criteria: selectedBadge.criteria || ''
                    });
                  }}
                  className="py-3 px-4 bg-blue-100 text-blue-600 font-bold rounded-xl flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined">edit</span>
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteBadge(selectedBadge.id)}
                  className="py-3 px-4 bg-red-100 text-red-600 font-bold rounded-xl"
                >
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
              
              {/* Volunteers with this badge */}
              <div>
                <h4 className="font-bold dark:text-white mb-3">
                  Awarded to ({badgeVolunteers.length})
                </h4>
                
                {badgeVolunteers.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No volunteers have this badge yet</p>
                ) : (
                  <div className="space-y-2">
                    {badgeVolunteers.map(vol => (
                      <div 
                        key={vol.id}
                        onClick={() => navigate(`/volunteer/view-profile/${vol.id}`)}
                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl cursor-pointer"
                      >
                        <img 
                          src={vol.avatar || '/avatars/avatar_1.svg'} 
                          alt={vol.full_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <p className="font-medium dark:text-white">{vol.full_name}</p>
                          <p className="text-xs text-gray-500">{vol.position || 'Volunteer'}</p>
                        </div>
                        <p className="text-xs text-gray-400">
                          {new Date(vol.awarded_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Award Badge Modal */}
      {showAwardModal && selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
          <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-900">
              <h3 className="text-lg font-bold dark:text-white">Award Badge</h3>
              <button onClick={() => {
                setShowAwardModal(false);
                setSelectedVolunteer(null);
                setVolunteerSearch('');
              }} className="p-2">
                <span className="material-symbols-outlined text-gray-500">close</span>
              </button>
            </div>
            
            <div className="p-4">
              {/* Badge Preview */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl mb-6">
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${selectedBadge.color}20` }}
                >
                  <span 
                    className="material-symbols-outlined text-3xl"
                    style={{ color: selectedBadge.color }}
                  >
                    {selectedBadge.icon_url}
                  </span>
                </div>
                <div>
                  <h4 className="font-bold dark:text-white">{selectedBadge.name}</h4>
                  <p className="text-sm text-gray-500">{selectedBadge.description}</p>
                </div>
              </div>
              
              {/* Search Volunteer */}
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Search Volunteer *
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                  <input
                    type="text"
                    value={volunteerSearch}
                    onChange={(e) => {
                      setVolunteerSearch(e.target.value);
                      setSelectedVolunteer(null);
                    }}
                    placeholder="Search by name or email..."
                    className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl border-0 dark:text-white"
                  />
                </div>
                
                {/* Search Results */}
                {searchResults.length > 0 && !selectedVolunteer && (
                  <div className="mt-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 max-h-48 overflow-y-auto">
                    {searchResults.map(vol => (
                      <button
                        key={vol.id}
                        onClick={() => {
                          setSelectedVolunteer(vol);
                          setVolunteerSearch(vol.full_name);
                          setSearchResults([]);
                        }}
                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
                      >
                        <img 
                          src={vol.avatar || '/avatars/avatar_1.svg'} 
                          alt={vol.full_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-medium dark:text-white">{vol.full_name}</p>
                          <p className="text-xs text-gray-500">{vol.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Selected Volunteer */}
                {selectedVolunteer && (
                  <div className="mt-2 flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                    <img 
                      src={selectedVolunteer.avatar || '/avatars/avatar_1.svg'} 
                      alt={selectedVolunteer.full_name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-medium dark:text-white">{selectedVolunteer.full_name}</p>
                      <p className="text-xs text-gray-500">{selectedVolunteer.position || 'Volunteer'}</p>
                    </div>
                    <span className="material-symbols-outlined text-green-500">check_circle</span>
                  </div>
                )}
              </div>
              
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
                disabled={!selectedVolunteer}
                className="w-full py-3 bg-primary text-white font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">card_giftcard</span>
                Award Badge
              </button>
            </div>
          </div>
        </div>
      )}
      
      <VolunteerFooter />
    </div>
  );
}
