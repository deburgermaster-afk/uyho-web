import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import VolunteerLayout from '../../components/VolunteerLayout';

// For getting video duration
const getVideoDuration = (file) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = () => {
      reject(new Error('Failed to load video metadata'));
    };
    video.src = URL.createObjectURL(file);
  });
};

export default function CreateWingPostPage() {
  const { wingId } = useParams();
  const navigate = useNavigate();
  const { user } = useApp();
  const fileInputRef = useRef(null);
  
  const [wing, setWing] = useState(null);
  const [content, setContent] = useState('');
  const [media, setMedia] = useState([]); // { file, preview, uploading, progress, url, type: 'image' | 'video', error, duration? }
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [videoError, setVideoError] = useState('');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchWing = async () => {
      try {
        const response = await fetch(`https://uyho.org/uyho-backend/api/wings/${wingId}`);
        if (response.ok) {
          const data = await response.json();
          setWing(data);
        }
      } catch (err) {
        console.error('Error fetching wing:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWing();
  }, [wingId]);
  
  // Upload media to server (images and videos)
  const uploadMedia = async (file, index, type) => {
    const formData = new FormData();
    formData.append(type, file);
    
    // Determine the correct endpoint based on media type
    const endpoint = type === 'video' 
      ? 'https://uyho.org/uyho-backend/api/posts/upload-video'
      : 'https://uyho.org/uyho-backend/api/posts/upload-image';
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Failed to upload ${type}`);
      }
      
      const data = await response.json();
      
      // Update media item with server URL
      setMedia(prev => prev.map((m, i) => 
        i === index ? { ...m, url: data.url, uploading: false, progress: 100, error: null } : m
      ));
    } catch (err) {
      console.error(`Error uploading ${type}:`, err);
      setMedia(prev => prev.map((m, i) => 
        i === index ? { ...m, uploading: false, error: `Failed to upload ${type}` } : m
      ));
    }
  };
  
  const handleMediaSelect = async (e) => {
    const files = Array.from(e.target.files);
    setVideoError('');
    
    // Check total count
    const totalMedia = media.length + files.length;
    if (totalMedia > 10) {
      setVideoError('Maximum 10 media files allowed');
      return;
    }
    
    // Process each file
    for (const file of files) {
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
      
      if (!isVideo && !isImage) {
        setVideoError('Only images and videos are allowed');
        continue;
      }
      
      // Video validations
      if (isVideo) {
        // Check video size (max 50MB)
        if (file.size > 50 * 1024 * 1024) {
          setVideoError('Video must be less than 50MB');
          continue;
        }
        
        // Check video duration (max 2 minutes)
        try {
          const duration = await getVideoDuration(file);
          if (duration > 120) {
            setVideoError('Video must be less than 2 minutes');
            continue;
          }
          
          // Add video to media array
          const preview = URL.createObjectURL(file);
          const newIndex = media.length;
          
          setMedia(prev => [...prev, {
            file,
            preview,
            uploading: true,
            progress: 0,
            url: null,
            type: 'video',
            error: null,
            duration: Math.round(duration)
          }]);
          
          // Upload video
          uploadMedia(file, newIndex, 'video');
        } catch (err) {
          setVideoError('Failed to process video');
          continue;
        }
      }
      
      // Image validations
      if (isImage) {
        // Check image size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          setVideoError('Image must be less than 10MB');
          continue;
        }
        
        const preview = URL.createObjectURL(file);
        const newIndex = media.length;
        
        setMedia(prev => [...prev, {
          file,
          preview,
          uploading: true,
          progress: 0,
          url: null,
          type: 'image',
          error: null
        }]);
        
        // Upload image
        uploadMedia(file, newIndex, 'image');
      }
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const removeMedia = (index) => {
    setMedia(prev => {
      const item = prev[index];
      if (item.preview) {
        URL.revokeObjectURL(item.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim() && media.length === 0) {
      setError('Please add some content or media');
      return;
    }
    
    // Check if any media is still uploading
    if (media.some(m => m.uploading)) {
      setError('Please wait for media to finish uploading');
      return;
    }
    
    // Check if any media has errors
    if (media.some(m => m.error)) {
      setError('Some media failed to upload. Please remove them and try again.');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      // Prepare media URLs with types
      const mediaData = media.map(m => ({
        url: m.url,
        type: m.type,
        duration: m.duration || null
      }));
      
      const response = await fetch(`https://uyho.org/uyho-backend/api/wings/${wingId}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          authorId: user.id,
          content: content.trim(),
          media: mediaData,
          location: location.trim() || null
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create post');
      }
      
      // Navigate back to wing page
      navigate(`/volunteer/wing/${wingId}`);
    } catch (err) {
      console.error('Error creating post:', err);
      setError('Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <VolunteerLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent"></div>
        </div>
      </VolunteerLayout>
    );
  }
  
  return (
    <VolunteerLayout hideHeader hideFooter>
      <div className="fixed inset-0 bg-gray-50 dark:bg-gray-900 flex flex-col">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <span className="material-symbols-outlined text-xl">arrow_back</span>
            </button>
            <div>
              <h1 className="font-semibold text-gray-900 dark:text-white">Create Post</h1>
              {wing && (
                <p className="text-xs text-gray-500 dark:text-gray-400">{wing.name}</p>
              )}
            </div>
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || (!content.trim() && media.length === 0)}
            className="bg-emerald-500 text-white px-4 py-2 rounded-full text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Posting...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">check</span>
                <span>Post</span>
              </>
            )}
          </button>
        </header>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-xl flex-shrink-0">error</span>
              <span>{error}</span>
            </div>
          )}
          
          {/* Video Error Message */}
          {videoError && (
            <div className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 px-4 py-3 rounded-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-xl flex-shrink-0">warning</span>
              <span>{videoError}</span>
            </div>
          )}
          
          {/* Text Input */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full min-h-[150px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />
          
          {/* Media Preview Grid */}
          {media.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {media.map((item, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                  {item.type === 'video' ? (
                    <>
                      <video
                        src={item.preview}
                        className="w-full h-full object-cover"
                        muted
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center">
                          <span className="material-symbols-outlined text-2xl text-gray-900">play_arrow</span>
                        </div>
                      </div>
                      {item.duration && (
                        <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                          {Math.floor(item.duration / 60)}:{String(item.duration % 60).padStart(2, '0')}
                        </span>
                      )}
                    </>
                  ) : (
                    <img
                      src={item.preview}
                      alt={`Media ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  )}
                  
                  {/* Upload Progress/Status */}
                  {item.uploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="text-white text-center">
                        <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <span className="text-xs">Uploading...</span>
                      </div>
                    </div>
                  )}
                  
                  {item.error && (
                    <div className="absolute inset-0 bg-red-500/70 flex items-center justify-center p-2">
                      <span className="text-white text-xs text-center">{item.error}</span>
                    </div>
                  )}
                  
                  {/* Type indicator */}
                  <div className="absolute top-2 left-2 bg-black/50 rounded px-1.5 py-0.5 flex items-center gap-1">
                    {item.type === 'video' ? (
                      <span className="material-symbols-outlined text-xs text-white">videocam</span>
                    ) : (
                      <span className="material-symbols-outlined text-xs text-white">image</span>
                    )}
                  </div>
                  
                  {/* Remove button */}
                  <button
                    onClick={() => removeMedia(index)}
                    className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
                  >
                    <span className="material-symbols-outlined text-base">close</span>
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* Location Input */}
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
            <span className="material-symbols-outlined text-xl text-gray-400">location_on</span>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Add location (optional)"
              className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none text-sm"
            />
          </div>
        </div>
        
        {/* Bottom Actions */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center gap-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleMediaSelect}
              accept="image/*,video/*"
              multiple
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
              disabled={media.length >= 10}
            >
              <span className="material-symbols-outlined text-xl">image</span>
              <span className="text-sm">Photo</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
              disabled={media.length >= 10}
            >
              <span className="material-symbols-outlined text-xl">videocam</span>
              <span className="text-sm">Video</span>
            </button>
            {media.length > 0 && (
              <span className="text-xs text-gray-400 ml-auto">
                {media.length}/10 media
              </span>
            )}
          </div>
        </div>
      </div>
    </VolunteerLayout>
  );
}
