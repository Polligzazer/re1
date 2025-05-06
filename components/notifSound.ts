let lastPlayed = 0;
export const playNotificationSound = () => {
  const now = Date.now();
  if (now - lastPlayed < 1000) return;
  lastPlayed = now;

  const audio = new Audio('/notif-sound.mp3');
  audio.play().catch((err) => {
    console.warn("🔇 Sound play blocked:", err.message);
  });
};