export function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  if ('serviceWorker' in navigator) {
    return navigator.serviceWorker
      .register('/firebase-messaging-sw.js')   // <-- same path as above
      .then((registration) => {
        console.log('✅ SW registered at scope:', registration.scope);
        return registration;
      });
  }
  return Promise.reject(new Error('Service Worker not supported'));
}

export async function getSWRegistration(): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) {
    throw new Error("Service Worker not supported");
  }
  return navigator.serviceWorker.ready;
}

export const sendSubscriptionToServer = async (subscription: PushSubscription) => {
  const key = subscription.getKey('p256dh');
  const auth = subscription.getKey('auth');

  if (!key || !auth) {
    console.error("❌ Failed to extract keys from subscription.");
    return;
  }

  const payload = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: btoa(String.fromCharCode(...new Uint8Array(key))),
      auth: btoa(String.fromCharCode(...new Uint8Array(auth))),
    },
  };

  try {
    const response = await fetch('https://flo-proxy.vercel.app/api/saveSubscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error("Failed to send subscription to server");

    console.log("📬 Subscription sent to server");
  } catch (err) {
    console.error("❌ Error sending subscription to server:", err);
  }
};