import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import VolunteerFooter from '../../components/VolunteerFooter';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [volunteer, setVolunteer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [allyCount, setAllyCount] = useState(0);
  const [badges, setBadges] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchActivities();
    fetchAllyCount();
    fetchBadges();
  }, [navigate]);

  const fetchProfile = async () => {
    try {
      const volunteerId = localStorage.getItem('volunteerId');
      if (!volunteerId) {
        navigate('/volunteer/login');
        return;
      }
      const response = await fetch(`/api/volunteers/${volunteerId}`);
      if (!response.ok) throw new Error('Failed to fetch profile');
      const data = await response.json();
      setVolunteer(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      const volunteerId = localStorage.getItem('volunteerId');
      if (!volunteerId) return;
      const response = await fetch(`/api/volunteers/${volunteerId}/activities`);
      if (response.ok) {
        const data = await response.json();
        setActivities(data);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const fetchAllyCount = async () => {
    try {
      const volunteerId = localStorage.getItem('volunteerId');
      if (!volunteerId) return;
      const response = await fetch(`/api/allies/${volunteerId}/count`);
      if (response.ok) {
        const data = await response.json();
        setAllyCount(data.count);
      }
    } catch (error) {
      console.error('Error fetching ally count:', error);
    }
  };

  const fetchBadges = async () => {
    try {
      const volunteerId = localStorage.getItem('volunteerId');
      if (!volunteerId) return;
      const response = await fetch(`https://uyho.org/uyho-backend/api/volunteers/${volunteerId}/badges`);
      if (response.ok) {
        const data = await response.json();
        setBadges(data);
      }
    } catch (error) {
      console.error('Error fetching badges:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB] dark:bg-slate-950">
        <span className="material-symbols-outlined animate-spin text-4xl text-[#0B1B33] dark:text-white">
          progress_activity
        </span>
      </div>
    );
  }

  if (!volunteer) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F7FB] dark:bg-slate-950">
        <p className="text-red-600 font-bold mb-4">Failed to load profile</p>
        <button
          onClick={() => navigate('/volunteer/login')}
          className="px-6 py-2 bg-[#0B1B33] text-white rounded-lg"
        >
          Go to Login
        </button>
      </div>
    );
  }

  const initials = volunteer.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || 'V';

  return (
    <div className="min-h-screen bg-[#F5F7FB] dark:bg-slate-950">
      <main className="max-w-md mx-auto pb-32">
        {/* Avatar Section */}
        <div className="pt-8 pb-6 flex flex-col items-center">
          <div className="relative mb-4">
            <div className="w-32 h-32 rounded-full border-4 border-[#0B1B33] overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              {volunteer.avatar ? (
                <img
                  src={`${volunteer.avatar}?t=${Date.now()}`}
                  alt={volunteer.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white text-5xl font-bold">{initials}</span>
              )}
            </div>
            <div className="absolute bottom-0 right-0 bg-[#0B1B33] text-white p-2 rounded-full border-4 border-white dark:border-slate-950">
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: '"FILL" 1' }}>
                verified
              </span>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-[#0B1B33] dark:text-white text-center">{volunteer.full_name}</h1>
          <p className="text-sm text-[#6B7280] dark:text-slate-400 mt-1">
            {volunteer.central_role || volunteer.position || 'Volunteer'}
            {volunteer.parent_wing && (
              <> • <button onClick={() => navigate(`/volunteer/wing/${volunteer.parent_wing.wing_id}`)} className="hover:text-primary transition-colors">{volunteer.parent_wing.wing_name}</button></>
            )}
          </p>

          <div className="mt-4 flex items-center gap-2">
            <div className="px-4 py-2 rounded-full bg-[#E8F5EE] dark:bg-green-900/30 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase">Active Member</span>
            </div>
            <button 
              onClick={() => navigate(`/volunteer/allies/${localStorage.getItem('volunteerId')}`)}
              className="text-xs text-[#6B7280] dark:text-slate-400 font-medium hover:text-primary transition-colors"
            >
              • {allyCount} {allyCount === 1 ? 'Ally' : 'Allies'}
            </button>
          </div>
        </div>

        {/* Stats Section */}
        <section className="px-4 mb-6">
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-[#0B1B33] dark:bg-slate-800 text-white rounded-xl p-3 text-center flex flex-col items-center">
              <span className="material-symbols-outlined text-white text-sm mb-0.5">favorite</span>
              <p className="text-xl font-bold">{volunteer.lives_impacted || 0}</p>
              <p className="text-[9px] uppercase text-gray-300 mt-0.5">Impacted</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 text-[#0B1B33] dark:text-white rounded-xl p-3 text-center flex flex-col items-center">
              <span className="material-symbols-outlined text-primary text-sm mb-0.5">group</span>
              <p className="text-xl font-bold">{volunteer.teams_led || 0}</p>
              <p className="text-[9px] uppercase text-[#6B7280] dark:text-slate-400 mt-0.5">Teams</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 text-[#0B1B33] dark:text-white rounded-xl p-3 text-center flex flex-col items-center">
              <span className="material-symbols-outlined text-primary text-sm mb-0.5">schedule</span>
              <p className="text-xl font-bold">{volunteer.hours_given || 0}</p>
              <p className="text-[9px] uppercase text-[#6B7280] dark:text-slate-400 mt-0.5">Hours</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 text-[#0B1B33] dark:text-white rounded-xl p-3 text-center flex flex-col items-center">
              <span className="material-symbols-outlined text-primary text-sm mb-0.5">military_tech</span>
              <p className="text-xl font-bold">{volunteer.respect_points || volunteer.points || 0}</p>
              <p className="text-[9px] uppercase text-[#6B7280] dark:text-slate-400 mt-0.5">Respect</p>
            </div>
          </div>
        </section>

        {/* Membership Card */}
        <section className="px-4 mb-8">
          <div className="bg-[#0B1B33] text-white rounded-2xl p-6 shadow-lg">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-xs text-gray-300 uppercase tracking-wider">Official Membership</p>
              </div>
              <span className="material-symbols-outlined text-2xl">qr_code_2</span>
            </div>

            <p className="text-xs text-gray-400 uppercase mb-2">Membership ID</p>
            <p className="text-xl font-bold tracking-wide mb-6">{volunteer.digital_id || 'N/A'}</p>

            <div className="pt-6 border-t border-white/20 flex justify-between text-xs text-gray-300">
              <span>Status: Active</span>
              <span>Member Since: 2026</span>
            </div>
          </div>
        </section>

        {/* Hall of Fame - Actual Badges */}
        <section className="px-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-[#0B1B33] dark:text-white">Badges</h3>
            <button 
              onClick={() => navigate('/volunteer/badges')}
              className="text-sm text-primary font-medium"
            >
              View All
            </button>
          </div>
          {badges.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex-shrink-0 w-28 bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 rounded-xl flex flex-col items-center justify-center text-center p-4"
                >
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-2"
                    style={{ backgroundColor: `${badge.color}20` }}
                  >
                    <span 
                      className="material-symbols-outlined text-2xl"
                      style={{ color: badge.color }}
                    >
                      {badge.icon_url || 'military_tech'}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-[#0B1B33] dark:text-white line-clamp-2">{badge.name}</p>
                  <p className="text-[10px] text-gray-500 mt-1">
                    {new Date(badge.awarded_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 dark:bg-slate-900 rounded-xl">
              <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-slate-600 mb-2">military_tech</span>
              <p className="text-sm text-gray-500 dark:text-slate-400">No badges earned yet</p>
            </div>
          )}
        </section>

        {/* Profile Information */}
        <section className="px-6 mb-8">
          <h3 className="text-lg font-bold text-[#0B1B33] dark:text-white mb-4">Profile Information</h3>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#E5E7EB] dark:border-slate-700 divide-y dark:divide-slate-700">
            <ProfileItem icon="mail" label="Email" value={volunteer.email} />
            <ProfileItem
              icon="phone"
              label="Phone"
              value={volunteer.phone || 'Not provided'}
            />
            <ProfileItem
              icon="location_on"
              label="Address"
              value={volunteer.address || 'Not provided'}
            />
            <ProfileItem
              icon="school"
              label="Education"
              value={volunteer.education || 'Not provided'}
            />
            {volunteer.wings && volunteer.wings.length > 0 && (
              <button
                onClick={() => navigate('/volunteer/select-parent-wing')}
                className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#6B7280] dark:text-slate-400">location_city</span>
                  <div className="text-left">
                    <p className="text-xs uppercase text-[#6B7280] dark:text-slate-400 font-bold">Parent Wing</p>
                    <p className="text-sm text-[#0B1B33] dark:text-white">
                      {volunteer.parent_wing?.wing_name || volunteer.wings[0]?.wing_name || 'Select parent wing'}
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[#D1D5DB] dark:text-slate-600">chevron_right</span>
              </button>
            )}
            <button
              onClick={() => navigate('/volunteer/edit-profile', { state: { volunteer } })}
              className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#6B7280] dark:text-slate-400">edit</span>
                <div className="text-left">
                  <p className="text-xs uppercase text-[#6B7280] dark:text-slate-400 font-bold">Edit Profile</p>
                  <p className="text-sm text-[#0B1B33] dark:text-white">Update your information</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-[#D1D5DB] dark:text-slate-600">chevron_right</span>
            </button>
            <button
              onClick={() => {
                localStorage.clear();
                navigate('/volunteer/login');
              }}
              className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#6B7280] dark:text-slate-400">logout</span>
                <div className="text-left">
                  <p className="text-xs uppercase text-[#6B7280] dark:text-slate-400 font-bold">Sign Out</p>
                  <p className="text-sm text-[#0B1B33] dark:text-white">End your session</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-[#D1D5DB] dark:text-slate-600">chevron_right</span>
            </button>
          </div>
        </section>

        {/* System Settings */}
        <section className="px-6 mb-8">
          <h3 className="text-lg font-bold text-[#0B1B33] dark:text-white mb-4">System Settings</h3>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#E5E7EB] dark:border-slate-700">
            {/* Dark Mode Toggle */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-[#E5E7EB] dark:border-slate-700">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#6B7280] dark:text-slate-400">
                  {isDarkMode ? 'dark_mode' : 'light_mode'}
                </span>
                <div className="text-left">
                  <p className="text-xs uppercase text-[#6B7280] dark:text-slate-400 font-bold">Appearance</p>
                  <p className="text-sm text-[#0B1B33] dark:text-white">{isDarkMode ? 'Dark Mode' : 'Light Mode'}</p>
                </div>
              </div>
              <button
                onClick={toggleDarkMode}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  isDarkMode ? 'bg-primary' : 'bg-gray-300 dark:bg-slate-600'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    isDarkMode ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            
            <button
              onClick={() => navigate('/volunteer/privacy-settings')}
              className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#6B7280] dark:text-slate-400">lock</span>
                <div className="text-left">
                  <p className="text-xs uppercase text-[#6B7280] dark:text-slate-400 font-bold">Privacy Settings</p>
                  <p className="text-sm text-[#0B1B33] dark:text-white">Control who sees your information</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-[#D1D5DB]">chevron_right</span>
            </button>
          </div>
        </section>

        {/* Recent Activity */}
        <section className="px-6 mb-8">
          <h3 className="text-lg font-bold text-[#0B1B33] dark:text-white mb-4">Recent Activity</h3>
          {activities.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#E5E7EB] dark:border-slate-800 p-6 text-center">
              <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-slate-600 mb-2">history</span>
              <p className="text-sm text-[#6B7280] dark:text-slate-400">No activities yet</p>
            </div>
          ) : (
            <div className="relative space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-slate-200 dark:before:bg-slate-800">
              {(showAllActivities ? activities : activities.slice(0, 3)).map((activity, index) => (
                <div key={activity.id} className="relative pl-10">
                  {/* Timeline Dot */}
                  <div
                    className={`absolute left-0 top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center z-10
                      ${activity.activity_type === 'joined_campaign' || activity.activity_type === 'joined_wing' || activity.activity_type === 'position_change'
                        ? "bg-white dark:bg-slate-950 border-blue-500"
                        : activity.activity_type === 'badge_earned'
                        ? "bg-white dark:bg-slate-950 border-amber-500"
                        : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                      }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        activity.activity_type === 'joined_campaign' || activity.activity_type === 'joined_wing' || activity.activity_type === 'position_change' 
                          ? "bg-blue-500" 
                          : activity.activity_type === 'badge_earned'
                          ? "bg-amber-500"
                          : "bg-slate-300"
                      }`}
                    />
                  </div>

                  {/* Content */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-bold text-[#0B1B33] dark:text-white">
                        {activity.activity_type === 'joined' 
                          ? 'Joined UYHO' 
                          : activity.activity_type === 'joined_wing'
                          ? activity.description
                          : activity.activity_type === 'position_change'
                          ? activity.description
                          : activity.activity_type === 'badge_earned'
                          ? 'Badge Earned 🏆'
                          : activity.campaign_title || 'Joined Campaign'}
                      </p>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {(() => {
                          const date = new Date(activity.created_at);
                          const now = new Date();
                          const diffMs = now - date;
                          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                          const diffWeeks = Math.floor(diffDays / 7);
                          const diffMonths = Math.floor(diffDays / 30);
                          
                          if (diffDays === 0) return 'Today';
                          if (diffDays === 1) return '1d ago';
                          if (diffDays < 7) return `${diffDays}d ago`;
                          if (diffWeeks === 1) return '1w ago';
                          if (diffWeeks < 4) return `${diffWeeks}w ago`;
                          if (diffMonths === 1) return '1m ago';
                          return `${diffMonths}m ago`;
                        })()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {activity.activity_type === 'joined' 
                        ? 'Became a volunteer member of United Young Help Organization.'
                        : activity.activity_type === 'joined_wing'
                        ? `Joined as ${activity.role} in this wing.`
                        : activity.activity_type === 'position_change'
                        ? `Position updated in the organization.`
                        : activity.activity_type === 'badge_earned'
                        ? activity.description
                        : `Joined as a team member in this campaign.`}
                    </p>

                    {activity.activity_type === 'badge_earned' && (
                      <div className="flex gap-2">
                        <span className="text-[9px] font-bold uppercase bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded text-amber-600">
                          Achievement
                        </span>
                      </div>
                    )}

                    {(activity.activity_type === 'joined_campaign' || activity.activity_type === 'joined_wing' || activity.activity_type === 'position_change') && activity.role && (
                      <div className="flex gap-2">
                        <span className="text-[9px] font-bold uppercase bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500">
                          {activity.role}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {activities.length > 3 && (
                <button
                  onClick={() => setShowAllActivities(!showAllActivities)}
                  className="ml-10 flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  {showAllActivities ? 'Show Less' : `View All (${activities.length})`}
                  <span className="material-symbols-outlined text-sm">
                    {showAllActivities ? 'expand_less' : 'expand_more'}
                  </span>
                </button>
              )}
            </div>
          )}
        </section>
      </main>
      <VolunteerFooter />
    </div>
  );
}

function ProfileItem({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between px-4 py-4">
      <div className="flex items-center gap-3 flex-1">
        <span className="material-symbols-outlined text-[#6B7280] dark:text-slate-400">{icon}</span>
        <div className="flex-1">
          <p className="text-xs uppercase text-[#6B7280] dark:text-slate-400 font-bold">{label}</p>
          <p className="text-sm text-[#0B1B33] dark:text-white truncate">{value}</p>
        </div>
      </div>
      <span className="material-symbols-outlined text-[#D1D5DB] dark:text-slate-600">chevron_right</span>
    </div>
  );
}
