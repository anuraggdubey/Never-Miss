"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, Sparkles } from "lucide-react";
import Link from "next/link";
import AuthPrompt from "../components/AuthPrompt";
import { useAuth } from "../lib/auth";
import { defaultSettings, type Moment, type UserSettings } from "../lib/models";
import { subscribeToMoments, subscribeToSettings } from "../lib/firestore";
import { formatCountdown, formatDate, getNextAlertTime, getNextOccurrenceIso, getUtcDateForLocal, relativeWhen } from "../lib/utils";

type AlertItem = {
  moment: Moment;
  eventTime: number;
  nextAlertTime: number | null;
};

export default function Notifications() {
  const { user, loading } = useAuth();
  const [moments, setMoments] = useState<Moment[]>([]);
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [selectedMomentId, setSelectedMomentId] = useState("");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!user) return;
    return subscribeToMoments(user.uid, setMoments);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    return subscribeToSettings(user.uid, setSettings);
  }, [user]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const items = useMemo(() => moments
    .map((moment) => ({
      moment,
      eventTime: getUtcDateForLocal(moment.date, moment.time, settings.timezone).getTime(),
      nextAlertTime: getNextAlertTime(
        moment.date,
        moment.time,
        settings.notificationRhythm,
        settings.timezone,
        moment.alertDate,
        moment.alertTime,
      ),
    }))
    .sort((a, b) => a.eventTime - b.eventTime), [moments, settings]);

  useEffect(() => {
    if (!selectedMomentId && items[0]) {
      setSelectedMomentId(items[0].moment.id);
      return;
    }

    if (selectedMomentId && !items.some((item) => item.moment.id === selectedMomentId)) {
      setSelectedMomentId(items[0]?.moment.id ?? "");
    }
  }, [items, selectedMomentId]);

  const nextAlert = items
    .filter((item) => item.nextAlertTime !== null)
    .sort((a, b) => (a.nextAlertTime ?? Number.MAX_SAFE_INTEGER) - (b.nextAlertTime ?? Number.MAX_SAFE_INTEGER))[0];

  const nextEvent = items
    .filter((item) => item.eventTime >= now)
    .sort((a, b) => a.eventTime - b.eventTime)[0];

  const selected = items.find((item) => item.moment.id === selectedMomentId) ?? items[0];

  if (loading) {
    return <Shell title="Loading..." body="Getting your alerts ready." />;
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

  if (!items.length) {
    return <Shell title="No alerts yet." body="Add a few entries and the next reminder will show here." />;
  }

  return (
    <div className="px-4 pb-24 pt-10 sm:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="h-display text-4xl sm:text-5xl">Alerts</h1>
          <p className="mt-2 text-ink/60">See what is next, how long is left, and when each event is due.</p>
        </div>

        <section className="grid gap-4 md:grid-cols-2">
          <SummaryCard
            icon={Bell}
            title="Next alert"
            primary={nextAlert ? `${nextAlert.moment.name} in ${formatCountdown(nextAlert.nextAlertTime!, now)}` : "No alert pending"}
            secondary={nextAlert ? `${capitalize(nextAlert.moment.occasion)} reminder` : "Add a custom alert time or adjust reminder timing in settings."}
          />
          <SummaryCard
            icon={Bell}
            title="Next event"
            primary={nextEvent ? `${nextEvent.moment.name} in ${formatCountdown(nextEvent.eventTime, now)}` : "No upcoming event"}
            secondary={nextEvent ? `${capitalize(nextEvent.moment.occasion)} ${relativeWhen(nextEvent.moment.date).toLowerCase()}` : "Past entries stay visible below."}
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="neu p-4 sm:p-5">
            <div className="mb-3 text-sm font-medium text-ink/70">All entries</div>
            <div className="space-y-2">
              {items.map((item) => {
                const isActive = item.moment.id === selected?.moment.id;
                return (
                  <button
                    key={item.moment.id}
                    onClick={() => setSelectedMomentId(item.moment.id)}
                    className={`w-full rounded-2xl px-4 py-3 text-left transition ${
                      isActive ? "bg-surface shadow-neu-press" : "bg-transparent hover:bg-surface/70"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium break-words">{item.moment.name}</div>
                        <div className="mt-1 text-sm text-ink/55">
                          {capitalize(item.moment.occasion)} • {relativeWhen(item.moment.date)}
                        </div>
                      </div>
                      <div className="shrink-0 text-xs text-ink/50">
                        {item.eventTime > now ? formatCountdown(item.eventTime, now) : "passed"}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {selected && (
            <div className="neu p-5 sm:p-6">
              <div className="flex flex-col gap-5">
                <div>
                  <div className="text-sm text-ink/50">{capitalize(selected.moment.occasion)}</div>
                  <h2 className="mt-1 font-display text-3xl">{selected.moment.name}</h2>
                  <p className="mt-2 text-sm text-ink/60">
                    {selected.moment.relation || "Saved entry"} • next on {formatDate(getNextOccurrenceIso(selected.moment.date, settings.timezone))}{selected.moment.time ? ` at ${selected.moment.time}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-ink/45">Original saved date: {selected.moment.date}</p>
                  {selected.moment.alertDate && selected.moment.alertTime ? (
                    <p className="mt-1 text-xs text-ink/45">Custom alert: {selected.moment.alertDate} at {selected.moment.alertTime}</p>
                  ) : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Metric label="Time left for event" value={selected.eventTime > now ? formatCountdown(selected.eventTime, now) : "passed"} />
                  <Metric
                    label="Time left for next alert"
                    value={selected.nextAlertTime ? formatCountdown(selected.nextAlertTime, now) : "none pending"}
                  />
                </div>

                <div className="rounded-2xl bg-surface px-4 py-4 text-sm text-ink/68 shadow-neu-in">
                  <div>{selected.eventTime > now ? `${selected.moment.name}'s ${selected.moment.occasion} is ${relativeWhen(selected.moment.date).toLowerCase()}.` : `${selected.moment.name}'s ${selected.moment.occasion} has already passed.`}</div>
                  <div className="mt-2">
                    {selected.nextAlertTime
                      ? `Next alert is due in ${formatCountdown(selected.nextAlertTime, now)}.`
                      : "There is no future alert pending for this entry with the current reminder timing."}
                  </div>
                  {selected.moment.note && <div className="mt-2 text-ink/55">{selected.moment.note}</div>}
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Link href="/wishes" className="btn-primary">
                    <Sparkles className="h-4 w-4" />
                    Write wish
                  </Link>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  title,
  primary,
  secondary,
}: {
  icon: typeof Bell;
  title: string;
  primary: string;
  secondary: string;
}) {
  return (
    <div className="neu p-5 sm:p-6">
      <div className="flex items-center gap-2 text-sm text-ink/55">
        <Icon className="h-4 w-4" />
        {title}
      </div>
      <div className="mt-3 font-display text-2xl leading-tight">{primary}</div>
      <div className="mt-2 text-sm text-ink/60">{secondary}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface px-4 py-4 shadow-neu-in">
      <div className="text-xs uppercase tracking-[0.14em] text-ink/45">{label}</div>
      <div className="mt-2 text-xl font-medium text-ink">{value}</div>
    </div>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
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
