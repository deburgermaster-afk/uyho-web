import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

export default function PublicDonatePage() {
  const { type, id } = useParams();
  const [searchParams] = useSearchParams();
  const referrerId = searchParams.get('ref');
  
  const [target, setTarget] = useState(null);
  const [referrer, setReferrer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [donationForm, setDonationForm] = useState({
    donorName: '',
    isAnonymous: false,
    phoneNumber: '',
    amount: '',
    paymentMethod: '',
    transactionId: ''
  });

  const donationSuggestions = [500, 1000, 2000, 5000, 10000];

  useEffect(() => {
    fetchData();
  }, [type, id, referrerId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch campaign or direct aid
      const endpoint = type === 'campaign' 
        ? `/api/public/campaign/${id}`
        : `/api/public/direct-aid/${id}`;
      
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        setTarget(data);
      }

      // Fetch referrer info
      if (referrerId) {
        const refRes = await fetch(`/api/public/referrer/${referrerId}`);
        if (refRes.ok) {
          const refData = await refRes.json();
          setReferrer(refData);
        }
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDonationSubmit = async () => {
    if (!target || !donationForm.amount || !donationForm.paymentMethod || !donationForm.transactionId) {
      alert('Please fill in all required fields');
      return;
    }

    if (!donationForm.isAnonymous && !donationForm.donorName.trim()) {
      alert('Please enter your name or choose anonymous donation');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/public/donate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: type === 'campaign' ? id : null,
          directAidId: type === 'directaid' ? id : null,
          donationType: type,
          donorName: donationForm.isAnonymous ? 'Anonymous' : donationForm.donorName,
          phoneNumber: donationForm.phoneNumber,
          amount: parseFloat(donationForm.amount),
          paymentMethod: donationForm.paymentMethod,
          transactionId: donationForm.transactionId,
          isAnonymous: donationForm.isAnonymous,
          referrerId: referrerId || null
        })
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        throw new Error('Failed to submit donation');
      }
    } catch (err) {
      alert('Failed to submit donation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl text-primary animate-spin">progress_activity</span>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!target) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-purple-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center shadow-xl max-w-md">
          <span className="material-symbols-outlined text-6xl text-red-400 mb-4">error</span>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Not Found</h1>
          <p className="text-slate-600">This {type === 'campaign' ? 'campaign' : 'direct aid'} is no longer available.</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center shadow-xl max-w-md">
          <div className="size-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-4xl text-green-600">check_circle</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Thank You!</h1>
          <p className="text-slate-600 mb-6">
            Your donation of ৳{donationForm.amount} has been recorded and will be verified soon.
          </p>
          {referrer && (
            <p className="text-sm text-slate-500">
              Referred by <span className="font-semibold">{referrer.full_name}</span>
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-purple-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <img src="/logo.png" alt="UYHO" className="size-10 rounded-full object-cover" />
          <div>
            <h1 className="font-bold text-slate-900">UYHO Donation</h1>
            <p className="text-xs text-slate-500">United Young Help Organization</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Referrer Badge */}
        {referrer && (
          <div className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm">
            <img 
              src={referrer.avatar || '/avatars/avatar_1.svg'} 
              alt={referrer.full_name}
              className="size-10 rounded-full object-cover"
            />
            <div className="flex-1">
              <p className="text-xs text-slate-500">Referred by</p>
              <p className="font-semibold text-slate-900">{referrer.full_name}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-primary font-bold uppercase">{referrer.position || 'Volunteer'}</p>
              <p className="text-xs text-slate-500">{referrer.wing}</p>
            </div>
          </div>
        )}

        {/* Campaign/Direct Aid Card */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
          {target.image && (
            <div className="h-48 bg-cover bg-center" style={{ backgroundImage: `url('${target.image}')` }}>
              <div className="h-full bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                <div>
                  <span className="text-xs font-bold bg-primary/90 text-white px-2 py-1 rounded-full">
                    {type === 'campaign' ? 'Campaign' : 'Direct Aid'}
                  </span>
                </div>
              </div>
            </div>
          )}
          <div className="p-4">
            <h2 className="text-xl font-bold text-slate-900 mb-2">{target.title}</h2>
            <p className="text-sm text-slate-600 line-clamp-2">{target.description}</p>
            
            {/* Progress */}
            {target.goal > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold text-primary">৳{(target.raised || 0).toLocaleString()}</span>
                  <span className="text-slate-500">of ৳{target.goal.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, ((target.raised || 0) / target.goal) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Donation Form */}
        <div className="bg-white rounded-2xl p-4 shadow-lg space-y-4">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">volunteer_activism</span>
            Make a Donation
          </h3>

          {/* Anonymous Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-500 text-lg">visibility_off</span>
              <span className="text-sm font-medium">Donate Anonymously</span>
            </div>
            <button
              onClick={() => setDonationForm(prev => ({ ...prev, isAnonymous: !prev.isAnonymous }))}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                donationForm.isAnonymous ? 'bg-primary' : 'bg-slate-200'
              }`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                donationForm.isAnonymous ? 'translate-x-7' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {/* Donor Name */}
          {!donationForm.isAnonymous && (
            <div>
              <label className="block text-sm font-medium mb-2">Your Name *</label>
              <input
                type="text"
                value={donationForm.donorName}
                onChange={(e) => setDonationForm(prev => ({ ...prev, donorName: e.target.value }))}
                placeholder="Enter your name"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          )}

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium mb-2">Phone Number (Optional)</label>
            <input
              type="tel"
              value={donationForm.phoneNumber}
              onChange={(e) => setDonationForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
              placeholder="01XXXXXXXXX"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium mb-2">Donation Amount *</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {donationSuggestions.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setDonationForm(prev => ({ ...prev, amount: String(amt) }))}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    donationForm.amount === String(amt)
                      ? 'bg-primary text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  ৳{amt.toLocaleString()}
                </button>
              ))}
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">৳</span>
              <input
                type="number"
                value={donationForm.amount}
                onChange={(e) => setDonationForm(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="Enter amount"
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium mb-2">Payment Method *</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setDonationForm(prev => ({ ...prev, paymentMethod: 'bkash' }))}
                className={`p-4 rounded-xl border-2 transition-all ${
                  donationForm.paymentMethod === 'bkash'
                    ? 'border-pink-500 bg-pink-50'
                    : 'border-slate-200 hover:border-pink-300'
                }`}
              >
                <div className="text-2xl mb-1">📱</div>
                <p className="font-bold text-pink-600">bKash</p>
              </button>
              <button
                onClick={() => setDonationForm(prev => ({ ...prev, paymentMethod: 'nagad' }))}
                className={`p-4 rounded-xl border-2 transition-all ${
                  donationForm.paymentMethod === 'nagad'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-slate-200 hover:border-orange-300'
                }`}
              >
                <div className="text-2xl mb-1">💳</div>
                <p className="font-bold text-orange-600">Nagad</p>
              </button>
            </div>
          </div>

          {/* Payment Instructions */}
          {donationForm.paymentMethod && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-blue-800">Send to:</p>
                <button
                  onClick={() => {
                    const number = donationForm.paymentMethod === 'bkash' ? '01XXXXXXXXX' : '01YYYYYYYYY';
                    navigator.clipboard.writeText(number);
                    alert('Number copied!');
                  }}
                  className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full"
                >
                  Copy
                </button>
              </div>
              <p className="text-xl font-bold text-blue-900">
                {donationForm.paymentMethod === 'bkash' ? '01XXXXXXXXX' : '01YYYYYYYYY'}
              </p>
              <ol className="text-xs text-blue-700 mt-3 space-y-1">
                <li>1. Send money to the above number</li>
                <li>2. Copy the Transaction ID from your payment</li>
                <li>3. Paste it below and click Donate</li>
              </ol>
            </div>
          )}

          {/* Transaction ID */}
          {donationForm.paymentMethod && (
            <div>
              <label className="block text-sm font-medium mb-2">Transaction ID *</label>
              <input
                type="text"
                value={donationForm.transactionId}
                onChange={(e) => setDonationForm(prev => ({ ...prev, transactionId: e.target.value }))}
                placeholder="Enter transaction ID"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleDonationSubmit}
            disabled={!donationForm.amount || !donationForm.paymentMethod || !donationForm.transactionId || submitting}
            className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-500 disabled:from-slate-300 disabled:to-slate-400 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
                Processing...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">favorite</span>
                Donate ৳{donationForm.amount || 0}
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-xs text-slate-500">
            Powered by <span className="font-semibold text-primary">UYHO</span> • United Young Help Organization
          </p>
        </div>
      </div>
    </div>
  );
}
