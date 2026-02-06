import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import VolunteerFooter from '../../components/VolunteerFooter';

export default function CampaignRequestsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pendingCampaigns, setPendingCampaigns] = useState([]);
  const [pendingCourses, setPendingCourses] = useState([]);
  const [pendingDirectAids, setPendingDirectAids] = useState([]);
  const [pendingWings, setPendingWings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedDirectAid, setSelectedDirectAid] = useState(null);
  const [selectedWing, setSelectedWing] = useState(null);
  const [declineReason, setDeclineReason] = useState('');
  const [processing, setProcessing] = useState(null);
  const [filter, setFilter] = useState('pending'); // pending, approved, declined, all
  const [activeTab, setActiveTab] = useState('campaigns'); // campaigns, courses, directaid, wings

  useEffect(() => {
    if (activeTab === 'campaigns') {
      fetchCampaigns();
    } else if (activeTab === 'courses') {
      fetchCourses();
    } else if (activeTab === 'directaid') {
      fetchDirectAids();
    } else if (activeTab === 'wings') {
      fetchWings();
    }
  }, [filter, activeTab]);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      let url = '/api/campaigns';
      if (filter === 'pending') {
        url = '/api/campaigns/pending';
      } else if (filter === 'approved') {
        url = '/api/campaigns?status=approved';
      } else if (filter === 'declined') {
        url = '/api/campaigns?status=declined';
      }
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setPendingCampaigns(data);
      }
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    setLoading(true);
    try {
      let url = '/api/courses';
      if (filter === 'pending') {
        url = '/api/courses?status=pending';
      } else if (filter === 'approved') {
        url = '/api/courses?status=approved';
      } else if (filter === 'declined') {
        url = '/api/courses?status=declined';
      }
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setPendingCourses(data);
      }
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDirectAids = async () => {
    setLoading(true);
    try {
      let url = '/api/direct-aids?status=active';
      if (filter === 'pending') {
        url += '&approval_status=pending';
      } else if (filter === 'approved') {
        url += '&approval_status=approved';
      } else if (filter === 'declined') {
        url += '&approval_status=rejected';
      }
      
      // For pending, also try the admin endpoint
      if (filter === 'pending') {
        const res = await fetch('/api/direct-aids/admin/pending');
        if (res.ok) {
          const data = await res.json();
          setPendingDirectAids(data);
          setLoading(false);
          return;
        }
      }
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setPendingDirectAids(data);
      }
    } catch (err) {
      console.error('Failed to fetch direct aids:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWings = async () => {
    setLoading(true);
    try {
      let url = '/api/wings';
      if (filter === 'pending') {
        url = '/api/wings/pending';
      } else if (filter === 'approved') {
        url = '/api/wings?status=approved';
      } else if (filter === 'declined') {
        url = '/api/wings?status=declined';
      }
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setPendingWings(data);
      }
    } catch (err) {
      console.error('Failed to fetch wings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveWing = async (wingId) => {
    setProcessing(wingId);
    try {
      const res = await fetch(`/api/wings/${wingId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewerId: localStorage.getItem('volunteerId') })
      });
      if (res.ok) {
        fetchWings();
      }
    } catch (err) {
      console.error('Failed to approve wing:', err);
    } finally {
      setProcessing(null);
    }
  };

  const handleDeclineWing = async () => {
    if (!selectedWing) return;
    setProcessing(selectedWing.id);
    try {
      const res = await fetch(`/api/wings/${selectedWing.id}/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          reviewerId: localStorage.getItem('volunteerId'),
          reason: declineReason 
        })
      });
      if (res.ok) {
        fetchWings();
        setShowDeclineModal(false);
        setSelectedWing(null);
        setDeclineReason('');
      }
    } catch (err) {
      console.error('Failed to decline wing:', err);
    } finally {
      setProcessing(null);
    }
  };

  const handleApproveCampaign = async (campaignId) => {
    setProcessing(campaignId);
    try {
      const volunteerId = localStorage.getItem('volunteerId');
      const res = await fetch(`/api/campaigns/${campaignId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewerId: volunteerId })
      });
      if (res.ok) {
        await fetchCampaigns();
      }
    } catch (err) {
      console.error('Failed to approve campaign:', err);
    } finally {
      setProcessing(null);
    }
  };

  const handleApproveCourse = async (courseId) => {
    setProcessing(`course-${courseId}`);
    try {
      const volunteerId = localStorage.getItem('volunteerId');
      const res = await fetch(`/api/courses/${courseId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewedBy: volunteerId })
      });
      if (res.ok) {
        await fetchCourses();
      }
    } catch (err) {
      console.error('Failed to approve course:', err);
    } finally {
      setProcessing(null);
    }
  };

  const handleDeclineCampaign = async () => {
    if (!selectedCampaign || !declineReason.trim()) return;
    setProcessing(selectedCampaign.id);
    try {
      const volunteerId = localStorage.getItem('volunteerId');
      const res = await fetch(`/api/campaigns/${selectedCampaign.id}/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewerId: volunteerId, reason: declineReason })
      });
      if (res.ok) {
        await fetchCampaigns();
        setShowDeclineModal(false);
        setSelectedCampaign(null);
        setDeclineReason('');
      }
    } catch (err) {
      console.error('Failed to decline campaign:', err);
    } finally {
      setProcessing(null);
    }
  };

  const handleDeclineCourse = async () => {
    if (!selectedCourse || !declineReason.trim()) return;
    setProcessing(`course-${selectedCourse.id}`);
    try {
      const volunteerId = localStorage.getItem('volunteerId');
      const res = await fetch(`/api/courses/${selectedCourse.id}/decline`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewedBy: volunteerId, reason: declineReason })
      });
      if (res.ok) {
        await fetchCourses();
        setShowDeclineModal(false);
        setSelectedCourse(null);
        setDeclineReason('');
      }
    } catch (err) {
      console.error('Failed to decline course:', err);
    } finally {
      setProcessing(null);
    }
  };

  const handleApproveDirectAid = async (directAidId) => {
    setProcessing(`directaid-${directAidId}`);
    try {
      const res = await fetch(`/api/direct-aids/${directAidId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        await fetchDirectAids();
      }
    } catch (err) {
      console.error('Failed to approve direct aid:', err);
    } finally {
      setProcessing(null);
    }
  };

  const handleDeclineDirectAid = async () => {
    if (!selectedDirectAid) return;
    setProcessing(`directaid-${selectedDirectAid.id}`);
    try {
      const res = await fetch(`/api/direct-aids/${selectedDirectAid.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        await fetchDirectAids();
        setShowDeclineModal(false);
        setSelectedDirectAid(null);
        setDeclineReason('');
      }
    } catch (err) {
      console.error('Failed to decline direct aid:', err);
    } finally {
      setProcessing(null);
    }
  };

  const filteredCampaigns = pendingCampaigns.filter(c =>
    c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.wing?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.host_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCourses = pendingCourses.filter(c =>
    c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.instructor_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDirectAids = pendingDirectAids.filter(a =>
    a.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.beneficiary_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.creator_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredWings = pendingWings.filter(w =>
    w.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.created_by_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="text-[10px] font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded">Approved</span>;
      case 'declined':
        return <span className="text-[10px] font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded">Declined</span>;
      default:
        return <span className="text-[10px] font-bold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded">Pending</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] dark:bg-background-dark">
      <main className="max-w-md mx-auto pb-32">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Requests</h1>
            <p className="text-xs text-slate-500">Review campaigns and course submissions</p>
          </div>
        </div>

        {/* Type Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-x-auto">
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`flex-1 py-3 text-xs font-bold whitespace-nowrap px-2 ${activeTab === 'campaigns' ? 'text-primary border-b-2 border-primary' : 'text-slate-500'}`}
          >
            Campaigns
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            className={`flex-1 py-3 text-xs font-bold whitespace-nowrap px-2 ${activeTab === 'courses' ? 'text-primary border-b-2 border-primary' : 'text-slate-500'}`}
          >
            Courses
          </button>
          <button
            onClick={() => setActiveTab('directaid')}
            className={`flex-1 py-3 text-xs font-bold whitespace-nowrap px-2 ${activeTab === 'directaid' ? 'text-primary border-b-2 border-primary' : 'text-slate-500'}`}
          >
            Direct Aid
          </button>
          <button
            onClick={() => setActiveTab('wings')}
            className={`flex-1 py-3 text-xs font-bold whitespace-nowrap px-2 ${activeTab === 'wings' ? 'text-primary border-b-2 border-primary' : 'text-slate-500'}`}
          >
            Wings
          </button>
        </div>

        {/* Search & Filter */}
        <div className="px-4 py-4 space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
            <input
              type="text"
              placeholder={activeTab === 'campaigns' ? "Search campaigns..." : activeTab === 'wings' ? "Search wings..." : "Search..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[
              { key: 'pending', label: 'Pending', icon: 'schedule' },
              { key: 'approved', label: 'Approved', icon: 'check_circle' },
              { key: 'declined', label: 'Declined', icon: 'cancel' },
              { key: 'all', label: 'All', icon: 'list' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  filter === tab.key
                    ? 'bg-primary text-white'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Campaign List */}
        <div className="px-4">
          {activeTab === 'campaigns' && (
            <>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
                </div>
              ) : filteredCampaigns.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-xl p-8 text-center border border-slate-200 dark:border-slate-800">
                  <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 block">inbox</span>
                  <p className="text-slate-500 font-medium">No campaigns found</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {filter === 'pending' ? 'No pending requests to review' : `No ${filter} campaigns`}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredCampaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
                >
                  {/* Campaign Header with Image */}
                  <div className="relative">
                    <div 
                      className="h-32 bg-cover bg-center bg-slate-200"
                      style={{ backgroundImage: campaign.image ? `url('${campaign.image}')` : undefined }}
                    >
                      {!campaign.image && (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-4xl text-slate-400">image</span>
                        </div>
                      )}
                    </div>
                    <div className="absolute top-2 right-2">
                      {getStatusBadge(campaign.approval_status)}
                    </div>
                  </div>

                  {/* Campaign Info */}
                  <div className="p-4">
                    <h3 className="font-bold text-base mb-1">{campaign.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">{campaign.description}</p>

                    {/* Meta Info */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                        <span className="material-symbols-outlined text-xs">folder</span>
                        {campaign.wing}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                        <span className="material-symbols-outlined text-xs">payments</span>
                        ৳{campaign.goal?.toLocaleString() || 0}
                      </span>
                      {campaign.event_date && (
                        <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                          <span className="material-symbols-outlined text-xs">event</span>
                          {new Date(campaign.event_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {/* Host Info */}
                    <div className="flex items-center gap-2 py-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                        {campaign.host_avatar ? (
                          <img src={campaign.host_avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-sm text-slate-400">person</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{campaign.host_name || 'Unknown Host'}</p>
                        <p className="text-xs text-slate-400">Campaign Organizer</p>
                      </div>
                    </div>

                    {/* Decline Reason (if declined) */}
                    {campaign.approval_status === 'declined' && campaign.decline_reason && (
                      <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <p className="text-xs font-bold text-red-600 dark:text-red-400 mb-1">Decline Reason:</p>
                        <p className="text-xs text-red-700 dark:text-red-300">{campaign.decline_reason}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => navigate(`/volunteer/campaign/${campaign.id}`)}
                        className="flex-1 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">visibility</span>
                        View Details
                      </button>
                      
                      {campaign.approval_status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApproveCampaign(campaign.id)}
                            disabled={processing === campaign.id}
                            className="flex-1 py-2.5 text-xs font-bold text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                          >
                            {processing === campaign.id ? (
                              <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                            ) : (
                              <>
                                <span className="material-symbols-outlined text-sm">check</span>
                                Approve
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedCampaign(campaign);
                              setShowDeclineModal(true);
                            }}
                            disabled={processing === campaign.id}
                            className="flex-1 py-2.5 text-xs font-bold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">close</span>
                            Decline
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
            </>
          )}

          {/* Courses List */}
          {activeTab === 'courses' && (
            <>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
                </div>
              ) : filteredCourses.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-xl p-8 text-center border border-slate-200 dark:border-slate-800">
                  <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 block">school</span>
                  <p className="text-slate-500 font-medium">No courses found</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {filter === 'pending' ? 'No pending course requests to review' : `No ${filter} courses`}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredCourses.map((course) => (
                    <div
                      key={course.id}
                      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
                    >
                      {/* Course Header with Image */}
                      <div className="relative">
                        <div 
                          className="h-32 bg-cover bg-center bg-gradient-to-r from-purple-500 to-indigo-600"
                          style={{ backgroundImage: course.image ? `url('${course.image}')` : undefined }}
                        >
                          {!course.image && (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="material-symbols-outlined text-5xl text-white/70">school</span>
                            </div>
                          )}
                        </div>
                        <div className="absolute top-2 right-2">
                          {getStatusBadge(course.approval_status)}
                        </div>
                        {course.badge && (
                          <div className="absolute top-2 left-2">
                            <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded">{course.badge}</span>
                          </div>
                        )}
                      </div>

                      {/* Course Info */}
                      <div className="p-4">
                        <h3 className="font-bold text-base mb-1">{course.title}</h3>
                        <p className="text-xs text-slate-500 line-clamp-2 mb-3">{course.description}</p>

                        {/* Meta Info */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {course.category && (
                            <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                              <span className="material-symbols-outlined text-xs">category</span>
                              {course.category}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                            <span className="material-symbols-outlined text-xs">schedule</span>
                            {course.duration_hours || 0}h
                          </span>
                          <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                            <span className="material-symbols-outlined text-xs">menu_book</span>
                            {course.lessons_count || 0} lessons
                          </span>
                          {course.slide_file_name && (
                            <span className="flex items-center gap-1 text-xs text-purple-600 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded">
                              <span className="material-symbols-outlined text-xs">slideshow</span>
                              PPT
                            </span>
                          )}
                        </div>

                        {/* Instructor Info */}
                        <div className="flex items-center gap-2 py-2 border-t border-slate-100 dark:border-slate-800">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                            {course.instructor_avatar ? (
                              <img src={course.instructor_avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="material-symbols-outlined text-sm text-slate-400">person</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{course.instructor_name || 'Unknown Instructor'}</p>
                            <p className="text-xs text-slate-400">Course Instructor</p>
                          </div>
                        </div>

                        {/* Decline Reason (if declined) */}
                        {course.approval_status === 'declined' && course.decline_reason && (
                          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <p className="text-xs font-bold text-red-600 dark:text-red-400 mb-1">Decline Reason:</p>
                            <p className="text-xs text-red-700 dark:text-red-300">{course.decline_reason}</p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                          {course.approval_status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApproveCourse(course.id)}
                                disabled={processing === `course-${course.id}`}
                                className="flex-1 py-2.5 text-xs font-bold text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                              >
                                {processing === `course-${course.id}` ? (
                                  <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                                ) : (
                                  <>
                                    <span className="material-symbols-outlined text-sm">check</span>
                                    Approve
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedCourse(course);
                                  setShowDeclineModal(true);
                                }}
                                disabled={processing === `course-${course.id}`}
                                className="flex-1 py-2.5 text-xs font-bold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                              >
                                <span className="material-symbols-outlined text-sm">close</span>
                                Decline
                              </button>
                            </>
                          )}
                          {course.approval_status !== 'pending' && (
                            <span className="text-xs text-slate-400 w-full text-center">
                              {course.approval_status === 'approved' ? 'Course has been approved' : 'Course has been declined'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Direct Aid Tab Content */}
          {activeTab === 'directaid' && (
            <>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
                </div>
              ) : filteredDirectAids.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-xl p-8 text-center border border-slate-200 dark:border-slate-800">
                  <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 block">volunteer_activism</span>
                  <p className="text-slate-500 font-medium">No direct aids found</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {filter === 'pending' ? 'No pending requests to review' : `No ${filter} direct aids`}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredDirectAids.map((aid) => {
                    const progress = Math.min(((aid.raised_amount || 0) / (aid.goal_amount || 1)) * 100, 100);
                    return (
                      <div
                        key={aid.id}
                        className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
                      >
                        {/* Header with Image */}
                        <div className="relative">
                          <div className="h-32 bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                            <div className="size-20 rounded-full bg-white/20 overflow-hidden border-4 border-white/30">
                              <img 
                                src={aid.image || '/avatars/avatar_1.svg'} 
                                alt={aid.beneficiary_name || aid.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                          <div className="absolute top-2 right-2">
                            {getStatusBadge(aid.approval_status)}
                          </div>
                        </div>

                        {/* Info */}
                        <div className="p-4">
                          <h3 className="font-bold text-base mb-1">{aid.beneficiary_name || aid.title}</h3>
                          <p className="text-xs text-slate-500 line-clamp-2 mb-2">{aid.description}</p>
                          
                          {aid.bio && (
                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 italic">"{aid.bio}"</p>
                          )}

                          {/* Goal Progress */}
                          <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3 mb-3">
                            <div className="flex items-center justify-between text-xs mb-2">
                              <span className="font-bold text-green-600">৳{(aid.raised_amount || 0).toLocaleString()}</span>
                              <span className="text-slate-500">of ৳{(aid.goal_amount || 0).toLocaleString()}</span>
                            </div>
                            <div className="bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full"
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                            <p className="text-[10px] text-slate-400 text-center mt-1">{progress.toFixed(0)}% funded</p>
                          </div>

                          {/* Creator Info */}
                          <div className="flex items-center gap-2 py-2 border-t border-slate-100 dark:border-slate-800">
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                              {aid.creator_avatar ? (
                                <img src={aid.creator_avatar} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="material-symbols-outlined text-sm text-slate-400">person</span>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{aid.creator_name || 'Unknown'}</p>
                              <p className="text-xs text-slate-400">Campaign Creator</p>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                            {aid.approval_status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApproveDirectAid(aid.id)}
                                  disabled={processing === `directaid-${aid.id}`}
                                  className="flex-1 py-2.5 text-xs font-bold text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                                >
                                  {processing === `directaid-${aid.id}` ? (
                                    <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                                  ) : (
                                    <>
                                      <span className="material-symbols-outlined text-sm">check</span>
                                      Approve
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedDirectAid(aid);
                                    setShowDeclineModal(true);
                                  }}
                                  disabled={processing === `directaid-${aid.id}`}
                                  className="flex-1 py-2.5 text-xs font-bold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                                >
                                  <span className="material-symbols-outlined text-sm">close</span>
                                  Decline
                                </button>
                              </>
                            )}
                            {aid.approval_status !== 'pending' && (
                              <span className="text-xs text-slate-400 w-full text-center">
                                {aid.approval_status === 'approved' ? 'Direct aid has been approved' : 'Direct aid has been declined'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Wings Tab Content */}
          {activeTab === 'wings' && (
            <>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
                </div>
              ) : filteredWings.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-xl p-8 text-center border border-slate-200 dark:border-slate-800">
                  <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 block">location_city</span>
                  <p className="text-slate-500 font-medium">No wings found</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {filter === 'pending' ? 'No pending wing requests' : 
                     filter === 'approved' ? 'No approved wings yet' :
                     filter === 'declined' ? 'No declined wings' : 'No wings in the system'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 pb-4">
                  {filteredWings.map(wing => (
                    <div key={wing.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                      <div className="p-4">
                        {/* Wing Header */}
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden">
                            {wing.image ? (
                              <img src={wing.image} alt={wing.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="material-symbols-outlined text-primary text-xl">location_city</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-slate-900 dark:text-white">{wing.name}</h3>
                            <p className="text-xs text-slate-500">{wing.location || 'No location specified'}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                            wing.approval_status === 'approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-600' :
                            wing.approval_status === 'declined' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' :
                            'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
                          }`}>
                            {wing.approval_status === 'approved' ? 'Approved' : 
                             wing.approval_status === 'declined' ? 'Declined' : 'Pending'}
                          </span>
                        </div>

                        {/* Wing Description */}
                        {wing.description && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">{wing.description}</p>
                        )}

                        {/* Wing Stats */}
                        <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">group</span>
                            {wing.member_count || 0} members
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">calendar_today</span>
                            {new Date(wing.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Creator Info */}
                        <div className="flex items-center gap-2 py-2 border-t border-slate-100 dark:border-slate-800">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                            <span className="material-symbols-outlined text-sm text-slate-400">person</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{wing.created_by_name || 'Unknown'}</p>
                            <p className="text-xs text-slate-400">Wing Creator</p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                          {(wing.approval_status === 'pending' || !wing.approval_status) && (
                            <>
                              <button
                                onClick={() => handleApproveWing(wing.id)}
                                disabled={processing === wing.id}
                                className="flex-1 py-2.5 text-xs font-bold text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                              >
                                {processing === wing.id ? (
                                  <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                                ) : (
                                  <>
                                    <span className="material-symbols-outlined text-sm">check</span>
                                    Approve
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedWing(wing);
                                  setShowDeclineModal(true);
                                }}
                                disabled={processing === wing.id}
                                className="flex-1 py-2.5 text-xs font-bold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                              >
                                <span className="material-symbols-outlined text-sm">close</span>
                                Decline
                              </button>
                            </>
                          )}
                          {wing.approval_status && wing.approval_status !== 'pending' && (
                            <span className="text-xs text-slate-400 w-full text-center">
                              {wing.approval_status === 'approved' ? 'Wing has been approved' : 'Wing has been declined'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Decline Modal */}
      {showDeclineModal && (selectedCampaign || selectedCourse || selectedDirectAid || selectedWing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-red-600">warning</span>
                </div>
                <div>
                  <h3 className="font-bold">Decline {selectedCampaign ? 'Campaign' : selectedCourse ? 'Course' : selectedWing ? 'Wing' : 'Direct Aid'}</h3>
                  <p className="text-xs text-slate-500">This action cannot be undone</p>
                </div>
              </div>
            </div>
            
            <div className="p-4">
              <p className="text-sm mb-3">
                You are about to decline: <strong>{selectedCampaign?.title || selectedCourse?.title || selectedWing?.name || selectedDirectAid?.beneficiary_name || selectedDirectAid?.title}</strong>
              </p>
              
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                Reason for Decline {selectedDirectAid ? '(optional)' : '*'}
              </label>
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder={`Enter the reason for declining this ${selectedCampaign ? 'campaign' : selectedCourse ? 'course' : selectedWing ? 'wing' : 'direct aid'}...`}
                rows={4}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">This note will be visible to the {selectedCampaign ? 'campaign organizer' : selectedCourse ? 'course instructor' : selectedWing ? 'wing creator' : 'campaign creator'}.</p>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex gap-2">
              <button
                onClick={() => {
                  setShowDeclineModal(false);
                  setSelectedCampaign(null);
                  setSelectedCourse(null);
                  setSelectedDirectAid(null);
                  setSelectedWing(null);
                  setDeclineReason('');
                }}
                className="flex-1 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={selectedCampaign ? handleDeclineCampaign : selectedCourse ? handleDeclineCourse : selectedWing ? handleDeclineWing : handleDeclineDirectAid}
                disabled={(!declineReason.trim() && !selectedDirectAid) || processing}
                className="flex-1 py-2.5 text-sm font-bold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
              >
                {processing ? (
                  <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">close</span>
                    Decline {selectedCampaign ? 'Campaign' : selectedCourse ? 'Course' : selectedWing ? 'Wing' : 'Direct Aid'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <VolunteerFooter />
    </div>
  );
}
