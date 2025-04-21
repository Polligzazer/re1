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
  const { title, body, data } = payload.data;
  
  return self.registration.showNotification(title, {
    body,
    icon: '/icon.png',
    data,
    actions: [{ action: 'open', title: 'Open Chat' }]
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const { deepLink } = event.notification.data;
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (const client of clientList) {
        if (client.url === deepLink && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(deepLink);
    })
  );
});