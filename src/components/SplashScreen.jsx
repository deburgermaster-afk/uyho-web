import { useEffect, useState } from 'react';

export default function SplashScreen({ onComplete }) {
  const [fadeOut, setFadeOut] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 5;
      });
    }, 50);

    // Fade out and complete
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => {
        onComplete?.();
      }, 500);
    }, 1500);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(timer);
    };
  }, [onComplete]);

  return (
    <div 
      className={`fixed inset-0 z-[9999] bg-gradient-to-br from-slate-900 via-navy-900 to-blue-900 flex flex-col items-center justify-center transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        background: 'linear-gradient(135deg, #0a0f1a 0%, #0d1829 25%, #0f2744 50%, #102a4c 75%, #0d3a5c 100%)'
      }}
    >
      {/* Animated background circles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Logo */}
      <div className="relative z-10 mb-8 animate-bounce-slow">
        <div className="relative">
          <img 
            src="/logo.png" 
            alt="UYHO" 
            className="h-28 w-auto shadow-2xl shadow-primary/30"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent"></div>
        </div>
      </div>

      {/* Text */}
      <div className="relative z-10 text-center mb-8">
        <h1 className="text-3xl font-black text-white mb-2 tracking-tight">
          UYHO
        </h1>
        <p className="text-sm text-blue-200/70 font-medium tracking-widest uppercase">
          United Young Help Organization
        </p>
      </div>

      {/* Progress bar */}
      <div className="relative z-10 w-48">
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary via-cyan-400 to-blue-400 rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-xs text-blue-200/50 text-center mt-3">
          Loading experience...
        </p>
      </div>

      {/* Version */}
      <div className="absolute bottom-8 text-xs text-white/30">
        Version 2.0.0
      </div>
    </div>
  );
}
