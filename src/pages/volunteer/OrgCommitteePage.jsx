import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import VolunteerFooter from '../../components/VolunteerFooter';

export default function OrgCommitteePage() {
  const navigate = useNavigate();
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [activeTab, setActiveTab] = useState('central');
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [searchCentral, setSearchCentral] = useState('');
  const [searchGeneral, setSearchGeneral] = useState('');
  const [searchWings, setSearchWings] = useState('');
  const [searchModal, setSearchModal] = useState('');
  
  // Modal states
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [saving, setSaving] = useState(false);

  const volunteerId = localStorage.getItem('volunteerId');

  // Check access on mount
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const res = await fetch(`/api/access-settings/user/${volunteerId}`);
        if (res.ok) {
          const data = await res.json();
          const canAccess = data.permissions?.includes('committee_view') || 
                           data.permissions?.includes('org_settings') || 
                           data.role === 'Admin';
          if (!canAccess) {
            navigate('/volunteer', { replace: true });
            return;
          }
          setHasAccess(true);
        } else {
          navigate('/volunteer', { replace: true });
        }
      } catch (err) {
        console.error('Access check failed:', err);
        navigate('/volunteer', { replace: true });
      } finally {
        setCheckingAccess(false);
      }
    };
    checkAccess();
  }, [volunteerId, navigate]);

  useEffect(() => {
    if (hasAccess) fetchData();
  }, [hasAccess]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rolesRes, volunteersRes] = await Promise.all([
        fetch('/api/roles'),
        fetch('/api/volunteers/all')
      ]);
      
      if (rolesRes.ok) {
        const rolesData = await rolesRes.json();
        console.log('Roles loaded:', rolesData.length);
        setRoles(rolesData);
      }
      
      if (volunteersRes.ok) {
        const volunteersData = await volunteersRes.json();
        console.log('Volunteers loaded:', volunteersData.length);
        setVolunteers(volunteersData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const executiveRoles = roles.filter(r => r.category === 'executive');
  const generalRoles = roles.filter(r => r.category === 'general');
  
  // Filter committee members (those with executive positions)
  const executivePositions = executiveRoles.map(r => r.title.toLowerCase());
  const committeeMembers = volunteers.filter(v => 
    executivePositions.includes(v.position?.toLowerCase())
  );

  const getHigherRoles = (currentPosition) => {
    const currentIndex = executiveRoles.findIndex(r => 
      r.title.toLowerCase() === currentPosition?.toLowerCase()
    );
    // Return roles higher than current (lower sort_order), excluding top role (Chairperson/President)
    return executiveRoles.filter((r, i) => i > 0 && (currentIndex === -1 || i < currentIndex));
  };

  const handleReplace = async (newVolunteerId) => {
    if (!selectedMember || !newVolunteerId) return;
    setSaving(true);
    try {
      // If replacing existing member, update old member to general role
      if (selectedMember.id) {
        await fetch(`/api/volunteers/${selectedMember.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ position: 'Volunteer' })
        });
      }
      
      // Update new member with the position
      await fetch(`/api/volunteers/${newVolunteerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position: selectedMember.position })
      });
      
      await fetchData();
      setShowReplaceModal(false);
      setSelectedMember(null);
      setSearchModal('');
    } catch (error) {
      console.error('Error replacing member:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePromote = async (newRole) => {
    if (!selectedMember || !newRole) return;
    setSaving(true);
    try {
      await fetch(`/api/volunteers/${selectedMember.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position: newRole })
      });
      await fetchData();
      setShowPromoteModal(false);
      setSelectedMember(null);
    } catch (error) {
      console.error('Error promoting member:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSetRole = async (volunteerId, newRole) => {
    setSaving(true);
    try {
      await fetch(`/api/volunteers/${volunteerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position: newRole })
      });
      await fetchData();
      setShowRoleModal(false);
      setSelectedVolunteer(null);
    } catch (error) {
      console.error('Error setting role:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDemote = async (volunteer) => {
    const allRoles = [...executiveRoles, ...generalRoles];
    const currentIndex = allRoles.findIndex(r => 
      r.title.toLowerCase() === volunteer.position?.toLowerCase()
    );
    
    if (currentIndex < allRoles.length - 1) {
      const lowerRole = allRoles[currentIndex + 1];
      await handleSetRole(volunteer.id, lowerRole.title);
    }
  };

  // Filter for modal - exclude selected member
  const filteredModalVolunteers = volunteers.filter(v => 
    v.id !== selectedMember?.id &&
    (v.full_name?.toLowerCase().includes(searchModal.toLowerCase()) ||
     v.email?.toLowerCase().includes(searchModal.toLowerCase()) ||
     v.position?.toLowerCase().includes(searchModal.toLowerCase()))
  );

  const filteredGeneralVolunteers = volunteers.filter(v =>
    v.full_name?.toLowerCase().includes(searchGeneral.toLowerCase()) ||
    v.position?.toLowerCase().includes(searchGeneral.toLowerCase()) ||
    v.email?.toLowerCase().includes(searchGeneral.toLowerCase())
  );

  const getPositionColor = (position) => {
    const pos = position?.toLowerCase() || '';
    if (pos.includes('president') || pos.includes('chairperson')) return 'bg-yellow-500';
    if (pos.includes('director') || pos.includes('executive')) return 'bg-primary';
    if (pos.includes('secretary') || pos.includes('treasurer')) return 'bg-purple-500';
    if (pos.includes('coordinator')) return 'bg-blue-500';
    if (pos.includes('leader')) return 'bg-green-500';
    if (pos.includes('senior')) return 'bg-orange-500';
    return 'bg-slate-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB] dark:bg-background-dark">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
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
            <h1 className="text-lg font-bold">Org. Committee</h1>
            <p className="text-xs text-slate-500">Manage organization members</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="sticky top-[60px] z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="flex">
            {[
              { id: 'central', label: 'Central Com.', icon: 'account_balance' },
              { id: 'wings', label: 'Wings', icon: 'diversity_3' },
              { id: 'general', label: 'General', icon: 'groups' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 px-2 text-center border-b-2 transition-all ${
                  activeTab === tab.id 
                    ? 'border-primary text-primary font-bold' 
                    : 'border-transparent text-slate-500'
                }`}
              >
                <span className="material-symbols-outlined text-lg block mb-0.5">{tab.icon}</span>
                <span className="text-xs">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Central Committee Tab */}
        {activeTab === 'central' && (
          <div className="p-4">
            {/* Search */}
            <div className="relative mb-4">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input
                type="text"
                placeholder="Search roles or members..."
                value={searchCentral}
                onChange={(e) => setSearchCentral(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Committee Structure */}
            <div className="space-y-3">
              {executiveRoles
                .filter(role => {
                  if (!searchCentral) return true;
                  const member = volunteers.find(m => m.position?.toLowerCase() === role.title.toLowerCase());
                  return role.title.toLowerCase().includes(searchCentral.toLowerCase()) ||
                         member?.full_name?.toLowerCase().includes(searchCentral.toLowerCase());
                })
                .map((role, index) => {
                const member = volunteers.find(m => 
                  m.position?.toLowerCase() === role.title.toLowerCase()
                );
                const isTopRole = index === 0;
                
                return (
                  <div key={role.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-center gap-3">
                        {/* Position Number */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getPositionColor(role.title)}`}>
                          <span className="text-xs font-bold text-white">{index + 1}</span>
                        </div>
                        
                        {/* Role Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm truncate">{role.title}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${getPositionColor(role.title)}`}>
                              {role.category.toUpperCase()}
                            </span>
                          </div>
                          
                          {member ? (
                            <div className="flex items-center gap-2 mt-1">
                              <img 
                                src={member.avatar || '/avatars/avatar_1.svg'} 
                                alt="" 
                                className="w-5 h-5 rounded-full object-cover"
                              />
                              <span className="text-xs text-slate-600 dark:text-slate-400 truncate">
                                {member.full_name}
                              </span>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 mt-1 italic">Position vacant</p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          {member && (
                            <>
                              <button
                                onClick={() => { setSelectedMember(member); setShowReplaceModal(true); }}
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                                title="Replace"
                              >
                                <span className="material-symbols-outlined text-sm text-slate-400">swap_horiz</span>
                              </button>
                              {!isTopRole && (
                                <button
                                  onClick={() => { setSelectedMember(member); setShowPromoteModal(true); }}
                                  className="p-1.5 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full"
                                  title="Promote"
                                >
                                  <span className="material-symbols-outlined text-sm text-green-500">arrow_upward</span>
                                </button>
                              )}
                            </>
                          )}
                          {!member && (
                            <button
                              onClick={() => { setSelectedMember({ position: role.title }); setShowReplaceModal(true); setSearchModal(''); }}
                              className="p-1.5 hover:bg-primary/10 rounded-full"
                              title="Assign"
                            >
                              <span className="material-symbols-outlined text-sm text-primary">person_add</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {executiveRoles.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <span className="material-symbols-outlined text-4xl mb-2">info</span>
                <p className="text-sm">No roles defined yet</p>
                <p className="text-xs mt-1">Add roles in the Roles page</p>
              </div>
            )}
          </div>
        )}

        {/* Wings Tab */}
        {activeTab === 'wings' && (
          <div className="p-4">
            {/* Search */}
            <div className="relative mb-4">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input
                type="text"
                placeholder="Search wings..."
                value={searchWings}
                onChange={(e) => setSearchWings(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Coming Soon */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl text-purple-500">diversity_3</span>
              </div>
              <h3 className="font-bold text-lg mb-2">Wings Coming Soon</h3>
              <p className="text-sm text-slate-500">
                Wing management will be available in a future update. You'll be able to organize members by Health, Education, Environment, and Social Services wings.
              </p>
            </div>
          </div>
        )}

        {/* General Tab */}
        {activeTab === 'general' && (
          <div className="p-4">
            {/* Search */}
            <div className="relative mb-4">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input
                type="text"
                placeholder="Search all volunteers..."
                value={searchGeneral}
                onChange={(e) => setSearchGeneral(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-white dark:bg-slate-900 rounded-xl p-3 text-center border border-slate-100 dark:border-slate-800">
                <p className="text-2xl font-bold text-primary">{volunteers.length}</p>
                <p className="text-[10px] text-slate-500 uppercase">Total</p>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-xl p-3 text-center border border-slate-100 dark:border-slate-800">
                <p className="text-2xl font-bold text-green-500">{committeeMembers.length}</p>
                <p className="text-[10px] text-slate-500 uppercase">Committee</p>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-xl p-3 text-center border border-slate-100 dark:border-slate-800">
                <p className="text-2xl font-bold text-blue-500">{volunteers.length - committeeMembers.length}</p>
                <p className="text-[10px] text-slate-500 uppercase">General</p>
              </div>
            </div>

            {/* Volunteers List */}
            <div className="space-y-2">
              {filteredGeneralVolunteers.map(volunteer => (
                <div key={volunteer.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-3">
                  <div className="flex items-center gap-3">
                    <img 
                      src={volunteer.avatar || '/avatars/avatar_1.svg'} 
                      alt="" 
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm truncate">{volunteer.full_name}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${getPositionColor(volunteer.position)}`}>
                          {volunteer.position || 'Member'}
                        </span>
                        <span className="text-[10px] text-slate-400">{volunteer.wing}</span>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setSelectedVolunteer(volunteer); setShowRoleModal(true); }}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                        title="Set Role"
                      >
                        <span className="material-symbols-outlined text-sm text-slate-400">badge</span>
                      </button>
                      <button
                        onClick={() => { setSelectedMember(volunteer); setShowPromoteModal(true); }}
                        className="p-1.5 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full"
                        title="Promote"
                      >
                        <span className="material-symbols-outlined text-sm text-green-500">arrow_upward</span>
                      </button>
                      <button
                        onClick={() => handleDemote(volunteer)}
                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
                        title="Demote"
                      >
                        <span className="material-symbols-outlined text-sm text-red-500">arrow_downward</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredGeneralVolunteers.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <span className="material-symbols-outlined text-4xl mb-2">search_off</span>
                <p className="text-sm">No volunteers found</p>
              </div>
            )}
          </div>
        )}

        {/* Replace Modal */}
        {showReplaceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg h-[85vh] overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
                <div>
                  <h3 className="font-bold text-lg">
                    {selectedMember?.full_name ? 'Replace' : 'Assign'} Position
                  </h3>
                  <p className="text-sm text-primary font-medium">{selectedMember?.position}</p>
                </div>
                <button onClick={() => { setShowReplaceModal(false); setSelectedMember(null); setSearchModal(''); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              
              {/* Search Bar */}
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                  <input
                    type="text"
                    placeholder="Search volunteers by name, email, or position..."
                    value={searchModal}
                    onChange={(e) => setSearchModal(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">{filteredModalVolunteers.length} volunteers available</p>
              </div>
              
              <div className="p-4 overflow-y-auto flex-1">
                {selectedMember?.full_name && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-700 dark:text-red-300">
                      <span className="font-bold">{selectedMember.full_name}</span> will be removed from this position and set as "Volunteer"
                    </p>
                  </div>
                )}
                
                <div className="space-y-2">
                  {filteredModalVolunteers.map(v => (
                    <button
                      key={v.id}
                      onClick={() => handleReplace(v.id)}
                      disabled={saving}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-primary/5 hover:border-primary/30 transition-colors text-left disabled:opacity-50"
                    >
                      <img src={v.avatar || '/avatars/avatar_1.svg'} alt="" className="w-12 h-12 rounded-full object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{v.full_name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${getPositionColor(v.position)}`}>
                            {v.position || 'Member'}
                          </span>
                          <span className="text-xs text-slate-500">{v.wing}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 truncate">{v.email}</p>
                      </div>
                      <span className="material-symbols-outlined text-primary">arrow_forward</span>
                    </button>
                  ))}
                  
                  {filteredModalVolunteers.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                      <span className="material-symbols-outlined text-4xl mb-2">search_off</span>
                      <p className="text-sm">No volunteers found</p>
                      <p className="text-xs mt-1">Try a different search term</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Promote Modal */}
        {showPromoteModal && selectedMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm max-h-[80vh] overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-bold">Promote {selectedMember.full_name}</h3>
                <button onClick={() => { setShowPromoteModal(false); setSelectedMember(null); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              
              <div className="p-4 overflow-y-auto flex-1">
                <p className="text-sm text-slate-500 mb-1">Current: <span className="font-bold text-slate-700 dark:text-slate-300">{selectedMember.position}</span></p>
                <p className="text-sm text-slate-500 mb-3">Select a higher position:</p>
                <div className="space-y-2">
                  {getHigherRoles(selectedMember.position).map(role => (
                    <button
                      key={role.id}
                      onClick={() => handlePromote(role.title)}
                      disabled={saving}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors text-left disabled:opacity-50"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getPositionColor(role.title)}`}>
                        <span className="material-symbols-outlined text-sm text-white">arrow_upward</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm">{role.title}</p>
                        <p className="text-xs text-slate-500 truncate">{role.description}</p>
                      </div>
                    </button>
                  ))}
                  {getHigherRoles(selectedMember.position).length === 0 && (
                    <p className="text-center text-slate-500 py-4 text-sm">No higher positions available</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Set Role Modal */}
        {showRoleModal && selectedVolunteer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm max-h-[80vh] overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-bold">Set Role for {selectedVolunteer.full_name}</h3>
                <button onClick={() => { setShowRoleModal(false); setSelectedVolunteer(null); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              
              <div className="p-4 overflow-y-auto flex-1">
                <p className="text-sm text-slate-500 mb-3">Current: <span className="font-bold">{selectedVolunteer.position}</span></p>
                
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Executive Roles</p>
                <div className="space-y-2 mb-4">
                  {executiveRoles.map(role => (
                    <button
                      key={role.id}
                      onClick={() => handleSetRole(selectedVolunteer.id, role.title)}
                      disabled={saving}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition-colors text-left disabled:opacity-50 ${
                        selectedVolunteer.position === role.title 
                          ? 'border-primary bg-primary/10' 
                          : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${getPositionColor(role.title)}`}>
                        {role.sort_order}
                      </div>
                      <span className="text-sm font-medium">{role.title}</span>
                    </button>
                  ))}
                </div>

                <p className="text-xs font-bold text-slate-500 uppercase mb-2">General Roles</p>
                <div className="space-y-2">
                  {generalRoles.map(role => (
                    <button
                      key={role.id}
                      onClick={() => handleSetRole(selectedVolunteer.id, role.title)}
                      disabled={saving}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition-colors text-left disabled:opacity-50 ${
                        selectedVolunteer.position === role.title 
                          ? 'border-primary bg-primary/10' 
                          : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full bg-slate-400 flex items-center justify-center text-xs font-bold text-white">
                        {role.sort_order}
                      </div>
                      <span className="text-sm font-medium">{role.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <VolunteerFooter />
    </div>
  );
}
