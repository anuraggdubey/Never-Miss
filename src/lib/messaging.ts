"use client";

import { getApp, getApps } from "firebase/app";
import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";
import { firebaseApp } from "./firebase";

let swRegistrationPromise: Promise<ServiceWorkerRegistration> | null = null;

function getServiceWorkerRegistration() {
  if (!swRegistrationPromise) {
    swRegistrationPromise = navigator.serviceWorker.register("/firebase-messaging-sw.js", {
      scope: "/firebase-cloud-messaging-push-scope",
    });
  }
  return swRegistrationPromise;
}

export async function requestPushToken() {
  if (typeof window === "undefined") return null;
  if (!(await isSupported())) return null;
  if (!("Notification" in window)) return null;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  const messaging = getMessaging(getApps().length ? getApp() : firebaseApp);
  const registration = await getServiceWorkerRegistration();

  return getToken(messaging, {
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration,
  });
}

export async function listenForForegroundMessages(onPayload: (payload: unknown) => void) {
  if (typeof window === "undefined" || !(await isSupported())) return () => undefined;
  const messaging = getMessaging(getApps().length ? getApp() : firebaseApp);
  return onMessage(messaging, onPayload);
}
