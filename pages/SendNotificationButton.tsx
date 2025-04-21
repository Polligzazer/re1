import React, { useState } from "react";

import { getAuth } from "firebase/auth";
import { getFirestore, collection, getDocs } from "firebase/firestore";
// import { createNotification } from "../components/notificationService";

const SendNotificationButton: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setSuccess(null);
    setError(null);

    try {
      const auth = getAuth();
      const firestore = getFirestore();
  
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");
  
      // Get all documents from fcmTokens subcollection
      const fcmTokenRef = collection(firestore, "users", user.uid, "fcmTokens");
      const fcmTokenSnap = await getDocs(fcmTokenRef);
  
      if (fcmTokenSnap.empty) throw new Error("No FCM tokens found");
  
      // Extract all token values
      const tokens: string[] = [];
      fcmTokenSnap.forEach((doc) => {
        const data = doc.data();
        if (data.token) {
          tokens.push(data.token);
        }
      });
  
      if (tokens.length === 0) throw new Error("No valid FCM tokens found");
  
      // Send notification to each token
      await Promise.allSettled(
        tokens.map(async (token) => {
          try {
            const response = await fetch("https://flo-proxy.vercel.app/api/send-notification", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                token,
                title: 'Mag on ka na boi',
                body: 'You have a new notification!',
                data: { type: 'message', chatId: '123' }
              })
            });
      
            if (!response.ok) {
              const error = await response.json();
              console.error('Notification failed for token:', token.slice(0, 6), error);
              return { status: 'rejected', reason: error };
            }
            return response.json();
          } catch (error) {
            console.error('Network error for token:', token.slice(0, 6), error);
            return { status: 'rejected', reason: error };
          }
        })
      );
  

      setSuccess("Notification sent successfully!");
    } catch (err) {
      console.error("Failed to send notification:", err);
      setError("Failed to send notification.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleClick} disabled={loading}>
        {loading ? "Sending..." : "Send Test Notification"}
      </button>

      {success && <p style={{ color: "green" }}>{success}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default SendNotificationButton;
