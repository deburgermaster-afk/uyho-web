import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// VAPID public key for push notifications (replace with your actual key from server)
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

// Convert VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Subscribe to push notifications
async function subscribeToPush(registration) {
  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });
    
    // Send subscription to server
    const volunteerId = localStorage.getItem('volunteerId');
    if (volunteerId) {
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          volunteerId,
          subscription
        })
      });
      console.log('[PWA] Push subscription saved');
    }
    
    return subscription;
  } catch (error) {
    console.error('[PWA] Failed to subscribe to push:', error);
    return null;
  }
}

// Request notification permission
async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('[PWA] Notifications not supported');
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
}

// Export for use in components
window.requestNotificationPermission = requestNotificationPermission;
window.subscribeToPush = subscribeToPush;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(async (registration) => {
        console.log('[PWA] Service Worker registered:', registration.scope);
        
        // Store registration globally for push subscription
        window.swRegistration = registration;
        
        // Auto-subscribe to push if permission already granted
        if (Notification.permission === 'granted') {
          const existingSubscription = await registration.pushManager.getSubscription();
          if (!existingSubscription) {
            await subscribeToPush(registration);
          }
        }
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content available, show update notification
              if (confirm('New version available! Reload to update?')) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
              }
            }
          });
        });
      })
      .catch((error) => {
        console.log('[PWA] Service Worker registration failed:', error);
      });
  });
}

// Handle deep links / app links
function handleDeepLink(url) {
  const urlObj = new URL(url, window.location.origin);
  const path = urlObj.pathname;
  
  // Handle different deep link patterns
  if (path.includes('/campaigns/')) {
    const id = path.split('/campaigns/')[1];
    window.location.href = `/volunteer/campaigns/${id}`;
  } else if (path.includes('/wing/')) {
    const id = path.split('/wing/')[1];
    window.location.href = `/volunteer/wing/${id}`;
  } else if (path.includes('/donate/')) {
    window.location.href = path;
  } else if (path.includes('/profile/')) {
    const id = path.split('/profile/')[1];
    window.location.href = `/volunteer/profile/${id}`;
  }
}

// Listen for launch queue (PWA deep links)
if ('launchQueue' in window) {
  window.launchQueue.setConsumer((launchParams) => {
    if (launchParams.targetURL) {
      handleDeepLink(launchParams.targetURL);
    }
  });
}
