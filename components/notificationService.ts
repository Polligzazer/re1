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
  description: string;
  isRead: boolean;
  timestamp: number;
  reportId?: string;
  type?: string;
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

export const createNotification = async (
  userIds: string | string[] | "all",
  description: string,
  reportId?: string
) => {
  try {
    console.log("📢 Creating notifications in Firestore…");
    const batch = writeBatch(db);

    if (userIds === "all") {
      const usersSnapshot = await getDocs(collection(db, "users"));
      usersSnapshot.docs.forEach((userDoc) => {
        const notificationRef = doc(collection(db, "users", userDoc.id, "notifications"));
        batch.set(notificationRef, {
          reportId: reportId || null,
          description,
          isRead: false,
          timestamp: serverTimestamp(),
        });
      });
    } 
    else if (Array.isArray(userIds)) {
      userIds.forEach((userId) => {
        const notificationRef = doc(collection(db, "users", userId, "notifications"));
        batch.set(notificationRef, {
          reportId: reportId || null,
          description,
          isRead: false,
          timestamp: serverTimestamp(),
        });
      });
    } 
    else {
      const notificationRef = doc(collection(db, "users", userIds, "notifications"));
      batch.set(notificationRef, {
        reportId: reportId || null,
        description,
        isRead: false,
        timestamp: serverTimestamp(),
      });
    }

    await batch.commit();
    console.log("✅ Firestore notifications created.");
  } catch (error) {
    console.error("❗ Error creating notifications:", error);
    throw error; // Re-throw to allow handling in calling code
  }
};

// export const useChatNotifications = (currentUserId: string) => {
//   const [notifications, setNotifications] = useState([]);
//   const [unreadCount, setUnreadCount] = useState(0);

//   useEffect(() => {
//     if (!currentUserId) return;

//     const q = query(
//       collection(db, 'userChats'),
//       where('senderId', '==', currentUserId),
//       orderBy('lastActivity', 'desc')
//     );

//     const unsubscribe = onSnapshot(q, (querySnapshot) => {
//       const newNotifications = [];
//       let totalUnread = 0;

//       querySnapshot.forEach((doc) => {
//         const chatData = doc.data();
//         const notification = {
//           id: doc.id,
//           date: chatData.date,
//           lastActivity: chatData.lastActivity?.toDate() || null,
//           lastMessage: {
//             text: chatData.lastMessage?.text || '',
//             timestamp: chatData.lastMessage?.timestamp?.toDate() || null,
//             senderId: chatData.lastMessage?.senderId || '',
//           },
//           messageCount: chatData.messageCount || 0,
//           userInfo: {
//             name: chatData.userInfo?.name || 'Unknown',
//             uid: chatData.userInfo?.uid || '',
//           },
//         };

//         newNotifications.push(notification);
//         totalUnread += notification.messageCount;
//       });

//       setNotifications(newNotifications);
//       setUnreadCount(totalUnread);
//     });

//     return () => unsubscribe();
//   }, [currentUserId]);

//   return { notifications, unreadCount };
// };

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
