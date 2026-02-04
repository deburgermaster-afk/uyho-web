import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Donate() {
  const navigate = useNavigate()
  const [campaigns, setCampaigns] = useState([])
  const [selectedCampaign, setSelectedCampaign] = useState('')
  const [donorName, setDonorName] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [amount, setAmount] = useState(500)
  const [paymentMethod, setPaymentMethod] = useState('')
  const [trxId, setTrxId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    try {
      console.log('Fetching campaigns...')
      const res = await fetch('/api/campaigns?status=active')
      console.log('Response status:', res.status)
      if (res.ok) {
        const data = await res.json()
        console.log('Fetched campaigns:', data)
        setCampaigns(data)
        if (data.length > 0) {
          setSelectedCampaign(data[0].id)
        }
      } else {
        console.error('Failed to fetch campaigns, status:', res.status)
      }
    } catch (err) {
      console.error('Failed to fetch campaigns:', err)
    }
  }

  const handleDonate = async (e) => {
    e.preventDefault()
    
    if (!selectedCampaign || !amount || !paymentMethod || !trxId) {
      alert('Please fill in all required fields')
      return
    }

    if (!isAnonymous && !donorName.trim()) {
      alert('Please enter your name or choose anonymous donation')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: selectedCampaign,
          donorName: isAnonymous ? 'Anonymous' : donorName,
          phoneNumber: phoneNumber,
          amount: parseFloat(amount),
          paymentMethod: paymentMethod,
          transactionId: trxId,
          isAnonymous: isAnonymous
        })
      })

      if (res.ok) {
        alert('Thank you for your donation! Your contribution has been submitted and will be reviewed by our team.')
        // Reset form
        setDonorName('')
        setPhoneNumber('')
        setAmount(500)
        setPaymentMethod('')
        setTrxId('')
        setIsAnonymous(false)
      } else {
        throw new Error('Failed to submit donation')
      }
    } catch (err) {
      console.error('Failed to submit donation:', err)
      alert('Failed to submit donation. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="max-w-md mx-auto pb-32">
      {/* Hero Image */}
      <div className="px-4 py-4">
        <div className="relative group overflow-hidden rounded-xl h-48 shadow-lg">
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" 
            style={{backgroundImage: 'linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, rgba(0,0,0,0) 50%), url("https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&h=400&fit=crop")'}}
          >
          </div>
          <div className="absolute bottom-0 left-0 p-4">
            <span className="inline-block px-2 py-0.5 bg-primary text-white text-[10px] font-bold uppercase tracking-widest rounded mb-1">
              Our Mission
            </span>
            <h1 className="text-white text-2xl font-bold leading-tight bn">আপনার দান জীবন বাঁচায়</h1>
            <p className="text-white/90 text-sm">Your Donation Saves Lives</p>
          </div>
        </div>
      </div>

      {/* Select Campaign */}
      <section className="mt-4">
        <div className="flex items-center justify-between px-4 pb-2">
          <h3 className="text-lg font-bold tracking-tight bn">ক্যাম্পেইন নির্বাচন করুন</h3>
          <span className="text-xs font-medium text-gray-400 uppercase">Choose Campaign</span>
        </div>
        <div className="px-4 py-2">
          {campaigns.length > 0 ? (
            <select
              value={selectedCampaign}
              onChange={(e) => setSelectedCampaign(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
            >
              <option value="">Select a campaign</option>
              {campaigns.map(campaign => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.title} ({campaign.wing})
                </option>
              ))}
            </select>
          ) : (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              <p>Loading campaigns...</p>
            </div>
          )}
        </div>
      </section>

      {/* Donor Information */}
      <section className="mt-6 px-4">
        <h3 className="text-lg font-bold tracking-tight mb-3">
          <span className="bn">দাতার তথ্য</span> | Donor Information
        </h3>
        
        {/* Anonymous Toggle */}
        <div className="flex items-center gap-3 mb-4">
          <button
            type="button"
            onClick={() => setIsAnonymous(!isAnonymous)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${
              isAnonymous 
                ? 'border-primary bg-primary/10 text-primary' 
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isAnonymous ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" : "M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"} />
            </svg>
            <span className="text-sm font-medium bn">নামহীন দান</span>
          </button>
        </div>

        {/* Name field */}
        {!isAnonymous && (
          <div className="mb-4">
            <input
              type="text"
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              placeholder="আপনার পূর্ণ নাম | Your Full Name"
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
              required={!isAnonymous}
            />
          </div>
        )}

        {/* Phone Number */}
        <div className="mb-4">
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="ফোন নম্বর (ঐচ্ছিক) | Phone Number (Optional)"
            className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
          />
        </div>
      </section>

      {/* Payment Method */}
      <section className="mt-6 px-4">
        <h3 className="text-lg font-bold tracking-tight mb-3">
          <span className="bn">পেমেন্ট পদ্ধতি</span> | Payment Method
        </h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <button
            type="button"
            onClick={() => setPaymentMethod('bkash')}
            className={`p-4 rounded-lg border-2 transition-all ${
              paymentMethod === 'bkash'
                ? 'border-primary bg-primary/10'
                : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
            }`}
          >
            <div className="bg-pink-500 w-12 h-12 rounded-lg mx-auto mb-3 flex items-center justify-center text-white font-bold text-lg">
              bK
            </div>
            <p className="text-sm font-medium">bKash</p>
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod('nagad')}
            className={`p-4 rounded-lg border-2 transition-all ${
              paymentMethod === 'nagad'
                ? 'border-primary bg-primary/10'
                : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
            }`}
          >
            <div className="bg-orange-500 w-12 h-12 rounded-lg mx-auto mb-3 flex items-center justify-center text-white font-bold text-lg">
              N
            </div>
            <p className="text-sm font-medium">Nagad</p>
          </button>
        </div>

        {/* Payment Instructions */}
        {paymentMethod && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
            <h4 className="font-bold text-sm text-blue-800 dark:text-blue-200 mb-2 bn">পেমেন্ট নির্দেশনা:</h4>
            <ol className="text-xs text-blue-700 dark:text-blue-300 space-y-2 bn">
              <li className="flex items-center justify-between">
                <span>1. {paymentMethod === 'bkash' ? 'bKash' : 'Nagad'} এ ৳{amount} পাঠান:</span>
              </li>
              <li className="flex items-center justify-between bg-white/50 dark:bg-gray-800/50 rounded p-2">
                <strong className="text-lg font-mono">01712345678</strong>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText('01712345678')
                    alert('Phone number copied!')
                  }}
                  className="ml-2 px-2 py-1 bg-primary text-white rounded text-xs hover:bg-primary/90 transition-colors"
                >
                  Copy
                </button>
              </li>
              <li>2. Personal পদ্ধতি ব্যবহার করুন</li>
              <li>3. Transaction ID কপি করুন</li>
              <li>4. নিচে Transaction ID দিন</li>
            </ol>
          </div>
        )}
      </section>

      {/* Amount Selection */}
      <section className="mt-6 px-4">
        <h3 className="text-lg font-bold tracking-tight mb-3">
          <span className="bn">পরিমাণ নির্বাচন করুন</span> | Select Amount
        </h3>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[100, 500, 1000, 2000, 5000, 10000].map((amt) => (
            <button
              key={amt}
              onClick={() => setAmount(amt)}
              className={`py-3 rounded-lg font-bold text-sm transition-all ${
                amount === amt 
                  ? 'bg-primary text-white shadow-lg' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              ৳{amt}
            </button>
          ))}
        </div>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">৳</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
            className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none text-lg font-bold"
            placeholder="Custom amount"
          />
        </div>
      </section>

      {/* Payment Instructions */}
      <section className="mt-8 px-4">
        <div className="bg-primary/5 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4 bn">সাধারণ নির্দেশনা</h3>
          <ol className="text-base text-gray-700 dark:text-gray-300 space-y-4 list-none leading-relaxed">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <span className="bn">ওপরে আপনার পছন্দের পেমেন্ট পদ্ধতি নির্বাচন করুন</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold">2</span>
              <span className="bn">পেমেন্ট সফল হলে প্রাপ্ত <span className="font-bold">Transaction ID</span> টি নিচের বক্সে দিন</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold">3</span>
              <span className="bn">সবশেষে 'দান করুন' বাটনে ক্লিক করে নিশ্চিত করুন</span>
            </li>
          </ol>
        </div>
      </section>

      {/* Transaction ID */}
      <section className="mt-8 px-4">
        <div className="flex items-center justify-between pb-2">
          <h3 className="text-lg font-bold tracking-tight bn">ট্রানজেকশন ভেরিফিকেশন</h3>
          <span className="text-xs font-medium text-gray-400 uppercase">Transaction ID</span>
        </div>
        <div className="py-2">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400">receipt_long</span>
            <input 
              className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none text-base font-mono uppercase placeholder:font-sans placeholder:normal-case" 
              placeholder="Enter TrxID (e.g. 8N7A6D5E)" 
              type="text"
              value={trxId}
              onChange={(e) => setTrxId(e.target.value)}
            />
          </div>
        </div>
      </section>

      <div className="mt-12 px-6 text-center pb-12">
        <p className="text-gray-500 dark:text-gray-400 text-[10px] leading-relaxed bn">
          আপনার দানের ১০০% সরাসরি শিক্ষা ও স্বাস্থ্য প্রকল্পে ব্যবহৃত হয়। 
          <br/>
          <span className="font-bold text-primary">UYHO</span> | Registration: Non-profit Org
        </p>
        <div className="flex items-center justify-center gap-4 mt-4 grayscale opacity-40">
          <span className="material-symbols-outlined text-sm">verified_user</span>
          <span className="material-symbols-outlined text-sm">lock</span>
          <span className="material-symbols-outlined text-sm">security</span>
        </div>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-t border-gray-100 dark:border-gray-800 flex justify-center z-[60]">
        <button 
          onClick={handleDonate}
          disabled={submitting || !selectedCampaign || !amount || !paymentMethod || !trxId || (!isAnonymous && !donorName.trim())}
          className="w-full max-w-md bg-primary text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary/30 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:shadow-none"
        >
          {submitting ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="bn">প্রক্রিয়াকরণ...</span>
            </>
          ) : (
            <>
              <span className="bn">এখনই দান করুন</span>
              <span className="material-symbols-outlined">favorite</span>
            </>
          )}
        </button>
      </div>
    </main>
  )
}
