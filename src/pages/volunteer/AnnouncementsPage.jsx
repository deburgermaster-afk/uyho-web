import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VolunteerFooter from '../../components/VolunteerFooter';

export default function AnnouncementsPage() {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [creating, setCreating] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    context: '',
    priority: 'normal'
  });

  const currentUserId = localStorage.getItem('volunteerId');

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch('/api/announcements');
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAIGenerate = async () => {
    if (!formData.context.trim()) {
      alert('Please enter some context for the AI to generate from');
      return;
    }

    setAiGenerating(true);
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Generate a professional announcement for a volunteer organization based on this context: "${formData.context}". 
          
          Return a JSON object with:
          - title: A short, attention-grabbing title (max 10 words)
          - content: The full announcement text (2-3 paragraphs, professional but friendly tone, include relevant details and a call to action if appropriate)
          
          Make it engaging and suitable for a youth volunteer organization.`
        })
      });

      if (res.ok) {
        const data = await res.json();
        try {
          // Try to parse the AI response as JSON
          const parsed = JSON.parse(data.response.replace(/```json\n?/g, '').replace(/```\n?/g, ''));
          setFormData(prev => ({
            ...prev,
            title: parsed.title || prev.title,
            content: parsed.content || prev.content
          }));
        } catch (e) {
          // If parsing fails, use the response as content
          setFormData(prev => ({
            ...prev,
            content: data.response
          }));
        }
      }
    } catch (error) {
      console.error('Error generating content:', error);
      alert('Failed to generate content. Please try again.');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Please fill in both title and content');
      return;
    }

    setCreating(true);
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          created_by: currentUserId,
          priority: formData.priority
        })
      });

      if (res.ok) {
        alert('Announcement published successfully!');
        setShowCreateModal(false);
        setFormData({ title: '', content: '', context: '', priority: 'normal' });
        fetchAnnouncements();
      } else {
        throw new Error('Failed to create announcement');
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
      alert('Failed to create announcement');
    } finally {
      setCreating(false);
    }
  };

  const filteredAnnouncements = announcements.filter(a =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'normal': return 'bg-blue-500';
      default: return 'bg-slate-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f7fb] dark:bg-gray-900 flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] dark:bg-gray-900 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <span className="material-symbols-outlined text-gray-600 dark:text-gray-300">arrow_back</span>
          </button>
          <h1 className="text-lg font-bold dark:text-white">Announcements</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="p-4">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-pink-500 rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-2xl">campaign</span>
            </div>
            <div>
              <h1 className="text-xl font-bold dark:text-white">Announcements</h1>
              <p className="text-sm text-gray-500">{announcements.length} total announcements</p>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary dark:text-white"
            />
          </div>
        </div>

        {/* Announcements List */}
        <div className="space-y-3">
          {filteredAnnouncements.length === 0 ? (
            <div className="text-center py-16">
              <div className="size-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-5xl text-slate-300">campaign</span>
              </div>
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">No announcements</h3>
              <p className="text-sm text-slate-400">Create your first announcement</p>
            </div>
          ) : (
            filteredAnnouncements.map(announcement => (
              <button
                key={announcement.id}
                onClick={() => {
                  setSelectedAnnouncement(announcement);
                  setShowViewModal(true);
                }}
                className="w-full bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 text-left hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${getPriorityColor(announcement.priority)}`} />
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
            ))
          )}
        </div>
      </div>

      {/* Floating Create Button */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-24 right-4 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center z-40 hover:bg-primary/90 transition-colors"
      >
        <span className="material-symbols-outlined text-2xl">add</span>
      </button>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
          <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-900">
              <h3 className="text-lg font-bold dark:text-white">Create Announcement</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-2">
                <span className="material-symbols-outlined text-gray-500">close</span>
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* AI Context Input */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-4 border border-purple-100 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-purple-600">auto_awesome</span>
                  <p className="text-sm font-bold text-purple-700 dark:text-purple-300">AI Generate</p>
                </div>
                <textarea
                  value={formData.context}
                  onChange={(e) => setFormData(prev => ({ ...prev, context: e.target.value }))}
                  placeholder="Type what you want to announce (e.g., 'We have a blood donation camp on January 30th at Dhaka Medical')"
                  rows={2}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 rounded-xl border-0 text-sm resize-none focus:ring-2 focus:ring-purple-500 dark:text-white"
                />
                <button
                  onClick={handleAIGenerate}
                  disabled={aiGenerating || !formData.context.trim()}
                  className="mt-2 w-full py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {aiGenerating ? (
                    <>
                      <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                      Generating...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">auto_awesome</span>
                      Generate Announcement
                    </>
                  )}
                </button>
              </div>

              <div className="relative flex items-center">
                <div className="flex-1 border-t border-gray-200 dark:border-gray-700"></div>
                <span className="px-4 text-xs text-gray-400">or write manually</span>
                <div className="flex-1 border-t border-gray-200 dark:border-gray-700"></div>
              </div>

              {/* Title */}
              <div>
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Announcement title"
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl border-0 focus:ring-2 focus:ring-primary dark:text-white"
                />
              </div>

              {/* Content */}
              <div>
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">Content *</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Write your announcement..."
                  rows={6}
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl border-0 focus:ring-2 focus:ring-primary dark:text-white resize-none"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">Priority</label>
                <div className="flex gap-2">
                  {['normal', 'high', 'urgent'].map(priority => (
                    <button
                      key={priority}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, priority }))}
                      className={`flex-1 py-2 px-3 rounded-xl text-sm font-bold capitalize transition-colors ${
                        formData.priority === priority
                          ? priority === 'urgent' 
                            ? 'bg-red-500 text-white'
                            : priority === 'high'
                            ? 'bg-orange-500 text-white'
                            : 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {priority}
                    </button>
                  ))}
                </div>
              </div>

              {/* Announce Button */}
              <button
                onClick={handleCreate}
                disabled={creating || !formData.title.trim() || !formData.content.trim()}
                className="w-full py-4 bg-primary hover:bg-primary/90 disabled:bg-gray-300 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                {creating ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    Publishing...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">campaign</span>
                    Announce
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowViewModal(false)}>
          <div 
            className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-900">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getPriorityColor(selectedAnnouncement.priority)}`} />
                <span className="text-xs font-bold uppercase text-slate-400">{selectedAnnouncement.priority}</span>
              </div>
              <button onClick={() => setShowViewModal(false)} className="p-2">
                <span className="material-symbols-outlined text-gray-500">close</span>
              </button>
            </div>
            
            <div className="p-6">
              <h2 className="text-xl font-bold dark:text-white mb-4">{selectedAnnouncement.title}</h2>
              
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                <img 
                  src={selectedAnnouncement.author_avatar || '/avatars/avatar_1.svg'} 
                  alt=""
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="font-bold text-sm dark:text-white">{selectedAnnouncement.author_name}</p>
                  <p className="text-xs text-slate-400">{selectedAnnouncement.author_position} • {formatDate(selectedAnnouncement.created_at)}</p>
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

      <VolunteerFooter />
    </div>
  );
}
