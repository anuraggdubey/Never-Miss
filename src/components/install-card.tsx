"use client";

import { useEffect, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Sparkles, X } from "lucide-react";
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
          <div className="relative rounded-[2rem] border border-white/40 bg-white/80 p-5 shadow-neu-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/10">
            <button
              onClick={() => setDismissed(true)}
              className="absolute right-4 top-4 z-10 rounded-full p-2 text-ink/45 transition hover:bg-white/40 hover:text-ink"
              aria-label="Dismiss install prompt"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="pr-10 font-display text-2xl leading-tight">Install NeverMiss</h3>
            <p className="mt-2 text-sm text-ink/65">
              Add the app to your home screen for quicker access.
            </p>
            <button onClick={() => void install()} className="btn-primary mt-5 w-full justify-center">
              <Download className="h-4 w-4" />
              Add to Home Screen
            </button>
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
