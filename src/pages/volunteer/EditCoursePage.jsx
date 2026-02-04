import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import VolunteerFooter from '../../components/VolunteerFooter';

// Certificate design templates
const CERTIFICATE_DESIGNS = [
  { id: 1, name: 'Classic Gold', bgClass: 'bg-gradient-to-br from-amber-50 via-yellow-100 to-amber-200', borderColor: 'border-amber-500', accentColor: 'text-amber-700', icon: 'workspace_premium' },
  { id: 2, name: 'Royal Blue', bgClass: 'bg-gradient-to-br from-blue-50 via-indigo-100 to-blue-200', borderColor: 'border-blue-600', accentColor: 'text-blue-700', icon: 'military_tech' },
  { id: 3, name: 'Emerald Green', bgClass: 'bg-gradient-to-br from-emerald-50 via-green-100 to-emerald-200', borderColor: 'border-emerald-600', accentColor: 'text-emerald-700', icon: 'eco' },
  { id: 4, name: 'Rose Pink', bgClass: 'bg-gradient-to-br from-pink-50 via-rose-100 to-pink-200', borderColor: 'border-rose-500', accentColor: 'text-rose-700', icon: 'favorite' },
  { id: 5, name: 'Purple Majesty', bgClass: 'bg-gradient-to-br from-purple-50 via-violet-100 to-purple-200', borderColor: 'border-purple-600', accentColor: 'text-purple-700', icon: 'diamond' },
  { id: 6, name: 'Midnight Dark', bgClass: 'bg-gradient-to-br from-slate-800 via-gray-900 to-slate-950', borderColor: 'border-slate-400', accentColor: 'text-slate-300', icon: 'dark_mode', textColor: 'text-white' },
  { id: 7, name: 'Sunset Orange', bgClass: 'bg-gradient-to-br from-orange-50 via-amber-100 to-orange-200', borderColor: 'border-orange-500', accentColor: 'text-orange-700', icon: 'wb_twilight' },
  { id: 8, name: 'Ocean Teal', bgClass: 'bg-gradient-to-br from-teal-50 via-cyan-100 to-teal-200', borderColor: 'border-teal-600', accentColor: 'text-teal-700', icon: 'waves' },
  { id: 9, name: 'Crimson Red', bgClass: 'bg-gradient-to-br from-red-50 via-rose-100 to-red-200', borderColor: 'border-red-600', accentColor: 'text-red-700', icon: 'local_fire_department' },
  { id: 10, name: 'Nature Brown', bgClass: 'bg-gradient-to-br from-amber-50 via-orange-100 to-yellow-200', borderColor: 'border-amber-700', accentColor: 'text-amber-800', icon: 'park' },
];

export default function EditCoursePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const currentUserId = localStorage.getItem('volunteerId');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'General',
    badge: 'Course',
    durationHours: 1,
    durationMinutes: 0,
    lessonsCount: 1,
    slideFile: null,
    slideFileName: '',
    certificateDesign: 1,
    image: ''
  });

  useEffect(() => {
    const loadCourse = async () => {
      try {
        const res = await fetch(`/api/courses/${id}`);
        if (!res.ok) throw new Error('Course not found');
        const course = await res.json();
        
        // Check if user is the instructor
        if (course.instructor_id?.toString() !== currentUserId) {
          alert('You can only edit your own courses');
          navigate('/volunteer/courses');
          return;
        }

        // Extract hours and minutes from total hours
        const totalHours = course.duration_hours || 1;
        const hours = Math.floor(totalHours);
        const minutes = Math.round((totalHours - hours) * 60);

        setForm({
          title: course.title || '',
          description: course.description || '',
          category: course.category || 'General',
          badge: course.badge || 'Course',
          durationHours: hours,
          durationMinutes: minutes,
          lessonsCount: course.lessons_count || 1,
          slideFile: course.slide_file || null,
          slideFileName: course.slide_file_name || '',
          certificateDesign: course.certificate_design || 1,
          image: course.image || ''
        });

        if (course.slide_file) {
          setUploadedFile({
            path: course.slide_file,
            name: course.slide_file_name || 'Course slides',
            size: 0
          });
        }

        if (course.image) {
          setImagePreview(course.image);
        }
      } catch (err) {
        console.error('Failed to load course:', err);
        alert('Failed to load course');
        navigate('/volunteer/courses');
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
  }, [id, currentUserId, navigate]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);

    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/posts/upload-image', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setForm(prev => ({ ...prev, image: data.imageUrl }));
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      console.error('Image upload error:', err);
      alert('Failed to upload image');
      setImagePreview(form.image || null);
    } finally {
      setImageUploading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = [
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/pdf'
    ];
    
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(ppt|pptx|pdf)$/i)) {
      alert('Please upload a PowerPoint (.ppt, .pptx) or PDF file');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      alert('File size must be less than 50MB');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'course-slides');

      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            setUploadedFile({
              path: response.filePath,
              name: file.name,
              size: file.size
            });
            setForm(prev => ({
              ...prev,
              slideFile: response.filePath,
              slideFileName: file.name
            }));
          } catch (e) {
            console.error('Parse error:', e);
            alert('Failed to process upload response');
          }
        } else {
          alert('Upload failed. Please try again.');
          setUploadProgress(0);
        }
        setUploading(false);
      });

      xhr.addEventListener('error', () => {
        alert('Failed to upload file. Please try again.');
        setUploading(false);
        setUploadProgress(0);
      });

      xhr.open('POST', '/api/upload');
      xhr.send(formData);
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload file');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setForm(prev => ({
      ...prev,
      slideFile: null,
      slideFileName: ''
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!currentUserId) {
      navigate('/volunteer/login');
      return;
    }

    if (!form.title.trim()) {
      alert('Please enter a course title');
      return;
    }

    if (form.durationHours === 0 && form.durationMinutes === 0) {
      alert('Please set a duration for the course');
      return;
    }

    if (form.lessonsCount < 1) {
      alert('Course must have at least 1 lesson');
      return;
    }

    setSubmitting(true);
    try {
      const totalHours = form.durationHours + (form.durationMinutes / 60);
      
      const res = await fetch(`/api/courses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          category: form.category,
          badge: form.badge,
          durationHours: totalHours,
          lessonsCount: form.lessonsCount,
          slideFile: form.slideFile,
          slideFileName: form.slideFileName,
          certificateDesign: form.certificateDesign,
          image: form.image
        })
      });

      if (res.ok) {
        alert('Course updated successfully!');
        navigate(`/volunteer/courses/${id}`);
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update course');
      }
    } catch (err) {
      console.error('Failed to update course:', err);
      alert(err.message || 'Failed to update course');
    } finally {
      setSubmitting(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7FB] dark:bg-background-dark flex items-center justify-center">
        <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FB] dark:bg-background-dark">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between p-4 max-w-md mx-auto">
          <button 
            onClick={() => navigate(-1)}
            className="size-10 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <span className="material-symbols-outlined text-gray-600 dark:text-gray-300">
              arrow_back_ios_new
            </span>
          </button>

          <h2 className="text-sm font-bold uppercase tracking-widest text-primary">
            Edit Course
          </h2>

          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-md mx-auto pb-32 px-4 py-6">
        <div className="space-y-6">
          
          {/* Course Title */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              Course Title *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., First Aid Basics"
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Description */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="What will volunteers learn from this course?"
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>

          {/* Course Cover Image */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              Cover Image
            </label>
            <input
              type="file"
              ref={imageInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            {imagePreview || form.image ? (
              <div className="relative">
                <div 
                  className="w-full h-40 rounded-xl bg-cover bg-center bg-gray-200"
                  style={{ backgroundImage: `url('${imagePreview || form.image}')` }}
                />
                {imageUploading && (
                  <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-white animate-spin text-3xl">progress_activity</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    setForm(prev => ({ ...prev, image: '' }));
                    if (imageInputRef.current) imageInputRef.current.value = '';
                  }}
                  className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="absolute bottom-2 right-2 px-3 py-1 bg-white/90 text-gray-700 rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                  Change
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={imageUploading}
                className="w-full h-40 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <span className="material-symbols-outlined text-3xl text-gray-400">add_photo_alternate</span>
                <span className="text-sm text-gray-500">Click to upload cover image</span>
                <span className="text-xs text-gray-400">PNG, JPG up to 5MB</span>
              </button>
            )}
          </div>

          {/* Category & Badge */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={form.category}
                onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="General">General</option>
                <option value="Health">Health</option>
                <option value="Education">Education</option>
                <option value="Environment">Environment</option>
                <option value="Social">Social</option>
                <option value="Leadership">Leadership</option>
                <option value="Technology">Technology</option>
              </select>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                Badge
              </label>
              <select
                value={form.badge}
                onChange={e => setForm(prev => ({ ...prev, badge: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="Course">Course</option>
                <option value="Workshop">Workshop</option>
                <option value="Training">Training</option>
                <option value="Certification">Certification</option>
                <option value="Tutorial">Tutorial</option>
              </select>
            </div>
          </div>

          {/* Duration */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
              Duration *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Hours</label>
                <div className="flex items-center">
                  <button
                    onClick={() => setForm(prev => ({ ...prev, durationHours: Math.max(0, prev.durationHours - 1) }))}
                    className="w-10 h-10 rounded-l-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-gray-500">remove</span>
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={form.durationHours}
                    onChange={e => setForm(prev => ({ ...prev, durationHours: Math.max(0, parseInt(e.target.value) || 0) }))}
                    className="flex-1 h-10 text-center border-y border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-lg font-bold focus:outline-none"
                  />
                  <button
                    onClick={() => setForm(prev => ({ ...prev, durationHours: prev.durationHours + 1 }))}
                    className="w-10 h-10 rounded-r-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-gray-500">add</span>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Minutes</label>
                <div className="flex items-center">
                  <button
                    onClick={() => setForm(prev => ({ ...prev, durationMinutes: Math.max(0, prev.durationMinutes - 5) }))}
                    className="w-10 h-10 rounded-l-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-gray-500">remove</span>
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={form.durationMinutes}
                    onChange={e => setForm(prev => ({ ...prev, durationMinutes: Math.min(59, Math.max(0, parseInt(e.target.value) || 0)) }))}
                    className="flex-1 h-10 text-center border-y border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-lg font-bold focus:outline-none"
                  />
                  <button
                    onClick={() => setForm(prev => ({ ...prev, durationMinutes: Math.min(59, prev.durationMinutes + 5) }))}
                    className="w-10 h-10 rounded-r-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-gray-500">add</span>
                  </button>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Total: {form.durationHours}h {form.durationMinutes}m
            </p>
          </div>

          {/* Lessons Count */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
              Number of Lessons *
            </label>
            <div className="flex items-center max-w-[200px]">
              <button
                onClick={() => setForm(prev => ({ ...prev, lessonsCount: Math.max(1, prev.lessonsCount - 1) }))}
                className="w-12 h-12 rounded-l-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-gray-500">remove</span>
              </button>
              <input
                type="number"
                min="1"
                value={form.lessonsCount}
                onChange={e => setForm(prev => ({ ...prev, lessonsCount: Math.max(1, parseInt(e.target.value) || 1) }))}
                className="w-full h-12 text-center border-y border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-lg font-bold focus:outline-none"
              />
              <button
                onClick={() => setForm(prev => ({ ...prev, lessonsCount: prev.lessonsCount + 1 }))}
                className="w-12 h-12 rounded-r-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-gray-500">add</span>
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">Minimum 1 lesson required</p>
          </div>

          {/* PowerPoint Upload */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
              Course Slides (PowerPoint/PDF)
            </label>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".ppt,.pptx,.pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/pdf"
              onChange={handleFileUpload}
              className="hidden"
            />

            {!uploadedFile && !uploading && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl flex flex-col items-center gap-2 hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl text-orange-500">upload_file</span>
                </div>
                <span className="text-sm font-bold text-gray-600 dark:text-gray-300">Click to upload</span>
                <span className="text-xs text-gray-400">PPT, PPTX, or PDF (max 50MB)</span>
              </button>
            )}

            {uploading && (
              <div className="py-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Uploading...</span>
                  <span className="text-sm font-bold text-primary">{uploadProgress}%</span>
                </div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">Please wait while your file is being uploaded...</p>
              </div>
            )}

            {uploadedFile && !uploading && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-2xl text-orange-500">slideshow</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 dark:text-white truncate">
                      {uploadedFile.name}
                    </p>
                    {uploadedFile.size > 0 && (
                      <p className="text-xs text-gray-500">{formatFileSize(uploadedFile.size)}</p>
                    )}
                    <div className="flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-green-500 text-sm">check_circle</span>
                      <span className="text-xs text-green-600 font-medium">Ready</span>
                    </div>
                  </div>
                  <button
                    onClick={removeFile}
                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  >
                    <span className="material-symbols-outlined text-red-500">delete</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Certificate Design */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
              Certificate Design
            </label>
            <p className="text-xs text-gray-500 mb-4">
              Choose a design for the certificate that will be awarded to students who complete your course.
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              {CERTIFICATE_DESIGNS.map((design) => (
                <button
                  key={design.id}
                  onClick={() => setForm(prev => ({ ...prev, certificateDesign: design.id }))}
                  className={`relative p-3 rounded-xl border-2 transition-all ${
                    form.certificateDesign === design.id
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className={`h-16 rounded-lg ${design.bgClass} border ${design.borderColor} flex items-center justify-center mb-2`}>
                    <span className={`material-symbols-outlined text-2xl ${design.accentColor}`}>
                      {design.icon}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-gray-600 dark:text-gray-300">{design.name}</p>
                  
                  {form.certificateDesign === design.id && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-xs">check</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Certificate Preview */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
              Certificate Preview
            </label>
            {(() => {
              const design = CERTIFICATE_DESIGNS.find(d => d.id === form.certificateDesign) || CERTIFICATE_DESIGNS[0];
              return (
                <div className={`${design.bgClass} ${design.textColor || 'text-gray-800'} p-6 rounded-xl border-4 ${design.borderColor} text-center`}>
                  <div className="flex justify-center mb-2">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md">
                      <span className="text-2xl font-black text-primary">U</span>
                    </div>
                  </div>
                  <p className="text-[8px] font-bold uppercase tracking-[0.15em] opacity-60">UYHO Organization</p>
                  
                  <span className={`material-symbols-outlined text-3xl ${design.accentColor} my-2`}>
                    {design.icon}
                  </span>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-70 mb-1">
                    Certificate of Completion
                  </p>
                  <p className="text-xs opacity-60 mb-2">This certifies that</p>
                  <p className="text-base font-extrabold mb-2">[Student Name]</p>
                  <p className="text-xs opacity-60 mb-1">has completed</p>
                  <p className="text-sm font-bold mb-3">{form.title || 'Course Title'}</p>
                  
                  <div className="flex justify-center mb-2">
                    <div className="text-center">
                      <p className="text-xs italic opacity-70">President Signature</p>
                      <div className="w-20 h-px bg-current opacity-30 mx-auto mt-1" />
                    </div>
                  </div>
                  
                  <p className="text-[8px] opacity-50">Certificate ID: UYHO-XXXX-XXXX</p>
                </div>
              );
            })()}
          </div>

        </div>
      </main>

      {/* Submit Button */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 z-40">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleSubmit}
            disabled={submitting || uploading || !form.title.trim()}
            className="w-full bg-primary text-white py-4 rounded-2xl font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
          >
            {submitting ? (
              <>
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
                Updating...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">save</span>
                Update Course
              </>
            )}
          </button>
        </div>
      </div>

      <VolunteerFooter />
    </div>
  );
}
