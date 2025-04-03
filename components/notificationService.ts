import { db } from "../src/firebase";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  getDocs,
  Unsubscribe,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { useEffect } from "react";
import { messaging, onMessage } from "../src/firebase";
import { Item } from "./types";

export interface AppNotification {
  id: string;
  reportId?: string;
  description: string;
  isRead: boolean;
  timestamp: number;
}


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

export const fetchNotifications = (userId: string, callback: (notifications: AppNotification[]) => void): Unsubscribe => {
  if (!userId) return () => {};

  const q = query(collection(db, `users/${userId}/notifications`), orderBy("timestamp", "desc"));

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as AppNotification[];

    callback(notifications);
  }, (error) => {
    console.error("❗ Error fetching real-time notifications:", error);
  });
};

export const markNotificationAsRead = async (userId: string, notificationId: string) => {
  const notificationRef = doc(db, "users", userId, "notifications", notificationId);
  try {
    await updateDoc(notificationRef, { isRead: true });
    console.log(`✅ Notification ${notificationId} marked as read.`);
  } catch (error) {
    console.error("❗ Error marking notification as read:", error);
  }
};

export const hasUnreadNotifications = (notifications: AppNotification[]): boolean => {
  return notifications.some((notif) => !notif.isRead);
};

export const createNotification = async (description: string, reportId?: string) => {
  try {
    console.log("📢 Sending notification to all users...");

    const usersSnapshot = await getDocs(collection(db, "users"));

    const batch = writeBatch(db);

    usersSnapshot.forEach((userDoc) => {
      const userId = userDoc.id;
      const notificationRef = doc(collection(db, "users", userId, "notifications"));

      batch.set(notificationRef, {
        reportId: reportId || null,
        description,
        isRead: false,
        timestamp: serverTimestamp(),
      });

      sendPushNotification(userId, "Lost Item Approved", description);
    });

    await batch.commit();
    console.log("✅ Notifications sent successfully to all users!");
  } catch (error) {
    console.error("❗ Error creating notifications:", error);
  }
};

export const sendPushNotification = async (userId: string, title: string, body: string) => {
  try {
    const userDoc = await getDocs(collection(db, `users/${userId}/fcmTokens`));

    userDoc.forEach(async (tokenDoc) => {
      const token = tokenDoc.id;

      await fetch("https://fcm.googleapis.com/fcm/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `key=BFxv9dfRXQRt-McTvigYKqvpsMbuMdEJTgVqnb7gsql1kljrxNbZmTA_woI4ngYveFGsY5j33IImXJfiYLHBO3w`,
        },
        body: JSON.stringify({
          to: token,
          notification: { title, body, click_action: "/lost-items" },
        }),
      });
    });

    console.log(`📢 Push notification sent to ${userId}`);
  } catch (error) {
    console.error("❗ Error sending push notification:", error);
  }
};

export const watchLostItemApprovals = () => {
  const q = query(collection(db, "lost_items"));

  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "modified") {
        const item = change.doc.data();
        
        if (item.status === "approved") {
          createNotification(`Lost item "${item.name}" has been approved!`, item.id);
        }
      }
    });
  }, (error) => {
    console.error("❗ Error listening for approvals:", error);
  });
};

const useFirebaseNotifications = () => {
  useEffect(() => {
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("Message received: ", payload);
      alert(`Notification: ${payload.notification?.title}`);
    });

    return () => unsubscribe();
  }, []);

  return null;
};

export default useFirebaseNotifications;
