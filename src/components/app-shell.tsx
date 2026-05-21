"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Heart, Home, LayoutDashboard, Settings, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import InstallCard from "./install-card";

const nav = [
  { href: "/", label: "Home", icon: Home },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/wishes", label: "Wishes", icon: Sparkles },
  { href: "/notifications", label: "Alerts", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, signInWithGoogle } = useAuth();

  return (
    <div className="min-h-screen bg-bg text-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-[calc(8.5rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] sm:max-w-3xl sm:px-6 lg:max-w-5xl lg:px-8">
        <header className="sticky top-[env(safe-area-inset-top)] z-40 mb-5">
          <div className="glass rounded-[2rem] px-4 py-3 shadow-neu-sm sm:px-5">
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/" className="flex min-w-0 items-center gap-3">
                <span className="relative grid h-11 w-11 place-items-center rounded-[1.25rem] bg-surface shadow-neu-sm">
                  <Heart className="h-5 w-5 fill-[hsl(var(--accent)/0.28)] text-[hsl(var(--accent))]" />
                  <span className="absolute inset-0 rounded-[1.25rem] shadow-glow-sm" />
                </span>
                <div className="min-w-0">
                  <div className="font-display text-2xl leading-none">NeverMiss</div>
                </div>
              </Link>

              <nav className="ml-auto hidden items-center gap-2 md:flex">
                {nav.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "rounded-[1.25rem] px-4 py-2 text-sm transition-all",
                        active ? "bg-surface text-ink shadow-neu-press" : "text-ink/60 hover:bg-surface hover:shadow-neu-sm",
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="ml-auto flex items-center gap-2 md:ml-0">
                {user ? (
                  <Link href="/settings" className="btn-ghost !px-3 !py-2 text-sm sm:!px-4">
                    Settings
                  </Link>
                ) : (
                  <button className="btn-primary !px-3 !py-2 text-sm sm:!px-4" onClick={() => void signInWithGoogle()}>
                    Sign in
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.main
            key={pathname}
            initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -8, filter: "blur(8px)" }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 pb-24"
          >
            {children}
          </motion.main>
        </AnimatePresence>

        <nav className="fixed bottom-3 inset-x-3 z-40 mx-auto w-auto max-w-md lg:hidden">
          <div className="glass mx-auto flex items-stretch gap-1 overflow-x-auto rounded-[2rem] px-2 py-2 shadow-[0_20px_60px_rgba(58,43,101,0.24)]">
            {nav.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex min-w-[4.45rem] flex-1 flex-col items-center justify-center gap-1 whitespace-nowrap rounded-[1.4rem] px-2 py-2 text-[10px] font-medium transition-all",
                    active ? "text-ink" : "text-ink/45",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-[1.4rem] bg-surface shadow-neu-press drop-shadow-[0_0_6px_hsl(var(--accent)/0.6)]"
                      transition={{ type: "spring", stiffness: 280, damping: 28 }}
                    />
                  )}
                  <item.icon className="relative h-4 w-4" />
                  <span className="relative">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <InstallCard />
      </div>
    </div>
  );
}
