import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import VolunteerFooter from '../../components/VolunteerFooter';

export default function PrivacySettingsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    allies_visibility: 'public' // public, allies, none
  });

  const currentUserId = localStorage.getItem('volunteerId');

  useEffect(() => {
    fetchPrivacySettings();
  }, []);

  const fetchPrivacySettings = async () => {
    try {
      const res = await fetch(`/api/privacy/${currentUserId}`);
      if (res.ok) {
        const data = await res.json();
        setSettings({
          allies_visibility: data.allies_visibility || 'public'
        });
      }
    } catch (error) {
      console.error('Error fetching privacy settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (key, value) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/privacy/${currentUserId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value })
      });
      if (res.ok) {
        setSettings(prev => ({ ...prev, [key]: value }));
      }
    } catch (error) {
      console.error('Error saving privacy setting:', error);
    } finally {
      setSaving(false);
    }
  };

  const visibilityOptions = [
    { value: 'public', label: 'Public', description: 'Everyone can see your ally list', icon: 'public' },
    { value: 'allies', label: 'Allies Only', description: 'Only your allies can see your ally list', icon: 'group' },
    { value: 'none', label: 'No One', description: 'Your ally list is completely private', icon: 'lock' }
  ];

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
            <h1 className="text-lg font-bold">Privacy Settings</h1>
            <p className="text-xs text-slate-500">Control who sees your information</p>
          </div>
          {saving && (
            <span className="material-symbols-outlined animate-spin text-primary">
              progress_activity
            </span>
          )}
        </div>

        {/* Privacy Options */}
        <div className="px-4 py-6">
          {/* Ally List Visibility */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary">visibility</span>
              <h2 className="text-base font-bold text-[#0B1B33] dark:text-white">
                Who can view your ally list?
              </h2>
            </div>
            
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
              {visibilityOptions.map((option, index) => (
                <button
                  key={option.value}
                  onClick={() => handleSave('allies_visibility', option.value)}
                  className={`w-full px-4 py-4 flex items-center gap-4 text-left transition-colors
                    ${index !== visibilityOptions.length - 1 ? 'border-b border-slate-100 dark:border-slate-800' : ''}
                    ${settings.allies_visibility === option.value ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}
                  `}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                    ${settings.allies_visibility === option.value 
                      ? 'bg-primary text-white' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    <span className="material-symbols-outlined">{option.icon}</span>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className={`font-semibold text-sm ${
                      settings.allies_visibility === option.value 
                        ? 'text-primary' 
                        : 'text-[#0B1B33] dark:text-white'
                    }`}>
                      {option.label}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">{option.description}</p>
                  </div>
                  
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                    ${settings.allies_visibility === option.value 
                      ? 'border-primary bg-primary' 
                      : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {settings.allies_visibility === option.value && (
                      <span className="material-symbols-outlined text-white text-sm">check</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 flex gap-3">
            <span className="material-symbols-outlined text-blue-500 flex-shrink-0">info</span>
            <div>
              <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-1">
                Privacy Tip
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-300">
                Your privacy settings only affect who can see your ally list. 
                Other volunteers can still view your profile and send you messages.
              </p>
            </div>
          </div>

          {/* More Settings Coming Soon */}
          <section className="mt-8">
            <h2 className="text-base font-bold text-[#0B1B33] dark:text-white mb-4">
              More Settings
            </h2>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-4">
              <div className="flex items-center gap-3 text-slate-400">
                <span className="material-symbols-outlined">construction</span>
                <p className="text-sm">More privacy options coming soon...</p>
              </div>
            </div>
          </section>
        </div>
      </main>
      <VolunteerFooter />
    </div>
  );
}
