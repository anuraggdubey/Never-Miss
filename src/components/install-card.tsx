"use client";

import { useEffect, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Heart, Sparkles, X } from "lucide-react";
import type { BeforeInstallPromptEvent } from "@/types/pwa";

export default function InstallCard() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      startTransition(() => setInstalled(true));
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome !== "accepted") {
      setDismissed(true);
      return;
    }
    setInstalled(true);
  }

  return (
    <AnimatePresence>
      {deferredPrompt && !dismissed && !installed && (
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.96 }}
          className="fixed inset-x-4 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-50 mx-auto max-w-sm"
        >
          <div className="relative overflow-hidden rounded-[2rem] border border-white/40 bg-white/65 p-5 shadow-[0_30px_80px_rgba(99,102,241,0.22)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(174,139,255,0.35),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(106,182,255,0.28),transparent_40%)]" />
            <button
              onClick={() => setDismissed(true)}
              className="absolute right-4 top-4 z-10 rounded-full p-2 text-ink/45 transition hover:bg-white/40 hover:text-ink"
              aria-label="Dismiss install prompt"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="relative">
              <div className="chip">
                <Heart className="h-3 w-3 text-[hsl(var(--accent))]" />
                Install NeverMiss
              </div>
              <h3 className="mt-4 font-display text-3xl leading-tight">Carry your memory layer on the home screen.</h3>
              <p className="mt-2 text-sm text-ink/65">
                Add NeverMiss to your home screen for quick access and a cleaner app-like experience.
              </p>
              <div className="mt-4 flex gap-2 text-xs text-ink/55">
                <span className="chip">Fast launch</span>
                <span className="chip">Standalone</span>
                <span className="chip">Reminders</span>
              </div>
              <button onClick={() => void install()} className="btn-primary mt-5 w-full justify-center">
                <Download className="h-4 w-4" />
                Add to Home Screen
              </button>
            </div>
          </div>
        </motion.div>
      )}
      {installed && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          className="fixed inset-x-6 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-50 mx-auto max-w-sm"
        >
          <div className="neu p-4 text-sm text-ink/70">
            <span className="inline-flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[hsl(var(--accent))]" />
              NeverMiss is installed. Launch it from your home screen anytime.
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
