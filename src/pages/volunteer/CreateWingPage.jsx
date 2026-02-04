import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import VolunteerFooter from '../../components/VolunteerFooter';

const WING_ROLES = [
  { role: 'Wing Chief Executive', description: 'Overall wing leadership and decision-making', sort_order: 1 },
  { role: 'Wing Deputy Executive', description: 'Supports chief and handles coordination', sort_order: 2 },
  { role: 'Wing Secretary', description: 'Documentation and communications', sort_order: 3 },
  { role: 'Wing Treasurer', description: 'Financial management and budgets', sort_order: 4 },
  { role: 'Wing Coordinator', description: 'Operations and logistics coordination', sort_order: 5 },
  { role: 'Wing Senior Member', description: 'Experienced member with responsibilities', sort_order: 6 },
  { role: 'Wing Member', description: 'Active participating member', sort_order: 7 }
];

export default function CreateWingPage() {
  const navigate = useNavigate();
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [volunteers, setVolunteers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  const volunteerId = localStorage.getItem('volunteerId');

  // Check access on mount
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const res = await fetch(`/api/access-settings/user/${volunteerId}`);
        if (res.ok) {
          const data = await res.json();
          const canAccess = data.permissions?.includes('wing_create') || 
                           data.permissions?.includes('wing_manage') ||
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
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    location: '',
    members: []
  });

  useEffect(() => {
    if (hasAccess) fetchVolunteers();
  }, [hasAccess]);

  const fetchVolunteers = async () => {
    try {
      const res = await fetch('/api/volunteers/all');
      if (res.ok) {
        const data = await res.json();
        setVolunteers(data);
      }
    } catch (err) {
      console.error('Failed to fetch volunteers:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Wing name is required');
      return;
    }

    setSaving(true);
    try {
      const volunteerId = localStorage.getItem('volunteerId');
      const res = await fetch('/api/wings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          createdBy: volunteerId
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        navigate('/volunteer/wings');
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create wing');
      }
    } catch (err) {
      console.error('Failed to create wing:', err);
      alert('Failed to create wing');
    } finally {
      setSaving(false);
    }
  };

  const addMember = (volunteer, role) => {
    // Check if already added
    if (formData.members.find(m => m.volunteerId === volunteer.id)) {
      alert('This member is already added');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      members: [...prev.members, {
        volunteerId: volunteer.id,
        fullName: volunteer.full_name,
        avatar: volunteer.avatar,
        role: role
      }]
    }));
    
    setShowMemberModal(false);
    setSelectedRole(null);
    setSearchQuery('');
  };

  const removeMember = (volunteerId) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.filter(m => m.volunteerId !== volunteerId)
    }));
  };

  const updateMemberRole = (volunteerId, newRole) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.map(m => 
        m.volunteerId === volunteerId ? { ...m, role: newRole } : m
      )
    }));
  };

  const filteredVolunteers = volunteers.filter(v =>
    !formData.members.find(m => m.volunteerId === v.id) &&
    (v.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     v.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     v.digital_id?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Get members grouped by role
  const getMembersByRole = (role) => formData.members.filter(m => m.role === role);

  if (checkingAccess) {
    return (
      <div className="min-h-screen bg-[#F5F7FB] dark:bg-background-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-[#F5F7FB] dark:bg-background-dark flex items-center justify-center p-4">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-red-500 mb-4">lock</span>
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">You don't have permission to create wings.</p>
          <button onClick={() => navigate('/volunteer')} className="px-4 py-2 bg-green-600 text-white rounded-lg">
            Go Home
          </button>
        </div>
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
            <h1 className="text-lg font-bold">Create Wing</h1>
            <p className="text-xs text-slate-500">Set up a new organizational branch</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4">
          {/* Wing Image */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
              Wing Image
            </label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                {formData.image ? (
                  <img src={formData.image} alt="Wing" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-3xl text-slate-400">location_city</span>
                )}
              </div>
              <div className="flex-1">
                <input
                  type="url"
                  placeholder="Enter image URL..."
                  value={formData.image}
                  onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <p className="text-[10px] text-slate-400 mt-1">Paste an image URL for the wing logo</p>
              </div>
            </div>
          </div>

          {/* Wing Name */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
              Wing Name *
            </label>
            <input
              type="text"
              placeholder="e.g., Gazipur Wing"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              required
            />
          </div>

          {/* Description */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
              Description
            </label>
            <textarea
              placeholder="Describe the wing's purpose, goals, and activities..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>

          {/* Operating Location */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
              Operating Location
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">location_on</span>
              <input
                type="text"
                placeholder="e.g., Gazipur, Dhaka"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full pl-10 pr-3 py-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          {/* Wing Command Members */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm">Wing Command</h3>
                  <p className="text-xs text-slate-500">Assign members to wing roles</p>
                </div>
                <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                  {formData.members.length} assigned
                </span>
              </div>
            </div>

            {/* Role Slots */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {WING_ROLES.map((roleInfo) => {
                const assignedMembers = getMembersByRole(roleInfo.role);
                
                return (
                  <div key={roleInfo.role} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="text-sm font-bold">{roleInfo.role}</h4>
                        <p className="text-[10px] text-slate-400">{roleInfo.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRole(roleInfo.role);
                          setShowMemberModal(true);
                        }}
                        className="p-1.5 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">add</span>
                      </button>
                    </div>
                    
                    {/* Assigned Members */}
                    {assignedMembers.length > 0 ? (
                      <div className="space-y-2 mt-2">
                        {assignedMembers.map((member) => (
                          <div key={member.volunteerId} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                              {member.avatar ? (
                                <img src={member.avatar} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <span className="material-symbols-outlined text-sm text-slate-400">person</span>
                                </div>
                              )}
                            </div>
                            <span className="flex-1 text-xs font-medium truncate">{member.fullName}</span>
                            <button
                              type="button"
                              onClick={() => removeMember(member.volunteerId)}
                              className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
                            >
                              <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No one assigned yet</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={saving || !formData.name.trim()}
            className="w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
                Creating...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">add_circle</span>
                Create Wing
              </>
            )}
          </button>

          <p className="text-xs text-center text-slate-400">
            Wing will be submitted for approval
          </p>
        </form>
      </main>

      {/* Add Member Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-xl max-h-[80vh] flex flex-col">
            {/* Modal Header */}
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

            {/* Search */}
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

            {/* Volunteer List */}
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
                      type="button"
                      onClick={() => addMember(volunteer, selectedRole)}
                      className="w-full p-4 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
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

      <VolunteerFooter />
    </div>
  );
}
