import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import VolunteerFooter from '../../components/VolunteerFooter'

export default function CoursesPage() {
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [courses, setCourses] = useState([])
  const [myCourses, setMyCourses] = useState([])
  const [pendingCourses, setPendingCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [enrollingId, setEnrollingId] = useState(null)
  const [approvingId, setApprovingId] = useState(null)
  const navigate = useNavigate()
  const currentUserId = localStorage.getItem('volunteerId')

  useEffect(() => {
    fetchCourses()
  }, [currentUserId])

  const fetchCourses = async () => {
    setLoading(true)
    try {
      // Fetch all approved courses
      const res = await fetch(`/api/courses?status=approved${currentUserId ? `&userId=${currentUserId}` : ''}`)
      if (res.ok) {
        const data = await res.json()
        setCourses(data)
      }

      // Fetch courses where user is instructor
      if (currentUserId) {
        const myRes = await fetch(`/api/courses?instructorId=${currentUserId}`)
        if (myRes.ok) {
          const myData = await myRes.json()
          setMyCourses(myData)
        }
        
        // Fetch pending courses for admin approval
        const pendingRes = await fetch('/api/courses?status=pending')
        if (pendingRes.ok) {
          const pendingData = await pendingRes.json()
          setPendingCourses(pendingData)
        }
      }
    } catch (err) {
      console.error('Failed to fetch courses:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (courseId) => {
    setApprovingId(courseId)
    try {
      const res = await fetch(`/api/courses/${courseId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      })
      if (res.ok) {
        // Remove from pending and refresh courses
        setPendingCourses(prev => prev.filter(c => c.id !== courseId))
        fetchCourses()
      }
    } catch (err) {
      console.error('Failed to approve course:', err)
      alert('Failed to approve course')
    } finally {
      setApprovingId(null)
    }
  }

  const handleDecline = async (courseId) => {
    const reason = prompt('Please enter a reason for declining (optional):')
    setApprovingId(courseId)
    try {
      const res = await fetch(`/api/courses/${courseId}/decline`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      })
      if (res.ok) {
        setPendingCourses(prev => prev.filter(c => c.id !== courseId))
        fetchCourses()
      }
    } catch (err) {
      console.error('Failed to decline course:', err)
      alert('Failed to decline course')
    } finally {
      setApprovingId(null)
    }
  }

  const handleEnroll = async (courseId) => {
    if (!currentUserId) {
      navigate('/volunteer/login')
      return
    }
    
    setEnrollingId(courseId)
    try {
      const res = await fetch(`/api/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volunteerId: currentUserId })
      })
      if (res.ok) {
        setCourses(prev => prev.map(c =>
          c.id === courseId
            ? { ...c, is_enrolled: 1, enrolled_count: (c.enrolled_count || 0) + 1 }
            : c
        ))
      }
    } catch (err) {
      console.error('Failed to enroll:', err)
      alert('Failed to enroll in course')
    } finally {
      setEnrollingId(null)
    }
  }

  const filteredCourses = courses.filter(c =>
    !searchQuery ||
    c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.instructor_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const tabs = [
    { key: 'all', label: 'All Courses' },
    { key: 'requested', label: 'Requested' },
    { key: 'qna', label: 'Q&A' }
  ]

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col">
      <div className="max-w-md mx-auto w-full pb-24">
        {/* Header */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
            </button>
            <div className="flex-1">
              <p className="text-[10px] uppercase font-bold text-primary">Digital</p>
              <h1 className="text-xl font-bold">Courses</h1>
            </div>
            <button
              onClick={() => navigate('/volunteer/courses/create')}
              className="p-2 rounded-full bg-primary text-white"
            >
              <span className="material-symbols-outlined text-base">add</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 py-3">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 text-sm font-bold ${
                activeTab === tab.key
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
            <p className="text-slate-500 text-sm mt-2">Loading courses...</p>
          </div>
        ) : (
          <>
            {/* All Courses Tab */}
            {activeTab === 'all' && (
              <div className="px-4 py-4 space-y-4">
                {filteredCourses.length === 0 ? (
                  <div className="text-center py-12">
                    <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-700 block mb-2">school</span>
                    <p className="text-slate-500 text-sm">No courses available</p>
                  </div>
                ) : (
                  filteredCourses.map(course => (
                    <div
                      key={course.id}
                      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm relative"
                    >
                      {/* Edit Button for Instructor */}
                      {currentUserId && course.instructor_id?.toString() === currentUserId && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/volunteer/courses/${course.id}/edit`);
                          }}
                          className="absolute top-2 left-2 z-10 size-8 flex items-center justify-center bg-white dark:bg-gray-800 shadow-lg rounded-full border border-gray-100 dark:border-gray-700"
                        >
                          <span className="material-symbols-outlined text-sm text-gray-600 dark:text-gray-300">edit</span>
                        </button>
                      )}
                      {/* Status Badge */}
                      {course.has_passed === 1 && (
                        <div className="absolute top-2 right-2 z-10 bg-green-500 text-white px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 shadow-lg">
                          <span className="material-symbols-outlined text-xs">workspace_premium</span>
                          Certified
                        </div>
                      )}
                      {course.is_enrolled === 1 && course.has_passed !== 1 && course.user_progress >= 100 && (
                        <div className="absolute top-2 right-2 z-10 bg-amber-500 text-white px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 shadow-lg">
                          <span className="material-symbols-outlined text-xs">quiz</span>
                          Quiz Ready
                        </div>
                      )}
                      {course.is_enrolled === 1 && course.has_passed !== 1 && course.user_progress < 100 && (
                        <div className="absolute top-2 right-2 z-10 bg-primary text-white px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 shadow-lg">
                          <span className="material-symbols-outlined text-xs">play_circle</span>
                          In Progress
                        </div>
                      )}
                      <div
                        className="w-full h-36 bg-center bg-cover bg-gray-200 dark:bg-gray-700"
                        style={{ backgroundImage: course.image ? `url('${course.image}')` : 'none' }}
                      >
                        {!course.image && (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/40">
                            <span className="material-symbols-outlined text-5xl text-primary/50">school</span>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                            {course.badge || course.category || 'Course'}
                          </span>
                          {course.slide_file_name && (
                            <span className="bg-orange-100 text-orange-600 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">slideshow</span>
                              PPT
                            </span>
                          )}
                        </div>
                        <h4 className="font-extrabold text-[#0f181a] dark:text-white text-base mb-1">
                          {course.title}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                          {course.description || 'No description available'}
                        </p>
                        
                        {/* Progress Bar for Enrolled Users */}
                        {course.is_enrolled === 1 && (
                          <div className="mb-3">
                            <div className="flex items-center justify-between text-[10px] mb-1">
                              <span className="text-gray-500">Progress</span>
                              <span className="font-bold text-primary">{course.user_progress || 0}%</span>
                            </div>
                            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all ${
                                  course.has_passed === 1 ? 'bg-green-500' : 
                                  course.user_progress >= 100 ? 'bg-amber-500' : 'bg-primary'
                                }`}
                                style={{ width: `${course.user_progress || 0}%` }}
                              />
                            </div>
                          </div>
                        )}
                        
                        {/* Instructor */}
                        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100 dark:border-gray-700">
                          <img 
                            src={course.instructor_avatar || '/avatars/avatar_1.svg'} 
                            alt={course.instructor_name}
                            className="size-8 rounded-full object-cover"
                          />
                          <div>
                            <p className="text-xs font-bold text-gray-800 dark:text-white">{course.instructor_name}</p>
                            <p className="text-[10px] text-gray-500">{course.instructor_wing || 'Instructor'}</p>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 mb-3">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">schedule</span>
                            {course.duration_hours || 1} Hours
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">menu_book</span>
                            {course.lessons_count || 1} Lessons
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">grade</span>
                            {course.rating?.toFixed(1) || '0.0'}/5.0
                          </span>
                        </div>

                        {/* Enrolled */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex -space-x-2">
                              {course.enrolled_users && course.enrolled_users.length > 0 ? (
                                <>
                                  {course.enrolled_users.slice(0, 3).map((user, idx) => (
                                    <img 
                                      key={user.id || idx} 
                                      src={user.avatar || `/avatars/avatar_${(idx % 8) + 1}.svg`} 
                                      className="size-6 rounded-full border-2 border-white dark:border-gray-800 object-cover" 
                                      alt={user.full_name || 'Enrolled user'} 
                                    />
                                  ))}
                                  {course.enrolled_count > 3 && (
                                    <div className="size-6 rounded-full border-2 border-white dark:border-gray-800 bg-gray-100 dark:bg-gray-600 flex items-center justify-center">
                                      <span className="text-[9px] font-bold text-gray-500 dark:text-gray-300">+{course.enrolled_count - 3}</span>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <>
                                  <img src="/avatars/avatar_1.svg" className="size-6 rounded-full border-2 border-white dark:border-gray-800" alt="" />
                                  <img src="/avatars/avatar_2.svg" className="size-6 rounded-full border-2 border-white dark:border-gray-800" alt="" />
                                  <img src="/avatars/avatar_3.svg" className="size-6 rounded-full border-2 border-white dark:border-gray-800" alt="" />
                                </>
                              )}
                            </div>
                            <span className="ml-2 text-[11px] font-bold text-gray-500 dark:text-gray-400">
                              {course.enrolled_count || 0} enrolled
                            </span>
                          </div>
                          
                          {course.is_enrolled ? (
                            <button
                              onClick={() => navigate(`/volunteer/courses/${course.id}`)}
                              className={`px-4 py-2 rounded-lg text-xs font-bold ${
                                course.has_passed === 1 
                                  ? 'bg-green-500 text-white' 
                                  : 'bg-primary text-white'
                              }`}
                            >
                              {course.has_passed === 1 ? 'View Certificate' : 'Continue'}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleEnroll(course.id)}
                              disabled={enrollingId === course.id}
                              className="bg-primary text-white px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-50"
                            >
                              {enrollingId === course.id ? 'Enrolling...' : 'Enroll'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Requested Tab - My Course Requests & Pending Approvals */}
            {activeTab === 'requested' && (
              <div className="px-4 py-4 space-y-6">
                
                {/* Pending Courses for Approval (Admin Section) */}
                {pendingCourses.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-amber-500">pending_actions</span>
                      Pending Approval ({pendingCourses.length})
                    </h3>
                    <div className="space-y-3">
                      {pendingCourses.map(course => (
                        <div
                          key={course.id}
                          className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-4"
                        >
                          <div className="flex items-start gap-3">
                            <div 
                              className="size-14 rounded-xl bg-cover bg-center bg-gray-200 dark:bg-gray-700 shrink-0"
                              style={{ backgroundImage: course.image ? `url('${course.image}')` : 'none' }}
                            >
                              {!course.image && (
                                <div className="w-full h-full flex items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/40">
                                  <span className="material-symbols-outlined text-xl text-primary/50">school</span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-gray-800 dark:text-white truncate">{course.title}</h4>
                              <p className="text-xs text-gray-500 mt-0.5">{course.category || 'General'} • {course.lessons_count || 1} lessons</p>
                              <div className="flex items-center gap-2 mt-1">
                                <img 
                                  src={course.instructor_avatar || '/avatars/avatar_1.svg'} 
                                  alt="" 
                                  className="size-5 rounded-full"
                                />
                                <span className="text-xs text-gray-500">by {course.instructor_name}</span>
                              </div>
                              {course.slide_file_name && (
                                <div className="flex items-center gap-1 mt-1">
                                  <span className="material-symbols-outlined text-xs text-orange-500">slideshow</span>
                                  <span className="text-[10px] text-gray-500">{course.slide_file_name}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Approve/Decline Buttons */}
                          <div className="flex gap-2 mt-3 pt-3 border-t border-amber-200 dark:border-amber-800">
                            <button
                              onClick={() => handleApprove(course.id)}
                              disabled={approvingId === course.id}
                              className="flex-1 py-2 bg-green-500 text-white text-xs font-bold rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-1"
                            >
                              {approvingId === course.id ? (
                                <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                              ) : (
                                <>
                                  <span className="material-symbols-outlined text-sm">check</span>
                                  Approve
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleDecline(course.id)}
                              disabled={approvingId === course.id}
                              className="flex-1 py-2 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-1"
                            >
                              <span className="material-symbols-outlined text-sm">close</span>
                              Decline
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* My Created Courses */}
                <div>
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">library_books</span>
                    My Courses ({myCourses.length})
                  </h3>
                  {myCourses.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                      <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-700 block mb-2">library_add</span>
                      <p className="text-slate-500 text-sm">You haven't created any courses yet</p>
                      <button
                        onClick={() => navigate('/volunteer/courses/create')}
                        className="mt-3 px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg"
                      >
                        Create Your First Course
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {myCourses.map(course => (
                        <div
                          key={course.id}
                          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4"
                        >
                          <div className="flex items-start gap-3">
                            <div 
                              className="size-14 rounded-xl bg-cover bg-center bg-gray-200 dark:bg-gray-700 shrink-0"
                              style={{ backgroundImage: course.image ? `url('${course.image}')` : 'none' }}
                            >
                              {!course.image && (
                                <div className="w-full h-full flex items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/40">
                                  <span className="material-symbols-outlined text-xl text-primary/50">school</span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-gray-800 dark:text-white truncate">{course.title}</h4>
                              <p className="text-xs text-gray-500 mt-0.5">{course.category || 'General'} • {course.lessons_count || 1} lessons</p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  course.approval_status === 'approved' 
                                    ? 'bg-green-100 text-green-600' 
                                    : course.approval_status === 'declined'
                                      ? 'bg-red-100 text-red-600'
                                      : 'bg-yellow-100 text-yellow-600'
                                }`}>
                                  {course.approval_status === 'approved' ? 'Approved' : 
                                   course.approval_status === 'declined' ? 'Declined' : 'Pending'}
                                </span>
                                {course.enrolled_count > 0 && (
                                  <span className="text-[10px] text-gray-500">{course.enrolled_count} enrolled</span>
                                )}
                              </div>
                              {course.decline_reason && (
                                <p className="text-xs text-red-500 mt-1">Reason: {course.decline_reason}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Q&A Tab */}
            {activeTab === 'qna' && (
              <div className="px-4 py-4">
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-700 block mb-2">forum</span>
                  <p className="text-slate-500 text-sm">Course Q&A coming soon</p>
                  <p className="text-slate-400 text-xs mt-2">Ask questions about courses you're enrolled in</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <VolunteerFooter />
    </div>
  )
}
