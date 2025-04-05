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

    // Get all users
    const usersSnapshot = await getDocs(collection(db, "users"));
    const batch = writeBatch(db);

    const pushPromises: Promise<void>[] = []; // Collect push promises here

    // Iterate through all users
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;

      // Create Firestore notification for each user
      const notificationRef = doc(collection(db, "users", userId, "notifications"));
      batch.set(notificationRef, {
        reportId: reportId || null,
        description,
        isRead: false,
        timestamp: serverTimestamp(),
      });

      // Fetch all FCM tokens for the user
      const tokensSnapshot = await getDocs(collection(db, `users/${userId}/fcmTokens`));

      // Iterate through all tokens
      for (const tokenDoc of tokensSnapshot.docs) {
        const token = tokenDoc.id;

        const pushPromise = fetch("https://flo-proxy.vercel.app/api/send-push", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            title: "Lost Item Approved",
            body: description,
          })
        });

        // Push each promise into the array
        pushPromises.push(pushPromise
          .then(res => {
            if (!res.ok) {
              console.error(`❌ Failed to send push to ${token}: ${res.status}`);
            }
          })
          .catch(error => {
            console.error(`❌ Failed to send push to ${token}:`, error);
          }));
      }
    }

    // Commit Firestore batch (do it outside the loop to reduce Firestore load)
    await batch.commit();
    console.log("✅ Firestore notifications created.");

    // Wait for all push notifications to be sent
    await Promise.all(pushPromises);
    console.log("📲 Push notifications sent to all users.");
  } catch (error) {
    console.error("❗ Error creating notifications:", error);
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
