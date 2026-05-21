"use client";

import { motion } from "framer-motion";
import { ArrowRight, Bell, Heart, Sparkles } from "lucide-react";
import Link from "next/link";

const steps = [
  {
    title: "Keep the important dates close",
    body: "Add birthdays, anniversaries, milestones, and personal moments in one calm timeline.",
    icon: Heart,
  },
  {
    title: "Write something thoughtful quickly",
    body: "Generate a polished message when you need help finding the right words.",
    icon: Sparkles,
  },
  {
    title: "Get reminded at the right time",
    body: "See what is coming up and nudge it forward when life gets busy.",
    icon: Bell,
  },
];

export default function Landing() {
  return (
    <div className="pb-10">
      <section className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="glass rounded-[2.25rem] p-6 shadow-neu-sm sm:p-8"
        >
          <div className="chip mb-5">Personal memory, made simple</div>
          <h1 className="font-display text-4xl leading-[1.02] tracking-tight sm:text-6xl">
            Stay present for the people who matter.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink/65 sm:text-lg">
            NeverMiss keeps your important dates, thoughtful wishes, and gentle reminders together in one clean place.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/dashboard" className="btn-primary">
              Open dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/wishes" className="btn-ghost">
              Try wishes
            </Link>
          </div>
        </motion.div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((step, index) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: index * 0.05, duration: 0.45 }}
            className="neu p-5 sm:p-6"
          >
            <div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-surface shadow-neu-in">
              <step.icon className="h-5 w-5 text-[hsl(var(--accent))]" />
            </div>
            <h2 className="font-display text-2xl">{step.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink/60">{step.body}</p>
          </motion.div>
        ))}
      </section>
    </div>
  );
}
