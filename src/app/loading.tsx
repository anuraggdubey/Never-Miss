export default function Loading() {
  return (
    <div className="flex min-h-[80svh] items-center justify-center">
      <div className="relative w-full max-w-sm overflow-hidden rounded-[2.4rem] border border-white/40 bg-white/55 px-8 py-12 text-center shadow-[0_28px_80px_rgba(82,61,150,0.2)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(174,139,255,0.28),transparent_45%),radial-gradient(circle_at_bottom,rgba(106,182,255,0.22),transparent_45%)]" />
        <div className="relative">
          <div className="mx-auto h-20 w-20 animate-breathe rounded-[2rem] bg-surface shadow-neu grid place-items-center text-3xl">
            💛
          </div>
          <div className="mt-6 font-display text-4xl">NeverMiss</div>
          <p className="mt-2 text-sm text-ink/55">Gathering your reminders, warmth, and quiet little promises.</p>
          <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/60 shadow-neu-in">
            <div className="h-full w-1/2 animate-shimmer rounded-full bg-[linear-gradient(90deg,transparent,hsl(var(--accent)),transparent)] bg-[length:200%_100%]" />
          </div>
        </div>
      </div>
    </div>
  );
}
