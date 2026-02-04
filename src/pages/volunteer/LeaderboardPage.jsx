import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import VolunteerFooter from '../../components/VolunteerFooter';

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const [submenu, setSubmenu] = useState('leaderboard');
  const [wings, setWings] = useState([]);
  const [parentWingId, setParentWingId] = useState(null);
  const [loadingWings, setLoadingWings] = useState(false);
  
  // Leaderboard state
  const [statistics, setStatistics] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [filterWing, setFilterWing] = useState('all');
  const [totalVolunteers, setTotalVolunteers] = useState(0);
  
  // Structure state
  const [orgStructure, setOrgStructure] = useState(null);
  const [loadingStructure, setLoadingStructure] = useState(false);
  const [expandedWings, setExpandedWings] = useState({});
  
  const volunteerId = localStorage.getItem('volunteerId');
  const ITEMS_PER_PAGE = 20;
  const LOAD_MORE_COUNT = 10;
  
  const submenuTabs = [
    { key: 'leaderboard', label: 'Leaderboard', icon: 'leaderboard' },
    { key: 'structure', label: 'Structure', icon: 'account_tree' },
    { key: 'wings', label: 'Org Wings', icon: 'location_city' }
  ];

  // Fetch global statistics
  const fetchStatistics = async () => {
    try {
      const res = await fetch('/api/statistics');
      if (res.ok) {
        const data = await res.json();
        setStatistics(data);
      }
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
    }
  };

  // Fetch organization structure
  const fetchOrgStructure = async () => {
    setLoadingStructure(true);
    try {
      const res = await fetch('/api/org-structure');
      if (res.ok) {
        const data = await res.json();
        setOrgStructure(data);
      }
    } catch (err) {
      console.error('Failed to fetch org structure:', err);
    } finally {
      setLoadingStructure(false);
    }
  };

  // Fetch leaderboard data
  const fetchLeaderboard = useCallback(async (reset = false) => {
    const currentOffset = reset ? 0 : offset;
    const limit = reset ? ITEMS_PER_PAGE : LOAD_MORE_COUNT;
    
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    
    try {
      const url = `/api/leaderboard?limit=${limit}&offset=${currentOffset}${volunteerId ? `&userId=${volunteerId}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        
        if (reset) {
          setLeaderboard(data.leaderboard || []);
          setOffset(data.leaderboard?.length || 0);
        } else {
          setLeaderboard(prev => [...prev, ...(data.leaderboard || [])]);
          setOffset(prev => prev + (data.leaderboard?.length || 0));
        }
        
        setUserRank(data.userRank);
        setHasMore(data.hasMore);
        setTotalVolunteers(data.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [offset, volunteerId]);

  useEffect(() => {
    if (submenu === 'leaderboard') {
      fetchStatistics();
      fetchLeaderboard(true);
    }
  }, [submenu]);

  useEffect(() => {
    if (submenu === 'structure') {
      fetchOrgStructure();
    }
  }, [submenu]);

  useEffect(() => {
    if (submenu === 'wings') {
      fetchWings();
    }
  }, [submenu]);

  const fetchWings = async () => {
    setLoadingWings(true);
    try {
      const wingsRes = await fetch('/api/wings?status=approved');
      if (wingsRes.ok) {
        const wingsData = await wingsRes.json();
        setWings(wingsData);
      }
      
      if (volunteerId) {
        const userWingsRes = await fetch(`/api/volunteers/${volunteerId}/wings`);
        if (userWingsRes.ok) {
          const userWings = await userWingsRes.json();
          const parent = userWings.find(w => w.is_parent === 1) || userWings[0];
          if (parent) setParentWingId(parent.wing_id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch wings:', err);
    } finally {
      setLoadingWings(false);
    }
  };

  const sortedWings = [...wings].sort((a, b) => {
    if (a.id === parentWingId) return -1;
    if (b.id === parentWingId) return 1;
    return 0;
  });

  const handleLoadMore = () => {
    fetchLeaderboard(false);
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num?.toString() || '0';
  };

  const formatCompact = (num) => {
    if (num >= 1000) return `${Math.round(num / 1000)}k`;
    return num?.toString() || '0';
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return '🏆';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  const getRankStyle = (rank) => {
    if (rank === 1) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    if (rank === 2) return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    if (rank === 3) return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
    return '';
  };

  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="bg-[#fff] dark:bg-gray-900 min-h-screen font-display text-[#222] dark:text-white antialiased flex flex-col">
      <main className="max-w-md mx-auto w-full pb-32">
        {/* Submenu Tabs */}
        <div className="flex mt-2">
          {submenuTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setSubmenu(tab.key)}
              className={`flex-1 py-3 text-sm font-bold ${submenu === tab.key ? 'text-[#1B8398] border-b-2 border-[#1B8398] bg-white dark:bg-gray-800 shadow-sm' : 'text-gray-500 border-b-2 border-transparent'} relative flex items-center justify-center gap-2 transition-all`}
            >
              <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {submenu === 'leaderboard' && (
          <>
            {/* Impact Card */}
            <section className="p-4">
              <div className="bg-[#222] dark:bg-gray-800 rounded-3xl p-6 text-white overflow-hidden relative">
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1">Total Global Impact</p>
                      <h3 className="text-3xl font-bold">৳{formatNumber(statistics?.totalDonations || 0)}+</h3>
                    </div>
                    <div className="bg-[#0D9488]/20 border border-[#0D9488]/30 px-3 py-1 rounded-full flex items-center gap-1.5">
                      <span className="size-2 bg-[#0D9488] rounded-full animate-pulse"></span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#0D9488]">Live 2026</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-4">
                    <div>
                      <p className="text-white/50 text-[9px] uppercase font-bold mb-1">Volunteers</p>
                      <p className="text-sm font-bold">{formatNumber(statistics?.totalVolunteers || 0)}</p>
                    </div>
                    <div>
                      <p className="text-white/50 text-[9px] uppercase font-bold mb-1">Lives Saved</p>
                      <p className="text-sm font-bold">{formatNumber(statistics?.livesImpacted || 0)}</p>
                    </div>
                    <div>
                      <p className="text-white/50 text-[9px] uppercase font-bold mb-1">Wings</p>
                      <p className="text-sm font-bold">{statistics?.totalWings || 0} Unit</p>
                    </div>
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#0D9488]/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
              </div>
            </section>

            {/* User's Rank Card */}
            {userRank && (
              <section className="px-4 mb-4">
                <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-2xl p-4 border border-primary/20">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img src={userRank.avatar || '/avatars/avatar_1.svg'} alt={userRank.full_name} className="w-14 h-14 rounded-full object-cover border-2 border-primary" />
                      <div className="absolute -bottom-1 -right-1 bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full">#{userRank.rank}</div>
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] text-gray-500 uppercase font-bold">Your Rank This Month</p>
                      <p className="font-bold text-lg">{userRank.full_name}</p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] flex-wrap">
                        <span className="text-primary font-bold">৳{formatCompact(userRank.monthly_donations)} Don</span>
                        <span className="text-green-600 font-bold">৳{formatCompact(userRank.monthly_collected || 0)} Col</span>
                        <span className="text-purple-600 font-bold">{formatCompact(userRank.respect_points)} Rsp</span>
                        <span className="text-blue-600 font-bold">{formatCompact(userRank.monthly_hours)} Hrs</span>
                        <span className="text-orange-500 font-bold">{formatNumber(userRank.score)} Pts</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Rankings Section */}
            <section className="px-4 mb-4">
              <div className="flex justify-between items-end mb-3">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-[#BDBDBD] mb-1">Top Humanitarians</h4>
                  <p className="text-2xl font-bold text-[#222] dark:text-white">Rankings</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setFilterWing('all')} className={`text-[11px] font-bold px-3 py-2 rounded-full ${filterWing === 'all' ? 'bg-[#222] dark:bg-primary text-white' : 'border border-[#E0E0E0] dark:border-gray-700 text-[#222] dark:text-white bg-white dark:bg-gray-800'}`}>All Wings</button>
                  <div className="text-[11px] font-bold px-3 py-2 rounded-full border border-[#E0E0E0] dark:border-gray-700 text-[#222] dark:text-white bg-white dark:bg-gray-800">{currentMonth}</div>
                </div>
              </div>

              {loading ? (
                <div className="bg-white dark:bg-gray-800 border border-[#F0F0F0] dark:border-gray-700 rounded-2xl p-8 flex items-center justify-center">
                  <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 border border-[#F0F0F0] dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#F7F7F7] dark:bg-gray-900 border-b border-[#F0F0F0] dark:border-gray-700">
                        <th className="py-2 pl-2 pr-1 text-[9px] font-bold uppercase tracking-wider text-[#BDBDBD] w-8">#</th>
                        <th className="py-2 px-1 text-[9px] font-bold uppercase tracking-wider text-[#BDBDBD]">Volunteer</th>
                        <th className="py-2 px-1 text-[9px] font-bold uppercase tracking-wider text-[#BDBDBD] text-center">Don</th>
                        <th className="py-2 px-1 text-[9px] font-bold uppercase tracking-wider text-[#BDBDBD] text-center">Col</th>
                        <th className="py-2 px-1 text-[9px] font-bold uppercase tracking-wider text-[#BDBDBD] text-center">Rsp</th>
                        <th className="py-2 px-1 text-[9px] font-bold uppercase tracking-wider text-[#BDBDBD] text-center">Hrs</th>
                        <th className="py-2 pl-1 pr-2 text-[9px] font-bold uppercase tracking-wider text-[#BDBDBD] text-right">Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-gray-500">
                            <span className="material-symbols-outlined text-4xl text-gray-300 block mb-2">leaderboard</span>
                            No leaderboard data available
                          </td>
                        </tr>
                      ) : (
                        leaderboard.map((volunteer) => {
                          const isCurrentUser = volunteerId && volunteer.id.toString() === volunteerId.toString();
                          return (
                            <tr key={volunteer.id} className={`group border-b border-[#F0F0F0] dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer ${isCurrentUser ? 'bg-primary/5' : ''} ${getRankStyle(volunteer.rank)}`} onClick={() => navigate(`/volunteer/profile/${volunteer.id}`)}>
                              <td className="py-2 pl-2 pr-1 text-[#222] dark:text-white font-bold">
                                {String(volunteer.rank).padStart(2, '0')} 
                                {getRankBadge(volunteer.rank) && <span className="text-xs ml-1">{getRankBadge(volunteer.rank)}</span>}
                              </td>
                              <td className="py-2 px-1">
                                <div className="flex items-center gap-1.5">
                                  <img src={volunteer.avatar || '/avatars/avatar_1.svg'} alt={volunteer.full_name} className="w-6 h-6 rounded-full object-cover" />
                                  <div>
                                    <span className="block font-bold text-[#222] dark:text-white text-xs truncate max-w-[80px]">
                                      {volunteer.full_name}
                                      {isCurrentUser && <span className="text-primary ml-1">(You)</span>}
                                    </span>
                                    <span className="text-[9px] text-gray-500 truncate block max-w-[80px]">{volunteer.wing || 'UYHO'}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-2 px-1 text-center font-bold text-primary text-[10px]">{formatCompact(volunteer.monthly_donations)}</td>
                              <td className="py-2 px-1 text-center font-bold text-green-600 text-[10px]">{formatCompact(volunteer.monthly_collected || 0)}</td>
                              <td className="py-2 px-1 text-center font-bold text-purple-600 text-[10px]">{formatCompact(volunteer.respect_points)}</td>
                              <td className="py-2 px-1 text-center font-bold text-blue-600 text-[10px]">{formatCompact(volunteer.monthly_hours)}</td>
                              <td className="py-2 pl-1 pr-2 text-right font-bold text-[#0D9488] text-[10px]">{formatNumber(volunteer.score)}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Load More Button */}
              {hasMore && !loading && leaderboard.length > 0 && (
                <div className="mt-4">
                  <button onClick={handleLoadMore} disabled={loadingMore} className="w-full py-4 text-[13px] font-bold text-[#222] dark:text-white uppercase tracking-widest border border-[#F0F0F0] dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 flex items-center justify-center gap-2">
                    {loadingMore ? (
                      <><span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>Loading...</>
                    ) : (
                      <><span className="material-symbols-outlined text-lg">expand_more</span>Load 10 More ({totalVolunteers - leaderboard.length} remaining)</>
                    )}
                  </button>
                </div>
              )}

              {/* Scoring Info */}
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">How Scores Work</h5>
                <div className="grid grid-cols-4 gap-2 text-[10px]">
                  <div className="bg-white dark:bg-gray-900 p-2 rounded-lg text-center">
                    <p className="text-primary font-bold">Donated</p>
                    <p className="text-gray-500">0.1 pts/৳</p>
                  </div>
                  <div className="bg-white dark:bg-gray-900 p-2 rounded-lg text-center">
                    <p className="text-green-600 font-bold">Collected</p>
                    <p className="text-gray-500">0.05 pts/৳</p>
                  </div>
                  <div className="bg-white dark:bg-gray-900 p-2 rounded-lg text-center">
                    <p className="text-purple-600 font-bold">Respect</p>
                    <p className="text-gray-500">1 pt each</p>
                  </div>
                  <div className="bg-white dark:bg-gray-900 p-2 rounded-lg text-center">
                    <p className="text-blue-600 font-bold">Hours</p>
                    <p className="text-gray-500">10 pts/hr</p>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
        
        {submenu === 'structure' && (
          <>
            {loadingStructure ? (
              <div className="flex items-center justify-center py-20">
                <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
              </div>
            ) : (
              <>
                {/* Central Committee Section */}
                <section className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="size-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-lg">star</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-[#222] dark:text-white">Central Committee</h3>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Executive Leadership</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    {orgStructure?.centralCommittee?.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">No central committee members</p>
                    ) : (
                      orgStructure?.centralCommittee?.map((member, idx) => (
                        <div 
                          key={member.id} 
                          onClick={() => navigate(`/volunteer/profile/${member.id}`)}
                          className="bg-white dark:bg-gray-800 border border-black/5 dark:border-gray-700 rounded-2xl p-4 shadow-sm cursor-pointer hover:shadow-md transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <img 
                                src={member.avatar || '/avatars/avatar_1.svg'} 
                                alt={member.full_name} 
                                className={`size-14 rounded-xl object-cover border-2 ${idx === 0 ? 'border-amber-500' : 'border-primary/30'}`}
                              />
                              {idx === 0 && (
                                <div className="absolute -top-1 -right-1 size-5 bg-amber-500 rounded-full flex items-center justify-center">
                                  <span className="material-symbols-outlined text-white text-xs" style={{fontVariationSettings: '"FILL" 1'}}>verified</span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md border ${idx === 0 ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-primary/10 text-primary border-primary/20'}`}>
                                  {idx === 0 ? 'Chief' : 'Executive'}
                                </span>
                              </div>
                              <h4 className="font-bold text-[#222] dark:text-white truncate">{member.full_name}</h4>
                              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-tight">{member.position}</p>
                            </div>
                            <span className="material-symbols-outlined text-gray-300">chevron_right</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                {/* Wing Chiefs Section */}
                <section className="px-4 pb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="size-8 rounded-lg bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-lg">shield_person</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-[#222] dark:text-white">Wing Chiefs</h3>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Regional Leadership</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    {orgStructure?.wingChiefs?.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">No wing chiefs available</p>
                    ) : (
                      orgStructure?.wingChiefs?.map((chief) => (
                        <div 
                          key={`${chief.wing_id}-${chief.id}`}
                          onClick={() => navigate(`/volunteer/profile/${chief.id}`)}
                          className="bg-white dark:bg-gray-800 border border-black/5 dark:border-gray-700 rounded-2xl p-4 shadow-sm cursor-pointer hover:shadow-md transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <img 
                                src={chief.avatar || '/avatars/avatar_1.svg'} 
                                alt={chief.full_name} 
                                className="size-14 rounded-xl object-cover border-2 border-teal-500/50"
                              />
                              <div className="absolute -bottom-1 -right-1 size-5 bg-teal-500 rounded-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-white text-[10px]">location_city</span>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-600 border border-teal-500/20">
                                  Wing Chief
                                </span>
                              </div>
                              <h4 className="font-bold text-[#222] dark:text-white truncate">{chief.full_name}</h4>
                              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-tight">{chief.wing_role}</p>
                              <p className="text-[9px] text-primary font-medium mt-0.5">{chief.wing_name}</p>
                            </div>
                            <span className="material-symbols-outlined text-gray-300">chevron_right</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                {/* Wing Committees Section */}
                {orgStructure?.wingCommittees?.length > 0 && (
                  <section className="px-4 pb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="size-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-lg">groups</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-[#222] dark:text-white">Wing Committees</h3>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Full Wing Leadership</p>
                      </div>
                    </div>
                    
                    {orgStructure.wingCommittees.map((wing) => (
                      <div key={wing.wing_id} className="mb-4">
                        <button 
                          onClick={() => setExpandedWings(prev => ({ ...prev, [wing.wing_id]: !prev[wing.wing_id] }))}
                          className="w-full bg-white dark:bg-gray-800 border border-black/5 dark:border-gray-700 rounded-xl p-3 shadow-sm flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-lg overflow-hidden bg-purple-100 dark:bg-purple-900/30">
                              {wing.wing_image ? (
                                <img src={wing.wing_image} alt={wing.wing_name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600">
                                  <span className="text-white text-xs font-bold">{wing.wing_name?.split(' ').map(w => w[0]).join('').substring(0, 2)}</span>
                                </div>
                              )}
                            </div>
                            <div className="text-left">
                              <h4 className="font-bold text-[#222] dark:text-white text-sm">{wing.wing_name}</h4>
                              <p className="text-[10px] text-gray-500">{wing.members?.length || 0} Committee Members</p>
                            </div>
                          </div>
                          <span className={`material-symbols-outlined text-gray-400 transition-transform ${expandedWings[wing.wing_id] ? 'rotate-180' : ''}`}>expand_more</span>
                        </button>
                        
                        {expandedWings[wing.wing_id] && (
                          <div className="mt-2 ml-4 flex flex-col gap-2">
                            {wing.members?.map((member, idx) => (
                              <div 
                                key={member.id}
                                onClick={() => navigate(`/volunteer/profile/${member.id}`)}
                                className="bg-gray-50 dark:bg-gray-800/50 border border-black/5 dark:border-gray-700 rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all"
                              >
                                <div className="relative">
                                  <img 
                                    src={member.avatar || '/avatars/avatar_1.svg'} 
                                    alt={member.full_name} 
                                    className="size-10 rounded-lg object-cover"
                                  />
                                  <div className="absolute -bottom-0.5 -right-0.5 size-4 bg-purple-500 rounded-full flex items-center justify-center text-white text-[8px] font-bold">
                                    {idx + 1}
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-bold text-[#222] dark:text-white text-xs truncate">{member.full_name}</h5>
                                  <p className="text-[9px] text-purple-600 font-medium">{member.wing_role}</p>
                                </div>
                                <span className="material-symbols-outlined text-gray-300 text-sm">chevron_right</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </section>
                )}
              </>
            )}
          </>
        )}

        {submenu === 'wings' && (
          <>
            {loadingWings ? (
              <div className="flex items-center justify-center py-20">
                <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
              </div>
            ) : (
              <section className="p-4 flex flex-col gap-3">
                {sortedWings.length === 0 ? (
                  <div className="text-center py-12">
                    <span className="material-symbols-outlined text-5xl text-gray-300 mb-2">location_city</span>
                    <p className="text-gray-500">No wings available</p>
                  </div>
                ) : (
                  sortedWings.map((wing) => (
                    <button key={wing.id} onClick={() => navigate(`/volunteer/wing/${wing.id}`)} className={`w-full bg-white dark:bg-gray-800 border rounded-2xl p-4 shadow-sm text-left hover:shadow-md transition-all ${wing.id === parentWingId ? 'border-primary border-2' : 'border-black/5 dark:border-gray-700'}`}>
                      <div className="flex items-center gap-3">
                        <div className="size-14 rounded-xl overflow-hidden bg-primary/10 flex-shrink-0">
                          {wing.image ? (
                            <img src={wing.image} alt={wing.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-primary/70">
                              <span className="text-white text-lg font-bold">{wing.name?.split(' ').map(w => w[0]).join('').substring(0, 2)}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-[#222] dark:text-white truncate">{wing.name}</h4>
                            {wing.id === parentWingId && (
                              <span className="flex-shrink-0 px-2 py-0.5 bg-primary/10 text-primary text-[8px] font-bold uppercase rounded-full">Your Wing</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate">{wing.description || 'UYHO Wing'}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{wing.location && `${wing.location} • `}{wing.member_count || 0} Members</p>
                        </div>
                        <span className="material-symbols-outlined text-gray-300">chevron_right</span>
                      </div>
                    </button>
                  ))
                )}
              </section>
            )}
          </>
        )}
      </main>
      <VolunteerFooter />
    </div>
  );
}
