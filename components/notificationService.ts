import { db } from "../src/firebase";
import {
  collection,
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
  orderBy,
  query,
  getDocs,
  Unsubscribe,
  writeBatch,
  serverTimestamp,
  where,
  limit
} from "firebase/firestore";
import { v4 as uuidv4 } from 'uuid';
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
  contextId?: string,
  chatId?: string;

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

export const fetchNotifications = (
  userId: string,
  callback: (notifications: AppNotification[]) => void
): Unsubscribe => {
  const q = query(
    collection(db, "users", userId, "notifications"),
    orderBy("timestamp", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate().getTime() || Date.now()
    })) as AppNotification[];
    
    callback(notifications);
  }, (error) => {
    console.error("Error fetching notifications:", error);
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
export const markAllNotificationsAsRead = async (userId: string, notifications: AppNotification[]) => {
  try {
    const unread = notifications.filter((notif) => !notif.isRead);
    const updatePromises = unread.map((notif) => {
      const ref = doc(db, "users", userId, "notifications", notif.id);
      return updateDoc(ref, { isRead: true });
    });

    await Promise.all(updatePromises);
    console.log("✅ All notifications marked as read.");
  } catch (error) {
    console.error("❗ Error marking all notifications as read:", error);
  }
};

export const hasUnreadNotifications = (notifications: AppNotification[]): boolean => {
  return notifications.some((notif) => !notif.isRead);
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
    const unsubscribe = onMessage(messaging, (_payload) => {
    });

    return () => unsubscribe();
  }, []);

  return null;
};

export interface PushPayload {
  token: string;
  title: string;
  body: string;
  icon: string;
  data: { chatId?: string, url: string };
};

export const sendPushNotification = async (  
  token: string,
  payload: Record<string, string>) => {
  try {
    if (!token) {
      console.warn("⚠️ No FCM token available—skipping push");
      return;
    }

    const safePayload = Object.fromEntries(
      Object.entries(payload).map(([key, value]) => [key, String(value)])
    );

    const response = await fetch(
      "https://flo-proxy.vercel.app/api/send-notification",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          payload: { data: safePayload },
        }),
      }
    );

    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      if (
        result?.code === "messaging/invalid-registration-token" ||
        result?.code === "messaging/registration-token-not-registered"
      ) {
        console.warn("🗑️ Invalid token:", token);
      }
      throw new Error(
        `Push notification failed: ${result.message || response.statusText}`
      );
    }

    return await response.json();
  } catch (err) {
    console.error("🚨 Push notification failed:", err);
    throw err;
  }
};

export const showInAppNotification = (payload: {
  notification?: { title?: string; body?: string };
  data?: { chatId?: string };
}) => {
  if (!payload.notification?.title || !payload.notification?.body) return;

  console.log('Showing notification:', payload);
};

export interface ValidMessage {
  text: string;
  senderId: string;
  senderName?: string;
  timestamp: { seconds: number; nanoseconds: number };
};

const lastMessageMap = new Map<string, string>();
let lastNotificationTime: number | null = null;
const notificationCooldown = 5000;

export function watchNewMessagesForUser(
  userId: string,
  token: string,
  onNewMessage: (chatId: string, message: ValidMessage) => void
): Unsubscribe {
  const ref = doc(db, "userChats", userId);
  let isInitialLoad = true;
  let currentToken = token;
  const unsubscribe = onSnapshot(ref, async (snap) => {
    if (!snap.exists() || snap.metadata.hasPendingWrites) return;
    const chats = snap.data() as Record<string, any>;
    if (isInitialLoad) {
      isInitialLoad = false;
      return;
    }
    if (!currentToken) return;

    for (const [chatId, raw] of Object.entries(chats)) {
      const lastMessage = raw.lastMessage as ValidMessage | undefined;
      if (!lastMessage?.text || lastMessage.senderId === userId) continue;
      const messageId = `${lastMessage.text}|${lastMessage.timestamp.seconds}|${lastMessage.timestamp.nanoseconds}`;
      const previousMessageId = lastMessageMap.get(chatId);
      if (messageId === previousMessageId) continue;
      lastMessageMap.set(chatId, messageId);

      const now = Date.now();
      if (lastNotificationTime && now - lastNotificationTime < notificationCooldown) {
        console.log(`⏭️ Skipping notification due to cooldown: ${now - lastNotificationTime}ms`);
        continue;
      }
      lastNotificationTime = now;
    
      try {
        const senderDocRef = doc(db, "users", lastMessage.senderId);
        const senderSnap = await getDoc(senderDocRef);
        const senderName = senderSnap.exists()
          ? `${senderSnap.data().firstName || ""} ${senderSnap.data().lastName || ""}`.trim() || "Unknown"
          : "Unknown";
        if (document.hidden) {
          const originalTitle = document.title;
          let blinkCount = 0;
          const blinkInterval = setInterval(() => {
            if (blinkCount >= 6) {
              clearInterval(blinkInterval);
              document.title = originalTitle;
              return;
            }
            document.title = document.title === `${senderName}` ? 'FLO' : `${senderName}`;
            blinkCount++;
          }, 700);
        }
        onNewMessage(chatId, lastMessage);
        console.log("[📨 Incoming Message]", chatId, lastMessage);
        if (currentToken) {
          await sendPushNotification(currentToken, {
            title: `${senderName}`,
            body: lastMessage.text,
            url: `/inquiries/${chatId}`,
          });
          console.log("✅ Push notification sent:", lastMessage.text, senderName);
        }
      } catch (error) {
        console.error("Error sending push notification:", error);
      }
    }
  });

  return () => {
    unsubscribe();
  };
}

export const createNotification = async (
  userId: string,
  description: string,
  contextId?: string,
  type?: string,
  chatId?: string
) => {
  try {
    const notificationsRef = collection(db, "users", userId, "notifications");
    const existing = await getDocs(query(
      notificationsRef, 
      where("description", "==", description),
      where("contextId", "==", contextId || ""),
      orderBy("timestamp", "desc"),
      limit(1)
    ));

    if (!existing.empty) {
      const lastNotification = existing.docs[0].data();
      const timeDiff = Date.now() - lastNotification.timestamp.toDate().getTime();
      
      if (timeDiff < 300) {
        console.log("⏭️ Duplicate notification blocked");
        return;
      }
    }

    const batch = writeBatch(db);
    const notificationId = uuidv4();
    
    const notificationRef = doc(db, "users", userId, "notifications", notificationId);
    batch.set(notificationRef, {
      contextId: contextId || null,
      description,
      isRead: false,
      timestamp: serverTimestamp(),
      uid: notificationId,
      type: type || null,          
      chatId: chatId || null  
    });

    await batch.commit();
    console.log("📨 Notification created for", userId);
  } catch (error) {
    console.error("💥 Notification error:", error);
    throw error;
  }
};


export default useFirebaseNotifications;
