import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VolunteerFooter from '../../components/VolunteerFooter';

export default function CreateDirectAidPage() {
  const navigate = useNavigate();
  const volunteerId = localStorage.getItem('visitorVolunteerId') || localStorage.getItem('volunteerId');
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [formData, setFormData] = useState({
    beneficiaryName: '',
    bio: '',
    lifeHistory: '',
    title: '',
    description: '',
    goalAmount: '',
    image: null
  });

  // Team management
  const [teamMembers, setTeamMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Fetch current user and add as host
    if (volunteerId) {
      fetchCurrentUser();
    }
  }, [volunteerId]);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch(`/api/volunteers/${volunteerId}`);
      if (res.ok) {
        const user = await res.json();
        setCurrentUser(user);
        // Add current user as host
        setTeamMembers([{ ...user, role: 'host' }]);
      }
    } catch (err) {
      console.error('Failed to fetch current user:', err);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const searchVolunteers = async (query) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setSearchLoading(true);
    try {
      const res = await fetch(`/api/badges/search-volunteers?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        // Filter out already added team members
        const filtered = data.filter(v => !teamMembers.some(tm => tm.id === v.id));
        setSearchResults(filtered);
      }
    } catch (err) {
      console.error('Failed to search volunteers:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const addTeamMember = (volunteer) => {
    if (!teamMembers.some(tm => tm.id === volunteer.id)) {
      setTeamMembers([...teamMembers, { ...volunteer, role: 'member' }]);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeTeamMember = (volunteerId) => {
    // Can't remove the host
    const member = teamMembers.find(tm => tm.id === volunteerId);
    if (member?.role === 'host') return;
    setTeamMembers(teamMembers.filter(tm => tm.id !== volunteerId));
  };

  const updateMemberRole = (volunteerId, newRole) => {
    // Can't change host role
    const member = teamMembers.find(tm => tm.id === volunteerId);
    if (member?.role === 'host') return;
    setTeamMembers(teamMembers.map(tm => 
      tm.id === volunteerId ? { ...tm, role: newRole } : tm
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.goalAmount) {
      alert('Please fill in Campaign Title and Goal Amount');
      return;
    }

    if (!volunteerId) {
      alert('Please login first');
      navigate('/volunteer/login');
      return;
    }

    setLoading(true);
    try {
      // First upload image if exists
      let imageUrl = '/avatars/avatar_1.svg';
      if (formData.image) {
        const formDataImg = new FormData();
        formDataImg.append('image', formData.image);
        const imgRes = await fetch('/api/upload/post-image', {
          method: 'POST',
          body: formDataImg
        });
        if (imgRes.ok) {
          const imgData = await imgRes.json();
          imageUrl = imgData.url;
        }
      }

      // Create direct aid
      const res = await fetch('/api/direct-aids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          volunteerId: parseInt(volunteerId),
          beneficiaryName: formData.beneficiaryName || formData.title,
          title: formData.title,
          description: formData.description,
          bio: formData.bio,
          lifeHistory: formData.lifeHistory,
          goalAmount: parseFloat(formData.goalAmount),
          image: imageUrl,
          teamMembers: teamMembers.filter(tm => tm.role !== 'host').map(tm => ({ volunteerId: tm.id, role: tm.role }))
        })
      });

      if (res.ok) {
        const data = await res.json();
        alert('Direct aid campaign created successfully! It will be reviewed by admin.');
        navigate('/volunteer/donation');
      } else {
        throw new Error('Failed to create direct aid');
      }
    } catch (err) {
      console.error('Failed to create direct aid:', err);
      alert('Failed to create direct aid. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
          </button>
          <div className="flex-1">
            <p className="text-[10px] uppercase font-bold text-primary">New Campaign</p>
            <h1 className="text-xl font-bold">Start Direct Aid</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Profile Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">person</span>
              Beneficiary Information
            </h2>
            
            {/* Profile Picture */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative">
                <div className="size-32 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden border-4 border-primary/20">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-5xl text-gray-400">person</span>
                    </div>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 size-10 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors">
                  <span className="material-symbols-outlined text-white">add_a_photo</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageChange}
                    className="hidden" 
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2">Upload beneficiary photo</p>
            </div>

            {/* Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Beneficiary Name *</label>
              <input
                type="text"
                value={formData.beneficiaryName}
                onChange={(e) => setFormData(prev => ({ ...prev, beneficiaryName: e.target.value }))}
                placeholder="Enter the person's full name"
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              />
            </div>

            {/* Bio */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Short Bio</label>
              <input
                type="text"
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="e.g., 45 years old, father of 3, daily wage worker"
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Life History */}
            <div>
              <label className="block text-sm font-medium mb-2">Life History & Background</label>
              <textarea
                value={formData.lifeHistory}
                onChange={(e) => setFormData(prev => ({ ...prev, lifeHistory: e.target.value }))}
                placeholder="Tell the story of this person - their background, challenges, and why they need help..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
            </div>
          </div>

          {/* Campaign Details */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">campaign</span>
              Campaign Details
            </h2>
            
            {/* Title */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Campaign Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Medical Treatment for Rahim"
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              />
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Campaign Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the situation and how the funds will be used..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
            </div>

            {/* Goal Amount */}
            <div>
              <label className="block text-sm font-medium mb-2">Goal Amount (৳) *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">৳</span>
                <input
                  type="number"
                  value={formData.goalAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, goalAmount: e.target.value }))}
                  placeholder="0"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50 text-lg font-bold"
                  required
                />
              </div>
            </div>
          </div>

          {/* Team Management */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">group</span>
              Moderation Team
            </h2>
            <p className="text-sm text-gray-500 mb-4">Add volunteers who can post updates and manage this campaign</p>

            {/* Search Volunteers */}
            <div className="relative mb-4">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchVolunteers(e.target.value);
                }}
                placeholder="Search volunteers to add..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              
              {/* Search Results Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-48 overflow-y-auto z-20">
                  {searchResults.map(volunteer => (
                    <button
                      key={volunteer.id}
                      type="button"
                      onClick={() => addTeamMember(volunteer)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <img
                        src={volunteer.avatar || '/avatars/avatar_1.svg'}
                        alt={volunteer.full_name}
                        className="size-10 rounded-full object-cover"
                      />
                      <div className="flex-1 text-left">
                        <p className="font-medium">{volunteer.full_name}</p>
                        <p className="text-xs text-gray-500">{volunteer.position || 'Volunteer'}</p>
                      </div>
                      <span className="material-symbols-outlined text-primary">add_circle</span>
                    </button>
                  ))}
                </div>
              )}
              
              {searchLoading && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center">
                  <span className="material-symbols-outlined animate-spin text-gray-400">progress_activity</span>
                </div>
              )}
            </div>

            {/* Team Members List */}
            <div className="space-y-3">
              {teamMembers.map(member => (
                <div
                  key={member.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border ${
                    member.role === 'host' 
                      ? 'border-primary/30 bg-primary/5' 
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <img
                    src={member.avatar || '/avatars/avatar_1.svg'}
                    alt={member.full_name}
                    className="size-12 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{member.full_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {member.role === 'host' ? (
                        <span className="text-[10px] font-bold text-white bg-primary px-2 py-0.5 rounded-full">
                          HOST (You)
                        </span>
                      ) : (
                        <select
                          value={member.role}
                          onChange={(e) => updateMemberRole(member.id, e.target.value)}
                          className="text-xs px-2 py-1 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
                        >
                          <option value="member">Member</option>
                          <option value="moderator">Moderator</option>
                        </select>
                      )}
                    </div>
                  </div>
                  {member.role !== 'host' && (
                    <button
                      type="button"
                      onClick={() => removeTeamMember(member.id)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 disabled:bg-gray-300 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
                Creating...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">volunteer_activism</span>
                Submit for Review
              </>
            )}
          </button>

          <p className="text-xs text-center text-gray-500">
            Your campaign will be reviewed by admin before going live
          </p>
        </form>
      </main>

      <VolunteerFooter />
    </div>
  );
}
