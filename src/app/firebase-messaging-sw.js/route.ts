const serviceWorkerBody = `
importScripts("https://www.gstatic.com/firebasejs/12.3.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.3.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "${process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? ""}",
  authDomain: "${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? ""}",
  projectId: "${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? ""}",
  storageBucket: "${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? ""}",
  messagingSenderId: "${process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? ""}",
  appId: "${process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? ""}"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "NeverMiss reminder";
  const body = payload.notification?.body || "A soft reminder is waiting for you.";

  self.registration.showNotification(title, {
    body,
    icon: "/icons/nevermiss-192",
    badge: "/icons/nevermiss-192",
    data: payload.data || {}
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const route = event.notification.data?.route || "/notifications";
  event.waitUntil(clients.openWindow(route));
});
`;

export async function GET() {
  return new Response(serviceWorkerBody, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
