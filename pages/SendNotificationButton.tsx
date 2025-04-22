import { useState } from "react";
import { createNotification } from "../components/notificationService";
import React from "react";

const SendNotificationButton: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setSuccess(null);
    setError(null);

    try {
      await createNotification("📍 A new lost item has been approved!", "sample-report-id");
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
