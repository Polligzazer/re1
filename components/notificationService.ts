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
  where,
  limit
} from "firebase/firestore";
import { v4 as uuidv4 } from 'uuid';
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
      // Convert Firestore timestamp to JS Date
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

export interface ValidMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: { seconds: number; nanoseconds: number };
}

const notificationCache = new Map<string, string>();
interface NotificationPayload {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export const sendNotification = async (payload: NotificationPayload) => {
  try {
    const response = await fetch('https://flo-proxy.vercel.app/api/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: payload.token,
        title: payload.title,
        body: payload.body,
        data: payload.data || {},
      }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(
        responseData.message || `Notification failed: ${response.statusText}`
      );
    }

    return responseData;
  } catch (error) {
    console.error('Notification Error:', {
      payload,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    // For user-facing errors
    if (error instanceof Error) {
      throw new Error(
        error.message.includes('token')
          ? 'Notification service unavailable. Please check your connection.'
          : 'Failed to send notification. Please try again later.'
      );
    }
    
    throw error;
  }
};


export const watchNewMessagesForUser = (
  userId: string,
  onNewMessage: (chatId: string, message: ValidMessage) => void
): Unsubscribe => {
  const userChatsRef = doc(db, "userChats", userId);
  const state = new Map<string, { 
    hash: string;
    timer?: NodeJS.Timeout;
  }>();

  const unsubscribe = onSnapshot(userChatsRef, async (docSnapshot) => {
    // Skip local updates and empty docs
    if (docSnapshot.metadata.hasPendingWrites || !docSnapshot.exists()) return;

    const data = docSnapshot.data();

    await Promise.all(Object.entries(data).map(async ([chatId, chatData]) => {
      const chatInfo = chatData as {
        lastMessage?: ValidMessage;
        messageCount?: number;
        chatName?: string;
      };

      // Validate structure
      if (!chatInfo?.lastMessage?.text || 
          !chatInfo?.lastMessage?.senderId ||
          typeof chatInfo.messageCount !== 'number') return;

      // Create enhanced unique hash
      const hash = `${chatInfo.messageCount}-${
        chatInfo.lastMessage.senderId
      }-${chatInfo.lastMessage.timestamp.seconds}-${
        chatInfo.lastMessage.timestamp.nanoseconds
      }`;

      // Global cache check
      const cacheKey = `${userId}|${chatId}|${hash}`;
      if (notificationCache.has(cacheKey)) return;

      // Local state check
      const currentState = state.get(chatId);
      if (currentState?.hash === hash) return;

      // Clear existing timer
      if (currentState?.timer) clearTimeout(currentState.timer);

      // Set new state with debounce
      state.set(chatId, {
        hash,
        timer: setTimeout(async () => {
          if (chatInfo.lastMessage!.senderId !== userId) {
            notificationCache.set(cacheKey, 'processed');
            
            // 1. Call the original handler
            onNewMessage(chatId, chatInfo.lastMessage!);
            
            // 2. Send push notification
            try {
              // Get recipient's FCM tokens
              const tokensRef = collection(db, "users", userId, "fcmTokens");
              const tokensSnap = await getDocs(tokensRef);
              const tokens = tokensSnap.docs.map(doc => doc.data().token).filter(Boolean);

              if (tokens.length > 0) {
                // Get sender info
                const senderRef = doc(db, "users", chatInfo.lastMessage!.senderId);
                const senderSnap = await getDoc(senderRef);
                const senderName = senderSnap.exists() 
                  ? senderSnap.data().displayName || 'Someone'
                  : 'Someone';

                // Get chat name (if group chat)
                const chatName = chatInfo.chatName || senderName;

                await Promise.allSettled(
                  tokens.map(token => 
                    fetch("https://flo-proxy.vercel.app/api/send-notification", {
                      method: "POST",
                      headers: { "Content-Type": "application/json", 'Authorization': 'Bearer YOUR_FCM_SERVER_KEY' },
                      body: JSON.stringify({
                        token,
                        title: `${chatName} `,
                        body: `${senderName}: ${chatInfo.lastMessage!.text.slice(0, 100)}`,
                        data: {
                          type: 'new_message',
                          chatId,
                          senderId: chatInfo.lastMessage!.senderId,
                          messageId: chatInfo.lastMessage!.id
                        }
                      })
                    }).catch(console.error)
                  )
                );
              }
            } catch (error) {
              console.error('Push notification error:', error);
            }
          }
          state.delete(chatId);
        }, 1000) // 1-second debounce
      });
    }))
  });

  return () => {
    state.forEach(({ timer }) => timer && clearTimeout(timer));
    state.clear();
    unsubscribe();
  };
};

export const createNotification = async (
  userId: string,
  description: string,
  contextId?: string
) => {
  try {
    // Check if notification already exists
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
      
      // Block duplicates within 5 minutes
      if (timeDiff < 300) {
        console.log("⏭️ Duplicate notification blocked");
        return;
      }
    }

    // Create new notification
    const batch = writeBatch(db);
    const notificationId = uuidv4();
    
    const notificationRef = doc(db, "users", userId, "notifications", notificationId);
    batch.set(notificationRef, {
      contextId: contextId || null,
      description,
      isRead: false,
      timestamp: serverTimestamp(),
      uid: notificationId
    });

    await batch.commit();
    console.log("📨 Notification created for", userId);
    
  } catch (error) {
    console.error("💥 Notification error:", error);
    throw error;
  }
};