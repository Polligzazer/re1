import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { getDatabase, ref, set, onDisconnect } from "firebase/database";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  sendEmailVerification, 
  fetchSignInMethodsForEmail, 
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  confirmPasswordReset,
  updatePassword,
  verifyPasswordResetCode,
  applyActionCode,
  onAuthStateChanged
} from "firebase/auth";
import { 
  getFirestore, 
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  setDoc,
  query,
  where,
} from "firebase/firestore";


const firebaseConfig = {
    apiKey: "AIzaSyC_FLCIBWdReqRPmWFZB1L_4rhLntNWuyA",
    authDomain: "message-4138f.firebaseapp.com",
    projectId: "message-4138f",
    databaseURL: "https://message-4138f-default-rtdb.asia-southeast1.firebasedatabase.app",
    storageBucket: "message-4138f.firebasestorage.app",
    messagingSenderId: "197072020008",
    appId: "1:197072020008:web:e0676251a0d313260dcb1d",
    measurementId: "G-GD15C1MZW2",
    vapidKey:"BFxv9dfRXQRt-McTvigYKqvpsMbuMdEJTgVqnb7gsql1kljrxNbZmTA_woI4ngYveFGsY5j33IImXJfiYLHBO3w"
  };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const messaging = getMessaging(app);
export { messaging, getToken, onMessage };

export const setupAndSaveFCMToken = async (userId: string) => {
  try {
    // 1. Get FCM Token
    const token = await getFCMToken();
    
    if (!token) {
      throw new Error("No FCM token available");
    }

    // 2. Save to Firestore
    await setDoc(doc(db, "users", userId, "fcmTokens", token), {
      token,
      timestamp: new Date(),
    });
    
    console.log("FCM Token saved successfully");
    return token;
  } catch (error) {
    console.error("Error in FCM token setup:", error);
    throw error;
  }
};

// Helper function to get FCM token
async function getFCMToken(): Promise<string | null> {
  try {
    const messaging = getMessaging(app);
    
    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      throw new Error("Notifications permission denied");
    }

    // Register service worker
    const registration = await registerServiceWorker();
    
    // Get token with explicit service worker registration
    const token = await getToken(messaging, {
      serviceWorkerRegistration: registration,
      vapidKey: "BFxv9dfRXQRt-McTvigYKqvpsMbuMdEJTgVqnb7gsql1kljrxNbZmTA_woI4ngYveFGsY5j33IImXJfiYLHBO3w"
    });

    return token;
  } catch (error) {
    console.error("Error getting FCM token:", error);
    return null;
  }
}

// Service worker registration
async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Service workers not supported");
  }

  try {
    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js"
    );
    return registration;
  } catch (error) {
    console.error("Service Worker registration failed:", error);
    throw error;
  }
}

export const requestNotificationPermission = async () => {
  try {
    console.log("Current Notification Permission:", Notification.permission);

    if (!("Notification" in window)) {
      throw new Error("This browser does not support notifications.");
    }

    if (Notification.permission === "denied") {
      console.error("❌ Notifications are blocked by the user.");
      alert("Notifications are blocked by the user. Please enable them in your browser settings.");
      throw new Error("Notifications are blocked by the user.");
    }

    if (Notification.permission === "default") {
      console.log("📢 Requesting notification permission...");

      const permissionRequest = await Notification.requestPermission();
      console.log("Notification permission request response:", permissionRequest);

      if (permissionRequest !== "granted") {
        console.error("❌ Notification permission not granted.");
        throw new Error("Notification permission not granted");
      }
    } else {
      console.log("✅ Notification permission already granted.");
    }

    const messaging = getMessaging(); 

    const token = await getToken(messaging, {
      vapidKey: "BFxv9dfRXQRt-McTvigYKqvpsMbuMdEJTgVqnb7gsql1kljrxNbZmTA_woI4ngYveFGsY5j33IImXJfiYLHBO3w",
    });

    if (token) {
      console.log("✅ Notification token:", token);
      return token;
    } else {
      console.error("❌ Failed to retrieve notification token.");
      throw new Error("Failed to retrieve notification token.");
    }
  } catch (error) {
    // Log all errors for easier debugging
    console.error("❌ Error getting notification token:", error);
  }
};

export const setupForegroundNotifications = () => {
  if (messaging) {
    onMessage(messaging, (payload) => {
      console.log("📩 Foreground notification received:", payload);
      alert(`Notification: ${payload.notification?.title}`);
    });
  } else {
    console.error("❌ Firebase Messaging is not initialized!");
  }
};

const database = getDatabase(app);

onAuthStateChanged(auth, (user) => {
  if (user) {
    const userStatusRef = ref(database, `status/${user.uid}`);

    set(userStatusRef, "online").catch(console.error);

    onDisconnect(userStatusRef).set("offline").catch(console.error);
  }
});

export { auth, database };


export const storage = getStorage(app);
export const db = getFirestore(app);
export {
   createUserWithEmailAndPassword, 
   signInWithEmailAndPassword, 
  sendEmailVerification, 
  fetchSignInMethodsForEmail,
  sendPasswordResetEmail,
  confirmPasswordReset,
  updatePassword,
  verifyPasswordResetCode,
  applyActionCode 
  
};

 
export const reportLostItem = async (
  userId: string,
  category: string,
  description: string,
  location: string,
  date: string,
  // imageFile: File
) => {
  try {
    // Upload image to Firebase Storage
    // const storageRef = ref(storage, `lost_items/${imageFile.name}`);
    // await uploadBytes(storageRef, imageFile);
    // const imageUrl = await getDownloadURL(storageRef);

    // Save report in Firestore
    const docRef = await addDoc(collection(db, "lost_items"), {
      userId,
      category,
      description,
      location,
      date,
      // imageUrl,
      status: "pending", // Default status
      createdAt: new Date(),
    });

    return docRef.id;
  } catch (error) {
    console.error("Error reporting lost item:", error);
    throw error;
  }
};

// Fetch pending reports for admin
export const getPendingReports = async () => {
  const q = query(collection(db, "lost_items"), where("status", "==", "pending"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// Admin approval/rejection function
export const reviewLostItem = async (
  reportId: string,
  approve: boolean,
  userId: string
) => {
  try {
    const docRef = doc(db, "lost_items", reportId);
    await updateDoc(docRef, {
      status: approve ? "approved" : "denied",
    });

    // Notify user (Assuming there's a 'notifications' collection)
    await addDoc(collection(db, "notifications"), {
      userId,
      message: approve
        ? "Your lost item report has been approved and is now public."
        : "Your lost item report has been denied.",
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("Error updating report status:", error);
    throw error;
  }
};

// Fetch approved reports for the feed
export const getApprovedReports = async () => {
  const q = query(collection(db, "lost_items"), where("status", "==", "approved"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

