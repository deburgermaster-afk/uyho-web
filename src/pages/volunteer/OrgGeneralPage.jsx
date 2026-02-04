import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import VolunteerFooter from '../../components/VolunteerFooter';
import { useOrg } from '../../context/OrgContext';

export default function OrgGeneralPage() {
  const navigate = useNavigate();
  const { refreshOrgData: refreshGlobalOrgData } = useOrg();
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orgData, setOrgData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [showAddLink, setShowAddLink] = useState(false);
  const [newLink, setNewLink] = useState({ platform: '', url: '' });

  const volunteerId = localStorage.getItem('volunteerId');

  // Check access on mount
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const res = await fetch(`/api/access-settings/user/${volunteerId}`);
        if (res.ok) {
          const data = await res.json();
          const canAccess = data.permissions?.includes('org_settings') || data.role === 'Admin';
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
    if (hasAccess) fetchOrgData();
  }, [hasAccess]);

  const fetchOrgData = async () => {
    try {
      const res = await fetch('/api/organization');
      if (res.ok) {
        const data = await res.json();
        setOrgData(data);
        setFormData(data);
      }
    } catch (error) {
      console.error('Error fetching org data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/organization', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setOrgData(formData);
        setEditMode(false);
        // Refresh global org data so it updates across the app
        refreshGlobalOrgData();
      }
    } catch (error) {
      console.error('Error saving org data:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddSocialLink = async () => {
    if (!newLink.platform || !newLink.url) return;
    
    setSaving(true);
    try {
      const res = await fetch('/api/organization/social-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLink)
      });
      if (res.ok) {
        setFormData(prev => ({ ...prev, [newLink.platform]: newLink.url }));
        setOrgData(prev => ({ ...prev, [newLink.platform]: newLink.url }));
        setShowAddLink(false);
        setNewLink({ platform: '', url: '' });
        // Refresh global org data
        refreshGlobalOrgData();
      }
    } catch (error) {
      console.error('Error adding social link:', error);
    } finally {
      setSaving(false);
    }
  };

  const socialPlatforms = [
    { key: 'facebook_url', name: 'Facebook', icon: 'fa-facebook', color: '#1877F2' },
    { key: 'instagram_url', name: 'Instagram', icon: 'fa-instagram', color: '#E4405F' },
    { key: 'twitter_url', name: 'Twitter/X', icon: 'fa-x-twitter', color: '#000000' },
    { key: 'linkedin_url', name: 'LinkedIn', icon: 'fa-linkedin', color: '#0A66C2' },
    { key: 'youtube_url', name: 'YouTube', icon: 'fa-youtube', color: '#FF0000' },
    { key: 'tiktok_url', name: 'TikTok', icon: 'fa-tiktok', color: '#000000' },
  ];

  const getActiveSocialLinks = () => {
    return socialPlatforms.filter(p => orgData?.[p.key]);
  };

  const getAvailablePlatforms = () => {
    return socialPlatforms.filter(p => !orgData?.[p.key]);
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
            <h1 className="text-lg font-bold">General Settings</h1>
            <p className="text-xs text-slate-500">Organization information</p>
          </div>
          {editMode ? (
            <div className="flex gap-2">
              <button
                onClick={() => { setEditMode(false); setFormData(orgData); }}
                className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditMode(true)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
            >
              <span className="material-symbols-outlined text-primary">edit</span>
            </button>
          )}
        </div>

        {/* Logo Section */}
        <section className="px-4 py-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6">
            <div className="flex flex-col items-center">
              {/* Current Logo */}
              <div className="w-24 h-24 bg-[#0B1B33] rounded-2xl flex items-center justify-center mb-4 p-3">
                <img 
                  src="/logo.png" 
                  alt="UYHO Logo" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="50%" x="50%" dominant-baseline="middle" text-anchor="middle" font-size="40" fill="white" font-family="system-ui">UYHO</text></svg>';
                  }}
                />
              </div>
              
              <h2 className="text-2xl font-bold text-[#0B1B33] dark:text-white">
                {orgData?.org_name || 'UYHO'}
              </h2>
              <p className="text-sm text-slate-500 text-center mt-1">
                {orgData?.org_full_name || 'United Young Help Organization'}
              </p>

              {editMode && (
                <button className="mt-4 px-4 py-2 border border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:border-primary hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-sm mr-1 align-middle">upload</span>
                  Change Logo
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Organization Details */}
        <section className="px-4 pb-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-3">
            Organization Details
          </h3>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            {/* Org Name */}
            <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-800">
              <label className="text-xs text-slate-500 uppercase font-bold">Short Name</label>
              {editMode ? (
                <input
                  type="text"
                  value={formData.org_name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, org_name: e.target.value }))}
                  className="w-full mt-1 text-sm bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              ) : (
                <p className="text-sm text-[#0B1B33] dark:text-white mt-1">{orgData?.org_name}</p>
              )}
            </div>

            {/* Full Name */}
            <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-800">
              <label className="text-xs text-slate-500 uppercase font-bold">Full Name</label>
              {editMode ? (
                <input
                  type="text"
                  value={formData.org_full_name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, org_full_name: e.target.value }))}
                  className="w-full mt-1 text-sm bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              ) : (
                <p className="text-sm text-[#0B1B33] dark:text-white mt-1">{orgData?.org_full_name}</p>
              )}
            </div>

            {/* Description */}
            <div className="px-4 py-4">
              <label className="text-xs text-slate-500 uppercase font-bold">Description</label>
              {editMode ? (
                <textarea
                  value={formData.org_description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, org_description: e.target.value }))}
                  rows={5}
                  className="w-full mt-1 text-sm bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              ) : (
                <p className="text-sm text-[#0B1B33] dark:text-white mt-1 leading-relaxed">
                  {orgData?.org_description}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Contact Information */}
        <section className="px-4 pb-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-3">
            Contact Information
          </h3>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            {/* Email */}
            <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <span className="material-symbols-outlined text-slate-400">mail</span>
              <div className="flex-1">
                <label className="text-xs text-slate-500 uppercase font-bold">Email</label>
                {editMode ? (
                  <input
                    type="email"
                    value={formData.contact_email || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                    className="w-full mt-1 text-sm bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                ) : (
                  <p className="text-sm text-[#0B1B33] dark:text-white mt-1">
                    {orgData?.contact_email || 'Not set'}
                  </p>
                )}
              </div>
            </div>

            {/* Phone */}
            <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <span className="material-symbols-outlined text-slate-400">phone</span>
              <div className="flex-1">
                <label className="text-xs text-slate-500 uppercase font-bold">Phone</label>
                {editMode ? (
                  <input
                    type="tel"
                    value={formData.contact_phone || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                    className="w-full mt-1 text-sm bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                ) : (
                  <p className="text-sm text-[#0B1B33] dark:text-white mt-1">
                    {orgData?.contact_phone || 'Not set'}
                  </p>
                )}
              </div>
            </div>

            {/* Address */}
            <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-800 flex items-start gap-3">
              <span className="material-symbols-outlined text-slate-400 mt-1">location_on</span>
              <div className="flex-1">
                <label className="text-xs text-slate-500 uppercase font-bold">Address</label>
                {editMode ? (
                  <textarea
                    value={formData.contact_address || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_address: e.target.value }))}
                    rows={2}
                    className="w-full mt-1 text-sm bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                ) : (
                  <p className="text-sm text-[#0B1B33] dark:text-white mt-1">
                    {orgData?.contact_address || 'Not set'}
                  </p>
                )}
              </div>
            </div>

            {/* Website */}
            <div className="px-4 py-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-slate-400">language</span>
              <div className="flex-1">
                <label className="text-xs text-slate-500 uppercase font-bold">Website</label>
                {editMode ? (
                  <input
                    type="url"
                    value={formData.website_url || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
                    className="w-full mt-1 text-sm bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                ) : (
                  <p className="text-sm text-primary mt-1">
                    {orgData?.website_url || 'Not set'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* App Download Settings */}
        <section className="px-4 pb-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-3">
            App Downloads
          </h3>
          
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            {/* Google Play URL */}
            <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                </svg>
              </div>
              <div className="flex-1">
                <label className="text-xs text-slate-500 uppercase font-bold">Google Play Store URL</label>
                {editMode ? (
                  <input
                    type="url"
                    value={formData.google_play_url || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, google_play_url: e.target.value }))}
                    placeholder="https://play.google.com/store/apps/..."
                    className="w-full mt-1 text-sm bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                ) : (
                  <p className="text-sm text-primary mt-1 truncate">
                    {orgData?.google_play_url || 'Not set'}
                  </p>
                )}
              </div>
            </div>

            {/* App Store URL */}
            <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-slate-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z"/>
                </svg>
              </div>
              <div className="flex-1">
                <label className="text-xs text-slate-500 uppercase font-bold">Apple App Store URL</label>
                {editMode ? (
                  <input
                    type="url"
                    value={formData.app_store_url || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, app_store_url: e.target.value }))}
                    placeholder="https://apps.apple.com/app/..."
                    className="w-full mt-1 text-sm bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                ) : (
                  <p className="text-sm text-primary mt-1 truncate">
                    {orgData?.app_store_url || 'Not set'}
                  </p>
                )}
              </div>
            </div>

            {/* App Release Date */}
            <div className="px-4 py-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-yellow-600">event</span>
              </div>
              <div className="flex-1">
                <label className="text-xs text-slate-500 uppercase font-bold">Upcoming Release Date</label>
                {editMode ? (
                  <input
                    type="date"
                    value={formData.app_release_date || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, app_release_date: e.target.value }))}
                    className="w-full mt-1 text-sm bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                ) : (
                  <p className="text-sm text-[#0B1B33] dark:text-white mt-1">
                    {orgData?.app_release_date 
                      ? new Date(orgData.app_release_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                      : 'Not set'}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <p className="text-xs text-slate-400 mt-2 px-1">
            Leave URLs empty to show "Coming Soon" on the Downloads page
          </p>
        </section>

        {/* Social Media Links */}
        <section className="px-4 pb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">
              Social Media
            </h3>
            {getAvailablePlatforms().length > 0 && (
              <button
                onClick={() => setShowAddLink(true)}
                className="text-xs text-primary font-bold flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Add Link
              </button>
            )}
          </div>
          
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            {getActiveSocialLinks().length === 0 ? (
              <div className="px-4 py-8 text-center">
                <span className="material-symbols-outlined text-4xl text-slate-300 mb-2 block">share</span>
                <p className="text-sm text-slate-500">No social media links added</p>
                <button
                  onClick={() => setShowAddLink(true)}
                  className="mt-3 text-sm text-primary font-medium"
                >
                  Add your first link
                </button>
              </div>
            ) : (
              getActiveSocialLinks().map((platform, index) => (
                <div 
                  key={platform.key}
                  className={`px-4 py-4 flex items-center gap-3 ${
                    index !== getActiveSocialLinks().length - 1 ? 'border-b border-slate-100 dark:border-slate-800' : ''
                  }`}
                >
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: platform.color + '15' }}
                  >
                    <i className={`fa-brands ${platform.icon} text-lg`} style={{ color: platform.color }}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 uppercase font-bold">{platform.name}</p>
                    {editMode ? (
                      <input
                        type="url"
                        value={formData[platform.key] || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, [platform.key]: e.target.value }))}
                        className="w-full mt-1 text-sm bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    ) : (
                      <p className="text-sm text-primary truncate">{orgData[platform.key]}</p>
                    )}
                  </div>
                  {!editMode && (
                    <a
                      href={orgData[platform.key]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                    >
                      <span className="material-symbols-outlined text-slate-400">open_in_new</span>
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        {/* Add Social Link Modal */}
        {showAddLink && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-bold">Add Social Link</h3>
                <button
                  onClick={() => { setShowAddLink(false); setNewLink({ platform: '', url: '' }); }}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              
              <div className="p-4 space-y-4">
                <div>
                  <label className="text-xs text-slate-500 uppercase font-bold mb-2 block">Platform</label>
                  <div className="grid grid-cols-3 gap-2">
                    {getAvailablePlatforms().map(platform => (
                      <button
                        key={platform.key}
                        onClick={() => setNewLink(prev => ({ ...prev, platform: platform.key }))}
                        className={`p-3 rounded-xl border-2 transition-colors ${
                          newLink.platform === platform.key
                            ? 'border-primary bg-primary/5'
                            : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'
                        }`}
                      >
                        <i className={`fa-brands ${platform.icon} text-xl block mb-1`} style={{ color: platform.color }}></i>
                        <p className="text-[10px] text-slate-500 truncate">{platform.name}</p>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-xs text-slate-500 uppercase font-bold mb-2 block">URL</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={newLink.url}
                    onChange={(e) => setNewLink(prev => ({ ...prev, url: e.target.value }))}
                    className="w-full text-sm bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                <button
                  onClick={() => { setShowAddLink(false); setNewLink({ platform: '', url: '' }); }}
                  className="flex-1 py-2.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSocialLink}
                  disabled={!newLink.platform || !newLink.url || saving}
                  className="flex-1 py-2.5 text-sm bg-primary text-white rounded-lg disabled:opacity-50"
                >
                  {saving ? 'Adding...' : 'Add Link'}
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
