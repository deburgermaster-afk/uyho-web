import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import VolunteerFooter from '../../components/VolunteerFooter';

// Reaction types with emojis
const REACTIONS = [
  { type: 'like', emoji: '👍', label: 'Like', color: 'text-blue-500' },
  { type: 'love', emoji: '❤️', label: 'Love', color: 'text-red-500' },
  { type: 'haha', emoji: '😂', label: 'Haha', color: 'text-yellow-500' },
  { type: 'wow', emoji: '😮', label: 'Wow', color: 'text-yellow-500' },
  { type: 'sad', emoji: '😢', label: 'Sad', color: 'text-yellow-500' },
  { type: 'angry', emoji: '😡', label: 'Angry', color: 'text-orange-500' }
];

export default function ViewWingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [wing, setWing] = useState(null);
  const [members, setMembers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'home');
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(null);
  const [userReactions, setUserReactions] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [postComments, setPostComments] = useState({});
  const [newComment, setNewComment] = useState({});
  const [replyTo, setReplyTo] = useState(null);
  const [centralCommittee, setCentralCommittee] = useState(false);
  const [imageViewer, setImageViewer] = useState({ open: false, images: [], currentIndex: 0 });
  const [showShareMenu, setShowShareMenu] = useState(null);
  const [showShareChatModal, setShowShareChatModal] = useState(null);
  const [allies, setAllies] = useState([]);
  const [allySearch, setAllySearch] = useState('');
  const [selectedAllies, setSelectedAllies] = useState([]);
  const [sendingShare, setSendingShare] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [allPosts, setAllPosts] = useState([]);
  const [visiblePosts, setVisiblePosts] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showPostMenu, setShowPostMenu] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [editPostContent, setEditPostContent] = useState('');
  const [editPostLocation, setEditPostLocation] = useState('');
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [expandedPosts, setExpandedPosts] = useState({});
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ posts: [], campaigns: [] });
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [donationForm, setDonationForm] = useState({ amount: '', donorName: '', phoneNumber: '', transactionId: '', paymentMethod: 'bKash', isAnonymous: false });
  const [submittingDonation, setSubmittingDonation] = useState(false);
  const [completedCampaigns, setCompletedCampaigns] = useState(0);
  const longPressTimer = useRef(null);
  const touchStartX = useRef(0);
  const observerRef = useRef(null);
  const loadMoreTriggerRef = useRef(null);
  const POSTS_PER_LOAD = 2;
  
  const volunteerId = localStorage.getItem('volunteerId');

  // Wing committee roles (sort_order 1-6 are committee, 7 is regular member)
  const wingCommitteeRoles = [
    { role: 'Wing Chief Executive', sort_order: 1 },
    { role: 'Wing Deputy Executive', sort_order: 2 },
    { role: 'Wing Secretary', sort_order: 3 },
    { role: 'Wing Treasurer', sort_order: 4 },
    { role: 'Wing Coordinator', sort_order: 5 },
    { role: 'Wing Senior Member', sort_order: 6 }
  ];

  const fetchActivities = async () => {
    setLoadingActivities(true);
    try {
      const res = await fetch(`/api/wings/${id}/activities`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data);
      }
    } catch (err) {
      console.error('Failed to fetch activities:', err);
    } finally {
      setLoadingActivities(false);
    }
  };

  const fetchCompletedCampaigns = async () => {
    try {
      const res = await fetch(`/api/campaigns?wingId=${id}&status=completed`);
      if (res.ok) {
        const data = await res.json();
        setCompletedCampaigns(data.length);
      }
    } catch (err) {
      console.error('Failed to fetch completed campaigns:', err);
    }
  };

  const handleSubmitDonation = async () => {
    if (!donationForm.amount || parseFloat(donationForm.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    if (!donationForm.transactionId) {
      alert('Please enter transaction ID');
      return;
    }
    
    setSubmittingDonation(true);
    try {
      const res = await fetch('/api/wing-donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wingId: parseInt(id),
          volunteerId: volunteerId,
          amount: parseFloat(donationForm.amount),
          donorName: donationForm.isAnonymous ? 'Anonymous' : donationForm.donorName,
          phoneNumber: donationForm.phoneNumber,
          transactionId: donationForm.transactionId,
          paymentMethod: donationForm.paymentMethod,
          isAnonymous: donationForm.isAnonymous
        })
      });
      
      if (res.ok) {
        alert('Donation submitted! It will be reviewed by wing admins.');
        setShowDonationModal(false);
        setDonationForm({ amount: '', donorName: '', phoneNumber: '', transactionId: '', paymentMethod: 'bKash', isAnonymous: false });
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to submit donation');
      }
    } catch (err) {
      alert('Failed to submit donation');
    } finally {
      setSubmittingDonation(false);
    }
  };

  useEffect(() => {
    fetchWingData();
    fetchPosts();
    checkCentralCommittee();
    fetchAllies();
    fetchCompletedCampaigns();
  }, [id]);

  const fetchWingData = async () => {
    try {
      // Admin email has full access
      const userEmail = localStorage.getItem('volunteerEmail') || '';
      const isSuperAdmin = userEmail.toLowerCase() === 'istiak.ahmed.tj@gmail.com';
      
      const wingRes = await fetch(`/api/wings/${id}`);
      
      if (wingRes.ok) {
        const wingData = await wingRes.json();
        setWing(wingData);
        
        const membersData = wingData.members || [];
        const mappedMembers = membersData.map(m => ({
          ...m,
          id: m.volunteer_id
        }));
        setMembers(mappedMembers);
        setIsMember(mappedMembers.some(m => String(m.id) === String(volunteerId)));
        
        // Check if user is admin (super admin always gets admin rights)
        if (isSuperAdmin) {
          setIsAdmin(true);
        } else {
          const userMember = mappedMembers.find(m => String(m.id) === String(volunteerId));
          if (userMember && (userMember.is_admin === 1 || userMember.sort_order === 1)) {
            setIsAdmin(true);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load wing:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenGroupChat = async () => {
    try {
      // Check if wing group chat exists
      const checkRes = await fetch(`/api/wings/${id}/group-chat?userId=${volunteerId}`);
      const checkData = await checkRes.json();
      
      if (checkData.exists && checkData.groupId) {
        // Group exists, navigate to chat with group
        navigate(`/volunteer/chat?group=${checkData.groupId}`);
      } else {
        // Create group chat
        const createRes = await fetch(`/api/wings/${id}/group-chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: volunteerId })
        });
        const createData = await createRes.json();
        
        if (createData.groupId) {
          navigate(`/volunteer/chat?group=${createData.groupId}`);
        }
      }
    } catch (err) {
      console.error('Failed to open group chat:', err);
    }
  };

  const fetchAllies = async () => {
    try {
      const res = await fetch(`/api/volunteers/${volunteerId}/allies`);
      if (res.ok) {
        const data = await res.json();
        setAllies(data);
      }
    } catch (err) {
      console.error('Failed to fetch allies:', err);
    }
  };

  const fetchPosts = async () => {
    try {
      const [postsRes, campaignsRes] = await Promise.all([
        fetch(`/api/wings/${id}/posts`),
        fetch(`/api/campaigns?wingId=${id}&status=approved`)
      ]);
      
      let allPostsData = [];
      
      if (postsRes.ok) {
        const postsData = await postsRes.json();
        allPostsData = [...postsData];
      }
      
      if (campaignsRes.ok) {
        const campaignsData = await campaignsRes.json();
        // Transform campaigns to look like posts
        const campaignPosts = campaignsData.map(campaign => ({
          id: `campaign-${campaign.id}`,
          type: 'campaign',
          campaign_id: campaign.id,
          campaign_title: campaign.title,
          campaign_description: campaign.description,
          campaign_deadline: campaign.event_date,
          campaign_image: campaign.image,
          campaign_volunteers_needed: campaign.volunteers_needed,
          campaign_volunteers_joined: campaign.volunteers_joined || campaign.joined_count,
          campaign_budget: campaign.budget,
          campaign_location: campaign.location,
          wing_id: id,
          author_id: campaign.host_id,
          author_name: campaign.host_name,
          author_avatar: campaign.host_avatar,
          content: `🎯 ${campaign.title}\n\n${campaign.description?.slice(0, 150)}${campaign.description?.length > 150 ? '...' : ''}`,
          location: campaign.location,
          created_at: campaign.created_at,
          reaction_count: 0,
          comment_count: 0,
          images: campaign.image ? [{ image_url: campaign.image }] : [],
          tags: [],
          reactions: []
        }));
        
        allPostsData = [...allPostsData, ...campaignPosts];
      }
      
      // Sort by created_at descending
      allPostsData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      setAllPosts(allPostsData);
      
      // Load initial posts (first 2)
      const initialPosts = allPostsData.slice(0, POSTS_PER_LOAD);
      setVisiblePosts(initialPosts);
      setPosts(initialPosts);
      setHasMore(allPostsData.length > POSTS_PER_LOAD);
      
      // Fetch user reactions for visible posts only (skip campaign posts)
      const regularPosts = initialPosts.filter(p => p.type !== 'campaign');
      fetchReactionsForPosts(regularPosts);
    } catch (err) {
      console.error('Failed to load posts:', err);
    }
  };

  const fetchReactionsForPosts = async (postsToFetch) => {
    for (const post of postsToFetch) {
      try {
        const reactRes = await fetch(`/api/posts/${post.id}/react/${volunteerId}`);
        if (reactRes.ok) {
          const { reaction } = await reactRes.json();
          if (reaction) {
            setUserReactions(prev => ({ ...prev, [post.id]: reaction }));
          }
        }
      } catch (err) {
        console.error('Failed to fetch reaction:', err);
      }
    }
  };

  const loadMorePosts = () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    
    // Simulate slight delay for smooth UX
    setTimeout(() => {
      const currentLength = visiblePosts.length;
      const nextPosts = allPosts.slice(currentLength, currentLength + POSTS_PER_LOAD);
      
      if (nextPosts.length > 0) {
        setVisiblePosts(prev => [...prev, ...nextPosts]);
        setPosts(prev => [...prev, ...nextPosts]);
        
        // Fetch reactions only for regular posts, not campaigns
        const regularPosts = nextPosts.filter(p => p.type !== 'campaign');
        fetchReactionsForPosts(regularPosts);
      }
      
      setHasMore(currentLength + nextPosts.length < allPosts.length);
      setLoadingMore(false);
    }, 300);
  };

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMorePosts();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );
    
    if (loadMoreTriggerRef.current) {
      observerRef.current.observe(loadMoreTriggerRef.current);
    }
    
    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [hasMore, loadingMore, visiblePosts]);

  const checkCentralCommittee = async () => {
    try {
      const res = await fetch(`/api/volunteers/${volunteerId}`);
      if (res.ok) {
        const data = await res.json();
        // Check if user has a central committee position
        const centralPositions = ['Chairperson', 'Executive Director', 'Deputy Executive Director', 
          'Secretary General', 'Joint Secretary', 'Treasurer', 'Director'];
        setCentralCommittee(centralPositions.some(p => data.position?.includes(p)));
      }
    } catch (err) {
      console.error('Failed to check central committee:', err);
    }
  };

  // Committee members, regular members
  const committeeMembers = members.filter(m => m.sort_order <= 6);
  const regularMembers = members.filter(m => m.sort_order === 7);
  const currentUserMember = members.find(m => String(m.id) === String(volunteerId));
  const userRole = currentUserMember?.role;
  const isCommitteeMember = currentUserMember && currentUserMember.sort_order <= 6;
  const filledRoles = committeeMembers.map(m => m.role);
  const vacantPositions = wingCommitteeRoles.filter(r => !filledRoles.includes(r.role));
  const totalHours = members.reduce((sum, m) => sum + (m.hours_given || 0), 0);

  // Can create post/campaign (wing committee or central committee)
  const canCreate = isCommitteeMember || centralCommittee;

  const tabs = [
    { key: 'home', label: 'Home' },
    { key: 'about', label: 'About' },
    { key: 'members', label: 'Members' },
    { key: 'activities', label: 'Activities' }
  ];

  // Reaction handlers
  const handleReaction = async (postId, reactionType) => {
    const currentReaction = userReactions[postId];
    
    if (currentReaction === reactionType) {
      // Remove reaction
      await fetch(`/api/posts/${postId}/react/${volunteerId}`, { method: 'DELETE' });
      setUserReactions(prev => {
        const newReactions = { ...prev };
        delete newReactions[postId];
        return newReactions;
      });
    } else {
      // Add/update reaction
      await fetch(`/api/posts/${postId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volunteerId, reactionType })
      });
      setUserReactions(prev => ({ ...prev, [postId]: reactionType }));
    }
    
    setShowReactionPicker(null);
    fetchPosts();
  };

  const handleLongPressStart = (postId) => {
    longPressTimer.current = setTimeout(() => {
      setShowReactionPicker(postId);
    }, 500);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  // Comment handlers
  const fetchComments = async (postId) => {
    try {
      const res = await fetch(`/api/posts/${postId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setPostComments(prev => ({ ...prev, [postId]: data }));
      }
    } catch (err) {
      console.error('Failed to load comments:', err);
    }
  };

  const toggleComments = (postId) => {
    if (expandedComments[postId]) {
      setExpandedComments(prev => ({ ...prev, [postId]: false }));
    } else {
      fetchComments(postId);
      setExpandedComments(prev => ({ ...prev, [postId]: true }));
    }
  };

  const submitComment = async (postId) => {
    const content = newComment[postId]?.trim();
    if (!content) return;

    await fetch(`/api/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        volunteerId, 
        content, 
        parentId: replyTo?.commentId 
      })
    });

    setNewComment(prev => ({ ...prev, [postId]: '' }));
    setReplyTo(null);
    fetchComments(postId);
    fetchPosts();
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  };

  const getReactionEmoji = (type) => REACTIONS.find(r => r.type === type)?.emoji || '👍';

  const togglePostExpansion = (postId) => {
    setExpandedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  // Image viewer functions
  const openImageViewer = (images, startIndex = 0) => {
    setImageViewer({ open: true, images, currentIndex: startIndex });
  };

  const closeImageViewer = () => {
    setImageViewer({ open: false, images: [], currentIndex: 0 });
  };

  const nextImage = () => {
    setImageViewer(prev => ({
      ...prev,
      currentIndex: (prev.currentIndex + 1) % prev.images.length
    }));
  };

  const prevImage = () => {
    setImageViewer(prev => ({
      ...prev,
      currentIndex: prev.currentIndex === 0 ? prev.images.length - 1 : prev.currentIndex - 1
    }));
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextImage();
      else prevImage();
    }
  };

  // Share functions
  const openShareChatModal = (post) => {
    setShowShareChatModal(post);
    setShowShareMenu(null);
    setSelectedAllies([]);
    setAllySearch('');
  };

  const toggleAllySelection = (allyId) => {
    setSelectedAllies(prev => 
      prev.includes(allyId) 
        ? prev.filter(id => id !== allyId)
        : [...prev, allyId]
    );
  };

  const sendToAllies = async () => {
    if (selectedAllies.length === 0 || !showShareChatModal) return;
    
    setSendingShare(true);
    const post = showShareChatModal;
    const shareMessage = `🔗 Shared a post from ${wing?.name}\n\n"${post.content?.substring(0, 150) || ''}${post.content?.length > 150 ? '...' : ''}"\n\n📍 View: ${window.location.origin}/volunteer/wing/${id}?post=${post.id}`;
    
    try {
      for (const allyId of selectedAllies) {
        // Get or create conversation
        const convRes = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ participant1Id: volunteerId, participant2Id: allyId })
        });
        
        if (convRes.ok) {
          const { conversationId } = await convRes.json();
          
          // Send message
          await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              conversationId,
              senderId: volunteerId,
              content: shareMessage,
              messageType: 'text'
            })
          });
        }
      }
      
      alert(`Shared with ${selectedAllies.length} ally${selectedAllies.length > 1 ? 's' : ''}!`);
      setShowShareChatModal(null);
    } catch (err) {
      console.error('Failed to share:', err);
      alert('Failed to share. Please try again.');
    } finally {
      setSendingShare(false);
    }
  };

  const shareExternal = async (post) => {
    const shareUrl = `${window.location.origin}/volunteer/wing/${id}?post=${post.id}`;
    const shareText = `${post.content?.substring(0, 100) || 'Check out this post'}${post.content?.length > 100 ? '...' : ''} - ${wing?.name}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: wing?.name,
          text: shareText,
          url: shareUrl
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    }
    setShowShareMenu(null);
  };

  const openEditPost = (post) => {
    setEditingPost(post);
    setEditPostContent(post.content || '');
    setEditPostLocation(post.location || '');
    setShowPostMenu(null);
  };

  const saveEditPost = async () => {
    if (!editingPost) return;
    
    try {
      const res = await fetch(`/api/posts/${editingPost.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: editPostContent, 
          location: editPostLocation 
        })
      });
      
      if (res.ok) {
        // Update local state
        const updatePost = (posts) => posts.map(p => 
          p.id === editingPost.id 
            ? { ...p, content: editPostContent, location: editPostLocation }
            : p
        );
        setPosts(updatePost);
        setAllPosts(updatePost);
        setVisiblePosts(updatePost);
        setEditingPost(null);
      }
    } catch (err) {
      console.error('Failed to update post:', err);
      alert('Failed to update post');
    }
  };

  const deletePost = async (postId) => {
    if (!confirm('Delete this post?')) return;
    
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
      if (res.ok) {
        const filterPost = (posts) => posts.filter(p => p.id !== postId);
        setPosts(filterPost);
        setAllPosts(filterPost);
        setVisiblePosts(filterPost);
        setShowPostMenu(null);
      }
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  };

  const handleTabChange = (tab) => {
    if (tab === 'posts' && posts.length === 0) {
      fetchPosts();
    } else if (tab === 'activities' && activities.length === 0) {
      fetchActivities();
    }
    setActiveTab(tab);
  };

  const filteredAllies = allies.filter(a => 
    a.full_name?.toLowerCase().includes(allySearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>
    );
  }

  if (!wing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <p className="text-red-600 font-bold mb-4">Wing not found</p>
        <button onClick={() => navigate(-1)} className="px-6 py-2 bg-primary text-white rounded-lg">
          Go Back
        </button>
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
          <h1 className="font-bold text-base truncate">{wing.name}</h1>
          <div className="flex items-center gap-2">
            {(isAdmin || centralCommittee) && (
              <button onClick={() => navigate(`/volunteer/wing/${id}/edit`)} className="flex items-center">
                <span className="material-symbols-outlined text-gray-700 dark:text-gray-200">edit</span>
              </button>
            )}
            <button onClick={() => setShowSearchModal(true)} className="flex items-center">
              <span className="material-symbols-outlined text-gray-700 dark:text-gray-200">search</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-md mx-auto w-full bg-white dark:bg-gray-900 pb-24">
        {/* Cover & Profile */}
        <section className="relative">
          <div className="h-48 w-full bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden">
            {wing.cover_image ? (
              <img alt="Cover" className="w-full h-full object-cover" src={wing.cover_image} />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="material-symbols-outlined text-6xl text-primary/30">location_city</span>
              </div>
            )}
          </div>

          <div className="px-4 -mt-12">
            <div className="relative inline-block">
              <div className="size-32 rounded-full border-4 border-white dark:border-gray-900 overflow-hidden bg-white shadow-md">
                {wing.image ? (
                  <img alt={wing.name} className="w-full h-full object-cover" src={wing.image} />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                    <span className="text-white text-4xl font-bold">
                      {wing.name?.split(' ').map(w => w[0]).join('').substring(0, 2)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-3">
              <h2 className="text-2xl font-extrabold flex items-center gap-1">
                {wing.name}
                <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: '"FILL" 1' }}>
                  verified
                </span>
              </h2>
              {wing.bio && (
                <p className="text-gray-600 dark:text-gray-400 font-medium">
                  {wing.bio}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Created Since 2024 • UYHO Foundation
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="px-4 mt-4 flex gap-2">
            {isMember ? (
              <div className="flex-1 h-10 bg-emerald-100 text-emerald-700 font-bold rounded-lg flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: '"FILL" 1' }}>check_circle</span>
                Member
              </div>
            ) : (
              <button 
                onClick={() => navigate(`/volunteer/wings/${id}`)}
                className="flex-1 h-10 bg-primary text-white font-bold rounded-lg flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">person_add</span>
                Join Wing
              </button>
            )}

            <button 
              onClick={handleOpenGroupChat}
              className="flex-1 h-10 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white font-bold rounded-lg flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">chat_bubble</span>
              Message
            </button>

            <button 
              onClick={() => setShowDonationModal(true)}
              className="w-12 h-10 bg-teal-100 dark:bg-teal-900/30 text-primary font-bold rounded-lg flex items-center justify-center"
            >
              <span className="material-symbols-outlined">volunteer_activism</span>
            </button>
          </div>
        </section>

        {/* Stats */}
        <section className="px-4 mt-6">
          <div className="grid grid-cols-3 gap-3 border border-gray-100 dark:border-gray-800 rounded-2xl p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{members.length >= 1000 ? `${(members.length / 1000).toFixed(1)}K` : members.length}</p>
              <p className="text-[10px] uppercase font-bold text-gray-500 mt-1">Joined Members</p>
            </div>
            <div className="text-center border-x border-gray-100 dark:border-gray-800">
              <p className="text-2xl font-bold">{totalHours >= 1000 ? `${(totalHours / 1000).toFixed(1)}K` : totalHours}</p>
              <p className="text-[10px] uppercase font-bold text-gray-500 mt-1">Hours Contributed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{completedCampaigns}</p>
              <p className="text-[10px] uppercase font-bold text-gray-500 mt-1">Completed</p>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <section className="px-4 mt-6">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`flex-1 py-3 text-sm font-bold transition-all ${
                  activeTab === tab.key 
                    ? 'text-primary border-b-2 border-primary' 
                    : 'text-gray-400'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        {/* Tab Content */}
        {activeTab === 'home' && (
          <>
            {/* About Section */}
            <section className="px-4 mt-6">
              <h3 className="text-2xl font-bold mb-4">About</h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-gray-400">group</span>
                  <p className="text-gray-700 dark:text-gray-300">
                    Followed by <span className="font-bold">{members.length >= 1000 ? `${(members.length / 1000).toFixed(1)}K` : members.length} Members</span>
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-gray-400">task_alt</span>
                  <p className="text-gray-700 dark:text-gray-300">
                    Completed <span className="font-bold">{completedCampaigns} Campaign{completedCampaigns !== 1 ? 's' : ''}</span> nationwide
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-gray-400">location_on</span>
                  <p className="text-gray-700 dark:text-gray-300">
                    Headquarters in <span className="font-bold">{wing.location || 'Bangladesh'}</span>
                  </p>
                </div>
              </div>
              
              <button 
                onClick={() => setActiveTab('about')}
                className="w-full mt-6 py-4 text-sm font-bold text-primary border-2 border-primary/20 rounded-xl hover:bg-primary/5 transition-colors"
              >
                See more about {wing.name}
              </button>
            </section>

            {/* Posts / Hosted Campaigns */}
            <section className="mt-8">
              <div className="px-4 flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">Posts</h3>
              </div>

              {posts.length === 0 ? (
                <div className="px-4 text-center py-12">
                  <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">article</span>
                  <p className="text-gray-500">No posts yet</p>
                  {canCreate && (
                    <p className="text-xs text-gray-400 mt-1">Be the first to post!</p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map(post => (
                    <article key={post.id} id={`post-${post.id}`} className="bg-white dark:bg-gray-900 border-y border-gray-100 dark:border-gray-800">
                      {/* Post Header */}
                      <div className="px-4 py-3 flex items-center gap-3">
                        <div className="size-10 rounded-full overflow-hidden bg-primary/10">
                          {wing.image ? (
                            <img src={wing.image} alt={wing.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                              <span className="text-white font-bold">{wing.name?.charAt(0)}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-sm">{wing.name}</p>
                          <p className="text-xs text-gray-500">
                            {getTimeAgo(post.created_at)} • {post.author_name}
                          </p>
                        </div>
                        <div className="relative">
                          <button 
                            onClick={() => setShowPostMenu(showPostMenu === post.id ? null : post.id)}
                            className="p-2"
                          >
                            <span className="material-symbols-outlined text-gray-400">more_horiz</span>
                          </button>
                          
                          {/* Post Menu */}
                          {showPostMenu === post.id && (
                            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-2 z-20 min-w-[160px]">
                              {(isAdmin || String(post.author_id) === String(volunteerId)) && (
                                <>
                                  <button
                                    onClick={() => openEditPost(post)}
                                    className="w-full px-4 py-2 text-left text-sm flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700"
                                  >
                                    <span className="material-symbols-outlined text-lg">edit</span>
                                    Edit Post
                                  </button>
                                  <button
                                    onClick={() => deletePost(post.id)}
                                    className="w-full px-4 py-2 text-left text-sm flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-red-500"
                                  >
                                    <span className="material-symbols-outlined text-lg">delete</span>
                                    Delete Post
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/volunteer/wing/${id}?post=${post.id}`); alert('Link copied!'); setShowPostMenu(null); }}
                                className="w-full px-4 py-2 text-left text-sm flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700"
                              >
                                <span className="material-symbols-outlined text-lg">link</span>
                                Copy Link
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Post Content */}
                      <div className="px-4 pb-3">
                        {(() => {
                          const maxLength = 150;
                          const isExpanded = expandedPosts[post.id];
                          const content = post.content || '';
                          const shouldTruncate = content.length > maxLength;
                          
                          if (shouldTruncate && !isExpanded) {
                            const truncated = content.slice(0, maxLength);
                            return (
                              <p className="whitespace-pre-wrap">
                                {truncated}
                                <button 
                                  onClick={() => togglePostExpansion(post.id)}
                                  className="text-gray-500 text-sm font-medium hover:text-primary transition-colors cursor-pointer ml-1"
                                >
                                  ...See more
                                </button>
                              </p>
                            );
                          }
                          
                          return (
                            <>
                              <p className="whitespace-pre-wrap">{content}</p>
                              {shouldTruncate && isExpanded && (
                                <button 
                                  onClick={() => togglePostExpansion(post.id)}
                                  className="text-gray-500 text-sm font-medium hover:text-primary transition-colors cursor-pointer block mt-1"
                                >
                                  See less
                                </button>
                              )}
                            </>
                          );
                        })()}
                        
                        {/* Tagged members */}
                        {post.tags?.length > 0 && (
                          <p className="text-sm text-gray-500 mt-2">
                            with {post.tags.map((t, i) => (
                              <span key={t.volunteer_id}>
                                <span className="text-primary font-medium">{t.full_name}</span>
                                {i < post.tags.length - 1 && ', '}
                              </span>
                            ))}
                          </p>
                        )}

                        {/* Location */}
                        {post.location && (
                          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">location_on</span>
                            {post.location}
                          </p>
                        )}
                      </div>

                      {/* Post Images */}
                      {post.images?.length > 0 && (
                        <div className={`px-4 pb-3 grid gap-1 ${
                          post.images.length === 1 ? 'grid-cols-1' : 
                          post.images.length === 2 ? 'grid-cols-2' : 
                          post.images.length === 3 ? 'grid-cols-3' : 
                          'grid-cols-2'
                        }`}>
                          {post.images.slice(0, 4).map((img, i) => (
                            <button 
                              key={i} 
                              onClick={() => openImageViewer(post.images.map(im => im.image_url), i)}
                              className={`${
                                post.images.length === 1 ? 'aspect-video max-h-64' : 
                                post.images.length === 2 ? 'aspect-[4/3]' : 
                                post.images.length === 3 ? 'aspect-square' : 
                                'aspect-square'
                              } bg-gray-100 dark:bg-gray-800 overflow-hidden relative rounded-lg`}
                            >
                              <img 
                                src={img.image_url} 
                                alt="" 
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                              {i === 3 && post.images.length > 4 && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                  <span className="text-white text-xl font-bold flex items-center gap-1">
                                    <span className="material-symbols-outlined">add</span>
                                    {post.images.length - 4}
                                  </span>
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Campaign Card (if post is for a campaign OR if it's a campaign post type) */}
                      {((post.campaign_id && post.campaign_title) || post.type === 'campaign') && (
                        <div className="mx-4 mb-3 p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20">
                          <div className="flex items-start gap-3">
                            <div className="size-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                              <span className="material-symbols-outlined text-primary">campaign</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm">{post.campaign_title}</p>
                              <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                                {(post.campaign_description || '').slice(0, 100)}{(post.campaign_description || '').length > 100 ? '...' : ''}
                              </p>
                              {(post.campaign_deadline || post.campaign_volunteers_needed) && (
                                <div className="flex gap-3 mt-2">
                                  {post.campaign_deadline && (
                                    <p className="text-xs text-primary font-medium">
                                      📅 {new Date(post.campaign_deadline).toLocaleDateString()}
                                    </p>
                                  )}
                                  {post.campaign_volunteers_needed && (
                                    <p className="text-xs text-blue-600 font-medium">
                                      👥 {post.campaign_volunteers_joined || 0}/{post.campaign_volunteers_needed} joined
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <button 
                            onClick={() => {
                              const campaignId = post.campaign_id;
                              console.log('Navigating to campaign:', campaignId);
                              navigate(`/volunteer/campaigns/${campaignId}`);
                            }}
                            className="w-full mt-3 py-2.5 bg-primary text-white font-bold rounded-lg text-sm hover:bg-primary/90 transition-colors"
                          >
                            View Campaign
                          </button>
                        </div>
                      )}

                      {/* Reaction & Comment counts */}
                      {(post.reaction_count > 0 || post.comment_count > 0) && (
                        <div className="px-4 py-2 flex items-center justify-between text-xs text-gray-500 border-b border-gray-100 dark:border-gray-800">
                          {post.reaction_count > 0 && (
                            <div className="flex items-center gap-1">
                              <div className="flex -space-x-1">
                                {post.reactions?.slice(0, 3).map((r, i) => (
                                  <span key={i} className="text-sm">{getReactionEmoji(r.reaction_type)}</span>
                                ))}
                              </div>
                              <span>{post.reaction_count}</span>
                            </div>
                          )}
                          {post.comment_count > 0 && (
                            <button onClick={() => toggleComments(post.id)} className="hover:underline">
                              {post.comment_count} comments
                            </button>
                          )}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="px-4 py-1 flex items-center border-b border-gray-100 dark:border-gray-800 relative">
                        {/* Reaction picker */}
                        {showReactionPicker === post.id && (
                          <div className="absolute bottom-full left-4 mb-2 bg-white dark:bg-gray-800 rounded-full shadow-lg px-2 py-1 flex gap-1 z-10 border border-gray-200 dark:border-gray-700">
                            {REACTIONS.map(r => (
                              <button
                                key={r.type}
                                onClick={() => handleReaction(post.id, r.type)}
                                className={`text-2xl hover:scale-125 transition-transform p-1 ${userReactions[post.id] === r.type ? 'bg-gray-100 dark:bg-gray-700 rounded-full' : ''}`}
                                title={r.label}
                              >
                                {r.emoji}
                              </button>
                            ))}
                          </div>
                        )}

                        <button
                          onMouseDown={() => handleLongPressStart(post.id)}
                          onMouseUp={handleLongPressEnd}
                          onMouseLeave={handleLongPressEnd}
                          onTouchStart={() => handleLongPressStart(post.id)}
                          onTouchEnd={handleLongPressEnd}
                          onClick={() => !showReactionPicker && handleReaction(post.id, 'like')}
                          className={`flex-1 py-2.5 flex items-center justify-center gap-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${userReactions[post.id] ? REACTIONS.find(r => r.type === userReactions[post.id])?.color : ''}`}
                        >
                          {userReactions[post.id] ? (
                            <span className="text-lg">{getReactionEmoji(userReactions[post.id])}</span>
                          ) : (
                            <span className="material-symbols-outlined text-lg">thumb_up</span>
                          )}
                          <span className="text-sm font-medium">
                            {userReactions[post.id] ? REACTIONS.find(r => r.type === userReactions[post.id])?.label : 'Like'}
                          </span>
                        </button>

                        <button 
                          onClick={() => toggleComments(post.id)}
                          className="flex-1 py-2.5 flex items-center justify-center gap-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">chat_bubble_outline</span>
                          <span className="text-sm font-medium">Comment</span>
                        </button>

                        <div className="flex-1 relative">
                          <button 
                            onClick={() => setShowShareMenu(showShareMenu === post.id ? null : post.id)}
                            className="w-full py-2.5 flex items-center justify-center gap-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          >
                            <span className="material-symbols-outlined text-lg">share</span>
                            <span className="text-sm font-medium">Share</span>
                          </button>
                          
                          {/* Share Menu Popup */}
                          {showShareMenu === post.id && (
                            <div className="absolute bottom-full right-0 mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-20 min-w-[180px]">
                              <button
                                onClick={() => openShareChatModal(post)}
                                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                              >
                                <span className="material-symbols-outlined text-primary">chat</span>
                                <span className="text-sm font-medium">Share in Chat</span>
                              </button>
                              <button
                                onClick={() => shareExternal(post)}
                                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-t border-gray-100 dark:border-gray-700"
                              >
                                <span className="material-symbols-outlined text-blue-500">ios_share</span>
                                <span className="text-sm font-medium">Share Outside</span>
                              </button>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(`${window.location.origin}/volunteer/wing/${id}?post=${post.id}`);
                                  alert('Link copied!');
                                  setShowShareMenu(null);
                                }}
                                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-t border-gray-100 dark:border-gray-700"
                              >
                                <span className="material-symbols-outlined text-gray-500">link</span>
                                <span className="text-sm font-medium">Copy Link</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Comments Section */}
                      {expandedComments[post.id] && (
                        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50">
                          {/* Comment input */}
                          <div className="flex gap-2 mb-4">
                            <div className="size-8 rounded-full bg-primary/10 flex-shrink-0" />
                            <div className="flex-1 flex gap-2">
                              <input
                                type="text"
                                value={newComment[post.id] || ''}
                                onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                                placeholder={replyTo ? `Reply to ${replyTo.name}...` : 'Write a comment...'}
                                className="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-700 rounded-full border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                onKeyPress={(e) => e.key === 'Enter' && submitComment(post.id)}
                              />
                              <button
                                onClick={() => submitComment(post.id)}
                                className="size-9 rounded-full bg-primary text-white flex items-center justify-center"
                              >
                                <span className="material-symbols-outlined text-sm">send</span>
                              </button>
                            </div>
                          </div>

                          {/* Comments list */}
                          <div className="space-y-3">
                            {postComments[post.id]?.map(comment => (
                              <div key={comment.id}>
                                <div className="flex gap-2">
                                  <div className="size-8 rounded-full bg-gray-200 dark:bg-gray-600 flex-shrink-0 overflow-hidden">
                                    {comment.avatar ? (
                                      <img src={comment.avatar} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500">
                                        {comment.full_name?.charAt(0)}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <div className="bg-white dark:bg-gray-700 rounded-2xl px-3 py-2">
                                      <p className="font-bold text-xs">{comment.full_name}</p>
                                      <p className="text-sm">{comment.content}</p>
                                    </div>
                                    <div className="flex gap-4 mt-1 px-2 text-xs text-gray-500">
                                      <span>{getTimeAgo(comment.created_at)}</span>
                                      <button className="font-bold hover:underline">Like</button>
                                      <button 
                                        onClick={() => setReplyTo({ commentId: comment.id, name: comment.full_name })}
                                        className="font-bold hover:underline"
                                      >
                                        Reply
                                      </button>
                                    </div>

                                    {/* Replies */}
                                    {comment.replies?.length > 0 && (
                                      <div className="mt-2 space-y-2 pl-4">
                                        {comment.replies.map(reply => (
                                          <div key={reply.id} className="flex gap-2">
                                            <div className="size-6 rounded-full bg-gray-200 dark:bg-gray-600 flex-shrink-0 overflow-hidden">
                                              {reply.avatar ? (
                                                <img src={reply.avatar} alt="" className="w-full h-full object-cover" />
                                              ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-500">
                                                  {reply.full_name?.charAt(0)}
                                                </div>
                                              )}
                                            </div>
                                            <div className="flex-1">
                                              <div className="bg-white dark:bg-gray-700 rounded-2xl px-3 py-2">
                                                <p className="font-bold text-xs">{reply.full_name}</p>
                                                <p className="text-xs">{reply.content}</p>
                                              </div>
                                              <div className="flex gap-4 mt-1 px-2 text-[10px] text-gray-500">
                                                <span>{getTimeAgo(reply.created_at)}</span>
                                                <button className="font-bold hover:underline">Like</button>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </article>
                  ))}
                  
                  {/* Load More Trigger */}
                  <div ref={loadMoreTriggerRef} className="py-4">
                    {loadingMore && (
                      <div className="flex justify-center items-center gap-2 py-4">
                        <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                        <span className="text-sm text-gray-500">Loading more posts...</span>
                      </div>
                    )}
                    {!hasMore && posts.length > 0 && (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-400">You've seen all posts</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          </>
        )}

        {activeTab === 'about' && (
          <section className="px-4 mt-6">
            {isMember && (
              <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: '"FILL" 1' }}>badge</span>
                  <div>
                    <p className="text-sm font-bold text-primary">
                      {isCommitteeMember 
                        ? `You're a ${userRole} in this wing`
                        : `You're a Wing Member in this wing`
                      }
                    </p>
                    <p className="text-xs text-gray-500">Thank you for being part of {wing.name}</p>
                  </div>
                </div>
              </div>
            )}
            
            <h3 className="text-2xl font-bold mb-4">About {wing.name}</h3>
            
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
              {wing.description || `${wing.name} is a dedicated wing of UYHO Foundation, committed to making a positive impact in the community through volunteer work and humanitarian efforts.`}
            </p>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <span className="material-symbols-outlined text-primary">location_on</span>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">Location</p>
                  <p className="font-medium">{wing.location || 'Bangladesh'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <span className="material-symbols-outlined text-primary">calendar_month</span>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">Established</p>
                  <p className="font-medium">{wing.created_at ? new Date(wing.created_at).getFullYear() : 2024}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <span className="material-symbols-outlined text-primary">group</span>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">Total Members</p>
                  <p className="font-medium">{members.length} Active Members</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <span className="material-symbols-outlined text-primary">schedule</span>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">Hours Contributed</p>
                  <p className="font-medium">{totalHours.toLocaleString()} Hours</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'members' && (
          <section className="px-4 mt-6">
            <h3 className="text-lg font-bold mb-4">All Members ({members.length})</h3>
            
            {/* Wing Committee */}
            <div className="mb-6">
              <p className="text-xs font-bold text-gray-500 uppercase mb-3">Wing Committee</p>
              <div className="space-y-3">
                {committeeMembers.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => navigate(`/volunteer/profile/${member.id}`)}
                    className="w-full flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="size-12 rounded-full overflow-hidden bg-primary/10">
                      {member.avatar ? (
                        <img src={member.avatar} alt={member.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-primary/70">
                          <span className="text-white font-bold">
                            {member.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold">{member.full_name}</p>
                      <p className="text-xs text-primary font-medium">{member.role}</p>
                    </div>
                    {String(member.id) === String(volunteerId) ? (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">YOU</span>
                    ) : (
                      <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                    )}
                  </button>
                ))}
                
                {/* Vacant positions */}
                {vacantPositions.map((position) => (
                  <div
                    key={position.role}
                    className="w-full flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700"
                  >
                    <div className="size-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <span className="material-symbols-outlined text-gray-400">person_add</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-400">{position.role}</p>
                      <p className="text-xs text-amber-600 font-medium">Vacant • Available for application</p>
                    </div>
                    {isMember ? (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">JOINED</span>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/volunteer/wings/${id}`);
                        }}
                        className="text-xs font-bold text-white bg-primary px-3 py-1.5 rounded-full hover:bg-primary/90 transition-colors"
                      >
                        Apply
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Wing Members (regular) */}
            {regularMembers.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-3">Wing Members ({regularMembers.length})</p>
                <div className="grid grid-cols-4 gap-3">
                  {regularMembers.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => navigate(`/volunteer/profile/${member.id}`)}
                      className="flex flex-col items-center"
                    >
                      <div className={`size-14 rounded-full overflow-hidden bg-primary/10 border-2 shadow-sm ${
                        String(member.id) === String(volunteerId) ? 'border-primary' : 'border-white'
                      }`}>
                        {member.avatar ? (
                          <img src={member.avatar} alt={member.full_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400">
                            <span className="text-white text-sm font-bold">
                              {member.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                            </span>
                          </div>
                        )}
                      </div>
                      <p className={`text-[10px] font-medium text-center mt-1 truncate w-full ${
                        String(member.id) === String(volunteerId) ? 'text-primary font-bold' : ''
                      }`}>
                        {String(member.id) === String(volunteerId) ? 'You' : member.full_name?.split(' ')[0]}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {members.length === 0 && (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">group</span>
                <p className="text-gray-500">No members yet</p>
              </div>
            )}
          </section>
        )}

        {activeTab === 'activities' && (
          <section className="px-4 mt-6">
            <h3 className="text-lg font-bold mb-4">Recent Activities</h3>
            
            {loadingActivities ? (
              <div className="text-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading activities...</p>
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">event</span>
                <p className="text-gray-500">No activities yet</p>
                <p className="text-xs text-gray-400 mt-1">Wing activities will appear here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activities.map(activity => (
                  <div key={activity.id} className="flex items-center gap-3 px-3 py-2.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                    <div className="size-8 rounded-full bg-primary/10 overflow-hidden flex-shrink-0">
                      {activity.avatar ? (
                        <img src={activity.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-primary">
                          {activity.full_name?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-medium text-sm truncate text-gray-800 dark:text-white">{activity.full_name}</p>
                        <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded">
                          {activity.digital_id}
                        </span>
                        {activity.activity_type && (
                          <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                            activity.activity_type === 'joined_wing' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                            activity.activity_type === 'joined_campaign' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                            'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400'
                          }`}>
                            {activity.activity_type === 'joined_wing' ? 'Joined' :
                             activity.activity_type === 'joined_campaign' ? 'Campaign' :
                             activity.activity_type}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs truncate">
                        {activity.description} • {new Date(activity.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Floating Action Button - Only for committee members */}
      {canCreate && (
        <div className="fixed bottom-24 right-4 z-40">
          {showFabMenu && (
            <div className="absolute bottom-16 right-0 flex flex-col gap-3 items-end animate-in slide-in-from-bottom-2">
              <button
                onClick={() => {
                  setShowFabMenu(false);
                  navigate(`/volunteer/wing/${id}/create-post`);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700"
              >
                <span className="text-sm font-bold">Post</span>
                <div className="size-10 rounded-full bg-emerald-500 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white">edit</span>
                </div>
              </button>
              
              <button
                onClick={() => {
                  setShowFabMenu(false);
                  navigate(`/volunteer/wing/${id}/request-campaign`);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700"
              >
                <span className="text-sm font-bold">Campaign</span>
                <div className="size-10 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white">campaign</span>
                </div>
              </button>
            </div>
          )}
          
          <button
            onClick={() => setShowFabMenu(!showFabMenu)}
            className={`size-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center transition-transform ${showFabMenu ? 'rotate-45' : ''}`}
          >
            <span className="material-symbols-outlined text-2xl">add</span>
          </button>
        </div>
      )}

      {/* Overlay when FAB menu is open */}
      {showFabMenu && (
        <div 
          className="fixed inset-0 bg-black/20 z-30"
          onClick={() => setShowFabMenu(false)}
        />
      )}

      {/* Overlay when share menu is open */}
      {showShareMenu && (
        <div 
          className="fixed inset-0 z-10"
          onClick={() => setShowShareMenu(null)}
        />
      )}

      {/* Fullscreen Image Viewer */}
      {imageViewer.open && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 text-white">
            <button onClick={closeImageViewer} className="size-10 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
            <span className="text-sm font-medium">
              {imageViewer.currentIndex + 1} / {imageViewer.images.length}
            </span>
            <div className="size-10" />
          </div>

          {/* Image */}
          <div 
            className="flex-1 flex items-center justify-center overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <img 
              src={imageViewer.images[imageViewer.currentIndex]} 
              alt="" 
              className="max-w-full max-h-full object-contain"
            />
          </div>

          {/* Navigation arrows (for desktop) */}
          {imageViewer.images.length > 1 && (
            <>
              <button 
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 size-12 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              >
                <span className="material-symbols-outlined text-2xl">chevron_left</span>
              </button>
              <button 
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 size-12 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              >
                <span className="material-symbols-outlined text-2xl">chevron_right</span>
              </button>
            </>
          )}

          {/* Thumbnails */}
          {imageViewer.images.length > 1 && (
            <div className="p-4 flex justify-center gap-2 overflow-x-auto">
              {imageViewer.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setImageViewer(prev => ({ ...prev, currentIndex: i }))}
                  className={`size-14 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                    i === imageViewer.currentIndex ? 'border-white' : 'border-transparent opacity-50'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Post Modal */}
      {editingPost && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h3 className="font-bold text-lg">Edit Post</h3>
              <button onClick={() => setEditingPost(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <textarea
                value={editPostContent}
                onChange={(e) => setEditPostContent(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full h-40 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl resize-none outline-none"
              />
              
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-gray-400">location_on</span>
                <input
                  type="text"
                  value={editPostLocation}
                  onChange={(e) => setEditPostLocation(e.target.value)}
                  placeholder="Add location (optional)"
                  className="flex-1 p-2 bg-gray-50 dark:bg-gray-800 rounded-xl outline-none text-sm"
                />
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex gap-2">
              <button
                onClick={() => setEditingPost(null)}
                className="flex-1 py-3 font-bold rounded-xl bg-gray-100 dark:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={saveEditPost}
                disabled={!editPostContent.trim()}
                className={`flex-1 py-3 font-bold rounded-xl ${
                  editPostContent.trim() ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'
                }`}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share to Chat Modal */}
      {showShareChatModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md mx-auto rounded-t-3xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg">Share with Allies</h3>
                <button onClick={() => setShowShareChatModal(null)}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              
              {/* Search */}
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">
                  search
                </span>
                <input
                  type="text"
                  value={allySearch}
                  onChange={(e) => setAllySearch(e.target.value)}
                  placeholder="Search allies..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl outline-none text-sm"
                />
              </div>
            </div>
            
            {/* Post Preview */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Sharing post from {wing?.name}</p>
                <p className="text-sm line-clamp-2">{showShareChatModal.content}</p>
              </div>
            </div>
            
            {/* Allies List */}
            <div className="flex-1 overflow-y-auto p-4">
              {filteredAllies.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  {allies.length === 0 ? 'No allies yet' : 'No allies found'}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredAllies.map(ally => (
                    <button
                      key={ally.id}
                      onClick={() => toggleAllySelection(ally.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                        selectedAllies.includes(ally.id)
                          ? 'bg-primary/10 border-2 border-primary'
                          : 'bg-gray-50 dark:bg-gray-800 border-2 border-transparent'
                      }`}
                    >
                      <div className="size-10 rounded-full overflow-hidden bg-primary/10">
                        {ally.avatar ? (
                          <img src={ally.avatar} alt={ally.full_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-primary/70">
                            <span className="text-white text-sm font-bold">
                              {ally.full_name?.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium">{ally.full_name}</p>
                        <p className="text-xs text-gray-500">{ally.position || 'Volunteer'}</p>
                      </div>
                      {selectedAllies.includes(ally.id) && (
                        <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: '"FILL" 1' }}>
                          check_circle
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Send Button */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={sendToAllies}
                disabled={selectedAllies.length === 0 || sendingShare}
                className={`w-full py-3 font-bold rounded-xl flex items-center justify-center gap-2 ${
                  selectedAllies.length === 0 || sendingShare
                    ? 'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                    : 'bg-primary text-white'
                }`}
              >
                {sendingShare ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                    Sending...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">send</span>
                    Send to {selectedAllies.length} {selectedAllies.length === 1 ? 'Ally' : 'Allies'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 z-[200] bg-white dark:bg-gray-900 flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
            <button onClick={() => { setShowSearchModal(false); setSearchQuery(''); setSearchResults({ posts: [], campaigns: [] }); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div className="flex-1 relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => {
                  const query = e.target.value;
                  setSearchQuery(query);
                  if (query.trim()) {
                    const lowerQuery = query.toLowerCase();
                    // Search in posts - ensure allPosts is an array
                    const postsArray = Array.isArray(allPosts) ? allPosts : [];
                    const matchedPosts = postsArray.filter(p => 
                      (p.content || '').toLowerCase().includes(lowerQuery) ||
                      (p.location || '').toLowerCase().includes(lowerQuery) ||
                      (p.author_name || '').toLowerCase().includes(lowerQuery)
                    );
                    // Search in campaigns - ensure campaigns is an array
                    const campaignsArray = Array.isArray(campaigns) ? campaigns : [];
                    const matchedCampaigns = campaignsArray.filter(c =>
                      (c.title || '').toLowerCase().includes(lowerQuery) ||
                      (c.description || '').toLowerCase().includes(lowerQuery) ||
                      (c.location || '').toLowerCase().includes(lowerQuery)
                    );
                    setSearchResults({ posts: matchedPosts, campaigns: matchedCampaigns });
                  } else {
                    setSearchResults({ posts: [], campaigns: [] });
                  }
                }}
                placeholder="Search posts, campaigns..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
          
          {/* Search Results */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!searchQuery.trim() ? (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-600">search</span>
                <p className="text-gray-500 mt-2">Search posts and campaigns in this wing</p>
              </div>
            ) : searchResults.posts.length === 0 && searchResults.campaigns.length === 0 ? (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-600">search_off</span>
                <p className="text-gray-500 mt-2">No results found for "{searchQuery}"</p>
              </div>
            ) : (
              <>
                {/* Campaign Results */}
                {searchResults.campaigns.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Campaigns ({searchResults.campaigns.length})</h3>
                    <div className="space-y-2">
                      {searchResults.campaigns.map(campaign => (
                        <button
                          key={`campaign-${campaign.id}`}
                          onClick={() => {
                            setShowSearchModal(false);
                            setSearchQuery('');
                            navigate(`/volunteer/campaigns/${campaign.id}`);
                          }}
                          className="w-full flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition text-left"
                        >
                          <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-primary">campaign</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm truncate">{campaign.title}</p>
                            <p className="text-xs text-gray-500 truncate">{campaign.location || 'No location'}</p>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                              <span>👥 {campaign.volunteers_joined || 0}/{campaign.volunteers_needed}</span>
                              <span>•</span>
                              <span>৳{campaign.budget || 0}</span>
                            </div>
                          </div>
                          <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Post Results */}
                {searchResults.posts.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Posts ({searchResults.posts.length})</h3>
                    <div className="space-y-2">
                      {searchResults.posts.map(post => (
                        <button
                          key={`post-${post.id}`}
                          onClick={() => {
                            setShowSearchModal(false);
                            setSearchQuery('');
                            // Scroll to post in home tab
                            setActiveTab('home');
                            setTimeout(() => {
                              const postEl = document.getElementById(`post-${post.id}`);
                              if (postEl) postEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }, 100);
                          }}
                          className="w-full flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition text-left"
                        >
                          {(() => {
                            let images = [];
                            try {
                              if (post.images) {
                                images = typeof post.images === 'string' ? JSON.parse(post.images) : post.images;
                              }
                            } catch (e) {
                              images = [];
                            }
                            const firstImage = images && images.length > 0 && images[0] 
                              ? (typeof images[0] === 'string' ? images[0] : images[0].image_url)
                              : null;
                            
                            return firstImage ? (
                              <div className="size-12 rounded-lg bg-gray-200 overflow-hidden shrink-0">
                                <img src={firstImage} alt="" className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="size-12 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-gray-400">article</span>
                              </div>
                            );
                          })()}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm line-clamp-2">{post.content}</p>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                              <span>{post.author_name}</span>
                              {post.location && (
                                <>
                                  <span>•</span>
                                  <span>{post.location}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Donation Modal */}
      {showDonationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h3 className="font-bold text-lg">Donate to {wing.name}</h3>
              <button 
                onClick={() => setShowDonationModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Amount (৳) *</label>
                <input
                  type="number"
                  value={donationForm.amount}
                  onChange={(e) => setDonationForm({...donationForm, amount: e.target.value})}
                  placeholder="Enter amount"
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Payment Method</label>
                <select
                  value={donationForm.paymentMethod}
                  onChange={(e) => setDonationForm({...donationForm, paymentMethod: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800"
                >
                  <option value="bKash">bKash</option>
                  <option value="Nagad">Nagad</option>
                  <option value="Rocket">Rocket</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Transaction ID *</label>
                <input
                  type="text"
                  value={donationForm.transactionId}
                  onChange={(e) => setDonationForm({...donationForm, transactionId: e.target.value})}
                  placeholder="Enter transaction ID"
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Your Name</label>
                <input
                  type="text"
                  value={donationForm.donorName}
                  onChange={(e) => setDonationForm({...donationForm, donorName: e.target.value})}
                  placeholder="Enter your name"
                  disabled={donationForm.isAnonymous}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 disabled:opacity-50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={donationForm.phoneNumber}
                  onChange={(e) => setDonationForm({...donationForm, phoneNumber: e.target.value})}
                  placeholder="Enter phone number"
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800"
                />
              </div>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={donationForm.isAnonymous}
                  onChange={(e) => setDonationForm({...donationForm, isAnonymous: e.target.checked})}
                  className="w-5 h-5 rounded border-gray-300"
                />
                <span className="text-sm">Donate anonymously</span>
              </label>
              
              <button
                onClick={handleSubmitDonation}
                disabled={submittingDonation}
                className="w-full py-3 bg-primary text-white font-bold rounded-xl disabled:opacity-50"
              >
                {submittingDonation ? 'Submitting...' : 'Submit Donation'}
              </button>
              
              <p className="text-xs text-gray-500 text-center">
                Your donation will be reviewed by wing administrators before being recorded.
              </p>
            </div>
          </div>
        </div>
      )}

      <VolunteerFooter />
    </div>
  );
}
