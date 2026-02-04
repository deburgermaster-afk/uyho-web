import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import VolunteerFooter from '../../components/VolunteerFooter';

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

export default function ValidateCertificatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const codeFromUrl = searchParams.get('code') || '';
  
  const [certificateCode, setCertificateCode] = useState(codeFromUrl);
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleValidate = async () => {
    if (!certificateCode.trim()) {
      setError('Please enter a certificate code');
      return;
    }

    setValidating(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch(`/api/certificates/validate/${certificateCode.trim()}`);
      const data = await res.json();

      if (res.ok && data.valid) {
        setResult(data.certificate);
      } else {
        setError(data.error || 'Invalid certificate code. Please check and try again.');
      }
    } catch (err) {
      console.error('Validation error:', err);
      setError('Failed to validate certificate. Please try again.');
    } finally {
      setValidating(false);
    }
  };

  const design = result ? (CERTIFICATE_DESIGNS.find(d => d.id === result.certificate_design) || CERTIFICATE_DESIGNS[0]) : null;

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
            Validate Certificate
          </h2>

          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-md mx-auto pb-32 px-4 py-6">
        <div className="space-y-6">
          
          {/* Header Info */}
          <div className="text-center py-6">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-4xl text-primary">verified</span>
            </div>
            <h1 className="text-xl font-extrabold dark:text-white mb-2">Certificate Verification</h1>
            <p className="text-sm text-gray-500">
              Enter the certificate code to verify its authenticity
            </p>
          </div>

          {/* Input Card */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
              Certificate Code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={certificateCode}
                onChange={e => setCertificateCode(e.target.value.toUpperCase())}
                placeholder="UYHO-XXXX-XXXX"
                className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm font-mono uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-primary/50"
                onKeyDown={e => e.key === 'Enter' && handleValidate()}
              />
              <button
                onClick={handleValidate}
                disabled={validating || !certificateCode.trim()}
                className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {validating ? (
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined">search</span>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Certificate codes are in the format: UYHO-XXXX-XXXX
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-red-500 text-xl">error</span>
                <div>
                  <p className="text-sm text-red-700 dark:text-red-300 font-medium">Validation Failed</p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Valid Certificate Result */}
          {result && (
            <div className="space-y-4">
              {/* Success Message */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-green-600 text-xl">verified</span>
                  </div>
                  <div>
                    <p className="text-sm text-green-700 dark:text-green-300 font-bold">Valid Certificate</p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                      This certificate is authentic and verified
                    </p>
                  </div>
                </div>
              </div>

              {/* Certificate Preview - Elegant Design */}
              <div 
                className="bg-gradient-to-b from-[#faf9f6] to-[#f5f3ef] text-gray-800 relative overflow-hidden aspect-[1.4/1]"
              >
                {/* Decorative Corner Ornaments */}
                <div className="absolute top-3 left-3 w-12 h-12 border-l-2 border-t-2 border-[#b8860b] opacity-60" />
                <div className="absolute top-3 right-3 w-12 h-12 border-r-2 border-t-2 border-[#b8860b] opacity-60" />
                <div className="absolute bottom-3 left-3 w-12 h-12 border-l-2 border-b-2 border-[#b8860b] opacity-60" />
                <div className="absolute bottom-3 right-3 w-12 h-12 border-r-2 border-b-2 border-[#b8860b] opacity-60" />
                
                {/* Inner decorative border */}
                <div className="absolute inset-4 border border-[#d4af37] opacity-30" />
                <div className="absolute inset-5 border border-[#d4af37] opacity-20" />
                
                <div className="relative z-10 p-6 h-full flex flex-col justify-between">
                  {/* Header with Logo */}
                  <div className="text-center">
                    <div className="flex justify-center mb-1">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow border border-[#d4af37]/30">
                        <span className="text-lg font-black text-[#b8860b]">U</span>
                      </div>
                    </div>
                    <p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-[#b8860b] mb-3">UYHO Organization</p>
                    
                    <h2 className="text-2xl font-serif text-gray-700 tracking-wide">Certificate</h2>
                    <p className="text-[10px] uppercase tracking-[0.25em] text-[#b8860b] mt-0.5">of Achievement</p>
                    
                    <p className="text-[9px] uppercase tracking-[0.15em] text-gray-500 mt-3">This certificate is proudly presented to</p>
                    
                    {/* Name in Script Font */}
                    <p className="text-2xl mt-2 mb-1 text-gray-800" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                      {result.volunteerName}
                    </p>
                    <div className="w-48 mx-auto border-b border-dotted border-gray-400 mb-3" />
                    
                    <p className="text-[9px] text-gray-500 leading-relaxed max-w-xs mx-auto">
                      For successfully completing the course <span className="font-semibold">"{result.courseTitle}"</span> and demonstrating 
                      exceptional commitment to learning with a score of {result.quizScore}%.
                    </p>
                  </div>
                  
                  {/* Issue Date */}
                  <p className="text-[8px] text-gray-400 text-center uppercase tracking-widest mt-2">
                    Issued Date: {new Date(result.issuedAt).toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()}
                  </p>
                  
                  {/* Signatures & Seal */}
                  <div className="flex items-end justify-between mt-2">
                    {/* Left Signature - President */}
                    <div className="text-center flex-1">
                      <div className="w-16 mx-auto">
                        <p className="text-[10px] italic text-gray-600 font-serif">Signature</p>
                        <div className="border-b border-gray-400 mt-3 mb-1" />
                        <p className="text-[8px] font-semibold uppercase tracking-wider text-gray-600">President</p>
                      </div>
                    </div>
                    
                    {/* Center Seal */}
                    <div className="flex-1 flex justify-center">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#d4af37] to-[#b8860b] flex items-center justify-center shadow-lg">
                          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#f5f3ef] to-[#e8e4dc] flex items-center justify-center">
                            <div className="text-center">
                              <span className="material-symbols-outlined text-[#b8860b] text-lg">workspace_premium</span>
                              <p className="text-[6px] font-bold text-[#b8860b] uppercase">Certified</p>
                            </div>
                          </div>
                        </div>
                        {/* Laurel wreath decoration */}
                        <div className="absolute -left-2 top-1/2 -translate-y-1/2 text-[#d4af37] opacity-60">
                          <span className="text-2xl">❧</span>
                        </div>
                        <div className="absolute -right-2 top-1/2 -translate-y-1/2 text-[#d4af37] opacity-60 transform scale-x-[-1]">
                          <span className="text-2xl">❧</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Right Signature - Instructor */}
                    <div className="text-center flex-1">
                      <div className="w-16 mx-auto">
                        <p className="text-[10px] italic text-gray-600 font-serif">Signature</p>
                        <div className="border-b border-gray-400 mt-3 mb-1" />
                        <p className="text-[8px] font-semibold uppercase tracking-wider text-gray-600">Instructor</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Certificate Code */}
                  <p className="text-[7px] text-center text-gray-400 mt-2 font-mono tracking-wider">
                    Certificate ID: {result.code}
                  </p>
                </div>
              </div>

              {/* Certificate Details */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                <h4 className="font-bold text-sm mb-4 dark:text-white">Certificate Details</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-xs text-gray-500">Recipient</span>
                    <span className="text-sm font-bold dark:text-white">{result.volunteerName}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-xs text-gray-500">Course</span>
                    <span className="text-sm font-bold dark:text-white">{result.courseTitle}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-xs text-gray-500">Quiz Score</span>
                    <span className="text-sm font-bold text-green-600">{result.quizScore}%</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-xs text-gray-500">Issue Date</span>
                    <span className="text-sm font-bold dark:text-white">
                      {new Date(result.issuedAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-xs text-gray-500">Certificate ID</span>
                    <span className="text-sm font-bold font-mono text-primary">{result.code}</span>
                  </div>
                </div>
              </div>

              {/* Instructor Info */}
              {result.instructorName && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                  <h4 className="font-bold text-sm mb-3 dark:text-white">Instructor</h4>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                      {result.instructorAvatar ? (
                        <img src={result.instructorAvatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-gray-400">person</span>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-sm dark:text-white">{result.instructorName}</p>
                      <p className="text-xs text-gray-500">Course Instructor</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Info Box */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
            <h4 className="font-bold text-sm mb-2 dark:text-white">About Certificate Verification</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              All UYHO certificates include a unique verification code that can be used to confirm 
              their authenticity. This ensures that certificates cannot be forged and maintains 
              the integrity of our volunteer training program.
            </p>
          </div>

        </div>
      </main>

      <VolunteerFooter />
    </div>
  );
}
