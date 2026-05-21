"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, RefreshCcw, Sparkles } from "lucide-react";
import AuthPrompt from "../components/AuthPrompt";
import { useAuth } from "../lib/auth";
import { saveWishDraft, subscribeToMoments } from "../lib/firestore";
import type { Moment } from "../lib/models";

const tones = ["Warm", "Playful", "Elegant", "Short"] as const;
type Tone = (typeof tones)[number];

export default function WishGenerator() {
  const { user, loading } = useAuth();
  const [moments, setMoments] = useState<Moment[]>([]);
  const [selectedMomentId, setSelectedMomentId] = useState("");
  const [tone, setTone] = useState<Tone>("Warm");
  const [details, setDetails] = useState("");
  const [output, setOutput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    return subscribeToMoments(user.uid, (nextMoments) => {
      setMoments(nextMoments);
      if (!selectedMomentId && nextMoments[0]) {
        setSelectedMomentId(nextMoments[0].id);
      }
    });
  }, [selectedMomentId, user]);

  const person = useMemo(() => moments.find((moment) => moment.id === selectedMomentId) ?? moments[0], [moments, selectedMomentId]);

  async function generateWish(nextTone: Tone = tone) {
    if (!user || !person) return;

    setTone(nextTone);
    setGenerating(true);
    setError("");

    try {
      const response = await fetch("/api/wishes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: person.name,
          occasion: person.occasion,
          relation: person.relation ?? "",
          note: person.note ?? "",
          details,
          tone: nextTone,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Could not generate a wish right now.");
      }

      setOutput(data.message);
      await saveWishDraft(user.uid, {
        personName: person.name,
        tone: nextTone,
        occasion: person.occasion,
        details,
        message: data.message,
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Could not generate a wish right now.");
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return <Shell title="Loading..." body="Preparing your writing space." />;
  }

  if (!user) {
    return (
      <div className="px-4 pb-24 pt-10 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <AuthPrompt
            title="Sign in to write wishes."
            body="Your drafts will be ready whenever you come back."
          />
        </div>
      </div>
    );
  }

  if (!person) {
    return <Shell title="Add a date first." body="Create at least one entry on the dashboard before generating a message." />;
  }

  return (
    <div className="px-4 pb-24 pt-10 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="chip mb-3">Wishes</div>
        <h1 className="h-display text-4xl sm:text-5xl">Write something thoughtful.</h1>
        <p className="mt-2 max-w-2xl text-ink/60">Pick a person, choose a tone, and generate a message you can send right away.</p>

        <div className="mt-8 grid gap-6 md:grid-cols-[0.95fr_1.25fr]">
          <div className="neu space-y-5 p-5 sm:p-6">
            <div>
              <div className="mb-2 text-xs text-ink/50">For</div>
              <div className="grid grid-cols-2 gap-2">
                {moments.slice(0, 6).map((moment) => (
                  <button
                    key={moment.id}
                    onClick={() => setSelectedMomentId(moment.id)}
                    className={`rounded-2xl p-3 text-left transition-all ${
                      person.id === moment.id ? "bg-surface shadow-neu-press" : "bg-surface shadow-neu-sm hover:shadow-neu"
                    }`}
                  >
                    <div className="text-sm font-medium break-words">{moment.name}</div>
                    <div className="mt-1 text-[11px] capitalize text-ink/50">{moment.occasion}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-xs text-ink/50">Tone</div>
              <div className="flex flex-wrap gap-2">
                {tones.map((option) => (
                  <button
                    key={option}
                    onClick={() => setTone(option)}
                    className={`rounded-2xl px-3.5 py-2 text-sm transition-all ${
                      tone === option ? "bg-surface text-ink shadow-neu-press" : "bg-surface text-ink/70 shadow-neu-sm"
                    }`}
                  >
                    <span className="whitespace-nowrap">{option}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-xs text-ink/50">Optional detail</div>
              <textarea
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                placeholder="Anything personal you want included"
                className="h-28 w-full resize-none rounded-2xl bg-surface p-4 text-sm shadow-neu-in outline-none placeholder:text-ink/40 focus:shadow-neu-press"
              />
            </div>

            <button onClick={() => void generateWish()} className="btn-primary w-full" disabled={generating}>
              <Sparkles className="h-4 w-4" />
              {generating ? "Generating..." : "Generate wish"}
            </button>
          </div>

          <div className="relative overflow-hidden grain neu min-h-[320px] p-5 sm:min-h-[400px] sm:p-6">
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-aurora opacity-70 blur-3xl animate-float" />
            <div className="relative">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="chip">{tone} · {person.name}</div>
                <div className="flex gap-1.5">
                  <button onClick={() => void generateWish()} className="grid h-9 w-9 place-items-center rounded-2xl shadow-neu-sm transition hover:shadow-neu" disabled={generating}>
                    <RefreshCcw className={`h-4 w-4 ${generating ? "animate-spin" : ""}`} />
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(output);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1400);
                    }}
                    className="grid h-9 w-9 place-items-center rounded-2xl shadow-neu-sm transition hover:shadow-neu"
                    disabled={!output}
                  >
                    {copied ? <Check className="h-4 w-4 text-[hsl(var(--accent))]" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {generating ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mt-8 space-y-3"
                  >
                    {[0, 1, 2, 3].map((index) => (
                      <div
                        key={index}
                        className="h-4 animate-shimmer rounded-full bg-gradient-to-r from-transparent via-[hsl(var(--accent)/0.18)] to-transparent bg-[length:200%_100%]"
                        style={{ width: `${[92, 70, 88, 56][index]}%` }}
                      />
                    ))}
                  </motion.div>
                ) : output ? (
                  <motion.p
                    key={output}
                    initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0)" }}
                    transition={{ duration: 0.45 }}
                    className="mt-8 break-words font-display text-2xl leading-snug text-ink/85 sm:text-3xl"
                  >
                    {output}
                  </motion.p>
                ) : (
                  <motion.p
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-8 text-sm text-ink/55"
                  >
                    Your generated wish will appear here.
                  </motion.p>
                )}
              </AnimatePresence>

              {error && <p className="mt-6 text-sm text-[hsl(var(--warm))]">{error}</p>}
            </div>
          </div>
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
