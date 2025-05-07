import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getMessaging, getToken, onMessage, MessagePayload } from "firebase/messaging";
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
  deleteDoc,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECTID,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASEURL,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGEID,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDERID,
    appId: import.meta.env.VITE_FIREBASE_APPID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENTID,
    vapidKey: import.meta.env.VITE_VAPID_KEY
  };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const messaging = getMessaging(app);
export { messaging, getToken, onMessage };

export async function setupAndSaveFCMToken(userId: string): Promise<string> {
  const vapidKey = process.env.VITE_VAPID_KEY;
  const token = await getToken(messaging, { vapidKey });
  
  if (!token) throw new Error("Failed to obtain FCM token");

  await updateDoc(doc(db, "users", userId), { fcmToken: token, updatedAt: serverTimestamp() });

  const tokensRef = collection(db, "users", userId, "fcmTokens");

  const existingQuery = query(tokensRef, where("token", "==", token));
  const existingSnapshot = await getDocs(existingQuery);

  if (existingSnapshot.empty) {
    await addDoc(tokensRef, { token, createdAt: serverTimestamp() });
  } else {
    const docRef = existingSnapshot.docs[0].ref;
    await updateDoc(docRef, { token, createdAt: serverTimestamp() });
  }

  return token;
}

export async function migrateLegacyTokens(userId: string): Promise<void> {
  const db = getFirestore();
  const legacyCol = collection(db, "users", userId, "fcmTokens");
  const docs = await getDocs(legacyCol);

  docs.forEach(async (docSnap) => {
    const data = docSnap.data();
    if (!data.token && docSnap.id) {
      await addDoc(legacyCol, {
        token: docSnap.id,
        createdAt: serverTimestamp(),
        migrated: true
      });
      await deleteDoc(docSnap.ref);
    }
  });
}

export const deleteInvalidToken = async (userId: string, invalidToken: string) => {
  const db = getFirestore();
  const tokensRef = collection(db, "users", userId, "fcmTokens");
  const q = query(tokensRef, where("token", "==", invalidToken));
  const snapshot = await getDocs(q);
  
  snapshot.forEach(async (doc) => {
    await deleteDoc(doc.ref);
  });
};

import { getSWRegistration } from "./types/serviceWorker";

export const onMessageListener = (): Promise<MessagePayload> =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });

export async function getFCMToken(): Promise<string | null> {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") throw new Error("Notification permission denied");
    const registration = await getSWRegistration();
    if (!registration) {
      throw new Error("Service Worker registration unavailable");
    }
    const token = await getToken(messaging, {
      vapidKey: process.env.VITE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    return token;
  } catch (error: any) {
    console.error("Error getting FCM token:", error);
    return null;
  }
}

export const requestNotificationPermission = async () => {
  try {

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

      if (permissionRequest !== "granted") {
        console.error("❌ Notification permission not granted.");
        throw new Error("Notification permission not granted");
      }
    } else {
      console.log("✅ Notification permission already granted.");
    }

    const messaging = getMessaging(); 

    const token = await getToken(messaging, {
      vapidKey: process.env.VAPID_KEY,
    });

    if (token) {
      return token;
    } else {
      console.error("❌ Failed to retrieve notification token.");
      throw new Error("Failed to retrieve notification token.");
    }
  } catch (error) {
    console.error("❌ Error getting notification token:", error);
  }
};

export function setupForegroundNotifications() {
  onMessage(messaging, (payload) => {
    console.log("📥 Foreground FCM received:", payload);
    if (document.hasFocus()) {
      window.dispatchEvent(new CustomEvent("NEW_FCM_MESSAGE", { detail: payload }));
    }
  });
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
) => {
  try {
    const docRef = await addDoc(collection(db, "lost_items"), {
      userId,
      category,
      description,
      location,
      date,
      status: "pending",
      createdAt: new Date(),
    });

    return docRef.id;
  } catch (error) {
    console.error("Error reporting lost item:", error);
    throw error;
  }
};

export const getPendingReports = async () => {
  const q = query(collection(db, "lost_items"), where("status", "==", "pending"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

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

export const getApprovedReports = async () => {
  const q = query(collection(db, "lost_items"), where("status", "==", "approved"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

