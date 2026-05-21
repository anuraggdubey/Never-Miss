"use client";

import { Heart } from "lucide-react";
import { useAuth } from "../lib/auth";

export default function AuthPrompt({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="neu max-w-2xl p-6 sm:p-8">
      <div className="chip mb-4">
        <Heart className="w-3 h-3 text-[hsl(var(--accent))]" />
        Secure sync
      </div>
      <h2 className="h-display text-2xl sm:text-3xl">{title}</h2>
      <p className="mt-3 text-ink/65 max-w-xl">{body}</p>
      <button className="btn-primary mt-6 w-full sm:w-auto" onClick={() => void signInWithGoogle()}>
        Sign in with Google
      </button>
    </div>
  );
}
