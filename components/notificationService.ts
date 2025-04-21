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
  import { onChildAdded, getDatabase, ref } from 'firebase/database';
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

  export interface ValidMessage {
    text: string;
    senderId: string;
    senderName: string;
    timestamp: { seconds: number; nanoseconds: number };
  }
  
  const rdb = getDatabase();
  interface ChatData {
    lastMessage?: ValidMessage;
    messageCount?: number;
  }
  
  const PERSISTENT_CACHE_KEY = 'messageNotifications';
  
  const getMessageCountCache = (): Record<string, number> => {
    try {
      return JSON.parse(localStorage.getItem(PERSISTENT_CACHE_KEY) || '{}');
    } catch {
      return {};
    }
  };
  
  const updateMessageCountCache = (userId: string, chatId: string, count: number) => {
    const cache = getMessageCountCache();
    cache[`${userId}|${chatId}`] = count;
    localStorage.setItem(PERSISTENT_CACHE_KEY, JSON.stringify(cache));
  };
  
  export const watchNewMessagesForUser = (
    userId: string,
    userFcmToken: string,
    onNewMessage: (chatId: string, message: ValidMessage) => void,
    firestore: import('firebase/firestore').Firestore, // explicitly pass Firestore instance
  ): Unsubscribe => {
    const messagesRef = ref(rdb, `messages/${userId}`);
    
    const unsubscribeRealtime = onChildAdded(messagesRef, async (snapshot) => {
      const newMessage = snapshot.val();
      console.log(`📩 New message for user ${userId}:`, newMessage);
      
    const userChatsRef = doc(firestore, 'userChats', userId);

    const unsubscribeFirestore = onSnapshot(userChatsRef, (docSnapshot) => {
      if (docSnapshot.metadata.hasPendingWrites || !docSnapshot.exists()) return;

      const data = docSnapshot.data() as Record<string, ChatData>;
      const countCache = getMessageCountCache();

      for (const [chatId, chatInfo] of Object.entries(data)) {
        if (!chatInfo?.lastMessage || typeof chatInfo.messageCount !== 'number') continue;

        const cacheKey = `${userId}|${chatId}`;
        const storedCount = countCache[cacheKey] || 0;
        const currentCount = chatInfo.messageCount;

        if (currentCount > storedCount && chatInfo.lastMessage.senderId !== userId) {
          onNewMessage(chatId, chatInfo.lastMessage);
          updateMessageCountCache(userId, chatId, currentCount);
        }
      }
    });

    try {
      const title = `New message from ${newMessage.senderName}`;
      const body = newMessage.text || 'You have a new message';
      await fetch('https://flo-ph.vercel.app/api/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: userFcmToken,
          title,
          body,
          data: {
            senderId: String(newMessage.senderId),
            messageId: String(snapshot.key)
          }
        })
      });
      console.log(`✅ Push notification sent to ${userId}`);
    } catch (err) {
      console.error(`❌ Failed to send push notification:`, err);
    }

    return unsubscribeFirestore;
  });

  return () => {
    unsubscribeRealtime();
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
        if (timeDiff < 300000) {
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