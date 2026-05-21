"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlarmClock, Bell, Sparkles } from "lucide-react";
import Link from "next/link";
import AuthPrompt from "../components/AuthPrompt";
import { useAuth } from "../lib/auth";
import { subscribeToMoments, updateMoment } from "../lib/firestore";
import { addDaysToIsoDate, daysUntil, relativeWhen } from "../lib/utils";
import type { Moment } from "../lib/models";

export default function Notifications() {
  const { user, loading } = useAuth();
  const [moments, setMoments] = useState<Moment[]>([]);

  useEffect(() => {
    if (!user) return;
    return subscribeToMoments(user.uid, setMoments);
  }, [user]);

  const items = useMemo(() => moments
    .map((moment) => {
      const delta = daysUntil(moment.date);
      if (delta < -7) return null;
      if (delta === 0) return { label: "Today", moment, text: `${moment.name}'s ${moment.occasion} is today.` };
      if (delta === 1) return { label: "Tomorrow", moment, text: `${moment.name}'s ${moment.occasion} is tomorrow.` };
      if (delta > 1) return { label: "Upcoming", moment, text: `${moment.name}'s ${moment.occasion} is ${relativeWhen(moment.date)}.` };
      return { label: "Recently passed", moment, text: `${moment.name}'s ${moment.occasion} just passed.` };
    })
    .filter(Boolean) as Array<{ label: string; moment: Moment; text: string }>, [moments]);

  async function snoozeMoment(moment: Moment) {
    if (!user) return;
    await updateMoment(user.uid, moment.id, { date: addDaysToIsoDate(moment.date, 1) });
    const idToken = await user.getIdToken();
    await fetch("/api/reminders/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ momentId: moment.id }),
    });
  }

  async function markDone(moment: Moment) {
    if (!user) return;
    await updateMoment(user.uid, moment.id, { note: `${moment.note ? `${moment.note} ` : ""}[Done ${new Date().toLocaleDateString()}]` });
  }

  if (loading) {
    return <Shell title="Loading..." body="Getting your upcoming alerts ready." />;
  }

  if (!user) {
    return (
      <div className="px-4 pb-24 pt-10 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <AuthPrompt
            title="Sign in to view alerts."
            body="Your reminders will show up here when you need them."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-24 pt-10 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="chip mb-3">Alerts</div>
        <h1 className="h-display text-4xl sm:text-5xl">Only what matters next.</h1>
        <p className="mt-2 max-w-xl text-ink/60">A simple view of what is due today, tomorrow, and soon after.</p>

        <div className="mt-8 space-y-4">
          {items.length ? items.map((item, index) => (
            <motion.div
              key={`${item.label}-${item.moment.id}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.35 }}
              className="neu p-5 sm:p-6"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-ink/50">
                    <span className="chip">{item.label}</span>
                    <span>{item.moment.occasion}</span>
                  </div>
                  <h2 className="font-display text-2xl sm:text-3xl">{item.text}</h2>
                  {item.moment.note && <p className="mt-2 text-sm leading-relaxed text-ink/60">{item.moment.note}</p>}
                </div>

                <div className="flex flex-col gap-2 sm:min-w-[11rem]">
                  <Link href="/wishes" className="btn-primary !px-3.5 !py-2 text-sm">
                    <Sparkles className="h-3.5 w-3.5" />
                    Write wish
                  </Link>
                  <button className="btn-ghost !px-3.5 !py-2 text-sm" onClick={() => void snoozeMoment(item.moment)}>
                    <AlarmClock className="h-3.5 w-3.5" />
                    Remind tomorrow
                  </button>
                  <button className="btn-ghost !px-3.5 !py-2 text-sm" onClick={() => void markDone(item.moment)}>
                    Mark done
                  </button>
                </div>
              </div>
            </motion.div>
          )) : (
            <div className="neu p-6 sm:p-8">
              <h2 className="h-display text-2xl sm:text-3xl">Nothing urgent right now.</h2>
              <p className="mt-3 text-ink/60">Once you add a few dates, your next reminders will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Shell({ title, body }: { title: string; body: string }) {
  return (
    <div className="px-4 pb-24 pt-10 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="neu p-6 sm:p-8">
          <h1 className="h-display text-3xl sm:text-4xl">{title}</h1>
          <p className="mt-3 text-ink/60">{body}</p>
        </div>
      </div>
    </div>
  );
}
