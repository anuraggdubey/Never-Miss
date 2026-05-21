import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[65svh] items-center">
      <div className="neu w-full p-8">
        <div className="chip">Lost moment</div>
        <h1 className="mt-4 font-display text-4xl">This page drifted away.</h1>
        <p className="mt-3 text-sm text-ink/60">Let&apos;s bring you back to the dashboard and the people you actually meant to remember.</p>
        <Link href="/dashboard" className="btn-primary mt-5">
          Open dashboard
        </Link>
      </div>
    </div>
  );
}
