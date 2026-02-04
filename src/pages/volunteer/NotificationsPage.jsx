import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import VolunteerFooter from '../../components/VolunteerFooter';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showNotificationDetail, setShowNotificationDetail] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const volunteerId = localStorage.getItem('volunteerId');
  const limit = 20;

  const filters = [
    { key: 'all', label: 'All', icon: 'notifications' },
    { key: 'unread', label: 'Unread', icon: 'mark_email_unread' },
    { key: 'social', label: 'Social', icon: 'group' },
    { key: 'messages', label: 'Messages', icon: 'chat' },
    { key: 'donations', label: 'Donations', icon: 'volunteer_activism' },
    { key: 'campaigns', label: 'Campaigns', icon: 'campaign' },
    { key: 'wings', label: 'Wings', icon: 'diversity_3' },
    { key: 'badges', label: 'Badges', icon: 'military_tech' },
    { key: 'system', label: 'System', icon: 'settings' },
  ];

  // Notification type to category mapping
  const typeToCategory = {
    // Social
    'ally_added': 'social',
    'ally_request': 'social',
    'ally_accepted': 'social',
    'profile_view': 'social',
    'follow': 'social',
    'mention': 'social',
    'tagged': 'social',
    
    // Messages
    'message': 'messages',
    'message_image': 'messages',
    'group_message': 'messages',
    'wing_group_message': 'messages',
    'message_reaction': 'messages',
    
    // Donations
    'donation_approved': 'donations',
    'donation_rejected': 'donations',
    'referral_donation_approved': 'donations',
    'donation_received': 'donations',
    'donation_goal_reached': 'donations',
    'donation_milestone': 'donations',
    
    // Campaigns
    'campaign_join_approved': 'campaigns',
    'campaign_join_rejected': 'campaigns',
    'campaign_invite': 'campaigns',
    'campaign_update': 'campaigns',
    'campaign_completed': 'campaigns',
    'campaign_reminder': 'campaigns',
    'campaign_role_assigned': 'campaigns',
    'campaign_hours_logged': 'campaigns',
    
    // Wings
    'wing_join_approved': 'wings',
    'wing_join_rejected': 'wings',
    'wing_invite': 'wings',
    'wing_post': 'wings',
    'wing_post_reaction': 'wings',
    'wing_post_comment': 'wings',
    'wing_role_changed': 'wings',
    'wing_announcement': 'wings',
    'wing_member_joined': 'wings',
    
    // Badges
    'badge_earned': 'badges',
    'badge_milestone': 'badges',
    'level_up': 'badges',
    'achievement_unlocked': 'badges',
    
    // System
    'announcement': 'system',
    'system_update': 'system',
    'account_update': 'system',
    'security_alert': 'system',
    'reminder': 'system',
    'welcome': 'system',
    'course_enrolled': 'system',
    'course_completed': 'system',
    'certificate_issued': 'system',
  };

  // Get icon and color for notification type
  const getNotificationStyle = (type) => {
    const styles = {
      // Social
      'ally_added': { icon: 'person_add', color: 'bg-blue-500', textColor: 'text-blue-500' },
      'ally_request': { icon: 'person_add', color: 'bg-blue-500', textColor: 'text-blue-500' },
      'ally_accepted': { icon: 'how_to_reg', color: 'bg-green-500', textColor: 'text-green-500' },
      'profile_view': { icon: 'visibility', color: 'bg-gray-500', textColor: 'text-gray-500' },
      'follow': { icon: 'person_add', color: 'bg-blue-500', textColor: 'text-blue-500' },
      'mention': { icon: 'alternate_email', color: 'bg-purple-500', textColor: 'text-purple-500' },
      'tagged': { icon: 'sell', color: 'bg-purple-500', textColor: 'text-purple-500' },
      
      // Messages
      'message': { icon: 'chat_bubble', color: 'bg-primary', textColor: 'text-primary' },
      'message_image': { icon: 'image', color: 'bg-primary', textColor: 'text-primary' },
      'group_message': { icon: 'forum', color: 'bg-indigo-500', textColor: 'text-indigo-500' },
      'wing_group_message': { icon: 'groups', color: 'bg-indigo-500', textColor: 'text-indigo-500' },
      'message_reaction': { icon: 'add_reaction', color: 'bg-yellow-500', textColor: 'text-yellow-500' },
      
      // Donations
      'donation_approved': { icon: 'check_circle', color: 'bg-green-500', textColor: 'text-green-500' },
      'donation_rejected': { icon: 'cancel', color: 'bg-red-500', textColor: 'text-red-500' },
      'referral_donation_approved': { icon: 'volunteer_activism', color: 'bg-teal-500', textColor: 'text-teal-500' },
      'donation_received': { icon: 'payments', color: 'bg-green-500', textColor: 'text-green-500' },
      'donation_goal_reached': { icon: 'emoji_events', color: 'bg-yellow-500', textColor: 'text-yellow-500' },
      'donation_milestone': { icon: 'flag', color: 'bg-orange-500', textColor: 'text-orange-500' },
      
      // Campaigns
      'campaign_join_approved': { icon: 'task_alt', color: 'bg-green-500', textColor: 'text-green-500' },
      'campaign_join_rejected': { icon: 'cancel', color: 'bg-red-500', textColor: 'text-red-500' },
      'campaign_invite': { icon: 'mail', color: 'bg-blue-500', textColor: 'text-blue-500' },
      'campaign_update': { icon: 'update', color: 'bg-blue-500', textColor: 'text-blue-500' },
      'campaign_completed': { icon: 'celebration', color: 'bg-yellow-500', textColor: 'text-yellow-500' },
      'campaign_reminder': { icon: 'alarm', color: 'bg-orange-500', textColor: 'text-orange-500' },
      'campaign_role_assigned': { icon: 'badge', color: 'bg-purple-500', textColor: 'text-purple-500' },
      'campaign_hours_logged': { icon: 'schedule', color: 'bg-blue-500', textColor: 'text-blue-500' },
      
      // Wings
      'wing_join_approved': { icon: 'diversity_3', color: 'bg-green-500', textColor: 'text-green-500' },
      'wing_join_rejected': { icon: 'cancel', color: 'bg-red-500', textColor: 'text-red-500' },
      'wing_invite': { icon: 'mail', color: 'bg-blue-500', textColor: 'text-blue-500' },
      'wing_post': { icon: 'article', color: 'bg-blue-500', textColor: 'text-blue-500' },
      'wing_post_reaction': { icon: 'favorite', color: 'bg-red-500', textColor: 'text-red-500' },
      'wing_post_comment': { icon: 'comment', color: 'bg-blue-500', textColor: 'text-blue-500' },
      'wing_role_changed': { icon: 'swap_horiz', color: 'bg-purple-500', textColor: 'text-purple-500' },
      'wing_announcement': { icon: 'campaign', color: 'bg-orange-500', textColor: 'text-orange-500' },
      'wing_member_joined': { icon: 'person_add', color: 'bg-green-500', textColor: 'text-green-500' },
      
      // Badges
      'badge_earned': { icon: 'military_tech', color: 'bg-yellow-500', textColor: 'text-yellow-500' },
      'badge_milestone': { icon: 'stars', color: 'bg-yellow-500', textColor: 'text-yellow-500' },
      'level_up': { icon: 'trending_up', color: 'bg-green-500', textColor: 'text-green-500' },
      'achievement_unlocked': { icon: 'emoji_events', color: 'bg-yellow-500', textColor: 'text-yellow-500' },
      
      // System
      'announcement': { icon: 'campaign', color: 'bg-orange-500', textColor: 'text-orange-500' },
      'system_update': { icon: 'system_update', color: 'bg-gray-500', textColor: 'text-gray-500' },
      'account_update': { icon: 'manage_accounts', color: 'bg-blue-500', textColor: 'text-blue-500' },
      'security_alert': { icon: 'security', color: 'bg-red-500', textColor: 'text-red-500' },
      'reminder': { icon: 'notifications_active', color: 'bg-orange-500', textColor: 'text-orange-500' },
      'welcome': { icon: 'waving_hand', color: 'bg-primary', textColor: 'text-primary' },
      'course_enrolled': { icon: 'school', color: 'bg-blue-500', textColor: 'text-blue-500' },
      'course_enrollment': { icon: 'school', color: 'bg-blue-500', textColor: 'text-blue-500' },
      'course_completed': { icon: 'workspace_premium', color: 'bg-green-500', textColor: 'text-green-500' },
      'certificate_issued': { icon: 'card_membership', color: 'bg-yellow-500', textColor: 'text-yellow-500' },
      'tagged_in_post': { icon: 'label', color: 'bg-purple-500', textColor: 'text-purple-500' },
      'comment_reply': { icon: 'reply', color: 'bg-blue-500', textColor: 'text-blue-500' },
      'direct_aid_donation_approved': { icon: 'volunteer_activism', color: 'bg-green-500', textColor: 'text-green-500' },
      'direct_aid_donation_rejected': { icon: 'cancel', color: 'bg-red-500', textColor: 'text-red-500' },
    };
    return styles[type] || { icon: 'notifications', color: 'bg-gray-500', textColor: 'text-gray-500' };
  };

  const fetchNotifications = useCallback(async (reset = false) => {
    if (!volunteerId) return;
    
    try {
      if (reset) {
        setLoading(true);
        setOffset(0);
      }
      
      const currentOffset = reset ? 0 : offset;
      let url = `/api/notifications/${volunteerId}?limit=${limit}&offset=${currentOffset}`;
      
      if (activeFilter !== 'all') {
        if (activeFilter === 'unread') {
          url += '&unread=true';
        } else {
          url += `&category=${activeFilter}`;
        }
      }
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (reset) {
          setNotifications(data.notifications || []);
        } else {
          setNotifications(prev => [...prev, ...(data.notifications || [])]);
        }
        setUnreadCount(data.unreadCount || 0);
        setHasMore(data.hasMore || false);
        if (!reset) setOffset(currentOffset + limit);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [volunteerId, activeFilter, offset]);

  useEffect(() => {
    fetchNotifications(true);
  }, [volunteerId, activeFilter]);

  // Auto-refresh notifications
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchNotifications(true);
      }
    }, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    await fetchNotifications(false);
  };

  const markAsRead = async (notificationId) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, { method: 'PUT' });
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: 1 } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const markAllAsRead = async () => {
    if (markingAll) return;
    setMarkingAll(true);
    try {
      await fetch(`/api/notifications/${volunteerId}/read-all`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, { method: 'DELETE' });
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const clearAllNotifications = async () => {
    if (!window.confirm('Are you sure you want to clear all notifications?')) return;
    try {
      await fetch(`/api/notifications/${volunteerId}/clear-all`, { method: 'DELETE' });
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to clear notifications:', err);
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read first
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    
    // Navigate based on notification type
    const { type, data } = notification;
    const parsedData = typeof data === 'string' ? JSON.parse(data || '{}') : (data || {});
    
    switch (type) {
      // Social
      case 'ally_added':
      case 'ally_request':
      case 'ally_accepted':
      case 'profile_view':
      case 'follow':
        if (parsedData.userId) navigate(`/volunteer/profile/${parsedData.userId}`);
        break;
        
      // Messages
      case 'message':
      case 'message_image':
        if (parsedData.senderId) navigate(`/volunteer/chat?with=${parsedData.senderId}`);
        break;
      case 'group_message':
      case 'wing_group_message':
        if (parsedData.groupId) navigate(`/volunteer/chat?group=${parsedData.groupId}`);
        break;
        
      // Donations
      case 'donation_approved':
      case 'donation_rejected':
      case 'referral_donation_approved':
      case 'donation_received':
      case 'donation_goal_reached':
      case 'donation_milestone':
        navigate('/volunteer/donation');
        break;
        
      // Campaigns
      case 'campaign_join_approved':
      case 'campaign_join_rejected':
      case 'campaign_invite':
      case 'campaign_update':
      case 'campaign_completed':
      case 'campaign_reminder':
      case 'campaign_role_assigned':
      case 'campaign_hours_logged':
        if (parsedData.campaignId) navigate(`/volunteer/campaign/${parsedData.campaignId}`);
        break;
        
      // Wings
      case 'wing_join_approved':
      case 'wing_join_rejected':
      case 'wing_invite':
      case 'wing_role_changed':
      case 'wing_announcement':
      case 'wing_member_joined':
        if (parsedData.wingId) navigate(`/volunteer/wing/${parsedData.wingId}`);
        break;
      case 'wing_post':
      case 'wing_post_reaction':
      case 'wing_post_comment':
      case 'comment_reply':
      case 'tagged_in_post':
        if (parsedData.wingId && parsedData.postId) {
          navigate(`/volunteer/wing/${parsedData.wingId}?post=${parsedData.postId}`);
        } else if (parsedData.wingId) {
          navigate(`/volunteer/wing/${parsedData.wingId}`);
        }
        break;
        
      // Badges
      case 'badge_earned':
      case 'badge_milestone':
      case 'level_up':
      case 'achievement_unlocked':
        if (parsedData.badgeId) {
          navigate(`/volunteer/badges/${parsedData.badgeId}`);
        } else {
          navigate('/volunteer/badges');
        }
        break;
        
      // System
      case 'announcement':
        if (parsedData.announcementId) {
          setSelectedNotification(notification);
          setShowNotificationDetail(true);
        } else {
          navigate('/volunteer/announcements');
        }
        break;
      case 'course_enrolled':
      case 'course_enrollment':
      case 'course_completed':
        if (parsedData.courseId) navigate(`/volunteer/courses/${parsedData.courseId}`);
        break;
      case 'certificate_issued':
        if (parsedData.certificateId) navigate(`/volunteer/validate-certificate?id=${parsedData.certificateId}`);
        break;
      case 'direct_aid_donation_approved':
      case 'direct_aid_donation_rejected':
        if (parsedData.directAidId) navigate(`/volunteer/direct-aid/${parsedData.directAidId}`);
        else navigate('/volunteer/donation');
        break;
        
      default:
        // Show detail modal for unknown types
        setSelectedNotification(notification);
        setShowNotificationDetail(true);
    }
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const groupNotificationsByDate = (notifications) => {
    const groups = {};
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    notifications.forEach(notification => {
      const date = new Date(notification.created_at).toDateString();
      let groupLabel;
      
      if (date === today) {
        groupLabel = 'Today';
      } else if (date === yesterday) {
        groupLabel = 'Yesterday';
      } else {
        groupLabel = new Date(notification.created_at).toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'long', 
          day: 'numeric' 
        });
      }
      
      if (!groups[groupLabel]) {
        groups[groupLabel] = [];
      }
      groups[groupLabel].push(notification);
    });
    
    return groups;
  };

  const groupedNotifications = groupNotificationsByDate(notifications);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h1 className="text-xl font-bold">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-xs text-gray-500">{unreadCount} unread</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                disabled={markingAll}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                title="Mark all as read"
              >
                <span className="material-symbols-outlined text-primary">done_all</span>
              </button>
            )}
            <div className="relative">
              <button 
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
              >
                <span className="material-symbols-outlined">filter_list</span>
              </button>
              
              {showFilterMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowFilterMenu(false)} />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-20 py-2">
                    {filters.map(filter => (
                      <button
                        key={filter.key}
                        onClick={() => {
                          setActiveFilter(filter.key);
                          setShowFilterMenu(false);
                        }}
                        className={`w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                          activeFilter === filter.key ? 'text-primary bg-primary/5' : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <span className="material-symbols-outlined text-lg">{filter.icon}</span>
                        <span className="text-sm font-medium">{filter.label}</span>
                        {activeFilter === filter.key && (
                          <span className="material-symbols-outlined ml-auto text-primary">check</span>
                        )}
                      </button>
                    ))}
                    <div className="border-t border-gray-100 dark:border-gray-700 mt-2 pt-2">
                      <button
                        onClick={() => {
                          clearAllNotifications();
                          setShowFilterMenu(false);
                        }}
                        className="w-full px-4 py-2 flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                      >
                        <span className="material-symbols-outlined text-lg">delete_sweep</span>
                        <span className="text-sm font-medium">Clear All</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Filter Tabs */}
        <div className="flex overflow-x-auto no-scrollbar px-4 pb-3 gap-2">
          {filters.slice(0, 5).map(filter => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                activeFilter === filter.key
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              <span className="material-symbols-outlined text-sm">{filter.icon}</span>
              {filter.label}
              {filter.key === 'unread' && unreadCount > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${
                  activeFilter === filter.key ? 'bg-white/20' : 'bg-primary text-white'
                }`}>
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Notifications List */}
      <main className="max-w-2xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <span className="material-symbols-outlined text-4xl animate-spin text-primary">progress_activity</span>
            <p className="text-gray-500 mt-2">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-4xl text-gray-400">notifications_off</span>
            </div>
            <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">No notifications</h3>
            <p className="text-sm text-gray-500 text-center mt-1">
              {activeFilter === 'all' 
                ? "You're all caught up! New notifications will appear here."
                : `No ${activeFilter} notifications yet.`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {Object.entries(groupedNotifications).map(([date, items]) => (
              <div key={date}>
                <div className="sticky top-[105px] bg-gray-50 dark:bg-gray-900 px-4 py-2 z-10">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{date}</p>
                </div>
                
                {items.map(notification => {
                  const style = getNotificationStyle(notification.type);
                  const parsedData = typeof notification.data === 'string' 
                    ? JSON.parse(notification.data || '{}') 
                    : (notification.data || {});
                  
                  return (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`relative px-4 py-3 flex gap-3 cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${
                        !notification.is_read ? 'bg-primary/5' : ''
                      }`}
                    >
                      {/* Unread indicator */}
                      {!notification.is_read && (
                        <div className="absolute left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary" />
                      )}
                      
                      {/* Avatar or Icon */}
                      <div className="relative flex-shrink-0">
                        {notification.actor_avatar ? (
                          <img 
                            src={notification.actor_avatar} 
                            alt=""
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className={`w-12 h-12 rounded-full ${style.color} flex items-center justify-center`}>
                            <span className="material-symbols-outlined text-white">{style.icon}</span>
                          </div>
                        )}
                        {/* Type badge */}
                        <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full ${style.color} flex items-center justify-center border-2 border-white dark:border-gray-900`}>
                          <span className="material-symbols-outlined text-white text-xs">{style.icon}</span>
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notification.is_read ? 'font-semibold' : ''}`}>
                          {notification.actor_name && (
                            <span className="font-bold">{notification.actor_name} </span>
                          )}
                          <span className="text-gray-700 dark:text-gray-300">{notification.message}</span>
                        </p>
                        
                        {/* Preview content */}
                        {parsedData.preview && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{parsedData.preview}</p>
                        )}
                        
                        {/* Image preview */}
                        {parsedData.imageUrl && (
                          <div className="mt-2 w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                            <img src={parsedData.imageUrl} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                        
                        {/* Timestamp and category */}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-400">{getTimeAgo(notification.created_at)}</span>
                          <span className="text-gray-300 dark:text-gray-600">•</span>
                          <span className={`text-xs ${style.textColor}`}>
                            {typeToCategory[notification.type] || 'notification'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex-shrink-0 flex flex-col items-end gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <span className="material-symbols-outlined text-gray-400 text-lg">close</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            
            {/* Load More */}
            {hasMore && (
              <div className="p-4">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="w-full py-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                >
                  {loadingMore ? (
                    <>
                      <span className="material-symbols-outlined animate-spin">progress_activity</span>
                      Loading...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">expand_more</span>
                      Load More
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Notification Detail Modal */}
      {showNotificationDetail && selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-900 p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h3 className="font-bold text-lg">Notification Details</h3>
              <button 
                onClick={() => {
                  setShowNotificationDetail(false);
                  setSelectedNotification(null);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-4">
              <div className={`w-16 h-16 rounded-full ${getNotificationStyle(selectedNotification.type).color} flex items-center justify-center mx-auto mb-4`}>
                <span className="material-symbols-outlined text-white text-3xl">
                  {getNotificationStyle(selectedNotification.type).icon}
                </span>
              </div>
              
              <h4 className="text-center font-bold text-lg mb-2">
                {selectedNotification.title || selectedNotification.message}
              </h4>
              
              {selectedNotification.actor_name && (
                <p className="text-center text-gray-500 mb-4">
                  From: {selectedNotification.actor_name}
                </p>
              )}
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-4">
                <p className="text-gray-700 dark:text-gray-300">
                  {selectedNotification.message}
                </p>
                
                {(() => {
                  const parsedData = typeof selectedNotification.data === 'string' 
                    ? JSON.parse(selectedNotification.data || '{}') 
                    : (selectedNotification.data || {});
                  return parsedData.details ? (
                    <p className="text-sm text-gray-500 mt-2">{parsedData.details}</p>
                  ) : null;
                })()}
              </div>
              
              <p className="text-center text-xs text-gray-400">
                {new Date(selectedNotification.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      <VolunteerFooter />
    </div>
  );
}
