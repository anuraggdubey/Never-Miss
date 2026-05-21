"use client";

import { useEffect, useState } from "react";
import { BellRing, Heart, Sparkles } from "lucide-react";
import { savePushDevice } from "@/lib/firestore";
import { listenForForegroundMessages, requestPushToken } from "@/lib/messaging";
import { useAuth } from "@/lib/auth";
import { auth } from "@/lib/firebase";

export default function PushCard() {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [copy, setCopy] = useState("Enable reminders on this device.");

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    void (async () => {
      unsubscribe = await listenForForegroundMessages((payload: unknown) => {
        const nextCopy = typeof payload === "object" && payload && "notification" in payload
          ? "A reminder just arrived on this device."
          : "Reminders are active on this device.";
        setCopy(nextCopy);
      });
    })();

    return () => unsubscribe?.();
  }, []);

  async function enablePush() {
    if (!user) return;
    const token = await requestPushToken();
    if (!token) {
      setCopy("Notification permission is still missing for this device.");
      return;
    }

    await savePushDevice(user.uid, {
      token,
      platform: "web",
      userAgent: navigator.userAgent,
      notificationEnabled: true,
    });
    setEnabled(true);
    setCopy("This device is ready for reminders.");
  }

  async function sendTestPush() {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    setSendingTest(true);
    try {
      const idToken = await currentUser.getIdToken();
      const response = await fetch("/api/push/test", {
        method: "POST",
        headers: {
          authorization: `Bearer ${idToken}`,
        },
      });
      const data = await response.json();
      setCopy(response.ok ? `Test reminder sent to ${data.successCount} device(s).` : data.error);
    } finally {
      setSendingTest(false);
    }
  }

  return (
    <div className="neu p-5 sm:p-6">
      <div className="chip">
        <BellRing className="h-3 w-3 text-[hsl(var(--accent))]" />
        Device reminders
      </div>
      <h3 className="mt-4 font-display text-2xl">Ready on Android and web.</h3>
      <p className="mt-2 text-sm text-ink/65">{copy}</p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-ink/55">
        <span className="chip">24 hours before</span>
        <span className="chip">10 minutes before</span>
        <span className="chip">Based on your setting</span>
      </div>
      <button onClick={() => void enablePush()} className="btn-primary mt-5 w-full justify-center">
        {enabled ? <Heart className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
        {enabled ? "Enabled" : "Enable reminders"}
      </button>
      <button onClick={() => void sendTestPush()} className="btn-ghost mt-3 w-full justify-center text-sm">
        {sendingTest ? "Sending test..." : "Send test reminder"}
      </button>
    </div>
  );
}
