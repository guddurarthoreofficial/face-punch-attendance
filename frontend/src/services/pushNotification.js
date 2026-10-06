import { apiRequest } from "./api";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

// Convert VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);

  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);

  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

// Register service worker
export const registerPushServiceWorker = async () => {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Service Worker is not supported");
  }

  const registration = await navigator.serviceWorker.register("/sw.js");

  return registration;
};

// Request notification permission
export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) {
    throw new Error("Browser notifications are not supported");
  }

  const permission = await Notification.requestPermission();

  return permission;
};

// Subscribe browser for push
export const subscribeToPush = async () => {
  if (!VAPID_PUBLIC_KEY) {
    throw new Error("VAPID public key is missing");
  }

  const registration = await registerPushServiceWorker();

  const permission = await requestNotificationPermission();

  if (permission !== "granted") {
    throw new Error("Notification permission was denied");
  }

  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  await apiRequest("/push/subscribe", {
    method: "POST",
    body: JSON.stringify(subscription.toJSON()),
  });

  return subscription;
};
