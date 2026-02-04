import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const AppContext = createContext(null);

// IndexedDB helper functions
const DB_NAME = 'uyho-db';
const DB_VERSION = 1;

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create stores for cached data
      if (!db.objectStoreNames.contains('cache')) {
        db.createObjectStore('cache', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('user')) {
        db.createObjectStore('user', { keyPath: 'id' });
      }
    };
  });
};

const cacheData = async (key, data, ttl = 5 * 60 * 1000) => {
  try {
    const db = await openDB();
    const tx = db.transaction('cache', 'readwrite');
    const store = tx.objectStore('cache');
    await store.put({ key, data, timestamp: Date.now(), ttl });
    db.close();
  } catch (error) {
    console.error('Failed to cache data:', error);
  }
};

const getCachedData = async (key) => {
  try {
    const db = await openDB();
    const tx = db.transaction('cache', 'readonly');
    const store = tx.objectStore('cache');
    const result = await new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    db.close();
    
    if (result) {
      const isExpired = Date.now() - result.timestamp > result.ttl;
      if (!isExpired) {
        return result.data;
      }
    }
    return null;
  } catch (error) {
    console.error('Failed to get cached data:', error);
    return null;
  }
};

export function AppProvider({ children }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineBar, setShowOfflineBar] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [orgSettings, setOrgSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  // Check authentication
  useEffect(() => {
    const volunteerId = localStorage.getItem('volunteerId');
    if (volunteerId) {
      setIsAuthenticated(true);
      fetchUser(volunteerId);
    }
    
    // Hide splash after delay
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineBar(false);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineBar(true);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered:', registration.scope);
        })
        .catch((error) => {
          console.error('SW registration failed:', error);
        });
    }
    
    // Check notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Fetch org settings
  useEffect(() => {
    fetchOrgSettings();
  }, []);

  const fetchUser = async (id) => {
    try {
      // Try cache first
      const cached = await getCachedData(`user-${id}`);
      if (cached) {
        setUser(cached);
      }
      
      const res = await fetch(`/api/volunteers/${id}`);
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        await cacheData(`user-${id}`, data, 10 * 60 * 1000);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrgSettings = async () => {
    try {
      // Try cache first
      const cached = await getCachedData('org-settings');
      if (cached) {
        setOrgSettings(cached);
      }
      
      const res = await fetch('/api/org-settings');
      if (res.ok) {
        const data = await res.json();
        setOrgSettings(data);
        await cacheData('org-settings', data, 30 * 60 * 1000);
      }
    } catch (error) {
      console.error('Failed to fetch org settings:', error);
    }
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support notifications');
      return false;
    }
    
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    return permission === 'granted';
  };

  const sendNotification = async (title, options = {}) => {
    if (notificationPermission !== 'granted') {
      const granted = await requestNotificationPermission();
      if (!granted) return;
    }
    
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      registration.showNotification(title, {
        icon: '/logo.jpg',
        badge: '/logo.jpg',
        vibrate: [200, 100, 200],
        ...options
      });
    }
  };

  const login = (userData) => {
    localStorage.setItem('volunteerId', userData.id);
    localStorage.setItem('volunteerName', userData.full_name);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('volunteerId');
    localStorage.removeItem('volunteerName');
    setUser(null);
    setIsAuthenticated(false);
  };

  // Cached fetch helper
  const cachedFetch = useCallback(async (url, options = {}) => {
    const cacheKey = `fetch-${url}`;
    const cacheTTL = options.cacheTTL || 5 * 60 * 1000;
    
    // Try cache first if offline or cache preferred
    if (!isOnline || options.cacheFirst) {
      const cached = await getCachedData(cacheKey);
      if (cached) return cached;
    }
    
    try {
      const res = await fetch(url, options);
      if (res.ok) {
        const data = await res.json();
        await cacheData(cacheKey, data, cacheTTL);
        return data;
      }
      throw new Error('Network response was not ok');
    } catch (error) {
      // Fallback to cache
      const cached = await getCachedData(cacheKey);
      if (cached) return cached;
      throw error;
    }
  }, [isOnline]);

  const value = {
    isOnline,
    showOfflineBar,
    setShowOfflineBar,
    notificationPermission,
    requestNotificationPermission,
    sendNotification,
    isAuthenticated,
    user,
    setUser,
    login,
    logout,
    orgSettings,
    isLoading,
    showSplash,
    cachedFetch,
    cacheData,
    getCachedData,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export default AppContext;
