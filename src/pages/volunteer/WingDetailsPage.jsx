import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import VolunteerFooter from '../../components/VolunteerFooter';

const WING_ROLES = [
  { role: 'Wing Chief Executive', sort_order: 1 },
  { role: 'Wing Deputy Executive', sort_order: 2 },
  { role: 'Wing Secretary', sort_order: 3 },
  { role: 'Wing Treasurer', sort_order: 4 },
  { role: 'Wing Coordinator', sort_order: 5 },
  { role: 'Wing Senior Member', sort_order: 6 },
  { role: 'Wing Member', sort_order: 7 }
];

export default function WingDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [wing, setWing] = useState(null);
  const [volunteers, setVolunteers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  
  const volunteerId = localStorage.getItem('volunteerId');

  useEffect(() => {
    checkAccessAndFetchData();
  }, [id]);

  const checkAccessAndFetchData = async () => {
    setLoading(true);
    try {
      // Admin email has full access
      const userEmail = localStorage.getItem('volunteerEmail') || '';
      const isSuperAdmin = userEmail.toLowerCase() === 'istiak.ahmed.tj@gmail.com';
      
      // Check if user has access (is admin or wing chief)
      const [wingRes, volunteersRes, accessRes] = await Promise.all([
        fetch(`/api/wings/${id}?includeMembers=true`),
        fetch('/api/volunteers/all'),
        fetch(`/api/access-settings/user/${volunteerId}`)
      ]);
      
      if (wingRes.ok) {
        const data = await wingRes.json();
        setWing(data);
        
        // Check if user is wing chief or has admin access
        const isWingChief = data.members?.some(m => 
          String(m.id) === String(volunteerId) && 
          ['Wing Chief Executive', 'Wing Deputy Executive'].includes(m.role)
        );
        
        let isAdmin = isSuperAdmin;
        if (!isAdmin && accessRes.ok) {
          const accessData = await accessRes.json();
          isAdmin = accessData.permissions?.includes('org_settings') || 
                    accessData.permissions?.includes('wing_manage') ||
                    accessData.role === 'Admin';
        }
        
        if (!isWingChief && !isAdmin) {
          // Redirect to view page if no access
          navigate(`/volunteer/wing/${id}`, { replace: true });
          return;
        }
        
        setHasAccess(true);
      }
      
      if (volunteersRes.ok) {
        const data = await volunteersRes.json();
        setVolunteers(data);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [wingRes, volunteersRes] = await Promise.all([
        fetch(`/api/wings/${id}`),
        fetch('/api/volunteers/all')
      ]);
      
      if (wingRes.ok) {
        const data = await wingRes.json();
        setWing(data);
      }
      
      if (volunteersRes.ok) {
        const data = await volunteersRes.json();
        setVolunteers(data);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const addMember = async (volunteer, role) => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/wings/${id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volunteerId: volunteer.id, role })
      });
      
      if (res.ok) {
        await fetchData();
        setShowMemberModal(false);
        setSelectedRole(null);
        setSearchQuery('');
      }
    } catch (err) {
      console.error('Failed to add member:', err);
    } finally {
      setProcessing(false);
    }
  };

  const updateMemberRole = async (memberId, newRole) => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/wings/${id}/members/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      
      if (res.ok) {
        await fetchData();
        setShowEditModal(false);
        setEditingMember(null);
      }
    } catch (err) {
      console.error('Failed to update member:', err);
    } finally {
      setProcessing(false);
    }
  };

  const removeMember = async (memberId) => {
    if (!confirm('Remove this member from the wing?')) return;
    
    setProcessing(true);
    try {
      const res = await fetch(`/api/wings/${id}/members/${memberId}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to remove member:', err);
    } finally {
      setProcessing(false);
    }
  };

  const getMembersByRole = (role) => wing?.members?.filter(m => m.role === role) || [];

  const filteredVolunteers = volunteers.filter(v =>
    !wing?.members?.find(m => m.volunteer_id === v.id) &&
    (v.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     v.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     v.digital_id?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getRoleBadgeColor = (role) => {
    if (role.includes('Chief')) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    if (role.includes('Deputy')) return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    if (role.includes('Secretary')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    if (role.includes('Treasurer')) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (role.includes('Coordinator')) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    if (role.includes('Senior')) return 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400';
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB] dark:bg-background-dark">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>
    );
  }

  if (!wing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB] dark:bg-background-dark">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 block">error</span>
          <p className="text-slate-500">Wing not found</p>
          <button onClick={() => navigate('/volunteer/wings')} className="mt-4 text-primary font-medium">
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FB] dark:bg-background-dark">
      <main className="max-w-md mx-auto pb-32">
        {/* Header with Wing Image */}
        <div className="relative">
          <div className="h-40 bg-slate-200 dark:bg-slate-800">
            {wing.image ? (
              <img src={wing.image} alt={wing.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="material-symbols-outlined text-6xl text-slate-400">location_city</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
          
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 p-2 bg-black/30 backdrop-blur-sm text-white rounded-full hover:bg-black/50 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>

          {/* Wing Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <div className="flex items-center gap-2 mb-1">
              {wing.approval_status === 'approved' ? (
                <span className="text-[10px] font-bold bg-green-500 px-2 py-0.5 rounded">Active</span>
              ) : wing.approval_status === 'pending' ? (
                <span className="text-[10px] font-bold bg-yellow-500 px-2 py-0.5 rounded">Pending Approval</span>
              ) : (
                <span className="text-[10px] font-bold bg-red-500 px-2 py-0.5 rounded">Declined</span>
              )}
            </div>
            <h1 className="text-xl font-bold">{wing.name}</h1>
            <p className="text-sm text-white/80 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">location_on</span>
              {wing.location || 'Location TBD'}
            </p>
          </div>
        </div>

        {/* Description */}
        {wing.description && (
          <div className="px-4 py-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">About</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">{wing.description}</p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="px-4 pb-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
              <p className="text-2xl font-bold text-primary">{wing.members?.length || 0}</p>
              <p className="text-[10px] text-slate-500 uppercase">Members</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
              <p className="text-2xl font-bold text-green-500">0</p>
              <p className="text-[10px] text-slate-500 uppercase">Campaigns</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
              <p className="text-2xl font-bold text-blue-500">0</p>
              <p className="text-[10px] text-slate-500 uppercase">Events</p>
            </div>
          </div>
        </div>

        {/* Wing Command / Members */}
        <div className="px-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold">Wing Command</h3>
                <p className="text-xs text-slate-500">{wing.members?.length || 0} members assigned</p>
              </div>
            </div>

            {/* Roles and Members */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {WING_ROLES.map((roleInfo) => {
                const members = getMembersByRole(roleInfo.role);
                
                return (
                  <div key={roleInfo.role} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-bold">{roleInfo.role}</h4>
                      <button
                        onClick={() => {
                          setSelectedRole(roleInfo.role);
                          setShowMemberModal(true);
                        }}
                        className="p-1.5 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">add</span>
                      </button>
                    </div>
                    
                    {members.length > 0 ? (
                      <div className="space-y-2">
                        {members.map((member) => (
                          <div
                            key={member.volunteer_id}
                            className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg"
                          >
                            <div 
                              onClick={() => navigate(`/volunteer/profile/${member.volunteer_id}`)}
                              className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden cursor-pointer"
                            >
                              {member.avatar ? (
                                <img src={member.avatar} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <span className="material-symbols-outlined text-slate-400">person</span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p 
                                onClick={() => navigate(`/volunteer/profile/${member.volunteer_id}`)}
                                className="text-sm font-medium truncate cursor-pointer hover:text-primary"
                              >
                                {member.full_name}
                              </p>
                              <p className="text-[10px] text-slate-400">{member.digital_id}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setEditingMember(member);
                                  setShowEditModal(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                              >
                                <span className="material-symbols-outlined text-sm">edit</span>
                              </button>
                              <button
                                onClick={() => removeMember(member.volunteer_id)}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                              >
                                <span className="material-symbols-outlined text-sm">close</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No one assigned</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Add Member Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold">Add Member</h3>
                <p className="text-xs text-slate-500">Assign to: <span className="text-primary font-medium">{selectedRole}</span></p>
              </div>
              <button
                onClick={() => {
                  setShowMemberModal(false);
                  setSelectedRole(null);
                  setSearchQuery('');
                }}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                <input
                  type="text"
                  placeholder="Search volunteers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredVolunteers.length === 0 ? (
                <div className="p-8 text-center">
                  <span className="material-symbols-outlined text-4xl text-slate-300 mb-2 block">person_search</span>
                  <p className="text-sm text-slate-500">No volunteers found</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredVolunteers.slice(0, 20).map((volunteer) => (
                    <button
                      key={volunteer.id}
                      onClick={() => addMember(volunteer, selectedRole)}
                      disabled={processing}
                      className="w-full p-4 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left disabled:opacity-50"
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        {volunteer.avatar ? (
                          <img src={volunteer.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-slate-400">person</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{volunteer.full_name}</p>
                        <p className="text-xs text-slate-500">{volunteer.digital_id}</p>
                      </div>
                      <span className="material-symbols-outlined text-primary">add_circle</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {showEditModal && editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold">Change Role</h3>
              <p className="text-xs text-slate-500">{editingMember.full_name}</p>
            </div>

            <div className="p-2 max-h-[50vh] overflow-y-auto">
              {WING_ROLES.map((roleInfo) => (
                <button
                  key={roleInfo.role}
                  onClick={() => updateMemberRole(editingMember.volunteer_id, roleInfo.role)}
                  disabled={processing}
                  className={`w-full p-3 text-left rounded-lg mb-1 transition-colors ${
                    editingMember.role === roleInfo.role
                      ? 'bg-primary text-white'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <p className="text-sm font-medium">{roleInfo.role}</p>
                </button>
              ))}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingMember(null);
                }}
                className="w-full py-2.5 text-sm font-bold text-slate-600 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <VolunteerFooter />
    </div>
  );
}
