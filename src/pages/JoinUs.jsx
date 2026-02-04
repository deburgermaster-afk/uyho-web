import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function JoinUs() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    age: '',
    address: '',
    wing: '',
    availability: [],
    gender: '',
    bloodGroup: '',
    interestedBloodDonation: false
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    if (!formData.wing) {
      setError('Please select a wing')
      setLoading(false)
      return
    }

    if (formData.availability.length === 0) {
      setError('Please select at least one availability option')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/volunteers/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          age: parseInt(formData.age),
          address: formData.address,
          wing: formData.wing,
          availability: formData.availability,
          gender: formData.gender,
          bloodGroup: formData.bloodGroup,
          interestedBloodDonation: formData.interestedBloodDonation
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      setSuccess(`Registration successful! Your Volunteer ID: ${data.digitalId}`)
      // Clear form
      setFormData({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        age: '',
        address: '',
        wing: '',
        availability: [],
        gender: '',
        bloodGroup: '',
        interestedBloodDonation: false
      })

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/volunteer/login')
      }, 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAvailability = (option) => {
    if (formData.availability.includes(option)) {
      setFormData({
        ...formData,
        availability: formData.availability.filter(item => item !== option)
      })
    } else {
      setFormData({
        ...formData,
        availability: [...formData.availability, option]
      })
    }
  }

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden max-w-md mx-auto bg-white dark:bg-gray-900">
      <main className="flex-1 pb-10">
        {/* Hero Card */}
        <div className="p-4">
          <div className="flex flex-col items-stretch justify-start rounded-xl shadow-lg bg-primary text-white overflow-hidden">
            <div 
              className="w-full bg-center bg-no-repeat aspect-[16/7] bg-cover relative" 
              style={{backgroundImage: 'linear-gradient(rgba(46, 204, 113, 0.6), rgba(46, 204, 113, 0.9)), url("https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&h=400&fit=crop")'}}
            >
              <div className="absolute inset-0 flex items-center p-6">
                <h1 className="text-2xl font-extrabold leading-tight">Join Our Movement</h1>
              </div>
            </div>
            <div className="flex w-full flex-col items-stretch justify-center gap-4 p-5 bg-primary">
              <p className="text-white/90 text-sm font-medium leading-relaxed">
                <span className="inline-block px-2 py-0.5 rounded bg-white text-primary font-bold mr-1">80%</span> 
                of our campaigns offer honorarium or pay for volunteers in Bangladesh.
              </p>
              <div className="h-px bg-white/20"></div>
              <div className="flex items-center gap-2 text-white/80">
                <span className="material-symbols-outlined text-sm">verified</span>
                <span className="text-xs uppercase tracking-wider font-bold">Official Registration</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex w-full flex-row items-center justify-center gap-3 py-4">
          <div className="flex flex-col items-center gap-1">
            <div className="h-2.5 w-8 rounded-full bg-primary"></div>
            <span className="text-[10px] font-bold text-primary">PERSONAL</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="h-2.5 w-8 rounded-full bg-primary"></div>
            <span className="text-[10px] font-bold text-primary">CONTACT</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="h-2.5 w-8 rounded-full bg-primary"></div>
            <span className="text-[10px] font-bold text-primary">WINGS</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-4 mb-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-400 text-sm font-bold">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mx-4 mb-4 p-4 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-800 rounded-lg">
            <p className="text-green-700 dark:text-green-400 text-sm font-bold">{success}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-1 mx-4">
            <div className="px-4 pt-5 pb-2">
                <h2 className="text-gray-900 dark:text-white text-xl font-bold leading-tight tracking-[-0.015em]">
                  Personal Details
                </h2>
                <p className="text-gray-500 text-sm mt-1 bn">ব্যক্তিগত তথ্য</p>
              </div>

              <div className="flex flex-col gap-4 px-4 pb-5">
                <div>
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">
                    Full Name | <span className="bn">পুরো নাম</span>
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 focus:border-primary focus:ring-primary"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 focus:border-primary focus:ring-primary"
                    placeholder="your.email@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">
                    Phone Number | <span className="bn">ফোন নম্বর</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 focus:border-primary focus:ring-primary"
                    placeholder="+880 1XXX-XXXXXX"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">
                    Age | <span className="bn">বয়স</span>
                  </label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({...formData, age: e.target.value})}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 focus:border-primary focus:ring-primary"
                    placeholder="18+"
                    min="18"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">
                    Gender | <span className="bn">লিঙ্গ</span>
                  </label>
                  <div className="flex gap-3">
                    {['male', 'female'].map(g => (
                      <label key={g} className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border cursor-pointer transition-all ${
                        formData.gender === g 
                          ? 'bg-primary text-white border-primary' 
                          : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                      }`}>
                        <input
                          type="radio"
                          name="gender"
                          value={g}
                          checked={formData.gender === g}
                          onChange={() => setFormData({...formData, gender: g})}
                          className="sr-only"
                        />
                        <span className="material-symbols-outlined text-lg">
                          {g === 'male' ? 'male' : 'female'}
                        </span>
                        <span className="font-medium capitalize">{g}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">
                    Blood Group | <span className="bn">রক্তের গ্রুপ</span>
                  </label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({...formData, bloodGroup: e.target.value})}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 focus:border-primary focus:ring-primary"
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div className="p-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.interestedBloodDonation}
                      onChange={(e) => setFormData({...formData, interestedBloodDonation: e.target.checked})}
                      className="w-5 h-5 mt-0.5 text-red-600 rounded focus:ring-red-500"
                    />
                    <div>
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                        I am interested in Blood Donation 🩸
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <span className="bn">আমি রক্তদানে আগ্রহী</span> - You will receive emergency blood requests matching your blood group
                      </p>
                    </div>
                  </label>
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">
                    Password
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 px-3 py-2 focus:border-primary focus:ring-primary"
                    placeholder="Enter a strong password"
                    required
                  />
                  <p className="text-[10px] text-gray-500 mt-1">Min 6 characters</p>
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 px-3 py-2 focus:border-primary focus:ring-primary"
                    placeholder="Confirm your password"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Already have account? */}
            <div className="text-center mt-4 mb-4 px-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/volunteer/login')}
                  className="text-primary font-bold hover:underline"
                >
                  Login here
                </button>
              </p>
            </div>

            {/* Select Wing */}
            <div className="py-6 px-4">
            <p className="text-gray-900 dark:text-gray-100 text-sm font-bold pb-3">
              Select Wing | <span className="bn">বিভাগ নির্বাচন করুন</span>
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFormData({...formData, wing: 'education'})}
                className={`px-4 py-2 rounded-full border text-xs font-bold flex items-center gap-1 ${
                  formData.wing === 'education'
                    ? 'bg-primary text-white border-primary'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                <span className="material-symbols-outlined text-sm">school</span> Education
              </button>
              <button
                type="button"
                onClick={() => setFormData({...formData, wing: 'health'})}
                className={`px-4 py-2 rounded-full border text-xs font-bold flex items-center gap-1 ${
                  formData.wing === 'health'
                    ? 'bg-primary text-white border-primary'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                <span className="material-symbols-outlined text-sm">health_and_safety</span> Healthcare
              </button>
              <button
                type="button"
                onClick={() => setFormData({...formData, wing: 'relief'})}
                className={`px-4 py-2 rounded-full border text-xs font-bold flex items-center gap-1 ${
                  formData.wing === 'relief'
                    ? 'bg-primary text-white border-primary'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                <span className="material-symbols-outlined text-sm">emergency</span> Disaster Relief
              </button>
              <button
                type="button"
                onClick={() => setFormData({...formData, wing: 'media'})}
                className={`px-4 py-2 rounded-full border text-xs font-bold flex items-center gap-1 ${
                  formData.wing === 'media'
                    ? 'bg-primary text-white border-primary'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                <span className="material-symbols-outlined text-sm">laptop_mac</span> IT & Media
              </button>
            </div>
          </div>

          {/* Availability */}
          <div className="px-4 py-3 pb-8">
            <p className="text-gray-900 dark:text-gray-300 text-sm font-bold pb-3">
              Availability / <span className="bn">প্রাপ্যতা</span>
            </p>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30">
                <input
                  checked={formData.availability.includes('weekends')}
                  onChange={() => handleAvailability('weekends')}
                  className="form-checkbox rounded text-primary focus:ring-primary"
                  type="checkbox"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-bold">Weekends</span>
                  <span className="text-[10px] text-gray-400 bn">সপ্তাহান্তে</span>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30">
                <input
                  checked={formData.availability.includes('oncall')}
                  onChange={() => handleAvailability('oncall')}
                  className="form-checkbox rounded text-primary focus:ring-primary"
                  type="checkbox"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-bold">On-call</span>
                  <span className="text-[10px] text-gray-400 bn">প্রয়োজনে কল করলে</span>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30">
                <input
                  checked={formData.availability.includes('fulltime')}
                  onChange={() => handleAvailability('fulltime')}
                  className="form-checkbox rounded text-primary focus:ring-primary"
                  type="checkbox"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-bold">Full-time</span>
                  <span className="text-[10px] text-gray-400 bn">সার্বক্ষণিক</span>
                </div>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 sticky bottom-0 z-40">
            <button
              type="submit"
              disabled={loading}
              className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl h-14 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white gap-2 text-base font-bold leading-normal shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-transform"
            >
              {loading ? (
                <>
                  <span className="animate-spin material-symbols-outlined">progress_activity</span>
                  <span>Registering...</span>
                </>
              ) : (
                <span>Create Account & Join</span>
              )}
            </button>
            <p className="text-center text-[10px] text-gray-400 mt-3 px-6">
              By clicking submit, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </form>
      </main>
    </div>
  )
}
