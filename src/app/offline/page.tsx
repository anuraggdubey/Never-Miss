import Link from "next/link";
import { CloudOff, Heart } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="flex min-h-[70svh] items-center">
      <div className="neu w-full p-8">
        <div className="chip">
          <CloudOff className="h-3 w-3 text-[hsl(var(--accent))]" />
          Offline mode
        </div>
        <h1 className="mt-4 font-display text-4xl">Still holding the people who matter.</h1>
        <p className="mt-3 max-w-md text-sm text-ink/65">
          NeverMiss is temporarily offline. Your recent pages are still available, and everything will catch up once you reconnect.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/dashboard" className="btn-primary">
            <Heart className="h-4 w-4" />
            Open cached dashboard
          </Link>
          <Link href="/" className="btn-ghost">
            Return home
          </Link>
        </div>
      </div>
    </div>
  );
}
