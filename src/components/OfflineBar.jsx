import { useApp } from '../context/AppContext';

export default function OfflineBar() {
  const { showOfflineBar, setShowOfflineBar, isOnline } = useApp();

  if (!showOfflineBar || isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-red-500 text-white py-2 px-4 flex items-center justify-center gap-2 text-sm font-medium animate-slide-down">
      <span className="material-symbols-outlined text-lg">wifi_off</span>
      <span>No Internet Connection</span>
      <button 
        onClick={() => setShowOfflineBar(false)}
        className="ml-4 p-1 hover:bg-red-600 rounded-full transition-colors"
      >
        <span className="material-symbols-outlined text-sm">close</span>
      </button>
    </div>
  );
}
