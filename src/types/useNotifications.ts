import { messaging, db } from "../firebase";
import { getToken } from "firebase/messaging";


export const useNotifications = () => {
  const requestPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await getToken(messaging, {
          vapidKey: "BFxv9dfRXQRt-McTvigYKqvpsMbuMdEJTgVqnb7gsql1kljrxNbZmTA_woI4ngYveFGsY5j33IImXJfiYLHBO3w"
        });
        return token;
      }
    } catch (error) {
      console.error('Notification permission error:', error);
    }
  };

  return { requestPermission };
};