"use client";

import type { ElementType, ReactNode } from "react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bell, Clock3, Lock, Moon, Sun } from "lucide-react";
import AuthPrompt from "../components/AuthPrompt";
import PushCard from "../components/push-card";
import { useAuth } from "../lib/auth";
import { defaultSettings, type NotificationRhythm, type UserSettings } from "../lib/models";
import { subscribeToSettings, updateSettings } from "../lib/firestore";

export default function Settings() {
  const { user, loading } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);

  useEffect(() => {
    if (!user) return;
    return subscribeToSettings(user.uid, (nextSettings) => {
      setSettings(nextSettings);
      document.documentElement.classList.toggle("dark", nextSettings.theme === "dark");
    });
  }, [user]);

  useEffect(() => {
    if (!user || typeof window === "undefined") return;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    if (settings.timezone !== timezone) {
      void updateSettings(user.uid, { timezone });
    }
  }, [settings.timezone, user]);

  async function patchSettings(changes: Partial<UserSettings>) {
    if (!user) return;
    const next = { ...settings, ...changes };
    setSettings(next);
    if (changes.theme) {
      document.documentElement.classList.toggle("dark", changes.theme === "dark");
    }
    await updateSettings(user.uid, changes);
    if (changes.notificationRhythm || changes.timezone) {
      const idToken = await user.getIdToken();
      await fetch("/api/reminders/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ all: true }),
      });
    }
  }

  if (loading) {
    return <Shell title="Loading..." body="Opening your settings." />;
  }

  if (!user) {
    return (
      <div className="px-4 pb-24 pt-10 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <AuthPrompt
            title="Sign in to adjust your settings."
            body="Your preferences will be ready whenever you return."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-24 pt-10 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="chip mb-3">Settings</div>
        <h1 className="h-display text-4xl sm:text-5xl">A quieter setup.</h1>
        <p className="mt-2 text-ink/60">Reminders on Android and the web now follow the timing you choose here.</p>

        <div className="mt-8 space-y-4">
          <Row icon={settings.theme === "dark" ? Moon : Sun} title="Theme" subtitle="Switch between light and dark.">
            <Toggle
              on={settings.theme === "dark"}
              onChange={() => void patchSettings({ theme: settings.theme === "dark" ? "light" : "dark" })}
              labelOn="Dark"
              labelOff="Light"
            />
          </Row>

          <Row icon={Bell} title="Reminder timing" subtitle="Choose exactly when you want to be notified.">
            <PillGroup
              options={[
                { label: "24 hours before", value: "day_before" },
                { label: "10 min before", value: "ten_minutes_before" },
                { label: "Both", value: "both" },
              ]}
              value={settings.notificationRhythm}
              onChange={(notificationRhythm) => void patchSettings({ notificationRhythm })}
            />
          </Row>

          <Row icon={Clock3} title="Timezone" subtitle="Used to schedule reminders for this account.">
            <span className="chip">{settings.timezone}</span>
          </Row>

          <PushCard />

          <Row icon={Lock} title="Privacy" subtitle="Only the data needed to power your entries, wishes, and alerts is accepted.">
            <span className="chip">Strict rules</span>
          </Row>
        </div>
      </div>
    </div>
  );
}

function Shell({ title, body }: { title: string; body: string }) {
  return (
    <div className="px-4 pb-24 pt-10 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="neu p-6 sm:p-8">
          <h1 className="h-display text-3xl sm:text-4xl">{title}</h1>
          <p className="mt-3 text-ink/60">{body}</p>
        </div>
      </div>
    </div>
  );
}

function Row({
  icon: Icon, title, subtitle, children,
}: { icon: ElementType; title: string; subtitle: string; children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="neu flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-5"
    >
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-surface shadow-neu-in">
        <Icon className="h-5 w-5 text-[hsl(var(--accent))]" />
      </div>
      <div className="flex-1">
        <div className="font-display text-xl">{title}</div>
        <div className="text-sm text-ink/55">{subtitle}</div>
      </div>
      <div className="w-full shrink-0 sm:w-auto">{children}</div>
    </motion.div>
  );
}

function Toggle({ on, onChange, labelOn, labelOff }: { on?: boolean; onChange?: () => void; labelOn: string; labelOff: string }) {
  return (
    <button
      onClick={onChange}
      className="relative flex h-9 w-16 items-center rounded-full bg-surface px-1 shadow-neu-in sm:h-10 sm:w-20"
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 350, damping: 30 }}
        className={`h-7 w-7 rounded-full shadow-neu-sm sm:h-8 sm:w-8 ${
          on ? "ml-auto bg-gradient-to-br from-[hsl(var(--accent))] to-[hsl(var(--accent2))]" : "bg-surface"
        }`}
      />
      <span className="pointer-events-none absolute inset-0 grid place-items-center text-[10px] font-medium text-ink/50">
        {on ? labelOn : labelOff}
      </span>
    </button>
  );
}

function PillGroup({
  options,
  value,
  onChange,
}: {
  options: Array<{ label: string; value: NotificationRhythm }>;
  value: NotificationRhythm;
  onChange: (value: NotificationRhythm) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5 rounded-2xl bg-surface p-1 shadow-neu-in">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
            value === option.value ? "bg-surface text-ink shadow-neu-sm" : "text-ink/60"
          }`}
        >
          <span className="whitespace-nowrap">{option.label}</span>
        </button>
      ))}
    </div>
  );
}
