import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const projectRoles = [
  'Program Host',
  'Program Director',
  'Project Manager',
  'Operations Lead',
  'Logistics Coordinator',
  'Field Lead',
  'Medical Lead',
  'Media Coordinator',
  'Volunteer Coordinator',
  'Volunteer'
];

export default function WingCampaignRequestPage() {
  const { id } = useParams(); // wing id
  const navigate = useNavigate();
  const [wing, setWing] = useState(null);
  const [wingMembers, setWingMembers] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [wingCategory, setWingCategory] = useState('');
  const [deadline, setDeadline] = useState('');
  const [location, setLocation] = useState('');
  const [image, setImage] = useState('');
  const [volunteersNeeded, setVolunteersNeeded] = useState(10);
  const [budget, setBudget] = useState('');
  const [budgetItems, setBudgetItems] = useState([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('');
  const [programHours, setProgramHours] = useState('');
  const [programRespect, setProgramRespect] = useState('');
  const [livesImpacted, setLivesImpacted] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const fileInputRef = useRef(null);
  
  // Team assignment state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedRole, setSelectedRole] = useState(projectRoles[0]);
  const [taskNote, setTaskNote] = useState('');
  const [memberHours, setMemberHours] = useState('');
  const [memberRespect, setMemberRespect] = useState('');
  const [assignees, setAssignees] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  
  const volunteerId = localStorage.getItem('volunteerId');

  useEffect(() => {
    fetchWingData();
    fetchCurrentUser();
  }, [id]);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch(`/api/volunteers/${volunteerId}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data);
      }
    } catch (err) {
      console.error('Failed to fetch current user:', err);
    }
  };

  const fetchWingData = async () => {
    setLoadingMembers(true);
    try {
      const res = await fetch(`/api/wings/${id}`);
      if (res.ok) {
        const data = await res.json();
        setWing(data);
        // Extract wing members
        const members = (data.members || []).map(m => ({
          id: m.digital_id || `VOL-${m.volunteer_id}`,
          volid: m.volunteer_id,
          name: m.full_name,
          wing: data.name || 'Wing',
          position: m.role || m.central_position || 'Member',
          avatar: m.avatar || '/avatars/avatar_1.svg',
          hours_given: m.hours_given || 0
        }));
        setWingMembers(members);
      }
    } catch (err) {
      console.error('Failed to load wing:', err);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Exclude current user from team assignment
  const filteredMembers = wingMembers.filter(m => 
    m.id !== parseInt(volunteerId) && (
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.digital_id.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleAddAssignee = () => {
    const member = wingMembers.find(m => m.id === selectedMemberId);
    if (!member) return;
    if (!taskNote.trim()) return;
    const exists = assignees.find(a => a.id === member.id);
    if (exists) return;
    
    const hours = parseInt(memberHours) || parseInt(programHours) || 0;
    const respect = parseInt(memberRespect) || parseInt(programRespect) || 0;
    
    setAssignees(prev => [...prev, {
      ...member,
      role: selectedRole,
      taskNote: taskNote.trim(),
      hours,
      respect
    }]);
    setSelectedMemberId('');
    setTaskNote('');
    setMemberHours('');
    setMemberRespect('');
  };

  const handleRemoveAssignee = (memberId) => {
    setAssignees(prev => prev.filter(a => a.id !== memberId));
  };

  const handleAddBudgetItem = () => {
    if (!newItemName.trim() || !newItemAmount || parseFloat(newItemAmount) <= 0) return;
    setBudgetItems(prev => [...prev, { name: newItemName.trim(), amount: parseFloat(newItemAmount) }]);
    setNewItemName('');
    setNewItemAmount('');
  };

  const handleRemoveBudgetItem = (index) => {
    setBudgetItems(prev => prev.filter((_, i) => i !== index));
  };

  const totalAllocated = budgetItems.reduce((sum, item) => sum + item.amount, 0);
  const remainingBudget = (parseFloat(budget) || 0) - totalAllocated;

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Debug validation
    console.log('Form submission attempted:', {
      title: title,
      titleValid: !!title.trim(),
      description: description,
      descriptionValid: !!description.trim(),
      canSubmit: title.trim() && description.trim()
    });
    
    if (!title.trim() || !description.trim()) {
      alert('Please fill in both Title and Description fields.');
      return;
    }
    
    setSubmitting(true);
    try {
      const hours = parseInt(programHours) || 0;
      const respect = parseInt(programRespect) || 0;
      const lives = parseInt(livesImpacted) || 0;
      const teamPayload = assignees.map(a => ({
        volunteerId: a.volid,
        role: a.role,
        taskNote: a.taskNote,
        hours: a.hours || hours,
        respect: a.respect || respect
      }));

      const res = await fetch(`/api/wings/${id}/campaign-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          wing: wingCategory || wing?.name,
          deadline,
          location,
          image,
          volunteersNeeded,
          budget: parseFloat(budget) || 0,
          budgetBreakdown: JSON.stringify(budgetItems),
          programHours: hours,
          programRespect: respect,
          livesImpacted: lives,
          team: teamPayload,
          createdBy: volunteerId
        })
      });
      
      if (res.ok) {
        navigate(`/volunteer/wing/${id}`, { state: { tab: 'home', message: 'Campaign request submitted!' } });
      }
    } catch (err) {
      console.error('Failed to submit campaign:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const wingCategories = [
    'Education', 'Health', 'Environment', 'Social Services', 
    'Disaster Relief', 'Community Development', 'Youth Empowerment'
  ];

  return (
    <div className="bg-background-light dark:bg-background-dark text-[#0f181a] dark:text-slate-100 min-h-screen flex flex-col font-display">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between px-4 h-14 max-w-md mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2">
            <span className="material-symbols-outlined text-gray-700 dark:text-gray-200">arrow_back</span>
          </button>
          <h1 className="font-bold text-base">Request Campaign</h1>
          <div className="w-8" />
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-md mx-auto w-full bg-white dark:bg-gray-900 pb-24">
        {/* Wing Info */}
        <div className="p-4 flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 bg-primary/5">
          <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
            {wing?.image ? (
              <img src={wing.image} alt={wing?.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-primary font-bold text-lg">
                {wing?.name?.charAt(0)}
              </span>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold">Program Host</p>
            <p className="font-bold text-primary">{wing?.name}</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          {/* Campaign Image */}
          <div>
            <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">
              Campaign Cover Image
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            {image ? (
              <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100">
                <img src={image} alt="Cover" className="w-full h-full object-cover" />
                <button 
                  type="button"
                  onClick={() => setImage('')}
                  className="absolute top-2 right-2 size-8 bg-black/60 rounded-full flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-white">close</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-video rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <span className="material-symbols-outlined text-3xl text-gray-400">add_photo_alternate</span>
                <span className="text-sm text-gray-500">Add Cover Image</span>
              </button>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">
              Campaign Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Winter Clothes Distribution Drive"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your campaign, its goals, and how volunteers can help..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">
              Category
            </label>
            <select
              value={wingCategory}
              onChange={(e) => setWingCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Select category</option>
              {wingCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">
              Deadline
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">
              Campaign Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Dhaka Medical College Hospital, Wari, Dhaka"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Volunteers Needed */}
          <div>
            <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">
              Volunteers Needed
            </label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setVolunteersNeeded(Math.max(1, volunteersNeeded - 5))}
                className="size-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
              >
                <span className="material-symbols-outlined">remove</span>
              </button>
              <div className="flex-1 text-center">
                <span className="text-3xl font-bold text-primary">{volunteersNeeded}</span>
                <p className="text-xs text-gray-500">volunteers</p>
              </div>
              <button
                type="button"
                onClick={() => setVolunteersNeeded(volunteersNeeded + 5)}
                className="size-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
              >
                <span className="material-symbols-outlined">add</span>
              </button>
            </div>
          </div>

          {/* Budget */}
          <div>
            <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">
              Total Budget (৳)
            </label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="0.00"
              min="0"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Budget Distribution */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">
                Budget Distribution
              </label>
              <p className="text-xs text-gray-500 mb-3">Add expense categories to track your budget allocation</p>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="Category name (e.g., Logistics)"
                className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <input
                type="number"
                value={newItemAmount}
                onChange={(e) => setNewItemAmount(e.target.value)}
                placeholder="Amount"
                min="0"
                className="w-24 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={handleAddBudgetItem}
                className="px-4 bg-primary text-white rounded-lg font-bold hover:bg-primary/90"
              >
                <span className="material-symbols-outlined text-lg">add</span>
              </button>
            </div>

            <div className="space-y-2">
              {budgetItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                  <div>
                    <p className="text-sm font-bold text-gray-800 dark:text-white">{item.name}</p>
                    <p className="text-xs text-gray-500">৳{item.amount.toFixed(2)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveBudgetItem(index)}
                    className="p-2 text-gray-400 hover:text-red-500"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              ))}
              {budgetItems.length === 0 && (
                <p className="text-xs text-gray-500 text-center py-4">No budget items added yet.</p>
              )}
            </div>

            {budget && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-blue-900 dark:text-blue-300">Remaining Budget:</span>
                  <span className="text-lg font-extrabold text-blue-600 dark:text-blue-400">৳{remainingBudget.toFixed(2)}</span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Allocated: ৳{totalAllocated.toFixed(2)} of ৳{(parseFloat(budget) || 0).toFixed(2)}
                </div>
                {remainingBudget < 0 && (
                  <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                    ⚠️ Over budget by ৳{Math.abs(remainingBudget).toFixed(2)}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Program Hours, Respect & Lives Impacted */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">
                Hours
              </label>
              <input
                type="number"
                value={programHours}
                onChange={(e) => setProgramHours(e.target.value)}
                placeholder="0"
                min="0"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-xs text-gray-400 mt-1">Per volunteer</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">
                Respect
              </label>
              <input
                type="number"
                value={programRespect}
                onChange={(e) => setProgramRespect(e.target.value)}
                placeholder="0"
                min="0"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-xs text-gray-400 mt-1">Per volunteer</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">
                Lives Impact
              </label>
              <input
                type="number"
                value={livesImpacted}
                onChange={(e) => setLivesImpacted(e.target.value)}
                placeholder="0"
                min="0"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-xs text-gray-400 mt-1">Estimated</p>
            </div>
          </div>

          {/* Program Host Display */}
          {currentUser && (
            <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
              <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-2">Program Host (You)</p>
              <div className="flex items-center gap-3">
                <img src={currentUser.avatar} alt={currentUser.full_name} className="w-10 h-10 rounded-full object-cover" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-800 dark:text-white">{currentUser.full_name}</p>
                  <p className="text-[11px] text-gray-500">{currentUser.wing_role} • {currentUser.digital_id}</p>
                  <p className="text-[11px] font-bold text-primary">Program Host</p>
                </div>
                <span className="text-xs bg-primary text-white px-2 py-1 rounded-full">Host</span>
              </div>
            </div>
          )}

          {/* Team Assignment Section */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-1">
                Assign Team Members
              </label>
              <p className="text-xs text-gray-500 mb-3">Select members from this wing to assign roles (you are automatically the host)</p>
            </div>

            {/* Search Wing Members */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search wing members..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Members List */}
            <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl divide-y divide-gray-100 dark:divide-gray-800">
              {loadingMembers ? (
                <div className="flex items-center justify-center py-6">
                  <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                  <span className="ml-2 text-sm text-gray-500">Loading members...</span>
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="p-4 text-center">
                  <span className="material-symbols-outlined text-gray-300 text-2xl">person_off</span>
                  <p className="text-sm text-gray-500 mt-1">No members found</p>
                </div>
              ) : (
                filteredMembers.map(m => (
                  <label key={m.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                    <input
                      type="radio"
                      name="wingMember"
                      value={m.id}
                      checked={selectedMemberId === m.id}
                      onChange={() => setSelectedMemberId(m.id)}
                      className="accent-primary"
                    />
                    <img src={m.avatar} alt={m.name} className="w-9 h-9 rounded-full object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{m.name}</p>
                      <p className="text-[11px] text-gray-500">{m.position} • {m.hours_given}h</p>
                    </div>
                    <span className="text-[10px] font-bold text-primary">{m.id}</span>
                  </label>
                ))
              )}
            </div>

            {/* Role & Task Note */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Role</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {projectRoles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Task Note *</label>
                <input
                  type="text"
                  value={taskNote}
                  onChange={(e) => setTaskNote(e.target.value)}
                  placeholder="Responsibility..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Member Hours & Respect Override */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Hours (Optional)</label>
                <input
                  type="number"
                  value={memberHours}
                  onChange={(e) => setMemberHours(e.target.value)}
                  placeholder={programHours || '0'}
                  min="0"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Respect (Optional)</label>
                <input
                  type="number"
                  value={memberRespect}
                  onChange={(e) => setMemberRespect(e.target.value)}
                  placeholder={programRespect || '0'}
                  min="0"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Add Button */}
            <button
              type="button"
              onClick={handleAddAssignee}
              disabled={!selectedMemberId || !taskNote.trim()}
              className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-sm font-bold text-primary flex items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span className="material-symbols-outlined text-base">add</span>
              Add to Team
            </button>

            {/* Assigned Members */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-500 uppercase">Assigned Team ({assignees.length + 1})</p>
              
              {/* Program Host */}
              {currentUser && (
                <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/20">
                  <img src={currentUser.avatar} alt={currentUser.full_name} className="w-10 h-10 rounded-full object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{currentUser.full_name}</p>
                    <p className="text-[11px] text-gray-500">{currentUser.wing_role} • {currentUser.digital_id}</p>
                    <p className="text-[11px] font-bold text-primary">Program Host</p>
                  </div>
                  <span className="text-xs bg-primary text-white px-2 py-1 rounded-full">Host</span>
                </div>
              )}
              
              {assignees.map(member => (
                  <div key={member.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                    <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{member.name}</p>
                      <p className="text-[11px] text-gray-500">{member.position} • {member.id}</p>
                      <p className="text-[11px] font-bold text-primary">{member.role}</p>
                      <p className="text-[11px] text-gray-600 truncate">{member.taskNote}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded">
                          {member.hours}h
                        </span>
                        <span className="text-[10px] font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded">
                          +{member.respect} respect
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAssignee(member.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                  </div>
                ))}
                
                {assignees.length === 0 && (
                  <p className="text-xs text-gray-500 text-center py-4">No additional team members assigned yet.</p>
                )}
              </div>
          </div>

          {/* Info Note */}
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
            <div className="flex gap-3">
              <span className="material-symbols-outlined text-amber-600">info</span>
              <div>
                <p className="text-sm font-bold text-amber-800 dark:text-amber-200">Approval Required</p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  Your campaign request will be reviewed by the central committee. Once approved, it will be automatically posted on your wing page.
                </p>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !title.trim() || !description.trim()}
            className={`w-full py-4 rounded-xl font-bold text-white ${
              submitting || !title.trim() || !description.trim()
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-primary hover:bg-primary/90'
            } transition-colors`}
          >
            {submitting ? 'Submitting...' : 'Submit Campaign Request'}
          </button>
          
          {(!title.trim() || !description.trim()) && (
            <div className="text-center">
              <p className="text-sm text-red-500">
                Please fill in all required fields (*) to submit your campaign request.
              </p>
            </div>
          )}
        </form>
      </main>
    </div>
  );
}
