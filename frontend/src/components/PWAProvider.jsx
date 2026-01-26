import React, { useEffect, useState, createContext, useContext } from 'react';

const PWAContext = createContext(null);

export const usePWA = () => {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
};

export const PWAProvider = ({ children }) => {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState(null);
  const [swRegistration, setSwRegistration] = useState(null);

  useEffect(() => {
    // Check if running as PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsInstalled(isStandalone);

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker registered:', registration);
          setSwRegistration(registration);

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker?.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
                setPendingUpdate(newWorker);
              }
            });
          });

          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60000);
        })
        .catch((error) => {
          console.error('[PWA] Service Worker registration failed:', error);
        });
    }

    // Listen for online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Request notification permission
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      console.log('[PWA] Notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  };

  // Subscribe to push notifications
  const subscribeToPush = async (vapidPublicKey) => {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Create new subscription
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidPublicKey
        });
      }

      // Send subscription to backend
      // await fetch('/api/push/subscribe', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(subscription)
      // });

      return subscription;
    } catch (error) {
      console.error('[PWA] Push subscription failed:', error);
      return null;
    }
  };

  // Skip waiting and activate update
  const applyUpdate = () => {
    if (pendingUpdate) {
      pendingUpdate.postMessage({ type: 'SKIP_WAITING' });
      setUpdateAvailable(false);
      window.location.reload();
    }
  };

  // Clear cache
  const clearCache = async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log('[PWA] Cache cleared');
    }
  };

  const value = {
    isInstalled,
    isOnline,
    updateAvailable,
    swRegistration,
    requestNotificationPermission,
    subscribeToPush,
    applyUpdate,
    clearCache
  };

  return (
    <PWAContext.Provider value={value}>
      {children}
      <OfflineIndicator isOnline={isOnline} />
      <UpdateNotification updateAvailable={updateAvailable} onUpdate={applyUpdate} />
    </PWAContext.Provider>
  );
};

// Offline indicator component
const OfflineIndicator = ({ isOnline }) => {
  const [show, setShow] = useState(!isOnline);

  useEffect(() => {
    setShow(!isOnline);
  }, [isOnline]);

  if (!show) return null;

  return (
    <div className="offline-indicator">
      <span>⚠️ You are offline. Some features may be limited.</span>
    </div>
  );
};

// Update notification component
const UpdateNotification = ({ updateAvailable, onUpdate }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(updateAvailable);
  }, [updateAvailable]);

  if (!show) return null;

  return (
    <div className="update-notification">
      <div className="update-content">
        <span>🔄 A new version is available!</span>
        <button onClick={onUpdate}>Update Now</button>
      </div>
    </div>
  );
};

// Install prompt hook
export const useInstallPrompt = () => {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstallable(false);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) return false;

    const result = await installPrompt.prompt();
    if (result.outcome === 'accepted') {
      setIsInstallable(false);
      setInstallPrompt(null);
      return true;
    }
    return false;
  };

  return { installPrompt, isInstallable, install };
};

export default PWAProvider;

