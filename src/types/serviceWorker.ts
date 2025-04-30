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