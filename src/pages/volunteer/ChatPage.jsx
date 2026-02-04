import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShimmerChat } from '../../components/Shimmer';

export default function ChatPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeChat, setActiveChat] = useState(null);
  const [activeGroupChat, setActiveGroupChat] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [input, setInput] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showChatSettings, setShowChatSettings] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [groupChats, setGroupChats] = useState([]);
  const [pinnedChats, setPinnedChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [allies, setAllies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState(null);
  const [activeGroup, setActiveGroup] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [userTimezone, setUserTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [userLocation, setUserLocation] = useState(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  // Pagination states
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [oldestMessageId, setOldestMessageId] = useState(null);
  // Online status
  const [otherUserStatus, setOtherUserStatus] = useState({ isOnline: false, statusText: 'offline' });
  const [otherUserAvatar, setOtherUserAvatar] = useState(null);
  // Chat Settings states
  const [isMuted, setIsMuted] = useState(false);
  const [showSearchChat, setShowSearchChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showMediaView, setShowMediaView] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  // Media view tabs
  const [mediaViewTab, setMediaViewTab] = useState('media'); // 'media', 'files', 'links'
  const [groupMediaViewTab, setGroupMediaViewTab] = useState('media'); // For group chat media view
  // Message status tracking
  const [messageStatuses, setMessageStatuses] = useState({}); // { msgId: 'sending' | 'sent' | 'delivered' | 'read' | 'failed' }
  // Group active members
  const [groupActiveMembers, setGroupActiveMembers] = useState([]);
  // Typing users with names for display
  const [typingUserNames, setTypingUserNames] = useState([]);
  // Group creation states
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [groupAvatar, setGroupAvatar] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [uploadingGroupAvatar, setUploadingGroupAvatar] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  // Long press for pinning
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [showPinOptions, setShowPinOptions] = useState(null);
  // Muted chats
  const [mutedChats, setMutedChats] = useState([]);
  // Announcements
  const [announcements, setAnnouncements] = useState([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [showAnnouncementDetail, setShowAnnouncementDetail] = useState(false);
  // Group settings states
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [editingGroup, setEditingGroup] = useState(false);
  const [groupSettingsTab, setGroupSettingsTab] = useState('info');
  const [groupJoinRequests, setGroupJoinRequests] = useState([]);
  const [groupSettings, setGroupSettings] = useState(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupDesc, setEditGroupDesc] = useState('');
  const [editGroupAvatar, setEditGroupAvatar] = useState('');
  const [groupMedia, setGroupMedia] = useState([]);
  const [mutedGroups, setMutedGroups] = useState([]);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [showPinnedMessages, setShowPinnedMessages] = useState(false);
  const [typingUsers, setTypingUsers] = useState({}); // Track who's typing: { conversationId: [userIds] }
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const heartbeatRef = useRef(null);
  const editGroupAvatarRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const groupAvatarInputRef = useRef(null);
  const contentRef = useRef(null);
  
  const currentUserId = localStorage.getItem('volunteerId');
  const currentUserName = localStorage.getItem('volunteerName');


  // Get user's location and timezone on mount
  useEffect(() => {
    // Try to get timezone from browser first
    const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setUserTimezone(browserTz);
    
    // Ask for location permission to get more accurate timezone
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          // Store in localStorage for future use
          localStorage.setItem('userLocation', JSON.stringify({ lat: latitude, lng: longitude, timezone: browserTz }));
        },
        (error) => {
          console.log('Location permission denied, using browser timezone');
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 86400000 }
      );
    }
    
    // Check if we have cached location
    const cachedLocation = localStorage.getItem('userLocation');
    if (cachedLocation) {
      const loc = JSON.parse(cachedLocation);
      setUserLocation({ lat: loc.lat, lng: loc.lng });
    }
  }, []);

  // Check if we need to open a specific chat from URL params
  useEffect(() => {
    const chatWith = searchParams.get('with');
    const groupId = searchParams.get('group');
    const shareLink = searchParams.get('share');
    const shareText = searchParams.get('text');
    
    if (chatWith && currentUserId) {
      startConversation(chatWith);
    } else if (groupId && currentUserId) {
      startGroupChat(parseInt(groupId));
    }
    
    // If there's a share link, pre-fill the input
    if (shareLink) {
      const message = shareText ? `${decodeURIComponent(shareText)}\n${decodeURIComponent(shareLink)}` : decodeURIComponent(shareLink);
      setInput(message);
      // Show new chat modal to select who to send to
      setShowNewChat(true);
    }
  }, [searchParams, currentUserId]);

  // Lock body scroll when in private chat, restore when exiting
  useEffect(() => {
    if (activeChat) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [activeChat, activeGroupChat]);

  useEffect(() => {
    fetchConversations();
    fetchGroupChats();
    fetchPinnedChats();
    fetchMutedChats();
    fetchAllies();
    fetchAnnouncements();
    
    // Start heartbeat for online status
    const sendHeartbeat = () => {
      if (currentUserId) {
        fetch(`/api/volunteers/${currentUserId}/heartbeat`, { method: 'POST' });
      }
    };
    sendHeartbeat();
    heartbeatRef.current = setInterval(sendHeartbeat, 30000); // Every 30 seconds
    
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [currentUserId]);

  useEffect(() => {
    if (activeChat) {
      setInitialLoad(true);
      setIsAtBottom(true);
      setOtherUserTyping(false);
      setHasMoreMessages(false);
      setOldestMessageId(null);
      setMessages([]);
      fetchMessages(activeChat);
      
      // Fetch other user's online status
      if (otherUser?.id) {
        fetchUserStatus(otherUser.id);
        const statusInterval = setInterval(() => fetchUserStatus(otherUser.id), 10000);
        return () => clearInterval(statusInterval);
      }
      
      const messageInterval = setInterval(() => fetchNewMessages(activeChat), 3000);
      const typingInterval = setInterval(() => fetchTypingStatus(), 500);
      return () => {
        clearInterval(messageInterval);
        clearInterval(typingInterval);
      };
    }
  }, [activeChat, otherUser?.id]);

  useEffect(() => {
    if (activeGroupChat) {
      setOtherUserTyping(false);
      const typingInterval = setInterval(() => fetchTypingStatus(), 500);
      return () => clearInterval(typingInterval);
    }
  }, [activeGroupChat]);

  useEffect(() => {
    // Only auto-scroll if initial load OR user is at bottom
    if (messages.length > 0 && (initialLoad || isAtBottom)) {
      // Use requestAnimationFrame for smoother scroll after render
      requestAnimationFrame(() => {
        scrollToBottom(initialLoad);
        if (initialLoad) setInitialLoad(false);
      });
    }
  }, [messages]);

  // Check if user is at bottom of chat
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      // Consider "at bottom" if within 100px of bottom
      const atBottom = scrollHeight - scrollTop - clientHeight < 100;
      setIsAtBottom(atBottom);
    }
  };

  const scrollToBottom = (instant = false) => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  const fetchConversations = async () => {
    if (!currentUserId) return;
    try {
      const res = await fetch(`/api/conversations/${currentUserId}`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (err) {
      console.error('Failed to fetch conversations', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupChats = async () => {
    if (!currentUserId) return;
    try {
      const res = await fetch(`/api/groups/user/${currentUserId}`);
      if (res.ok) {
        const data = await res.json();
        setGroupChats(data);
      }
    } catch (err) {
      console.error('Failed to fetch group chats', err);
    }
  };

  const fetchPinnedChats = async () => {
    if (!currentUserId) return;
    try {
      const res = await fetch(`/api/pinned/${currentUserId}`);
      if (res.ok) {
        const data = await res.json();
        setPinnedChats(data);
      }
    } catch (err) {
      console.error('Failed to fetch pinned chats', err);
    }
  };

  const fetchTypingStatus = async () => {
    if (!activeChat && !activeGroupChat) return;

    try {
      const endpoint = activeGroupChat
        ? `/api/groups/${activeGroupChat}/typing`
        : `/api/conversations/${activeChat}/typing`;

      const res = await fetch(endpoint);
      if (res.ok) {
        const { typingUsers: typing, typingUserNames: names } = await res.json();
        // Only show typing indicator for OTHER users (not current user)
        const otherUsersTyping = typing.filter(id => id !== parseInt(currentUserId));
        setOtherUserTyping(otherUsersTyping.length > 0);
        
        // Store typing user names for group chat display
        if (names) {
          setTypingUserNames(names.filter((_, i) => typing[i] !== parseInt(currentUserId)));
        }
        
        // Also update typingUsers state for chat preview display
        if (activeChat) {
          setTypingUsers(prev => ({
            ...prev,
            [activeChat]: typing
          }));
        } else if (activeGroupChat) {
          setTypingUsers(prev => ({
            ...prev,
            [`group_${activeGroupChat}`]: typing
          }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch typing status', err);
    }
  };

  const fetchAllies = async () => {
    if (!currentUserId) return;
    try {
      const res = await fetch(`/api/allies/${currentUserId}`);
      if (res.ok) {
        const data = await res.json();
        setAllies(data);
      }
    } catch (err) {
      console.error('Failed to fetch allies', err);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch('/api/announcements');
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data);
      }
    } catch (err) {
      console.error('Failed to fetch announcements', err);
    }
  };

  const fetchUserStatus = async (userId) => {
    try {
      const res = await fetch(`/api/volunteers/${userId}/status`);
      if (res.ok) {
        const data = await res.json();
        setOtherUserStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch user status', err);
    }
  };

  const fetchMessages = async (conversationId, loadMore = false) => {
    if (loadMore && loadingMore) return;
    if (loadMore) setLoadingMore(true);
    
    try {
      const params = new URLSearchParams({ 
        limit: '15',
        userId: currentUserId 
      });
      if (loadMore && oldestMessageId) {
        params.append('before', oldestMessageId);
      }
      
      const res = await fetch(`/api/conversations/${conversationId}/messages?${params}`);
      if (res.ok) {
        const data = await res.json();
        const newMessages = data.messages || data;
        
        if (loadMore) {
          // Prepend older messages
          setMessages(prev => [...newMessages, ...prev]);
        } else {
          setMessages(newMessages);
          setOtherUserAvatar(data.otherUserAvatar);
        }
        
        setHasMoreMessages(data.hasMore || false);
        if (newMessages.length > 0) {
          setOldestMessageId(newMessages[0].id);
        }
        
        // Mark as delivered and read
        await fetch(`/api/conversations/${conversationId}/delivered`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUserId })
        });
        await fetch(`/api/conversations/${conversationId}/read`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUserId })
        });
      }
    } catch (err) {
      console.error('Failed to fetch messages', err);
    } finally {
      if (loadMore) setLoadingMore(false);
    }
  };

  // Fetch only new messages (for polling)
  const fetchNewMessages = async (conversationId) => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages?limit=15&userId=${currentUserId}`);
      if (res.ok) {
        const data = await res.json();
        const newMessages = data.messages || data;
        
        // Only update if there are new messages
        if (newMessages.length > 0) {
          const latestFetched = newMessages[newMessages.length - 1]?.id;
          const latestCurrent = messages[messages.length - 1]?.id;
          
          if (latestFetched !== latestCurrent) {
            // Merge: keep older messages + add any new ones
            setMessages(prev => {
              const prevIds = new Set(prev.map(m => m.id));
              const onlyNew = newMessages.filter(m => !prevIds.has(m.id));
              return [...prev, ...onlyNew];
            });
          }
        }
        
        // Mark as read
        await fetch(`/api/conversations/${conversationId}/read`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUserId })
        });
      }
    } catch (err) {
      console.error('Failed to fetch new messages', err);
    }
  };

  const fetchGroupMessages = async (groupId, silent = false) => {
    try {
      const res = await fetch(`/api/groups/${groupId}/messages`);
      if (res.ok) {
        const data = await res.json();
        if (!silent || JSON.stringify(data) !== JSON.stringify(messages)) {
          setMessages(data);
        }
        await fetch(`/api/groups/${groupId}/read`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUserId })
        });
      }
    } catch (err) {
      console.error('Failed to fetch group messages', err);
    }
  };

  const startGroupChat = async (groupId) => {
    try {
      const res = await fetch(`/api/groups/${groupId}`);
      if (res.ok) {
        const groupData = await res.json();
        setActiveGroup(groupData);
        setActiveGroupChat(groupId);
        setShowNewChat(false);
        await fetchGroupMessages(groupId);
        setInitialLoad(true);
        setTimeout(() => {
          scrollToBottom(true);
          setInitialLoad(false);
        }, 100);
      }
    } catch (err) {
      console.error('Failed to start group chat', err);
    }
  };

  const startConversation = async (otherUserId) => {
    try {
      const userRes = await fetch(`/api/volunteers/${otherUserId}`);
      if (userRes.ok) {
        const userData = await userRes.json();
        setOtherUser(userData);
      }
      
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId1: currentUserId, userId2: otherUserId })
      });
      if (res.ok) {
        const conv = await res.json();
        setActiveChat(conv.id);
        setShowNewChat(false);
        fetchConversations();
      }
    } catch (err) {
      console.error('Failed to start conversation', err);
    }
  };

  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!input.trim() || sending) return;
    if (!activeChat && !activeGroupChat) return;
    
    const messageContent = input.trim();
    setInput('');
    setSending(true);
    
    const tempId = Date.now();
    const tempMessage = {
      id: tempId,
      conversation_id: activeChat,
      group_id: activeGroupChat,
      sender_id: parseInt(currentUserId),
      content: messageContent,
      message_type: 'text',
      created_at: new Date().toISOString(),
      sender_name: currentUserName,
      sending: true,
      failed: false
    };
    setMessages(prev => [...prev, tempMessage]);
    
    // Stop typing indicator
    broadcastTyping(false);
    
    try {
      const endpoint = activeGroupChat 
        ? `/api/groups/${activeGroupChat}/messages`
        : '/api/messages';
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activeGroupChat ? {
          senderId: currentUserId,
          content: messageContent,
          messageType: 'text'
        } : {
          conversationId: activeChat,
          senderId: currentUserId,
          content: messageContent,
          messageType: 'text'
        })
      });
      
      if (res.ok) {
        const newMessage = await res.json();
        setMessages(prev => prev.map(m => m.id === tempId ? { ...newMessage, sending: false, failed: false, status: 'sent' } : m));
        if (activeGroupChat) {
          fetchGroupChats();
        } else {
          fetchConversations();
        }
      } else {
        // Mark message as failed
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, sending: false, failed: true } : m));
      }
    } catch (err) {
      console.error('Failed to send message', err);
      // Mark message as failed
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, sending: false, failed: true } : m));
    } finally {
      setSending(false);
    }
  };
  
  // Retry failed message
  const retryMessage = async (msg) => {
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, sending: true, failed: false } : m));
    
    try {
      const endpoint = activeGroupChat 
        ? `/api/groups/${activeGroupChat}/messages`
        : '/api/messages';
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activeGroupChat ? {
          senderId: currentUserId,
          content: msg.content,
          messageType: msg.message_type || 'text'
        } : {
          conversationId: activeChat,
          senderId: currentUserId,
          content: msg.content,
          messageType: msg.message_type || 'text'
        })
      });
      
      if (res.ok) {
        const newMessage = await res.json();
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...newMessage, sending: false, failed: false } : m));
      } else {
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, sending: false, failed: true } : m));
      }
    } catch (err) {
      console.error('Failed to retry message', err);
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, sending: false, failed: true } : m));
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);
    
    // Clear the existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Broadcast typing status when user types
    if (value.trim()) {
      // Always broadcast typing when there's text
      broadcastTyping(true);
      
      // Set a timeout to stop typing indicator after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        broadcastTyping(false);
      }, 3000);
    } else {
      // No text, stop typing
      broadcastTyping(false);
    }
  };

  const broadcastTyping = async (isTyping) => {
    if (!activeChat && !activeGroupChat) return;
    
    try {
      const endpoint = activeGroupChat
        ? `/api/groups/${activeGroupChat}/typing`
        : `/api/conversations/${activeChat}/typing`;
      
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          volunteerId: currentUserId,
          isTyping
        })
      });
    } catch (err) {
      console.error('Failed to broadcast typing status', err);
    }
  };

  const handleFileUpload = async (file, type) => {
    if (!file) return;
    if (!activeChat && !activeGroupChat) return;
    
    setUploadingFile(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const uploadRes = await fetch('/api/chat/upload', {
        method: 'POST',
        body: formData
      });
      
      if (uploadRes.ok) {
        const { fileUrl, fileName, fileSize, messageType } = await uploadRes.json();
        
        const endpoint = activeGroupChat 
          ? `/api/groups/${activeGroupChat}/messages`
          : '/api/messages';
        
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(activeGroupChat ? {
            senderId: currentUserId,
            content: fileName,
            messageType,
            fileUrl,
            fileName,
            fileSize
          } : {
            conversationId: activeChat,
            senderId: currentUserId,
            content: fileName,
            messageType,
            fileUrl,
            fileName,
            fileSize
          })
        });
        
        if (res.ok) {
          if (activeGroupChat) {
            fetchGroupMessages(activeGroupChat);
            fetchGroupChats();
          } else {
            fetchMessages(activeChat);
            fetchConversations();
          }
        }
      }
    } catch (err) {
      console.error('Failed to upload file', err);
    } finally {
      setUploadingFile(false);
    }
  };

  // Group chat functions
  const handleGroupAvatarUpload = async (file) => {
    if (!file) return;
    setUploadingGroupAvatar(true);
    const formData = new FormData();
    formData.append('avatar', file);
    
    try {
      const res = await fetch('/api/upload-avatar', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const { avatarUrl } = await res.json();
        setGroupAvatar(avatarUrl);
      }
    } catch (err) {
      console.error('Failed to upload group avatar', err);
    } finally {
      setUploadingGroupAvatar(false);
    }
  };

  const createGroupChat = async () => {
    if (!groupName.trim() || selectedMembers.length < 2) return;
    setCreatingGroup(true);
    
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: groupName.trim(),
          description: groupDesc.trim(),
          avatar: groupAvatar,
          creatorId: currentUserId,
          memberIds: selectedMembers.map(m => m.id),
          allowMemberAdd: false
        })
      });
      
      if (res.ok) {
        const newGroup = await res.json();
        setShowCreateGroup(false);
        setGroupName('');
        setGroupDesc('');
        setGroupAvatar('');
        setSelectedMembers([]);
        fetchGroupChats();
        startGroupChat(newGroup.id);
      }
    } catch (err) {
      console.error('Failed to create group', err);
    } finally {
      setCreatingGroup(false);
    }
  };

  const toggleMember = (ally) => {
    if (selectedMembers.find(m => m.id === ally.id)) {
      setSelectedMembers(prev => prev.filter(m => m.id !== ally.id));
    } else {
      setSelectedMembers(prev => [...prev, ally]);
    }
  };

  const handlePinChat = async (conversationId, groupId) => {
    try {
      await fetch('/api/pinned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          conversationId,
          groupId
        })
      });
      fetchPinnedChats();
      setShowPinOptions(null);
    } catch (err) {
      console.error('Failed to pin chat', err);
    }
  };

  const handleUnpinChat = async (conversationId, groupId) => {
    try {
      await fetch('/api/pinned', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          conversationId,
          groupId
        })
      });
      fetchPinnedChats();
      setShowPinOptions(null);
    } catch (err) {
      console.error('Failed to unpin chat', err);
    }
  };

  const handleMuteChat = async (conversationId, groupId) => {
    try {
      await fetch('/api/muted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          conversationId,
          groupId
        })
      });
      fetchMutedChats();
      setShowPinOptions(null);
    } catch (err) {
      console.error('Failed to mute chat', err);
    }
  };

  const handleUnmuteChat = async (conversationId, groupId) => {
    try {
      await fetch('/api/muted', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          conversationId,
          groupId
        })
      });
      fetchMutedChats();
      setShowPinOptions(null);
    } catch (err) {
      console.error('Failed to unmute chat', err);
    }
  };

  const fetchMutedChats = async () => {
    if (!currentUserId) return;
    try {
      const res = await fetch(`/api/muted/${currentUserId}`);
      if (res.ok) {
        const data = await res.json();
        setMutedChats(data);
      }
    } catch (err) {
      console.error('Failed to fetch muted chats', err);
    }
  };

  const isMutedChat = (conversationId, groupId) => {
    return mutedChats.some(m => 
      (conversationId && m.conversation_id === conversationId) ||
      (groupId && m.group_id === groupId)
    );
  };

  const handleBlockUser = async (userId) => {
    try {
      await fetch('/api/blocked', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          blockedUserId: userId
        })
      });
      setShowPinOptions(null);
      fetchConversations();
    } catch (err) {
      console.error('Failed to block user', err);
    }
  };

  const handleLeaveGroup = async (groupId) => {
    if (!confirm('Are you sure you want to leave this group?')) return;
    try {
      const res = await fetch(`/api/groups/${groupId}/leave/${currentUserId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setShowPinOptions(null);
        fetchGroupChats();
        fetchPinnedChats();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to leave group');
      }
    } catch (err) {
      console.error('Failed to leave group', err);
    }
  };

  const handleLongPressStart = (chatType, chatId, extraData = null) => {
    const timer = setTimeout(() => {
      setShowPinOptions({ type: chatType, id: chatId, extraData });
    }, 500);
    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const isPinned = (conversationId, groupId) => {
    return pinnedChats.some(p => 
      (conversationId && p.conversation_id === conversationId) ||
      (groupId && p.group_id === groupId)
    );
  };

  const formatTime = (dateStr) => {
    // Database stores UTC time, need to append 'Z' if not present to parse as UTC
    let dateString = dateStr;
    if (dateString && !dateString.endsWith('Z') && !dateString.includes('+')) {
      // Replace space with T and add Z for UTC
      dateString = dateString.replace(' ', 'T') + 'Z';
    }
    const date = new Date(dateString);
    
    // Use local time formatting
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    const minStr = minutes < 10 ? '0' + minutes : minutes;
    return `${hour12}:${minStr} ${ampm}`;
  };

  const formatDate = (dateStr) => {
    // Database stores UTC time, need to append 'Z' if not present
    let dateString = dateStr;
    if (dateString && !dateString.endsWith('Z') && !dateString.includes('+')) {
      dateString = dateString.replace(' ', 'T') + 'Z';
    }
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const groupMessagesByDate = (msgs) => {
    const groups = {};
    msgs.forEach(msg => {
      const date = formatDate(msg.created_at);
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
    });
    return groups;
  };

  const getFilteredConversations = () => {
    if (activeTab === 'groups') return groupChats;
    if (activeTab === 'announcements') return [];
    return conversations;
  };

  const filteredConversations = getFilteredConversations();

  // Image Viewer Modal
  if (showImageViewer) {
    return (
      <div className="fixed inset-0 bg-black z-[200] flex items-center justify-center" onClick={() => setShowImageViewer(null)}>
        <button 
          onClick={() => setShowImageViewer(null)}
          className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full z-10"
        >
          <span className="material-symbols-outlined text-3xl">close</span>
        </button>
        <img 
          src={showImageViewer} 
          alt="Full view" 
          className="max-w-full max-h-full object-contain"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    );
  }

  // Get media files from messages
  const mediaFiles = messages.filter(m => ['image', 'video', 'audio', 'file'].includes(m.message_type));
  const imageFiles = messages.filter(m => m.message_type === 'image');
  const videoFiles = messages.filter(m => m.message_type === 'video');
  const audioFiles = messages.filter(m => m.message_type === 'audio');
  const documentFiles = messages.filter(m => m.message_type === 'file');
  // Extract links from text messages
  const linkMessages = messages.filter(m => {
    if (m.message_type !== 'text' && m.message_type) return false;
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    return m.content && urlRegex.test(m.content);
  });
  const extractLinks = (content) => {
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    return content?.match(urlRegex) || [];
  };

  // Search in conversation
  const handleSearchChat = (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = messages.filter(m => 
        m.content && m.content.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  // Toggle mute
  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    // Save to localStorage
    const mutedChats = JSON.parse(localStorage.getItem('mutedChats') || '{}');
    if (!isMuted) {
      mutedChats[activeChat] = true;
    } else {
      delete mutedChats[activeChat];
    }
    localStorage.setItem('mutedChats', JSON.stringify(mutedChats));
  };

  // Scroll to specific message and highlight it
  const scrollToMessage = (messageId) => {
    setShowSearchChat(false);
    setSearchQuery('');
    setSearchResults([]);
    setHighlightedMessageId(messageId);
    
    // Wait for render then scroll
    setTimeout(() => {
      const messageElement = document.getElementById(`message-${messageId}`);
      if (messageElement) {
        messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      // Remove highlight after 3 seconds
      setTimeout(() => {
        setHighlightedMessageId(null);
      }, 3000);
    }, 100);
  };

  // Search in Conversation View
  if (showSearchChat && otherUser) {
    return (
      <div className="fixed inset-0 z-[100] bg-background-light dark:bg-background-dark flex flex-col">
        <header className="flex items-center bg-white dark:bg-slate-900 px-4 py-3 border-b border-slate-200 dark:border-slate-800 gap-3">
          <button onClick={() => { setShowSearchChat(false); setSearchQuery(''); setSearchResults([]); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChat(e.target.value)}
              placeholder="Search messages..."
              className="w-full bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-2 pl-10 text-sm outline-none focus:ring-2 focus:ring-primary/50"
              autoFocus
            />
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4">
          {searchQuery && searchResults.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-5xl text-slate-300 mb-3">search_off</span>
              <p className="text-slate-500">No messages found</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-3">{searchResults.length} results</p>
              {searchResults.map(msg => (
                <button 
                  key={msg.id} 
                  onClick={() => scrollToMessage(msg.id)}
                  className="w-full text-left bg-white dark:bg-slate-800 rounded-xl p-4 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      {String(msg.sender_id) === String(currentUserId) ? 'You' : msg.sender_name}
                    </span>
                    <span className="text-[10px] text-slate-400">{formatTime(msg.created_at)}</span>
                    <span className="text-[10px] text-slate-400">• {formatDate(msg.created_at)}</span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-200 line-clamp-2">{msg.content}</p>
                  <div className="flex items-center gap-1 mt-2 text-primary text-xs font-medium">
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    Go to message
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-5xl text-slate-300 mb-3">search</span>
              <p className="text-slate-500">Search for messages</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Media, Files & Links View with Tabs
  if (showMediaView && otherUser) {
    return (
      <div className="fixed inset-0 z-[100] bg-background-light dark:bg-background-dark flex flex-col">
        <header className="flex items-center bg-white dark:bg-slate-900 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <button onClick={() => { setShowMediaView(false); setMediaViewTab('media'); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="flex-1 text-lg font-bold ml-2">Media, Files & Links</h1>
        </header>
        
        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <button
            onClick={() => setMediaViewTab('media')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-1.5 relative ${
              mediaViewTab === 'media' ? 'text-primary border-b-2 border-primary' : 'text-slate-400'
            }`}
          >
            <span className="material-symbols-outlined text-lg">photo_library</span>
            Media
            {(imageFiles.length + videoFiles.length) > 0 && (
              <span className="text-xs bg-slate-100 dark:bg-slate-700 px-1.5 rounded-full">{imageFiles.length + videoFiles.length}</span>
            )}
          </button>
          <button
            onClick={() => setMediaViewTab('files')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-1.5 relative ${
              mediaViewTab === 'files' ? 'text-primary border-b-2 border-primary' : 'text-slate-400'
            }`}
          >
            <span className="material-symbols-outlined text-lg">folder</span>
            Files
            {(documentFiles.length + audioFiles.length) > 0 && (
              <span className="text-xs bg-slate-100 dark:bg-slate-700 px-1.5 rounded-full">{documentFiles.length + audioFiles.length}</span>
            )}
          </button>
          <button
            onClick={() => setMediaViewTab('links')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-1.5 relative ${
              mediaViewTab === 'links' ? 'text-primary border-b-2 border-primary' : 'text-slate-400'
            }`}
          >
            <span className="material-symbols-outlined text-lg">link</span>
            Links
            {linkMessages.length > 0 && (
              <span className="text-xs bg-slate-100 dark:bg-slate-700 px-1.5 rounded-full">{linkMessages.length}</span>
            )}
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {/* Media Tab */}
          {mediaViewTab === 'media' && (
            <>
              {(imageFiles.length + videoFiles.length) === 0 ? (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-5xl text-slate-300 mb-3">perm_media</span>
                  <p className="text-slate-500">No photos or videos shared yet</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Images */}
                  {imageFiles.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Photos ({imageFiles.length})</h3>
                      <div className="grid grid-cols-3 gap-2">
                        {imageFiles.map(img => (
                          <div 
                            key={img.id} 
                            className="aspect-square rounded-lg bg-cover bg-center cursor-pointer hover:opacity-80 transition"
                            style={{ backgroundImage: `url("${img.file_url}")` }}
                            onClick={() => { setShowMediaView(false); setShowImageViewer(img.file_url); }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Videos */}
                  {videoFiles.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Videos ({videoFiles.length})</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {videoFiles.map(vid => (
                          <video key={vid.id} src={vid.file_url} controls className="rounded-lg w-full" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
          
          {/* Files Tab */}
          {mediaViewTab === 'files' && (
            <>
              {(documentFiles.length + audioFiles.length) === 0 ? (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-5xl text-slate-300 mb-3">folder_off</span>
                  <p className="text-slate-500">No files shared yet</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Documents */}
                  {documentFiles.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Documents ({documentFiles.length})</h3>
                      <div className="space-y-2">
                        {documentFiles.map(file => (
                          <a 
                            key={file.id}
                            href={file.file_url} 
                            download={file.file_name}
                            className="flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                          >
                            <div className="size-12 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                              <span className="material-symbols-outlined text-red-500">description</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{file.file_name}</p>
                              <p className="text-xs text-slate-500">{formatFileSize(file.file_size)} • {formatDate(file.created_at)}</p>
                            </div>
                            <span className="material-symbols-outlined text-slate-400">download</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Audio */}
                  {audioFiles.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Audio ({audioFiles.length})</h3>
                      <div className="space-y-2">
                        {audioFiles.map(aud => (
                          <div key={aud.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="size-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                <span className="material-symbols-outlined text-purple-500">audio_file</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{aud.file_name || 'Audio message'}</p>
                                <p className="text-xs text-slate-500">{formatDate(aud.created_at)}</p>
                              </div>
                            </div>
                            <audio src={aud.file_url} controls className="w-full h-10" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
          
          {/* Links Tab */}
          {mediaViewTab === 'links' && (
            <>
              {linkMessages.length === 0 ? (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-5xl text-slate-300 mb-3">link_off</span>
                  <p className="text-slate-500">No links shared yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Shared Links ({linkMessages.length})</h3>
                  {linkMessages.map(msg => (
                    <div key={msg.id} className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden">
                      {extractLinks(msg.content).map((link, idx) => (
                        <a 
                          key={idx}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                        >
                          <div className="size-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-blue-500">language</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-blue-600 dark:text-blue-400 truncate">{link}</p>
                            <p className="text-xs text-slate-500">{formatDate(msg.created_at)} • {String(msg.sender_id) === String(currentUserId) ? 'You' : msg.sender_name}</p>
                          </div>
                          <span className="material-symbols-outlined text-slate-400">open_in_new</span>
                        </a>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // Block Confirmation Modal
  if (showBlockConfirm && otherUser) {
    return (
      <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4" onClick={() => setShowBlockConfirm(false)}>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
          <div className="text-center mb-6">
            <div className="size-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl text-red-600">block</span>
            </div>
            <h3 className="text-lg font-bold mb-2">Block {otherUser.full_name}?</h3>
            <p className="text-sm text-slate-500">They won't be able to message you or see your profile. You can unblock them later.</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowBlockConfirm(false)}
              className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                handleBlockUser(otherUser?.id);
                setShowBlockConfirm(false);
                setShowChatSettings(false);
                setActiveChat(null);
                setOtherUser(null);
              }}
              className="flex-1 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition"
            >
              Block
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Chat Settings Modal - Improved
  if (showChatSettings && otherUser) {
    return (
      <div className="fixed inset-0 z-[100] bg-background-light dark:bg-background-dark flex flex-col">
        <header className="flex items-center bg-white dark:bg-slate-900 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <button onClick={() => setShowChatSettings(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="flex-1 text-lg font-bold ml-2">Chat Settings</h1>
        </header>
        
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-md mx-auto p-6">
            {/* Profile Section */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative">
                <div className="size-28 rounded-full bg-center bg-cover border-4 border-white dark:border-slate-800 shadow-lg"
                  style={{ backgroundImage: `url("${otherUser.avatar || '/avatars/avatar_1.svg'}")` }}
                />
                {otherUserStatus.isOnline && (
                  <div className="absolute bottom-2 right-2 size-5 bg-green-500 border-4 border-white dark:border-slate-800 rounded-full"></div>
                )}
              </div>
              <h2 className="text-xl font-bold mt-4">{otherUser.full_name}</h2>
              <p className="text-sm text-slate-500">{otherUser.wing} • {otherUser.position}</p>
              <div className="flex items-center gap-1.5 mt-2">
                {otherUserStatus.isOnline ? (
                  <>
                    <span className="size-2 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-xs text-green-600 font-medium">Active now</span>
                  </>
                ) : (
                  <>
                    <span className="size-2 bg-slate-400 rounded-full"></span>
                    <span className="text-xs text-slate-500">{otherUserStatus.statusText}</span>
                  </>
                )}
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex justify-center gap-4 mb-6">
              <button 
                onClick={() => { setShowChatSettings(false); navigate(`/volunteer/profile/${otherUser.id}`); }}
                className="flex flex-col items-center gap-1 p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition min-w-[70px]"
              >
                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">person</span>
                </div>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Profile</span>
              </button>
              <button 
                onClick={handleToggleMute}
                className="flex flex-col items-center gap-1 p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition min-w-[70px]"
              >
                <div className={`size-10 rounded-full flex items-center justify-center ${isMuted ? 'bg-amber-100' : 'bg-slate-100 dark:bg-slate-800'}`}>
                  <span className={`material-symbols-outlined ${isMuted ? 'text-amber-600' : 'text-slate-500'}`}>
                    {isMuted ? 'notifications_off' : 'notifications'}
                  </span>
                </div>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{isMuted ? 'Unmute' : 'Mute'}</span>
              </button>
              <button 
                onClick={() => { setShowChatSettings(false); setShowSearchChat(true); }}
                className="flex flex-col items-center gap-1 p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition min-w-[70px]"
              >
                <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <span className="material-symbols-outlined text-slate-500">search</span>
                </div>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Search</span>
              </button>
            </div>
            
            {/* Divider */}
            <div className="h-2 bg-slate-100 dark:bg-slate-800 -mx-6 mb-4"></div>
            
            {/* Media, Files & Links Section */}
            <div className="mb-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Shared Content</h3>
              <button 
                onClick={() => { setShowChatSettings(false); setShowMediaView(true); setMediaViewTab('media'); }}
                className="w-full flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition mb-2"
              >
                <div className="size-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-blue-500">photo_library</span>
                </div>
                <div className="flex-1 text-left">
                  <span className="font-medium">Media</span>
                  <p className="text-xs text-slate-500">Photos & videos</p>
                </div>
                <span className="text-sm text-slate-400 mr-2">{imageFiles.length + videoFiles.length}</span>
                <span className="material-symbols-outlined text-slate-300">chevron_right</span>
              </button>
              <button 
                onClick={() => { setShowChatSettings(false); setShowMediaView(true); setMediaViewTab('files'); }}
                className="w-full flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition mb-2"
              >
                <div className="size-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-red-500">folder</span>
                </div>
                <div className="flex-1 text-left">
                  <span className="font-medium">Files</span>
                  <p className="text-xs text-slate-500">Documents & audio</p>
                </div>
                <span className="text-sm text-slate-400 mr-2">{documentFiles.length + audioFiles.length}</span>
                <span className="material-symbols-outlined text-slate-300">chevron_right</span>
              </button>
              <button 
                onClick={() => { setShowChatSettings(false); setShowMediaView(true); setMediaViewTab('links'); }}
                className="w-full flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition"
              >
                <div className="size-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-green-500">link</span>
                </div>
                <div className="flex-1 text-left">
                  <span className="font-medium">Links</span>
                  <p className="text-xs text-slate-500">Shared URLs</p>
                </div>
                <span className="text-sm text-slate-400 mr-2">{linkMessages.length}</span>
                <span className="material-symbols-outlined text-slate-300">chevron_right</span>
              </button>
            </div>
            
            {/* Divider */}
            <div className="h-2 bg-slate-100 dark:bg-slate-800 -mx-6 mb-4"></div>
            
            {/* Privacy & Support */}
            <div className="mb-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Privacy</h3>
              <button 
                onClick={() => setShowBlockConfirm(true)}
                className="w-full flex items-center gap-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition text-red-600"
              >
                <span className="material-symbols-outlined">block</span>
                <span className="font-medium flex-1 text-left">Block User</span>
                <span className="material-symbols-outlined text-red-300">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Create Group Chat Modal
  if (showCreateGroup) {
    const filteredAllies = allies.filter(ally => 
      !memberSearchQuery || ally.full_name?.toLowerCase().includes(memberSearchQuery.toLowerCase())
    );
    
    return (
      <div className="fixed inset-0 bg-white dark:bg-background-dark z-[100] flex flex-col">
        <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 py-3 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => { setShowCreateGroup(false); setSelectedMembers([]); setGroupName(''); setGroupDesc(''); setGroupAvatar(''); }}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <h1 className="text-lg font-bold flex-1">Create Group Chat</h1>
            <button
              onClick={createGroupChat}
              disabled={!groupName.trim() || selectedMembers.length < 2 || creatingGroup}
              className="px-4 py-2 bg-primary text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {creatingGroup ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                  Creating...
                </>
              ) : 'Create'}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-md mx-auto p-4">
            {/* Group Avatar */}
            <div className="flex flex-col items-center mb-6">
              <input 
                type="file" 
                ref={groupAvatarInputRef} 
                accept="image/*" 
                className="hidden" 
                onChange={(e) => handleGroupAvatarUpload(e.target.files[0])}
              />
              <button 
                onClick={() => groupAvatarInputRef.current?.click()}
                className="relative size-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-primary transition"
              >
                {groupAvatar ? (
                  <img src={groupAvatar} alt="Group" className="w-full h-full object-cover" />
                ) : uploadingGroupAvatar ? (
                  <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-3xl text-slate-400">add_a_photo</span>
                )}
              </button>
              <p className="text-xs text-slate-500 mt-2">Tap to add group photo</p>
            </div>

            {/* Group Name */}
            <div className="mb-4">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Group Name *</label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name"
                className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Group Description */}
            <div className="mb-6">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Description</label>
              <textarea
                value={groupDesc}
                onChange={(e) => setGroupDesc(e.target.value)}
                placeholder="What's this group about?"
                rows={3}
                className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
            </div>

            {/* Selected Members */}
            {selectedMembers.length > 0 && (
              <div className="mb-4">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                  Selected Members ({selectedMembers.length})
                  {selectedMembers.length < 2 && <span className="text-red-500 ml-1">• Need at least 2</span>}
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedMembers.map(member => (
                    <div key={member.id} className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm">
                      <img src={member.avatar || '/avatars/avatar_1.svg'} alt="" className="size-5 rounded-full" />
                      <span className="font-medium">{member.full_name}</span>
                      <button onClick={() => toggleMember(member)} className="hover:bg-primary/20 rounded-full p-0.5">
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search Allies */}
            <div className="mb-4">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Add Members from Allies</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                <input
                  type="text"
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  placeholder="Search allies..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            {/* Allies List */}
            <div className="space-y-1">
              {filteredAllies.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No allies found</p>
              ) : (
                filteredAllies.map(ally => {
                  const isSelected = selectedMembers.find(m => m.id === ally.id);
                  return (
                    <button
                      key={ally.id}
                      onClick={() => toggleMember(ally)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition ${
                        isSelected 
                          ? 'bg-primary/10 border-2 border-primary' 
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800 border-2 border-transparent'
                      }`}
                    >
                      <img 
                        src={ally.avatar || '/avatars/avatar_1.svg'} 
                        alt={ally.full_name}
                        className="size-12 rounded-full object-cover"
                      />
                      <div className="flex-1 text-left">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{ally.full_name}</p>
                        <p className="text-xs text-slate-500">{ally.wing}</p>
                      </div>
                      <div className={`size-6 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'bg-primary border-primary' : 'border-slate-300'
                      }`}>
                        {isSelected && <span className="material-symbols-outlined text-white text-sm">check</span>}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // New Chat Modal
  if (showNewChat) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-background-dark z-[100]">
        <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 py-3">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowNewChat(false)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <h1 className="text-lg font-bold">New Chat</h1>
          </div>
        </div>

        <div className="overflow-y-auto h-[calc(100vh-70px)] p-4 max-w-md mx-auto">
          {/* Create Group Button */}
          <button
            onClick={() => { setShowNewChat(false); setShowCreateGroup(true); }}
            className="w-full flex items-center gap-3 p-4 mb-4 bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 rounded-2xl transition border border-primary/20"
          >
            <div className="size-12 rounded-full bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-white">group_add</span>
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold text-slate-900 dark:text-white">Create Group Chat</p>
              <p className="text-xs text-slate-500">Chat with multiple allies at once</p>
            </div>
            <span className="material-symbols-outlined text-primary">chevron_right</span>
          </button>
          
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Your Allies</h3>
          
          {allies.length === 0 ? (
            <div className="text-center py-12">
              <div className="size-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-4xl text-slate-300">group_off</span>
              </div>
              <p className="text-slate-500 mb-2">No allies yet</p>
              <p className="text-xs text-slate-400">Add volunteers as allies to start chatting with them</p>
            </div>
          ) : (
            <div className="space-y-1">
              {allies.map(ally => (
                <button
                  key={ally.id}
                  onClick={() => startConversation(ally.id)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  <img 
                    src={ally.avatar || '/avatars/avatar_1.svg'} 
                    alt={ally.full_name}
                    className="size-12 rounded-full object-cover border-2 border-primary/20"
                  />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{ally.full_name}</p>
                    <p className="text-xs text-slate-500">{ally.wing} • {ally.position}</p>
                  </div>
                  <span className="material-symbols-outlined text-primary">chat</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Group Chat View
  if (activeGroupChat && activeGroup && !showGroupSettings) {
    const groupedMessages = groupMessagesByDate(messages);
    const currentMember = activeGroup.members?.find(m => m.user_id === parseInt(currentUserId));
    const isAdmin = currentMember?.is_admin;
    const isCreator = activeGroup.creator_id === parseInt(currentUserId);
    
    // Fetch active members for group
    const fetchGroupActiveMembers = async () => {
      try {
        const res = await fetch(`/api/groups/${activeGroupChat}/active-members`);
        if (res.ok) {
          const data = await res.json();
          setGroupActiveMembers(data);
        }
      } catch (err) {
        // Fallback: assume no active tracking available
        setGroupActiveMembers([]);
      }
    };
    
    // Calculate active members count (simplified - could be enhanced with real-time tracking)
    const activeCount = groupActiveMembers.length || Math.min(3, activeGroup.members?.length || 0);
    
    return (
      <div className="fixed inset-0 z-[100] flex flex-col bg-background-light dark:bg-background-dark">
        <header className="flex items-center bg-white dark:bg-slate-900 px-4 py-3 border-b border-slate-200 dark:border-slate-800 shrink-0 z-10">
          <div className="flex items-center gap-3 flex-1">
            <button onClick={() => { setActiveGroupChat(null); setActiveGroup(null); }} className="p-1">
              <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">chevron_left</span>
            </button>
            <div className="relative">
              <div 
                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border border-slate-100 dark:border-slate-700"
                style={{ backgroundImage: `url("${activeGroup.avatar || '/avatars/avatar_1.svg'}")` }}
              />
              {activeCount > 0 && (
                <div className="absolute -bottom-0.5 -right-0.5 size-4 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full flex items-center justify-center">
                  <span className="text-[8px] font-bold text-white">{activeCount}</span>
                </div>
              )}
            </div>
            <div className="flex flex-col flex-1" onClick={() => setShowGroupSettings(true)}>
              <h2 className="text-[#0d141b] dark:text-white text-base font-bold leading-tight tracking-tight">{activeGroup.name}</h2>
              <div className="flex items-center gap-1">
                {otherUserTyping && typingUserNames.length > 0 ? (
                  <p className="text-primary text-[11px] font-semibold">
                    {typingUserNames.slice(0, 2).join(', ')}{typingUserNames.length > 2 ? ` +${typingUserNames.length - 2}` : ''} typing...
                  </p>
                ) : (
                  <p className="text-slate-500 text-[11px]">
                    {activeGroup.members?.length || 0} members
                    {activeCount > 0 && <span className="text-green-500"> • {activeCount} online</span>}
                  </p>
                )}
              </div>
            </div>
          </div>
          <button 
            onClick={() => setShowGroupSettings(true)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition"
          >
            <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">more_vert</span>
          </button>
        </header>

        <main 
          ref={messagesContainerRef}
          onScroll={(e) => {
            const { scrollTop, scrollHeight, clientHeight } = e.target;
            const atBottom = scrollHeight - scrollTop - clientHeight < 50;
            setIsAtBottom(atBottom);
          }}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scroll-smooth"
        >
          {Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              <div className="flex items-center justify-center mb-4">
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-[11px] font-semibold px-4 py-1.5 rounded-full uppercase tracking-wider">{date}</span>
              </div>
              {msgs.map((msg, idx) => {
                const isMe = msg.sender_id === parseInt(currentUserId);
                const showAvatar = !isMe && (idx === 0 || msgs[idx - 1]?.sender_id !== msg.sender_id);
                
                // System messages (group actions)
                if (msg.message_type === 'system') {
                  return (
                    <div key={msg.id} className="flex justify-center my-4">
                      <span className="bg-slate-200/50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 text-[12px] px-4 py-1.5 rounded-full">
                        {msg.content}
                      </span>
                    </div>
                  );
                }
                
                // Messenger-style bubble logic for group chat
                const showAvatarBottom = !isMe && (idx === msgs.length - 1 || msgs[idx+1]?.sender_id !== msg.sender_id);
                const isFirstInGroup = idx === 0 || msgs[idx-1]?.sender_id !== msg.sender_id;
                const isLastInGroup = idx === msgs.length - 1 || msgs[idx+1]?.sender_id !== msg.sender_id;
                
                return (
                  <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''} mb-1`}>
                    {/* Avatar - only show at the bottom of message group */}
                    {!isMe && (
                      <div className={`shrink-0 ${showAvatarBottom ? '' : 'w-8'}`}>
                        {showAvatarBottom && (
                          <img 
                            src={msg.sender_avatar || '/avatars/avatar_1.svg'}
                            alt=""
                            className="size-8 rounded-full object-cover"
                          />
                        )}
                      </div>
                    )}
                    
                    <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                      {/* Show name only at first message of group (for received messages) */}
                      {!isMe && isFirstInGroup && (
                        <p className="text-[11px] text-slate-500 mb-1 ml-3">{msg.sender_name}</p>
                      )}
                      
                      {/* Message bubble with Messenger-style rounded corners */}
                      <div className={`px-4 py-2.5 ${
                        isMe 
                          ? `bg-primary text-white ${isFirstInGroup && isLastInGroup ? 'rounded-[20px]' : isFirstInGroup ? 'rounded-t-[20px] rounded-bl-[20px] rounded-br-[5px]' : isLastInGroup ? 'rounded-b-[20px] rounded-tl-[20px] rounded-tr-[5px]' : 'rounded-l-[20px] rounded-r-[5px]'}` 
                          : `bg-slate-100 dark:bg-slate-800 ${isFirstInGroup && isLastInGroup ? 'rounded-[20px]' : isFirstInGroup ? 'rounded-t-[20px] rounded-br-[20px] rounded-bl-[5px]' : isLastInGroup ? 'rounded-b-[20px] rounded-tr-[20px] rounded-tl-[5px]' : 'rounded-r-[20px] rounded-l-[5px]'}`
                      }`}>
                        {(!msg.message_type || msg.message_type === 'text') && (
                          <p className={`text-[15px] leading-relaxed ${isMe ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>
                            {msg.content}
                          </p>
                        )}
                        {msg.message_type === 'image' && (
                          <img 
                            src={msg.file_url} 
                            alt={msg.file_name}
                            className="max-w-[240px] rounded-xl cursor-pointer hover:opacity-90 transition -m-1"
                            onClick={() => setShowImageViewer(msg.file_url)}
                          />
                        )}
                        {msg.message_type === 'video' && (
                          <video src={msg.file_url} controls className="max-w-[240px] rounded-xl -m-1" />
                        )}
                        {msg.message_type === 'audio' && (
                          <audio src={msg.file_url} controls className="max-w-[240px]" />
                        )}
                        {msg.message_type === 'file' && (
                          <a 
                            href={msg.file_url} 
                            download={msg.file_name}
                            className={`flex items-center gap-3 p-2 rounded-xl transition ${isMe ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
                          >
                            <div className={`size-10 rounded-lg flex items-center justify-center ${isMe ? 'bg-white/20' : 'bg-red-100 dark:bg-red-900/30'}`}>
                              <span className={`material-symbols-outlined text-lg ${isMe ? 'text-white' : 'text-red-500'}`}>description</span>
                            </div>
                            <div className="text-left flex-1 min-w-0">
                              <p className={`text-sm font-medium truncate ${isMe ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>{msg.file_name}</p>
                              <p className={`text-xs ${isMe ? 'text-white/70' : 'text-slate-500'}`}>{formatFileSize(msg.file_size)}</p>
                            </div>
                          </a>
                        )}
                      </div>
                      
                      {/* Time shown only at last message in group */}
                      {isLastInGroup && (
                        <p className={`text-[10px] text-slate-400 mt-0.5 ${isMe ? 'mr-1' : 'ml-1'}`}>
                          {formatTime(msg.created_at)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          
          {/* Typing Indicator for Group Chat */}
          {otherUserTyping && (
            <div className="flex items-end gap-2 mb-1">
              <div className="flex -space-x-2">
                {activeGroup.members?.filter(m => typingUsers[`group_${activeGroupChat}`]?.includes(m.user_id) && m.user_id !== parseInt(currentUserId)).slice(0, 3).map((m, i) => (
                  <img 
                    key={m.user_id}
                    src={m.avatar || '/avatars/avatar_1.svg'}
                    alt=""
                    className="size-6 rounded-full object-cover border-2 border-white dark:border-background-dark"
                    style={{ zIndex: 3 - i }}
                  />
                ))}
                {!activeGroup.members?.some(m => typingUsers[`group_${activeGroupChat}`]?.includes(m.user_id)) && (
                  <div className="size-6 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-background-dark"></div>
                )}
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 rounded-[20px] flex flex-col">
                {typingUserNames.length > 0 && (
                  <p className="text-[10px] text-slate-500 mb-1">
                    {typingUserNames.slice(0, 2).join(', ')}{typingUserNames.length > 2 ? ` +${typingUserNames.length - 2}` : ''}
                  </p>
                )}
                <div className="flex items-center gap-1">
                  <span className="size-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="size-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="size-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </main>

        {/* Scroll to bottom button */}
        {!isAtBottom && (
          <button
            onClick={() => scrollToBottom()}
            className="absolute bottom-24 right-4 size-10 bg-white dark:bg-slate-800 text-primary rounded-full shadow-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center justify-center border border-slate-200 dark:border-slate-700 z-20"
          >
            <span className="material-symbols-outlined">keyboard_arrow_down</span>
          </button>
        )}

        <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 pb-6 shrink-0 sticky bottom-0">
          {uploadingFile && (
            <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-primary/10 rounded-lg">
              <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
              <span className="text-sm text-primary">Uploading file...</span>
            </div>
          )}
          <form onSubmit={sendMessage} className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2">
            <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => handleFileUpload(e.target.files[0], 'file')} />
            <input type="file" ref={imageInputRef} accept="image/*,video/*" className="hidden" onChange={(e) => handleFileUpload(e.target.files[0], 'media')} />
            
            <button type="button" onClick={() => fileInputRef.current?.click()} className="text-slate-500 dark:text-slate-400 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
            </button>
            <button type="button" onClick={() => imageInputRef.current?.click()} className="text-slate-500 dark:text-slate-400 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[20px]">image</span>
            </button>
            
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Type a message..."
              className="flex-1 bg-transparent border-none outline-none text-sm text-slate-900 dark:text-white placeholder-slate-400"
            />
            
            <button 
              type="submit"
              disabled={!input.trim() || sending}
              className="text-primary disabled:text-slate-300 transition-colors"
            >
              <span className="material-symbols-outlined text-[22px]">send</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Group Settings Modal
  if (showGroupSettings && activeGroup) {
    const currentMember = activeGroup.members?.find(m => m.user_id === parseInt(currentUserId));
    const isAdmin = currentMember?.is_admin;
    const isCreator = activeGroup.creator_id === parseInt(currentUserId);
    
    // Fetch group settings and join requests when modal opens
    const fetchGroupSettings = async () => {
      try {
        const res = await fetch(`/api/groups/${activeGroup.id}/settings`);
        if (res.ok) {
          const data = await res.json();
          setGroupSettings(data);
        }
      } catch (err) {
        console.error('Failed to fetch group settings:', err);
      }
    };
    
    const fetchJoinRequests = async () => {
      try {
        const res = await fetch(`/api/groups/${activeGroup.id}/join-requests`);
        if (res.ok) {
          const data = await res.json();
          setGroupJoinRequests(data);
        }
      } catch (err) {
        console.error('Failed to fetch join requests:', err);
      }
    };
    
    const handleApproveRequest = async (requestId) => {
      try {
        await fetch(`/api/groups/${activeGroup.id}/join-requests/${requestId}/approve`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reviewedBy: currentUserId })
        });
        fetchJoinRequests();
        const groupRes = await fetch(`/api/groups/${activeGroup.id}`);
        if (groupRes.ok) setActiveGroup(await groupRes.json());
      } catch (err) {
        console.error('Failed to approve request:', err);
      }
    };
    
    const handleRejectRequest = async (requestId) => {
      try {
        await fetch(`/api/groups/${activeGroup.id}/join-requests/${requestId}/reject`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reviewedBy: currentUserId })
        });
        fetchJoinRequests();
      } catch (err) {
        console.error('Failed to reject request:', err);
      }
    };
    
    const toggleJoinApproval = async () => {
      const newValue = !groupSettings?.join_approval_required;
      try {
        await fetch(`/api/groups/${activeGroup.id}/settings`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ join_approval_required: newValue })
        });
        setGroupSettings(prev => ({ ...prev, join_approval_required: newValue ? 1 : 0 }));
      } catch (err) {
        console.error('Failed to toggle join approval:', err);
      }
    };
    
    // Initialize settings data on first render
    if (!groupSettings || groupSettings.id !== activeGroup.id) {
      fetchGroupSettings();
      if (isAdmin) fetchJoinRequests();
    }
    
    const filteredMembers = activeGroup.members?.filter(m => 
      !memberSearch || m.full_name?.toLowerCase().includes(memberSearch.toLowerCase())
    ) || [];
    
    const fetchGroupMedia = async () => {
      try {
        const res = await fetch(`/api/groups/${activeGroup.id}/messages`);
        if (res.ok) {
          const msgs = await res.json();
          const media = msgs.filter(m => m.message_type === 'image' || m.message_type === 'file');
          setGroupMedia(media);
        }
      } catch (err) {
        console.error('Failed to fetch media:', err);
      }
    };
    
    const openEditGroupModal = () => {
      setEditGroupName(activeGroup.name);
      setEditGroupDesc(activeGroup.description || '');
      setEditGroupAvatar(activeGroup.avatar || '');
      setShowEditGroupModal(true);
    };
    
    const saveGroupInfo = async () => {
      try {
        await fetch(`/api/groups/${activeGroup.id}/settings`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            name: editGroupName, 
            description: editGroupDesc,
            avatar: editGroupAvatar 
          })
        });
        // Refresh group data
        const res = await fetch(`/api/groups/${activeGroup.id}`);
        if (res.ok) setActiveGroup(await res.json());
        setShowEditGroupModal(false);
      } catch (err) {
        console.error('Failed to save group info:', err);
      }
    };
    
    const handleEditGroupAvatarUpload = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      const formData = new FormData();
      formData.append('avatar', file);
      
      try {
        const res = await fetch('/api/upload/avatar', {
          method: 'POST',
          body: formData
        });
        if (res.ok) {
          const { url } = await res.json();
          setEditGroupAvatar(url);
        }
      } catch (err) {
        console.error('Failed to upload avatar:', err);
      }
    };
    
    const toggleMuteGroup = () => {
      if (mutedGroups.includes(activeGroup.id)) {
        setMutedGroups(prev => prev.filter(id => id !== activeGroup.id));
      } else {
        setMutedGroups(prev => [...prev, activeGroup.id]);
      }
    };
    
    // Tabs for admins vs regular members
    const adminTabs = [
      { key: 'info', label: 'Info', icon: 'info' },
      { key: 'members', label: 'Members', icon: 'group' },
      { key: 'media', label: 'Media', icon: 'photo_library' },
      { key: 'requests', label: 'Requests', icon: 'person_add', badge: groupJoinRequests.length },
      { key: 'settings', label: 'Settings', icon: 'settings' }
    ];
    
    const memberTabs = [
      { key: 'info', label: 'Info', icon: 'info' },
      { key: 'members', label: 'Members', icon: 'group' },
      { key: 'media', label: 'Media', icon: 'photo_library' }
    ];
    
    const tabs = isAdmin ? adminTabs : memberTabs;
    
    return (
      <div className="fixed inset-0 z-[100] bg-background-light dark:bg-background-dark flex flex-col">
        <header className="flex items-center bg-white dark:bg-slate-900 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <button onClick={() => { setShowGroupSettings(false); setGroupSettingsTab('info'); setGroupSettings(null); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="flex-1 text-lg font-bold ml-2">Group Settings</h1>
        </header>
        
        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setGroupSettingsTab(tab.key)}
              className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-1.5 relative ${
                groupSettingsTab === tab.key 
                  ? 'text-primary border-b-2 border-primary' 
                  : 'text-slate-400'
              }`}
            >
              <span className="material-symbols-outlined text-lg">{tab.icon}</span>
              {tab.label}
              {tab.badge > 0 && (
                <span className="absolute top-1 right-1/4 size-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-md mx-auto p-4">
            
            {/* Info Tab */}
            {groupSettingsTab === 'info' && (
              <>
                {/* Group Info */}
                <div className="flex flex-col items-center mb-6">
                  <div 
                    className="size-24 rounded-full bg-cover bg-center border-4 border-white dark:border-slate-800 shadow-lg"
                    style={{ backgroundImage: `url("${activeGroup.avatar || '/avatars/avatar_1.svg'}")` }}
                  />
                  <h2 className="text-xl font-bold mt-4">{activeGroup.name}</h2>
                  {activeGroup.description && (
                    <p className="text-sm text-slate-500 text-center mt-1">{activeGroup.description}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-2">{activeGroup.members?.length} members</p>
                </div>

                {/* Edit Group (Admin only) */}
                {isAdmin && (
                  <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden mb-4">
                    <button 
                      onClick={openEditGroupModal}
                      className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                    >
                      <span className="material-symbols-outlined text-primary">edit</span>
                      <span className="font-medium">Edit Group Info</span>
                    </button>
                    <input
                      type="file"
                      ref={editGroupAvatarRef}
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const formData = new FormData();
                        formData.append('avatar', file);
                        try {
                          const res = await fetch('/api/upload/avatar', { method: 'POST', body: formData });
                          if (res.ok) {
                            const { url } = await res.json();
                            await fetch(`/api/groups/${activeGroup.id}/settings`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ avatar: url })
                            });
                            const groupRes = await fetch(`/api/groups/${activeGroup.id}`);
                            if (groupRes.ok) setActiveGroup(await groupRes.json());
                          }
                        } catch (err) {
                          console.error('Failed to upload:', err);
                        }
                      }}
                    />
                    <button 
                      onClick={() => editGroupAvatarRef.current?.click()}
                      className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-700 transition border-t border-slate-100 dark:border-slate-700"
                    >
                      <span className="material-symbols-outlined text-primary">add_a_photo</span>
                      <span className="font-medium">Change Group Photo</span>
                    </button>
                  </div>
                )}
                
                {/* Mute Notifications */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden mb-4">
                  <button 
                    onClick={toggleMuteGroup}
                    className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                  >
                    <span className="material-symbols-outlined text-amber-500">
                      {mutedGroups.includes(activeGroup.id) ? 'notifications_off' : 'notifications'}
                    </span>
                    <span className="font-medium">
                      {mutedGroups.includes(activeGroup.id) ? 'Unmute Notifications' : 'Mute Notifications'}
                    </span>
                  </button>
                </div>

                {/* Add Members */}
                {(isAdmin || activeGroup.allow_member_add) && (
                  <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden mb-4">
                    <button 
                      onClick={() => setShowAddMembers(true)}
                      className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                    >
                      <span className="material-symbols-outlined text-green-500">person_add</span>
                      <span className="font-medium">Add Members</span>
                    </button>
                  </div>
                )}

                {/* Leave Group */}
                {!isCreator && (
                  <button 
                    onClick={async () => {
                      if (confirm('Leave this group?')) {
                        await fetch(`/api/groups/${activeGroup.id}/leave/${currentUserId}`, { method: 'DELETE' });
                        setShowGroupSettings(false);
                        setActiveGroupChat(null);
                        setActiveGroup(null);
                        fetchGroupChats();
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-2xl font-semibold"
                  >
                    <span className="material-symbols-outlined">logout</span>
                    Leave Group
                  </button>
                )}
              </>
            )}
            
            {/* Members Tab */}
            {groupSettingsTab === 'members' && (
              <>
                {/* Search */}
                <div className="relative mb-4">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Search members..."
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 rounded-xl text-sm focus:outline-none border border-slate-200 dark:border-slate-700"
                  />
                </div>
                
                {/* Active Members Count */}
                <div className="flex items-center gap-2 mb-3 px-2">
                  <span className="size-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-xs text-slate-500">
                    {groupActiveMembers.length || Math.min(3, filteredMembers.length)} active now
                  </span>
                </div>
                
                {/* Members List */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden">
                  {filteredMembers.map(member => {
                    const isActive = groupActiveMembers.some(m => m.id === member.user_id) || Math.random() > 0.6; // Fallback for demo
                    return (
                    <div key={member.user_id} className="flex items-center gap-3 p-4 border-b border-slate-100 dark:border-slate-700 last:border-0">
                      <div className="relative">
                        <img 
                          src={member.avatar || '/avatars/avatar_1.svg'} 
                          alt=""
                          className="size-12 rounded-full object-cover"
                        />
                        {isActive && (
                          <div className="absolute bottom-0 right-0 size-3.5 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{member.full_name}</p>
                          {member.user_id === activeGroup.creator_id && (
                            <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">Creator</span>
                          )}
                          {member.is_admin && member.user_id !== activeGroup.creator_id && (
                            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">Admin</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <p className="text-xs text-slate-500">{member.wing || member.position || 'Member'}</p>
                          {isActive && <span className="text-[10px] text-green-500 font-medium">• Online</span>}
                        </div>
                      </div>
                      
                      {/* Admin actions */}
                      {isAdmin && (
                        <div className="flex items-center gap-1">
                          {isCreator && member.user_id !== activeGroup.creator_id && (
                            <button 
                              onClick={async () => {
                                await fetch(`/api/groups/${activeGroup.id}/members/${member.user_id}/admin`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ changedBy: currentUserId, isAdmin: !member.is_admin })
                                });
                                const res = await fetch(`/api/groups/${activeGroup.id}`);
                                if (res.ok) setActiveGroup(await res.json());
                              }}
                              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"
                              title={member.is_admin ? 'Remove admin' : 'Make admin'}
                            >
                              <span className="material-symbols-outlined text-sm text-amber-500">
                                {member.is_admin ? 'remove_moderator' : 'add_moderator'}
                              </span>
                            </button>
                          )}
                          {member.user_id !== activeGroup.creator_id && member.user_id !== parseInt(currentUserId) && (
                            <button 
                              onClick={async () => {
                                if (confirm(`Remove ${member.full_name} from group?`)) {
                                  await fetch(`/api/groups/${activeGroup.id}/members/${member.user_id}`, {
                                    method: 'DELETE',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ removedBy: currentUserId })
                                  });
                                  const res = await fetch(`/api/groups/${activeGroup.id}`);
                                  if (res.ok) setActiveGroup(await res.json());
                                }
                              }}
                              className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
                            >
                              <span className="material-symbols-outlined text-sm text-red-500">person_remove</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                  })}
                  {filteredMembers.length === 0 && (
                    <div className="p-8 text-center text-slate-400">
                      <span className="material-symbols-outlined text-4xl mb-2">search_off</span>
                      <p>No members found</p>
                    </div>
                  )}
                </div>
              </>
            )}
            
            {/* Media Tab - with sub-tabs */}
            {groupSettingsTab === 'media' && (
              <>
                {/* Sub-tabs for Media/Files/Links */}
                <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 mb-4">
                  <button
                    onClick={() => setGroupMediaViewTab('media')}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${
                      groupMediaViewTab === 'media' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500'
                    }`}
                  >
                    Media
                  </button>
                  <button
                    onClick={() => setGroupMediaViewTab('files')}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${
                      groupMediaViewTab === 'files' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500'
                    }`}
                  >
                    Files
                  </button>
                  <button
                    onClick={() => setGroupMediaViewTab('links')}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${
                      groupMediaViewTab === 'links' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500'
                    }`}
                  >
                    Links
                  </button>
                </div>
                
                {/* Group Media Content */}
                {groupMediaViewTab === 'media' && (
                  <>
                    {messages.filter(m => m.message_type === 'image' || m.message_type === 'video').length === 0 ? (
                      <div className="text-center py-12">
                        <span className="material-symbols-outlined text-5xl text-slate-300 mb-3">perm_media</span>
                        <p className="text-slate-500">No photos or videos shared yet</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {messages.filter(m => m.message_type === 'image').map(img => (
                          <div 
                            key={img.id} 
                            className="aspect-square rounded-lg bg-cover bg-center cursor-pointer hover:opacity-80 transition"
                            style={{ backgroundImage: `url("${img.file_url}")` }}
                            onClick={() => setShowImageViewer(img.file_url)}
                          />
                        ))}
                        {messages.filter(m => m.message_type === 'video').map(vid => (
                          <div key={vid.id} className="aspect-square relative rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                            <video src={vid.file_url} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <span className="material-symbols-outlined text-white text-3xl">play_circle</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
                
                {/* Group Files Content */}
                {groupMediaViewTab === 'files' && (
                  <>
                    {messages.filter(m => m.message_type === 'file' || m.message_type === 'audio').length === 0 ? (
                      <div className="text-center py-12">
                        <span className="material-symbols-outlined text-5xl text-slate-300 mb-3">folder_off</span>
                        <p className="text-slate-500">No files shared yet</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {messages.filter(m => m.message_type === 'file').map(file => (
                          <a 
                            key={file.id}
                            href={file.file_url} 
                            download={file.file_name}
                            className="flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                          >
                            <div className="size-12 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                              <span className="material-symbols-outlined text-red-500">description</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{file.file_name}</p>
                              <p className="text-xs text-slate-500">{formatFileSize(file.file_size)} • {file.sender_name}</p>
                            </div>
                            <span className="material-symbols-outlined text-slate-400">download</span>
                          </a>
                        ))}
                        {messages.filter(m => m.message_type === 'audio').map(aud => (
                          <div key={aud.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="size-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                <span className="material-symbols-outlined text-purple-500">audio_file</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{aud.file_name || 'Audio'}</p>
                                <p className="text-xs text-slate-500">{aud.sender_name}</p>
                              </div>
                            </div>
                            <audio src={aud.file_url} controls className="w-full h-10" />
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
                
                {/* Group Links Content */}
                {groupMediaViewTab === 'links' && (
                  <>
                    {(() => {
                      const linkMsgs = messages.filter(m => {
                        if (m.message_type !== 'text' && m.message_type) return false;
                        const urlRegex = /(https?:\/\/[^\s]+)/gi;
                        return m.content && urlRegex.test(m.content);
                      });
                      
                      if (linkMsgs.length === 0) {
                        return (
                          <div className="text-center py-12">
                            <span className="material-symbols-outlined text-5xl text-slate-300 mb-3">link_off</span>
                            <p className="text-slate-500">No links shared yet</p>
                          </div>
                        );
                      }
                      
                      return (
                        <div className="space-y-2">
                          {linkMsgs.map(msg => {
                            const urlRegex = /(https?:\/\/[^\s]+)/gi;
                            const links = msg.content?.match(urlRegex) || [];
                            return links.map((link, idx) => (
                              <a 
                                key={`${msg.id}-${idx}`}
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                              >
                                <div className="size-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                                  <span className="material-symbols-outlined text-blue-500">language</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400 truncate">{link}</p>
                                  <p className="text-xs text-slate-500">{msg.sender_name} • {formatDate(msg.created_at)}</p>
                                </div>
                                <span className="material-symbols-outlined text-slate-400">open_in_new</span>
                              </a>
                            ));
                          })}
                        </div>
                      );
                    })()}
                  </>
                )}
              </>
            )}
            
            {/* Join Requests Tab (Admin only) */}
            {groupSettingsTab === 'requests' && isAdmin && (
              <>
                {groupJoinRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <span className="material-symbols-outlined text-5xl text-slate-300 mb-3">person_add</span>
                    <p className="text-slate-500 font-medium">No pending requests</p>
                    <p className="text-sm text-slate-400 mt-1">Join requests will appear here</p>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden">
                    {groupJoinRequests.map(request => (
                      <div key={request.id} className="p-4 border-b border-slate-100 dark:border-slate-700 last:border-0">
                        <div className="flex items-center gap-3">
                          <img 
                            src={request.avatar || '/avatars/avatar_1.svg'} 
                            alt=""
                            className="size-12 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <p className="font-medium">{request.full_name}</p>
                            <p className="text-xs text-slate-500">{request.wing || request.position}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleApproveRequest(request.id)}
                            className="flex-1 py-2 bg-primary text-white font-bold rounded-lg text-sm"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectRequest(request.id)}
                            className="flex-1 py-2 bg-slate-100 dark:bg-slate-700 font-bold rounded-lg text-sm"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
            
            {/* Settings Tab (Admin only) */}
            {groupSettingsTab === 'settings' && isAdmin && (
              <>
                <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden">
                  {/* Join Approval Toggle */}
                  <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary">how_to_reg</span>
                      <div>
                        <p className="font-medium">Require Join Approval</p>
                        <p className="text-xs text-slate-500">Admin must approve new members</p>
                      </div>
                    </div>
                    <button
                      onClick={toggleJoinApproval}
                      className={`w-12 h-7 rounded-full transition-colors ${
                        groupSettings?.join_approval_required ? 'bg-primary' : 'bg-slate-300'
                      }`}
                    >
                      <div className={`size-5 bg-white rounded-full shadow transition-transform mx-1 ${
                        groupSettings?.join_approval_required ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                  
                  {/* Allow Member Add Toggle */}
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-green-500">group_add</span>
                      <div>
                        <p className="font-medium">Members Can Add Others</p>
                        <p className="text-xs text-slate-500">Allow members to add new people</p>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        const newValue = !groupSettings?.allow_member_add;
                        await fetch(`/api/groups/${activeGroup.id}/settings`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ allow_member_add: newValue })
                        });
                        setGroupSettings(prev => ({ ...prev, allow_member_add: newValue ? 1 : 0 }));
                      }}
                      className={`w-12 h-7 rounded-full transition-colors ${
                        groupSettings?.allow_member_add ? 'bg-primary' : 'bg-slate-300'
                      }`}
                    >
                      <div className={`size-5 bg-white rounded-full shadow transition-transform mx-1 ${
                        groupSettings?.allow_member_add ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                </div>
                
                {/* Danger Zone */}
                {isCreator && (
                  <div className="mt-6">
                    <h3 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-3">Danger Zone</h3>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden">
                      <button className="w-full flex items-center gap-4 p-4 hover:bg-red-50 dark:hover:bg-red-900/20 transition text-red-600">
                        <span className="material-symbols-outlined">delete_forever</span>
                        <span className="font-medium">Delete Group</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
            
          </div>
        </div>

        {/* Add Members Modal */}
        {showAddMembers && (
          <div className="fixed inset-0 z-[110] bg-black/50 flex items-end justify-center" onClick={() => setShowAddMembers(false)}>
            <div className="bg-white dark:bg-slate-800 rounded-t-3xl w-full max-w-md max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="p-4 border-b border-slate-100 dark:border-slate-700">
                <div className="w-12 h-1 bg-slate-300 dark:bg-slate-600 rounded-full mx-auto mb-4" />
                <h3 className="text-lg font-bold text-center">Add Members</h3>
                <div className="relative mt-3">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                  <input
                    type="text"
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    placeholder="Search allies..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-700 rounded-xl text-sm focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {allies
                  .filter(ally => !activeGroup.members?.some(m => m.user_id === ally.id))
                  .filter(ally => !memberSearchQuery || ally.full_name?.toLowerCase().includes(memberSearchQuery.toLowerCase()))
                  .map(ally => (
                    <button
                      key={ally.id}
                      onClick={async () => {
                        try {
                          const res = await fetch(`/api/groups/${activeGroup.id}/members`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId: ally.id, addedBy: currentUserId })
                          });
                          if (res.ok) {
                            // Refresh group data
                            const groupRes = await fetch(`/api/groups/${activeGroup.id}`);
                            if (groupRes.ok) {
                              setActiveGroup(await groupRes.json());
                            }
                            fetchGroupChats();
                            setShowAddMembers(false);
                            setMemberSearchQuery('');
                          } else {
                            const data = await res.json();
                            alert(data.error || 'Failed to add member');
                          }
                        } catch (err) {
                          console.error('Failed to add member', err);
                        }
                      }}
                      className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition"
                    >
                      <img src={ally.avatar || '/avatars/avatar_1.svg'} alt="" className="size-10 rounded-full object-cover" />
                      <div className="flex-1 text-left">
                        <p className="font-medium">{ally.full_name}</p>
                        <p className="text-xs text-slate-500">{ally.wing}</p>
                      </div>
                      <span className="material-symbols-outlined text-green-500">person_add</span>
                    </button>
                  ))}
                {allies.filter(ally => !activeGroup.members?.some(m => m.user_id === ally.id)).length === 0 && (
                  <div className="text-center py-8 text-slate-400">
                    <span className="material-symbols-outlined text-4xl mb-2">group</span>
                    <p>All your allies are already in this group</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Private Chat Conversation View - Full screen without app header/footer
  if (activeChat && otherUser) {
    const groupedMessages = groupMessagesByDate(messages);
    
    // Handle scroll for loading more messages
    const handleChatScroll = (e) => {
      const { scrollTop, scrollHeight, clientHeight } = e.target;
      const atBottom = scrollHeight - scrollTop - clientHeight < 50;
      setIsAtBottom(atBottom);
      
      // Load more when scrolled near top
      if (scrollTop < 100 && hasMoreMessages && !loadingMore) {
        const prevScrollHeight = e.target.scrollHeight;
        fetchMessages(activeChat, true).then(() => {
          // Maintain scroll position after loading more
          requestAnimationFrame(() => {
            if (messagesContainerRef.current) {
              const newScrollHeight = messagesContainerRef.current.scrollHeight;
              messagesContainerRef.current.scrollTop = newScrollHeight - prevScrollHeight;
            }
          });
        });
      }
    };

    // Get the last read message for seen indicator
    const lastReadByOther = messages.filter(m => 
      String(m.sender_id) === String(currentUserId) && m.is_read
    ).pop();
    
    return (
      <div className="fixed inset-0 z-[100] flex flex-col bg-background-light dark:bg-background-dark">
        <header className="flex items-center bg-white dark:bg-slate-900 px-4 py-3 border-b border-slate-200 dark:border-slate-800 shrink-0 z-10">
          <div className="flex items-center gap-3 flex-1">
            <button onClick={() => { setActiveChat(null); setOtherUser(null); }} className="p-1">
              <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">chevron_left</span>
            </button>
            <div className="relative">
              <div 
                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border border-slate-100 dark:border-slate-700"
                style={{ backgroundImage: `url("${otherUser.avatar || '/avatars/avatar_1.svg'}")` }}
              />
              {otherUserStatus.isOnline && (
                <div className="absolute bottom-0 right-0 size-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
              )}
            </div>
            <div className="flex flex-col">
              <h2 className="text-[#0d141b] dark:text-white text-base font-bold leading-tight tracking-tight">{otherUser.full_name}</h2>
              <div className="flex items-center gap-1">
                {otherUserTyping ? (
                  <p className="text-primary text-[11px] font-semibold">typing...</p>
                ) : otherUserStatus.isOnline ? (
                  <p className="text-green-500 text-[11px] font-semibold">Active now</p>
                ) : (
                  <p className="text-slate-400 text-[11px]">{otherUserStatus.statusText}</p>
                )}
              </div>
            </div>
          </div>
          <button 
            onClick={() => setShowChatSettings(true)}
            className="text-primary p-2 rounded-full hover:bg-primary/10 transition-colors"
          >
            <span className="material-symbols-outlined">info</span>
          </button>
        </header>

        <main 
          ref={messagesContainerRef}
          onScroll={handleChatScroll}
          className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4 overscroll-contain"
        >
          {/* Load More Indicator */}
          {loadingMore && (
            <div className="flex justify-center py-4">
              <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
            </div>
          )}
          {hasMoreMessages && !loadingMore && (
            <button 
              onClick={() => fetchMessages(activeChat, true)}
              className="w-full text-center text-primary text-sm py-2 hover:underline"
            >
              Load earlier messages
            </button>
          )}
          
          {Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              <div className="flex flex-col items-center">
                <div className="h-[1px] w-full bg-slate-200 dark:bg-slate-800 relative my-4">
                  <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background-light dark:bg-background-dark px-4 text-[#4c739a] text-[11px] font-bold uppercase tracking-widest">{date}</span>
                </div>
              </div>
              
              {msgs.map((msg, idx) => {
                const isMe = String(msg.sender_id) === String(currentUserId);
                const showAvatar = !isMe && (idx === msgs.length - 1 || String(msgs[idx+1]?.sender_id) !== String(msg.sender_id));
                const isHighlighted = highlightedMessageId === msg.id;
                const isLastReadByOther = lastReadByOther?.id === msg.id;
                const isLastMessage = idx === msgs.length - 1;
                
                // Bubble corner rounding logic (Messenger style)
                const isFirstInGroup = idx === 0 || String(msgs[idx-1]?.sender_id) !== String(msg.sender_id);
                const isLastInGroup = idx === msgs.length - 1 || String(msgs[idx+1]?.sender_id) !== String(msg.sender_id);

                return (
                  <div 
                    key={msg.id} 
                    id={`message-${msg.id}`}
                    className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''} mb-1 ${msg.sending ? 'opacity-70' : ''} ${msg.failed ? 'opacity-80' : ''} animate-fadeIn transition-all duration-300 ${isHighlighted ? 'bg-primary/20 -mx-2 px-2 py-2 rounded-xl ring-2 ring-primary' : ''}`}
                  >
                    {/* Failed message retry button */}
                    {isMe && msg.failed && (
                      <button 
                        onClick={() => retryMessage(msg)}
                        className="self-center p-1.5 bg-red-100 dark:bg-red-900/30 rounded-full hover:bg-red-200 dark:hover:bg-red-900/50 transition"
                        title="Tap to retry"
                      >
                        <span className="material-symbols-outlined text-red-500 text-[16px]">refresh</span>
                      </button>
                    )}
                    
                    {/* Avatar - only show at the bottom of message group */}
                    {!isMe && (
                      <div className={`shrink-0 ${showAvatar ? '' : 'w-8'}`}>
                        {showAvatar && (
                          <img 
                            src={msg.sender_avatar || '/avatars/avatar_1.svg'}
                            alt=""
                            className="size-8 rounded-full object-cover"
                          />
                        )}
                      </div>
                    )}
                    
                    <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                      {/* Show name only at first message of group (for received messages) */}
                      {!isMe && isFirstInGroup && (
                        <p className="text-[11px] text-slate-500 mb-1 ml-3">{msg.sender_name}</p>
                      )}
                      
                      {/* Failed message indicator */}
                      {isMe && msg.failed && isLastInGroup && (
                        <p className="text-[10px] text-red-500 mb-1 mr-1">Failed to send • Tap to retry</p>
                      )}
                      
                      <div className={`flex items-end gap-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                        {/* Message bubble */}
                        <div className={`px-4 py-2.5 ${
                          isMe 
                            ? `bg-primary text-white ${isFirstInGroup && isLastInGroup ? 'rounded-[20px]' : isFirstInGroup ? 'rounded-t-[20px] rounded-bl-[20px] rounded-br-[5px]' : isLastInGroup ? 'rounded-b-[20px] rounded-tl-[20px] rounded-tr-[5px]' : 'rounded-l-[20px] rounded-r-[5px]'}` 
                            : `bg-slate-100 dark:bg-slate-800 ${isFirstInGroup && isLastInGroup ? 'rounded-[20px]' : isFirstInGroup ? 'rounded-t-[20px] rounded-br-[20px] rounded-bl-[5px]' : isLastInGroup ? 'rounded-b-[20px] rounded-tr-[20px] rounded-tl-[5px]' : 'rounded-r-[20px] rounded-l-[5px]'}`
                        }`}>
                          {(!msg.message_type || msg.message_type === 'text') && (
                            <p className={`text-[15px] leading-relaxed ${isMe ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>
                              {msg.content}
                            </p>
                          )}
                          
                          {msg.message_type === 'image' && (
                            <img 
                              src={msg.file_url} 
                              alt={msg.file_name}
                              className="max-w-[240px] rounded-xl cursor-pointer hover:opacity-90 transition -m-1"
                              onClick={() => setShowImageViewer(msg.file_url)}
                            />
                          )}
                          
                          {msg.message_type === 'video' && (
                            <video src={msg.file_url} controls className="max-w-[240px] rounded-xl -m-1" />
                          )}
                          
                          {msg.message_type === 'audio' && (
                            <audio src={msg.file_url} controls className="max-w-[240px]" />
                          )}
                          
                          {msg.message_type === 'file' && (
                            <a 
                              href={msg.file_url} 
                              download={msg.file_name}
                              className={`flex items-center gap-3 p-2 rounded-xl transition ${isMe ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
                            >
                              <div className={`size-10 rounded-lg flex items-center justify-center ${isMe ? 'bg-white/20' : 'bg-red-100 dark:bg-red-900/30'}`}>
                                <span className={`material-symbols-outlined text-lg ${isMe ? 'text-white' : 'text-red-500'}`}>description</span>
                              </div>
                              <div className="text-left flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${isMe ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>{msg.file_name}</p>
                                <p className={`text-xs ${isMe ? 'text-white/70' : 'text-slate-500'}`}>{formatFileSize(msg.file_size)} • PDF</p>
                              </div>
                              <span className={`material-symbols-outlined ${isMe ? 'text-white/70' : 'text-slate-400'}`}>download</span>
                            </a>
                          )}
                          
                          {msg.message_type === 'campaign' && (() => {
                          try {
                            const campaignData = JSON.parse(msg.content);
                            
                            return (
                              <div 
                                className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-md border border-slate-100 dark:border-slate-700 w-full max-w-[260px] cursor-pointer hover:shadow-lg transition -m-1"
                                onClick={() => navigate(`/volunteer/campaigns/${campaignData.id}`)}
                              >
                                {/* Campaign Image */}
                                <div 
                                  className="h-32 bg-cover bg-center relative"
                                  style={{ backgroundImage: `url('${campaignData.image || '/placeholder-campaign.jpg'}')` }}
                                >
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                                  <div className="absolute bottom-2 right-2">
                                    <span className="bg-primary/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                      {campaignData.category || 'Campaign'}
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Campaign Info */}
                                <div className="p-3">
                                  <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{campaignData.title}</h4>
                                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                                    {campaignData.location || 'TBD'}
                                  </p>
                                  
                                  {/* Compact Stats Row */}
                                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-700 text-[10px] text-slate-500">
                                    <span className="flex items-center gap-0.5">
                                      <span className="material-symbols-outlined text-[14px]">group</span>
                                      {campaignData.volunteersJoined || 0}/{campaignData.volunteersNeeded || '∞'}
                                    </span>
                                    <span className="flex items-center gap-0.5">
                                      <span className="material-symbols-outlined text-[14px]">payments</span>
                                      ৳{(campaignData.raised || 0).toLocaleString()}
                                    </span>
                                    <span className="flex items-center gap-0.5">
                                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                                      {campaignData.daysLeft || 0}d left
                                    </span>
                                  </div>
                                  
                                  {/* Action Button - View Campaign */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/volunteer/campaigns/${campaignData.id}`);
                                    }}
                                    className="w-full mt-2 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition bg-primary hover:bg-primary/90 text-white"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                                    View Campaign
                                  </button>
                                </div>
                              </div>
                            );
                          } catch (e) {
                            return <p className="text-slate-500 text-sm">[Campaign message]</p>;
                          }
                        })()}
                        </div>
                        
                        {/* Time shown on hover or for last in group */}
                        {isLastInGroup && (
                          <p className={`text-[10px] text-slate-400 mt-0.5 ${isMe ? 'mr-1' : 'ml-1'}`}>
                            {formatTime(msg.created_at)}
                          </p>
                        )}
                      </div>
                      
                      {/* Message Status Indicators - Messenger Style */}
                      {isMe && isLastInGroup && (
                        <div className="flex items-center self-end ml-1">
                          {msg.sending ? (
                            // Sending state - clock icon
                            <span className="material-symbols-outlined text-slate-300 text-[14px] animate-pulse" title="Sending">schedule</span>
                          ) : msg.failed ? (
                            // Failed state - error icon with retry option
                            <div className="flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-red-500 text-[14px]" title="Failed to send">error</span>
                            </div>
                          ) : msg.is_read ? (
                            // Read/Seen state - show profile picture
                            <img 
                              src={otherUserAvatar || otherUser?.avatar || '/avatars/avatar_1.svg'} 
                              alt="Seen"
                              className="size-4 rounded-full object-cover"
                              title={`Seen by ${otherUser?.full_name}`}
                            />
                          ) : msg.delivered_at || msg.status === 'delivered' ? (
                            // Delivered state - filled double check
                            <span className="material-symbols-outlined text-slate-400 text-[14px]" title="Delivered">done_all</span>
                          ) : (
                            // Sent state - single check
                            <span className="material-symbols-outlined text-slate-300 text-[14px]" title="Sent">check</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          
          {otherUserTyping && (
            <div className="flex items-end gap-2 mb-1">
              <img 
                src={otherUser.avatar || '/avatars/avatar_1.svg'}
                alt=""
                className="size-8 rounded-full object-cover"
              />
              <div className="flex flex-col bg-slate-100 dark:bg-slate-800 px-4 py-3 rounded-[20px]">
                <div className="flex items-center gap-1.5">
                  <span className="size-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="size-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="size-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </main>

        {/* Scroll to bottom button - shows when user scrolls up */}
        {!isAtBottom && (
          <button
            onClick={() => scrollToBottom()}
            className="absolute bottom-24 right-4 size-10 bg-white dark:bg-slate-800 text-primary rounded-full shadow-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center justify-center border border-slate-200 dark:border-slate-700 z-20"
          >
            <span className="material-symbols-outlined">keyboard_arrow_down</span>
          </button>
        )}

        <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 pb-6 shrink-0 sticky bottom-0">
          {uploadingFile && (
            <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-primary/10 rounded-lg">
              <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
              <span className="text-sm text-primary">Uploading file...</span>
            </div>
          )}
          <form onSubmit={sendMessage} className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={(e) => handleFileUpload(e.target.files[0], 'file')}
            />
            <input 
              type="file" 
              ref={imageInputRef} 
              accept="image/*,video/*" 
              className="hidden" 
              onChange={(e) => handleFileUpload(e.target.files[0], 'media')}
            />
            
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-slate-500 dark:text-slate-400 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
            </button>
            <button 
              type="button"
              className="text-slate-500 dark:text-slate-400 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">mic</span>
            </button>
            <input 
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-1.5 placeholder-slate-400 dark:placeholder-slate-500 text-[#0d141b] dark:text-white outline-none"
              placeholder={`Message ${otherUser.full_name?.split(' ')[0]}...`}
              type="text"
              value={input}
              onChange={handleInputChange}
            />
            <button 
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="text-slate-500 dark:text-slate-400 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">image</span>
            </button>
            <button 
              type="submit"
              disabled={!input.trim() || sending}
              className="bg-primary text-white size-8 flex items-center justify-center rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
            </button>
          </form>
        </div>
        
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.3s ease-out;
          }
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          html, body { overflow: hidden; }
        `}</style>
      </div>
    );
  }

  // Main Chat List Screen
  return (
    <div className="relative bg-white dark:bg-background-dark min-h-screen">
      <div ref={contentRef} className="max-w-md mx-auto overflow-y-auto pb-24">
        <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-6 pt-2 pb-0 sticky top-0 z-10">
          <div className="flex gap-6 text-sm font-semibold">
            <button 
              onClick={() => setActiveTab('all')}
              className={`pb-3 border-b-2 transition ${activeTab === 'all' ? 'text-primary border-primary' : 'text-slate-400 border-transparent'}`}
            >
              All Chats
            </button>
            <button 
              onClick={() => setActiveTab('groups')}
              className={`pb-3 border-b-2 transition ${activeTab === 'groups' ? 'text-primary border-primary' : 'text-slate-400 border-transparent'}`}
            >
              Groups
            </button>
            <button 
              onClick={() => setActiveTab('announcements')}
              className={`pb-3 border-b-2 transition ${activeTab === 'announcements' ? 'text-primary border-primary' : 'text-slate-400 border-transparent'}`}
            >
              Announcements
            </button>
          </div>
        </div>

        {loading ? (
          <div className="mt-2 px-4 space-y-2">
            <ShimmerChat />
          </div>
        ) : (
          <div className="mt-2">
            {/* Pinned Chats Section */}
            {activeTab === 'all' && pinnedChats.length > 0 && (
              <div className="mb-4">
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-6 py-2">📌 Pinned</h3>
                {pinnedChats.map(pinned => {
                  // Find the actual conversation or group
                  const conv = pinned.conversation_id ? conversations.find(c => c.id === pinned.conversation_id) : null;
                  const group = pinned.group_id ? groupChats.find(g => g.id === pinned.group_id) : null;
                  
                  if (conv) {
                    return (
                      <button 
                        key={`pinned-conv-${conv.id}`}
                        className="px-6 py-3 flex items-center gap-4 w-full hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors bg-amber-50/50 dark:bg-amber-900/10" 
                        onClick={() => {
                          setOtherUser({
                            id: conv.other_user_id,
                            full_name: conv.other_user_name,
                            avatar: conv.other_user_avatar,
                            wing: conv.other_user_wing
                          });
                          setActiveChat(conv.id);
                        }}
                        onTouchStart={() => handleLongPressStart('conversation', conv.id)}
                        onTouchEnd={handleLongPressEnd}
                        onMouseDown={() => handleLongPressStart('conversation', conv.id)}
                        onMouseUp={handleLongPressEnd}
                        onMouseLeave={handleLongPressEnd}
                      >
                        <div className="relative flex-shrink-0">
                          <div className="size-12 rounded-full bg-center bg-cover border border-slate-200 dark:border-slate-700"
                            style={{ backgroundImage: `url('${conv.other_user_avatar || '/avatars/avatar_1.svg'}')` }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold truncate text-slate-900 dark:text-white">{conv.other_user_name}</h3>
                          <p className="text-xs text-slate-500 truncate">
                            {conv.last_message_sender === parseInt(currentUserId) ? 'You: ' : ''}{conv.last_message_content || 'Start chatting'}
                          </p>
                        </div>
                        <span className="material-symbols-outlined text-amber-500 text-sm">push_pin</span>
                      </button>
                    );
                  }
                  
                  if (group) {
                    return (
                      <button 
                        key={`pinned-group-${group.id}`}
                        className="px-6 py-3 flex items-center gap-4 w-full hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors bg-amber-50/50 dark:bg-amber-900/10" 
                        onClick={() => startGroupChat(group.id)}
                        onTouchStart={() => handleLongPressStart('group', group.id, { creatorId: group.creator_id })}
                        onTouchEnd={handleLongPressEnd}
                        onMouseDown={() => handleLongPressStart('group', group.id, { creatorId: group.creator_id })}
                        onMouseUp={handleLongPressEnd}
                        onMouseLeave={handleLongPressEnd}
                      >
                        <div className="relative flex-shrink-0">
                          <div className="size-12 rounded-full bg-center bg-cover border border-slate-200 dark:border-slate-700"
                            style={{ backgroundImage: `url('${group.avatar || '/avatars/avatar_1.svg'}')` }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs text-slate-400">group</span>
                            <h3 className="text-sm font-bold truncate text-slate-900 dark:text-white">{group.name}</h3>
                          </div>
                          <p className="text-xs text-slate-500 truncate text-left">
                            {typingUsers[`group_${group.id}`]?.some(id => id !== parseInt(currentUserId)) ? (
                              <span className="text-primary font-semibold">typing...</span>
                            ) : (
                              <>
                                {group.last_message_type === 'system' ? `ℹ️ ${group.last_message_content}` :
                                 group.last_message_content ? 
                                   `${group.last_message_sender_id === parseInt(currentUserId) ? 'You' : group.last_message_sender_name?.split(' ')[0] || ''}: ${group.last_message_content}` :
                                   `${group.member_count} members`}
                              </>
                            )}
                          </p>
                        </div>
                        <span className="material-symbols-outlined text-amber-500 text-sm">push_pin</span>
                      </button>
                    );
                  }
                  return null;
                })}
              </div>
            )}

            {/* Groups Tab Content */}
            {activeTab === 'groups' && (
              <>
                {groupChats.length === 0 ? (
                  <div className="text-center py-16 px-6">
                    <div className="size-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                      <span className="material-symbols-outlined text-5xl text-slate-300">groups</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">No groups yet</h3>
                    <p className="text-sm text-slate-400 mb-6">Create a group to chat with multiple allies</p>
                    <button 
                      onClick={() => setShowCreateGroup(true)}
                      className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full font-semibold hover:bg-primary/90 transition"
                    >
                      <span className="material-symbols-outlined">group_add</span>
                      Create Group
                    </button>
                  </div>
                ) : (
                  groupChats.map(group => (
                    <button 
                      key={group.id} 
                      className="px-6 py-4 flex items-center gap-4 w-full hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors" 
                      onClick={() => startGroupChat(group.id)}
                      onTouchStart={() => handleLongPressStart('group', group.id, { creatorId: group.creator_id })}
                      onTouchEnd={handleLongPressEnd}
                      onMouseDown={() => handleLongPressStart('group', group.id, { creatorId: group.creator_id })}
                      onMouseUp={handleLongPressEnd}
                      onMouseLeave={handleLongPressEnd}
                    >
                      <div className="relative flex-shrink-0">
                        <div 
                          className="size-14 rounded-2xl bg-center bg-cover border border-slate-200 dark:border-slate-700"
                          style={{ backgroundImage: `url('${group.avatar || '/avatars/avatar_1.svg'}')` }}
                        />
                        <div className="absolute -bottom-1 -right-1 size-5 bg-primary/10 border-2 border-white dark:border-background-dark rounded-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-[10px] text-primary">group</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <h3 className="text-base font-bold truncate text-slate-900 dark:text-white">{group.name}</h3>
                          <span className={`text-xs font-medium ${group.unread_count > 0 ? 'text-primary' : 'text-slate-400'}`}>
                            {group.last_message_time ? formatTime(group.last_message_time) : ''}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-slate-500 text-[14px] font-medium truncate leading-snug">
                            {typingUsers[`group_${group.id}`]?.some(id => id !== parseInt(currentUserId)) ? (
                              <span className="text-primary font-semibold">typing...</span>
                            ) : (
                              <>
                                {group.last_message_type === 'image' ? `${group.last_message_sender_id === parseInt(currentUserId) ? 'You' : group.last_message_sender_name?.split(' ')[0] || ''}: 📷 Photo` :
                                 group.last_message_type === 'video' ? `${group.last_message_sender_id === parseInt(currentUserId) ? 'You' : group.last_message_sender_name?.split(' ')[0] || ''}: 🎬 Video` :
                                 group.last_message_type === 'file' ? `${group.last_message_sender_id === parseInt(currentUserId) ? 'You' : group.last_message_sender_name?.split(' ')[0] || ''}: 📎 File` :
                                 group.last_message_type === 'campaign' ? `${group.last_message_sender_id === parseInt(currentUserId) ? 'You' : group.last_message_sender_name?.split(' ')[0] || ''}: 📢 Campaign` :
                                 group.last_message_type === 'system' ? `ℹ️ ${group.last_message_content}` :
                                 group.last_message_content?.startsWith('{') ? `${group.last_message_sender_id === parseInt(currentUserId) ? 'You' : group.last_message_sender_name?.split(' ')[0] || ''}: 📢 Campaign` :
                                 group.last_message_content ? `${group.last_message_sender_id === parseInt(currentUserId) ? 'You' : group.last_message_sender_name?.split(' ')[0] || ''}: ${group.last_message_content}` :
                                 `${group.member_count} members`}
                              </>
                            )}
                          </p>
                          {group.unread_count > 0 && (
                            <div className="size-6 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center ml-3">
                              {group.unread_count}
                            </div>
                          )}
                        </div>
                      </div>
                      {isPinned(null, group.id) && (
                        <span className="material-symbols-outlined text-amber-500 text-sm">push_pin</span>
                      )}
                    </button>
                  ))
                )}
              </>
            )}

            {/* All Chats Tab - Individual Conversations */}
            {activeTab === 'all' && (
              <>
                {conversations.length === 0 && pinnedChats.length === 0 ? (
                  <div className="text-center py-16 px-6">
                    <div className="size-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                      <span className="material-symbols-outlined text-5xl text-slate-300">chat_bubble</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">No chats yet</h3>
                    <p className="text-sm text-slate-400 mb-6">Start a conversation with your allies</p>
                    <button 
                      onClick={() => setShowNewChat(true)}
                      className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full font-semibold hover:bg-primary/90 transition"
                    >
                      <span className="material-symbols-outlined">add</span>
                      Start New Chat
                    </button>
                  </div>
                ) : (
                  <>
                    {pinnedChats.length > 0 && (
                      <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-6 py-2 mt-2">All Chats</h3>
                    )}
                    {conversations.map(conv => (
                      <button 
                        key={conv.id} 
                        className="px-6 py-4 flex items-center gap-4 w-full hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors" 
                        onClick={() => {
                          setOtherUser({
                            id: conv.other_user_id,
                            full_name: conv.other_user_name,
                            avatar: conv.other_user_avatar,
                            wing: conv.other_user_wing
                          });
                          setActiveChat(conv.id);
                        }}
                        onTouchStart={() => handleLongPressStart('conversation', conv.id, { otherUserId: conv.other_user_id, otherUserName: conv.other_user_name })}
                        onTouchEnd={handleLongPressEnd}
                        onMouseDown={() => handleLongPressStart('conversation', conv.id, { otherUserId: conv.other_user_id, otherUserName: conv.other_user_name })}
                        onMouseUp={handleLongPressEnd}
                        onMouseLeave={handleLongPressEnd}
                      >
                        <div className="relative flex-shrink-0">
                          <div 
                            className="size-14 rounded-2xl bg-center bg-cover border border-slate-200 dark:border-slate-700"
                            style={{ backgroundImage: `url('${conv.other_user_avatar || '/avatars/avatar_1.svg'}')` }}
                          />
                          <div className="absolute -bottom-1 -right-1 size-4 bg-emerald-500 border-4 border-white dark:border-background-dark rounded-full"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-1">
                            <h3 className="text-base font-bold truncate text-slate-900 dark:text-white">{conv.other_user_name}</h3>
                            <span className={`text-xs font-medium ${conv.unread_count > 0 ? 'text-primary' : 'text-slate-400'}`}>
                              {conv.last_message_time ? formatTime(conv.last_message_time) : ''}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="text-slate-500 text-[14px] font-medium truncate leading-snug">
                              {typingUsers[conv.id]?.some(id => id !== parseInt(currentUserId)) ? (
                                <span className="text-primary font-semibold">typing...</span>
                              ) : (
                                <>
                                  {conv.last_message_type === 'image' ? `${conv.last_message_sender === parseInt(currentUserId) ? 'You: ' : ''}📷 Photo` :
                                   conv.last_message_type === 'video' ? `${conv.last_message_sender === parseInt(currentUserId) ? 'You: ' : ''}🎬 Video` :
                                   conv.last_message_type === 'audio' ? `${conv.last_message_sender === parseInt(currentUserId) ? 'You: ' : ''}🎵 Audio` :
                                   conv.last_message_type === 'file' ? `${conv.last_message_sender === parseInt(currentUserId) ? 'You: ' : ''}📎 File` :
                                   conv.last_message_type === 'campaign' ? `${conv.last_message_sender === parseInt(currentUserId) ? 'You: ' : ''}📢 Campaign` :
                                   conv.last_message_content ? `${conv.last_message_sender === parseInt(currentUserId) ? 'You: ' : ''}${conv.last_message_content}` :
                                   'Start a conversation'}
                                </>
                              )}
                            </p>
                            {conv.unread_count > 0 && (
                              <div className="size-6 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center ml-3">
                                {conv.unread_count}
                              </div>
                            )}
                          </div>
                        </div>
                        {isPinned(conv.id, null) && (
                          <span className="material-symbols-outlined text-amber-500 text-sm">push_pin</span>
                        )}
                      </button>
                    ))}
                  </>
                )}
              </>
            )}

            {/* Announcements Tab */}
            {activeTab === 'announcements' && (
              <div className="px-4 py-2">
                {announcements.length === 0 ? (
                  <div className="text-center py-16 px-6">
                    <div className="size-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                      <span className="material-symbols-outlined text-5xl text-slate-300">campaign</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">No announcements</h3>
                    <p className="text-sm text-slate-400">Important announcements will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {announcements.map(announcement => {
                      const priorityColors = {
                        urgent: 'bg-red-500',
                        high: 'bg-orange-500',
                        normal: 'bg-blue-500'
                      };
                      const formatDate = (dateStr) => {
                        const date = new Date(dateStr);
                        const now = new Date();
                        const diffMs = now - date;
                        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                        if (diffDays === 0) return 'Today';
                        if (diffDays === 1) return 'Yesterday';
                        if (diffDays < 7) return `${diffDays}d ago`;
                        return date.toLocaleDateString('en-BD', { day: 'numeric', month: 'short' });
                      };
                      return (
                        <button
                          key={announcement.id}
                          onClick={() => {
                            setSelectedAnnouncement(announcement);
                            setShowAnnouncementDetail(true);
                          }}
                          className="w-full bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 text-left hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${priorityColors[announcement.priority] || 'bg-slate-500'}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <h3 className="font-bold dark:text-white truncate">{announcement.title}</h3>
                                <span className="text-xs text-slate-400 shrink-0">{formatDate(announcement.created_at)}</span>
                              </div>
                              <p className="text-sm text-slate-500 line-clamp-2">{announcement.content}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <img 
                                  src={announcement.author_avatar || '/avatars/avatar_1.svg'} 
                                  alt=""
                                  className="w-5 h-5 rounded-full"
                                />
                                <span className="text-xs text-slate-400">{announcement.author_name}</span>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Announcement Detail Modal */}
      {showAnnouncementDetail && selectedAnnouncement && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4" onClick={() => setShowAnnouncementDetail(false)}>
          <div 
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  selectedAnnouncement.priority === 'urgent' ? 'bg-red-500' : 
                  selectedAnnouncement.priority === 'high' ? 'bg-orange-500' : 'bg-blue-500'
                }`} />
                <span className="text-xs font-bold uppercase text-slate-400">{selectedAnnouncement.priority}</span>
              </div>
              <button onClick={() => setShowAnnouncementDetail(false)} className="p-2">
                <span className="material-symbols-outlined text-slate-500">close</span>
              </button>
            </div>
            
            <div className="p-6">
              <h2 className="text-xl font-bold dark:text-white mb-4">{selectedAnnouncement.title}</h2>
              
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <img 
                  src={selectedAnnouncement.author_avatar || '/avatars/avatar_1.svg'} 
                  alt=""
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="font-bold text-sm dark:text-white">{selectedAnnouncement.author_name}</p>
                  <p className="text-xs text-slate-400">{selectedAnnouncement.author_position} • {new Date(selectedAnnouncement.created_at).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
              </div>
              
              <div className="prose dark:prose-invert prose-sm max-w-none">
                <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {selectedAnnouncement.content}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Options Modal */}
      {showPinOptions && (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-end justify-center" onClick={() => setShowPinOptions(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-t-3xl w-full max-w-md p-4 pb-8" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-slate-300 dark:bg-slate-600 rounded-full mx-auto mb-4" />
            
            {/* Pin/Unpin Option */}
            {isPinned(
              showPinOptions.type === 'conversation' ? showPinOptions.id : null,
              showPinOptions.type === 'group' ? showPinOptions.id : null
            ) ? (
              <button 
                onClick={() => handleUnpinChat(
                  showPinOptions.type === 'conversation' ? showPinOptions.id : null,
                  showPinOptions.type === 'group' ? showPinOptions.id : null
                )}
                className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition"
              >
                <span className="material-symbols-outlined text-amber-500">push_pin</span>
                <span className="font-medium">Unpin Chat</span>
              </button>
            ) : (
              <button 
                onClick={() => handlePinChat(
                  showPinOptions.type === 'conversation' ? showPinOptions.id : null,
                  showPinOptions.type === 'group' ? showPinOptions.id : null
                )}
                className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition"
              >
                <span className="material-symbols-outlined text-amber-500">push_pin</span>
                <span className="font-medium">Pin Chat</span>
              </button>
            )}

            {/* Mute/Unmute Option */}
            {isMutedChat(
              showPinOptions.type === 'conversation' ? showPinOptions.id : null,
              showPinOptions.type === 'group' ? showPinOptions.id : null
            ) ? (
              <button 
                onClick={() => handleUnmuteChat(
                  showPinOptions.type === 'conversation' ? showPinOptions.id : null,
                  showPinOptions.type === 'group' ? showPinOptions.id : null
                )}
                className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition"
              >
                <span className="material-symbols-outlined text-slate-500">notifications_active</span>
                <span className="font-medium">Unmute Notifications</span>
              </button>
            ) : (
              <button 
                onClick={() => handleMuteChat(
                  showPinOptions.type === 'conversation' ? showPinOptions.id : null,
                  showPinOptions.type === 'group' ? showPinOptions.id : null
                )}
                className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition"
              >
                <span className="material-symbols-outlined text-slate-500">notifications_off</span>
                <span className="font-medium">Mute Notifications</span>
              </button>
            )}

            {/* Individual Chat Options - Block */}
            {showPinOptions.type === 'conversation' && showPinOptions.extraData && (
              <button 
                onClick={() => {
                  if (confirm(`Block ${showPinOptions.extraData.otherUserName}? You won't receive messages from them.`)) {
                    handleBlockUser(showPinOptions.extraData.otherUserId);
                  }
                }}
                className="w-full flex items-center gap-4 p-4 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition"
              >
                <span className="material-symbols-outlined text-red-500">block</span>
                <span className="font-medium text-red-500">Block User</span>
              </button>
            )}

            {/* Group Options - Leave Group (only if not creator) */}
            {showPinOptions.type === 'group' && showPinOptions.extraData && 
             showPinOptions.extraData.creatorId !== parseInt(currentUserId) && (
              <button 
                onClick={() => handleLeaveGroup(showPinOptions.id)}
                className="w-full flex items-center gap-4 p-4 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition"
              >
                <span className="material-symbols-outlined text-red-500">logout</span>
                <span className="font-medium text-red-500">Leave Group</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* FAB Button */}
      {activeTab === 'all' && (
        <button
          onClick={() => setShowNewChat(true)}
          className="fixed bottom-24 right-6 size-14 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition flex items-center justify-center z-40"
        >
          <span className="material-symbols-outlined text-2xl">edit_square</span>
        </button>
      )}
      {activeTab === 'groups' && (
        <button
          onClick={() => setShowCreateGroup(true)}
          className="fixed bottom-24 right-6 size-14 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition flex items-center justify-center z-40"
        >
          <span className="material-symbols-outlined text-2xl">group_add</span>
        </button>
      )}
    </div>
  );
}
