
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import VolunteerFooter from '../../components/VolunteerFooter';

export default function EditProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const volunteerFromState = location.state?.volunteer;
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    id: '',
    full_name: '',
    email: '',
    phone: '',
    address: '',
    wing: '',
    education: '',
    avatar: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchVolunteerData();
  }, []);

  const fetchVolunteerData = async () => {
    try {
      const volunteerId = volunteerFromState?.id || localStorage.getItem('volunteerId');
      if (!volunteerId) {
        navigate('/volunteer/login');
        return;
      }

      const response = await fetch(`/api/volunteers/${volunteerId}`);
      if (!response.ok) throw new Error('Failed to fetch profile');

      const data = await response.json();
      setFormData({
        id: data.id,
        full_name: data.full_name || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        wing: data.wing || '',
        education: data.education || '',
        avatar: data.avatar || '',
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      setMessage({ type: 'error', text: 'Failed to load profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    const formDataUpload = new FormData();
    formDataUpload.append('avatar', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/volunteers/${formData.id}/avatar`);

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        setUploadProgress(percent);
      }
    });

    xhr.addEventListener('load', () => {
      setUploading(false);
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText);
          setFormData(prev => ({
            ...prev,
            avatar: `${response.avatar}?t=${Date.now()}`,
          }));
          setMessage({ type: 'success', text: 'Avatar uploaded successfully' });
        } catch (error) {
          console.error('Error parsing response:', error);
          setMessage({ type: 'error', text: 'Failed to process upload' });
        }
      } else {
        setMessage({ type: 'error', text: 'Failed to upload avatar' });
      }
    });

    xhr.addEventListener('error', () => {
      setUploading(false);
      setMessage({ type: 'error', text: 'Upload failed' });
    });

    xhr.send(formDataUpload);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const payload = {
        fullName: formData.full_name,
        phone: formData.phone,
        address: formData.address,
        wing: formData.wing,
        education: formData.education,
      };

      const response = await fetch(`/api/volunteers/${formData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to update profile');

      setMessage({ type: 'success', text: 'Profile updated successfully' });
      setTimeout(() => {
        navigate('/volunteer/profile');
      }, 1000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage({ type: 'error', text: 'Failed to save profile' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB]">
        <span className="material-symbols-outlined animate-spin text-4xl text-[#0B1B33]">
          progress_activity
        </span>
      </div>
    );
  }

  const initials = formData.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || 'V';

  return (
    <div className="min-h-screen bg-[#F5F7FB]">
      <main className="max-w-md mx-auto pb-32 pt-4">
        <h1 className="text-3xl font-bold text-[#0B1B33] text-center mb-8">Edit Profile</h1>

        <form onSubmit={handleSubmit} className="px-6 space-y-6">
          {/* Message Alert */}
          {message.text && (
            <div
              className={`px-4 py-3 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              <div className="w-28 h-28 rounded-full border-4 border-[#0B1B33] overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                {formData.avatar ? (
                  <img
                    src={formData.avatar}
                    alt={formData.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-4xl font-bold">{initials}</span>
                )}
              </div>

              {uploading && (
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full border-4 border-white border-t-transparent animate-spin mx-auto mb-2"></div>
                    <span className="text-white text-xs font-bold">{uploadProgress}%</span>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-[#0B1B33] font-semibold text-sm hover:text-blue-600 transition-colors"
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Change Photo'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
              disabled={uploading}
            />
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-bold text-[#0B1B33] mb-2">Full Name</label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B1B33]"
              required
            />
          </div>

          {/* Email (Read-only) */}
          <div>
            <label className="block text-sm font-bold text-[#0B1B33] mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              disabled
              className="w-full px-4 py-3 border border-[#E5E7EB] rounded-xl bg-gray-100 text-gray-600 cursor-not-allowed"
            />
            <p className="text-xs text-[#6B7280] mt-1">Email cannot be changed</p>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-bold text-[#0B1B33] mb-2">Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="+1 (555) 000-0000"
              className="w-full px-4 py-3 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B1B33]"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-bold text-[#0B1B33] mb-2">Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Street address"
              className="w-full px-4 py-3 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B1B33]"
            />
          </div>

          {/* Wing */}
          <div>
            <label className="block text-sm font-bold text-[#0B1B33] mb-2">Wing</label>
            <input
              type="text"
              name="wing"
              value={formData.wing}
              onChange={handleInputChange}
              placeholder="Your wing"
              className="w-full px-4 py-3 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B1B33]"
            />
          </div>

          {/* Education */}
          <div>
            <label className="block text-sm font-bold text-[#0B1B33] mb-2">Education</label>
            <input
              type="text"
              name="education"
              value={formData.education}
              onChange={handleInputChange}
              placeholder="e.g., Bachelor's in Engineering"
              className="w-full px-4 py-3 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B1B33]"
            />
          </div>

          {/* Hours Given */}
          

          {/* Buttons */}
          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={() => navigate('/volunteer/profile')}
              className="flex-1 px-4 py-3 border-2 border-[#0B1B33] text-[#0B1B33] font-bold rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="flex-1 px-4 py-3 bg-[#0B1B33] text-white font-bold rounded-xl hover:bg-[#1a2a4a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </main>
      <VolunteerFooter />
    </div>
  );
}
