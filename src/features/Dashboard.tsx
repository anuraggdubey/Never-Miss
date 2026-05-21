"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Cake, Gift, Heart, Plus, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import AuthPrompt from "../components/AuthPrompt";
import { useAuth } from "../lib/auth";
import { createMoment, subscribeToMoments } from "../lib/firestore";
import { daysUntil, relativeWhen } from "../lib/utils";
import type { Moment, Occasion } from "../lib/models";

const occasionIcon = { birthday: Cake, anniversary: Heart, milestone: Sparkles, memory: Gift } as const;

const defaultMoment = {
  name: "",
  occasion: "birthday" as Occasion,
  date: "",
  time: "",
  relation: "",
  note: "",
};

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [moments, setMoments] = useState<Moment[]>([]);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState(defaultMoment);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    return subscribeToMoments(user.uid, setMoments);
  }, [user]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return moments;
    return moments.filter((moment) =>
      [moment.name, moment.occasion, moment.relation, moment.note]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term)),
    );
  }, [moments, query]);

  const upcoming = filtered
    .filter((moment) => daysUntil(moment.date) >= 0)
    .sort((a, b) => daysUntil(a.date) - daysUntil(b.date));

  async function handleCreateMoment() {
    if (!user || !draft.name.trim() || !draft.date) return;

    setSaving(true);
    try {
      const momentId = await createMoment(user.uid, {
        name: draft.name.trim(),
        occasion: draft.occasion,
        date: draft.date,
        time: draft.time || undefined,
        relation: draft.relation.trim(),
        note: draft.note.trim(),
        yearsTracked: 1,
      });
      const idToken = await user.getIdToken();
      await fetch("/api/reminders/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ momentId }),
      });
      setDraft(defaultMoment);
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <PageState title="Loading..." body="Just a moment while your account is prepared." />;
  }

  if (!user) {
    return (
      <div className="px-4 pb-24 pt-10 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <AuthPrompt
            title="Sign in to start keeping track."
            body="Your dates and reminders will be available whenever you come back."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-24 pt-10 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="chip mb-3">Dashboard</div>
            <h1 className="h-display text-4xl sm:text-5xl">
              Keep it simple.
            </h1>
            <p className="mt-2 text-ink/60">Add a date, add a time when it matters, and let reminders do the rest.</p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:min-w-[18rem]">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search"
                className="w-full rounded-2xl bg-surface py-3 pl-10 pr-4 text-sm shadow-neu-in outline-none placeholder:text-ink/40 focus:shadow-neu-press"
              />
            </div>
            <button className="btn-primary !py-3" onClick={() => setShowForm((current) => !current)}>
              <Plus className="h-4 w-4" />
              Add entry
            </button>
          </div>
        </header>

        {showForm && (
          <div className="neu mb-6 grid gap-4 p-5 sm:p-6 md:grid-cols-2">
            <Field label="Name">
              <input className="field" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Aanya" />
            </Field>
            <Field label="Occasion">
              <select className="field" value={draft.occasion} onChange={(event) => setDraft({ ...draft, occasion: event.target.value as Occasion })}>
                <option value="birthday">Birthday</option>
                <option value="anniversary">Anniversary</option>
                <option value="milestone">Milestone</option>
                <option value="memory">Memory</option>
              </select>
            </Field>
            <Field label="Date">
              <input className="field" type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} />
            </Field>
            <Field label="Time (optional)">
              <input className="field" type="time" value={draft.time} onChange={(event) => setDraft({ ...draft, time: event.target.value })} />
            </Field>
            <Field label="Relation">
              <input className="field" value={draft.relation} onChange={(event) => setDraft({ ...draft, relation: event.target.value })} placeholder="Friend" />
            </Field>
            <Field label="Note">
              <textarea className="field min-h-28 resize-none" value={draft.note} onChange={(event) => setDraft({ ...draft, note: event.target.value })} placeholder="A short note" />
            </Field>
            <div className="md:col-span-2 rounded-2xl bg-surface/70 px-4 py-3 text-xs text-ink/55 shadow-neu-in">
              Add a time if you want exact reminders like 10 minutes before. Without a time, reminders default to the start of the day in your selected timezone.
            </div>
            <div className="flex flex-col gap-3 md:col-span-2 sm:flex-row">
              <button className="btn-primary" onClick={() => void handleCreateMoment()} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </button>
              <button className="btn-ghost" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        <section className="space-y-4">
          {upcoming.length ? upcoming.map((moment, index) => {
            const Icon = occasionIcon[moment.occasion];
            return (
              <motion.div
                key={moment.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.35 }}
                className="neu p-5 sm:p-6"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-ink/50">
                      <span className="chip">
                        <Icon className="h-3 w-3" />
                        {moment.occasion}
                      </span>
                      <span>{relativeWhen(moment.date)}{moment.time ? ` at ${moment.time}` : ""}</span>
                    </div>
                    <h2 className="font-display text-3xl break-words">{moment.name}</h2>
                    {(moment.relation || moment.note) && (
                      <p className="mt-2 break-words text-sm leading-relaxed text-ink/60">
                        {[moment.relation, moment.note].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href="/wishes" className="btn-primary !py-2.5">
                      <Sparkles className="h-4 w-4" />
                      Write wish
                    </Link>
                    <Link href="/notifications" className="btn-ghost !py-2.5">
                      View alerts
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          }) : (
            <PageState title="No entries yet." body="Add your first date to start building your timeline." />
          )}
        </section>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <div className="mb-2 text-xs text-ink/50">{label}</div>
      {children}
    </label>
  );
}

function PageState({ title, body }: { title: string; body: string }) {
  return (
    <div className="neu p-6 sm:p-8">
      <h2 className="h-display text-2xl sm:text-3xl">{title}</h2>
      <p className="mt-3 max-w-xl text-ink/60">{body}</p>
    </div>
  );
}
