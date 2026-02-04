import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VolunteerFooter from '../../components/VolunteerFooter';

export default function AccessManagementPage() {
  const navigate = useNavigate();
  const [mainTab, setMainTab] = useState('general'); // 'general', 'advanced', 'logs'
  const [submenu, setSubmenu] = useState('central');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orgStructure, setOrgStructure] = useState(null);
  const [wings, setWings] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [allVolunteers, setAllVolunteers] = useState([]);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [accessSettings, setAccessSettings] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedWings, setExpandedWings] = useState({});
  const [expandedCampaigns, setExpandedCampaigns] = useState({});
  
  // General tab state
  const [selectedButtons, setSelectedButtons] = useState([]);  // Multiple selection
  const [buttonUsers, setButtonUsers] = useState({});
  const [userSearchQuery, setUserSearchQuery] = useState('');
  
  // Logs state
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logFilter, setLogFilter] = useState('all');

  const volunteerId = localStorage.getItem('volunteerId');

  // Homepage buttons configuration
  const homepageButtons = [
    { id: 'general', label: 'General', icon: 'settings', color: 'blue', permissions: ['org_settings'] },
    { id: 'committee', label: 'Committee', icon: 'group', color: 'green', permissions: [] },
    { id: 'roles', label: 'Roles', icon: 'badge', color: 'purple', permissions: ['role_assign'] },
    { id: 'requests', label: 'Requests', icon: 'campaign', color: 'orange', permissions: ['campaign_approve'] },
    { id: 'donReqs', label: 'Don Reqs', icon: 'volunteer_activism', color: 'teal', permissions: ['donation_requests_view', 'donation_requests_approve'] },
    { id: 'wings', label: 'Wings', icon: 'location_city', color: 'cyan', permissions: ['wing_manage', 'wing_approve'] },
    { id: 'courses', label: 'Courses', icon: 'school', color: 'purple', permissions: ['course_create', 'course_manage'] },
    { id: 'badges', label: 'Badges', icon: 'military_tech', color: 'amber', permissions: ['badge_award'] },
    { id: 'fund', label: 'Fund', icon: 'account_balance', color: 'emerald', permissions: ['ummah_fund_manage'] },
    { id: 'announce', label: 'Announce', icon: 'campaign', color: 'red', permissions: ['announcement_create'] },
    { id: 'access', label: 'Access', icon: 'admin_panel_settings', color: 'indigo', permissions: ['access_manage'] },
  ];

  const advancedSubmenuTabs = [
    { key: 'central', label: 'Central Comm', icon: 'groups' },
    { key: 'wings', label: 'Wing Teams', icon: 'location_city' },
    { key: 'campaigns', label: 'Campaign Teams', icon: 'campaign' },
  ];

  // All available permissions
  const allPermissions = [
    // Donation Permissions
    { id: 'donation_requests_view', label: 'View Donation Requests', category: 'Donations', icon: 'visibility' },
    { id: 'donation_requests_approve', label: 'Approve/Reject Donations', category: 'Donations', icon: 'check_circle' },
    { id: 'donation_collect', label: 'Collect Donations', category: 'Donations', icon: 'volunteer_activism' },
    { id: 'direct_aid_manage', label: 'Manage Direct Aids', category: 'Donations', icon: 'emergency' },
    { id: 'ummah_fund_manage', label: 'Manage Ummah Fund', category: 'Donations', icon: 'account_balance' },
    
    // Campaign Permissions
    { id: 'campaign_create', label: 'Create Campaigns', category: 'Campaigns', icon: 'add_circle' },
    { id: 'campaign_approve', label: 'Approve Campaign Requests', category: 'Campaigns', icon: 'task_alt' },
    { id: 'campaign_manage', label: 'Manage All Campaigns', category: 'Campaigns', icon: 'settings' },
    { id: 'campaign_team_approve', label: 'Approve Campaign Team Requests', category: 'Campaigns', icon: 'group_add' },
    { id: 'campaign_delete', label: 'Delete Campaigns', category: 'Campaigns', icon: 'delete' },
    
    // Wing Permissions
    { id: 'wing_create', label: 'Create Wings', category: 'Wings', icon: 'add_business' },
    { id: 'wing_approve', label: 'Approve Wing Requests', category: 'Wings', icon: 'verified' },
    { id: 'wing_manage', label: 'Manage All Wings', category: 'Wings', icon: 'admin_panel_settings' },
    { id: 'wing_member_approve', label: 'Approve Wing Members', category: 'Wings', icon: 'person_add' },
    { id: 'wing_post_moderate', label: 'Moderate Wing Posts', category: 'Wings', icon: 'shield' },
    
    // Course Permissions
    { id: 'course_create', label: 'Create Courses', category: 'Courses', icon: 'school' },
    { id: 'course_manage', label: 'Manage All Courses', category: 'Courses', icon: 'edit_note' },
    { id: 'certificate_issue', label: 'Issue Certificates', category: 'Courses', icon: 'workspace_premium' },
    
    // User Management
    { id: 'volunteer_manage', label: 'Manage Volunteers', category: 'Users', icon: 'manage_accounts' },
    { id: 'volunteer_verify', label: 'Verify Volunteers', category: 'Users', icon: 'verified_user' },
    { id: 'badge_award', label: 'Award Badges', category: 'Users', icon: 'military_tech' },
    { id: 'role_assign', label: 'Assign Roles', category: 'Users', icon: 'badge' },
    
    // System Permissions
    { id: 'announcement_create', label: 'Create Announcements', category: 'System', icon: 'campaign' },
    { id: 'statistics_view', label: 'View Full Statistics', category: 'System', icon: 'analytics' },
    { id: 'access_manage', label: 'Manage Access Settings', category: 'System', icon: 'security' },
    { id: 'org_settings', label: 'Organization Settings', category: 'System', icon: 'settings' },
  ];

  // Group permissions by category
  const permissionsByCategory = allPermissions.reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  }, {});

  // Fetch all volunteers
  const fetchAllVolunteers = async () => {
    try {
      const res = await fetch('/api/volunteers/all');
      if (res.ok) {
        const data = await res.json();
        setAllVolunteers(data);
      }
    } catch (err) {
      console.error('Failed to fetch volunteers:', err);
    }
  };

  // Fetch button users (who can see each button)
  const fetchButtonUsers = async () => {
    try {
      const res = await fetch('/api/button-access');
      if (res.ok) {
        const data = await res.json();
        setButtonUsers(data);
      }
    } catch (err) {
      console.error('Failed to fetch button users:', err);
    }
  };

  // Save button access for multiple buttons
  const saveButtonAccess = async () => {
    if (selectedButtons.length === 0) return;
    
    setSaving(true);
    try {
      // Save each selected button
      for (const btn of selectedButtons) {
        const userIds = buttonUsers[btn.id] || [];
        await fetch('/api/button-access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ buttonId: btn.id, userIds, updatedBy: volunteerId })
        });
      }
      
      alert(`Access saved for ${selectedButtons.length} button(s)!`);
    } catch (err) {
      console.error('Failed to save button access:', err);
      alert('Failed to save button access');
    } finally {
      setSaving(false);
    }
  };

  // Toggle user for all selected buttons
  const toggleUserForButton = (userId) => {
    if (selectedButtons.length === 0) return;
    
    setButtonUsers(prev => {
      const newState = { ...prev };
      
      // Check if user is assigned to ALL selected buttons
      const isAssignedToAll = selectedButtons.every(btn => 
        (prev[btn.id] || []).includes(userId)
      );
      
      // Toggle for all selected buttons
      selectedButtons.forEach(btn => {
        const currentUsers = prev[btn.id] || [];
        if (isAssignedToAll) {
          // Remove from all
          newState[btn.id] = currentUsers.filter(id => id !== userId);
        } else {
          // Add to all that don't have it
          if (!currentUsers.includes(userId)) {
            newState[btn.id] = [...currentUsers, userId];
          }
        }
      });
      
      return newState;
    });
  };

  // Toggle button selection
  const toggleButtonSelection = (btn) => {
    setSelectedButtons(prev => {
      const isSelected = prev.some(b => b.id === btn.id);
      if (isSelected) {
        return prev.filter(b => b.id !== btn.id);
      } else {
        return [...prev, btn];
      }
    });
  };

  // Select all buttons
  const selectAllButtons = () => {
    setSelectedButtons(homepageButtons);
  };

  // Clear button selection
  const clearButtonSelection = () => {
    setSelectedButtons([]);
  };

  // Fetch logs
  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await fetch('/api/access-logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  // Fetch organization structure
  const fetchOrgStructure = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/org-structure');
      if (res.ok) {
        const data = await res.json();
        setOrgStructure(data);
      }
    } catch (err) {
      console.error('Failed to fetch org structure:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch wings with members
  const fetchWings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/wings?status=approved&includeMembers=true');
      if (res.ok) {
        const data = await res.json();
        setWings(data);
      }
    } catch (err) {
      console.error('Failed to fetch wings:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch campaigns with team members
  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/campaigns?includeTeam=true');
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

  // Fetch access settings for a user/role
  const fetchAccessSettings = async (userId, roleType, roleId) => {
    try {
      const res = await fetch(`/api/access-settings?userId=${userId || ''}&roleType=${roleType || ''}&roleId=${roleId || ''}`);
      if (res.ok) {
        const data = await res.json();
        return data.permissions || {};
      }
    } catch (err) {
      console.error('Failed to fetch access settings:', err);
    }
    return {};
  };

  // Save access settings
  const saveAccessSettings = async () => {
    if (!selectedEntity) return;
    
    setSaving(true);
    try {
      const res = await fetch('/api/access-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedEntity.id,
          roleType: selectedEntity.roleType,
          roleId: selectedEntity.roleId,
          permissions: accessSettings
        })
      });
      
      if (res.ok) {
        alert('Access settings saved successfully!');
      } else {
        throw new Error('Failed to save');
      }
    } catch (err) {
      console.error('Failed to save access settings:', err);
      alert('Failed to save access settings');
    } finally {
      setSaving(false);
    }
  };

  // Toggle permission
  const togglePermission = (permId) => {
    setAccessSettings(prev => ({
      ...prev,
      [permId]: !prev[permId]
    }));
  };

  // Select a user to edit their permissions
  const selectUser = async (user, roleType = 'central', roleId = null) => {
    setSelectedEntity({
      ...user,
      roleType,
      roleId
    });
    
    const settings = await fetchAccessSettings(user.id, roleType, roleId);
    setAccessSettings(settings);
  };

  // Apply preset permissions for a role
  const applyPreset = (preset) => {
    const presets = {
      'chief': allPermissions.reduce((acc, p) => ({ ...acc, [p.id]: true }), {}),
      'director': {
        donation_requests_view: true, donation_requests_approve: true, donation_collect: true,
        campaign_create: true, campaign_approve: true, campaign_manage: true, campaign_team_approve: true,
        wing_manage: true, wing_member_approve: true, wing_post_moderate: true,
        course_create: true, course_manage: true, certificate_issue: true,
        volunteer_manage: true, volunteer_verify: true, badge_award: true,
        announcement_create: true, statistics_view: true
      },
      'coordinator': {
        donation_requests_view: true, donation_collect: true,
        campaign_create: true, campaign_team_approve: true,
        wing_member_approve: true, wing_post_moderate: true,
        course_create: true, certificate_issue: true,
        volunteer_verify: true, badge_award: true,
        announcement_create: true, statistics_view: true
      },
      'wing_chief': {
        donation_requests_view: true, donation_collect: true,
        campaign_create: true, campaign_team_approve: true,
        wing_member_approve: true, wing_post_moderate: true,
        volunteer_verify: true,
        announcement_create: true
      },
      'wing_member': {
        donation_collect: true,
        wing_post_moderate: false,
        statistics_view: false
      },
      'campaign_host': {
        donation_collect: true,
        campaign_team_approve: true
      },
      'volunteer': {
        donation_collect: true
      },
      'none': {}
    };
    
    setAccessSettings(presets[preset] || {});
  };

  useEffect(() => {
    if (mainTab === 'general') {
      fetchAllVolunteers();
      fetchButtonUsers();
      setLoading(false);
    } else if (mainTab === 'advanced') {
      if (submenu === 'central') fetchOrgStructure();
      else if (submenu === 'wings') fetchWings();
      else if (submenu === 'campaigns') fetchCampaigns();
    } else if (mainTab === 'logs') {
      fetchLogs();
    }
  }, [mainTab, submenu]);

  // Filter function
  const filterBySearch = (items, fields) => {
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(item => 
      fields.some(field => item[field]?.toLowerCase().includes(query))
    );
  };

  const filteredVolunteers = allVolunteers.filter(v => {
    if (!userSearchQuery) return true;
    const query = userSearchQuery.toLowerCase();
    return v.full_name?.toLowerCase().includes(query) || v.digital_id?.toLowerCase().includes(query);
  });

  const filteredLogs = logs.filter(log => {
    if (logFilter === 'all') return true;
    return log.action_type === logFilter;
  });

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
      green: 'bg-green-50 dark:bg-green-900/20 text-green-600',
      purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600',
      orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600',
      teal: 'bg-teal-50 dark:bg-teal-900/20 text-teal-600',
      cyan: 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600',
      amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600',
      emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600',
      red: 'bg-red-50 dark:bg-red-900/20 text-red-600',
      indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600',
    };
    return colors[color] || colors.blue;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const renderUserCard = (user, roleType = 'central', roleId = null, showRole = true) => {
    const isSelected = selectedEntity?.id === user.id && selectedEntity?.roleType === roleType;
    
    return (
      <button
        key={`${user.id}-${roleType}-${roleId}`}
        onClick={() => selectUser(user, roleType, roleId)}
        className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left w-full
          ${isSelected 
            ? 'bg-primary/10 border-primary shadow-md' 
            : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-primary/30 hover:shadow-sm'
          }`}
      >
        <img 
          src={user.avatar || '/avatars/avatar_1.svg'} 
          alt={user.full_name} 
          className="w-12 h-12 rounded-full object-cover border-2 border-slate-100 dark:border-slate-700"
        />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate">{user.full_name}</p>
          {showRole && (
            <p className="text-xs text-slate-500 truncate">{user.wing_role || user.position || 'Volunteer'}</p>
          )}
        </div>
        {isSelected && (
          <span className="material-symbols-outlined text-primary">check_circle</span>
        )}
      </button>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen font-display text-gray-900 dark:text-white antialiased flex flex-col">
      <main className="max-w-4xl mx-auto w-full pb-32 flex-1">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 px-4 py-3">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h1 className="text-lg font-bold">Access Management</h1>
              <p className="text-xs text-slate-500">Configure permissions for roles and users</p>
            </div>
          </div>

          {/* Main Tabs: General / Advanced / Logs */}
          <div className="flex border-b border-slate-100 dark:border-slate-800">
            {[
              { key: 'general', label: 'General', icon: 'toggle_on' },
              { key: 'advanced', label: 'Advanced', icon: 'tune' },
              { key: 'logs', label: 'Logs', icon: 'history' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setMainTab(tab.key)}
                className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-all
                  ${mainTab === tab.key 
                    ? 'text-primary border-b-2 border-primary bg-primary/5' 
                    : 'text-gray-500 border-b-2 border-transparent hover:text-gray-700'
                  }`}
              >
                <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ==================== GENERAL TAB ==================== */}
        {mainTab === 'general' && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-slate-500">
                Select buttons (multiple allowed), then assign users who can access them.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={selectAllButtons}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  Select All
                </button>
                <span className="text-slate-300">|</span>
                <button
                  onClick={clearButtonSelection}
                  className="text-xs font-bold text-slate-500 hover:underline"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Homepage Buttons Grid */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              {homepageButtons.map(btn => {
                const isSelected = selectedButtons.some(b => b.id === btn.id);
                const userCount = (buttonUsers[btn.id] || []).length;
                
                return (
                  <button
                    key={btn.id}
                    onClick={() => toggleButtonSelection(btn)}
                    className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border transition-all
                      ${isSelected 
                        ? 'bg-primary/10 border-primary shadow-lg scale-105' 
                        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-primary/30 hover:shadow-md'
                      }`}
                  >
                    {isSelected && (
                      <span className="absolute top-1 left-1 bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[14px]">check</span>
                      </span>
                    )}
                    {userCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                        {userCount}
                      </span>
                    )}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getColorClasses(btn.color)}`}>
                      <span className="material-symbols-outlined">{btn.icon}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">{btn.label}</span>
                  </button>
                );
              })}
            </div>

            {/* User Selection Panel */}
            {selectedButtons.length > 0 && (
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      {selectedButtons.length === 1 ? (
                        <>
                          <span className={`material-symbols-outlined ${getColorClasses(selectedButtons[0].color).split(' ')[1]}`}>
                            {selectedButtons[0].icon}
                          </span>
                          {selectedButtons[0].label} Access
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-primary">checklist</span>
                          {selectedButtons.length} Buttons Selected
                        </>
                      )}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {selectedButtons.length === 1 
                        ? `${(buttonUsers[selectedButtons[0].id] || []).length} users can access this button`
                        : `Editing: ${selectedButtons.map(b => b.label).join(', ')}`
                      }
                    </p>
                  </div>
                  <button
                    onClick={saveButtonAccess}
                    disabled={saving}
                    className="bg-primary text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving ? <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> : <span className="material-symbols-outlined text-sm">save</span>}
                    Save {selectedButtons.length > 1 ? 'All' : ''}
                  </button>
                </div>

                {/* Selected Buttons Preview */}
                {selectedButtons.length > 1 && (
                  <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                    {selectedButtons.map(btn => (
                      <span key={btn.id} className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${getColorClasses(btn.color)}`}>
                        <span className="material-symbols-outlined text-[14px]">{btn.icon}</span>
                        {btn.label}
                        <button onClick={() => toggleButtonSelection(btn)} className="ml-1 hover:opacity-70">
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Search Users */}
                <div className="relative mb-4">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                  <input
                    type="text"
                    placeholder="Search users by name or ID..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Users List */}
                <div className="max-h-[400px] overflow-y-auto space-y-2">
                  {filteredVolunteers.map(user => {
                    // Check if user is assigned to ALL selected buttons
                    const isAssignedToAll = selectedButtons.every(btn => 
                      (buttonUsers[btn.id] || []).includes(user.id)
                    );
                    // Check if user is assigned to SOME selected buttons
                    const isAssignedToSome = selectedButtons.some(btn => 
                      (buttonUsers[btn.id] || []).includes(user.id)
                    );
                    
                    return (
                      <label
                        key={user.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                          ${isAssignedToAll 
                            ? 'bg-primary/10 border-primary' 
                            : isAssignedToSome
                              ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700'
                              : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-primary/30'
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={isAssignedToAll}
                          ref={el => { if (el) el.indeterminate = isAssignedToSome && !isAssignedToAll; }}
                          onChange={() => toggleUserForButton(user.id)}
                          className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                        />
                        <img src={user.avatar || '/avatars/avatar_1.svg'} alt={user.full_name} className="w-10 h-10 rounded-full object-cover" />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate">{user.full_name}</p>
                          <p className="text-xs text-slate-500">{user.digital_id || `ID: ${user.id}`} • {user.position || 'Volunteer'}</p>
                        </div>
                        {isAssignedToSome && !isAssignedToAll && (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">PARTIAL</span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== ADVANCED TAB ==================== */}
        {mainTab === 'advanced' && (
          <>
            {/* Advanced Submenu */}
            <div className="flex border-b border-slate-100 dark:border-slate-800">
              {advancedSubmenuTabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setSubmenu(tab.key);
                    setSelectedEntity(null);
                    setAccessSettings({});
                  }}
                  className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-all
                    ${submenu === tab.key 
                      ? 'text-primary border-b-2 border-primary' 
                      : 'text-gray-500 border-b-2 border-transparent'
                    }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col lg:flex-row">
          {/* Left Panel - User/Role Selection */}
          <div className="lg:w-1/3 border-r border-slate-100 dark:border-slate-800 p-4">
            {/* Search */}
            <div className="relative mb-4">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
              </div>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {/* Central Committee */}
                {submenu === 'central' && orgStructure?.centralCommittee && (
                  <>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Central Committee</h3>
                    {filterBySearch(orgStructure.centralCommittee, ['full_name', 'position']).map(member => 
                      renderUserCard(member, 'central', null)
                    )}
                    
                    {orgStructure.wingChiefs?.length > 0 && (
                      <>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-6 mb-2">Wing Chiefs</h3>
                        {filterBySearch(orgStructure.wingChiefs, ['full_name', 'wing_name', 'wing_role']).map(chief => 
                          renderUserCard(chief, 'wing_chief', chief.wing_id)
                        )}
                      </>
                    )}
                  </>
                )}

                {/* Wings */}
                {submenu === 'wings' && wings.length > 0 && (
                  <>
                    {filterBySearch(wings, ['name']).map(wing => (
                      <div key={wing.id} className="mb-3">
                        <button
                          onClick={() => setExpandedWings(prev => ({ ...prev, [wing.id]: !prev[wing.id] }))}
                          className="flex items-center gap-3 w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          <img 
                            src={wing.image || '/avatars/avatar_1.svg'} 
                            alt={wing.name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                          <div className="flex-1 text-left">
                            <p className="font-bold text-sm">{wing.name}</p>
                            <p className="text-xs text-slate-500">{wing.member_count || 0} members</p>
                          </div>
                          <span className={`material-symbols-outlined transition-transform ${expandedWings[wing.id] ? 'rotate-180' : ''}`}>
                            expand_more
                          </span>
                        </button>
                        
                        {expandedWings[wing.id] && wing.members && (
                          <div className="mt-2 ml-4 space-y-2">
                            {wing.members.map(member => 
                              renderUserCard(member, 'wing_member', wing.id)
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </>
                )}

                {/* Campaigns */}
                {submenu === 'campaigns' && campaigns.length > 0 && (
                  <>
                    {filterBySearch(campaigns, ['title']).map(campaign => (
                      <div key={campaign.id} className="mb-3">
                        <button
                          onClick={() => setExpandedCampaigns(prev => ({ ...prev, [campaign.id]: !prev[campaign.id] }))}
                          className="flex items-center gap-3 w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          <div 
                            className="w-10 h-10 rounded-lg bg-cover bg-center"
                            style={{ backgroundImage: `url('${campaign.image || '/avatars/avatar_1.svg'}')` }}
                          />
                          <div className="flex-1 text-left">
                            <p className="font-bold text-sm truncate">{campaign.title}</p>
                            <p className="text-xs text-slate-500">{campaign.team_count || 0} team members</p>
                          </div>
                          <span className={`material-symbols-outlined transition-transform ${expandedCampaigns[campaign.id] ? 'rotate-180' : ''}`}>
                            expand_more
                          </span>
                        </button>
                        
                        {expandedCampaigns[campaign.id] && campaign.team && (
                          <div className="mt-2 ml-4 space-y-2">
                            {campaign.team.map(member => 
                              renderUserCard({ ...member, wing_role: member.role }, 'campaign_member', campaign.id)
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right Panel - Permission Editor */}
          <div className="lg:w-2/3 p-4">
            {selectedEntity ? (
              <>
                {/* Selected User Header */}
                <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-2xl p-4 border border-primary/20 mb-4">
                  <div className="flex items-center gap-4">
                    <img 
                      src={selectedEntity.avatar || '/avatars/avatar_1.svg'} 
                      alt={selectedEntity.full_name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-primary"
                    />
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{selectedEntity.full_name}</h3>
                      <p className="text-sm text-slate-500">
                        {selectedEntity.wing_role || selectedEntity.position || 'Volunteer'}
                        {selectedEntity.wing_name && ` • ${selectedEntity.wing_name}`}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        ID: {selectedEntity.digital_id || selectedEntity.id}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="mb-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Quick Presets</p>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => applyPreset('chief')} className="px-3 py-1.5 text-xs font-bold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors">
                      Full Access (Chief)
                    </button>
                    <button onClick={() => applyPreset('director')} className="px-3 py-1.5 text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
                      Director
                    </button>
                    <button onClick={() => applyPreset('coordinator')} className="px-3 py-1.5 text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors">
                      Coordinator
                    </button>
                    <button onClick={() => applyPreset('wing_chief')} className="px-3 py-1.5 text-xs font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors">
                      Wing Chief
                    </button>
                    <button onClick={() => applyPreset('wing_member')} className="px-3 py-1.5 text-xs font-bold bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 rounded-full hover:bg-cyan-200 dark:hover:bg-cyan-900/50 transition-colors">
                      Wing Member
                    </button>
                    <button onClick={() => applyPreset('campaign_host')} className="px-3 py-1.5 text-xs font-bold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors">
                      Campaign Host
                    </button>
                    <button onClick={() => applyPreset('volunteer')} className="px-3 py-1.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                      Basic Volunteer
                    </button>
                    <button onClick={() => applyPreset('none')} className="px-3 py-1.5 text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">
                      Clear All
                    </button>
                  </div>
                </div>

                {/* Permissions by Category */}
                <div className="space-y-4 max-h-[50vh] overflow-y-auto">
                  {Object.entries(permissionsByCategory).map(([category, permissions]) => (
                    <div key={category} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
                      <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2 border-b border-slate-100 dark:border-slate-700">
                        <h4 className="font-bold text-sm">{category}</h4>
                      </div>
                      <div className="p-2">
                        {permissions.map(perm => (
                          <label
                            key={perm.id}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={accessSettings[perm.id] || false}
                              onChange={() => togglePermission(perm.id)}
                              className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                            />
                            <span className="material-symbols-outlined text-slate-400">{perm.icon}</span>
                            <span className="flex-1 text-sm">{perm.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Save Button */}
                <div className="sticky bottom-20 mt-4 bg-white dark:bg-gray-900 pt-4">
                  <button
                    onClick={saveAccessSettings}
                    disabled={saving}
                    className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                  >
                    {saving ? (
                      <>
                        <span className="material-symbols-outlined animate-spin">progress_activity</span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">save</span>
                        Save Access Settings
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-700 mb-4">admin_panel_settings</span>
                <h3 className="font-bold text-lg text-slate-600 dark:text-slate-400 mb-2">Select a User or Role</h3>
                <p className="text-sm text-slate-400 max-w-sm">
                  Choose a user from the left panel to configure their access permissions
                </p>
              </div>
            )}
          </div>
            </div>
          </>
        )}

        {/* ==================== LOGS TAB ==================== */}
        {mainTab === 'logs' && (
          <div className="p-4">
            {/* Log Filters */}
            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
              {[
                { key: 'all', label: 'All' },
                { key: 'donation_approved', label: 'Donations' },
                { key: 'campaign_approved', label: 'Campaigns' },
                { key: 'wing_approved', label: 'Wings' },
                { key: 'access_changed', label: 'Access' },
                { key: 'badge_awarded', label: 'Badges' },
              ].map(filter => (
                <button
                  key={filter.key}
                  onClick={() => setLogFilter(filter.key)}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors
                    ${logFilter === filter.key 
                      ? 'bg-primary text-white' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {logsLoading ? (
              <div className="flex items-center justify-center py-12">
                <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-700 mb-2">history</span>
                <p className="text-slate-500">No logs found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLogs.map(log => (
                  <div key={log.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        log.action_type?.includes('approved') ? 'bg-green-100 dark:bg-green-900/30 text-green-600' :
                        log.action_type?.includes('rejected') ? 'bg-red-100 dark:bg-red-900/30 text-red-600' :
                        'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                      }`}>
                        <span className="material-symbols-outlined text-xl">
                          {log.action_type?.includes('approved') ? 'check_circle' :
                           log.action_type?.includes('rejected') ? 'cancel' :
                           log.action_type?.includes('access') ? 'admin_panel_settings' :
                           log.action_type?.includes('badge') ? 'military_tech' :
                           'history'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm">{log.action_description || log.action_type}</p>
                        <p className="text-xs text-slate-500 mt-1">{log.details}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">person</span>
                            {log.actor_name || `UID: ${log.actor_id}`}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">schedule</span>
                            {formatDate(log.created_at)}
                          </span>
                          {log.target_id && (
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">tag</span>
                              Target: {log.target_id}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
      <VolunteerFooter />
    </div>
  );
}
