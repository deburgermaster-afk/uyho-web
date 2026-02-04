import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import VolunteerFooter from '../../components/VolunteerFooter';

export default function DirectAidViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const volunteerId = localStorage.getItem('visitorVolunteerId');
  const [aid, setAid] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [donations, setDonations] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('updates');
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [isTeamMember, setIsTeamMember] = useState(false);
  const [updateForm, setUpdateForm] = useState({ content: '', images: [] });
  const [uploadingUpdate, setUploadingUpdate] = useState(false);
  const imageInputRef = useRef(null);
  const [imagePreview, setImagePreview] = useState([]);
  const [copiedNumber, setCopiedNumber] = useState(null);
  
  const [donationForm, setDonationForm] = useState({
    donorName: '',
    isAnonymous: false,
    phoneNumber: '',
    amount: '',
    paymentMethod: '',
    transactionId: ''
  });

  const donationSuggestions = [500, 1000, 2000, 5000, 10000];
  
  // Payment numbers - you can update these
  const paymentNumbers = {
    bkash: '01712345678',
    nagad: '01812345678'
  };

  useEffect(() => {
    fetchAidDetails();
    fetchTeamMembers();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'updates') {
      fetchUpdates();
    } else if (activeTab === 'donations') {
      fetchDonations();
    }
  }, [activeTab, id]);

  useEffect(() => {
    if (volunteerId && teamMembers.length > 0) {
      const isMember = teamMembers.some(tm => tm.volunteer_id === parseInt(volunteerId));
      const isCreator = aid?.created_by === parseInt(volunteerId);
      setIsTeamMember(isMember || isCreator);
    }
  }, [teamMembers, volunteerId, aid]);

  const fetchAidDetails = async () => {
    try {
      const res = await fetch(`/api/direct-aids/${id}`);
      if (res.ok) {
        const data = await res.json();
        setAid(data);
      }
    } catch (err) {
      console.error('Failed to fetch aid details:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const res = await fetch(`/api/direct-aids/${id}/team`);
      if (res.ok) {
        const data = await res.json();
        setTeamMembers(data);
      }
    } catch (err) {
      console.error('Failed to fetch team members:', err);
    }
  };

  const fetchUpdates = async () => {
    try {
      const res = await fetch(`/api/direct-aids/${id}/updates`);
      if (res.ok) {
        const data = await res.json();
        setUpdates(data);
      }
    } catch (err) {
      console.error('Failed to fetch updates:', err);
    }
  };

  const fetchDonations = async () => {
    try {
      const res = await fetch(`/api/direct-aids/${id}/donations?status=approved`);
      if (res.ok) {
        const data = await res.json();
        setDonations(data);
      }
    } catch (err) {
      console.error('Failed to fetch donations:', err);
    }
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + imagePreview.length > 4) {
      alert('Maximum 4 images allowed');
      return;
    }
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(prev => [...prev, reader.result]);
        setUpdateForm(prev => ({ ...prev, images: [...prev.images, file] }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImagePreview(prev => prev.filter((_, i) => i !== index));
    setUpdateForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handlePostUpdate = async () => {
    if (!updateForm.content.trim() && updateForm.images.length === 0) {
      alert('Please add some content or images');
      return;
    }

    setUploadingUpdate(true);
    try {
      let imageUrls = [];
      for (const file of updateForm.images) {
        const formData = new FormData();
        formData.append('image', file);
        const imgRes = await fetch('/api/upload/post-image', {
          method: 'POST',
          body: formData
        });
        if (imgRes.ok) {
          const imgData = await imgRes.json();
          imageUrls.push(imgData.url);
        }
      }

      const res = await fetch(`/api/direct-aids/${id}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: updateForm.content,
          images: JSON.stringify(imageUrls),
          volunteerId: parseInt(volunteerId)
        })
      });

      if (res.ok) {
        setUpdateForm({ content: '', images: [] });
        setImagePreview([]);
        setShowUpdateModal(false);
        fetchUpdates();
      } else {
        throw new Error('Failed to post update');
      }
    } catch (err) {
      console.error('Failed to post update:', err);
      alert('Failed to post update. Please try again.');
    } finally {
      setUploadingUpdate(false);
    }
  };

  const handleDonationSubmit = async () => {
    if (!donationForm.amount || !donationForm.paymentMethod || !donationForm.transactionId) {
      alert('Please fill in all required fields');
      return;
    }

    if (!donationForm.isAnonymous && !donationForm.donorName.trim()) {
      alert('Please enter your name or choose anonymous donation');
      return;
    }

    try {
      const res = await fetch(`/api/direct-aids/${id}/donate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donorName: donationForm.isAnonymous ? 'Anonymous' : donationForm.donorName,
          phoneNumber: donationForm.phoneNumber,
          amount: parseFloat(donationForm.amount),
          paymentMethod: donationForm.paymentMethod,
          transactionId: donationForm.transactionId,
          isAnonymous: donationForm.isAnonymous
        })
      });

      if (res.ok) {
        alert('Thank you for your donation! It will be verified and added to the fund.');
        setShowDonationModal(false);
        setDonationForm({
          donorName: '',
          isAnonymous: false,
          phoneNumber: '',
          amount: '',
          paymentMethod: '',
          transactionId: ''
        });
        fetchAidDetails();
      } else {
        throw new Error('Failed to submit donation');
      }
    } catch (err) {
      console.error('Failed to submit donation:', err);
      alert('Failed to submit donation. Please try again.');
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedNumber(type);
      setTimeout(() => setCopiedNumber(null), 2000);
    });
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return `${Math.floor(diffInSeconds / 604800)}w ago`;
  };

  const getInitials = (name) => {
    if (!name) return 'DA';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>
    );
  }

  if (!aid) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col items-center justify-center">
        <span className="material-symbols-outlined text-6xl text-gray-300">error</span>
        <p className="text-gray-500 mt-4">Direct aid not found</p>
        <button onClick={() => navigate('/volunteer/donation')} className="mt-4 text-primary font-medium">
          Go back to donations
        </button>
      </div>
    );
  }

  const progress = Math.min(((aid.raised_amount || 0) / (aid.goal_amount || 1)) * 100, 100);
  const beneficiaryName = aid.beneficiary_name || 'Unknown Beneficiary';
  const beneficiaryInitials = getInitials(beneficiaryName);
  const hostMember = teamMembers.find(m => m.role?.trim() === 'host');
  const hostName = hostMember?.full_name || aid.host_name || 'Unknown Host';

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen flex flex-col font-display">
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between px-4 h-14 max-w-md mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center">
            <span className="material-symbols-outlined text-slate-700 dark:text-slate-200">
              arrow_back
            </span>
          </button>
          <h1 className="font-bold text-base">Direct Aid</h1>
          <div className="w-6" />
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-md mx-auto w-full bg-white dark:bg-slate-900 pb-20">

        {/* Banner */}
        <section className="relative">
          <div className="aspect-[16/9] w-full overflow-hidden">
            <img
              src={aid.image || "https://lh3.googleusercontent.com/aida-public/AB6AXuCjtIumnq97iHeGXDe1HpLlgTQSpPJ16CkdFroTMuzztK8r0p6L27wnsKEAnj8kRbtRZBbfZ2vkvCiCbwGzg7lB3BKsrzRaVmspwPZN2xtMC6RVqqaHJ4XZxnQ3pOeIh5dkfBf0v1B2RjDbS3HnGkQaqHF1D3Y2jq9qf9wUDa4Z4n-E9FbQnJ_3mf4ZSB-V4VNuxxZuGXnPi8cT0U5fn1kdd4wNXs9hZqsmcluQGVQzHJ1kmLGaV_2eDiykrO8Yb1-2k-jrLbp-UmF8"}
              alt="Campaign Banner"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5">
              <span className="inline-block px-2 py-0.5 bg-primary/20 text-white text-[10px] font-bold rounded uppercase mb-2 backdrop-blur-md border border-white/20 w-fit">
                Direct Aid
              </span>
              <h2 className="text-2xl font-extrabold text-white mb-1">
                {aid.title}
              </h2>
              <p className="text-xs text-white/70">Hosted by {hostName}</p>
            </div>
          </div>
        </section>

        {/* Beneficiary Info */}
        <section className="p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-br from-primary/5 to-purple-50 dark:from-primary/10 dark:to-purple-900/10">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-primary text-lg">person</span>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Beneficiary</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="size-16 rounded-2xl bg-primary flex items-center justify-center text-white font-bold text-2xl shadow-lg overflow-hidden">
              {aid.beneficiary_avatar ? (
                <img src={aid.beneficiary_avatar} alt={beneficiaryName} className="w-full h-full object-cover" />
              ) : (
                beneficiaryInitials
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-extrabold">{beneficiaryName}</h3>
              {aid.beneficiary_phone && (
                <p className="text-sm text-slate-500 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">call</span>
                  {aid.beneficiary_phone}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Funding */}
        <section className="p-5 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Raised
              </p>
              <p className="text-2xl font-extrabold">৳{(aid.raised_amount || 0).toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Goal
              </p>
              <p className="text-base font-bold text-slate-600 dark:text-slate-400">
                ৳{(aid.goal_amount || 0).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-500" 
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="text-xs font-bold text-primary text-center">
            {progress.toFixed(0)}% funded
          </p>

          <button 
            onClick={() => setShowDonationModal(true)}
            className="w-full mt-6 h-14 bg-primary text-white font-bold rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors"
          >
            <span className="material-symbols-outlined">
              volunteer_activism
            </span>
            Donate Now
          </button>
        </section>

        {/* About */}
        <section className="p-5 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary text-xl">
              info
            </span>
            <h3 className="font-extrabold text-lg">About This Cause</h3>
          </div>

          <div className="space-y-3">
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {aid.description}
            </p>
            {aid.life_history && (
              <p className="text-sm font-medium leading-relaxed text-slate-800 dark:text-slate-200">
                {aid.life_history}
              </p>
            )}
            {aid.bio && (
              <p className="text-sm italic text-slate-500 dark:text-slate-400">
                "{aid.bio}"
              </p>
            )}
          </div>
        </section>

        {/* Tabs */}
        <section>
          <div className="flex border-b border-slate-100 dark:border-slate-800">
            <button 
              onClick={() => setActiveTab('updates')}
              className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'updates' 
                  ? 'text-primary border-b-2 border-primary' 
                  : 'text-slate-400'
              }`}
            >
              <span className="material-symbols-outlined text-sm">update</span>
              Updates
            </button>
            <button 
              onClick={() => setActiveTab('donations')}
              className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'donations' 
                  ? 'text-primary border-b-2 border-primary' 
                  : 'text-slate-400'
              }`}
            >
              <span className="material-symbols-outlined text-sm">payments</span>
              Donations
            </button>
            <button 
              onClick={() => setActiveTab('team')}
              className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'team' 
                  ? 'text-primary border-b-2 border-primary' 
                  : 'text-slate-400'
              }`}
            >
              <span className="material-symbols-outlined text-sm">group</span>
              Team
            </button>
          </div>

          {/* Updates Tab */}
          {activeTab === 'updates' && (
            <div className="p-4 space-y-6 bg-slate-50 dark:bg-slate-900/50">
              {updates.length === 0 ? (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600">campaign</span>
                  <p className="text-slate-500 mt-2">No updates yet</p>
                  <p className="text-xs text-slate-400 mt-1">Updates about this cause will appear here</p>
                </div>
              ) : (
                updates.map((update, i) => {
                  let images = [];
                  try {
                    images = update.images ? JSON.parse(update.images) : [];
                  } catch (e) {
                    if (update.image) images = [update.image];
                  }
                  
                  return (
                    <div key={update.id} className="relative pl-10">
                      <div className="absolute left-0 top-0 size-8 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-bold">
                        {initials}
                      </div>

                      {i < updates.length - 1 && (
                        <div className="absolute left-4 top-10 bottom-0 w-[1px] bg-slate-200 dark:bg-slate-800 -mb-6" />
                      )}

                      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-xs font-bold">{beneficiaryName}</p>
                          <p className="text-[10px] text-slate-400">
                            {formatTimeAgo(update.created_at)}
                          </p>
                        </div>

                        <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                          {update.content}
                        </p>

                        {/* Images */}
                        {images.length > 0 && (
                          <div className={`mt-3 grid gap-2 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                            {images.map((img, idx) => (
                              <img 
                                key={idx}
                                src={img} 
                                alt={`Update ${idx + 1}`}
                                className="w-full aspect-square object-cover rounded-xl"
                              />
                            ))}
                          </div>
                        )}

                        <div className="mt-3 pt-3 border-t border-slate-50 dark:border-slate-700 flex gap-4">
                          <button className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-tighter hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-sm">favorite</span>
                            Support
                          </button>
                          <button className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-tighter hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-sm">share</span>
                            Share
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Donations Tab */}
          {activeTab === 'donations' && (
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50">
              {/* Summary */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/70 text-[10px] uppercase tracking-wider font-bold">Total Donors</p>
                    <p className="text-2xl font-extrabold">{donations.length}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/70 text-[10px] uppercase tracking-wider font-bold">Amount Raised</p>
                    <p className="text-2xl font-extrabold">৳{(aid.raised_amount || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {donations.length === 0 ? (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600">payments</span>
                  <p className="text-slate-500 mt-2">No donations yet</p>
                  <p className="text-xs text-slate-400 mt-1">Be the first to contribute!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {donations.map(donation => (
                    <div key={donation.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 flex items-center justify-center shrink-0">
                          {donation.is_anonymous ? (
                            <span className="material-symbols-outlined text-green-600 text-lg">person_off</span>
                          ) : (
                            <span className="material-symbols-outlined text-green-600 text-lg">volunteer_activism</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold">
                            {donation.is_anonymous ? 'Anonymous Donor' : donation.donor_name}
                          </p>
                          <p className="text-[10px] text-slate-400">{formatTimeAgo(donation.created_at)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-extrabold text-green-600">৳{donation.amount.toLocaleString()}</p>
                          <p className="text-[10px] text-slate-400 uppercase font-medium">{donation.payment_method}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Team Tab */}
          {activeTab === 'team' && (
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50">
              <div className="mb-4">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Campaign Team</p>
                <p className="text-xs text-slate-400">People managing this direct aid campaign</p>
              </div>

              {teamMembers.length === 0 ? (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600">group</span>
                  <p className="text-slate-500 mt-2">No team members</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {teamMembers.map(member => {
                    const role = member.role?.trim() || 'member';
                    return (
                    <div key={member.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4">
                      <div className="flex items-center gap-3">
                        <div className="size-12 rounded-full bg-gradient-to-br from-primary/20 to-purple-100 dark:from-primary/30 dark:to-purple-900/30 flex items-center justify-center shrink-0 overflow-hidden">
                          {member.photo || member.avatar ? (
                            <img src={member.photo || member.avatar} alt={member.full_name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-primary text-xl">person</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold">{member.full_name || `${member.fname || ''} ${member.lname || ''}`.trim() || 'Unknown'}</p>
                          <p className="text-[10px] text-slate-400 capitalize">{role}</p>
                        </div>
                        <div>
                          {role === 'host' && (
                            <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-full uppercase">
                              Host
                            </span>
                          )}
                          {role === 'moderator' && (
                            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 text-[10px] font-bold rounded-full uppercase">
                              Moderator
                            </span>
                          )}
                          {role === 'member' && (
                            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-500 text-[10px] font-bold rounded-full uppercase">
                              Member
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                  })}
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Floating Update Button - Only for team members */}
      {isTeamMember && (
        <button
          onClick={() => setShowUpdateModal(true)}
          className="fixed bottom-24 right-4 z-30 size-14 bg-primary hover:bg-primary/90 text-white rounded-full shadow-lg shadow-primary/30 flex items-center justify-center transition-all hover:scale-110"
        >
          <span className="material-symbols-outlined text-2xl">edit</span>
        </button>
      )}

      {/* Update Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={() => setShowUpdateModal(false)}>
          <div 
            className="bg-white dark:bg-slate-900 rounded-t-3xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white dark:bg-slate-900 px-4 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="font-bold text-lg">Post Update</h2>
              <button onClick={() => setShowUpdateModal(false)} className="p-1">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-4">
              {/* Post Header Preview */}
              <div className="flex items-center gap-3 mb-4">
                <div className="size-10 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">
                  {initials}
                </div>
                <div>
                  <p className="font-bold text-sm">{beneficiaryName}</p>
                  <p className="text-xs text-slate-500">Posting as moderator</p>
                </div>
              </div>

              {/* Content */}
              <textarea
                value={updateForm.content}
                onChange={(e) => setUpdateForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Share an update about this cause..."
                rows={4}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />

              {/* Image Preview */}
              {imagePreview.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {imagePreview.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden">
                      <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeImage(idx)}
                        className="absolute top-2 right-2 size-6 bg-black/50 rounded-full flex items-center justify-center text-white"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined">image</span>
                  <span className="text-sm font-medium">Add Photos</span>
                </button>
                <input
                  type="file"
                  ref={imageInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  multiple
                  className="hidden"
                />

                <button
                  onClick={handlePostUpdate}
                  disabled={uploadingUpdate || (!updateForm.content.trim() && imagePreview.length === 0)}
                  className="bg-primary hover:bg-primary/90 disabled:bg-slate-300 text-white font-bold px-6 py-2 rounded-xl transition-colors flex items-center gap-2"
                >
                  {uploadingUpdate ? (
                    <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                  ) : (
                    <span className="material-symbols-outlined text-sm">send</span>
                  )}
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Donation Modal */}
      {showDonationModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={() => setShowDonationModal(false)}>
          <div 
            className="bg-white dark:bg-slate-900 rounded-t-3xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white dark:bg-slate-900 px-4 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="font-bold text-lg">Donate</h2>
              <button onClick={() => setShowDonationModal(false)} className="p-1">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Target */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div className="size-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold">
                  {beneficiaryInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">{beneficiaryName}</p>
                  <p className="text-xs text-slate-500">৳{(aid.raised_amount || 0).toLocaleString()} of ৳{(aid.goal_amount || 0).toLocaleString()}</p>
                </div>
              </div>

              {/* Anonymous Toggle */}
              <button
                onClick={() => setDonationForm(prev => ({ ...prev, isAnonymous: !prev.isAnonymous }))}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors ${
                  donationForm.isAnonymous 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <span className="material-symbols-outlined text-sm">
                  {donationForm.isAnonymous ? 'check_box' : 'check_box_outline_blank'}
                </span>
                <span className="text-sm font-medium">Anonymous Donation</span>
              </button>

              {/* Donor Name */}
              {!donationForm.isAnonymous && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={donationForm.donorName}
                    onChange={(e) => setDonationForm(prev => ({ ...prev, donorName: e.target.value }))}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              )}

              {/* Phone */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={donationForm.phoneNumber}
                  onChange={(e) => setDonationForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  placeholder="01XXXXXXXXX"
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Amount *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">৳</span>
                  <input
                    type="number"
                    value={donationForm.amount}
                    onChange={(e) => setDonationForm(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0"
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50 text-xl font-bold"
                  />
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {donationSuggestions.map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setDonationForm(prev => ({ ...prev, amount: amt.toString() }))}
                      className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${
                        donationForm.amount === amt.toString()
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-slate-200 dark:border-slate-700 hover:border-primary'
                      }`}
                    >
                      ৳{amt.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Payment Method *</label>
                <div className="grid grid-cols-2 gap-3">
                  {/* bKash */}
                  <button
                    type="button"
                    onClick={() => setDonationForm(prev => ({ ...prev, paymentMethod: 'bkash' }))}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      donationForm.paymentMethod === 'bkash'
                        ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-pink-300'
                    }`}
                  >
                    <div className="w-12 h-12 bg-pink-500 rounded-xl mx-auto mb-2 flex items-center justify-center">
                      <span className="text-white text-xl font-bold">b</span>
                    </div>
                    <p className="text-sm font-bold text-center">bKash</p>
                  </button>

                  {/* Nagad */}
                  <button
                    type="button"
                    onClick={() => setDonationForm(prev => ({ ...prev, paymentMethod: 'nagad' }))}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      donationForm.paymentMethod === 'nagad'
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-orange-300'
                    }`}
                  >
                    <div className="w-12 h-12 bg-orange-500 rounded-xl mx-auto mb-2 flex items-center justify-center">
                      <span className="text-white text-xl font-bold">N</span>
                    </div>
                    <p className="text-sm font-bold text-center">Nagad</p>
                  </button>
                </div>
              </div>

              {/* Payment Number with Copy */}
              {donationForm.paymentMethod && (
                <div className={`p-4 rounded-2xl border-2 ${
                  donationForm.paymentMethod === 'bkash' 
                    ? 'border-pink-200 bg-pink-50 dark:bg-pink-900/20 dark:border-pink-800' 
                    : 'border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800'
                }`}>
                  <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${
                    donationForm.paymentMethod === 'bkash' ? 'text-pink-600' : 'text-orange-600'
                  }`}>
                    {donationForm.paymentMethod === 'bkash' ? 'bKash' : 'Nagad'} Number
                  </p>
                  <div className="flex items-center justify-between">
                    <p className={`text-2xl font-extrabold ${
                      donationForm.paymentMethod === 'bkash' ? 'text-pink-600' : 'text-orange-600'
                    }`}>
                      {paymentNumbers[donationForm.paymentMethod]}
                    </p>
                    <button
                      onClick={() => copyToClipboard(paymentNumbers[donationForm.paymentMethod], donationForm.paymentMethod)}
                      className={`flex items-center gap-1 px-3 py-2 rounded-xl font-bold text-sm transition-colors ${
                        copiedNumber === donationForm.paymentMethod
                          ? 'bg-green-500 text-white'
                          : donationForm.paymentMethod === 'bkash' 
                            ? 'bg-pink-500 text-white hover:bg-pink-600' 
                            : 'bg-orange-500 text-white hover:bg-orange-600'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">
                        {copiedNumber === donationForm.paymentMethod ? 'check' : 'content_copy'}
                      </span>
                      {copiedNumber === donationForm.paymentMethod ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <p className={`text-xs mt-3 ${
                    donationForm.paymentMethod === 'bkash' ? 'text-pink-600/70' : 'text-orange-600/70'
                  }`}>
                    Send money to this number and enter the transaction ID below
                  </p>
                </div>
              )}

              {/* Transaction ID */}
              {donationForm.paymentMethod && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Transaction ID *</label>
                  <input
                    type="text"
                    value={donationForm.transactionId}
                    onChange={(e) => setDonationForm(prev => ({ ...prev, transactionId: e.target.value }))}
                    placeholder="Enter transaction ID"
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleDonationSubmit}
                disabled={!donationForm.amount || !donationForm.paymentMethod || !donationForm.transactionId}
                className="w-full h-14 bg-primary hover:bg-primary/90 disabled:bg-slate-300 disabled:text-slate-500 text-white font-bold rounded-2xl transition-colors flex items-center justify-center gap-3 shadow-lg shadow-primary/20"
              >
                <span className="material-symbols-outlined">volunteer_activism</span>
                Donate ৳{donationForm.amount ? parseInt(donationForm.amount).toLocaleString() : 0}
              </button>
            </div>
          </div>
        </div>
      )}

      <VolunteerFooter />
    </div>
  );
}
