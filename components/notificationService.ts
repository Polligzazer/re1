import { db } from "../src/firebase";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  arrayUnion,
  Unsubscribe,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { Item } from "./types";

// Notification Type
export interface AppNotification {
  id: string;
  userId: string;
  reportId?: string;
  description: string;
  readBy?: string[];
  timestamp: number;
}

// Fetch Item Details
export const fetchItemDetails = async (reportId: string): Promise<Item | null> => {
  if (!reportId) return null;

  try {
    const itemRef = doc(db, "lost_items", reportId);
    const itemSnap = await getDoc(itemRef);

    return itemSnap.exists() ? { id: itemSnap.id, ...itemSnap.data() } as Item : null;
  } catch (error) {
    console.error("Error fetching item details:", error);
    return null;
  }
};

// Fetch Notifications in Real-time
export const fetchNotifications = (callback?: (notifications: AppNotification[]) => void): Unsubscribe => {
  const q = query(collection(db, "notifications"), orderBy("timestamp", "desc"));

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as AppNotification[];

    if (callback) {
      callback(notifications); // ✅ Only call if it's defined
    } else {
      console.error("❗ fetchNotifications was called without a valid callback function.");
    }
  });
};

// Mark Notification as Read
export const markNotificationAsRead = async (notificationId: string, userId: string) => {
  const notificationRef = doc(db, "notifications", notificationId);
  try {
    await updateDoc(notificationRef, {
      readBy: arrayUnion(userId),
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
  }
};

// Check if User has Unread Notifications
export const hasUnreadNotifications = (notifications: AppNotification[], userId: string): boolean => {
  return notifications.some((notif) => !notif.readBy?.includes(userId));
};

// Create a New Notification
export const createNotification = async (userId: string, description: string, reportId?: string) => {
  try {
    console.log("📢 Sending notification to:", userId);
    
    const notificationRef = doc(collection(db, "notifications")); // Auto-generate ID
    await setDoc(notificationRef, {
      userId,
      reportId: reportId || null,
      description,
      readBy: [],
      timestamp: serverTimestamp(),
    });

    console.log("✅ Notification sent successfully!");
  } catch (error) {
    console.error("❗ Error creating notification:", error);
  }
};
