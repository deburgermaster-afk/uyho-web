import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import VolunteerFooter from '../../components/VolunteerFooter';
import JSZip from 'jszip';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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

// Generate unique certificate code in format UYHO/COA/YYYY/XXX
const generateCertificateCode = (volunteerId, courseId) => {
  const year = new Date().getFullYear();
  const random = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
  return `UYHO/COA/${year}/${random}`;
};

export default function CourseDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, syllabus, slides, qna
  const [expandedLessons, setExpandedLessons] = useState([]);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [progress, setProgress] = useState(0);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [showSlidesModal, setShowSlidesModal] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [hasPassed, setHasPassed] = useState(false);
  const [certificateCode, setCertificateCode] = useState('');
  const [ratings, setRatings] = useState([]);
  const [userRating, setUserRating] = useState(0);
  const [userReview, setUserReview] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(1);
  const [totalSlides, setTotalSlides] = useState(10); // Default, will be updated from course data
  const [slideImages, setSlideImages] = useState([]); // For PPT slide images
  const [loadingSlides, setLoadingSlides] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answerFeedback, setAnswerFeedback] = useState(null); // 'correct' or 'wrong'
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const certificateRef = useRef(null);
  
  const volunteerId = localStorage.getItem('volunteerId');
  const volunteerName = localStorage.getItem('volunteerName') || 'Volunteer';

  useEffect(() => {
    fetchCourse();
    fetchRatings();
  }, [id]);

  useEffect(() => {
    // Auto-save progress when completed lessons change
    if (isEnrolled && completedLessons.length > 0) {
      saveProgress();
    }
  }, [completedLessons]);

  // Save slide position when viewing slides
  useEffect(() => {
    if (isEnrolled && showSlidesModal && currentSlide > 1) {
      saveSlideProgress();
    }
  }, [currentSlide]);

  const fetchCourse = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/courses/${id}?userId=${volunteerId}`);
      if (res.ok) {
        const data = await res.json();
        setCourse(data);
        setIsEnrolled(data.is_enrolled === 1);
        setProgress(data.user_progress || 0);
        setHasPassed(data.has_passed === 1);
        setIsCompleted(data.is_completed === 1 || data.user_progress >= 100);
        setCertificateCode(data.certificate_code || '');
        setCurrentSlide(data.slide_position || 1);
        
        // Get actual slide count from file
        if (data.slide_file) {
          try {
            const slideInfoRes = await fetch(`/api/slides/info?file=${encodeURIComponent(data.slide_file)}`);
            if (slideInfoRes.ok) {
              const slideInfo = await slideInfoRes.json();
              setTotalSlides(slideInfo.slideCount || data.lessons_count || 10);
            } else {
              setTotalSlides(data.lessons_count || 10);
            }
          } catch (e) {
            setTotalSlides(data.lessons_count || 10);
          }
        } else {
          setTotalSlides(data.lessons_count || data.lessons?.length || 10);
        }
        
        // Load completed lessons from progress
        if (data.completed_lessons) {
          try {
            setCompletedLessons(JSON.parse(data.completed_lessons));
          } catch (e) {
            setCompletedLessons([]);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch course:', err);
    } finally {
      setLoading(false);
    }
  };
  const fetchRatings = async () => {
    try {
      const res = await fetch(`/api/courses/${id}/ratings${volunteerId ? `?userId=${volunteerId}` : ''}`);
      if (res.ok) {
        const data = await res.json();
        setRatings(data.ratings || []);
        if (data.userRating) {
          setUserRating(data.userRating.rating);
          setUserReview(data.userRating.review || '');
          setHasRated(true);
        }
      }
    } catch (err) {
      console.error('Failed to fetch ratings:', err);
    }
  };

  // Parse PPTX file and extract slide images
  const loadPptxSlides = async (pptxUrl) => {
    setLoadingSlides(true);
    try {
      const response = await fetch(pptxUrl);
      const arrayBuffer = await response.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);
      
      // Extract slide images from pptx (they are in ppt/media folder)
      const mediaFiles = [];
      const slideRels = [];
      
      // First, get slide relationships to find which images go to which slide
      for (let i = 1; i <= 50; i++) {
        const relsPath = `ppt/slides/_rels/slide${i}.xml.rels`;
        const relsFile = zip.file(relsPath);
        if (relsFile) {
          const relsContent = await relsFile.async('text');
          slideRels.push({ slideNum: i, rels: relsContent });
        } else {
          break;
        }
      }
      
      // Get total slides count
      const slideCount = slideRels.length || totalSlides;
      setTotalSlides(slideCount);
      
      // Try to extract embedded images
      const images = [];
      zip.folder('ppt/media')?.forEach((relativePath, file) => {
        if (relativePath.match(/\.(png|jpg|jpeg|gif|emf|wmf)$/i)) {
          mediaFiles.push({ path: relativePath, file });
        }
      });
      
      // Extract images and create object URLs
      for (const media of mediaFiles.slice(0, slideCount)) {
        try {
          const blob = await media.file.async('blob');
          const url = URL.createObjectURL(blob);
          images.push(url);
        } catch (e) {
          console.log('Could not extract image:', media.path);
        }
      }
      
      if (images.length > 0) {
        setSlideImages(images);
      } else {
        // If no images found, create placeholder slides
        setSlideImages(Array(slideCount).fill(null));
      }
    } catch (err) {
      console.error('Failed to load PPTX:', err);
      setSlideImages([]);
    } finally {
      setLoadingSlides(false);
    }
  };

  // Open slides modal and load PPT content
  const openSlidesViewer = () => {
    setShowSlidesModal(true);
    if (course?.slide_file && course.slide_file.match(/\.pptx?$/i) && slideImages.length === 0) {
      loadPptxSlides(course.slide_file);
    }
  };

  // Handle quiz answer selection with instant feedback
  const handleAnswerSelect = (answerIndex) => {
    if (answerFeedback) return; // Already answered
    
    setSelectedAnswer(answerIndex);
    const quizQuestions = course?.quiz_questions ? JSON.parse(course.quiz_questions) : getDefaultQuizQuestions();
    const currentQuestion = quizQuestions[currentQuestionIndex];
    
    if (answerIndex === currentQuestion.correct) {
      setAnswerFeedback('correct');
      setCorrectAnswers(prev => prev + 1);
      // Auto advance after 1 second
      setTimeout(() => {
        if (currentQuestionIndex < quizQuestions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
          setSelectedAnswer(null);
          setAnswerFeedback(null);
        } else {
          // Quiz complete
          const score = Math.round(((correctAnswers + 1) / quizQuestions.length) * 100);
          setQuizScore(score);
          setQuizSubmitted(true);
          if (score >= 70) {
            setHasPassed(true);
            const code = generateCertificateCode(volunteerId, id);
            setCertificateCode(code);
            saveCertification(score, code);
          }
        }
      }, 1000);
    } else {
      setAnswerFeedback('wrong');
      // Allow retry after 1 second
      setTimeout(() => {
        setSelectedAnswer(null);
        setAnswerFeedback(null);
      }, 1000);
    }
  };

  // Start quiz
  const startQuiz = () => {
    setShowQuizModal(true);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setAnswerFeedback(null);
    setCorrectAnswers(0);
    setQuizSubmitted(false);
    setQuizScore(0);
  };

  const handleEnroll = async () => {
    if (!volunteerId) {
      navigate('/volunteer/login');
      return;
    }
    
    setEnrolling(true);
    try {
      const res = await fetch(`/api/courses/${id}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volunteerId })
      });
      
      if (res.ok) {
        setIsEnrolled(true);
        fetchCourse();
      }
    } catch (err) {
      console.error('Failed to enroll:', err);
    } finally {
      setEnrolling(false);
    }
  };

  const saveProgress = async () => {
    if (!volunteerId || !isEnrolled) return;
    
    const totalLessons = course?.lessons?.length || course?.lessons_count || 1;
    const currentProgress = Math.round((completedLessons.length / totalLessons) * 100);
    
    try {
      await fetch(`/api/courses/${id}/progress`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          volunteerId, 
          progress: currentProgress,
          completedLessons: JSON.stringify(completedLessons)
        })
      });
      setProgress(currentProgress);
      if (currentProgress >= 100) {
        setIsCompleted(true);
      }
    } catch (err) {
      console.error('Failed to save progress:', err);
    }
  };

  const saveSlideProgress = async (slideNum, completed = false) => {
    if (!volunteerId || !isEnrolled) return;
    
    try {
      await fetch(`/api/courses/${id}/slide-progress`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          volunteerId, 
          currentSlide: slideNum || currentSlide,
          totalSlides,
          isCompleted: completed
        })
      });
      if (completed) {
        setIsCompleted(true);
      }
    } catch (err) {
      console.error('Failed to save slide progress:', err);
    }
  };

  const toggleLesson = (lessonId) => {
    setExpandedLessons(prev => 
      prev.includes(lessonId) 
        ? prev.filter(id => id !== lessonId)
        : [...prev, lessonId]
    );
  };

  const markLessonComplete = (lessonId) => {
    if (completedLessons.includes(lessonId)) {
      setCompletedLessons(prev => prev.filter(id => id !== lessonId));
    } else {
      setCompletedLessons(prev => [...prev, lessonId]);
    }
  };

  const handleShare = async (platform) => {
    const url = window.location.href;
    const text = `Check out this course: ${course?.title}`;
    
    switch (platform) {
      case 'copy':
        await navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
        break;
    }
    setShowShareModal(false);
  };

  const submitRating = async () => {
    if (!userRating || !volunteerId) return;
    
    setSubmittingRating(true);
    try {
      const res = await fetch(`/api/courses/${id}/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volunteerId, rating: userRating, review: userReview })
      });
      
      if (res.ok) {
        setHasRated(true);
        fetchRatings();
        fetchCourse(); // Refresh to get updated average rating
      }
    } catch (err) {
      console.error('Failed to submit rating:', err);
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleQuizSubmit = () => {
    // Calculate score based on answers
    const quizQuestions = course?.quiz_questions || getDefaultQuizQuestions();
    let correct = 0;
    
    quizQuestions.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correct) {
        correct++;
      }
    });
    
    const score = Math.round((correct / quizQuestions.length) * 100);
    setQuizScore(score);
    setQuizSubmitted(true);
    
    if (score >= 70) {
      setHasPassed(true);
      // Generate certificate code and save
      const code = generateCertificateCode(volunteerId, id);
      setCertificateCode(code);
      saveCertification(score, code);
    }
  };

  const saveCertification = async (score, code) => {
    try {
      const res = await fetch(`/api/courses/${id}/certificate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volunteerId, score, certificateCode: code })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.certificateCode) {
          setCertificateCode(data.certificateCode);
        }
      }
    } catch (err) {
      console.error('Failed to save certification:', err);
    }
  };

  const getDefaultQuizQuestions = () => [
    {
      question: "What is the first step in any emergency response?",
      options: ["Call for help", "Assess scene safety", "Start CPR", "Apply bandage"],
      correct: 1
    },
    {
      question: "What does CPR stand for?",
      options: ["Cardiac Pulse Recovery", "Cardiopulmonary Resuscitation", "Chest Pain Relief", "Critical Patient Response"],
      correct: 1
    },
    {
      question: "When should you use an AED?",
      options: ["For broken bones", "For cardiac arrest", "For burns", "For choking"],
      correct: 1
    },
    {
      question: "What is the compression rate for adult CPR?",
      options: ["60-80 per minute", "80-100 per minute", "100-120 per minute", "120-140 per minute"],
      correct: 2
    },
    {
      question: "How do you control severe bleeding?",
      options: ["Apply ice", "Apply direct pressure", "Elevate only", "Use a tourniquet first"],
      correct: 1
    }
  ];

  const downloadCertificate = async () => {
    // Generate PDF from certificate element
    const certificateElement = certificateRef.current;
    if (!certificateElement) return;

    try {
      // Show loading state
      const downloadBtn = document.querySelector('[data-download-btn]');
      if (downloadBtn) {
        downloadBtn.disabled = true;
        downloadBtn.innerHTML = '<span class="material-symbols-outlined animate-spin">progress_activity</span> Generating...';
      }

      // Capture the certificate as canvas - exact dimensions matching the element
      const canvas = await html2canvas(certificateElement, {
        scale: 3, // Higher quality for print
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      // Create PDF with exact pixel dimensions matching certificate (1123x794)
      // Convert pixels to mm (assuming 96 DPI): 1123px = 296.6mm, 794px = 210mm
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [1123, 794],
        hotfixes: ['px_scaling']
      });

      // Add the canvas as image to PDF - fill entire page
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      pdf.addImage(imgData, 'JPEG', 0, 0, 1123, 794, undefined, 'FAST');

      // Download the PDF
      pdf.save(`Certificate-${course?.title?.replace(/\s+/g, '-')}-${certificateCode}.pdf`);

      // Reset button
      if (downloadBtn) {
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = '<span class="material-symbols-outlined">download</span> Download PDF';
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const certificateDesign = CERTIFICATE_DESIGNS.find(d => d.id === (course?.certificate_design || 1)) || CERTIFICATE_DESIGNS[0];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7FB] dark:bg-background-dark flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-[#F5F7FB] dark:bg-background-dark flex flex-col items-center justify-center p-4">
        <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">error</span>
        <p className="text-slate-500 mb-4">Course not found</p>
        <button 
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-primary text-white rounded-lg"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="bg-background-light dark:bg-background-dark text-[#0f181a] dark:text-slate-100 min-h-screen flex flex-col font-display">
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md">
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
            Course Details
          </h2>

          <div className="flex items-center gap-2">
            {/* Edit button for instructor */}
            {volunteerId && course.instructor_id?.toString() === volunteerId && (
              <button 
                onClick={() => navigate(`/volunteer/courses/${id}/edit`)}
                className="size-10 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700"
              >
                <span className="material-symbols-outlined text-gray-600 dark:text-gray-300">
                  edit
                </span>
              </button>
            )}
            <button 
              onClick={() => setShowShareModal(true)}
              className="size-10 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700"
            >
              <span className="material-symbols-outlined text-gray-600 dark:text-gray-300">
                share
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-md mx-auto w-full pb-32">

        {/* Hero */}
        <div className="relative h-64 w-full">
          <div
            className="absolute inset-0 bg-center bg-cover bg-gradient-to-br from-primary/30 to-primary/60"
            style={{
              backgroundImage: course.image ? `url("${course.image}")` : undefined,
            }}
          >
            {!course.image && (
              <div className="w-full h-full flex items-center justify-center">
                <span className="material-symbols-outlined text-8xl text-white/50">school</span>
              </div>
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex items-center gap-2 mb-3">
              {course.badge && (
                <span className="inline-flex items-center gap-1 bg-primary text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[12px]">verified</span>
                  {course.badge}
                </span>
              )}
              {course.slide_file_name && (
                <span className="inline-flex items-center gap-1 bg-orange-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[12px]">slideshow</span>
                  PPT Available
                </span>
              )}
            </div>
            <h1 className="text-2xl font-extrabold text-white leading-tight">
              {course.title}
            </h1>
          </div>
        </div>

        {/* Progress Bar (if enrolled) */}
        {isEnrolled && (
          <div className="px-4 py-3 bg-primary/10 border-b border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-primary">Your Progress</span>
              <span className="text-xs font-bold text-primary">{progress}%</span>
            </div>
            <div className="h-2 bg-primary/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="flex justify-around py-6 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
          {[
            { icon: "schedule", label: `${course.duration_hours || 0} Hours` },
            { icon: "grade", label: `${(course.rating || 0).toFixed(1)} Rating` },
            { icon: "group", label: `${course.enrolled_count || 0} Enrolled` },
          ].map((item, i) => (
            <div key={i} className="text-center">
              <span className="block text-primary material-symbols-outlined">
                {item.icon}
              </span>
              <span className="block text-xs font-bold text-gray-500 dark:text-gray-400 mt-1 uppercase">
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          {[
            { key: 'overview', label: 'Overview', icon: 'info' },
            { key: 'syllabus', label: 'Content', icon: 'menu_book' },
            { key: 'ratings', label: 'Ratings', icon: 'star' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1 transition-colors ${
                activeTab === tab.key 
                  ? 'text-primary border-b-2 border-primary' 
                  : 'text-gray-400'
              }`}
            >
              <span className="material-symbols-outlined text-sm">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Description */}
              <section>
                <h3 className="text-lg font-extrabold mb-4 dark:text-white">
                  About This Course
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {course.description || 'No description available for this course.'}
                </p>
              </section>

              {/* What you will learn */}
              <section>
                <h3 className="text-lg font-extrabold mb-4 dark:text-white">
                  What you will learn
                </h3>
                <ul className="space-y-3">
                  {(course.learning_outcomes || [
                    "Understand the fundamental concepts and principles",
                    "Apply practical skills in real-world scenarios",
                    "Build confidence in handling emergency situations",
                    "Earn certification upon successful completion"
                  ]).map((text, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-primary text-xl">
                        check_circle
                      </span>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {text}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Instructor */}
              <section>
                <h3 className="text-lg font-extrabold mb-4 dark:text-white">
                  About the Instructor
                </h3>

                <div className="flex items-center gap-4 bg-teal-50 dark:bg-teal-900/10 p-4 rounded-2xl border border-teal-100/50 dark:border-teal-800/30">
                  <div
                    className="size-16 shrink-0 rounded-xl bg-center bg-cover bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden"
                  >
                    {course.instructor_avatar ? (
                      <img src={course.instructor_avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-3xl text-gray-400">person</span>
                    )}
                  </div>
                  <div>
                    <h5 className="text-base font-extrabold dark:text-white">
                      {course.instructor_name || 'Course Instructor'}
                    </h5>
                    <div className="flex items-center gap-2 mt-0.5">
                      {course.instructor_position && (
                        <span className="text-[10px] font-bold text-white bg-primary px-2 py-0.5 rounded-full">
                          {course.instructor_position}
                        </span>
                      )}
                      {course.instructor_wing && (
                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          {course.instructor_wing}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {course.instructor_bio || 'Experienced instructor dedicated to teaching valuable skills.'}
                    </p>
                  </div>
                </div>
              </section>

              {/* Enrolled Students */}
              {course.enrolled_users && course.enrolled_users.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-extrabold dark:text-white">
                      Enrolled Students
                    </h3>
                    <span className="text-xs text-gray-500">
                      {course.enrolled_count || 0} total
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-3">
                      {course.enrolled_users.slice(0, 5).map((user, idx) => (
                        <div 
                          key={user.id || idx} 
                          className="relative group"
                          onClick={() => navigate(`/volunteer/profile/${user.id}`)}
                        >
                          <img 
                            src={user.avatar || `/avatars/avatar_${(idx % 8) + 1}.svg`} 
                            className="size-10 rounded-full border-3 border-white dark:border-gray-800 object-cover cursor-pointer hover:ring-2 hover:ring-primary transition-all" 
                            alt={user.full_name || 'Enrolled user'} 
                          />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            {user.full_name || 'Volunteer'}
                          </div>
                        </div>
                      ))}
                    </div>
                    {course.enrolled_count > 5 && (
                      <div className="size-10 rounded-full border-3 border-white dark:border-gray-800 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-300">+{course.enrolled_count - 5}</span>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Certificate Preview */}
              <section>
                <h3 className="text-lg font-extrabold mb-4 dark:text-white">
                  Certificate
                </h3>
                <div className={`${certificateDesign.bgClass} ${certificateDesign.textColor || 'text-gray-800'} p-6 rounded-2xl border-4 ${certificateDesign.borderColor} text-center`}>
                  <span className={`material-symbols-outlined text-4xl ${certificateDesign.accentColor} mb-2`}>
                    {certificateDesign.icon}
                  </span>
                  <p className="text-xs font-bold uppercase tracking-wider opacity-70">Certificate of Completion</p>
                  <p className="font-extrabold text-lg mt-2">{course.title}</p>
                  <p className="text-xs mt-2 opacity-70">Complete the course & pass the quiz to earn this certificate</p>
                </div>
              </section>
            </>
          )}

          {/* Syllabus Tab */}
          {activeTab === 'syllabus' && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-extrabold dark:text-white">
                  Course Syllabus
                </h3>
                {isEnrolled && (
                  <span className="text-xs text-primary font-bold">
                    {completedLessons.length}/{course.lessons?.length || course.lessons_count || 0} completed
                  </span>
                )}
              </div>

              {(course.lessons && course.lessons.length > 0) ? (
                course.lessons.map((lesson, idx) => (
                  <div
                    key={lesson.id || idx}
                    className={`rounded-2xl mb-3 overflow-hidden border ${
                      completedLessons.includes(lesson.id || idx)
                        ? 'border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800'
                    }`}
                  >
                    <div 
                      className="p-4 flex items-center justify-between cursor-pointer"
                      onClick={() => toggleLesson(lesson.id || idx)}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-black w-7 h-7 flex items-center justify-center rounded-lg ${
                          completedLessons.includes(lesson.id || idx)
                            ? 'bg-green-500 text-white'
                            : 'bg-primary/10 text-primary'
                        }`}>
                          {completedLessons.includes(lesson.id || idx) ? (
                            <span className="material-symbols-outlined text-sm">check</span>
                          ) : (
                            String(idx + 1).padStart(2, '0')
                          )}
                        </span>
                        <div>
                          <p className="text-sm font-bold dark:text-white">
                            {lesson.title}
                          </p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">
                            {lesson.duration_minutes || 10} mins
                          </p>
                        </div>
                      </div>
                      <span className={`material-symbols-outlined text-gray-400 transition-transform ${
                        expandedLessons.includes(lesson.id || idx) ? 'rotate-180' : ''
                      }`}>
                        expand_more
                      </span>
                    </div>
                    
                    {expandedLessons.includes(lesson.id || idx) && (
                      <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700">
                        <p className="text-sm text-gray-600 dark:text-gray-300 py-3">
                          {lesson.content || 'Lesson content will be available when you start the course.'}
                        </p>
                        {isEnrolled && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markLessonComplete(lesson.id || idx);
                            }}
                            className={`w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 ${
                              completedLessons.includes(lesson.id || idx)
                                ? 'bg-green-500 text-white'
                                : 'bg-primary/10 text-primary'
                            }`}
                          >
                            <span className="material-symbols-outlined text-sm">
                              {completedLessons.includes(lesson.id || idx) ? 'check_circle' : 'circle'}
                            </span>
                            {completedLessons.includes(lesson.id || idx) ? 'Completed' : 'Mark as Complete'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                // Default syllabus if no lessons
                [
                  { title: "Introduction", duration: "15m" },
                  { title: "Core Concepts", duration: "30m" },
                  { title: "Practical Application", duration: "45m" },
                  { title: "Assessment & Review", duration: "20m" },
                ].map((lesson, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl flex items-center justify-between mb-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-primary bg-primary/10 w-7 h-7 flex items-center justify-center rounded-lg">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <div>
                        <p className="text-sm font-bold dark:text-white">{lesson.title}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">{lesson.duration}</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-gray-400">expand_more</span>
                  </div>
                ))
              )}

              {/* PPT Info - Course is viewed via slides */}
              {course.slide_file_name && (
                <div className="mt-6 p-4 bg-primary/5 rounded-2xl border border-primary/20">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-3xl text-primary">slideshow</span>
                    <div className="flex-1">
                      <p className="text-sm font-bold dark:text-white">Course Slides</p>
                      <p className="text-xs text-gray-500">{totalSlides} steps • {course.slide_file_name}</p>
                    </div>
                    {isEnrolled && (
                      <button 
                        onClick={openSlidesViewer}
                        className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">play_arrow</span>
                        {currentSlide > 1 ? 'Continue' : 'Start'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Ratings Tab */}
          {activeTab === 'ratings' && (
            <section>
              <h3 className="text-lg font-extrabold mb-4 dark:text-white">
                Course Ratings
              </h3>

              {/* Overall Rating */}
              <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 text-center">
                <div className="text-4xl font-extrabold text-primary mb-1">{(course.rating || 0).toFixed(1)}</div>
                <div className="flex items-center justify-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span 
                      key={star} 
                      className={`material-symbols-outlined text-xl ${
                        star <= Math.round(course.rating || 0) ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    >
                      star
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500">{course.rating_count || 0} reviews</p>
              </div>

              {/* Submit Rating */}
              {isEnrolled && !hasRated && (
                <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                  <p className="text-sm font-bold mb-3 dark:text-white">Rate this course</p>
                  <div className="flex items-center justify-center gap-2 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button 
                        key={star}
                        onClick={() => setUserRating(star)}
                        className="focus:outline-none transition-transform hover:scale-110"
                      >
                        <span 
                          className={`material-symbols-outlined text-3xl ${
                            star <= userRating ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                        >
                          star
                        </span>
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={userReview}
                    onChange={(e) => setUserReview(e.target.value)}
                    placeholder="Write a review (optional)..."
                    rows={3}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <button
                    onClick={submitRating}
                    disabled={!userRating || submittingRating}
                    className="mt-3 w-full py-2 bg-primary text-white text-xs font-bold rounded-lg disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    {submittingRating ? (
                      <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm">send</span>
                        Submit Rating
                      </>
                    )}
                  </button>
                </div>
              )}

              {hasRated && (
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-200 dark:border-green-800 text-center">
                  <span className="material-symbols-outlined text-green-500 text-2xl mb-1">check_circle</span>
                  <p className="text-sm font-bold text-green-600 dark:text-green-400">Thank you for your rating!</p>
                </div>
              )}

              {/* Ratings List */}
              {ratings.length === 0 ? (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">star</span>
                  <p className="text-sm text-gray-500">No reviews yet. Be the first to rate!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {ratings.map((r) => (
                    <div key={r.id} className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                      <div className="flex items-start gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                          {r.avatar ? (
                            <img src={r.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-sm text-gray-400">person</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold dark:text-white">{r.full_name || 'Anonymous'}</p>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span 
                                key={star} 
                                className={`material-symbols-outlined text-sm ${
                                  star <= r.rating ? 'text-yellow-400' : 'text-gray-300'
                                }`}
                              >
                                star
                              </span>
                            ))}
                            <span className="text-xs text-gray-400 ml-2">{new Date(r.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      {r.review && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{r.review}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

        </div>
      </main>

      {/* Action Button */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 z-40">
        <div className="max-w-md mx-auto flex gap-3">
          {!isEnrolled ? (
            <button 
              onClick={handleEnroll}
              disabled={enrolling}
              className="flex-1 bg-primary text-white font-extrabold py-4 rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {enrolling ? (
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
              ) : (
                <>
                  Enroll Now
                  <span className="material-symbols-outlined">arrow_forward</span>
                </>
              )}
            </button>
          ) : hasPassed ? (
            <button 
              onClick={() => setShowCertificateModal(true)}
              className="flex-1 bg-green-500 text-white font-extrabold py-4 rounded-2xl shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">workspace_premium</span>
              View Certificate
            </button>
          ) : isCompleted && !hasPassed ? (
            <button 
              onClick={() => {
                setQuizAnswers({});
                startQuiz();
              }}
              className="flex-1 bg-amber-500 text-white font-extrabold py-4 rounded-2xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">quiz</span>
              Take Quiz
            </button>
          ) : course?.slide_file ? (
            <button 
              onClick={openSlidesViewer}
              className="flex-1 bg-primary text-white font-extrabold py-4 rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">slideshow</span>
              {currentSlide > 1 ? `Continue from Step ${currentSlide}` : 'Start Course'}
            </button>
          ) : (
            <button 
              onClick={() => setActiveTab('syllabus')}
              className="flex-1 bg-primary text-white font-extrabold py-4 rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">play_arrow</span>
              Continue Learning
            </button>
          )}
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={() => setShowShareModal(false)}>
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-t-3xl p-6" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-6" />
            <h3 className="text-lg font-extrabold mb-6 dark:text-white text-center">Share this course</h3>
            
            <div className="grid grid-cols-5 gap-4 mb-6">
              {[
                { platform: 'copy', icon: 'content_copy', label: 'Copy', color: 'bg-gray-500' },
                { platform: 'whatsapp', icon: 'chat', label: 'WhatsApp', color: 'bg-green-500' },
                { platform: 'facebook', icon: 'thumb_up', label: 'Facebook', color: 'bg-blue-600' },
                { platform: 'twitter', icon: 'tag', label: 'Twitter', color: 'bg-sky-500' },
                { platform: 'linkedin', icon: 'work', label: 'LinkedIn', color: 'bg-blue-700' },
              ].map((item) => (
                <button
                  key={item.platform}
                  onClick={() => handleShare(item.platform)}
                  className="flex flex-col items-center gap-2"
                >
                  <div className={`w-12 h-12 ${item.color} text-white rounded-full flex items-center justify-center`}>
                    <span className="material-symbols-outlined">{item.icon}</span>
                  </div>
                  <span className="text-[10px] font-bold text-gray-500">{item.label}</span>
                </button>
              ))}
            </div>

            <button 
              onClick={() => setShowShareModal(false)}
              className="w-full py-3 text-sm font-bold text-gray-500 border border-gray-200 dark:border-gray-700 rounded-xl"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Quiz Modal - Interactive with Instant Retry */}
      {showQuizModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-900 p-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold dark:text-white">
                  {quizSubmitted ? 'Quiz Results' : 'Course Quiz'}
                </h3>
                <button 
                  onClick={() => setShowQuizModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-gray-500">close</span>
                </button>
              </div>
              
              {/* Progress indicator */}
              {!quizSubmitted && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-500">Question {currentQuestionIndex + 1} of {(course?.quiz_questions ? JSON.parse(course.quiz_questions) : getDefaultQuizQuestions()).length}</span>
                    <span className="text-green-500 font-bold">{correctAnswers} correct</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all"
                      style={{ width: `${((currentQuestionIndex) / (course?.quiz_questions ? JSON.parse(course.quiz_questions) : getDefaultQuizQuestions()).length) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4">
              {quizSubmitted ? (
                <div className="text-center py-8">
                  <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4 ${
                    quizScore >= 70 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
                  }`}>
                    <span className={`material-symbols-outlined text-5xl ${
                      quizScore >= 70 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {quizScore >= 70 ? 'emoji_events' : 'sentiment_dissatisfied'}
                    </span>
                  </div>
                  <h4 className="text-2xl font-extrabold mb-2 dark:text-white">{quizScore}%</h4>
                  <p className={`text-sm font-bold ${quizScore >= 70 ? 'text-green-500' : 'text-red-500'}`}>
                    {quizScore >= 70 ? 'Congratulations! You passed!' : 'Sorry, you need 70% to pass'}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    You got {correctAnswers} out of {(course?.quiz_questions ? JSON.parse(course.quiz_questions) : getDefaultQuizQuestions()).length} questions correct
                  </p>
                  
                  {quizScore >= 70 ? (
                    <button
                      onClick={() => {
                        setShowQuizModal(false);
                        setShowCertificateModal(true);
                      }}
                      className="mt-6 w-full py-3 bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined">workspace_premium</span>
                      View Certificate
                    </button>
                  ) : (
                    <button
                      onClick={startQuiz}
                      className="mt-6 w-full py-3 bg-primary text-white font-bold rounded-xl"
                    >
                      Try Again
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Current Question */}
                  {(() => {
                    const quizQuestions = course?.quiz_questions ? JSON.parse(course.quiz_questions) : getDefaultQuizQuestions();
                    const currentQuestion = quizQuestions[currentQuestionIndex];
                    return (
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <p className="text-lg font-bold mb-6 dark:text-white">
                          {currentQuestion.question}
                        </p>
                        <div className="space-y-3">
                          {currentQuestion.options.map((opt, optIdx) => (
                            <button
                              key={optIdx}
                              onClick={() => handleAnswerSelect(optIdx)}
                              disabled={answerFeedback !== null}
                              className={`w-full p-4 text-left text-sm rounded-xl border-2 transition-all ${
                                selectedAnswer === optIdx
                                  ? answerFeedback === 'correct'
                                    ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                    : answerFeedback === 'wrong'
                                    ? 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                    : 'border-primary bg-primary/10 text-primary'
                                  : answerFeedback !== null && optIdx === currentQuestion.correct
                                  ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-primary/50'
                              }`}
                            >
                              <span className="flex items-center gap-3">
                                <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold ${
                                  selectedAnswer === optIdx
                                    ? answerFeedback === 'correct'
                                      ? 'border-green-500 bg-green-500 text-white'
                                      : answerFeedback === 'wrong'
                                      ? 'border-red-500 bg-red-500 text-white'
                                      : 'border-primary bg-primary text-white'
                                    : 'border-gray-300 dark:border-gray-600'
                                }`}>
                                  {selectedAnswer === optIdx && answerFeedback === 'correct' ? (
                                    <span className="material-symbols-outlined text-sm">check</span>
                                  ) : selectedAnswer === optIdx && answerFeedback === 'wrong' ? (
                                    <span className="material-symbols-outlined text-sm">close</span>
                                  ) : (
                                    String.fromCharCode(65 + optIdx)
                                  )}
                                </span>
                                <span className="flex-1">{opt}</span>
                              </span>
                            </button>
                          ))}
                        </div>
                        
                        {/* Feedback Message */}
                        {answerFeedback && (
                          <div className={`mt-4 p-3 rounded-lg text-center ${
                            answerFeedback === 'correct' 
                              ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400' 
                              : 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400'
                          }`}>
                            {answerFeedback === 'correct' ? (
                              <span className="flex items-center justify-center gap-2 font-bold">
                                <span className="material-symbols-outlined">check_circle</span>
                                Correct! Moving to next question...
                              </span>
                            ) : (
                              <span className="flex items-center justify-center gap-2 font-bold">
                                <span className="material-symbols-outlined">error</span>
                                Wrong! Try again...
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  
                  <p className="text-xs text-gray-500 text-center mt-4">
                    💡 Select the correct answer to continue. Wrong answers let you retry instantly!
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Certificate Modal */}
      {showCertificateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 overflow-y-auto">
          <div className="w-full max-w-4xl bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-extrabold dark:text-white">Your Certificate</h3>
              <button 
                onClick={() => setShowCertificateModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-gray-500">close</span>
              </button>
            </div>

            <div className="p-4 overflow-x-auto">
              {/* Certificate Design - A4 Landscape - Matching Reference Design */}
              <div 
                ref={certificateRef}
                className="certificate-container mx-auto"
                style={{
                  width: '1123px',
                  height: '794px',
                  backgroundImage: `url('/certificatebg.png')`,
                  backgroundSize: '100% 100%',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  position: 'relative',
                  fontFamily: '"Times New Roman", Georgia, serif',
                  color: '#333',
                }}
              >
                {/* Main Title - Certificate of Achievement - Positioned below UYHO logo */}
                <div style={{
                  position: 'absolute',
                  top: '175px',
                  width: '100%',
                  textAlign: 'center',
                  fontSize: '42px',
                  fontWeight: '400',
                  color: '#3a3a3a',
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontStyle: 'italic',
                }}>
                  Certificate of Achievement
                </div>

                {/* Subtitle - THE FOLLOWING AWARD IS GIVEN TO */}
                <div style={{
                  position: 'absolute',
                  top: '230px',
                  width: '100%',
                  textAlign: 'center',
                  fontSize: '11px',
                  letterSpacing: '3px',
                  color: '#666',
                  textTransform: 'uppercase',
                  fontFamily: 'Arial, sans-serif',
                  fontWeight: '400',
                }}>
                  THE FOLLOWING AWARD IS GIVEN TO
                </div>

                {/* Recipient Name - Script/Cursive Font - Smaller with spacing */}
                <div style={{
                  position: 'absolute',
                  top: '255px',
                  width: '100%',
                  textAlign: 'center',
                  fontSize: '48px',
                  fontFamily: '"Brush Script MT", "Segoe Script", "Apple Chancery", cursive',
                  fontStyle: 'italic',
                  color: '#2a2a2a',
                  fontWeight: '400',
                  marginBottom: '15px',
                }}>
                  {volunteerName}
                </div>

                {/* Description Text - Paragraph style, cursive, more content, wider */}
                <div style={{
                  position: 'absolute',
                  top: '330px',
                  width: '100%',
                  textAlign: 'center',
                  fontSize: '14px',
                  lineHeight: '1.85',
                  color: '#444',
                  padding: '0 80px',
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontStyle: 'italic',
                }}>
                  For the successful completion of the course <strong style={{ fontWeight: '600', fontStyle: 'normal' }}>"{course?.title}"</strong> organized by UYHO – United Young Help Org.<br />
                  This certificate is proudly awarded in recognition of outstanding dedication, unwavering commitment, and exceptional performance.<br />
                  The recipient has made meaningful contributions towards community development, youth empowerment, and social welfare initiatives.<br />
                  Through active participation and continuous learning, they have demonstrated remarkable skills, profound knowledge, and genuine passion<br />
                  in serving the community, upholding the core values of UYHO, and inspiring others to make a positive difference in society.<br />
                  We commend their efforts and encourage them to continue their journey of growth and service to humanity.
                </div>

                {/* Bottom Section - Signatures and Seal */}
                <div style={{
                  position: 'absolute',
                  bottom: '95px',
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'flex-end',
                  padding: '0 120px',
                }}>
                  {/* Left - President Signature */}
                  <div style={{
                    flex: '1',
                    textAlign: 'center',
                    maxWidth: '280px',
                  }}>
                    {/* Signature Name */}
                    <div style={{
                      fontSize: '28px',
                      fontFamily: '"Brush Script MT", "Segoe Script", cursive',
                      color: '#333',
                      marginBottom: '5px',
                    }}>
                      Istiak Ahmed
                    </div>
                    {/* Signature Line */}
                    <div style={{
                      width: '150px',
                      borderTop: '1px solid #555',
                      margin: '0 auto 8px auto',
                    }} />
                    {/* Title - Actual Org Title */}
                    <div style={{
                      fontSize: '12px',
                      color: '#555',
                      fontFamily: 'Arial, sans-serif',
                    }}>
                      President
                    </div>
                  </div>

                  {/* Center - Seal/Badge */}
                  <div style={{
                    width: '90px',
                    height: '90px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 60px',
                  }}>
                    <svg viewBox="0 0 100 100" style={{ width: '80px', height: '80px' }}>
                      {/* Starburst seal */}
                      <polygon 
                        points="50,5 56,22 74,12 68,30 88,30 72,44 84,62 66,56 72,76 54,64 50,82 46,64 28,76 34,56 16,62 28,44 12,30 32,30 26,12 44,22" 
                        fill="#4a5568"
                      />
                      <circle cx="50" cy="43" r="16" fill="#4a5568" />
                    </svg>
                  </div>

                  {/* Right - Mentor Signature - Same size as President */}
                  <div style={{
                    flex: '1',
                    textAlign: 'center',
                    maxWidth: '280px',
                  }}>
                    {/* Signature Name */}
                    <div style={{
                      fontSize: '28px',
                      fontFamily: '"Brush Script MT", "Segoe Script", cursive',
                      color: '#333',
                      marginBottom: '5px',
                    }}>
                      {course?.instructor_name || 'Course Instructor'}
                    </div>
                    {/* Signature Line */}
                    <div style={{
                      width: '150px',
                      borderTop: '1px solid #555',
                      margin: '0 auto 8px auto',
                    }} />
                    {/* Title */}
                    <div style={{
                      fontSize: '12px',
                      color: '#555',
                      fontFamily: 'Arial, sans-serif',
                    }}>
                      Mentor
                    </div>
                  </div>
                </div>

                {/* Certificate ID - Inside the border area - Higher position */}
                <div style={{
                  position: 'absolute',
                  bottom: '65px',
                  width: '100%',
                  textAlign: 'center',
                  fontSize: '11px',
                  color: '#555',
                  fontFamily: 'Arial, sans-serif',
                  letterSpacing: '0.5px',
                }}>
                  Certificate ID: {certificateCode || 'UYHO/COA/2026/001'}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mb-3 mt-4">
                <button
                  data-download-btn
                  onClick={downloadCertificate}
                  className="flex-1 py-3 bg-primary text-white font-bold rounded-xl flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">download</span>
                  Download PDF
                </button>
                <button
                  onClick={() => handleShare('copy')}
                  className="py-3 px-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold rounded-xl flex items-center justify-center"
                >
                  <span className="material-symbols-outlined">share</span>
                </button>
              </div>
              
              {/* Verify Link */}
              <button
                onClick={() => navigate(`/volunteer/validate-certificate?code=${certificateCode}`)}
                className="w-full py-2 text-xs text-primary font-bold flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">verified</span>
                Verify Certificate Online
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slides Viewer Modal */}
      {showSlidesModal && course?.slide_file && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-black/80">
            <button 
              onClick={() => setShowSlidesModal(false)}
              className="text-white flex items-center gap-2"
            >
              <span className="material-symbols-outlined">close</span>
              <span className="text-sm font-bold">Close</span>
            </button>
            <div className="text-center">
              <p className="text-white text-sm font-bold">{course.title}</p>
              <p className="text-white/60 text-xs">Step {currentSlide} of {totalSlides}</p>
            </div>
            <div className="w-20" />
          </div>
          
          {/* Step Indicators */}
          <div className="px-4 py-2 bg-black/60">
            <div className="flex items-center justify-center gap-1 overflow-x-auto pb-2">
              {Array.from({ length: totalSlides }, (_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setCurrentSlide(i + 1);
                    saveSlideProgress(i + 1, false);
                  }}
                  className={`flex items-center justify-center min-w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                    currentSlide === i + 1
                      ? 'bg-primary text-white scale-110'
                      : i + 1 < currentSlide
                      ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                      : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {i + 1 < currentSlide ? (
                    <span className="material-symbols-outlined text-sm">check</span>
                  ) : (
                    i + 1
                  )}
                </button>
              ))}
            </div>
          </div>
          
          {/* Slides Viewer */}
          <div className="flex-1 flex flex-col overflow-hidden p-4">
            {loadingSlides ? (
              <div className="flex-1 flex items-center justify-center text-white">
                <div className="text-center">
                  <div className="animate-spin size-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-sm">Loading slides...</p>
                </div>
              </div>
            ) : course.slide_file.endsWith('.pdf') ? (
              <iframe 
                src={`${course.slide_file}#page=${currentSlide}`}
                className="flex-1 w-full rounded-lg bg-white"
                title="Course Slides"
              />
            ) : (
              // PPT Viewer - Try multiple methods
              <div className="flex-1 flex flex-col bg-white rounded-lg overflow-hidden">
                {/* Try embedded object first for direct browser viewing */}
                <object
                  data={course.slide_file}
                  type="application/vnd.openxmlformats-officedocument.presentationml.presentation"
                  className="flex-1 w-full"
                >
                  {/* Fallback to iframe with Google Docs viewer */}
                  <iframe 
                    src={`https://docs.google.com/gview?url=${encodeURIComponent(window.location.origin + course.slide_file)}&embedded=true`}
                    className="w-full h-full"
                    title="Course Slides"
                    frameBorder="0"
                  />
                </object>
                
                {/* Step indicator bar */}
                <div className="bg-gradient-to-r from-primary to-purple-600 text-white py-4 px-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 rounded-full w-12 h-12 flex items-center justify-center">
                      <span className="text-xl font-black">{currentSlide}</span>
                    </div>
                    <div>
                      <p className="font-bold text-lg">Step {currentSlide} of {totalSlides}</p>
                      <p className="text-white/70 text-xs">Navigate through slides in viewer above</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black">{Math.round((currentSlide / totalSlides) * 100)}%</p>
                    <p className="text-white/70 text-xs">Complete</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Navigation */}
          <div className="p-4 bg-black/80">
            {/* Progress Bar */}
            <div className="h-2 bg-gray-700 rounded-full mb-4 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-green-500 transition-all"
                style={{ width: `${(currentSlide / totalSlides) * 100}%` }}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  const newSlide = Math.max(1, currentSlide - 1);
                  setCurrentSlide(newSlide);
                  saveSlideProgress(newSlide, false);
                }}
                disabled={currentSlide === 1}
                className="px-4 py-3 bg-gray-800 text-white font-bold rounded-xl disabled:opacity-50 flex items-center gap-2"
              >
                <span className="material-symbols-outlined">arrow_back</span>
                <span className="hidden sm:inline">Previous</span>
              </button>
              
              <div className="text-center">
                <p className="text-white font-bold text-lg">{Math.round((currentSlide / totalSlides) * 100)}%</p>
                <p className="text-gray-400 text-xs">Progress</p>
              </div>
              
              <button
                onClick={() => {
                  if (currentSlide === totalSlides) {
                    // Mark as complete
                    setProgress(100);
                    setIsCompleted(true);
                    saveSlideProgress(currentSlide, true);
                    setShowSlidesModal(false);
                  } else {
                    const newSlide = Math.min(totalSlides, currentSlide + 1);
                    setCurrentSlide(newSlide);
                    saveSlideProgress(newSlide, false);
                  }
                }}
                className={`px-4 py-3 font-bold rounded-xl flex items-center gap-2 ${
                  currentSlide === totalSlides
                    ? 'bg-green-500 text-white'
                    : 'bg-primary text-white'
                }`}
              >
                <span className="hidden sm:inline">{currentSlide === totalSlides ? 'Complete' : 'Next'}</span>
                <span className="material-symbols-outlined">
                  {currentSlide === totalSlides ? 'check' : 'arrow_forward'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      <VolunteerFooter />
    </div>
  );
}

// Export certificate designs for use in course creation
export { CERTIFICATE_DESIGNS };
