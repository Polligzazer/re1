// src/notifications.ts
import { messaging } from "../firebase";
import { onMessage } from "firebase/messaging";


export function initForegroundNotifications() {
  onMessage(messaging, (payload) => {
    // Dispatch a custom event for in-app messaging (e.g., toast notifications)
    window.dispatchEvent(
      new CustomEvent("FCM_FOREGROUND_MESSAGE", { detail: payload })
    );
  });
}
