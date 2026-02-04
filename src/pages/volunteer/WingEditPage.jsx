import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';

export default function WingEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('general');
  const [wing, setWing] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [members, setMembers] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [posts, setPosts] = useState([]);
  const [postSearch, setPostSearch] = useState('');
  const [editingPost, setEditingPost] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  
  // Ummah Fund states
  const [fundSummary, setFundSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [wingDonations, setWingDonations] = useState([]);
  const [showFundTransferModal, setShowFundTransferModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [transferForm, setTransferForm] = useState({ toType: '', toId: '', amount: '', note: '' });
  const [expenseForm, setExpenseForm] = useState({ title: '', description: '', amount: '', category: 'General', invoiceImage: '' });
  const [uploadingInvoice, setUploadingInvoice] = useState(false);
  const [transferTargets, setTransferTargets] = useState({ wings: [], campaigns: [], directAids: [] });
  
  // Form state
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [description, setDescription] = useState('');
  const [joinApprovalRequired, setJoinApprovalRequired] = useState(false);
  const [profileImage, setProfileImage] = useState('');
  const [coverImage, setCoverImage] = useState('');
  
  const profileInputRef = useRef(null);
  const coverInputRef = useRef(null);
  
  const volunteerId = localStorage.getItem('volunteerId');
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

  const wingRoles = [
    { role: 'Wing Chief Executive', sort_order: 1 },
    { role: 'Wing Deputy Executive', sort_order: 2 },
    { role: 'Wing Secretary', sort_order: 3 },
    { role: 'Wing Treasurer', sort_order: 4 },
    { role: 'Wing Coordinator', sort_order: 5 },
    { role: 'Wing Senior Member', sort_order: 6 }
  ];

  useEffect(() => {
    fetchWingSettings();
    fetchMembers();
    fetchFundData();
    fetchTransferTargets();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'requests') {
      fetchJoinRequests();
    } else if (activeTab === 'posts') {
      fetchPosts();
    } else if (activeTab === 'fund' || activeTab === 'transactions') {
      fetchFundData();
    } else if (activeTab === 'expenses') {
      fetchExpenses();
    } else if (activeTab === 'donations') {
      fetchWingDonations();
    }
  }, [activeTab]);

  const fetchWingSettings = async () => {
    try {
      const res = await fetch(`/api/wings/${id}/settings`);
      if (res.ok) {
        const data = await res.json();
        setWing(data);
        setAdmins(data.admins || []);
        setName(data.name || '');
        setBio(data.bio || '');
        setDescription(data.description || '');
        setJoinApprovalRequired(data.join_approval_required === 1);
        setProfileImage(data.image || '');
        setCoverImage(data.cover_image || '');
      }
    } catch (err) {
      console.error('Failed to fetch wing settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await fetch(`/api/wings/${id}`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
      }
    } catch (err) {
      console.error('Failed to fetch members:', err);
    }
  };

  const fetchJoinRequests = async () => {
    try {
      const res = await fetch(`/api/wings/${id}/join-requests`);
      if (res.ok) {
        const data = await res.json();
        setJoinRequests(data);
      }
    } catch (err) {
      console.error('Failed to fetch join requests:', err);
    }
  };

  const fetchPosts = async () => {
    try {
      const url = postSearch 
        ? `/api/wings/${id}/posts/manage?search=${encodeURIComponent(postSearch)}`
        : `/api/wings/${id}/posts/manage`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    }
  };

  const fetchFundData = async () => {
    try {
      const [fundRes, transRes] = await Promise.all([
        fetch(`/api/wings/${id}/fund-summary`),
        fetch(`/api/ummah-funds/wing/${id}/transactions`)
      ]);
      if (fundRes.ok) setFundSummary(await fundRes.json());
      if (transRes.ok) setTransactions(await transRes.json());
    } catch (err) {
      console.error('Failed to fetch fund data:', err);
    }
  };

  const fetchExpenses = async () => {
    try {
      const res = await fetch(`/api/expenses/wing/${id}`);
      if (res.ok) setExpenses(await res.json());
    } catch (err) {
      console.error('Failed to fetch expenses:', err);
    }
  };

  const fetchWingDonations = async () => {
    try {
      const res = await fetch(`/api/wings/${id}/donations`);
      if (res.ok) setWingDonations(await res.json());
    } catch (err) {
      console.error('Failed to fetch wing donations:', err);
    }
  };

  const fetchTransferTargets = async () => {
    try {
      const [wingsRes, campaignsRes, directAidsRes] = await Promise.all([
        fetch('/api/wings?approval_status=approved'),
        fetch('/api/campaigns?approval_status=approved'),
        fetch('/api/direct-aids')
      ]);
      
      const wings = wingsRes.ok ? await wingsRes.json() : [];
      const campaigns = campaignsRes.ok ? await campaignsRes.json() : [];
      const directAids = directAidsRes.ok ? await directAidsRes.json() : [];
      
      setTransferTargets({
        wings: wings.filter(w => w.id !== parseInt(id)),
        campaigns: campaigns.filter(c => c.id),
        directAids: directAids.filter(d => d.id)
      });
    } catch (err) {
      console.error('Failed to fetch transfer targets:', err);
    }
  };

  const handleFundTransfer = async () => {
    if (!transferForm.toType || !transferForm.amount) {
      alert('Please fill all required fields');
      return;
    }
    
    const toId = transferForm.toType === 'central' ? 0 : parseInt(transferForm.toId);
    if (transferForm.toType !== 'central' && !toId) {
      alert('Please select a destination');
      return;
    }
    
    try {
      const res = await fetch('/api/ummah-funds/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromType: 'wing',
          fromId: parseInt(id),
          toType: transferForm.toType,
          toId: toId,
          amount: parseFloat(transferForm.amount),
          note: transferForm.note,
          createdBy: currentUser.id || volunteerId
        })
      });
      
      if (res.ok) {
        setShowFundTransferModal(false);
        setTransferForm({ toType: '', toId: '', amount: '', note: '' });
        fetchFundData();
        alert('Transfer completed!');
      } else {
        const err = await res.json();
        alert(err.error || 'Transfer failed');
      }
    } catch (err) {
      alert('Transfer failed');
    }
  };

  const handleInvoiceUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingInvoice(true);
    const formData = new FormData();
    formData.append('invoice', file);
    
    try {
      const res = await fetch('/api/expenses/upload-invoice', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setExpenseForm(prev => ({ ...prev, invoiceImage: data.invoiceUrl }));
      }
    } catch (err) {
      console.error('Failed to upload invoice', err);
    } finally {
      setUploadingInvoice(false);
    }
  };

  const handleAddExpense = async () => {
    if (!expenseForm.title || !expenseForm.amount) {
      alert('Please fill title and amount');
      return;
    }
    
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: 'wing',
          entityId: parseInt(id),
          title: expenseForm.title,
          description: expenseForm.description,
          amount: parseFloat(expenseForm.amount),
          category: expenseForm.category,
          invoiceImage: expenseForm.invoiceImage,
          createdBy: currentUser.id || volunteerId
        })
      });
      
      if (res.ok) {
        setShowExpenseModal(false);
        setExpenseForm({ title: '', description: '', amount: '', category: 'General', invoiceImage: '' });
        fetchExpenses();
        fetchFundData();
        alert('Expense added!');
      }
    } catch (err) {
      alert('Failed to add expense');
    }
  };

  const handleExpenseAction = async (expenseId, status) => {
    try {
      const res = await fetch(`/api/expenses/${expenseId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, approvedBy: currentUser.id || volunteerId })
      });
      if (res.ok) {
        fetchExpenses();
        fetchFundData();
      }
    } catch (err) {
      alert('Action failed');
    }
  };

  const handleDonationAction = async (donationId, status) => {
    try {
      const res = await fetch(`/api/wings/${id}/donations/${donationId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reviewedBy: currentUser.id || volunteerId })
      });
      if (res.ok) {
        fetchWingDonations();
        fetchFundData();
      }
    } catch (err) {
      alert('Action failed');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/wings/${id}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          bio,
          description,
          image: profileImage,
          cover_image: coverImage,
          join_approval_required: joinApprovalRequired ? 1 : 0
        })
      });
      if (res.ok) {
        alert('Settings saved successfully!');
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (file, type) => {
    const formData = new FormData();
    formData.append('avatar', file);
    
    try {
      const res = await fetch('/api/upload-avatar', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const { avatarUrl } = await res.json();
        if (type === 'profile') {
          setProfileImage(avatarUrl);
        } else {
          setCoverImage(avatarUrl);
        }
      }
    } catch (err) {
      console.error('Failed to upload image:', err);
    }
  };

  const handleAddAdmin = async (memberId) => {
    try {
      const res = await fetch(`/api/wings/${id}/admins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volunteerId: memberId })
      });
      if (res.ok) {
        fetchWingSettings();
        setShowAddAdmin(false);
      }
    } catch (err) {
      console.error('Failed to add admin:', err);
    }
  };

  const handleRemoveAdmin = async (memberId) => {
    if (!confirm('Remove this admin?')) return;
    try {
      const res = await fetch(`/api/wings/${id}/admins/${memberId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchWingSettings();
      } else {
        const error = await res.json();
        alert(error.error);
      }
    } catch (err) {
      console.error('Failed to remove admin:', err);
    }
  };

  const handleTransferAdmin = async (toMemberId) => {
    try {
      const topAdmin = admins.find(a => a.sort_order === 1);
      const res = await fetch(`/api/wings/${id}/transfer-admin`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromVolunteerId: topAdmin.volunteer_id,
          toVolunteerId: toMemberId
        })
      });
      if (res.ok) {
        fetchWingSettings();
        fetchMembers();
        setShowTransferModal(false);
        alert('Admin position transferred successfully!');
      } else {
        const error = await res.json();
        alert(error.error);
      }
    } catch (err) {
      console.error('Failed to transfer admin:', err);
    }
  };

  const handlePromote = async (memberId, newRole, newSortOrder) => {
    try {
      const res = await fetch(`/api/wings/${id}/members/${memberId}/promote`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newRole, newSortOrder })
      });
      if (res.ok) {
        fetchMembers();
        setShowPromoteModal(null);
        alert('Member promoted successfully!');
      }
    } catch (err) {
      console.error('Failed to promote member:', err);
    }
  };

  const handleDemote = async (memberId) => {
    if (!confirm('Remove this member from their position?')) return;
    try {
      const res = await fetch(`/api/wings/${id}/members/${memberId}/demote`, {
        method: 'PUT'
      });
      if (res.ok) {
        fetchMembers();
        alert('Member removed from position');
      }
    } catch (err) {
      console.error('Failed to demote member:', err);
    }
  };

  const handleApproveRequest = async (requestId) => {
    try {
      const res = await fetch(`/api/wings/${id}/join-requests/${requestId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewerId: volunteerId })
      });
      if (res.ok) {
        fetchJoinRequests();
        fetchMembers();
      }
    } catch (err) {
      console.error('Failed to approve request:', err);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      const res = await fetch(`/api/wings/${id}/join-requests/${requestId}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewerId: volunteerId })
      });
      if (res.ok) {
        fetchJoinRequests();
      }
    } catch (err) {
      console.error('Failed to reject request:', err);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm('Delete this post?')) return;
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchPosts();
      }
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  };

  const handleEditPost = (post) => {
    setEditingPost(post.id);
    setEditContent(post.content);
    setEditLocation(post.location || '');
  };

  const handleSavePostEdit = async () => {
    try {
      const res = await fetch(`/api/posts/${editingPost}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent, location: editLocation })
      });
      if (res.ok) {
        setEditingPost(null);
        setEditContent('');
        setEditLocation('');
        fetchPosts();
      }
    } catch (err) {
      console.error('Failed to update post:', err);
    }
  };

  const handleCancelEdit = () => {
    setEditingPost(null);
    setEditContent('');
    setEditLocation('');
  };

  const committeeMembers = members.filter(m => m.sort_order <= 6);
  const regularMembers = members.filter(m => m.sort_order === 7);
  const nonAdminCommittee = committeeMembers.filter(m => 
    !admins.some(a => a.volunteer_id === m.volunteer_id)
  );
  const topAdmin = admins.find(a => a.sort_order === 1);
  const isTopAdmin = topAdmin?.volunteer_id === parseInt(volunteerId);
  
  const pendingDonations = wingDonations.filter(d => d.status === 'pending');
  const pendingExpenses = expenses.filter(e => e.status === 'pending');

  // Base tabs (always shown)
  const baseTabs = [
    { key: 'general', label: 'General', icon: 'settings' },
    { key: 'fund', label: 'Fund', icon: 'account_balance_wallet' },
    { key: 'donations', label: 'Donations', icon: 'volunteer_activism', badge: pendingDonations.length },
    { key: 'expenses', label: 'Expenses', icon: 'receipt_long', badge: pendingExpenses.length },
  ];
  
  // Conditional tabs
  const conditionalTabs = joinApprovalRequired 
    ? [{ key: 'requests', label: 'Requests', icon: 'person_add', badge: wing?.pending_requests }]
    : [];
    
  // Management tabs  
  const managementTabs = [
    { key: 'admins', label: 'Admins', icon: 'admin_panel_settings' },
    { key: 'committee', label: 'Committee', icon: 'groups' },
    { key: 'posts', label: 'Posts', icon: 'article' },
    { key: 'analytics', label: 'Stats', icon: 'analytics' },
    { key: 'settings', label: 'More', icon: 'tune' }
  ];
  
  const tabs = [...baseTabs, ...conditionalTabs, ...managementTabs];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="bg-background-light dark:bg-background-dark text-[#0f181a] dark:text-slate-100 min-h-screen flex flex-col font-display">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between px-4 h-14 max-w-md mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2">
            <span className="material-symbols-outlined text-gray-700 dark:text-gray-200">arrow_back</span>
          </button>
          <h1 className="font-bold text-base">Wing Settings</h1>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="text-primary font-bold text-sm"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
        <div className="flex max-w-md mx-auto">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 min-w-[80px] py-3 px-2 text-xs font-bold flex flex-col items-center gap-1 relative ${
                activeTab === tab.key ? 'text-primary border-b-2 border-primary' : 'text-gray-400'
              }`}
            >
              <span className="material-symbols-outlined text-lg">{tab.icon}</span>
              {tab.label}
              {tab.badge > 0 && (
                <span className="absolute top-1 right-2 size-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 max-w-md mx-auto w-full bg-white dark:bg-gray-900 pb-8">
        {/* General Tab */}
        {activeTab === 'general' && (
          <div className="p-4 space-y-6">
            {/* Cover Photo */}
            <div>
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">Cover Photo</label>
              <button 
                onClick={() => coverInputRef.current?.click()}
                className="w-full h-32 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center overflow-hidden"
              >
                {coverImage ? (
                  <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <span className="material-symbols-outlined text-3xl text-gray-400">add_photo_alternate</span>
                    <p className="text-xs text-gray-400 mt-1">Add Cover Photo</p>
                  </div>
                )}
              </button>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files[0] && handleImageUpload(e.target.files[0], 'cover')}
                className="hidden"
              />
            </div>

            {/* Profile Photo */}
            <div>
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">Profile Photo</label>
              <button 
                onClick={() => profileInputRef.current?.click()}
                className="size-24 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center overflow-hidden"
              >
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-3xl text-gray-400">add_a_photo</span>
                )}
              </button>
              <input
                ref={profileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files[0] && handleImageUpload(e.target.files[0], 'profile')}
                className="hidden"
              />
            </div>

            {/* Name */}
            <div>
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">Wing Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Short bio about your wing..."
                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Detailed description..."
                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>

            {/* Join Approval */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div>
                <p className="font-bold text-sm">Join Approval Required</p>
                <p className="text-xs text-gray-500 mt-0.5">Admin must approve join requests</p>
              </div>
              <button
                onClick={() => setJoinApprovalRequired(!joinApprovalRequired)}
                className={`w-12 h-7 rounded-full transition-colors ${joinApprovalRequired ? 'bg-primary' : 'bg-gray-300'}`}
              >
                <div className={`size-5 bg-white rounded-full shadow transition-transform mx-1 ${joinApprovalRequired ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          </div>
        )}

        {/* Join Requests Tab */}
        {activeTab === 'requests' && (
          <div className="p-4">
            {joinRequests.length === 0 ? (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-4xl text-gray-300">inbox</span>
                <p className="text-gray-500 mt-2">No pending requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {joinRequests.map(req => (
                  <div key={req.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center gap-3">
                    <div className="size-12 rounded-full bg-primary/10 overflow-hidden flex-shrink-0">
                      {req.avatar ? (
                        <img src={req.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-primary/70">
                          <span className="text-white font-bold">{req.full_name?.charAt(0)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{req.full_name}</p>
                      <p className="text-xs text-gray-500">{req.hours_given || 0} hours contributed</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRejectRequest(req.id)}
                        className="size-10 rounded-full bg-red-100 text-red-500 flex items-center justify-center"
                      >
                        <span className="material-symbols-outlined text-lg">close</span>
                      </button>
                      <button
                        onClick={() => handleApproveRequest(req.id)}
                        className="size-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center"
                      >
                        <span className="material-symbols-outlined text-lg">check</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Admins Tab */}
        {activeTab === 'admins' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Wing Chief Executive is default admin</p>
              <button
                onClick={() => setShowAddAdmin(true)}
                className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Add Admin
              </button>
            </div>

            <div className="space-y-3">
              {admins.map(admin => (
                <div key={admin.volunteer_id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="size-12 rounded-full bg-primary/10 overflow-hidden flex-shrink-0">
                      {admin.avatar ? (
                        <img src={admin.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-primary/70">
                          <span className="text-white font-bold">{admin.full_name?.charAt(0)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{admin.full_name}</p>
                      <p className="text-xs text-gray-500">{admin.role}</p>
                    </div>
                    {admin.sort_order === 1 ? (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-lg">
                        Top Admin
                      </span>
                    ) : (
                      <button
                        onClick={() => handleRemoveAdmin(admin.volunteer_id)}
                        className="size-8 rounded-full bg-red-100 text-red-500 flex items-center justify-center"
                      >
                        <span className="material-symbols-outlined text-sm">remove</span>
                      </button>
                    )}
                  </div>
                  
                  {/* Transfer option for top admin */}
                  {admin.sort_order === 1 && isTopAdmin && committeeMembers.length > 1 && (
                    <button
                      onClick={() => setShowTransferModal(true)}
                      className="mt-3 w-full py-2 text-xs font-bold text-primary border border-primary/20 rounded-lg"
                    >
                      Transfer Top Admin Position
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Committee Tab */}
        {activeTab === 'committee' && (
          <div className="p-4">
            <p className="text-sm text-gray-500 mb-4">Manage wing committee positions</p>
            
            {/* Committee Members */}
            <div className="space-y-3">
              {committeeMembers.map(member => (
                <div key={member.volunteer_id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="size-12 rounded-full bg-primary/10 overflow-hidden flex-shrink-0">
                      {member.avatar ? (
                        <img src={member.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-primary/70">
                          <span className="text-white font-bold">{member.full_name?.charAt(0)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{member.full_name}</p>
                      <p className="text-xs text-gray-500">{member.role}</p>
                    </div>
                    {member.sort_order !== 1 && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => setShowPromoteModal(member)}
                          className="size-8 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center"
                          title="Promote"
                        >
                          <span className="material-symbols-outlined text-sm">arrow_upward</span>
                        </button>
                        <button
                          onClick={() => handleDemote(member.volunteer_id)}
                          className="size-8 rounded-full bg-red-100 text-red-500 flex items-center justify-center"
                          title="Remove from position"
                        >
                          <span className="material-symbols-outlined text-sm">person_remove</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Regular Members to Promote */}
            {regularMembers.length > 0 && (
              <>
                <p className="text-sm font-bold mt-6 mb-3">Regular Members</p>
                <div className="space-y-2">
                  {regularMembers.slice(0, 5).map(member => (
                    <div key={member.volunteer_id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center gap-3">
                      <div className="size-10 rounded-full bg-primary/10 overflow-hidden flex-shrink-0">
                        {member.avatar ? (
                          <img src={member.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-primary">
                            {member.full_name?.charAt(0)}
                          </div>
                        )}
                      </div>
                      <p className="flex-1 font-medium text-sm truncate">{member.full_name}</p>
                      <button
                        onClick={() => setShowPromoteModal(member)}
                        className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-lg"
                      >
                        Promote
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Posts Tab */}
        {activeTab === 'posts' && (
          <div className="p-4">
            {/* Search */}
            <div className="relative mb-4">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
              <input
                type="text"
                value={postSearch}
                onChange={(e) => setPostSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && fetchPosts()}
                placeholder="Search posts..."
                className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl outline-none"
              />
            </div>

            {posts.length === 0 ? (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-4xl text-gray-300">article</span>
                <p className="text-gray-500 mt-2">No posts found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {posts.map(post => (
                  <div key={post.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="size-10 rounded-full bg-primary/10 overflow-hidden flex-shrink-0">
                        {post.author_avatar ? (
                          <img src={post.author_avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-primary">
                            {post.author_name?.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm">{post.author_name}</p>
                        <p className="text-xs text-gray-500">{new Date(post.created_at).toLocaleDateString()}</p>
                        
                        {editingPost === post.id ? (
                          <div className="mt-2 space-y-2">
                            <textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm resize-none bg-white dark:bg-gray-900"
                              rows={3}
                              placeholder="Edit post content..."
                            />
                            <input
                              type="text"
                              value={editLocation}
                              onChange={(e) => setEditLocation(e.target.value)}
                              className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900"
                              placeholder="Location (optional)"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={handleSavePostEdit}
                                className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium"
                              >
                                Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm mt-2 line-clamp-3">{post.content}</p>
                            {post.location && (
                              <p className="text-xs text-primary mt-1 flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">location_on</span>
                                {post.location}
                              </p>
                            )}
                          </>
                        )}
                        
                        <div className="flex gap-4 mt-2 text-xs text-gray-500">
                          <span>{post.reaction_count} reactions</span>
                          <span>{post.comment_count} comments</span>
                          {post.image_count > 0 && <span>{post.image_count} images</span>}
                        </div>
                      </div>
                      
                      {editingPost !== post.id && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEditPost(post)}
                            className="size-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0"
                            title="Edit post"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="size-8 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400 flex items-center justify-center flex-shrink-0"
                            title="Delete post"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Fund Tab */}
        {activeTab === 'fund' && (
          <div className="p-4 space-y-4">
            {/* Balance Card - Compact */}
            <div className="border rounded-xl p-4 bg-gray-50 dark:bg-gray-800">
              <p className="text-xs text-gray-500 mb-1">Available Balance</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">৳{(fundSummary?.balance || 0).toLocaleString()}</p>
              <div className="flex gap-4 mt-2 text-xs">
                <span className="text-green-600">+৳{(fundSummary?.total_in || 0).toLocaleString()} in</span>
                <span className="text-red-600">-৳{(fundSummary?.total_out || 0).toLocaleString()} out</span>
              </div>
            </div>

            {/* Action Buttons - Compact */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowFundTransferModal(true)}
                className="flex items-center justify-center gap-2 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <span className="material-symbols-outlined text-lg text-gray-600">send</span>
                <span className="text-sm font-medium">Transfer Out</span>
              </button>
              <button
                onClick={() => setShowExpenseModal(true)}
                className="flex items-center justify-center gap-2 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <span className="material-symbols-outlined text-lg text-gray-600">receipt</span>
                <span className="text-sm font-medium">Add Expense</span>
              </button>
            </div>

            {/* Recent Transactions */}
            <div>
              <h4 className="font-medium text-sm text-gray-500 mb-2">Recent Transactions</h4>
              <div className="border rounded-lg divide-y">
                {transactions.slice(0, 5).map(t => (
                  <div key={t.id} className="flex items-center justify-between p-3">
                    <div>
                      <p className="font-medium text-sm">{t.note || t.transaction_type}</p>
                      <p className="text-xs text-gray-500">
                        {t.from_name && `From: ${t.from_name}`}
                        {t.to_name && t.from_name && ' → '}
                        {t.to_name && `To: ${t.to_name}`}
                        {!t.from_name && !t.to_name && new Date(t.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`font-bold text-sm ${
                      (t.to_type === 'wing' && t.to_id === parseInt(id)) ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {(t.to_type === 'wing' && t.to_id === parseInt(id)) ? '+' : '-'}৳{t.amount?.toLocaleString()}
                    </span>
                  </div>
                ))}
                {transactions.length === 0 && (
                  <p className="text-center text-gray-500 text-sm py-6">No transactions yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Donations Tab */}
        {activeTab === 'donations' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Wing Donations</h3>
              <Link
                to={`/volunteer/donate?wing=${id}`}
                className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                New Donation
              </Link>
            </div>

            {/* Pending Approvals */}
            {pendingDonations.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-bold text-amber-600 mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">pending</span>
                  Pending Approval ({pendingDonations.length})
                </h4>
                {pendingDonations.map(d => (
                  <div key={d.id} className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl mb-3">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-bold">{d.is_anonymous ? 'Anonymous' : d.donor_name}</p>
                        <p className="text-sm text-gray-500">{d.phone_number}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {d.payment_method} • TxID: {d.transaction_id}
                        </p>
                      </div>
                      <p className="text-xl font-bold text-emerald-600">৳{d.amount?.toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDonationAction(d.id, 'approved')}
                        className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-bold"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => handleDonationAction(d.id, 'rejected')}
                        className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-bold"
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Approved Donations */}
            <h4 className="text-sm font-bold text-gray-600 mb-3">All Donations</h4>
            {wingDonations.filter(d => d.status !== 'pending').map(d => (
              <div key={d.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl mb-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`size-10 rounded-full flex items-center justify-center ${
                    d.status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    <span className="material-symbols-outlined text-lg">
                      {d.status === 'approved' ? 'check' : 'close'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{d.is_anonymous ? 'Anonymous' : d.donor_name}</p>
                    <p className="text-xs text-gray-500">{new Date(d.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <p className={`font-bold ${d.status === 'approved' ? 'text-emerald-600' : 'text-red-600 line-through'}`}>
                  ৳{d.amount?.toLocaleString()}
                </p>
              </div>
            ))}
            {wingDonations.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <span className="material-symbols-outlined text-4xl mb-2">volunteer_activism</span>
                <p>No donations received yet</p>
              </div>
            )}
          </div>
        )}

        {/* Expenses Tab */}
        {activeTab === 'expenses' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Wing Expenses</h3>
              <button
                onClick={() => setShowExpenseModal(true)}
                className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Add Expense
              </button>
            </div>

            {/* Pending Approvals */}
            {pendingExpenses.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-bold text-amber-600 mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">pending</span>
                  Pending Approval ({pendingExpenses.length})
                </h4>
                {pendingExpenses.map(exp => (
                  <div key={exp.id} className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl mb-3">
                    <div className="flex gap-4 mb-3">
                      {exp.invoice_image && (
                        <img 
                          src={exp.invoice_image} 
                          alt="Invoice"
                          className="w-16 h-16 object-cover rounded-lg cursor-pointer"
                          onClick={() => window.open(exp.invoice_image, '_blank')}
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold">{exp.title}</p>
                            <p className="text-sm text-gray-600">{exp.description}</p>
                            <p className="text-xs text-gray-400 mt-1">{exp.category}</p>
                          </div>
                          <p className="text-xl font-bold text-gray-900">৳{exp.amount?.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleExpenseAction(exp.id, 'approved')}
                        className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-bold"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => handleExpenseAction(exp.id, 'rejected')}
                        className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-bold"
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* All Expenses */}
            <h4 className="text-sm font-bold text-gray-600 mb-3">All Expenses</h4>
            {expenses.filter(e => e.status !== 'pending').map(exp => (
              <div key={exp.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl mb-2">
                <div className="flex gap-4">
                  {exp.invoice_image && (
                    <img 
                      src={exp.invoice_image} 
                      alt="Invoice"
                      className="w-14 h-14 object-cover rounded-lg cursor-pointer"
                      onClick={() => window.open(exp.invoice_image, '_blank')}
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">{exp.title}</p>
                        <p className="text-xs text-gray-500">{exp.category} • {new Date(exp.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${exp.status === 'approved' ? 'text-gray-900' : 'text-red-600 line-through'}`}>
                          ৳{exp.amount?.toLocaleString()}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          exp.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {exp.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {expenses.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <span className="material-symbols-outlined text-4xl mb-2">receipt_long</span>
                <p>No expenses recorded yet</p>
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Wing Analytics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <span className="material-symbols-outlined text-blue-500 text-2xl">group</span>
                  <span className="text-xs text-gray-500">Total</span>
                </div>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{wing?.member_count || 0}</p>
                <p className="text-sm text-gray-500">Members</p>
              </div>

              <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <span className="material-symbols-outlined text-green-500 text-2xl">trending_up</span>
                  <span className="text-xs text-gray-500">Active</span>
                </div>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{Math.ceil((wing?.member_count || 0) * 0.7)}</p>
                <p className="text-sm text-gray-500">This Month</p>
              </div>

              <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <span className="material-symbols-outlined text-purple-500 text-2xl">article</span>
                  <span className="text-xs text-gray-500">Posts</span>
                </div>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{posts.length}</p>
                <p className="text-sm text-gray-500">Total Posts</p>
              </div>

              <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <span className="material-symbols-outlined text-orange-500 text-2xl">local_fire_department</span>
                  <span className="text-xs text-gray-500">Engagement</span>
                </div>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{Math.ceil(posts.reduce((acc, post) => acc + (post.reaction_count || 0) + (post.comment_count || 0), 0) / Math.max(posts.length, 1))}</p>
                <p className="text-sm text-gray-500">Avg/Post</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Member Activity</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Active Members</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{width: '70%'}}></div>
                    </div>
                    <span className="text-sm font-medium">70%</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Post Engagement</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{width: '85%'}}></div>
                    </div>
                    <span className="text-sm font-medium">85%</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Campaign Participation</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{width: '60%'}}></div>
                    </div>
                    <span className="text-sm font-medium">60%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Advanced Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Advanced Settings</h2>
            
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Wing Permissions</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">Post Creation</p>
                    <p className="text-sm text-gray-500">Who can create posts in this wing</p>
                  </div>
                  <select className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800">
                    <option>All Members</option>
                    <option>Admins Only</option>
                    <option>Committee & Admins</option>
                  </select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">Campaign Creation</p>
                    <p className="text-sm text-gray-500">Who can create campaigns for this wing</p>
                  </div>
                  <select className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800">
                    <option>All Members</option>
                    <option>Admins Only</option>
                    <option>Committee & Admins</option>
                  </select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">Member Invitations</p>
                    <p className="text-sm text-gray-500">Who can invite new members</p>
                  </div>
                  <select className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800">
                    <option>All Members</option>
                    <option>Admins Only</option>
                    <option>Committee & Admins</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Notification Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">New Post Notifications</p>
                    <p className="text-sm text-gray-500">Notify members about new posts</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 dark:peer-focus:ring-primary/50 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">Campaign Updates</p>
                    <p className="text-sm text-gray-500">Notify about campaign status changes</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 dark:peer-focus:ring-primary/50 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">Member Join Alerts</p>
                    <p className="text-sm text-gray-500">Notify admins about new members</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 dark:peer-focus:ring-primary/50 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 border border-red-200 dark:border-red-800">
              <h3 className="font-semibold text-red-800 dark:text-red-300 mb-4">Danger Zone</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-red-800 dark:text-red-300">Archive Wing</p>
                    <p className="text-sm text-red-600 dark:text-red-400">Wing will be hidden but data preserved</p>
                  </div>
                  <button className="px-4 py-2 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/70">
                    Archive
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-red-800 dark:text-red-300">Delete Wing</p>
                    <p className="text-sm text-red-600 dark:text-red-400">Permanently delete wing and all data</p>
                  </div>
                  <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Add Admin Modal */}
      {showAddAdmin && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md mx-auto rounded-t-3xl max-h-[70vh] flex flex-col">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h3 className="font-bold text-lg">Add Admin</h3>
              <button onClick={() => setShowAddAdmin(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <p className="text-xs text-gray-500 mb-3">Select a committee member to make admin</p>
              {nonAdminCommittee.length === 0 ? (
                <p className="text-center text-gray-500 py-8">All committee members are already admins</p>
              ) : (
                <div className="space-y-2">
                  {nonAdminCommittee.map(member => (
                    <button
                      key={member.volunteer_id}
                      onClick={() => handleAddAdmin(member.volunteer_id)}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <div className="size-10 rounded-full bg-primary/10 overflow-hidden">
                        {member.avatar ? (
                          <img src={member.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-primary">
                            {member.full_name?.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-sm">{member.full_name}</p>
                        <p className="text-xs text-gray-500">{member.role}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Promote Modal */}
      {showPromoteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md mx-auto rounded-t-3xl max-h-[70vh] flex flex-col">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h3 className="font-bold text-lg">Promote {showPromoteModal.full_name}</h3>
              <button onClick={() => setShowPromoteModal(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <p className="text-xs text-gray-500 mb-3">Select new position</p>
              <div className="space-y-2">
                {wingRoles.filter(r => r.sort_order !== 1 && r.sort_order < showPromoteModal.sort_order).map(role => (
                  <button
                    key={role.sort_order}
                    onClick={() => handlePromote(showPromoteModal.volunteer_id, role.role, role.sort_order)}
                    className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-xl text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <p className="font-medium text-sm">{role.role}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Admin Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md mx-auto rounded-t-3xl max-h-[70vh] flex flex-col">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h3 className="font-bold text-lg">Transfer Top Admin</h3>
              <button onClick={() => setShowTransferModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <p className="text-xs text-gray-500 mb-3">Select a committee member to transfer top admin position to</p>
              <div className="space-y-2">
                {committeeMembers.filter(m => m.sort_order !== 1).map(member => (
                  <button
                    key={member.volunteer_id}
                    onClick={() => handleTransferAdmin(member.volunteer_id)}
                    className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <div className="size-10 rounded-full bg-primary/10 overflow-hidden">
                      {member.avatar ? (
                        <img src={member.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-primary">
                          {member.full_name?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-sm">{member.full_name}</p>
                      <p className="text-xs text-gray-500">{member.role}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fund Transfer Modal */}
      {showFundTransferModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h3 className="font-bold text-lg">Transfer Funds</h3>
              <button onClick={() => setShowFundTransferModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">From</label>
                <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">{wing?.name || 'This Wing'}</div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">To Type</label>
                <select
                  value={transferForm.toType}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, toType: e.target.value, toId: '' }))}
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl outline-none"
                >
                  <option value="">Select destination type</option>
                  <option value="central">UYHO Central Fund</option>
                  <option value="wing">Another Wing</option>
                  <option value="campaign">Campaign</option>
                  <option value="direct_aid">Direct Aid</option>
                </select>
              </div>

              {transferForm.toType && transferForm.toType !== 'central' && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Select {transferForm.toType}</label>
                  <select
                    value={transferForm.toId}
                    onChange={(e) => setTransferForm(prev => ({ ...prev, toId: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl outline-none"
                  >
                    <option value="">Select...</option>
                    {transferForm.toType === 'wing' && transferTargets.wings.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                    {transferForm.toType === 'campaign' && transferTargets.campaigns.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                    {transferForm.toType === 'direct_aid' && transferTargets.directAids.map(d => (
                      <option key={d.id} value={d.id}>{d.title}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Amount (৳)</label>
                <input
                  type="number"
                  value={transferForm.amount}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl outline-none"
                  placeholder="Enter amount"
                />
                <p className="text-xs text-gray-500 mt-1">Available: ৳{(fundSummary?.balance || 0).toLocaleString()}</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Note (optional)</label>
                <textarea
                  value={transferForm.note}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, note: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl outline-none resize-none"
                  rows={2}
                  placeholder="Reason for transfer..."
                />
              </div>

              <button
                onClick={handleFundTransfer}
                disabled={!transferForm.amount || (!transferForm.toId && transferForm.toType !== 'central')}
                className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Transfer ৳{transferForm.amount || 0}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h3 className="font-bold text-lg">Add Expense</h3>
              <button onClick={() => setShowExpenseModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                <input
                  type="text"
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl outline-none"
                  placeholder="What was this expense for?"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl outline-none resize-none"
                  rows={2}
                  placeholder="Details about this expense..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Amount (৳) *</label>
                <input
                  type="number"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl outline-none"
                  placeholder="Enter amount"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl outline-none"
                >
                  <option value="General">General</option>
                  <option value="Food">Food & Refreshments</option>
                  <option value="Transport">Transportation</option>
                  <option value="Supplies">Supplies & Materials</option>
                  <option value="Venue">Venue & Rent</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Marketing">Marketing & Promotion</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Invoice Image</label>
                {expenseForm.invoiceImage ? (
                  <div className="relative">
                    <img 
                      src={expenseForm.invoiceImage} 
                      alt="Invoice"
                      className="w-full h-32 object-cover rounded-xl"
                    />
                    <button
                      onClick={() => setExpenseForm(prev => ({ ...prev, invoiceImage: '' }))}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                ) : (
                  <label className="block w-full p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl cursor-pointer hover:border-primary text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleInvoiceUpload}
                      className="hidden"
                    />
                    {uploadingInvoice ? (
                      <span className="text-gray-500">Uploading...</span>
                    ) : (
                      <div className="text-gray-500">
                        <span className="material-symbols-outlined text-2xl mb-1 block">add_photo_alternate</span>
                        <span className="text-sm">Upload invoice/receipt</span>
                      </div>
                    )}
                  </label>
                )}
              </div>

              <button
                onClick={handleAddExpense}
                disabled={!expenseForm.title || !expenseForm.amount}
                className="w-full py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Expense
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
