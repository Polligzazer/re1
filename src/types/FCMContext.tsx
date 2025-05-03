import React, { createContext, useContext, useState, useEffect } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { toast } from 'react-toastify';
import { messaging, db } from '../firebase';
import { setDoc, doc } from 'firebase/firestore';


interface FCMContextType {
  token: string | null;
  setToken: React.Dispatch<React.SetStateAction<string | null>>;
}

const FCMContext = createContext<FCMContextType | undefined>(undefined);

interface FCMProviderProps {
  children: React.ReactNode;
}

export const FCMProvider: React.FC<FCMProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

        console.log('✅ Service Worker registered:', registration);

        // Request notification permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.error('❌ Notification permission not granted');
          return;
        }
        console.log('✅ Notification permission granted');

        // Get the token
        const currentToken = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_VAPID_KEY,
          serviceWorkerRegistration: registration,
        });

        if (currentToken) {
          setToken(currentToken);
          console.log('✅ FCM Token:', currentToken);
        } else {
          console.warn('⚠️ No registration token available.');
        }

        // Listen for foreground messages
        onMessage(messaging, (payload) => {
          console.log('📲 Foreground message received:', payload);
          const title = payload.notification?.title || payload.data?.title;
          const body = payload.notification?.body || payload.data?.body;
          toast.info(`${title}: ${body}`);
        });

      } catch (error) {
        console.error('❌ Error setting up FCM:', error);
      }
    };
    registerServiceWorker();
    const tokenRefreshInterval = setInterval(async () => {
      try {
        const refreshedToken = await getToken(messaging);
        if (refreshedToken !== token) {
          setToken(refreshedToken); // Update the token if it's changed
          console.log('✅ FCM Token refreshed:', refreshedToken);
        }
      } catch (error) {
        console.error('❌ Error refreshing token:', error);
      }
    }, 3600000); // Check every hour (adjust as needed)

    // Clear the interval on cleanup
    return () => clearInterval(tokenRefreshInterval);
  }, [token]); // Empty dependency array to run only once on component mount

  return (
    <FCMContext.Provider value={{ token, setToken }}>
      {children}
    </FCMContext.Provider>
  );
};

export const useFCMToken = () => {
  const context = useContext(FCMContext);
  if (!context) {
    throw new Error('useFCMToken must be used within a FCMProvider');
  }
  return context;
};

export const saveFCMTokenToUser = async (userId: string, token: string) => {
  await setDoc(doc(db, "users", userId), { fcmToken: token }, { merge: true });
};