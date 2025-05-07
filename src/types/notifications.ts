// src/notifications.ts
import { messaging } from "../firebase";
import { onMessage } from "firebase/messaging";


export function initForegroundNotifications() {
  onMessage(messaging, (payload) => {
    window.dispatchEvent(
      new CustomEvent("FCM_FOREGROUND_MESSAGE", { detail: payload })
    );
  });
}
