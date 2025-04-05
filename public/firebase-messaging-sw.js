importScripts("https://www.gstatic.com/firebasejs/10.7.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyC_FLCIBWdReqRPmWFZB1L_4rhLntNWuyA",
  projectId: "message-4138f",
  messagingSenderId: "197072020008",
  appId: "1:197072020008:web:e0676251a0d313260dcb1d",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("📩 Received background notification:", payload);

  const { title, body, icon } = payload.notification;

  self.registration.showNotification(title, {
    body,
    icon: icon || "/icon.png",
    vibrate: [200, 100, 200],
    badge: "/badge-icon.png",
  });
});