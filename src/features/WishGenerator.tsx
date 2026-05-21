"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, MessageCircle, RefreshCcw, Sparkles } from "lucide-react";
import AuthPrompt from "../components/AuthPrompt";
import { useAuth } from "../lib/auth";
import { saveWishDraft, subscribeToMoments } from "../lib/firestore";
import type { Moment } from "../lib/models";

const tones = ["Warm", "Playful", "Elegant", "Short"] as const;
type Tone = (typeof tones)[number];

function normalizePhoneNumber(value: string) {
  return value.replace(/[^\d]/g, "");
}

function buildWhatsAppLink(phone: string, message: string) {
  const normalizedPhone = normalizePhoneNumber(phone);
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message.trim())}`;
}

function formatWishError(message: string) {
  if (/unauthenticated/i.test(message) || /unauthorized/i.test(message)) {
    return "Wish generation is blocked because the server API key is not being accepted. Update the server key and try again.";
  }

  return message;
}

export default function WishGenerator() {
  const { user, loading } = useAuth();
  const [moments, setMoments] = useState<Moment[]>([]);
  const [selectedMomentId, setSelectedMomentId] = useState("");
  const [tone, setTone] = useState<Tone>("Warm");
  const [details, setDetails] = useState("");
  const [generatedWish, setGeneratedWish] = useState("");
  const [editableWish, setEditableWish] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [generating, setGenerating] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [whatsAppError, setWhatsAppError] = useState("");

  useEffect(() => {
    if (!user) return;
    return subscribeToMoments(user.uid, (nextMoments) => {
      setMoments(nextMoments);
      if (!selectedMomentId && nextMoments[0]) {
        setSelectedMomentId(nextMoments[0].id);
      }
    });
  }, [selectedMomentId, user]);

  const person = useMemo(
    () => moments.find((moment) => moment.id === selectedMomentId) ?? moments[0],
    [moments, selectedMomentId],
  );

  const cleanedPhone = useMemo(() => normalizePhoneNumber(phoneNumber), [phoneNumber]);
  const canOpenWhatsApp = editableWish.trim().length > 0 && cleanedPhone.length >= 8;

  function startManualDraft() {
    setGeneratedWish("");
    setError("");
    setWhatsAppError("");
    setEditableWish((current) => {
      if (current.trim()) return current;

      return `Hi ${person.name},\n\nHappy ${person.occasion}.\n\n`;
    });
  }

  async function saveCurrentDraft() {
    if (!user || !person || !editableWish.trim()) return;

    setSavingDraft(true);
    setError("");
    try {
      await saveWishDraft(user.uid, {
        personName: person.name,
        tone,
        occasion: person.occasion,
        details,
        message: editableWish.trim(),
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Could not save your draft right now.");
    } finally {
      setSavingDraft(false);
    }
  }

  async function generateWish(nextTone: Tone = tone) {
    if (!user || !person) return;

    setTone(nextTone);
    setGenerating(true);
    setError("");
    setWhatsAppError("");

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

      setGeneratedWish(data.message);
      setEditableWish(data.message);
      setPhoneNumber("");

      await saveWishDraft(user.uid, {
        personName: person.name,
        tone: nextTone,
        occasion: person.occasion,
        details,
        message: data.message,
      });
    } catch (nextError) {
      setError(formatWishError(nextError instanceof Error ? nextError.message : "Could not generate a wish right now."));
    } finally {
      setGenerating(false);
    }
  }

  function openWhatsApp() {
    const message = editableWish.trim();
    if (!message) {
      setWhatsAppError("Finalize the wish text before opening WhatsApp.");
      return;
    }

    if (cleanedPhone.length < 8) {
      setWhatsAppError("Enter a valid phone number with country code.");
      return;
    }

    setWhatsAppError("");
    window.open(buildWhatsAppLink(cleanedPhone, message), "_blank", "noopener,noreferrer");
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
    <div className="px-4 pb-24 pt-8 sm:px-8 sm:pt-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="h-display text-4xl sm:text-5xl">Wishes</h1>
        <p className="mt-2 text-ink/60">Choose a person, generate a draft, edit it, then send it.</p>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] xl:gap-8">
          <section className="space-y-6">
            <div className="neu space-y-5 p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl">Set up the draft</h2>
                </div>
                <div className="text-sm text-ink/50">{moments.length} saved</div>
              </div>

              <div>
                <div className="mb-2 text-xs text-ink/50">For</div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {moments.slice(0, 6).map((moment) => {
                    const active = person.id === moment.id;
                    return (
                      <button
                        key={moment.id}
                        onClick={() => setSelectedMomentId(moment.id)}
                        className={`rounded-[1.55rem] p-3.5 text-left transition-all ${
                          active
                            ? "bg-white/70 shadow-neu-press dark:bg-white/10"
                            : "bg-surface shadow-neu-sm hover:shadow-neu"
                        }`}
                      >
                        <div className="text-sm font-medium break-words">{moment.name}</div>
                        <div className="mt-1 text-[11px] capitalize text-ink/50">{moment.occasion}</div>
                        {(moment.relation || moment.date) && (
                          <div className="mt-3 text-[11px] text-ink/40">
                            {[moment.relation, moment.date].filter(Boolean).join(" - ")}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="mb-2 text-xs text-ink/50">Tone</div>
                <div className="flex flex-wrap gap-2">
                  {tones.map((option) => (
                    <button
                      key={option}
                      onClick={() => setTone(option)}
                      className={`rounded-full px-4 py-2 text-sm transition-all ${
                        tone === option
                          ? "bg-white/80 text-ink shadow-neu-press dark:bg-white/10"
                          : "bg-surface text-ink/70 shadow-neu-sm"
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
                  placeholder="Add one personal memory, a nickname, or something you want included."
                  className="field min-h-32 resize-none leading-6"
                />
              </div>

              <button onClick={() => void generateWish()} className="btn-primary w-full sm:w-auto" disabled={generating}>
                <Sparkles className="h-4 w-4" />
                {generating ? "Generating..." : "Generate wish"}
              </button>
              <button onClick={startManualDraft} className="btn-ghost w-full sm:w-auto" type="button">
                Write manually
              </button>
            </div>
          </section>

          <section className="space-y-6">
            <div className="neu p-5 sm:p-6">
              <div className="flex flex-col gap-4 border-b border-white/30 pb-5 dark:border-white/10 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-sm text-ink/50">{tone} tone</div>
                  <h2 className="mt-2 font-display text-3xl leading-tight sm:text-4xl">
                    Finalize the message
                  </h2>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => void generateWish()}
                    className="grid h-10 w-10 place-items-center rounded-2xl bg-surface shadow-neu-sm transition hover:shadow-neu"
                    disabled={generating}
                    aria-label="Regenerate wish"
                  >
                    <RefreshCcw className={`h-4 w-4 ${generating ? "animate-spin" : ""}`} />
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(editableWish);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1400);
                      }}
                      className="grid h-10 w-10 place-items-center rounded-2xl bg-surface shadow-neu-sm transition hover:shadow-neu"
                      disabled={!editableWish.trim()}
                      aria-label="Copy wish"
                    >
                      {copied ? <Check className="h-4 w-4 text-[hsl(var(--accent))]" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {generating ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mt-6 space-y-3"
                  >
                    {[0, 1, 2, 3, 4].map((index) => (
                      <div
                        key={index}
                        className="h-4 animate-shimmer rounded-full bg-gradient-to-r from-transparent via-[hsl(var(--accent)/0.18)] to-transparent bg-[length:200%_100%]"
                        style={{ width: `${[92, 74, 88, 69, 54][index]}%` }}
                      />
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key={generatedWish || "empty"}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 space-y-5"
                  >
                    {generatedWish && (
                      <div className="rounded-2xl bg-surface px-4 py-4 text-sm leading-6 text-ink/68 shadow-neu-in">
                        {generatedWish}
                      </div>
                    )}

                    <div>
                      <label className="mb-2 block text-xs text-ink/50">Edit the message</label>
                      <textarea
                        value={editableWish}
                        onChange={(event) => setEditableWish(event.target.value)}
                        placeholder="Generate a wish and refine it here before sending."
                        className="field min-h-[220px] resize-none bg-white/60 text-base leading-7 dark:bg-white/[0.06] sm:min-h-[260px]"
                      />
                    </div>

                    <div className="rounded-2xl bg-surface px-4 py-4 shadow-neu-in">
                      <label className="mb-2 block text-xs text-ink/50">WhatsApp phone number</label>
                      <input
                        value={phoneNumber}
                        onChange={(event) => setPhoneNumber(event.target.value)}
                        inputMode="tel"
                        placeholder="91XXXXXXXXXX"
                        className="field bg-white/60 dark:bg-white/[0.06]"
                      />
                      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs leading-5 text-ink/45">Include the country code.</p>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <button
                            onClick={() => void saveCurrentDraft()}
                            className="btn-ghost w-full sm:w-auto"
                            disabled={!editableWish.trim() || savingDraft}
                            type="button"
                          >
                            {savingDraft ? "Saving..." : "Save draft"}
                          </button>
                          <button
                            onClick={openWhatsApp}
                            className="btn-primary w-full sm:w-auto"
                            disabled={!canOpenWhatsApp}
                          >
                            <MessageCircle className="h-4 w-4" />
                            Open WhatsApp
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {!generating && !generatedWish && (
                <div className="mt-6 text-sm text-ink/50">
                  Choose a person and tone, then generate a draft or write one yourself.
                </div>
              )}

              {(error || whatsAppError) && (
                <p className="mt-6 text-sm text-[hsl(var(--warm))]">{error || whatsAppError}</p>
              )}
            </div>
          </section>
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
