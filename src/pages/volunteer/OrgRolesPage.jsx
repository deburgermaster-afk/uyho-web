import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import VolunteerFooter from '../../components/VolunteerFooter';

export default function OrgRolesPage() {
  const navigate = useNavigate();
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [loading, setLoading] = useState(true);
  const [executiveRoles, setExecutiveRoles] = useState([]);
  const [generalRoles, setGeneralRoles] = useState([]);
  const [editingRole, setEditingRole] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addCategory, setAddCategory] = useState('');
  const [newRole, setNewRole] = useState({ title: '', description: '' });

  const volunteerId = localStorage.getItem('volunteerId');

  // Check access on mount
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const res = await fetch(`/api/access-settings/user/${volunteerId}`);
        if (res.ok) {
          const data = await res.json();
          const canAccess = data.permissions?.includes('role_assign') || 
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
    if (hasAccess) fetchRoles();
  }, [hasAccess]);

  const fetchRoles = async () => {
    try {
      const res = await fetch('/api/roles');
      if (res.ok) {
        const data = await res.json();
        setExecutiveRoles(data.filter(r => r.category === 'executive'));
        setGeneralRoles(data.filter(r => r.category === 'general'));
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (role) => {
    setEditingRole(role.id);
    setEditForm({ title: role.title, description: role.description });
  };

  const handleSave = async () => {
    if (!editingRole) return;
    
    setSaving(true);
    try {
      const res = await fetch(`/api/roles/${editingRole}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        // Update local state
        setExecutiveRoles(prev => prev.map(r => 
          r.id === editingRole ? { ...r, ...editForm } : r
        ));
        setGeneralRoles(prev => prev.map(r => 
          r.id === editingRole ? { ...r, ...editForm } : r
        ));
        setEditingRole(null);
      }
    } catch (error) {
      console.error('Error saving role:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddRole = async () => {
    if (!newRole.title || !addCategory) return;
    
    setSaving(true);
    try {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newRole, category: addCategory })
      });
      if (res.ok) {
        const data = await res.json();
        const newRoleData = { id: data.id, ...newRole, category: addCategory };
        if (addCategory === 'executive') {
          setExecutiveRoles(prev => [...prev, newRoleData]);
        } else {
          setGeneralRoles(prev => [...prev, newRoleData]);
        }
        setShowAddModal(false);
        setNewRole({ title: '', description: '' });
        setAddCategory('');
      }
    } catch (error) {
      console.error('Error adding role:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, category) => {
    if (!confirm('Are you sure you want to delete this role?')) return;
    
    try {
      const res = await fetch(`/api/roles/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (category === 'executive') {
          setExecutiveRoles(prev => prev.filter(r => r.id !== id));
        } else {
          setGeneralRoles(prev => prev.filter(r => r.id !== id));
        }
      }
    } catch (error) {
      console.error('Error deleting role:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB] dark:bg-background-dark">
        <span className="material-symbols-outlined animate-spin text-4xl text-[#0B1B33] dark:text-white">
          progress_activity
        </span>
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
            <h1 className="text-lg font-bold">Organization Roles</h1>
            <p className="text-xs text-slate-500">Manage positions and hierarchy</p>
          </div>
        </div>

        {/* Executive Committee Section */}
        <section className="px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏛</span>
              <div>
                <h2 className="text-base font-bold text-[#0B1B33] dark:text-white">
                  Central Executive Committee
                </h2>
                <p className="text-xs text-slate-500">{executiveRoles.length} positions</p>
              </div>
            </div>
            <button
              onClick={() => { setAddCategory('executive'); setShowAddModal(true); }}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-primary"
            >
              <span className="material-symbols-outlined">add</span>
            </button>
          </div>

          <div className="space-y-3">
            {executiveRoles.map((role, index) => (
              <div
                key={role.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden"
              >
                {editingRole === role.id ? (
                  <div className="p-4 space-y-3">
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full text-sm font-bold bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Role title"
                    />
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full text-sm bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      placeholder="Role description"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingRole(null)}
                        className="flex-1 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 py-2 text-sm bg-primary text-white rounded-lg disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-sm font-bold text-primary">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-sm text-[#0B1B33] dark:text-white">
                            {role.title}
                          </h3>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            {role.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(role)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                        >
                          <span className="material-symbols-outlined text-sm text-slate-400">edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(role.id, 'executive')}
                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
                        >
                          <span className="material-symbols-outlined text-sm text-red-400">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Divider */}
        <div className="px-4">
          <div className="border-t border-dashed border-slate-200 dark:border-slate-800"></div>
        </div>

        {/* General Members Structure */}
        <section className="px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">👥</span>
              <div>
                <h2 className="text-base font-bold text-[#0B1B33] dark:text-white">
                  General Members Structure
                </h2>
                <p className="text-xs text-slate-500">{generalRoles.length} levels</p>
              </div>
            </div>
            <button
              onClick={() => { setAddCategory('general'); setShowAddModal(true); }}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-primary"
            >
              <span className="material-symbols-outlined">add</span>
            </button>
          </div>

          {/* Hierarchy Visualization */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            {generalRoles.map((role, index) => (
              <div
                key={role.id}
                className={`relative ${index !== generalRoles.length - 1 ? 'border-b border-slate-100 dark:border-slate-800' : ''}`}
              >
                {editingRole === role.id ? (
                  <div className="p-4 space-y-3">
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full text-sm font-bold bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Role title"
                    />
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={2}
                      className="w-full text-sm bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      placeholder="Role description"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingRole(null)}
                        className="flex-1 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 py-2 text-sm bg-primary text-white rounded-lg disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 flex items-center gap-3" style={{ paddingLeft: `${16 + index * 12}px` }}>
                    {/* Hierarchy line indicator */}
                    {index > 0 && (
                      <div className="absolute left-4 top-0 h-1/2 w-px bg-slate-200 dark:bg-slate-700" style={{ left: `${8 + (index - 1) * 12}px` }}></div>
                    )}
                    {index > 0 && (
                      <div className="absolute left-4 top-1/2 w-2 h-px bg-slate-200 dark:bg-slate-700" style={{ left: `${8 + (index - 1) * 12}px` }}></div>
                    )}
                    
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                      index === 0 ? 'bg-primary' :
                      index === 1 ? 'bg-blue-500' :
                      index === 2 ? 'bg-green-500' :
                      index === 3 ? 'bg-yellow-500' :
                      index === 4 ? 'bg-orange-500' :
                      'bg-slate-400'
                    }`}></div>
                    
                    <div className="flex-1">
                      <h3 className="font-bold text-sm text-[#0B1B33] dark:text-white">
                        {role.title}
                      </h3>
                      {role.description && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {role.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(role)}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                      >
                        <span className="material-symbols-outlined text-sm text-slate-400">edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(role.id, 'general')}
                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
                      >
                        <span className="material-symbols-outlined text-sm text-red-400">delete</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
            <p className="text-xs text-slate-500 font-medium mb-2">Hierarchy Flow</p>
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <span className="material-symbols-outlined text-sm">arrow_downward</span>
              <span>Top to bottom represents reporting structure</span>
            </div>
          </div>
        </section>

        {/* Add Role Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-bold">
                  Add {addCategory === 'executive' ? 'Executive' : 'General'} Role
                </h3>
                <button
                  onClick={() => { setShowAddModal(false); setNewRole({ title: '', description: '' }); }}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              
              <div className="p-4 space-y-4">
                <div>
                  <label className="text-xs text-slate-500 uppercase font-bold mb-2 block">Title</label>
                  <input
                    type="text"
                    placeholder="Role title"
                    value={newRole.title}
                    onChange={(e) => setNewRole(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full text-sm bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                
                <div>
                  <label className="text-xs text-slate-500 uppercase font-bold mb-2 block">Description</label>
                  <textarea
                    placeholder="Role description (optional)"
                    value={newRole.description}
                    onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full text-sm bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>
              </div>

              <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                <button
                  onClick={() => { setShowAddModal(false); setNewRole({ title: '', description: '' }); }}
                  className="flex-1 py-2.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddRole}
                  disabled={!newRole.title || saving}
                  className="flex-1 py-2.5 text-sm bg-primary text-white rounded-lg disabled:opacity-50"
                >
                  {saving ? 'Adding...' : 'Add Role'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <VolunteerFooter />
    </div>
  );
}
