import { useState, useEffect } from 'react';
import VolunteerHeader from './VolunteerHeader';
import VolunteerFooter from './VolunteerFooter';
import GlobalSearch from './GlobalSearch';
import { Outlet } from 'react-router-dom';

export default function VolunteerLayout({ title }) {
  const [showSearch, setShowSearch] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950 flex flex-col">
      {/* Offline indicator */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-red-500 text-white py-2 px-4 flex items-center justify-center gap-2 text-sm font-medium animate-slide-down">
          <span className="material-symbols-outlined text-lg">wifi_off</span>
          <span>No Internet Connection</span>
        </div>
      )}
      <VolunteerHeader title={title} onSearchClick={() => setShowSearch(true)} />
      <main className={`flex-1 max-w-md mx-auto w-full pb-32 ${!isOnline ? 'mt-10' : ''}`}>
        <Outlet />
      </main>
      <VolunteerFooter />
      <GlobalSearch isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </div>
  );
}
